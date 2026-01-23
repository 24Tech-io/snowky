
'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useConversations, useMessages } from '@/hooks/useChatStream';

export default function InboxPage() {
    const params = useParams();
    const projectId = params.id as string;
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    const { conversations, isLoading: loadingConvos } = useConversations(projectId);
    const { messages, mutate: refreshMessages } = useMessages(projectId, selectedSessionId);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!replyText.trim() || !selectedSessionId) return;

        // Optimsitic UI could be added here
        setReplyText(''); // Clear immediately

        await fetch(`/api/projects/${projectId}/conversations/${selectedSessionId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content: replyText })
        });

        refreshMessages();
    };

    const selectedConversation = conversations?.find((c: any) => c.id === selectedSessionId);

    return (
        <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
            {/* Sidebar: Conversation List */}
            <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900">
                <div className="p-4 border-b border-slate-800">
                    <h2 className="text-lg font-bold">Inbox</h2>
                    <div className="text-xs text-slate-400 mt-1">
                        {loadingConvos ? 'Loading...' : `${conversations?.length || 0} active`}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations?.map((conv: any) => (
                        <div
                            key={conv.id}
                            onClick={() => setSelectedSessionId(conv.id)}
                            className={`p-4 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors ${selectedSessionId === conv.id ? 'bg-slate-800 border-l-4 border-l-blue-500' : ''}`}
                        >
                            <div className="flex justify-between mb-1">
                                <span className="font-semibold text-sm truncate">{conv.contact?.name || 'Visitor'}</span>
                                <span className="text-xs text-slate-500">{new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                                {conv.contact?.email || conv.contact?.phone || 'Unknown'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-950">
                {selectedSessionId ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-900/50 backdrop-blur">
                            <div>
                                <h3 className="font-bold">{selectedConversation?.contact?.name || 'Visitor'}</h3>
                                <span className="text-xs text-slate-400">{selectedConversation?.contact?.email || selectedConversation?.contact?.phone}</span>
                            </div>
                            <button className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-slate-300">
                                Mark Resolved
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages?.map((msg: any) => {
                                const isAgent = msg.role === 'agent' || msg.role === 'assistant';
                                return (
                                    <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${isAgent
                                                ? 'bg-blue-600 text-white rounded-br-sm'
                                                : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                                            }`}>
                                            <p className="text-sm">{msg.content}</p>
                                            <div className="text-[10px] opacity-50 mt-1 text-right">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-slate-800 bg-slate-900">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    placeholder="Type a reply..."
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!replyText.trim()}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500">
                        <div className="text-center">
                            <div className="text-4xl mb-4">💬</div>
                            <p>Select a conversation to start chatting</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Sidebar: User Details (CRM) */}
            {selectedSessionId && (
                <div className="w-72 border-l border-slate-800 bg-slate-900 p-6 hidden xl:block">
                    <h3 className="font-bold text-slate-300 mb-4">Customer Details</h3>
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center text-2xl font-bold">
                            {selectedConversation?.contact?.name?.[0] || 'V'}
                        </div>
                        <div className="text-center">
                            <div className="font-semibold">{selectedConversation?.contact?.name}</div>
                            <div className="text-sm text-slate-400">{selectedConversation?.contact?.email}</div>
                        </div>
                        <div className="pt-4 border-t border-slate-800">
                            <div className="text-xs text-slate-500 uppercase font-semibold mb-2">Info</div>
                            <div className="text-sm text-slate-300">
                                <div className="flex justify-between mb-1"><span>Phone:</span> <span className="text-slate-400">{selectedConversation?.contact?.phone || '-'}</span></div>
                                <div className="flex justify-between mb-1"><span>City:</span> <span className="text-slate-400">-</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
