import { useState, useEffect, useMemo } from 'react';
import { Search, Mail, Send, User, Clock, ChevronRight, Copy, Check, Menu, X } from 'lucide-react';

function App() {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [tone, setTone] = useState('Formal');
  const [searchQuery, setSearchQuery] = useState('');
  const [generatedReply, setGeneratedReply] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Your original API call functionality preserved
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
        // Sort emails by date - newest first
        const sortedEmails = data.sort((a, b) => {
          const dateA = new Date(a.date || 0);
          const dateB = new Date(b.date || 0);
          return dateB - dateA; // Descending order (newest first)
        });
        
        setEmails(sortedEmails);
        if (!selectedEmail && sortedEmails.length > 0) {
          setSelectedEmail(sortedEmails[0]);
        }
      })
      .catch((err) => console.error('Error fetching emails:', err.message));
  }, [selectedEmail]);

  // Updated filteredEmails with proper sorting and memoization
  const filteredEmails = useMemo(() => {
    let filtered = emails.filter(
      (email) =>
        email?.from?.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email?.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email?.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email?.body?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort filtered emails by date - newest first
    filtered.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA; // Descending order (newest first)
    });

    return filtered;
  }, [emails, searchQuery]);

  // Your original generate reply functionality preserved
  const handleGenerate = async () => {
    if (!selectedEmail) {
      console.error('No email selected');
      return;
    }

    const subject = selectedEmail.subject || '';
    const text = selectedEmail.text || selectedEmail.body || '';

    if (!subject || !text) {
      console.error('Selected email is missing subject or text.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:3001/generate-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: { subject, text },
          tone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedReply(data.reply);
      } else {
        console.error('Error generating reply:', data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Request failed:', error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!generatedReply) return;
    
    try {
      await navigator.clipboard.writeText(generatedReply);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generatedReply;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const getToneColor = (selectedTone) => {
    const colors = {
      'Formal': 'bg-blue-100 text-blue-800 border-blue-200',
      'Friendly': 'bg-green-100 text-green-800 border-green-200',
      'Apologetic': 'bg-orange-100 text-orange-800 border-orange-200',
      'Thankful': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[selectedTone] || colors['Formal'];
  };

  const handleEmailSelect = (email) => {
    setSelectedEmail(email);
    setGeneratedReply('');
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  // Helper function to format date and time more elegantly
  const formatEmailDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}h ago`;
    } else if (diffInDays < 7) {
      const days = Math.floor(diffInDays);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      <div className="h-screen max-w-screen-2xl mx-auto bg-white/90 backdrop-blur-sm shadow-2xl border border-white/20 overflow-hidden flex">
        
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-20"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar - Enhanced Width and Visibility */}
        <div className={`
          w-full sm:w-96 lg:w-[400px] xl:w-[450px] bg-white border-r border-slate-200 flex flex-col
          fixed lg:relative h-full z-30 transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Header */}
          <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3 mb-2 mt-8 lg:mt-0">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Email Assistant
                </h1>
                <p className="text-slate-600 text-sm">AI-powered email management</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200 hover:shadow-md text-base"
              />
            </div>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto">
            {filteredEmails.length > 0 ? (
              filteredEmails.map((email, index) => (
                <div
                  key={email.id || index}
                  onClick={() => handleEmailSelect(email)}
                  className={`group p-4 cursor-pointer transition-all duration-200 border-b border-slate-100 hover:bg-slate-50 ${
                    selectedEmail?.id === email.id
                      ? 'bg-blue-50 border-l-4 border-l-blue-500'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-slate-800 truncate">
                          {email?.from?.text || email?.from || email?.sender || 'Unknown Sender'}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-900 font-medium mb-2 line-clamp-2">
                        {email.subject}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                        {(email.text || email.body || '').substring(0, 80)}...
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatEmailDate(email.date)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
                      selectedEmail?.id === email.id ? 'rotate-90 text-blue-500' : 'group-hover:translate-x-1'
                    }`} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No emails found</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Enhanced Width and Layout */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-white to-slate-50 min-w-0">
          {/* Main Email Content */}
          <div className="flex-1 p-6 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="mb-6 mt-16 lg:mt-0">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Inbox</h2>
              <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
            </div>

            {selectedEmail ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg flex-1 overflow-hidden flex flex-col">
                {/* Email Header */}
                <div className="border-b border-slate-100 p-6 flex-shrink-0">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-800 text-lg">
                        {selectedEmail?.from?.text || selectedEmail?.from || selectedEmail.sender || 'Unknown Sender'}
                      </h3>
                      <p className="text-slate-500 text-sm">
                        {selectedEmail.date ? new Date(selectedEmail.date).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>
                  <h4 className="font-semibold text-slate-800 text-xl">
                    {selectedEmail.subject}
                  </h4>
                </div>

                {/* Email Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                    <pre className="whitespace-pre-wrap text-slate-700 font-normal text-base leading-relaxed">
                      {selectedEmail.text || selectedEmail.body}
                    </pre>
                  </div>

                  {/* Generated Reply */}
                  {generatedReply && (
                    <div className="mt-8">
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <h4 className="font-semibold text-slate-800 text-lg">AI-Generated Reply</h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getToneColor(tone)}`}>
                          {tone}
                        </span>
                        <button
                          onClick={handleCopyToClipboard}
                          className="ml-auto p-2 rounded-lg hover:bg-slate-100 transition-colors group flex items-center gap-2"
                          title="Copy to clipboard"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-5 h-5 text-green-600" />
                              <span className="text-sm text-green-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
                              <span className="text-sm text-slate-500 group-hover:text-slate-700">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                        <pre className="whitespace-pre-wrap text-slate-700 font-normal text-base leading-relaxed">
                          {generatedReply}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-xl">Select an email to view</p>
                </div>
              </div>
            )}
          </div>

          {/* Reply Generation Panel */}
          <div className="border-t border-slate-200 bg-white p-6 flex-shrink-0">
            <div className="max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <Send className="w-6 h-6 text-blue-600" />
                  Generate Reply
                </h3>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Response Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:shadow-md"
                  >
                    <option>Formal</option>
                    <option>Friendly</option>
                    <option>Apologetic</option>
                    <option>Thankful</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={handleGenerate}
                    disabled={!selectedEmail || isGenerating}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3 text-base min-w-max"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Generate Reply
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;