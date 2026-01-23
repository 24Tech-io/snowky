"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to reset password");
            }

            setSuccess(true);
            setTimeout(() => {
                router.push("/auth/login");
            }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="auth-form-wrapper">
                <div className="auth-form-header">
                    <h2>Invalid Link</h2>
                    <p>This password reset link is invalid or has expired.</p>
                </div>
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <Link href="/auth/forgot-password" className="btn btn-primary">
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-form-wrapper">
            <div className="auth-form-header">
                <h2>Reset Password</h2>
                <p>Enter your new password below</p>
            </div>

            {error && (
                <div className="auth-error">
                    {error}
                </div>
            )}

            {success ? (
                <div style={{
                    background: '#ecfdf5',
                    border: '1px solid #10b981',
                    color: '#059669',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                    <h3 style={{ marginBottom: '0.5rem' }}>Password Reset!</h3>
                    <p style={{ marginBottom: '1rem' }}>Your password has been successfully reset.</p>
                    <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                        Redirecting to login...
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="password">
                            <i className="fas fa-lock"></i>New Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="form-input"
                            placeholder="Enter new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">
                            <i className="fas fa-lock"></i>Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="form-input"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
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
                                Resetting...
                            </>
                        ) : (
                            <>
                                Reset Password <i className="fas fa-check"></i>
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
    );
}

export default function ResetPasswordPage() {
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
                                <i className="fas fa-shield-alt"></i>
                            </div>
                            <div className="auth-feature-content">
                                <h3>Secure Password</h3>
                                <p>Your new password is encrypted and stored securely</p>
                            </div>
                        </div>
                        <div className="auth-feature-item">
                            <div className="auth-feature-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                <i className="fas fa-key"></i>
                            </div>
                            <div className="auth-feature-content">
                                <h3>Strong Protection</h3>
                                <p>Use a mix of letters, numbers, and symbols</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-form-container">
                <Suspense fallback={<div className="auth-form-wrapper"><p>Loading...</p></div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
