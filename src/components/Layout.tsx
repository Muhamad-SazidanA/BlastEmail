"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// ── Icons (inline SVG — no external deps) ───────────────────────────────────

const IcDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IcCreate = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IcBlast = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IcUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IcSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IcBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

const IcMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IcClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IcLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IcProgress = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IcList = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

// ── Nav Items ───────────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

/** Menu yang bisa diakses oleh USER dan ADMIN */
const USER_NAV: NavItem[] = [
  { label: "Dashboard",       href: "/Dashboard",         icon: <IcDashboard /> },
  { label: "Data Campaign",   href: "/DataCampaign",      icon: <IcList />      },
  { label: "Create Campaign", href: "/CreateCampaign",   icon: <IcCreate />    },
  { label: "Bot Progress",     href: "/BotProgress",       icon: <IcProgress />  },
];

/** Menu tambahan khusus ADMIN */
const ADMIN_ONLY_NAV: NavItem[] = [
  { label: "Create User",     href: "/admin/create-user", icon: <IcUser />      },
];

// ── Props ───────────────────────────────────────────────────────────────────

interface LayoutProps {
  children: React.ReactNode;
  /** Nama yang ditampilkan di topbar. Default: "User" */
  userName?: string;
  /** Email yang ditampilkan di topbar */
  userEmail?: string;
  /** Foto profil URL */
  userAvatar?: string;
  /** Role menentukan menu mana yang tampil */
  role?: "user" | "admin";
  /** Callback untuk logout — jika tidak diberikan, tombol tidak tampil */
  onLogout?: () => void;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function Layout({
  children,
  userName = "User",
  userEmail = "",
  userAvatar,
  role = "user",
  onLogout,
}: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [localUser, setLocalUser] = useState<{ name: string; email: string; role: "user" | "admin" } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem("blastmail_session");
    if (!session) {
      router.push("/Login");
      return;
    }
    try {
      const parsed = JSON.parse(session);
      setLocalUser(parsed);
      
      // Role Authorization Check
      // If user tries to access admin pages but their role is not admin
      if (parsed.role !== "admin" && pathname.startsWith("/admin")) {
        router.push("/Dashboard");
        return;
      }
    } catch (e) {
      localStorage.removeItem("blastmail_session");
      router.push("/Login");
      return;
    }
    setCheckingAuth(false);
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem("blastmail_session");
    router.push("/Login");
  };

  const displayUserName = localUser ? localUser.name : userName;
  const displayUserEmail = localUser ? localUser.email : userEmail;
  const displayRole = localUser ? localUser.role : role;
  const activeLogout = onLogout || handleLogout;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          borderRadius: 8,
          fontSize: "0.875rem",
          fontWeight: 600,
          textDecoration: "none",
          marginBottom: 4,
          transition: "all 0.15s",
          ...(active
            ? {
                background: "#006cb7",
                color: "#fff",
                boxShadow: "0 2px 8px rgba(0,108,183,0.3)",
              }
            : {
                color: "#94a3b8",
              }),
        }}
        className={active ? "" : "sidebar-link-hover"}
      >
        <span style={{ color: active ? "#fff" : "#64748b", display: "flex" }}>
          {item.icon}
        </span>
        {item.label}
      </Link>
    );
  };

  if (checkingAuth) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#111c24",
          color: "#fff",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#006cb7" strokeWidth={3.5} className="spin">
          <circle cx="12" cy="12" r="10" strokeOpacity={0.2} />
          <path d="M12 2a10 10 0 0110 10" />
        </svg>
        <span style={{ marginTop: 12, fontSize: "0.85rem", color: "#94a3b8" }}>Memeriksa sesi...</span>
        <style>{`
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#f1f5f9",
        color: "#1e293b",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Mobile Overlay ── */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(0,0,0,0.45)",
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. LEFT SIDEBAR                                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 210,
          background: "#111c24",
          color: "#cbd5e1",
          display: "flex",
          flexDirection: "column",
          zIndex: 50,
          transform: isSidebarOpen ? "translateX(0)" : undefined,
          transition: "transform 0.3s ease",
          flexShrink: 0,
        }}
      >
        {/* Logo / Header */}
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            borderBottom: "1px solid #1e293b",
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: "0.95rem",
                color: "#fff",
                letterSpacing: "-0.01em",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              BlastMail
            </div>
            <div
              style={{
                fontSize: "0.65rem",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {displayRole === "admin" ? "Admin Panel" : "User Panel"}
            </div>
          </div>

        </div>

        {/* Section label + nav items */}
        <nav style={{ flex: 1, padding: "20px 12px", overflowY: "auto" }}>
          {/* User section */}
          <div
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              padding: "0 8px",
              marginBottom: 8,
            }}
          >
            Menu
          </div>

          {USER_NAV.map(renderNavItem)}

          {/* Admin badge if admin */}
          {displayRole === "admin" && (
            <>
              <div
                style={{
                  marginTop: 16,
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: "0 8px",
                  marginBottom: 8,
                }}
              >
                Admin Only
              </div>
              {ADMIN_ONLY_NAV.map(renderNavItem)}
            </>
          )}
        </nav>

        {/* Sidebar Footer: Logout */}
        <div
          style={{
            padding: "12px",
            borderTop: "1px solid #1e293b",
          }}
        >
          {activeLogout && (
            <button
              onClick={activeLogout}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#94a3b8",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
              }}
              className="logout-btn-hover"
            >
              <span style={{ display: "flex", color: "#64748b" }}>
                <IcLogout />
              </span>
              Logout
            </button>
          )}
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* RIGHT AREA (topbar + content + footer)                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          marginLeft: 210,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          minWidth: 0,
        }}
      >
        {/* ── 2. TOP HEADER ── */}
        <header
          style={{
            height: 64,
            background: "#fff",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            position: "sticky",
            top: 0,
            zIndex: 30,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {/* Left: space */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }} />

          {/* Right: bell + profile */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              style={{
                position: "relative",
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                padding: 6,
                borderRadius: "50%",
                display: "flex",
              }}
              aria-label="Notifications"
            >
              <IcBell />
              <span
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  width: 8,
                  height: 8,
                  background: "#ef4444",
                  borderRadius: "50%",
                  border: "2px solid #fff",
                }}
              />
            </button>

            <div style={{ width: 1, height: 24, background: "#e2e8f0" }} />

            {/* Profile */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    lineHeight: 1.2,
                  }}
                >
                  {displayUserName}
                </div>
                {displayUserEmail && (
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                    {displayUserEmail}
                  </div>
                )}
              </div>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: "#e2e8f0",
                  border: "2px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "#006cb7",
                  flexShrink: 0,
                }}
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={displayUserName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  displayUserName.charAt(0).toUpperCase()
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── 3. MAIN CONTENT ── */}
        <main
          style={{
            flex: 1,
            padding: "28px 32px",
            overflowY: "auto",
          }}
        >
          {children}
        </main>

        {/* ── 4. FOOTER ── */}
        <footer
          style={{
            background: "#fff",
            borderTop: "1px solid #e2e8f0",
            padding: "14px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            color: "#94a3b8",
          }}
        >
          <span>© 2026 BlastMail. All rights reserved.</span>
          <div style={{ display: "flex", gap: 16 }}>
            <a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>
              Privacy Policy
            </a>
            <a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>
              Terms of Service
            </a>
          </div>
        </footer>
      </div>

      {/* Hover styles injected globally */}
      <style>{`
        .sidebar-link-hover:hover {
          background: #1e293b !important;
          color: #fff !important;
        }
        .sidebar-link-hover:hover span { color: #94a3b8 !important; }
        .logout-btn-hover:hover {
          background: rgba(239,68,68,0.08) !important;
          color: #f87171 !important;
        }
        .logout-btn-hover:hover span { color: #f87171 !important; }
        @media (min-width: 1024px) {
          aside { transform: translateX(0) !important; }
        }
      `}</style>
    </div>
  );
}
