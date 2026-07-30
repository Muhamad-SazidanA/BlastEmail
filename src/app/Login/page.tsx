"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUserAction } from "@/app/actions/users";

export default function LoginPage() {
  const router = useRouter();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const session = localStorage.getItem("blastmail_session");
    if (session) {
      router.push("/Dashboard");
    }
  }, [router]);

  // Form submit handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginUserAction({ email, password });
      if (res.success && res.session) {
        setSuccess(true);
        localStorage.setItem("blastmail_session", JSON.stringify(res.session));
        setTimeout(() => {
          router.push("/Dashboard");
        }, 1000);
      } else {
        setError(res.error ?? "Email atau password yang Anda masukkan salah.");
        setLoading(false);
      }
    } catch (err) {
      setError("Gagal terhubung ke database.");
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="form-header">
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h2 className="form-title">Masuk ke BlastMail</h2>
          <p className="form-subtitle">Kelola campaign blast email dengan cepat dan efisien</p>
        </div>

        {error && (
          <div className="error-alert">
            <span className="alert-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <span className="alert-text">{error}</span>
          </div>
        )}

        {success && (
          <div className="success-alert">
            <span className="alert-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="alert-text">Login berhasil! Mengalihkan...</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Alamat Email</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                id="email-input"
                type="text"
                required
                placeholder="nama@email.com"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || success}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="password-input"
                type="password"
                required
                placeholder="••••••••"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || success}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading || success}
          >
            {loading || success ? (
              <span className="spinner"></span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                Masuk ke Dashboard
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            )}
          </button>
        </form>
      </div>

      <style>{`
        .login-wrapper {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 50% 50%, #f8fafc 0%, #f1f5f9 100%);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          overflow: hidden;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
        }

        .form-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #006cb7;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px auto;
        }

        .form-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .form-subtitle {
          font-size: 0.82rem;
          color: #64748b;
          margin: 8px 0 0 0;
          line-height: 1.4;
        }

        .error-alert, .success-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 500;
          margin-bottom: 24px;
        }

        .error-alert {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .success-alert {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #059669;
        }

        .alert-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #475569;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          padding: 10px 14px 10px 38px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.9rem;
          color: #0f172a;
          outline: none;
          transition: all 0.15s ease-in-out;
        }

        .form-input::placeholder {
          color: #94a3b8;
        }

        .form-input:focus {
          border-color: #006cb7;
          box-shadow: 0 0 0 3px rgba(0, 108, 183, 0.12);
        }

        .submit-btn {
          margin-top: 12px;
          padding: 10px;
          background: #006cb7;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease-in-out;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .submit-btn:hover:not(:disabled) {
          background: #005fa3;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #ffffff;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
