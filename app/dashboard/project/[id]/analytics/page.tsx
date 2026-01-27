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

    return (
        <div className="dashboard-content">
            {/* Header */}
            <div className="mb-8">
                <Link href={`/dashboard/project/${projectId}`} className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1 mb-4">
                    <i className="fas fa-arrow-left"></i> Back to Project
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">
                    📊 Analytics Dashboard
                </h1>
                <p className="text-gray-500 mt-2">
                    Insights into your AI assistant's performance
                </p>
            </div>

            {loading ? (
                <div className="text-center py-16 text-gray-500">
                    <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                    <p>Loading analytics...</p>
                </div>
            ) : error ? (
                <div className="text-center py-16 text-red-500">
                    <i className="fas fa-exclamation-circle text-2xl mb-2"></i>
                    <p>Error: {error}</p>
                </div>
            ) : analytics ? (
                <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="create-card p-6 border-l-4 border-l-green-500">
                            <div className="text-gray-500 text-sm mb-1 uppercase font-semibold">Active Visitors (5m)</div>
                            <div className="text-4xl font-bold text-gray-900">{analytics?.activeVisitors || 0}</div>
                            <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live Now
                            </div>
                        </div>
                        <div className="create-card p-6 border-l-4 border-l-blue-500">
                            <div className="text-gray-500 text-sm mb-1 uppercase font-semibold">Total Page Views</div>
                            <div className="text-4xl font-bold text-gray-900">{analytics?.totalViews || 0}</div>
                        </div>
                    </div>

                    {/* Live Event Feed */}
                    <div className="create-card">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                                <i className="fas fa-bolt text-yellow-500"></i> Recent Activity
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Time</th>
                                        <th className="px-6 py-4">Event</th>
                                        <th className="px-6 py-4">Visitor</th>
                                        <th className="px-6 py-4">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {analytics?.recentEvents?.map((evt: any) => (
                                        <tr key={evt.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                                                {new Date(evt.createdAt).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${evt.type === 'page_view' ? 'bg-blue-100 text-blue-800' :
                                                        evt.type === 'click' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {evt.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                                {evt.visitorId.slice(0, 8)}...
                                            </td>
                                            <td className="px-6 py-4 max-w-xs truncate text-gray-500" title={JSON.stringify(evt.data)}>
                                                {evt.data?.url ? new URL(evt.data.url).pathname : JSON.stringify(evt.data)}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!analytics?.recentEvents || analytics.recentEvents.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
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
