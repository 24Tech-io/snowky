"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Analytics {
    totalViews: number;
    activeVisitors: number;
    recentEvents: {
        id: string;
        type: string;
        visitorId: string;
        data: any;
        createdAt: string;
    }[];
}

export default function AnalyticsPage() {
    const params = useParams();
    const projectId = params.id as string;

    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
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

        fetchAnalytics();
    }, [projectId]);

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
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                            <div className="text-slate-400 text-sm mb-1">Active Visitors (5m)</div>
                            <div className="text-4xl font-bold text-green-400">{analytics?.activeVisitors || 0}</div>
                            <div className="text-xs text-green-500/50 mt-2 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live
                            </div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                            <div className="text-slate-400 text-sm mb-1">Total Page Views</div>
                            <div className="text-4xl font-bold text-slate-900">{analytics?.totalViews || 0}</div>
                        </div>
                    </div>

                    {/* Live Event Feed */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="text-blue-400">⚡</span> Recent Activity
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="text-xs uppercase bg-slate-950/50 text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Time</th>
                                        <th className="px-4 py-3">Event</th>
                                        <th className="px-4 py-3">Visitor</th>
                                        <th className="px-4 py-3 rounded-r-lg">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {analytics?.recentEvents?.map((evt: any) => (
                                        <tr key={evt.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                                {new Date(evt.createdAt).toLocaleTimeString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${evt.type === 'page_view' ? 'bg-blue-500/10 text-blue-400' :
                                                    evt.type === 'click' ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-700 text-slate-300'
                                                    }`}>
                                                    {evt.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">{evt.visitorId.slice(0, 8)}...</td>
                                            <td className="px-4 py-3 max-w-xs truncate" title={JSON.stringify(evt.data)}>
                                                {evt.data?.url ? new URL(evt.data.url).pathname : JSON.stringify(evt.data)}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!analytics?.recentEvents || analytics.recentEvents.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-slate-600">
                                                No events recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}
