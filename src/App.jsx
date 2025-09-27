import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'markdown-to-jsx';
import { assistants } from './assistants.jsx';

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
    <header className="flex items-center p-4 border-b border-gray-200 bg-white relative">
        <button
            onClick={onToggleSidebar}
            className="md:hidden mr-4 p-2 rounded-md hover:bg-gray-100"
            aria-label="Toggle sidebar"
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </button>
        <div className="flex items-center gap-3">
            <assistant.Icon />
            <div>
                <h1 className="text-lg font-bold text-gray-800">{assistant.name}</h1>
                <p className="text-sm text-gray-500">{assistant.title}</p>
            </div>
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
        <div className="flex flex-col h-full">
            {/* Message Display */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto" aria-live="polite">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.isUser ? 'justify-end' : ''}`}>
                        {!msg.isUser && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                                <BotIcon />
                            </div>
                        )}
                        <div className={`max-w-xl p-3 px-4 rounded-2xl ${msg.isUser ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                            {msg.isUser ? (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                            ) : (
                                <div className="prose prose-sm max-w-none">
                                    <Markdown>{msg.text}</Markdown>
                                </div>
                            )}
                        </div>
                         {msg.isUser && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                                <UserIcon />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                            <BotIcon />
                        </div>
                        <div className="max-w-lg p-3 px-4 rounded-2xl bg-gray-100 text-gray-800">
                           <div className="flex items-center space-x-1.5">
                               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse delay-100"></div>
                               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse delay-200"></div>
                           </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200">
                <div className="flex items-center bg-gray-100 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-green-500 transition-all">
                    <button
                        onClick={onNewChat}
                        className="p-3 text-gray-500 hover:text-green-600 hover:bg-green-100 rounded-l-xl transition-colors"
                        aria-label="Start new chat"
                    >
                        <NewChatIcon />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder='Ask a code question, run a calculation, or get Revit help...'
                        className="flex-1 p-3 bg-transparent border-l border-gray-200 focus:ring-0 text-sm"
                        disabled={isLoading}
                        aria-label="Chat input"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || input.trim() === ''}
                        className="p-3 text-green-600 disabled:text-gray-300 hover:bg-green-100 rounded-r-xl transition-colors"
                        aria-label="Send message"
                    >
                        <SendIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Sidebar Component ---
const Sidebar = ({ assistants, selectedAssistant, onSelectAssistant, isOpen }) => (
    <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-50 border-r border-gray-200 p-4 flex-col gap-2 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'flex translate-x-0' : 'hidden -translate-x-full'} md:flex`}>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Trades</h2>
        {assistants.map(assistant => (
            <button
                key={assistant.id}
                onClick={() => onSelectAssistant(assistant)}
                className={`flex items-center gap-3 p-2 rounded-lg text-left w-full transition-colors ${
                    selectedAssistant.id === assistant.id
                        ? 'bg-green-100 text-green-800'
                        : 'hover:bg-gray-200 text-gray-600'
                }`}
            >
                <assistant.Icon />
                <span className="font-medium">{assistant.name}</span>
            </button>
        ))}
    </aside>
);


// --- App Component ---
export default function App() {
    const [chatKey, setChatKey] = useState(0);
    const [selectedAssistant, setSelectedAssistant] = useState(assistants[0]);
    const [isSidebarOpen, setSidebarOpen] = useState(false);

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