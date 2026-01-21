"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const togglePassword = () => {
        setShowPassword(!showPassword);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push("/dashboard");
            } else {
                setError(data.error || "Registration failed");
            }
        } catch (err) {
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
                            <div className="login-feature-icon">🚀</div>
                            <div>
                                <h4>Start for Free</h4>
                                <p>No credit card required to get started</p>
                            </div>
                        </div>
                        <div className="login-feature-item">
                            <div className="login-feature-icon">📈</div>
                            <div>
                                <h4>Grow with AI</h4>
                                <p>Scale your support without adding more agents</p>
                            </div>
                        </div>
                        <div className="login-feature-item">
                            <div className="login-feature-icon">🔒</div>
                            <div>
                                <h4>Secure & Private</h4>
                                <p>Your data is encrypted and safe with us</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="login-right">
                    <div className="login-card">
                        <div className="login-card-header">
                            <h2>Create Account</h2>
                            <p>Join thousands of businesses using Snowky</p>
                        </div>

                        <form className="login-form" onSubmit={handleRegister}>
                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                    <span className="block sm:inline">{error}</span>
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">
                                    <i className="fas fa-user"></i>
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="John Doe"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

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
                                        placeholder="Create a strong password"
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
                                        ></i>
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="checkbox-label" style={{ fontSize: "0.85rem" }}>
                                    <input type="checkbox" className="checkbox-input" required />
                                    <span className="checkbox-custom"></span>
                                    I agree to the <a href="#" className="text-primary hover:underline ml-1">Terms of Service</a> & <a href="#" className="text-primary hover:underline ml-1">Privacy Policy</a>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary login-btn"
                                disabled={isLoading}
                            >
                                <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
                                {!isLoading && <i className="fas fa-arrow-right"></i>}
                            </button>
                        </form>



                        <div className="login-footer-text">
                            Already have an account?{" "}
                            <Link href="/auth/login">Sign in</Link>
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
