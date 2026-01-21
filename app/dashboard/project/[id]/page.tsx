"use client";

import { use } from "react";
import Link from "next/link";

// Mock project data - would come from API/database in production
const mockProjects: Record<string, {
    name: string;
    description: string;
    status: string;
    tone: string;
    messages: number;
    satisfaction: string;
    icon: string;
    color: string;
}> = {
    "1": {
        name: "E-Commerce Support Bot",
        description: "Customer support chatbot for online store",
        status: "Active",
        tone: "Friendly",
        messages: 854,
        satisfaction: "98%",
        icon: "🛒",
        color: "#6366f1"
    },
    "2": {
        name: "SaaS Knowledge Base",
        description: "Help center assistant for SaaS platform",
        status: "Active",
        tone: "Professional",
        messages: 342,
        satisfaction: "96%",
        icon: "📚",
        color: "#10b981"
    },
    "3": {
        name: "Personal Portfolio",
        description: "Portfolio website assistant",
        status: "Draft",
        tone: "Casual",
        messages: 0,
        satisfaction: "-",
        icon: "🎨",
        color: "#f59e0b"
    }
};

export default function ProjectManagePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const project = mockProjects[id];

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

    return (
        <div className="dashboard-content">
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
                        fontSize: '1.75rem'
                    }}>
                        {project.icon}
                    </div>
                    <div>
                        <h1 className="dashboard-title">{project.name}</h1>
                        <p className="dashboard-subtitle">{project.description}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link href="/dashboard" className="btn btn-secondary">
                        <i className="fas fa-arrow-left"></i> Back
                    </Link>
                    <button className="btn btn-primary">
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
                                <span>{project.tone === 'Friendly' ? '😊' : project.tone === 'Professional' ? '👔' : '✌️'}</span>
                                <span>{project.tone}</span>
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
                    <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--gray-100)', borderRadius: '12px' }}>
                        <i className="fas fa-file-alt" style={{ fontSize: '2rem', color: 'var(--gray-400)', marginBottom: '0.5rem' }}></i>
                        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No documents uploaded yet</p>
                    </div>
                    <Link href={`/dashboard/project/${id}/train`} className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem', display: 'block', textAlign: 'center' }}>
                        <i className="fas fa-upload"></i> Upload Documents
                    </Link>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="snippets-section" style={{ marginTop: '1.5rem', borderColor: '#fee2e2' }}>
                <h3 className="snippets-title" style={{ color: '#dc2626', marginBottom: '1rem' }}>
                    <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i> Danger Zone
                </h3>
                <p style={{ color: 'var(--gray-500)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Deleting this project will remove all associated data and cannot be undone.
                </p>
                <button className="btn" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                    <i className="fas fa-trash"></i> Delete Project
                </button>
            </div>
        </div>
    );
}
