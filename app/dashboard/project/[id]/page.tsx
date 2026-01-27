"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    tone: string;
    color: string;
    theme: string;
    messages: number;

    satisfaction: string;
    createdAt: string;
    website?: string;
    showFloatingLauncher?: boolean;
}


export default function ProjectManagePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showEmbedModal, setShowEmbedModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Knowledge Base Stats
    const [docStats, setDocStats] = useState({
        total: 0,
        files: 0,
        text: 0,
        urls: 0,
        qa: 0,
        loading: true
    });

    // Analytics Stats
    const [analytics, setAnalytics] = useState({
        totalSessions: 0,
        totalMessages: 0,
        unansweredMessages: 0,
        avgResponseTime: 0,
        loading: true
    });

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await fetch('/api/projects');
                if (res.ok) {
                    const projects = await res.json();
                    const found = projects.find((p: Project) => p.id === id);
                    setProject(found || null);
                }
            } catch (error) {
                console.error("Error fetching project:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProject();
    }, [id]);

    // Fetch document stats
    useEffect(() => {
        const fetchDocStats = async () => {
            try {
                // Add timestamp to prevent caching
                const res = await fetch(`/api/projects/${id}/documents?t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    interface DocumentStat { type: string; }
                    const docs: DocumentStat[] = data.documents || [];
                    // Normalize types to lowercase for consistent counting
                    const normalizedDocs = docs.map(d => ({ ...d, type: d.type.toLowerCase() }));

                    const fileCount = normalizedDocs.filter((d) => d.type !== 'url' && d.type !== 'qa' && d.type !== 'text').length;
                    setDocStats({
                        total: docs.length,
                        files: fileCount,
                        text: normalizedDocs.filter((d) => d.type === 'text').length,
                        urls: normalizedDocs.filter((d) => d.type === 'url').length,
                        qa: normalizedDocs.filter((d) => d.type === 'qa').length,
                        loading: false
                    });
                }
            } catch (error) {
                console.error("Error fetching doc stats:", error);
                setDocStats(prev => ({ ...prev, loading: false }));
            }
        };

        if (id) fetchDocStats();
    }, [id]);

    // Fetch analytics
    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch(`/api/projects/${id}/analytics`);
                if (res.ok) {
                    const data = await res.json();
                    setAnalytics({
                        totalSessions: data.overview?.totalSessions || 0,
                        totalMessages: data.overview?.totalMessages || 0,
                        unansweredMessages: data.overview?.unansweredMessages || 0,
                        avgResponseTime: data.overview?.avgResponseTime || 0,
                        loading: false
                    });
                }
            } catch (error) {
                console.error("Error fetching analytics:", error);
                setAnalytics(prev => ({ ...prev, loading: false }));
            }
        };

        if (id) fetchAnalytics();
    }, [id]);

    const getEmbedCode = () => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return `<script
  src="${baseUrl}/widget.js"
  data-project-id="${id}"
  data-primary-color="${project?.color || '#6366f1'}"
  defer>
</script>`;
    };

    const copyEmbedCode = () => {
        navigator.clipboard.writeText(getEmbedCode());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="dashboard-content">
                <div className="create-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                    <h2 style={{ marginBottom: '1rem' }}>Loading Project...</h2>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="dashboard-content">
                <div className="create-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Project Not Found</h2>
                    <p style={{ color: 'var(--gray-500)', marginBottom: '2rem' }}>
                        The project you&apos;re looking for doesn&apos;t exist or has been deleted.
                    </p>
                    <Link href="/dashboard" className="btn btn-primary">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const toneLabel = project.tone.charAt(0).toUpperCase() + project.tone.slice(1);
    const toneEmoji = project.tone === 'friendly' ? '😊' : project.tone === 'professional' ? '👔' : project.tone === 'formal' ? '🎩' : project.tone === 'casual' ? '✌️' : project.tone === 'funny' ? '😄' : '😊';

    const handleDeleteProject = async () => {
        if (!confirm("Are you sure you want to delete this project? This action cannot be undone and will delete all associated documents and sessions.")) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete project");
            }

            router.push("/dashboard");
            router.refresh();
        } catch (error: any) {
            console.error("Delete error:", error);
            alert("Failed to delete project: " + error.message);
            setIsDeleting(false);
        }
    };

    const updateSettings = async (updates: Partial<Project>) => {
        if (!project) return;

        // Optimistic update
        const prev = { ...project };
        setProject({ ...project, ...updates });

        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (!res.ok) throw new Error('Failed to update');
        } catch (e) {
            console.error(e);
            setProject(prev); // Revert
            alert("Failed to update settings");
        }
    };

    return (
        <div className="dashboard-content">
            {/* Embed Modal */}
            {showEmbedModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }} onClick={() => setShowEmbedModal(false)}>
                    {/* ... (Modal content unchanged) ... */}
                </div>
            )}

            {/* ... (Header) ... */}

            {/* ... (Stats Row) ... */}

            {/* Settings Sections */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* AI Settings */}
                <div className="snippets-section">
                    <h3 className="snippets-title" style={{ marginBottom: '1.5rem' }}>
                        <i className="fas fa-robot" style={{ marginRight: '0.5rem' }}></i> Widget & AI Settings
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 500 }}>Personality</span>
                            <span className="snippet-card-tone">
                                <span>{toneEmoji}</span>
                                <span>{toneLabel}</span>
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 500 }}>Theme Color</span>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: project.color,
                                border: '2px solid var(--gray-200)'
                            }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 500 }}>Floating Button</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={project.showFloatingLauncher ?? true}
                                    onChange={(e) => updateSettings({ showFloatingLauncher: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                    <Link href={`/dashboard/project/${id}/settings`} className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem', display: 'block', textAlign: 'center' }}>
                        <i className="fas fa-cog"></i> Edit Settings
                    </Link>
                </div>

                {/* Knowledge Base */}
                <div className="snippets-section">
                    <h3 className="snippets-title" style={{ marginBottom: '1.5rem' }}>
                        <i className="fas fa-database" style={{ marginRight: '0.5rem' }}></i> Knowledge Base
                    </h3>
                    <div style={{ padding: '1.5rem', background: 'var(--gray-50)', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
                        {docStats.loading ? (
                            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--gray-500)' }}>Loading stats...</div>
                        ) : (
                            <div>

                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--gray-600)', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <i className="far fa-file-alt"></i> {docStats.files} Doc
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <i className="fas fa-align-left"></i> {docStats.text} Text
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <i className="fas fa-globe"></i> {docStats.urls} URL
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <i className="fas fa-question-circle"></i> {docStats.qa} Q&A
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                        <Link href={`/dashboard/project/${id}/documents`} className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>
                            <i className="fas fa-folder-open"></i> Documents
                        </Link>
                        <Link href={`/dashboard/project/${id}/train`} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
                            <i className="fas fa-upload"></i> Upload
                        </Link>
                    </div>
                </div>
            </div>

            {/* CRM, Ticketing & Channels Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '1.5rem' }}>
                <div className="snippets-section" style={{ borderColor: '#6366f1' }}>
                    <h3 className="snippets-title" style={{ marginBottom: '1rem', color: '#4f46e5' }}>
                        <i className="fas fa-inbox" style={{ marginRight: '0.5rem' }}></i> Unified Inbox
                    </h3>
                    <p style={{ color: 'var(--gray-500)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        Manage chats from Web, WhatsApp, and more.
                    </p>
                    <Link href={`/dashboard/project/${id}/inbox`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', backgroundColor: '#4f46e5', borderColor: '#4338ca' }}>
                        <i className="fas fa-comments"></i> Open Inbox
                    </Link>
                </div>

                {/* CRM System */}
                <div className="snippets-section" style={{ borderColor: '#e0e7ff' }}>
                    <h3 className="snippets-title" style={{ marginBottom: '1rem', color: '#4338ca' }}>
                        <i className="fas fa-users" style={{ marginRight: '0.5rem' }}></i> CRM & Contacts
                    </h3>
                    <p style={{ color: 'var(--gray-500)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        Manage your customer database.
                    </p>
                    <Link href={`/dashboard/project/${id}/crm`} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
                        <i className="fas fa-address-book"></i> View Contacts
                    </Link>
                </div>

                {/* Analytics System */}
                <div className="snippets-section" style={{ borderColor: '#8b5cf6' }}>
                    <h3 className="snippets-title" style={{ marginBottom: '1rem', color: '#7c3aed' }}>
                        <i className="fas fa-chart-line" style={{ marginRight: '0.5rem' }}></i> Analytics
                    </h3>
                    <p style={{ color: 'var(--gray-500)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        Track visitor behavior and events.
                    </p>
                    <Link href={`/dashboard/project/${id}/analytics`} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
                        <i className="fas fa-chart-bar"></i> View Reports
                    </Link>
                </div>
            </div>


            {/* Channels Configuration (Separate Row or Small Link) */}
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <i className="fab fa-whatsapp text-xl"></i>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-700">Connect Channels</h4>
                        <p className="text-sm text-slate-500">Add WhatsApp, Messenger, and Email.</p>
                    </div>
                </div>
                <Link href={`/dashboard/project/${id}/settings/channels`} className="text-sm font-medium text-blue-600 hover:underline">
                    Configure Integrations →
                </Link>
            </div>

            {/* Analytics Section */}
            <div className="snippets-section" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="snippets-title" style={{ margin: 0 }}>
                        <i className="fas fa-chart-line" style={{ marginRight: '0.5rem' }}></i> Analytics & Insights
                    </h3>
                    <Link href={`/dashboard/project/${id}/analytics`} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        <i className="fas fa-external-link-alt"></i> View Full Dashboard
                    </Link>
                </div>
                {analytics.loading ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--gray-500)' }}>Loading analytics...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4f46e5' }}>{analytics.totalSessions}</div>
                            <div style={{ fontSize: '0.8rem', color: '#6366f1', marginTop: '0.25rem' }}>Total Sessions</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#059669' }}>{analytics.totalMessages}</div>
                            <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.25rem' }}>Total Messages</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#d97706' }}>{analytics.unansweredMessages}</div>
                            <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '0.25rem' }}>Unanswered</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'linear-gradient(135deg, #fce7f3, #fbcfe8)', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#db2777' }}>{analytics.avgResponseTime}<span style={{ fontSize: '0.9rem' }}>ms</span></div>
                            <div style={{ fontSize: '0.8rem', color: '#ec4899', marginTop: '0.25rem' }}>Avg Response</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            <div className="snippets-section" style={{ marginTop: '1.5rem', borderColor: '#fee2e2' }}>
                <h3 className="snippets-title" style={{ color: '#dc2626', marginBottom: '1rem' }}>
                    <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i> Danger Zone
                </h3>
                <p style={{ color: 'var(--gray-500)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Deleting this project will remove all associated data and cannot be undone.
                </p>
                <button
                    className="btn"
                    onClick={handleDeleteProject}
                    disabled={isDeleting}
                    style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fca5a5',
                        opacity: isDeleting ? 0.7 : 1,
                        cursor: isDeleting ? 'not-allowed' : 'pointer'
                    }}
                >
                    <i className="fas fa-trash"></i> {isDeleting ? "Deleting..." : "Delete Project"}
                </button>
            </div>
        </div >
    );
}
