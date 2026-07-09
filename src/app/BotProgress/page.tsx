"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { getRobotStatusesAction } from "@/app/actions/robots";

interface RobotStatusData {
  id: number;
  robotName: string;
  senderEmail: string;
  status: string; // IDLE | RUNNING | ERROR
  currentCampaign: string | null;
  totalTarget: number;
  totalSent: number;
  totalFailed: number;
  lastError: string | null;
}

export default function BotProgressPage() {
  const [robots, setRobots] = useState<RobotStatusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to load robot statuses
  const fetchStatuses = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const result = await getRobotStatusesAction();
      if (result.success && result.data) {
        setRobots(result.data as RobotStatusData[]);
      } else {
        setError(result.error ?? "Gagal memuat status robot.");
      }
    } catch (err) {
      setError("Gagal terhubung ke database.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load on mount
  useEffect(() => {
    fetchStatuses(true);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchStatuses(false);
  };

  // Helper: Calculate progress percentage
  const calculateProgress = (sent: any, failed: any, target: any) => {
    const s = Number(sent || 0);
    const f = Number(failed || 0);
    const t = Number(target || 0);
    const totalProcessed = s + f;
    if (!t || t === 0) return 0;
    const pct = (totalProcessed / t) * 100;
    return Math.min(Math.round(pct), 100);
  };

  return (
    <Layout
      userName="Admin"
      userEmail="admin@blastmail.com"
      role="admin"
    >
      {/* ── Page Header ── */}
      <div className="cc-header bp-header-row">
        <div>
          <nav className="cc-breadcrumb">
            <span>Campaigns</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="cc-breadcrumb-current">Bot Progress</span>
          </nav>
          <h1 className="cc-page-title">Bot Mailing Progress</h1>
          <p className="cc-page-sub">Pantau aktivitas pengiriman email masal oleh robot pengirim secara langsung.</p>
        </div>

        {/* Controls: Manual refresh only */}
        <div className="bp-header-controls">
          <button
            type="button"
            className="btn btn-blue bp-refresh-btn"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              className={isRefreshing ? "spin" : ""}
              style={{ marginRight: "4px" }}
            >
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            {isRefreshing ? "Memperbarui..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="cc-alert cc-alert-error">
          <span style={{ fontSize: "1.1rem" }}>⚠️</span> {error}
        </div>
      )}

      {/* ── Main Status Card and Table (Full Width) ── */}
      <div className="cc-card bp-table-card">
        
        {/* Card Header (Matches CreateCampaign Style) */}
        <div className="cc-card-head">
          <div className="cc-card-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="15" x2="8" y2="17" />
              <line x1="16" y1="15" x2="16" y2="17" />
            </svg>
          </div>
          <div>
            <div className="cc-card-title">Robot Status List</div>
            <div className="cc-card-sub">Daftar status bot pengirim aktif dalam database</div>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-spinner-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006cb7" strokeWidth={3} className="spin">
              <circle cx="12" cy="12" r="10" strokeOpacity={0.2} />
              <path d="M12 2a10 10 0 0110 10" />
            </svg>
            <span className="loading-text">Memuat status robot pengirim...</span>
          </div>
        ) : robots.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada data status robot pengirim di database.</p>
          </div>
        ) : (
          <div className="bp-table-responsive">
            <table className="bp-table">
              <thead>
                <tr>
                  <th>Robot Info</th>
                  <th style={{ textAlign: "center" }} className="highlight-column">Status</th>
                  <th style={{ textAlign: "center" }}>Current Campaign</th>
                  <th style={{ textAlign: "center" }}>Progress</th>
                  <th style={{ textAlign: "center" }}>Target</th>
                  <th style={{ textAlign: "center" }} className="highlight-column">Sent</th>
                  <th style={{ textAlign: "center" }}>Failed</th>
                </tr>
              </thead>
              <tbody>
                {robots.map((bot) => {
                  const pct = calculateProgress(bot.totalSent, bot.totalFailed, bot.totalTarget);
                  const isError = bot.status === "ERROR";
                  const isRunning = bot.status === "RUNNING";

                  return (
                    <React.Fragment key={bot.id}>
                      <tr className={isError ? "row-error" : ""}>
                        {/* Stacked Name & Email */}
                        <td style={{ minWidth: 200 }}>
                          <div className="bot-info-cell">
                            <span className="bot-name font-semibold text-dark">{bot.robotName}</span>
                            <span className="bot-email">{bot.senderEmail}</span>
                          </div>
                        </td>
                        
                        {/* Status (Highlighted & Centered) */}
                        <td className="highlight-cell" style={{ textAlign: "center" }}>
                          <span className={`status-pill pill-${bot.status.toLowerCase()}`}>
                            {isRunning && <span className="pulse-dot"></span>}
                            {bot.status}
                          </span>
                        </td>
                        
                        {/* Current Campaign (Centered) */}
                        <td className="current-campaign-cell" style={{ textAlign: "center" }}>
                          {bot.currentCampaign ? (
                            <code className="campaign-code">{bot.currentCampaign}</code>
                          ) : (
                            <span className="muted-text">—</span>
                          )}
                        </td>
                        
                        {/* Progress (Centered) */}
                        <td style={{ minWidth: 180, textAlign: "center" }}>
                          <div className="progress-cell-wrapper" style={{ justifyContent: "center" }}>
                            <div className="progress-bar-bg">
                              <div
                                className={`progress-bar-fill fill-${bot.status.toLowerCase()}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="progress-pct-text">{pct}%</span>
                          </div>
                        </td>
                        
                        {/* Target */}
                        <td style={{ textAlign: "center" }} className="font-semibold">{bot.totalTarget}</td>
                        
                        {/* Sent (Highlighted) */}
                        <td style={{ textAlign: "center", color: "#166534" }} className="font-semibold highlight-cell-val">
                          {bot.totalSent}
                        </td>
                        
                        {/* Failed */}
                        <td style={{ textAlign: "center", color: "#991b1b" }} className="font-semibold">{bot.totalFailed}</td>
                      </tr>

                      {/* ── Error Details Sub-row ── */}
                      {isError && bot.lastError && (
                        <tr className="error-detail-row">
                          <td colSpan={7}>
                            <div className="error-alert-box animate-slide-down">
                              <div className="error-alert-title">
                                <span>❌</span> Detail Error ({bot.robotName}):
                              </div>
                              <pre className="error-alert-content">{bot.lastError}</pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Page Custom Styles ── */}
      <style>{`
        /* ── Header (Matches CreateCampaign & BlastEmail) ── */
        .cc-header { margin-bottom: 24px; }
        .cc-breadcrumb {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px;
        }
        .cc-breadcrumb-current { color: #64748b; }
        .cc-page-title {
          font-size: 1.5rem; font-weight: 800; color: #0f172a;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .cc-page-sub { font-size: 0.8rem; color: #94a3b8; margin-top: 2px; }

        /* Header styling */
        .bp-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
        }
        .bp-header-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .bp-refresh-btn {
          padding: 10px 18px;
          font-size: 0.82rem;
          border-radius: 8px;
        }

        /* Card Container (Standard CreateCampaign Card) */
        .cc-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .cc-card-head {
          display: flex; align-items: center; gap: 12px;
          padding-bottom: 20px; margin-bottom: 20px;
          border-bottom: 1px solid #f1f5f9;
        }
        .cc-card-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: #2563eb; flex-shrink: 0;
        }
        .cc-card-title { font-size: 0.95rem; font-weight: 700; color: #0f172a; }
        .cc-card-sub   { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }

        /* Table Specific Card adjustments */
        .bp-table-card {
          padding: 24px 0 0 0; /* Remove side padding to let table span full width */
          overflow: hidden;
        }
        .bp-table-card .cc-card-head {
          margin-left: 24px;
          margin-right: 24px;
        }

        /* Table styling */
        .bp-table-responsive {
          width: 100%;
          overflow-x: auto;
        }
        .bp-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.84rem;
        }
        .bp-table th {
          background: #f8fafc;
          padding: 14px 24px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.06em;
          border-bottom: 1px solid #e2e8f0;
        }
        
        /* Highlighting status and sent columns */
        .bp-table th.highlight-column {
          background: #f0f7ff;
          color: #006cb7;
          border-bottom: 2px solid #93c5fd;
        }
        .highlight-cell {
          background-color: #fafcfe;
          border-left: 1px solid #eff6ff;
          border-right: 1px solid #eff6ff;
        }
        .highlight-cell-val {
          background-color: #f7fbfd;
          font-weight: 700 !important;
          border-left: 1px solid #eff6ff;
          border-right: 1px solid #eff6ff;
        }

        .bp-table td {
          padding: 16px 24px;
          border-bottom: 1px solid #f1f5f9;
          color: #475569;
          vertical-align: middle;
        }
        .bp-table tbody tr:hover:not(.error-detail-row) {
          background-color: #fafbfc;
        }

        /* Bot Info Cell */
        .bot-info-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .bot-name {
          font-size: 0.88rem;
          color: #0f172a;
        }
        .bot-email {
          font-size: 0.72rem;
          color: #94a3b8;
        }

        /* Text weights */
        .font-semibold { font-weight: 600; }
        .text-dark { color: #0f172a !important; }
        .muted-text { color: #cbd5e1; }

        /* Campaign Code Style */
        .campaign-code {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          background: #f1f5f9;
          padding: 3px 8px;
          border-radius: 6px;
          color: #0f172a;
          font-size: 0.78rem;
          border: 1px solid #e2e8f0;
        }

        /* Status Badges */
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .pill-idle {
          background-color: #f1f5f9;
          color: #64748b;
          border: 1px solid #cbd5e1;
        }
        .pill-running {
          background-color: #e0f2fe;
          color: #0369a1;
          border: 1px solid #bae6fd;
        }
        .pill-error {
          background-color: #fef2f2;
          color: #ef4444;
          border: 1px solid #fecaca;
        }

        /* Pulsing dot for running status */
        .pulse-dot {
          width: 6px;
          height: 6px;
          background-color: #0284c7;
          border-radius: 50%;
          animation: pulse 1.4s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 1; box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.4); }
          70% { transform: scale(1.1); opacity: 0.5; box-shadow: 0 0 0 5px rgba(2, 132, 199, 0); }
          100% { transform: scale(0.9); opacity: 1; box-shadow: 0 0 0 0 rgba(2, 132, 199, 0); }
        }

        /* Progress Bar Cell */
        .progress-cell-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .progress-bar-bg {
          flex: 1;
          height: 6px;
          background-color: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.4s ease;
        }
        .fill-running { background-color: #0284c7; }
        .fill-idle { background-color: #94a3b8; }
        .fill-error { background-color: #ef4444; }
        .progress-pct-text {
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
          width: 32px;
          text-align: right;
        }

        /* Error detail row & box */
        .row-error {
          background-color: #fffbfb;
        }
        .error-detail-row td {
          padding: 0 24px 16px 24px;
          border-bottom: 1px solid #f1f5f9;
          background-color: #fffbfb;
        }
        .error-alert-box {
          background-color: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: 8px;
          padding: 12px 16px;
          margin-top: -4px;
        }
        .error-alert-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: #991b1b;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .error-alert-content {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.74rem;
          color: #b91c1c;
          white-space: pre-wrap;
          word-break: break-all;
          line-height: 1.5;
          margin: 0;
        }

        .animate-slide-down {
          animation: slideDown 0.2s ease-out;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Loader & Empty states */
        .loading-spinner-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 0;
          gap: 12px;
        }
        .loading-text { font-size: 0.84rem; color: #64748b; font-weight: 500; }
        .spin { animation: spin 1s linear infinite; }
        .empty-state { text-align: center; padding: 48px 0; color: #64748b; font-size: 0.9rem; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Buttons (Consistent matching styles) */
        .btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px; border-radius: 8px;
          font-size: 0.875rem; font-weight: 600;
          cursor: pointer; border: none;
          transition: all 0.18s; font-family: inherit;
          padding: 10px 20px;
        }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-blue {
          background: #006cb7; color: #fff;
          box-shadow: 0 2px 6px rgba(0,108,183,0.25);
        }
        .btn-blue:hover:not(:disabled) {
          background: #005fa3;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,108,183,0.35);
        }

        /* Responsive stack */
        @media (max-width: 768px) {
          .bp-header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .bp-header-controls {
            width: 100%;
            display: flex;
            justify-content: flex-end;
          }
        }
      `}</style>
    </Layout>
  );
}
