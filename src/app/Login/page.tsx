"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { loginUserAction } from "@/app/actions/users";

// Definisi tipe untuk partikel
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  char: string;
}

// Definisi tipe untuk partikel hasil ledakan (click)
interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

export default function LoginPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // State form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Mouse position ref untuk interaktivitas
  const mouseRef = useRef<{ x: number | null; y: number | null; active: boolean }>({
    x: null,
    y: null,
    active: false,
  });

  // Redirect jika sudah login
  useEffect(() => {
    const session = localStorage.getItem("blastmail_session");
    if (session) {
      router.push("/Dashboard");
    }
  }, [router]);

  // Efek Animasi Canvas (Gravity Physics + Particle Net)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    // Inisialisasi partikel
    const particles: Particle[] = [];
    const sparks: Spark[] = [];
    const particleCount = Math.min(60, Math.floor((width * height) / 12000));
    const letters = ["@", "B", "L", "A", "S", "T", "M", "A", "I", "L"];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.8, // Mulai dari agak atas
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 3 + 2,
        color: i % 4 === 0 ? "#38bdf8" : i % 4 === 1 ? "#006cb7" : i % 4 === 2 ? "#6366f1" : "#a855f7",
        char: letters[Math.floor(Math.random() * letters.length)],
      });
    }

    // Handle resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || 800;
      height = canvas.height = canvas.parentElement?.clientHeight || 600;
    };
    window.addEventListener("resize", handleResize);

    // Animasi loop
    const animate = () => {
      ctx.fillStyle = "rgba(11, 19, 41, 0.2)"; // Trail effect
      ctx.fillRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const gravitySourceX = mouse.x;
      const gravitySourceY = mouse.y;

      // 1. Update & Draw Sparks (ledakan klik)
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.15; // Gravitasi alami ke bawah untuk percikan
        s.alpha -= s.decay;

        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (s.alpha <= 0) {
          sparks.splice(i, 1);
        }
      }

      // 2. Update & Draw main particles
      particles.forEach((p, idx) => {
        // Gravitasi alami (sedikit tarikan ke bawah)
        p.vy += 0.02;

        // Tarikan gravitasi ke mouse jika mouse aktif di dalam area
        if (mouse.active && gravitySourceX !== null && gravitySourceY !== null) {
          const dx = gravitySourceX - p.x;
          const dbY = gravitySourceY - p.y;
          const dist = Math.sqrt(dx * dx + dbY * dbY);
          
          if (dist < 300) {
            // Gaya tarik gravitasi (semakin dekat semakin kuat tarikannya)
            const force = (300 - dist) / 3200;
            p.vx += (dx / dist) * force;
            p.vy += (dbY / dist) * force;
          }
        }

        // Terapkan kecepatan ke posisi
        p.x += p.vx;
        p.y += p.vy;

        // Gesekan udara (damping)
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Batasan layar (memantul di bawah dan sisi kiri/kanan)
        if (p.x < 0) {
          p.x = 0;
          p.vx *= -0.7;
        } else if (p.x > width) {
          p.x = width;
          p.vx *= -0.7;
        }

        if (p.y > height) {
          p.y = height;
          p.vy *= -0.6; // Pantulan bawah lebih lambat karena menyerap energi
          p.vx *= 0.8;  // Gesekan lantai
        } else if (p.y < 0) {
          p.y = 0;
          p.vy *= -0.7;
        }

        // Gambar partikel
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow

        // Gambar huruf melayang tipis di atas beberapa partikel
        if (idx % 3 === 0) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText(p.char, p.x + 8, p.y + 4);
        }
      });

      // 3. Gambar garis penghubung antar partikel (efek rasi bintang / network)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            const alpha = (100 - dist) / 100 * 0.15;
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // 4. Gambar visualizer gravitasi jika mouse aktif
      if (mouse.active && gravitySourceX !== null && gravitySourceY !== null) {
        ctx.beginPath();
        ctx.arc(gravitySourceX, gravitySourceY, 20, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(gravitySourceX, gravitySourceY, 40, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Handler interaksi mouse pada Canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current.active = false;
  };

  // Efek klik canvas - menimbulkan ledakan gravitasi
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Spawning sparks
    const colors = ["#38bdf8", "#006cb7", "#6366f1", "#a855f7", "#ffffff", "#f59e0b"];
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 3;
      sparks.push({
        x: clickX,
        y: clickY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.02 + 0.015,
      });
    }
  };

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
      {/* KIRI: Area Interaktif Gravitasi */}
      <div 
        className="gravity-panel"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleCanvasClick}
      >
        <canvas ref={canvasRef} className="gravity-canvas" />
        
        {/* Konten Hiasan Text */}
        <div className="gravity-content">
          <div className="brand-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            BlastMail Engine
          </div>
          <h1 className="gravity-title">Interactive Gravity Field</h1>
          <p className="gravity-desc">
            Arahkan kursor Anda ke area ini untuk menarik partikel data. Klik di mana saja untuk memicu gelombang impuls gravitasi!
          </p>
          <div className="node-stats">
            <div className="stat-item">
              <span className="stat-dot green"></span>
              <span>Gravity Active</span>
            </div>
            <div className="stat-item">
              <span className="stat-dot blue"></span>
              <span>60Hz Refresh Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* KANAN: Form Card */}
      <div className="form-panel">
        <div className="form-container">
          <div className="form-header">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h2 className="form-title">Login ke BlastMail</h2>
            <p className="form-subtitle">Selamat datang kembali! Masuk untuk mulai mengelola campaign blast email Anda.</p>
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
              <span className="alert-text">Login berhasil! Mengalihkan ke Dashboard...</span>
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
                  placeholder="Masukkan email Anda"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || success}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 18 }}>
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
                  placeholder="Masukkan password Anda"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || success}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`submit-btn ${loading || success ? "loading" : ""}`}
              disabled={loading || success}
            >
              {loading ? (
                <span className="spinner"></span>
              ) : success ? (
                "Masuk..."
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  Masuk ke Akun
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              )}
            </button>
          </form>

        </div>
      </div>

      {/* Styled JSX Stylesheet */}
      <style>{`
        .login-wrapper {
          height: 100vh;
          width: 100vw;
          display: flex;
          background: #f1f5f9;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          overflow: hidden;
        }

        /* LEFT SIDEBAR: Gravity Interactive Canvas */
        .gravity-panel {
          width: 55%;
          height: 100vh;
          position: relative;
          background: #0b1329;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 48px;
          cursor: crosshair;
          overflow: hidden;
        }

        .gravity-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .gravity-content {
          position: relative;
          z-index: 2;
          max-width: 500px;
          color: #fff;
          pointer-events: none; /* Agar klik tembus ke canvas */
          user-select: none;
        }

        .brand-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 99px;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: #38bdf8;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .gravity-title {
          font-size: 2.2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.15;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #ffffff 40%, #93c5fd);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .gravity-desc {
          font-size: 0.95rem;
          color: #94a3b8;
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .node-stats {
          display: flex;
          gap: 16px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .stat-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .stat-dot.green { background: #10b981; box-shadow: 0 0 8px #10b981; }
        .stat-dot.blue { background: #38bdf8; box-shadow: 0 0 8px #38bdf8; }

        /* RIGHT SIDEBAR: Form Card */
        .form-panel {
          width: 45%;
          height: 100vh;
          background: linear-gradient(145deg, #f8fafc, #eff6ff);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          position: relative;
          overflow: hidden;
        }

        .form-container {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02);
          transition: transform 0.2s;
        }

        .form-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .logo-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #006cb7, #2563eb);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0 auto 16px auto;
          box-shadow: 0 4px 12px rgba(37,99,235,0.25);
        }

        .form-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .form-subtitle {
          font-size: 0.8rem;
          color: #64748b;
          margin-top: 6px;
          line-height: 1.4;
        }

        /* Alerts */
        .error-alert, .success-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 500;
          margin-bottom: 20px;
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
          font-size: 1rem;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Inputs & Form */
        .login-form {
          display: flex;
          flex-direction: column;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.9rem;
          color: #0f172a;
          outline: none;
          transition: all 0.2s;
        }

        .form-input:focus {
          border-color: #006cb7;
          box-shadow: 0 0 0 3px rgba(0,108,183,0.08);
          background: #fff;
        }

        .submit-btn {
          margin-top: 24px;
          padding: 12.5px;
          background: #006cb7;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,108,183,0.25);
        }

        .submit-btn:hover:not(:disabled) {
          background: #005fa3;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0,108,183,0.35);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Spinner */
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 900px) {
          .gravity-panel {
            display: none;
          }
          .form-panel {
            width: 100%;
            height: 100vh;
            padding: 24px;
          }
          .form-container {
            max-width: 420px;
            width: 100%;
            padding: 32px;
          }
        }
      `}</style>
    </div>
  );
}
