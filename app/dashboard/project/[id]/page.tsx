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
                    setDocStats({
                        total: docs.length,
                        files: docs.filter((d) => d.type === 'file' || (d.type !== 'url' && d.type !== 'qa' && d.type !== 'text')).length,
                        text: docs.filter((d) => d.type === 'text').length,
                        urls: docs.filter((d) => d.type === 'url').length,
                        qa: docs.filter((d) => d.type === 'qa').length,
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
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>
                                <i className="fas fa-code" style={{ marginRight: '0.5rem', color: 'var(--primary)' }}></i>
                                Embed Widget
                            </h2>
                            <button
                                onClick={() => setShowEmbedModal(false)}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--gray-500)' }}
                            >
                                ×
                            </button>
                        </div>

                        <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
                            Copy and paste this code snippet into your website, just before the closing <code>&lt;/body&gt;</code> tag.
                        </p>

                        <div style={{
                            background: 'var(--gray-900)',
                            borderRadius: '12px',
                            padding: '1rem',
                            position: 'relative',
                            marginBottom: '1rem'
                        }}>
                            <pre style={{
                                color: '#e2e8f0',
                                fontSize: '0.85rem',
                                overflow: 'auto',
                                margin: 0,
                                fontFamily: 'monospace'
                            }}>
                                {getEmbedCode()}
                            </pre>
                            <button
                                onClick={copyEmbedCode}
                                className="btn btn-primary"
                                style={{
                                    position: 'absolute',
                                    top: '0.5rem',
                                    right: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.85rem'
                                }}
                            >
                                <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>

                        <div style={{ background: 'var(--gray-100)', borderRadius: '8px', padding: '1rem' }}>
                            <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <i className="fas fa-info-circle" style={{ marginRight: '0.5rem', color: 'var(--secondary)' }}></i>
                                Customization Options
                            </h4>
                            <ul style={{ color: 'var(--gray-600)', fontSize: '0.85rem', margin: 0, paddingLeft: '1.5rem' }}>
                                <li><code>data-primary-color</code> - Widget color theme</li>
                                <li><code>data-position</code> - "left" or "right" (default: right)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="dashboard-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: project.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.75rem',
                        color: 'white'
                    }}>
                        🤖
                    </div>
                    <div>
                        <h1 className="dashboard-title">{project.name}</h1>
                        <p className="dashboard-subtitle">{project.description || 'No description'}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link href="/dashboard" className="btn btn-secondary">
                        <i className="fas fa-arrow-left"></i> Back
                    </Link>
                    <button className="btn btn-primary" onClick={() => setShowEmbedModal(true)}>
                        <i className="fas fa-code"></i> Get Embed Code
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card stat-card-primary">
                    <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        <i className="fas fa-comment-dots"></i>
                    </div>
                    <div className="stat-card-content">
                        <div className="stat-card-value">{project.messages}</div>
                        <div className="stat-card-label">Total Messages</div>
                    </div>
                </div>
                <div className="stat-card stat-card-success">
                    <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                        <i className="fas fa-star"></i>
                    </div>
                    <div className="stat-card-content">
                        <div className="stat-card-value">{project.satisfaction}</div>
                        <div className="stat-card-label">Satisfaction</div>
                    </div>
                </div>
                <div className="stat-card stat-card-info">
                    <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
                        <i className="fas fa-circle"></i>
                    </div>
                    <div className="stat-card-content">
                        <div className="stat-card-value">{project.status}</div>
                        <div className="stat-card-label">Status</div>
                    </div>
                </div>
            </div>

            {/* Settings Sections */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* AI Settings */}
                <div className="snippets-section">
                    <h3 className="snippets-title" style={{ marginBottom: '1.5rem' }}>
                        <i className="fas fa-robot" style={{ marginRight: '0.5rem' }}></i> AI Settings
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
                    </div>
                    <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem' }}>
                        <i className="fas fa-cog"></i> Edit Settings
                    </button>
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

            {/* Analytics Section */}
            <div className="snippets-section" style={{ marginTop: '1.5rem' }}>
                <h3 className="snippets-title" style={{ marginBottom: '1rem' }}>
                    <i className="fas fa-chart-line" style={{ marginRight: '0.5rem' }}></i> Analytics & Insights
                </h3>
                <p style={{ color: 'var(--gray-500)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    View detailed analytics about your chatbot's performance and user interactions.
                </p>
                <Link href={`/dashboard/project/${id}/analytics`} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fas fa-chart-bar"></i> View Analytics Dashboard
                </Link>
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
        </div>
    );
}
