"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import {
  getCampaignsAction,
  updateCampaignAction,
  deleteCampaignAction,
} from "@/app/actions/campaigns";

interface Campaign {
  id: number;
  campaignId: string;
  name: string;
  subject: string;
  content: string;
  status: string;
}

export default function DataCampaignPage() {
  const router = useRouter();

  // Data states
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal active records
  const [viewCampaign, setViewCampaign] = useState<Campaign | null>(null);
  const [deleteCampaign, setDeleteCampaign] = useState<Campaign | null>(null);
  
  // Edit Modal form states
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [editName, setEditName] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Load campaigns from database
  const loadCampaigns = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const result = await getCampaignsAction();
      if (result.success && result.campaigns) {
        setCampaigns(result.campaigns as Campaign[]);
      } else {
        setError(result.error ?? "Gagal memuat data campaign.");
      }
    } catch (err) {
      setError("Koneksi database gagal.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns(true);
  }, []);

  // Handle Edit Action Click
  const handleEditClick = (c: Campaign) => {
    setEditCampaign(c);
    setEditName(c.name);
    setEditSubject(c.subject);
    setEditContent(c.content);
    setEditError(null);
  };

  // Submit Edit Form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCampaign) return;
    setEditError(null);

    if (!editName.trim()) { setEditError("Nama campaign wajib diisi."); return; }
    if (!editSubject.trim()) { setEditError("Subject email wajib diisi."); return; }
    if (!editContent.trim()) { setEditError("Konten email tidak boleh kosong."); return; }

    setIsSubmitting(true);
    try {
      const result = await updateCampaignAction(editCampaign.campaignId, {
        name: editName,
        subject: editSubject,
        content: editContent,
      });

      if (result.success) {
        setSuccess(`Campaign "${editName}" berhasil diperbarui!`);
        setEditCampaign(null);
        loadCampaigns(false);
        // Clear success notification after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setEditError(result.error ?? "Gagal memperbarui campaign.");
      }
    } catch (err) {
      setEditError("Koneksi gagal saat mencoba memperbarui.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delete Action
  const handleDeleteConfirm = async () => {
    if (!deleteCampaign) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await deleteCampaignAction(deleteCampaign.campaignId);
      if (result.success) {
        setSuccess(`Campaign "${deleteCampaign.name}" berhasil dihapus.`);
        setDeleteCampaign(null);
        loadCampaigns(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error ?? "Gagal menghapus campaign.");
        setDeleteCampaign(null);
      }
    } catch (err) {
      setError("Koneksi gagal saat mencoba menghapus.");
      setDeleteCampaign(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Strip html helpers for display preview
  const stripHtml = (htmlStr: string) => {
    if (!htmlStr) return "";
    return htmlStr.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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
            <span className="cc-breadcrumb-current">Data Campaign</span>
          </nav>
          <h1 className="cc-page-title">Campaign Data List</h1>
          <p className="cc-page-sub">Manajemen template campaign, edit konten, atau hapus campaign lama Anda.</p>
        </div>

        {/* Action buttons */}
        <div className="bp-header-controls">
          
          <button
            type="button"
            className="btn btn-blue"
            onClick={() => router.push("/CreateCampaign")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ marginRight: "4px" }}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Buat Campaign
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="cc-alert cc-alert-error">
          <span style={{ fontSize: "1.1rem" }}>⚠️</span> {error}
        </div>
      )}
      {success && (
        <div className="cc-alert cc-alert-success">
          <span style={{ fontSize: "1.1rem" }}>✓</span> {success}
        </div>
      )}

      {/* ── Main Data Card and Table ── */}
      <div className="cc-card bp-table-card">
        {/* Card Header */}
        <div className="cc-card-head">
          <div className="cc-card-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </div>
          <div>
            <div className="cc-card-title">Campaign Database</div>
            <div className="cc-card-sub">Menampilkan list campaign yang tersimpan di dalam database mysql</div>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-spinner-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006cb7" strokeWidth={3} className="spin">
              <circle cx="12" cy="12" r="10" strokeOpacity={0.2} />
              <path d="M12 2a10 10 0 0110 10" />
            </svg>
            <span className="loading-text">Memuat database campaign...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada data campaign di database.</p>
            <button
              type="button"
              className="btn btn-blue"
              style={{ marginTop: 12 }}
              onClick={() => router.push("/CreateCampaign")}
            >
              Buat Campaign Pertama
            </button>
          </div>
        ) : (
          <div className="bp-table-responsive">
            <table className="bp-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "center", width: 60 }}>No</th>
                  <th style={{ textAlign: "center" }}>Campaign ID</th>
                  <th>Campaign Name</th>
                  <th>Subject</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "center", width: 140 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, index) => {
                  return (
                    <tr key={c.id}>
                      {/* No (Row Index) */}
                      <td style={{ textAlign: "center" }} className="font-semibold">{index + 1}</td>

                      {/* Campaign ID */}
                      <td style={{ textAlign: "center", minWidth: 180, maxWidth: 220 }}>
                        <code className="campaign-code clamp-code-2" title={c.campaignId}>
                          {c.campaignId}
                        </code>
                      </td>

                      {/* Name */}
                      <td style={{ minWidth: 220, maxWidth: 280 }}>
                        <div className="clamp-text-2 font-semibold text-dark" title={c.name}>
                          {c.name}
                        </div>
                      </td>

                      {/* Subject */}
                      <td style={{ minWidth: 240, maxWidth: 320, color: "#64748b" }}>
                        <div className="clamp-text-2" title={c.subject}>
                          {c.subject}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ textAlign: "center" }}>
                        <span className={`status-pill pill-${c.status.toLowerCase()}`}>
                          {c.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "center" }}>
                        <div className="action-buttons-wrapper">
                          <button
                            type="button"
                            className="action-btn view-btn"
                            title="Detail / Preview"
                            onClick={() => setViewCampaign(c)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            className="action-btn edit-btn"
                            title="Edit Campaign"
                            onClick={() => handleEditClick(c)}
                            disabled={isSubmitting}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            className="action-btn delete-btn"
                            title="Hapus Campaign"
                            onClick={() => setDeleteCampaign(c)}
                            disabled={isSubmitting}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── View Detail Modal ── */}
      {viewCampaign && (
        <div className="modal-overlay" onClick={() => setViewCampaign(null)}>
          <div className="modal-box view-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="view-modal-header">
              <h2 className="modal-title" style={{ textAlign: "left", margin: 0 }}>Detail Campaign</h2>
              <button className="close-x-btn" onClick={() => setViewCampaign(null)}>×</button>
            </div>
            
            <div className="view-modal-content">
              <div className="detail-row">
                <span className="detail-label">Campaign ID</span>
                <code className="campaign-code detail-code">{viewCampaign.campaignId}</code>
              </div>
              <div className="detail-row">
                <span className="detail-label">Name</span>
                <span className="detail-val font-semibold text-dark">{viewCampaign.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Subject</span>
                <span className="detail-val text-dark">{viewCampaign.subject}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className={`status-pill pill-${viewCampaign.status.toLowerCase()}`}>{viewCampaign.status}</span>
              </div>
              
              <div className="detail-row-vertical">
                <span className="detail-label">Template Content Preview</span>
                <div className="preview-html-box">
                  {stripHtml(viewCampaign.content) || <span style={{ color: "#cbd5e1" }}>Tidak ada konten.</span>}
                </div>
              </div>
            </div>

            <div className="widescreen-modal-actions" style={{ marginTop: 24 }}>
              <button type="button" className="btn btn-outline" onClick={() => setViewCampaign(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editCampaign && (
        <div className="modal-overlay" onClick={() => setEditCampaign(null)}>
          <div className="modal-box edit-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="view-modal-header">
              <h2 className="modal-title" style={{ textAlign: "left", margin: 0 }}>Edit Campaign</h2>
              <button className="close-x-btn" onClick={() => setEditCampaign(null)}>×</button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="edit-modal-content">
                {editError && (
                  <div className="cc-alert cc-alert-error" style={{ marginBottom: 16 }}>
                    {editError}
                  </div>
                )}

                <div className="edit-field">
                  <label className="edit-label">Campaign ID (Tidak bisa diubah)</label>
                  <input type="text" className="edit-input disabled-input" value={editCampaign.campaignId} disabled />
                </div>

                <div className="edit-field">
                  <label className="edit-label">Campaign Name *</label>
                  <input
                    type="text"
                    className="edit-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="edit-field">
                  <label className="edit-label">Email Subject *</label>
                  <input
                    type="text"
                    className="edit-input"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="edit-field">
                  <label className="edit-label">Email Content (HTML) *</label>
                  <textarea
                    className="edit-textarea"
                    rows={8}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    required
                    placeholder="Tulis kode HTML isi email di sini..."
                  />
                </div>
              </div>

              <div className="widescreen-modal-actions" style={{ marginTop: 24 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditCampaign(null)}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-blue"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteCampaign && (
        <div className="modal-overlay" onClick={() => setDeleteCampaign(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: "50%", background: "#fef2f2", margin: "0 auto 16px auto", color: "#ef4444" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2 className="modal-title">Hapus Campaign?</h2>
            <p className="modal-msg" style={{ margin: "8px 0 20px 0" }}>
              Hapus campaign <strong>"{deleteCampaign.name}"</strong>?<br />
              Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDeleteCampaign(null)}
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Custom Styles ── */}
      <style>{`
        /* Header & breadcrumb standard layouts */
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
          gap: 12px;
        }

        /* Card styles */
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

        .bp-table-card {
          padding: 24px 0 0 0;
          overflow: hidden;
        }
        .bp-table-card .cc-card-head {
          margin-left: 24px;
          margin-right: 24px;
        }

        /* Table custom design */
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
        .bp-table td {
          padding: 16px 24px;
          border-bottom: 1px solid #f1f5f9;
          color: #475569;
          vertical-align: middle;
        }
        .bp-table tbody tr:hover {
          background-color: #fafbfc;
        }

        /* Sticky Action Column to freeze the "Aksi" column */
        .bp-table th:last-child,
        .bp-table td:last-child {
          position: sticky;
          right: 0;
          z-index: 10;
          box-shadow: -6px 0 10px -4px rgba(0, 0, 0, 0.08);
          border-left: 1px solid #e2e8f0;
        }

        /* Opaque Background for sticky headers and cells */
        .bp-table th:last-child {
          background: #f8fafc !important;
        }
        .bp-table td:last-child {
          background: #ffffff !important;
        }

        /* Keep background color on hover for sticky cells */
        .bp-table tbody tr:hover td:last-child {
          background-color: #fafbfc !important;
        }

        /* Text line clamping (max 2 lines) */
        .clamp-text-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          word-break: break-word;
          line-height: 1.4;
          max-height: 2.8rem;
          text-align: left;
        }

        .clamp-code-2 {
          display: -webkit-inline-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          word-break: break-all;
          line-height: 1.4;
          max-height: 2.8rem;
          white-space: normal;
          text-align: left;
        }

        /* Action buttons alignment */
        .action-buttons-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .action-btn {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #64748b;
          transition: all 0.15s;
        }
        .action-btn:hover {
          transform: translateY(-1px);
        }
        .view-btn:hover {
          color: #006cb7;
          border-color: #93c5fd;
          background: #eff6ff;
        }
        .edit-btn:hover {
          color: #d97706;
          border-color: #fde68a;
          background: #fffbeb;
        }
        .delete-btn:hover {
          color: #dc2626;
          border-color: #fecaca;
          background: #fef2f2;
        }

        /* Status pills */
        .status-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .pill-draft {
          background-color: #f1f5f9;
          color: #64748b;
          border: 1px solid #cbd5e1;
        }
        .pill-sending {
          background-color: #e0f2fe;
          color: #0369a1;
          border: 1px solid #bae6fd;
        }
        .pill-done {
          background-color: #dcfce7;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        /* Monospace campaign code styling */
        .campaign-code {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          background: #f1f5f9;
          padding: 3px 8px;
          border-radius: 6px;
          color: #0f172a;
          font-size: 0.78rem;
          border: 1px solid #e2e8f0;
        }

        /* General layout utils */
        .font-semibold { font-weight: 600; }
        .text-dark { color: #0f172a !important; }
        .empty-state { text-align: center; padding: 48px 0; color: #64748b; font-size: 0.9rem; }
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
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Button elements */
        .btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px; border-radius: 8px;
          font-size: 0.875rem; font-weight: 600;
          cursor: pointer; border: none;
          transition: all 0.18s; font-family: inherit;
          padding: 10px 18px;
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
        .btn-danger {
          background: #ef4444; color: #fff;
          box-shadow: 0 2px 6px rgba(239,68,68,0.25);
        }
        .btn-danger:hover:not(:disabled) {
          background: #dc2626;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239,68,68,0.35);
        }
        .btn-outline {
          background: transparent; color: #64748b;
          border: 1px solid #e2e8f0;
        }
        .btn-outline:hover:not(:disabled) { background: #f8fafc; color: #0f172a; }

        /* Alert elements */
        .cc-alert {
          padding: 12px 18px;
          border-radius: 10px;
          font-size: 0.82rem; font-weight: 500;
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 20px;
        }
        .cc-alert-error   { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
        .cc-alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }

        /* Modals custom style sheets */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 100; padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        .modal-box {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 28px; max-width: 440px; width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          animation: slideUp 0.22s ease;
        }
        .view-modal-box, .edit-modal-box {
          max-width: 1100px;
          width: 95%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .edit-modal-box form {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .modal-icon { font-size: 2rem; text-align: center; margin-bottom: 12px; }
        .delete-icon { color: #ef4444; }
        
        .modal-title {
          font-size: 1.1rem; font-weight: 800; text-align: center;
          color: #0f172a; margin-bottom: 8px;
        }
        .modal-msg {
          font-size: 0.875rem; color: #64748b;
          text-align: center; line-height: 1.65; margin-bottom: 24px;
        }
        .modal-actions { display: flex; gap: 12px; justify-content: center; }
        .modal-actions .btn { flex: 1; max-width: 140px; }

        .widescreen-modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        .widescreen-modal-actions .btn {
          width: auto;
          min-width: 120px;
        }

        /* Modal Header (View/Edit Specific) */
        .view-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          margin-bottom: 20px;
          border-bottom: 1px solid #f1f5f9;
        }
        .close-x-btn {
          background: none; border: none; font-size: 1.5rem; color: #94a3b8;
          cursor: pointer; line-height: 1; transition: color 0.15s;
        }
        .close-x-btn:hover { color: #0f172a; }

        /* Modal Content details (View Specific) */
        .view-modal-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          flex: 1;
          padding-right: 8px;
        }
        .detail-row {
          display: grid;
          grid-template-columns: 140px 1fr;
          align-items: center;
          font-size: 0.875rem;
        }
        .detail-row-vertical {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.875rem;
        }
        .detail-label {
          font-weight: 700;
          color: #64748b;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .detail-val {
          color: #334155;
        }
        .detail-code {
          justify-self: start;
        }
        .preview-html-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          font-size: 0.82rem;
          color: #475569;
          max-height: 400px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.5;
        }

        /* Modal Input details (Edit Specific) */
        .edit-modal-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          flex: 1;
          padding-right: 8px;
        }
        .edit-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .edit-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .edit-input, .edit-textarea {
          width: 100%;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.88rem;
          color: #0f172a;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .edit-input:focus, .edit-textarea:focus {
          border-color: #006cb7;
          box-shadow: 0 0 0 3px rgba(0,108,183,0.1);
        }
        .disabled-input {
          background: #f1f5f9;
          color: #64748b;
          cursor: not-allowed;
        }
        .edit-textarea {
          resize: vertical;
          min-height: 240px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.82rem;
        }

        /* Responsive design rules */
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
          .detail-row {
            grid-template-columns: 1fr;
            gap: 4px;
            align-items: flex-start;
          }
          .modal-actions, .widescreen-modal-actions {
            flex-direction: column;
          }
          .modal-actions .btn, .widescreen-modal-actions .btn {
            max-width: 100%;
            width: 100%;
          }
        }
      `}</style>
    </Layout>
  );
}
