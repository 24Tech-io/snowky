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
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">CRM & Contacts</h1>
                    <p className="dashboard-subtitle">Manage your customers and visitors</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link href={`/dashboard/project/${id}`} className="btn btn-secondary">
                        <i className="fas fa-arrow-left"></i> Back
                    </Link>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <i className="fas fa-plus"></i> Add Contact
                    </button>
                </div>
            </div>

            <div className="snippets-section">
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading contacts...</div>
                ) : contacts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👥</div>
                        <h3>No contacts yet</h3>
                        <p>Contacts will appear here when they chat with your bot, or you can add them manually.</p>
                        <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setShowCreateModal(true)}>
                            Add Your First Contact
                        </button>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Name</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Email</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Chats</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Tickets</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Joined</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contacts.map(contact => (
                                    <tr key={contact.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: 500 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                                                    {contact.name ? contact.name[0].toUpperCase() : '?'}
                                                </div>
                                                {contact.name || 'Anonymous'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem', color: 'var(--gray-600)' }}>{contact.email || '-'}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{ background: '#f3f4f6', padding: '0.2rem 0.5rem', borderRadius: '99px', fontSize: '0.8rem' }}>
                                                {contact._count.sessions}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.5rem', borderRadius: '99px', fontSize: '0.8rem' }}>
                                                {contact._count.tickets}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem', color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                                            {new Date(contact.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <button className="btn btn-ghost" style={{ padding: '0.25rem' }}>
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
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setShowCreateModal(false)}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Add New Contact</h2>
                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name</label>
                                <input
                                    type="text"
                                    className="input-dark"
                                    style={{ width: '100%', padding: '0.75rem', background: '#fff', border: '1px solid #e5e7eb', color: '#000' }}
                                    value={newContact.name}
                                    onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
                                <input
                                    type="email"
                                    className="input-dark"
                                    style={{ width: '100%', padding: '0.75rem', background: '#fff', border: '1px solid #e5e7eb', color: '#000' }}
                                    value={newContact.email}
                                    onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Phone</label>
                                <input
                                    type="tel"
                                    className="input-dark"
                                    style={{ width: '100%', padding: '0.75rem', background: '#fff', border: '1px solid #e5e7eb', color: '#000' }}
                                    value={newContact.phone}
                                    onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
