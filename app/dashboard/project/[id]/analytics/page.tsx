"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Analytics {
    overview: {
        totalSessions: number;
        recentSessions: number;
        totalMessages: number;
        unansweredMessages: number;
        avgResponseTime: number;
        satisfactionAvg: number | null;
        satisfactionCount: number;
    };
    topQuestions: string[];
    dailyStats: { date: string; sessions: number; messages: number }[];
    documentStats: {
        total: number;
        synced: number;
        pending: number;
        failed: number;
    };
}

export default function AnalyticsPage() {
    const params = useParams();
    const projectId = params.id as string;

    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchAnalytics();
    }, [projectId]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/projects/${projectId}/analytics`);
            if (!res.ok) throw new Error("Failed to fetch analytics");
            const data = await res.json();
            setAnalytics(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, subtitle, icon, color }: {
        title: string;
        value: string | number;
        subtitle?: string;
        icon: string;
        color: string;
    }) => (
        <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "1.5rem",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: `${color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem"
                }}>
                    {icon}
                </div>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.25rem" }}>
                {value}
            </div>
            <div style={{ color: "#64748b", fontSize: "0.9rem" }}>{title}</div>
            {subtitle && <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "0.25rem" }}>{subtitle}</div>}
        </div>
    );

    const maxMessages = analytics?.dailyStats ? Math.max(...analytics.dailyStats.map(d => d.messages), 1) : 1;

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "2rem" }}>
                <Link href={`/dashboard/project/${projectId}`} style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#64748b",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    marginBottom: "1rem"
                }}>
                    <i className="fas fa-arrow-left"></i> Back to Project
                </Link>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.5rem" }}>
                    📊 Analytics Dashboard
                </h1>
                <p style={{ color: "#64748b" }}>
                    Insights into your AI assistant's performance
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>
                    Loading analytics...
                </div>
            ) : error ? (
                <div style={{ textAlign: "center", padding: "4rem", color: "#ef4444" }}>
                    Error: {error}
                </div>
            ) : analytics ? (
                <>
                    {/* Overview Stats */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "1rem",
                        marginBottom: "2rem"
                    }}>
                        <StatCard
                            icon="💬"
                            title="Total Sessions"
                            value={analytics.overview.totalSessions}
                            subtitle={`${analytics.overview.recentSessions} in last 30 days`}
                            color="#6366f1"
                        />
                        <StatCard
                            icon="📨"
                            title="Total Messages"
                            value={analytics.overview.totalMessages}
                            color="#0ea5e9"
                        />
                        <StatCard
                            icon="❓"
                            title="Unanswered"
                            value={analytics.overview.unansweredMessages}
                            subtitle="Questions without context"
                            color="#f59e0b"
                        />
                        <StatCard
                            icon="⚡"
                            title="Avg Response Time"
                            value={analytics.overview.avgResponseTime ? `${analytics.overview.avgResponseTime}ms` : "N/A"}
                            color="#10b981"
                        />
                        <StatCard
                            icon="⭐"
                            title="Satisfaction"
                            value={analytics.overview.satisfactionAvg ? `${analytics.overview.satisfactionAvg}/5` : "N/A"}
                            subtitle={analytics.overview.satisfactionCount ? `${analytics.overview.satisfactionCount} ratings` : "No ratings yet"}
                            color="#8b5cf6"
                        />
                    </div>

                    {/* Charts Row */}
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
                        {/* Activity Chart */}
                        <div style={{
                            background: "white",
                            borderRadius: "16px",
                            padding: "1.5rem",
                            border: "1px solid #e2e8f0"
                        }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#1e293b", marginBottom: "1.5rem" }}>
                                📈 Activity (Last 7 Days)
                            </h3>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: "200px" }}>
                                {analytics.dailyStats.map((day, i) => (
                                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                                        <div style={{
                                            width: "100%",
                                            height: `${(day.messages / maxMessages) * 160}px`,
                                            background: "linear-gradient(180deg, #6366f1, #8b5cf6)",
                                            borderRadius: "8px 8px 0 0",
                                            minHeight: "4px",
                                            transition: "height 0.3s ease"
                                        }} title={`${day.messages} messages`} />
                                        <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                                            {new Date(day.date).toLocaleDateString("en", { weekday: "short" })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Document Status */}
                        <div style={{
                            background: "white",
                            borderRadius: "16px",
                            padding: "1.5rem",
                            border: "1px solid #e2e8f0"
                        }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#1e293b", marginBottom: "1.5rem" }}>
                                📚 Training Data Status
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ color: "#64748b" }}>Total Documents</span>
                                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{analytics.documentStats.total}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></span>
                                        Synced
                                    </span>
                                    <span style={{ fontWeight: 600, color: "#10b981" }}>{analytics.documentStats.synced}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }}></span>
                                        Pending
                                    </span>
                                    <span style={{ fontWeight: 600, color: "#f59e0b" }}>{analytics.documentStats.pending}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }}></span>
                                        Failed
                                    </span>
                                    <span style={{ fontWeight: 600, color: "#ef4444" }}>{analytics.documentStats.failed}</span>
                                </div>
                            </div>
                            <Link href={`/dashboard/project/${projectId}/documents`} style={{
                                display: "block",
                                textAlign: "center",
                                marginTop: "1.5rem",
                                padding: "0.75rem",
                                background: "#f8fafc",
                                borderRadius: "8px",
                                color: "#6366f1",
                                textDecoration: "none",
                                fontWeight: 500
                            }}>
                                Manage Documents →
                            </Link>
                        </div>
                    </div>

                    {/* Top Questions */}
                    <div style={{
                        background: "white",
                        borderRadius: "16px",
                        padding: "1.5rem",
                        border: "1px solid #e2e8f0"
                    }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#1e293b", marginBottom: "1rem" }}>
                            🔥 Recent Questions
                        </h3>
                        {analytics.topQuestions.length === 0 ? (
                            <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>
                                No questions yet. Share your widget to start collecting data!
                            </p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {analytics.topQuestions.map((question, i) => (
                                    <div key={i} style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "1rem",
                                        padding: "0.75rem",
                                        background: "#f8fafc",
                                        borderRadius: "8px"
                                    }}>
                                        <span style={{
                                            width: "24px",
                                            height: "24px",
                                            background: "#6366f1",
                                            color: "white",
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            flexShrink: 0
                                        }}>
                                            {i + 1}
                                        </span>
                                        <span style={{ color: "#1e293b", fontSize: "0.9rem" }}>
                                            {question.length > 100 ? question.substring(0, 100) + "..." : question}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : null}
        </div>
    );
}
