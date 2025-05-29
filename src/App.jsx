import './App.css';
import { useState, useEffect } from 'react';

function App() {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [tone, setTone] = useState('Formal');
  const [searchQuery, setSearchQuery] = useState('');
  const [generatedReply, setGeneratedReply] = useState('');

  useEffect(() => {
    fetch('http://localhost:3001/emails')
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }
        return res.json();
      })
      .then((data) => {
        const sortedEmails = data.reverse();
        setEmails(sortedEmails);
        if (!selectedEmail && sortedEmails.length > 0) {
          setSelectedEmail(sortedEmails[0]);
        }
      })
      .catch((err) => console.error('Error fetching emails:', err.message));
  }, [selectedEmail]);

  const filteredEmails = emails.filter(
    (email) =>
      email?.from?.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email?.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerate = async () => {
    if (!selectedEmail) return;

    try {
      const res = await fetch('http://localhost:3001/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedEmail, tone }),
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedReply(data.reply); // Show below email content
      } else {
        console.error('Error generating reply:', data.error);
      }
    } catch (error) {
      console.error('Request failed:', error.message);
    }
  };

  return (
    <div className="h-screen bg-gray-400 overflow-x-hidden flex justify-center items-center">
      <div className="max-w-[100%] h-screen w-full mx-auto bg-white shadow-lg overflow-hidden flex">

        {/* Sidebar */}
        <div className="w-1/3 bg-gray-50 border-l p-4 flex flex-col">
          <h2 className="text-7xl font-bold mb-4">Email Assistant</h2>

          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <div className="flex flex-col gap-2 overflow-y-auto h-full pr-2">
            {filteredEmails.length > 0 ? (
              filteredEmails.map((email, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedEmail(email);
                    setGeneratedReply(''); // clear previous reply
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedEmail?.id === email.id
                      ? 'bg-blue-100 text-blue-900'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <h4 className="font-bold text-base">
                    {email?.from?.text || email?.from?.[0]?.name || email?.from?.[0]?.address || 'Unknown Sender'}
                  </h4>
                  <p className="text-sm text-gray-700">{email.subject}</p>
                  <p className="text-xs text-gray-500">
                    {email.date ? new Date(email.date).toLocaleString() : ''}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No emails found.</p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="w-2/3 p-6 flex flex-col">
          <h2 className="text-2xl font-semibold mb-4">Inbox</h2>

          {selectedEmail ? (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border flex-1">
              <h3 className="font-bold">{selectedEmail?.from?.text || selectedEmail.sender}</h3>
              <p className="font-medium text-gray-700">{selectedEmail.subject}</p>
              <pre className="mt-4 whitespace-pre-wrap text-gray-800">
                {selectedEmail.text || selectedEmail.body}
              </pre>
              {generatedReply && (
                <div className="mt-6 border-t pt-4">
                  <h4 className="font-semibold text-blue-800">AI-Generated Reply:</h4>
                  <pre className="mt-2 text-gray-700 whitespace-pre-wrap">{generatedReply}</pre>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Select an email to view.</p>
          )}

          <div className="flex justify-start items-center">
            <h3 className="text-lg font-semibold mr-2">Generate Reply</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="border rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option>Formal</option>
                <option>Friendly</option>
                <option>Apologetic</option>
                <option>Thankful</option>
              </select>
              <button
                onClick={handleGenerate}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Generate
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
