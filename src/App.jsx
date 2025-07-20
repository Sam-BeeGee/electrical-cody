import React, { useState, useEffect, useRef } from 'react';

// --- Helper Components ---

// Icon for the send button
const SendIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
        <path d="M3.4 20.4L20.85 12.02L3.4 3.6V10.1L17.2 12L3.4 13.9V20.4Z" fill="currentColor"/>
    </svg>
);

// Icon for the AI assistant, "Electrical Cody"
const BotIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#4A90E2" />
        <path d="M13 4L6 14H11L11 20L18 10H13L13 4Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Icon for the user
const UserIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12ZM12 10C13.1046 10 14 9.10457 14 8C14 6.89543 13.1046 6 12 6C10.8954 6 10 6.89543 10 8C10 9.10457 10.8954 10 12 10Z" fill="currentColor" opacity="0.5"/>
        <path d="M5.00411 20.6C5.55321 17.2337 8.48204 15 12 15C15.518 15 18.4468 17.2337 18.9959 20.6C19.1285 21.3364 18.5215 22 17.7621 22H6.23789C5.47851 22 4.87153 21.3364 5.00411 20.6Z" fill="currentColor" opacity="0.5"/>
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


// --- Main Components ---

// Main chat interface
const ChatInterface = ({ onNewChat }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Effect to add initial welcome message from Electrical Cody
    useEffect(() => {
        setMessages([
            { 
                text: "Hello! I'm Electrical Cody, your virtual master electrician. Ask me about code, calculations, or Revit. How can I help?", 
                isUser: false 
            }
        ]);
    }, []);
    
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
            const systemPrompt = `You are "Electrical Cody," an AI virtual assistant with the knowledge and persona of a seasoned Master Electrician. Your goal is to provide expert, safe, and practical advice to both field electricians and electrical detailers/designers.

When a user asks a question, follow these steps:
1.  **Analyze the User's Need:** Is this a field electrician asking about installation, or a detailer asking about design/modeling? Tailor your response accordingly.
2.  **Determine the Topic:**
    * **Code Interpretation:** If it's about code, reference the NEC 2023 by default, or the specific state code (WA, OR, CA) if mentioned. Always cite the article (e.g., NEC 210.52(C)(1)).
    * **Electrical Calculations:** If asked to perform a calculation (e.g., voltage drop, conduit fill, box fill, load calculations, motor branch circuits), perform the calculation accurately and, most importantly, show the step-by-step process, including the formulas and code articles used.
    * **Revit/VDC:** If it's about Revit, provide clear, practical workflows for electrical detailers.
    * **Electrical Theory:** If it's about a fundamental concept (Ohm's Law, 3-phase power, etc.), explain it clearly and concisely, as a master electrician would to an apprentice.
3.  **Prioritize Safety and Best Practices:** Frame your answers with a focus on safety and professional, code-compliant installation methods.
4.  **Be Clear and Concise:** Provide accurate, easy-to-understand answers. Avoid jargon where possible, or explain it if necessary.`;

            let chatHistory = [{ role: "user", parts: [{ text: systemPrompt + "\n\nUser question: " + input }] }];
            const payload = { contents: chatHistory };
            
            // UPDATED: Read the API key from the environment variable
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            
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
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.isUser ? 'justify-end' : ''}`}>
                        {!msg.isUser && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                                <BotIcon />
                            </div>
                        )}
                        <div className={`max-w-xl p-3 px-4 rounded-2xl ${msg.isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
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
                               <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                               <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-100"></div>
                               <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-200"></div>
                           </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200">
                <div className="flex items-center bg-gray-100 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                    <button
                        onClick={onNewChat}
                        className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-l-xl transition-colors"
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
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || input.trim() === ''}
                        className="p-3 text-blue-600 disabled:text-gray-300 hover:bg-blue-100 rounded-r-xl transition-colors"
                    >
                        <SendIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- App Component ---
export default function App() {
    const [chatKey, setChatKey] = useState(0);

    // This function resets the chat by changing the key of the ChatInterface component,
    // which forces React to remount it with a fresh state.
    const handleNewChat = () => {
        setChatKey(prevKey => prevKey + 1);
    };

    return (
        <div className="h-screen bg-white font-sans flex flex-col">
            <main className="flex-1 flex flex-col overflow-hidden">
                 <ChatInterface key={chatKey} onNewChat={handleNewChat} />
            </main>
        </div>
    );
}
