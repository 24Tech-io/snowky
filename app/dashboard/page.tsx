"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
}

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
    const [projects, setProjects] = useState<Project[]>([]);
    const [userName, setUserName] = useState("User");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, projectsRes] = await Promise.all([
                    fetch('/api/auth/me'),
                    fetch('/api/projects')
                ]);

                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUserName(userData.name.split(' ')[0]); // First name only
                }

                if (projectsRes.ok) {
                    const projectsData = await projectsRes.json();
                    setProjects(projectsData);
                } else {
                    const errText = await projectsRes.text();
                    console.error("Failed to fetch projects:", projectsRes.status, errText);
                }
            } catch (error) {
                console.error("Dashboard load error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

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
                    {filteredProjects.map((project) => (
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
                                <button className="btn btn-primary">
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
