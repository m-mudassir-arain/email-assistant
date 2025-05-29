// backend/server.js
import express from 'express';
import cors from 'cors';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';
import generateReply from './geminiService.js'; // Gemini API function

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Utility to open inbox
function openInbox(imap) {
  return new Promise((resolve, reject) => {
    imap.openBox('INBOX', true, (err, box) => {
      if (err) reject(err);
      else resolve(box);
    });
  });
}

// Route to fetch latest 10 emails
app.get('/emails', async (req, res) => {
  const imap = new Imap({
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    host: process.env.EMAIL_HOST || 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });

  const emails = [];

  imap.once('ready', async () => {
    try {
      const box = await openInbox(imap);

      if (!box || box.messages.total === 0) {
        imap.end();
        return res.json([]);
      }

      const from = Math.max(1, box.messages.total - 9);
      const fetcher = imap.seq.fetch(`${from}:${box.messages.total}`, {
        bodies: '',
        struct: true,
      });

      const parsePromises = [];

      fetcher.on('message', (msg) => {
        msg.on('body', (stream) => {
          const parsed = simpleParser(stream)
            .then((mail) => {
              emails.push({
                subject: mail.subject || '(No Subject)',
                from: mail.from?.text || 'Unknown Sender',
                date: mail.date,
                text: mail.text || '',
              });
            })
            .catch((err) => {
              console.error('❌ Parse error:', err);
            });

          parsePromises.push(parsed);
        });
      });

      fetcher.once('error', (err) => {
        console.error('❌ Fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch emails' });
      });

      fetcher.once('end', async () => {
        await Promise.all(parsePromises); // Wait for all parsing to finish
        imap.end();
        res.json(emails.reverse()); // Show latest first
      });
    } catch (err) {
      console.error('❌ Inbox error:', err);
      imap.end();
      res.status(500).json({ error: 'Failed to open inbox' });
    }
  });

  imap.once('error', (err) => {
    console.error('❌ IMAP connection error:', err);
    res.status(500).json({ error: 'IMAP connection error' });
  });

  imap.once('end', () => {
    console.log('✅ IMAP connection closed');
  });

  imap.connect();
});

// Route to generate AI reply using Gemini
app.post('/generate-reply', async (req, res) => {
  const { email, tone } = req.body;

  const prompt = `
You are an AI assistant. Write a ${tone} reply to the following email:

Subject: ${email.subject}
From: ${email.from}
Body: ${email.text}
`;

  try {
    const reply = await generateReply(prompt);
    res.json({ reply });
  } catch (err) {
    console.error('❌ Gemini Error:', err.message);
    res.status(500).json({ error: 'Failed to generate reply' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ IMAP server running on port ${PORT}`));
