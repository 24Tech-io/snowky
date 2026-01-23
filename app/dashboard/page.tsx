"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useProjects, Project } from "./ProjectsContext";

const toneEmojis: Record<string, string> = {
    friendly: "😊",
    professional: "👔",
    formal: "🎩",
    casual: "✌️",
    funny: "😄",
    empathetic: "💝",
    enthusiastic: "🎉",
    concise: "⚡",
    helpful: "🤝",
    creative: "🎨"
};

const themeIcons: Record<string, string> = {
    modern: "✨",
    classic: "🏛️",
    minimal: "⚪",
    bubble: "💬",
    glassmorphism: "🔮",
    neon: "💜",
    retro: "📺",
    nature: "🌿"
};

export default function DashboardPage() {
    const { projects, isLoading, refreshProjects } = useProjects();
    const [userName, setUserName] = useState("User");
    const [searchQuery, setSearchQuery] = useState("");
    const [showEmbedModal, setShowEmbedModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userRes = await fetch('/api/auth/me');
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUserName(userData.name.split(' ')[0]); // First name only
                }
            } catch (error) {
                console.error("User load error:", error);
            }
        };

        fetchUserData();
        // Trigger a background refresh of projects to ensure data is fresh
        refreshProjects();
    }, []);

    const getEmbedCode = (project: Project) => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return `<script
  src="${baseUrl}/widget.js"
  data-project-id="${project.id}"
  data-primary-color="${project.color || '#6366f1'}"
  defer>
</script>`;
    };

    const openEmbedModal = (project: Project) => {
        setSelectedProject(project);
        setShowEmbedModal(true);
        setCopied(false);
    };

    const copyEmbedCode = () => {
        if (selectedProject) {
            navigator.clipboard.writeText(getEmbedCode(selectedProject));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = [
        { label: "Active Widgets", value: projects.length.toString(), icon: "fa-robot", colorClass: "stat-card-primary", trend: "Real-time", trendUp: true },
        { label: "Total Messages", value: projects.reduce((sum, p) => sum + p.messages, 0).toLocaleString(), icon: "fa-comments", colorClass: "stat-card-success", trend: "Since creation", trendUp: true },
    ];

    return (
        <div className="dashboard-content">
            {/* Embed Modal */}
            {showEmbedModal && selectedProject && (
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
                                Embed {selectedProject.name}
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
                                {getEmbedCode(selectedProject)}
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
                                {copied ? ' Copied!' : ' Copy'}
                            </button>
                        </div>

                        <div style={{ background: 'var(--gray-100)', borderRadius: '8px', padding: '1rem' }}>
                            <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <i className="fas fa-info-circle" style={{ marginRight: '0.5rem', color: 'var(--secondary)' }}></i>
                                Customization Options
                            </h4>
                            <ul style={{ color: 'var(--gray-600)', fontSize: '0.85rem', margin: 0, paddingLeft: '1.5rem' }}>
                                <li><code>data-primary-color</code> - Widget color theme</li>
                                <li><code>data-position</code> - &quot;left&quot; or &quot;right&quot; (default: right)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">
                        Hello, {userName} <span className="wave-emoji">👋</span>
                    </h1>
                    <p className="dashboard-subtitle">Here&apos;s what&apos;s happening with your widgets today.</p>
                </div>
                <Link href="/dashboard/create" className="btn btn-primary">
                    <i className="fas fa-plus"></i> New Project
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat, i) => (
                    <div key={i} className={`stat-card ${stat.colorClass}`}>
                        <div className="stat-card-icon" style={{
                            background:
                                stat.colorClass === 'stat-card-primary' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' :
                                    stat.colorClass === 'stat-card-success' ? 'linear-gradient(135deg, #10b981, #059669)' :
                                        stat.colorClass === 'stat-card-warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                                            'linear-gradient(135deg, #0ea5e9, #0284c7)'
                        }}>
                            <i className={`fas ${stat.icon}`}></i>
                        </div>
                        <div className="stat-card-content">
                            <div className="stat-card-value">{stat.value}</div>
                            <div className="stat-card-label">{stat.label}</div>
                        </div>
                        {stat.trend && (
                            <span className={`stat-card-badge ${stat.trendUp ? 'badge-success' : 'badge-danger'}`}>
                                {stat.trend}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Snippets Section */}
            <div className="snippets-section">
                <div className="snippets-header">
                    <h2 className="snippets-title">Your Projects ({filteredProjects.length})</h2>
                    <div className="snippets-search">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="snippets-grid">
                    {/* Loading Skeletons */}
                    {isLoading && Array.from({ length: 3 }).map((_, i) => (
                        <div key={`skeleton-${i}`} className="snippet-card" style={{ animation: 'pulse 1.5s infinite' }}>
                            <div className="snippet-card-header">
                                <div className="snippet-card-icon" style={{ background: '#e2e8f0' }}></div>
                                <span className="snippet-card-status" style={{ background: '#e2e8f0', color: 'transparent', width: '60px' }}>Loading</span>
                            </div>
                            <div className="snippet-card-title" style={{ background: '#e2e8f0', color: 'transparent', borderRadius: '4px', marginBottom: '1rem' }}>Loading Project Name</div>
                            <div className="snippet-card-stats">
                                <div className="snippet-stat" style={{ background: '#e2e8f0', color: 'transparent', borderRadius: '4px', width: '40%' }}>...</div>
                                <div className="snippet-stat" style={{ background: '#e2e8f0', color: 'transparent', borderRadius: '4px', width: '30%' }}>...</div>
                            </div>
                        </div>
                    ))}

                    {!isLoading && filteredProjects.map((project) => (
                        <div key={project.id} className="snippet-card">
                            <div className="snippet-card-header">
                                <div className="snippet-card-icon" style={{ background: project.color }}>
                                    {themeIcons[project.theme] || '✨'}
                                </div>
                                <span className={`snippet-card-status ${project.status === 'Active' ? 'status-active' : 'status-draft'}`}>
                                    {project.status}
                                </span>
                            </div>

                            <h3 className="snippet-card-title">{project.name}</h3>

                            <div className="snippet-card-tone">
                                <span>{toneEmojis[project.tone] || '😊'}</span>
                                <span>{project.status} • {project.tone.charAt(0).toUpperCase() + project.tone.slice(1)}</span>
                            </div>

                            <div className="snippet-card-stats">
                                <div className="snippet-stat">
                                    <i className="fas fa-comment-dots"></i>
                                    <span>{project.messages} msgs</span>
                                </div>
                                <div className="snippet-stat">
                                    <i className="fas fa-star" style={{ color: '#f59e0b' }}></i>
                                    <span>{project.satisfaction}</span>
                                </div>
                            </div>

                            <div className="snippet-card-actions">
                                <Link href={`/dashboard/project/${project.id}`} className="btn btn-secondary">
                                    Manage
                                </Link>
                                <button onClick={() => openEmbedModal(project)} className="btn btn-primary">
                                    <i className="fas fa-code"></i> Embed
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Create New Card */}
                    <Link href="/dashboard/create" className="snippet-card snippet-card-new">
                        <div className="snippet-new-icon">
                            <i className="fas fa-plus"></i>
                        </div>
                        <h3 className="snippet-new-title">Create New Project</h3>
                        <p className="snippet-new-subtitle">Deploy a new AI assistant</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
