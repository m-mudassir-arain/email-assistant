import { GoogleGenerativeAI } from '@google/generative-ai';

// Use your API key here
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateReply(email, tone) {
  const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyDokSFwO4v1hDmud_-qPwBKSc1N502qm4I';
  const subject = email?.subject || '';
  const body = email?.text || email?.body || '';
  const safeTone = (tone || 'neutral').toLowerCase();

  if (!subject || !body) {
    throw new Error('Email subject or body is missing.');
  }

 const prompt = `
You are a smart and professional **AI Email Assistant**.

Based on the following **email subject** and **email body**, generate a well-formatted, polite, and context-aware reply. Ensure the reply is clear, human-like, and uses markdown formatting where appropriate (e.g., bold for key phrases or names). The tone should be **${safeTone}**.

**Email Subject:**  
${subject}

**Email Body:**  
${body}

📩 Now, write a professional email reply:
- Start with a suitable greeting.
- Respond directly to the email content.
- Maintain the specified tone (**${safeTone}**).
- Use **bold** to highlight key information (names, dates, requests, etc.).
- Conclude professionally with a closing line and signature.
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error response:', data);
      throw new Error(data.error?.message || 'Failed to generate reply');
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return replyText;
  } catch (error) {
    console.error('Gemini Error:', error.message);
    throw new Error('Failed to generate reply');
  }
}

