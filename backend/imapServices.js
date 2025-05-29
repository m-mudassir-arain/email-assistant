// backend/imapServices.js
import Imap from 'imap';
import { simpleParser } from 'mailparser';

function fetchEmails() {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: 'aiassistantdemo@gmail.com',
      password: 'qhdrvueltapwvexa',
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    function openInbox(cb) {
      imap.openBox('INBOX', true, cb);
    }

    imap.once('ready', () => {
      console.log('📬 IMAP Ready');

      openInbox((err, box) => {
        if (err) {
          console.error('❌ Error opening inbox:', err);
          return reject(err);
        }

        console.log('📂 Inbox opened, total messages:', box.messages.total);

        if (!box || box.messages.total === 0) {
          imap.end();
          return resolve([]);
        }

        const from = Math.max(1, box.messages.total - 9);
        const f = imap.seq.fetch(`${from}:${box.messages.total}`, {
          bodies: '',
          struct: true,
        });

        const emails = [];
        const parsePromises = [];

        f.on('message', (msg) => {
          console.log('📥 New message being parsed');

          msg.on('body', (stream) => {
            const parsePromise = simpleParser(stream)
              .then((parsed) => {
                console.log('✅ Parsed From:', parsed.from);
                console.log('✅ Subject:', parsed.subject);

                let sender = 'Unknown Sender';
                if (parsed.from?.value?.length) {
                  const senderObj = parsed.from.value[0];
                  sender = senderObj.name?.trim() || senderObj.address || 'Unknown Sender';
                }

                emails.push({
                  id: parsed.messageId,
                  sender,
                  subject: parsed.subject || '(No Subject)',
                  snippet: parsed.text ? parsed.text.substring(0, 80) : '',
                  body: parsed.html || parsed.text || '',
                });
              })
              .catch((err) => {
                console.error('❌ Parse error:', err);
              });

            parsePromises.push(parsePromise);
          });
        });

        f.once('error', (fetchErr) => {
          console.error('❌ Fetch error:', fetchErr);
          reject(fetchErr);
        });

        f.once('end', () => {
          console.log('⏳ Finished fetching all messages, waiting for parsing...');
          Promise.all(parsePromises)
            .then(() => {
              imap.end();
              console.log('✅ All emails parsed. Total:', emails.length);
              resolve(emails.reverse());
            })
            .catch((err) => {
              imap.end();
              reject(err);
            });
        });
      });
    });

    imap.once('error', (err) => {
      console.error('❌ IMAP connection error:', err);
      reject(err);
    });

    imap.once('end', () => {
      console.log('✅ IMAP connection closed');
    });

    imap.connect();
  });
}

export default { fetchEmails };
