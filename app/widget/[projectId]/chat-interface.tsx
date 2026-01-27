'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: { title: string; id: string }[];
}

interface ChatInterfaceProps {
    projectId: string;
    settings: any;
}

export default function ChatInterface({ projectId, settings }: ChatInterfaceProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Load session from local storage to persist across reloads
    useEffect(() => {
        const storedSession = localStorage.getItem(`snowky_session_${projectId}`);
        if (storedSession) setSessionId(storedSession);

        // Check if we should auto-open (e.g. valid session exists)
        // For now, simple state
    }, [projectId]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            // Visitor ID (Fingerprint) - Simple random for now or local storage ID
            let visitorId = localStorage.getItem('snowky_visitor_id');
            if (!visitorId) {
                visitorId = Math.random().toString(36).substring(2) + Date.now().toString(36);
                localStorage.setItem('snowky_visitor_id', visitorId);
            }

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    message: userMsg,
                    visitorId,
                    sessionId: sessionId // Send if we have it
                }),
            });

            const data = await res.json();

            if (data.sessionId && data.sessionId !== sessionId) {
                setSessionId(data.sessionId);
                localStorage.setItem(`snowky_session_${projectId}`, data.sessionId);
            }

            if (data.error) {
                throw new Error(data.error);
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.content,
                sources: data.sources // RAG Sources
            }]);

        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    const primaryColor = settings.widgetColor || '#6366f1';

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 text-white p-4 rounded-full shadow-lg hover:opacity-90 transition-all flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="ml-2 font-medium">{settings.widgetButtonText || 'Chat'}</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-[350px] sm:w-[380px] h-[600px] max-h-[80vh] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden border">
            {/* Header */}
            <div className="p-4 text-white flex justify-between items-center" style={{ backgroundColor: primaryColor }}>
                <h3 className="font-semibold">{settings.welcomeMessage ? 'Chat with Us' : 'Chat'}</h3>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 && (
                    <div className="text-center text-sm text-gray-500 mt-8">
                        <p>{settings.welcomeMessage || "Hello! How can we help you today?"}</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === 'user'
                                    ? 'text-white'
                                    : 'bg-white text-gray-800 border'
                                }`}
                            style={msg.role === 'user' ? { backgroundColor: primaryColor } : {}}
                        >
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-2 text-xs opacity-75 border-t pt-1 border-gray-200">
                                    <p className="font-semibold mb-1">Sources:</p>
                                    <ul className="list-disc ml-4">
                                        {msg.sources.map((s, i) => (
                                            <li key={i}>{s.title}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border rounded-lg p-3 text-sm text-gray-500">
                            <span className="animate-pulse">Typing...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="text-white px-3 py-2 rounded hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
                <div className="text-center mt-2">
                    <a href="https://snowky.io" target="_blank" className="text-[10px] text-gray-400 hover:text-gray-600">Powered by Snowky</a>
                </div>
            </form>
        </div>
    );
}
