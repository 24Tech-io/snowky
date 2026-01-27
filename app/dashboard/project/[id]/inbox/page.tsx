
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
        <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
            {/* Sidebar: Conversation List */}
            <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Inbox</h2>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {loadingConvos ? '...' : `${conversations?.length || 0}`}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations?.map((conv: any) => (
                        <div
                            key={conv.id}
                            onClick={() => setSelectedSessionId(conv.id)}
                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedSessionId === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                        >
                            <div className="flex justify-between mb-1">
                                <span className="font-semibold text-sm truncate text-gray-800">{conv.contact?.name || 'Visitor'}</span>
                                <span className="text-xs text-gray-400">{new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                                {conv.contact?.email || conv.contact?.phone || 'Unknown'}
                            </div>
                        </div>
                    ))}
                    {conversations?.length === 0 && (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            No conversations yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-gray-50">
                {selectedSessionId ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 border-b border-gray-200 flex items-center px-6 justify-between bg-white shadow-sm z-10">
                            <div>
                                <h3 className="font-bold text-gray-900">{selectedConversation?.contact?.name || 'Visitor'}</h3>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                    <span>{selectedConversation?.contact?.email || selectedConversation?.contact?.phone}</span>
                                    {selectedConversation?.visitorId && <span className="bg-gray-100 px-1 rounded font-mono text-[10px]">{selectedConversation.visitorId.slice(0, 8)}</span>}
                                </div>
                            </div>
                            <button className="text-xs bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1 rounded text-gray-600 transition-colors">
                                <i className="fas fa-check mr-1"></i> Mark Resolved
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages?.map((msg: any) => {
                                const isAgent = msg.role === 'agent' || msg.role === 'assistant';
                                return (
                                    <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${isAgent
                                            ? 'bg-blue-600 text-white rounded-br-sm'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                                            }`}>
                                            <p className="text-sm">{msg.content}</p>
                                            <div className={`text-[10px] mt-1 text-right ${isAgent ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-gray-200 bg-white">
                            <div className="max-w-4xl mx-auto flex gap-2">
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    placeholder="Type a reply..."
                                    className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!replyText.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <div className="text-6xl mb-4 text-gray-200">💬</div>
                            <p className="font-medium">Select a conversation to start chatting</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Sidebar: User Details (CRM) */}
            {selectedSessionId && (
                <div className="w-72 border-l border-gray-200 bg-white p-6 hidden xl:block">
                    <h3 className="font-bold text-gray-900 mb-6 uppercase text-xs tracking-wider">Customer Details</h3>
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-3 border border-blue-50">
                                {selectedConversation?.contact?.name?.[0] || 'V'}
                            </div>
                            <div className="font-bold text-gray-900 text-lg">{selectedConversation?.contact?.name || 'Visitor'}</div>
                            <div className="text-sm text-gray-500">{selectedConversation?.contact?.email || 'No email'}</div>
                        </div>

                        <div className="border-t border-gray-100 pt-6 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Phone</span>
                                <span className="text-gray-900 font-medium">{selectedConversation?.contact?.phone || '-'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Last Active</span>
                                <span className="text-gray-900 font-medium">{new Date(selectedConversation?.lastMessageAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Source</span>
                                <span className="text-gray-900 font-medium capitalize">{selectedConversation?.channel || 'Web'}</span>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <button className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                View Full Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
