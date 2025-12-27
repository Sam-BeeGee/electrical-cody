import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'markdown-to-jsx';
import { assistants } from './assistants';
import Verification from './components/Verification.jsx';

// --- Helper Components ---

// Icon for the send button
const SendIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
        <path d="M3.4 20.4L20.85 12.02L3.4 3.6V10.1L17.2 12L3.4 13.9V20.4Z" fill="currentColor"/>
    </svg>
);

// Updated icon for the user, "Apprentice"
const UserIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 12C4 7.58172 7.58172 4 12 4H20V8H12C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16H18V20H12C7.58172 20 4 16.4183 4 12Z" fill="currentColor" opacity="0.6" />
    </svg>
);

// Custom icon for the new chat button
const NewChatIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
        <path d="M19.65 8.35A9.003 9.003 0 0 0 12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 8L9 12H12L11 16L15 11H12L12 8Z" fill="currentColor"/>
        <path d="M17 2L21 6L17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// --- New Header Component ---
const Header = ({ assistant, onToggleSidebar }) => (
    <header className="flex items-center p-4 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
        <button
            onClick={onToggleSidebar}
            className="md:hidden mr-3 p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Toggle sidebar"
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </button>
        <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <assistant.Icon />
             </div>
            <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">{assistant.name}</h1>
                <p className="text-sm text-gray-500 leading-tight">{assistant.title}</p>
            </div>
        </div>
        <div className="ml-auto">
             {/* Placeholder for future actions */}
        </div>
    </header>
);

// --- Main Components ---

// Main chat interface
const ChatInterface = ({ onNewChat, assistant }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);
    const BotIcon = assistant.Icon;

    // Effect to add initial welcome message from the selected assistant
    useEffect(() => {
        setMessages([
            {
                text: `Hello! I'm ${assistant.name}, your virtual ${assistant.title.toLowerCase()}. How can I help you today?`,
                isUser: false
            }
        ]);
    }, [assistant]);

    // Effect to scroll to the bottom of the chat on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage = { text: input, isUser: true };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // --- AI Integration with Auto-Topic Detection ---
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                throw new Error("API key is missing. Please make sure you have set up the VITE_GEMINI_API_KEY environment variable in your Vercel project settings.");
            }

            const systemPrompt = assistant.systemPrompt;

            let chatHistory = [{ role: "user", parts: [{ text: systemPrompt + "\n\nUser question: " + input }] }];
            const payload = { contents: chatHistory };

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`API request failed with status ${response.status}. Check your API key and permissions in the Google Cloud Console.`);

            const result = await response.json();

            let botResponse = "Sorry, I couldn't get a response. Please try again.";
            if (result.candidates && result.candidates.length > 0 && result.candidates[0].content?.parts?.length > 0) {
                botResponse = result.candidates[0].content.parts[0].text;
            }

            setMessages(prev => [...prev, { text: botResponse, isUser: false }]);

        } catch (error) {
            console.error("Error fetching AI response:", error);
            setMessages(prev => [...prev, { text: `${error.message}`, isUser: false }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Message Display */}
            <div className="flex-1 overflow-y-auto" aria-live="polite">
                <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-4 ${msg.isUser ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.isUser ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                                {msg.isUser ? <UserIcon /> : <BotIcon />}
                            </div>

                            <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${msg.isUser ? 'items-end' : 'items-start'}`}>
                                <div className={`px-5 py-3.5 rounded-2xl shadow-sm ${
                                    msg.isUser
                                        ? 'bg-green-600 text-white rounded-tr-none'
                                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-md'
                                }`}>
                                    {msg.isUser ? (
                                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.text}</p>
                                    ) : (
                                        <div className="prose prose-sm max-w-none prose-p:text-[15px] prose-p:leading-relaxed prose-headings:font-semibold prose-a:text-green-600">
                                            <Markdown>{msg.text}</Markdown>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-300 mt-1 px-1">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                                <BotIcon />
                            </div>
                            <div className="px-5 py-4 rounded-2xl rounded-tl-none bg-white border border-gray-100 shadow-md">
                               <div className="flex items-center space-x-1.5">
                                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></div>
                                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce delay-100"></div>
                                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce delay-200"></div>
                               </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            </div>

            {/* Input Form */}
            <div className="border-t border-gray-100 bg-white/90 backdrop-blur-md p-4 sticky bottom-0 z-10">
                <div className="max-w-3xl mx-auto relative">
                     {messages.length > 2 && (
                         <button
                            onClick={onNewChat}
                            className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg hover:bg-gray-700 transition-colors flex items-center gap-1.5"
                         >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                            New Chat
                        </button>
                     )}

                    <div className="flex items-end bg-gray-50 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all shadow-sm overflow-hidden">
                        <button
                            onClick={onNewChat}
                            className="p-3.5 text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors border-r border-gray-200"
                            title="Start new chat"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                        </button>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder='Ask a question...'
                            className="flex-1 p-3.5 bg-transparent border-none focus:ring-0 text-sm resize-none max-h-32 min-h-[50px] leading-relaxed"
                            disabled={isLoading}
                            rows={1}
                            style={{minHeight: '48px'}}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || input.trim() === ''}
                            className="p-3 m-1 text-white bg-green-600 rounded-xl disabled:bg-gray-200 disabled:text-gray-400 hover:bg-green-700 transition-all shadow-sm"
                            aria-label="Send message"
                        >
                            <SendIcon />
                        </button>
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-gray-400">AI can make mistakes. Please verify important information.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Sidebar Component ---
const Sidebar = ({ assistants, selectedAssistant, onSelectAssistant, isOpen }) => (
    <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-gray-900 text-gray-300 p-4 flex flex-col gap-2 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'flex translate-x-0' : 'hidden -translate-x-full'} md:flex shadow-xl md:shadow-none`}>
        <div className="mb-8 px-2 mt-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 2a10 10 0 0 1 10 10h-10V2z"></path><path d="M12 12L2.5 7.5"></path><path d="M12 12l9.5-4.5"></path></svg>
                </span>
                Assistants
            </h2>
        </div>

        <div className="space-y-1">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Available Experts</h3>
            {assistants.map(assistant => (
                <button
                    key={assistant.id}
                    onClick={() => onSelectAssistant(assistant)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full transition-all duration-200 group ${
                        selectedAssistant.id === assistant.id
                            ? 'bg-gray-800 text-white shadow-sm ring-1 ring-white/10'
                            : 'hover:bg-gray-800/50 hover:text-white'
                    }`}
                >
                    <div className={`p-1.5 rounded-md ${selectedAssistant.id === assistant.id ? 'bg-gray-700 text-green-400' : 'bg-gray-800 text-gray-400 group-hover:text-gray-300 group-hover:bg-gray-700'}`}>
                        <assistant.Icon />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{assistant.name}</span>
                        <span className="text-xs text-gray-500 truncate max-w-[140px]">{assistant.title}</span>
                    </div>
                </button>
            ))}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-800">
             <div className="px-3 py-2">
                <p className="text-xs text-gray-500">© 2024 AI Assistants</p>
             </div>
        </div>
    </aside>
);


// --- App Component ---
export default function App() {
    const [isVerified, setIsVerified] = useState(false);
    const [chatKey, setChatKey] = useState(0);
    const [selectedAssistant, setSelectedAssistant] = useState(assistants[0]);
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const verified = sessionStorage.getItem('cody_verified');
        if (verified === 'true') {
            setIsVerified(true);
        }
    }, []);

    const handleVerification = () => {
        setIsVerified(true);
        sessionStorage.setItem('cody_verified', 'true');
    };

    // This function resets the chat by changing the key of the ChatInterface component,
    // which forces React to remount it with a fresh state.
    const handleNewChat = () => {
        setChatKey(prevKey => prevKey + 1);
    };

    const handleSelectAssistant = (assistant) => {
        setSelectedAssistant(assistant);
        handleNewChat();
        setSidebarOpen(false); // Close sidebar on selection (for mobile)
    };

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    if (!isVerified) {
        return <Verification onVerify={handleVerification} />;
    }

    return (
        <div className="h-screen bg-white font-sans flex relative overflow-hidden md:overflow-auto">
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={toggleSidebar}
                ></div>
            )}
            <Sidebar
                assistants={assistants}
                selectedAssistant={selectedAssistant}
                onSelectAssistant={handleSelectAssistant}
                isOpen={isSidebarOpen}
            />
            <div className="flex-1 flex flex-col">
                <Header assistant={selectedAssistant} onToggleSidebar={toggleSidebar} />
                <main className="flex-1 flex flex-col overflow-hidden">
                    <ChatInterface key={chatKey} onNewChat={handleNewChat} assistant={selectedAssistant} />
                </main>
            </div>
        </div>
    );
}