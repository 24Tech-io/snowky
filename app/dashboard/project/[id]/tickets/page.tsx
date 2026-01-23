"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";

interface Ticket {
    id: string;
    subject: string;
    status: string;
    priority: string;
    contact: { name: string; email: string } | null;
    createdAt: string;
    _count: {
        comments: number;
    };
}

export default function TicketsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTicket, setNewTicket] = useState({ subject: "", contactEmail: "", priority: "medium" });

    const fetchTickets = useCallback(async () => {
        try {
            const res = await fetch(`/api/projects/${id}/tickets`);
            if (res.ok) {
                setTickets(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/projects/${id}/tickets`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTicket)
            });

            if (res.ok) {
                setShowCreateModal(false);
                setNewTicket({ subject: "", contactEmail: "", priority: "medium" });
                fetchTickets();
            } else {
                alert("Failed to create ticket");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return { bg: '#fee2e2', color: '#b91c1c' };
            case 'pending': return { bg: '#fef3c7', color: '#b45309' };
            case 'resolved': return { bg: '#d1fae5', color: '#047857' };
            case 'closed': return { bg: '#f3f4f6', color: '#4b5563' };
            default: return { bg: '#f3f4f6', color: '#4b5563' };
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent': return '🔴';
            case 'high': return '🟠';
            case 'medium': return '🟡';
            case 'low': return '🔵';
            default: return '⚪';
        }
    };

    return (
        <div className="dashboard-content">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Support Tickets</h1>
                    <p className="dashboard-subtitle">Manage customer inquiries and requests</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link href={`/dashboard/project/${id}`} className="btn btn-secondary">
                        <i className="fas fa-arrow-left"></i> Back
                    </Link>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <i className="fas fa-plus"></i> New Ticket
                    </button>
                </div>
            </div>

            <div className="snippets-section">
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading tickets...</div>
                ) : tickets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎫</div>
                        <h3>No tickets yet</h3>
                        <p>Create tickets manually or convert chat conversations into tickets.</p>
                        <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setShowCreateModal(true)}>
                            Create First Ticket
                        </button>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Subject</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Requester</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Status</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Priority</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Created</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map(ticket => {
                                    const statusStyle = getStatusColor(ticket.status);
                                    return (
                                        <tr key={ticket.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: 500 }}>
                                                {ticket.subject}
                                                {ticket._count.comments > 0 && (
                                                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                                        <i className="far fa-comment"></i> {ticket._count.comments}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem', color: 'var(--gray-600)' }}>
                                                {ticket.contact?.email || ticket.contact?.name || 'Unknown'}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span title={ticket.priority} style={{ cursor: 'help' }}>
                                                    {getPriorityIcon(ticket.priority)} {ticket.priority}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem', color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                                                {new Date(ticket.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <button className="btn btn-ghost" style={{ padding: '0.25rem' }}>
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
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
                        <h2 style={{ marginBottom: '1.5rem' }}>Create New Ticket</h2>
                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Subject</label>
                                <input
                                    type="text"
                                    className="input-dark"
                                    style={{ width: '100%', padding: '0.75rem', background: '#fff', border: '1px solid #e5e7eb', color: '#000' }}
                                    value={newTicket.subject}
                                    onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
                                    placeholder="Brief description of the issue"
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Customer Email</label>
                                <input
                                    type="email"
                                    className="input-dark"
                                    style={{ width: '100%', padding: '0.75rem', background: '#fff', border: '1px solid #e5e7eb', color: '#000' }}
                                    value={newTicket.contactEmail}
                                    onChange={e => setNewTicket({ ...newTicket, contactEmail: e.target.value })}
                                    placeholder="customer@example.com"
                                    required
                                />
                                <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>We&apos;ll auto-create a contact if one doesn&apos;t exist.</p>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Priority</label>
                                <select
                                    className="input-dark"
                                    style={{ width: '100%', padding: '0.75rem', background: '#fff', border: '1px solid #e5e7eb', color: '#000' }}
                                    value={newTicket.priority}
                                    onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Ticket</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
