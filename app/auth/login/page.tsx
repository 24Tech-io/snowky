"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const togglePassword = () => {
        setShowPassword(!showPassword);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push("/dashboard");
            } else {
                setError(data.error || "Login failed");
            }
        } catch (_err) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page login-page">
            <div className="login-bg">
                <div className="login-blob login-blob-1"></div>
                <div className="login-blob login-blob-2"></div>
            </div>

            <div className="login-container">
                <div className="login-left">
                    <div className="login-brand">
                        <div className="yeti-logo">
                            <div className="yeti-container">
                                <span className="yeti-body">🐻‍❄️</span>
                            </div>
                            <div className="logo-snowflakes">
                                <span className="logo-snowflake">❄</span>
                                <span className="logo-snowflake">❅</span>
                                <span className="logo-snowflake">❆</span>
                                <span className="logo-snowflake">✧</span>
                            </div>
                        </div>
                        <h1 className="login-brand-title">Snowky</h1>
                        <p className="login-brand-subtitle">AI-Powered Chat Widget</p>
                    </div>
                    <div className="login-features-list">
                        <div className="login-feature-item">
                            <div className="login-feature-icon">🤖</div>
                            <div>
                                <h4>AI-Powered Responses</h4>
                                <p>Human-like conversations powered by Gemini AI</p>
                            </div>
                        </div>
                        <div className="login-feature-item">
                            <div className="login-feature-icon">📄</div>
                            <div>
                                <h4>Train with Your Data</h4>
                                <p>Upload documents to customize your bot&apos;s knowledge</p>
                            </div>
                        </div>
                        <div className="login-feature-item">
                            <div className="login-feature-icon">⚡</div>
                            <div>
                                <h4>Deploy in Minutes</h4>
                                <p>Just copy-paste one snippet to go live</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="login-right">
                    <div className="login-card">
                        <div className="login-card-header">
                            <h2>Welcome back</h2>
                            <p>Sign in to manage your chat widgets</p>
                        </div>

                        <form className="login-form" onSubmit={handleLogin}>
                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                    <span className="block sm:inline">{error}</span>
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">
                                    <i className="fas fa-envelope"></i>
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="you@company.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <i className="fas fa-lock"></i>
                                    Password
                                </label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="form-input"
                                        id="passwordInput"
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={togglePassword}
                                    >
                                        <i
                                            className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                                            id="passwordIcon"
                                        ></i>
                                    </button>
                                </div>
                            </div>

                            <div className="form-options">
                                <label className="checkbox-label">
                                    <input type="checkbox" className="checkbox-input" />
                                    <span className="checkbox-custom"></span>
                                    Remember me
                                </label>
                                <Link href="/auth/forgot-password" className="forgot-link">
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary login-btn"
                                disabled={isLoading}
                            >
                                <span>{isLoading ? "Signing In..." : "Sign In"}</span>
                                {!isLoading && <i className="fas fa-arrow-right"></i>}
                            </button>
                        </form>



                        <div className="login-footer-text">
                            Don&apos;t have an account?{" "}
                            <Link href="/auth/register">Sign up free</Link>
                        </div>
                    </div>

                    <Link href="/" className="back-to-home">
                        <i className="fas fa-arrow-left"></i>
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
