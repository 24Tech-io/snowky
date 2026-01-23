"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [resetLink, setResetLink] = useState(""); // For dev mode

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setResetLink("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to send reset email");
            }

            setMessage(data.message);
            if (data.resetLink) {
                setResetLink(data.resetLink); // Dev mode only
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-background">
                <div className="auth-bg-gradient"></div>
                <div className="auth-bg-pattern"></div>

                <div className="auth-side-content">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">🤖</div>
                        <h1 className="auth-logo-text">Snowky</h1>
                        <p className="auth-logo-subtitle">AI-Powered Chat Widget</p>
                    </div>

                    <div className="auth-features">
                        <div className="auth-feature-item">
                            <div className="auth-feature-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                <i className="fas fa-lock"></i>
                            </div>
                            <div className="auth-feature-content">
                                <h3>Secure Reset</h3>
                                <p>Time-limited password reset link sent to your email</p>
                            </div>
                        </div>
                        <div className="auth-feature-item">
                            <div className="auth-feature-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                <i className="fas fa-envelope"></i>
                            </div>
                            <div className="auth-feature-content">
                                <h3>Email Verification</h3>
                                <p>We&apos;ll send a reset link to your registered email</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-form-container">
                <div className="auth-form-wrapper">
                    <div className="auth-form-header">
                        <h2>Forgot Password</h2>
                        <p>Enter your email to receive a password reset link</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="auth-success" style={{
                            background: '#ecfdf5',
                            border: '1px solid #10b981',
                            color: '#059669',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            fontSize: '0.9rem'
                        }}>
                            <i className="fas fa-check-circle" style={{ marginRight: '0.5rem' }}></i>
                            {message}
                        </div>
                    )}

                    {resetLink && (
                        <div style={{
                            background: '#fef3c7',
                            border: '1px solid #f59e0b',
                            color: '#92400e',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            fontSize: '0.85rem'
                        }}>
                            <strong>Dev Mode:</strong> Reset link (SMTP not configured):<br />
                            <Link href={resetLink} style={{ color: '#6366f1', wordBreak: 'break-all' }}>
                                {resetLink}
                            </Link>
                        </div>
                    )}

                    {!message && (
                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="email">
                                    <i className="fas fa-envelope"></i>Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    className="form-input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary login-btn"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        Send Reset Link <i className="fas fa-paper-plane"></i>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="auth-footer">
                        <p>
                            Remember your password?{" "}
                            <Link href="/auth/login">Sign in</Link>
                        </p>
                    </div>

                    <Link href="/" className="auth-back-link">
                        <i className="fas fa-arrow-left"></i> Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
