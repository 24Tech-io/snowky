"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";

interface Contact {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    createdAt: string;
    _count: {
        sessions: number;
        tickets: number;
    };
}

export default function CRMPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newContact, setNewContact] = useState({ name: "", email: "", phone: "" });

    const fetchContacts = useCallback(async () => {
        try {
            const res = await fetch(`/api/projects/${id}/contacts`);
            if (res.ok) {
                setContacts(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/projects/${id}/contacts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newContact)
            });

            if (res.ok) {
                setShowCreateModal(false);
                setNewContact({ name: "", email: "", phone: "" });
                fetchContacts();
            } else {
                alert("Failed to create contact");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="dashboard-content">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <Link href={`/dashboard/project/${id}`} className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1 mb-2">
                        <i className="fas fa-arrow-left"></i> Back to Project
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">CRM & Contacts</h1>
                    <p className="text-gray-500 mt-1">Manage your customers and visitors</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <i className="fas fa-plus mr-2"></i> Add Contact
                </button>
            </div>

            <div className="create-card">
                {isLoading ? (
                    <div className="text-center py-12 text-gray-500">
                        <i className="fas fa-spinner fa-spin mr-2"></i> Loading contacts...
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <div className="text-4xl mb-4">👥</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No contacts yet</h3>
                        <p className="mb-6">Contacts will appear here when they chat with your bot, or you can add them manually.</p>
                        <button className="btn btn-secondary" onClick={() => setShowCreateModal(true)}>
                            Add Your First Contact
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Chats</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tickets</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {contacts.map(contact => (
                                    <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                                                    {contact.name ? contact.name[0].toUpperCase() : '?'}
                                                </div>
                                                <span className="font-medium text-gray-900">{contact.name || 'Anonymous'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{contact.email || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {contact._count.sessions}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                {contact._count.tickets}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(contact.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                                <i className="fas fa-ellipsis-h"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Add New Contact</h2>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="form-label">Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newContact.name}
                                    onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                                    required
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={newContact.email}
                                    onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="form-label">Phone</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={newContact.phone}
                                    onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                                    placeholder="+1234567890"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Contact</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
