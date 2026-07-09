"use client";

import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { getDashboardStatsAction } from "@/app/actions/dashboard";

interface DashboardData {
  campaigns: {
    total: number;
    draft: number;
    active: number;
    sent: number;
  };
  delivery: {
    totalTarget: number;
    totalSent: number;
    totalFailed: number;
    successRate: number;
    failedRate: number;
  };
  robots: {
    total: number;
    running: number;
    idle: number;
    error: number;
    activeRate: number;
  };
  topCampaigns: Array<{
    id: number;
    name: string;
    totalTarget: number;
    totalSent: number;
    totalFailed: number;
    successRate: number;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const loadData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const res = await getDashboardStatsAction();
      if (res.success && res.stats) {
        setData(res.stats);
        const now = new Date();
        setLastUpdated(
          now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      } else {
        setError(res.error ?? "Gagal memuat statistik dashboard.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Layout userName="Admin" userEmail="admin@blastmail.com" role="admin">
      {/* ── Page Header ── */}
      <div className="db-header-row">
        <div>
          <nav className="db-breadcrumb">
            <span>Home</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="db-breadcrumb-current">Dashboard</span>
          </nav>
          <h1 className="db-page-title">Dashboard</h1>
          <p className="db-page-sub">Ringkasan metrik performa pengiriman email dan status robot aktif.</p>
        </div>

      </div>

      {isLoading && !data ? (
        <div className="loading-spinner-wrapper">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006cb7" strokeWidth={3} className="spin">
            <circle cx="12" cy="12" r="10" strokeOpacity={0.2} />
            <path d="M12 2a10 10 0 0110 10" />
          </svg>
          <span className="loading-text">Memuat statistik dashboard...</span>
        </div>
      ) : error ? (
        <div className="db-alert db-alert-error">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ marginRight: 6, flexShrink: 0 }}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          {error}
        </div>
      ) : data ? (
        <div className="db-content-grid">
          
          {/* ── CARD 1: DELIVERY PROGRESS ── */}
          <div className="db-card text-center">
            <div className="db-card-head-simple">
              <span className="db-card-icon-circle blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </span>
              <div>
                <h3 className="db-card-title">Success Rate Blast</h3>
                <p className="db-card-sub">Statistik pengiriman email sukses</p>
              </div>
            </div>

            {/* Circular Progress Chart */}
            <div className="chart-circle-container">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="68" fill="transparent" stroke="#e2e8f0" strokeWidth="10" />
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="transparent"
                  stroke="#006cb7"
                  strokeWidth="10"
                  strokeDasharray="427.2"
                  strokeDashoffset={427.2 - (427.2 * data.delivery.successRate) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 80 80)"
                  style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
                />
                <text x="80" y="74" textAnchor="middle" dominantBaseline="middle" className="chart-val-percent">
                  {data.delivery.successRate}%
                </text>
                <text x="80" y="96" textAnchor="middle" dominantBaseline="middle" className="chart-val-label">
                  SUKSES
                </text>
              </svg>
            </div>

            {/* Legend Stats */}
            <div className="db-legend-grid">
              <div className="db-legend-item">
                <span className="db-legend-num text-blue">{data.delivery.totalSent}</span>
                <span className="db-legend-lbl">Email Terkirim</span>
              </div>
              <div className="db-legend-divider" />
              <div className="db-legend-item">
                <span className="db-legend-num text-red">{data.delivery.totalFailed}</span>
                <span className="db-legend-lbl">Gagal Terkirim</span>
              </div>
              <div className="db-legend-divider" />
              <div className="db-legend-item">
                <span className="db-legend-num text-dark">{data.delivery.totalTarget}</span>
                <span className="db-legend-lbl">Total Target</span>
              </div>
            </div>
          </div>

          {/* ── CARD 2: ROBOTS STATUS ── */}
          <div className="db-card text-center">
            <div className="db-card-head-simple">
              <span className={`db-card-icon-circle ${data.robots.error > 0 ? "red" : "green"}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v4" />
                  <line x1="8" y1="16" x2="8.01" y2="16" />
                  <line x1="16" y1="16" x2="16.01" y2="16" />
                </svg>
              </span>
              <div>
                <h3 className="db-card-title">Robot Health</h3>
                <p className="db-card-sub">Persentase robot aktif saat ini</p>
              </div>
            </div>

            {/* Circular Progress Chart */}
            <div className="chart-circle-container">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="68" fill="transparent" stroke="#e2e8f0" strokeWidth="10" />
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="transparent"
                  stroke={data.robots.error > 0 ? "#ef4444" : "#10b981"}
                  strokeWidth="10"
                  strokeDasharray="427.2"
                  strokeDashoffset={427.2 - (427.2 * data.robots.activeRate) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 80 80)"
                  style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
                />
                <text
                  x="80"
                  y="74"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="chart-val-percent"
                  style={{ fill: data.robots.error > 0 ? "#ef4444" : "#10b981" }}
                >
                  {data.robots.activeRate}%
                </text>
                <text x="80" y="96" textAnchor="middle" dominantBaseline="middle" className="chart-val-label">
                  RUNNING
                </text>
              </svg>
            </div>

            {/* Legend Stats */}
            <div className="db-legend-grid">
              <div className="db-legend-item">
                <span className="db-legend-num text-green">{data.robots.running}</span>
                <span className="db-legend-lbl">Robot Active</span>
              </div>
              <div className="db-legend-divider" />
              <div className="db-legend-item">
                <span className="db-legend-num text-orange">{data.robots.idle}</span>
                <span className="db-legend-lbl">Robot Idle</span>
              </div>
              <div className="db-legend-divider" />
              <div className="db-legend-item">
                <span className="db-legend-num text-red">{data.robots.error}</span>
                <span className="db-legend-lbl">Robot Error</span>
              </div>
            </div>
          </div>

          {/* ── CARD 3: CAMPAIGNS OVERVIEW ── */}
          <div className="db-card">
            <div className="db-card-head-simple">
              <span className="db-card-icon-circle blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M21 9H3" />
                  <path d="M21 15H3" />
                  <path d="M12 3v18" />
                </svg>
              </span>
              <div>
                <h3 className="db-card-title">Campaign Status</h3>
                <p className="db-card-sub">Komposisi database campaign</p>
              </div>
            </div>

            {/* Stats list with progress bars */}
            <div className="campaign-status-dist" style={{ marginTop: 24 }}>
              
              <div className="dist-row">
                <div className="dist-info">
                  <span className="dist-label font-semibold text-dark">Total Campaign</span>
                  <span className="dist-count font-bold text-dark">{data.campaigns.total}</span>
                </div>
                <div className="dist-bar-bg">
                  <div className="dist-bar-fill blue-bg" style={{ width: "100%" }} />
                </div>
              </div>

              <div className="dist-row" style={{ marginTop: 14 }}>
                <div className="dist-info">
                  <span className="dist-label">Selesai / Terkirim</span>
                  <span className="dist-count font-semibold">
                    {data.campaigns.sent} <span className="dist-percentage">({data.campaigns.total > 0 ? Math.round((data.campaigns.sent / data.campaigns.total) * 100) : 0}%)</span>
                  </span>
                </div>
                <div className="dist-bar-bg">
                  <div
                    className="dist-bar-fill green-bg"
                    style={{ width: `${data.campaigns.total > 0 ? (data.campaigns.sent / data.campaigns.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="dist-row" style={{ marginTop: 14 }}>
                <div className="dist-info">
                  <span className="dist-label">Sedang Dikirim (Active)</span>
                  <span className="dist-count font-semibold">
                    {data.campaigns.active} <span className="dist-percentage">({data.campaigns.total > 0 ? Math.round((data.campaigns.active / data.campaigns.total) * 100) : 0}%)</span>
                  </span>
                </div>
                <div className="dist-bar-bg">
                  <div
                    className="dist-bar-fill orange-bg"
                    style={{ width: `${data.campaigns.total > 0 ? (data.campaigns.active / data.campaigns.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="dist-row" style={{ marginTop: 14 }}>
                <div className="dist-info">
                  <span className="dist-label">Draf</span>
                  <span className="dist-count font-semibold">
                    {data.campaigns.draft} <span className="dist-percentage">({data.campaigns.total > 0 ? Math.round((data.campaigns.draft / data.campaigns.total) * 100) : 0}%)</span>
                  </span>
                </div>
                <div className="dist-bar-bg">
                  <div
                    className="dist-bar-fill gray-bg"
                    style={{ width: `${data.campaigns.total > 0 ? (data.campaigns.draft / data.campaigns.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* ── CARD 4: RECENT CAMPAIGN PERFORMANCE (FULL WIDTH) ── */}
          <div className="db-card db-card-full">
            <div className="db-card-head-simple" style={{ marginBottom: 20 }}>
              <span className="db-card-icon-circle blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <path d="M3 3v18h18" />
                  <path d="m18.7 8-5.1 5.2-2.8-2.7L7 14.3" />
                </svg>
              </span>
              <div>
                <h3 className="db-card-title">Recent Campaign Performance</h3>
                <p className="db-card-sub">Performa pengiriman target 5 campaign teranyar</p>
              </div>
            </div>

            {data.topCampaigns.length === 0 ? (
              <div className="empty-state" style={{ padding: "40px 0" }}>
                <p style={{ margin: 0, color: "#64748b" }}>Belum ada data target pengiriman di database.</p>
              </div>
            ) : (
              <div className="performance-chart-list">
                {data.topCampaigns.map((c) => (
                  <div className="campaign-bar-row" key={c.id}>
                    <div className="campaign-bar-info">
                      <span className="campaign-bar-name font-semibold text-dark" title={c.name}>
                        {c.name}
                      </span>
                      <span className="campaign-bar-stats">
                        {c.totalSent} Sukses / {c.totalTarget} Target ({c.successRate}%)
                      </span>
                    </div>
                    <div className="campaign-bar-track">
                      {c.totalTarget > 0 ? (
                        <>
                          <div
                            className="campaign-bar-success"
                            style={{ width: `${c.successRate}%` }}
                            title={`Sukses: ${c.totalSent}`}
                          />
                          <div
                            className="campaign-bar-failed"
                            style={{
                              width: `${
                                c.totalTarget > 0 ? Math.round((c.totalFailed / c.totalTarget) * 100) : 0
                              }%`,
                            }}
                            title={`Gagal: ${c.totalFailed}`}
                          />
                        </>
                      ) : (
                        <div className="campaign-bar-empty" title="Draft / 0 Target" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : null}

      {/* ── Page Custom Styles ── */}
      <style>{`
        /* Header and layouts */
        .db-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
        }
        .db-header-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .db-update-time {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 500;
        }
        .db-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #94a3b8;
          margin-bottom: 4px;
        }
        .db-breadcrumb-current {
          color: #64748b;
        }
        .db-page-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .db-page-sub {
          font-size: 0.8rem;
          color: #94a3b8;
          margin-top: 2px;
        }

        /* Content Grid */
        .db-content-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .db-card-full {
          grid-column: span 3;
        }

        /* Card styles */
        .db-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .text-center {
          align-items: center;
        }
        .db-card-head-simple {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          text-align: left;
        }
        .db-card-icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .db-card-icon-circle.blue {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #2563eb;
        }
        .db-card-icon-circle.green {
          background: #hnfdf4; /* healthy */
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }
        .db-card-icon-circle.red {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #ef4444;
        }
        .db-card-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .db-card-sub {
          font-size: 0.75rem;
          color: #94a3b8;
          margin: 2px 0 0 0;
        }

        /* Circular progress chart centering */
        .chart-circle-container {
          margin: 28px 0;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }
        .chart-val-percent {
          font-size: 1.6rem;
          font-weight: 800;
          fill: #006cb7;
        }
        .chart-val-label {
          font-size: 0.65rem;
          font-weight: 700;
          fill: #94a3b8;
          letter-spacing: 0.08em;
        }

        /* Legend Grid */
        .db-legend-grid {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          border-top: 1px solid #f1f5f9;
          padding-top: 18px;
          margin-top: auto;
        }
        .db-legend-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }
        .db-legend-num {
          font-size: 1.05rem;
          font-weight: 750;
        }
        .db-legend-lbl {
          font-size: 0.68rem;
          color: #94a3b8;
          margin-top: 4px;
          text-align: center;
        }
        .db-legend-divider {
          width: 1px;
          height: 28px;
          background: #e2e8f0;
        }

        /* Color classes */
        .text-blue { color: #006cb7; }
        .text-red { color: #ef4444; }
        .text-green { color: #10b981; }
        .text-orange { color: #f59e0b; }
        .text-dark { color: #0f172a; }

        /* Campaign Status Distribution */
        .dist-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .dist-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #475569;
        }
        .dist-count {
          color: #0f172a;
        }
        .dist-percentage {
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .dist-bar-bg {
          width: 100%;
          height: 6px;
          background: #f1f5f9;
          border-radius: 9999px;
          overflow: hidden;
        }
        .dist-bar-fill {
          height: 100%;
          border-radius: 9999px;
        }
        .blue-bg { background: #006cb7; }
        .green-bg { background: #10b981; }
        .orange-bg { background: #f59e0b; }
        .gray-bg { background: #94a3b8; }

        /* Campaign performance bar lists */
        .performance-chart-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .campaign-bar-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .campaign-bar-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.82rem;
        }
        .campaign-bar-name {
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 60%;
        }
        .campaign-bar-stats {
          color: #64748b;
          font-size: 0.76rem;
        }
        .campaign-bar-track {
          width: 100%;
          height: 12px;
          background: #f1f5f9;
          border-radius: 6px;
          overflow: hidden;
          display: flex;
        }
        .campaign-bar-success {
          background: #006cb7;
          height: 100%;
          transition: width 0.6s ease;
        }
        .campaign-bar-failed {
          background: #ef4444;
          height: 100%;
          transition: width 0.6s ease;
        }
        .campaign-bar-empty {
          background: #cbd5e1;
          width: 100%;
          height: 100%;
        }

        /* Utility styles */
        .btn-outline.db-refresh-btn {
          border: 1.5px solid #475569 !important;
          color: #475569 !important;
          background: #fff !important;
          padding: 8px 16px !important;
        }
        .btn-outline.db-refresh-btn:hover:not(:disabled) {
          background: #f1f5f9 !important;
          color: #0f172a !important;
          border-color: #0f172a !important;
          transform: translateY(-1px);
        }
        .db-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 20px;
          font-weight: 500;
        }
        .db-alert-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        /* Spin animation */
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Responsive grid */
        @media (max-width: 1024px) {
          .db-content-grid {
            grid-template-columns: 1fr;
          }
          .db-card-full {
            grid-column: span 1;
          }
        }
      `}</style>
    </Layout>
  );
}
