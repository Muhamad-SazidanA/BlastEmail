"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import {
  getCampaignsAction,
  triggerBlastAction,
  triggerTestBlastAction,
} from "@/app/actions/campaigns";

interface Campaign {
  id: number;
  campaignId: string;
  name: string;
  subject: string;
  content: string;
  status: string;
}

// ── Confirm Blast Modal ───────────────────────────────────────────────────────
interface BlastModalProps {
  isOpen: boolean;
  campaignName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function ConfirmBlastModal({ isOpen, campaignName, onConfirm, onCancel, isSubmitting }: BlastModalProps) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: "50%", background: "#eff6ff", margin: "0 auto 16px auto", color: "#006cb7" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </div>
        <h2 className="modal-title">Mulai Blast Email?</h2>
        <p className="modal-msg" style={{ margin: "8px 0 20px 0" }}>
          Mulai pengiriman massal untuk campaign <strong>"{campaignName}"</strong>?
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Memproses..." : "Ya, Mulai"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Test Modal ────────────────────────────────────────────────────────
interface TestModalProps {
  isOpen: boolean;
  campaignName: string;
  onConfirm: (email: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function ConfirmTestModal({ isOpen, campaignName, onConfirm, onCancel, isSubmitting }: TestModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    onConfirm(email.trim());
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: "50%", background: "#fffbeb", margin: "0 auto 16px auto", color: "#d97706" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12" />
            <path d="M8 3v6" />
            <path d="M16 3v6" />
            <path d="M16 9a6 6 0 0 1 2.9 8.2l.1.2c.4.8.4 1.8 0 2.6L18 21H6l-1-1c-.4-.8-.4-1.8 0-2.6l.1-.2A6 6 0 0 1 8 9h8z" />
          </svg>
        </div>
        <h2 className="modal-title">Kirim Test Blast?</h2>
        <p className="modal-msg" style={{ margin: "8px 0 12px 0" }}>
          Kirim email uji coba campaign <strong>"{campaignName}"</strong> ke:
        </p>
        <form onSubmit={handleSubmit}>
          <div className="cc-field" style={{ textAlign: "left", marginBottom: 20 }}>
            <input
              id="test-email-input"
              type="email"
              className="cc-input"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              disabled={isSubmitting}
              required
              autoFocus
              style={{ padding: "8px 12px", borderRadius: "8px" }}
            />
            {error && <div className="field-error-msg" style={{ color: "#ef4444", fontSize: "0.72rem", marginTop: 4 }}>{error}</div>}
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-blue"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Mengirim..." : "Ya, Kirim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function BlastEmailPage() {
  const router = useRouter();

  // Data state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);

  // UI / Modal state
  const [showBlastModal, setShowBlastModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Custom Dropdown state
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close custom dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch campaigns on mount
  useEffect(() => {
    async function loadCampaigns() {
      try {
        const result = await getCampaignsAction();
        if (result.success && result.campaigns) {
          setCampaigns(result.campaigns as Campaign[]);
          // Default select the first campaign if available
          if (result.campaigns.length > 0) {
            setSelectedId(result.campaigns[0].campaignId);
          }
        } else {
          setError(result.error ?? "Gagal memuat daftar campaign.");
        }
      } catch (err) {
        setError("Koneksi gagal. Silakan muat ulang halaman.");
      } finally {
        setIsLoadingCampaigns(false);
      }
    }
    loadCampaigns();
  }, []);

  const selectedCampaign = campaigns.find(c => c.campaignId === selectedId);

  // ── Handle Blast Trigger ────────────────────────────────────────────────────
  const handleBlastClick = () => {
    if (!selectedId) {
      setError("Silakan pilih campaign terlebih dahulu.");
      return;
    }
    setError(null);
    setSuccess(null);
    setShowBlastModal(true);
  };

  const confirmBlast = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await triggerBlastAction(selectedId);
      if (result.success) {
        setSuccess(`Blast email untuk "${selectedCampaign?.name}" berhasil dijalankan!`);
        setShowBlastModal(false);
        // Refresh campaign status
        const updatedCampaigns = campaigns.map(c => 
          c.campaignId === selectedId ? { ...c, status: "SENDING" } : c
        );
        setCampaigns(updatedCampaigns);
        // Redirect to progress dashboard after a short delay
        setTimeout(() => {
          router.push("/BotProgress");
        }, 2000);
      } else {
        setError(result.error ?? "Gagal memulai blast email.");
        setShowBlastModal(false);
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem saat menghubungi n8n webhook.");
      setShowBlastModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Handle Test Blast Trigger ───────────────────────────────────────────────
  const handleTestClick = () => {
    if (!selectedId) {
      setError("Silakan pilih campaign terlebih dahulu.");
      return;
    }
    setError(null);
    setSuccess(null);
    setShowTestModal(true);
  };

  const confirmTestBlast = async (testEmail: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await triggerTestBlastAction(selectedId, testEmail);
      if (result.success) {
        setSuccess(`Email uji coba untuk "${selectedCampaign?.name}" berhasil dikirim ke ${testEmail}!`);
        setShowTestModal(false);
      } else {
        setError(result.error ?? "Gagal mengirimkan email uji coba.");
        setShowTestModal(false);
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem saat menghubungi n8n test webhook.");
      setShowTestModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper: Strip HTML tags to make a clean plain text preview
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
      <div className="cc-header">
        <div>
          <nav className="cc-breadcrumb">
            <span>Campaigns</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="cc-breadcrumb-current">Blast Email</span>
          </nav>
          <h1 className="cc-page-title">Direct Blast Campaign</h1>
          <p className="cc-page-sub">Pilih campaign dan mulailah mengirimkan email langsung ke penerima Anda.</p>
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

      {/* ── Main Layout (Two-column) ── */}
      <div className="cc-page-layout">
        
        {/* LEFT COLUMN: Selector and Control Buttons */}
        <div className="cc-col-main">
          <div className="cc-card">
            <div className="cc-card-head">
              <div className="cc-card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </div>
              <div>
                <div className="cc-card-title">Pilih Campaign</div>
                <div className="cc-card-sub">Pilih campaign aktif untuk di-blast</div>
              </div>
            </div>

            {isLoadingCampaigns ? (
              <div className="loading-spinner-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006cb7" strokeWidth={3} className="spin">
                  <circle cx="12" cy="12" r="10" strokeOpacity={0.2} />
                  <path d="M12 2a10 10 0 0110 10" />
                </svg>
                <span className="loading-text">Memuat data campaign...</span>
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
              <div className="blast-form-inner">
                {/* Dropdown Select (Custom React Dropdown) */}
                <div className="cc-field">
                  <label className="cc-label">
                    Campaign Aktif <span className="cc-req">*</span>
                  </label>
                  <div className="custom-dropdown-container" ref={dropdownRef}>
                    <button
                      type="button"
                      className="custom-dropdown-trigger"
                      onClick={() => setIsOpen(!isOpen)}
                      disabled={isSubmitting}
                    >
                      {selectedCampaign ? (
                        <div className="trigger-content">
                          <span className="trigger-text">{selectedCampaign.name}</span>
                          <span className={`status-badge badge-${selectedCampaign.status.toLowerCase()}`}>
                            {selectedCampaign.status}
                          </span>
                        </div>
                      ) : (
                        <span className="trigger-placeholder">Pilih campaign...</span>
                      )}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className={`chevron-icon ${isOpen ? "open" : ""}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {isOpen && (
                      <div className="custom-dropdown-menu">
                        {campaigns.map((c) => {
                          const isSelected = c.campaignId === selectedId;
                          const rawText = `${c.name} (${c.campaignId}) — [${c.status}]`;
                          const maxOptionLength = 65;
                          const truncatedText = c.name.length > maxOptionLength
                            ? c.name.substring(0, maxOptionLength - 3) + "..."
                            : c.name;

                          return (
                            <div
                              key={c.campaignId}
                              className={`custom-dropdown-item ${isSelected ? "selected" : ""}`}
                              onClick={() => {
                                setSelectedId(c.campaignId);
                                setIsOpen(false);
                              }}
                              title={rawText}
                            >
                              <div className="item-main-row">
                                <span className="item-name">{truncatedText}</span>
                                <span className={`status-badge badge-${c.status.toLowerCase()}`}>
                                  {c.status}
                                </span>
                              </div>
                              <div className="item-sub-row">
                                <span className="item-id">{c.campaignId}</span>
                                {isSelected && (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#006cb7" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <p className="cc-hint">Pilih template email campaign yang sudah Anda rancang.</p>
                </div>

                {/* Control Action Buttons */}
                <div className="blast-actions-grid">
                  <button
                    id="trigger-blast-btn"
                    type="button"
                    className="btn btn-blue blast-main-btn"
                    onClick={handleBlastClick}
                    disabled={isSubmitting || !selectedId}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Mulai Blast Email
                  </button>

                  <button
                    id="trigger-test-btn"
                    type="button"
                    className="btn btn-outline blast-test-btn"
                    onClick={handleTestClick}
                    disabled={isSubmitting || !selectedId}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    Kirim Test Blast
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Campaign Preview Panel */}
        <div className="cc-sidebar">
          <div className="cc-sidebar-sticky">
            <div className="cc-card preview-card">
              <div className="preview-card-title">Preview Content</div>
              {selectedCampaign ? (
                <div className="preview-details">
                  <div className="preview-meta-row">
                    <span className="preview-meta-label">ID:</span>
                    <code className="modal-code">{selectedCampaign.campaignId}</code>
                  </div>
                  <div className="preview-meta-row">
                    <span className="preview-meta-label">Status:</span>
                    <span className={`status-badge badge-${selectedCampaign.status.toLowerCase()}`}>
                      {selectedCampaign.status}
                    </span>
                  </div>
                  <div className="preview-divider" />
                  <div className="preview-field">
                    <div className="preview-field-label">Subject</div>
                    <div className="preview-field-val">{selectedCampaign.subject}</div>
                  </div>
                  <div className="preview-field" style={{ marginTop: 14 }}>
                    <div className="preview-field-label">Email Content Preview</div>
                    <div className="preview-content-box">
                      {stripHtml(selectedCampaign.content) || <span className="empty-text">No content available</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="preview-empty-state">
                  Pilih campaign untuk melihat detail isi template email di sini.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── Blast Confirmation Modal ── */}
      <ConfirmBlastModal
        isOpen={showBlastModal}
        campaignName={selectedCampaign?.name ?? ""}
        onConfirm={confirmBlast}
        onCancel={() => setShowBlastModal(false)}
        isSubmitting={isSubmitting}
      />

      {/* ── Test Confirmation Modal ── */}
      <ConfirmTestModal
        isOpen={showTestModal}
        campaignName={selectedCampaign?.name ?? ""}
        onConfirm={confirmTestBlast}
        onCancel={() => setShowTestModal(false)}
        isSubmitting={isSubmitting}
      />

      {/* ── Page Custom Styles ── */}
      <style>{`
        /* Header & Breadcrumbs */
        .cc-header { margin-bottom: 24px; }
        .cc-breadcrumb {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px;
        }
        .cc-breadcrumb-current { color: #64748b; }
        .cc-page-title {
          font-size: 1.5rem; font-weight: 800; color: #0f172a;
          letter-spacing: -0.02em;
        }
        .cc-page-sub { font-size: 0.8rem; color: #94a3b8; margin-top: 2px; }

        /* Two Column Grid */
        .cc-page-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
          align-items: start;
        }
        .cc-col-main { display: flex; flex-direction: column; gap: 20px; }
        .cc-sidebar-sticky { position: sticky; top: 24px; }

        /* Card Container */
        .cc-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
          transition: box-shadow 0.2s;
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

        /* Fields & Dropdown */
        .cc-field { margin-bottom: 20px; }
        .cc-label {
          display: block;
          font-size: 0.72rem; font-weight: 700;
          color: #64748b;
          text-transform: uppercase; letter-spacing: 0.06em;
          margin-bottom: 7px;
        }
        .cc-req { color: #ef4444; margin-left: 2px; }
        .cc-input {
          width: 100%;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 11px 16px;
          font-size: 0.9rem;
          color: #0f172a;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .select-input {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          background-size: 16px;
          padding-right: 40px;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }

        /* Custom Dropdown Container */
        .custom-dropdown-container {
          position: relative;
          width: 100%;
        }

        /* Trigger Button */
        .custom-dropdown-trigger {
          width: 100%;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          text-align: left;
          height: 44px;
        }
        .custom-dropdown-trigger:hover:not(:disabled) {
          border-color: #94a3b8;
          background: #fafbfc;
        }
        .custom-dropdown-trigger:focus {
          border-color: #006cb7;
          box-shadow: 0 0 0 3px rgba(0,108,183,0.1);
        }
        .trigger-content {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          overflow: hidden;
        }
        .trigger-text {
          font-size: 0.9rem;
          font-weight: 500;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .trigger-placeholder {
          font-size: 0.9rem;
          color: #94a3b8;
        }
        .chevron-icon {
          color: #64748b;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }
        .chevron-icon.open {
          transform: rotate(180deg);
        }

        /* Dropdown Menu Panel */
        .custom-dropdown-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
          z-index: 50;
          max-height: 280px;
          overflow-y: auto;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          animation: slideUpDropdown 0.15s ease-out;
        }
        @keyframes slideUpDropdown {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Dropdown Menu Item */
        .custom-dropdown-item {
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .custom-dropdown-item:hover {
          background: #f8fafc;
        }
        .custom-dropdown-item.selected {
          background: #eff6ff;
        }
        .item-main-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .item-name {
          font-size: 0.86rem;
          font-weight: 600;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          text-align: left;
        }
        .item-sub-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .item-id {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.72rem;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cc-input:focus {
          border-color: #006cb7;
          box-shadow: 0 0 0 3px rgba(0,108,183,0.1);
        }
        .cc-hint { font-size: 0.72rem; color: #b0bac5; margin-top: 5px; }

        /* Button Grid Layout */
        .blast-actions-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 14px;
          margin-top: 24px;
        }

        /* Buttons */
        .btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px; border-radius: 8px;
          font-size: 0.875rem; font-weight: 600;
          cursor: pointer; border: none;
          transition: all 0.18s; font-family: inherit;
          padding: 12px 20px;
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

        /* Preview Sidebar Component */
        .preview-card {
          border-left: 4px solid #006cb7;
        }
        .preview-card-title {
          font-size: 0.8rem; font-weight: 700; color: #006cb7;
          text-transform: uppercase; letter-spacing: 0.06em;
          margin-bottom: 16px;
        }
        .preview-meta-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 8px; font-size: 0.8rem;
        }
        .preview-meta-label { color: #64748b; font-weight: 500; }
        .status-badge {
          font-size: 0.68rem; font-weight: 700; padding: 2px 8px;
          border-radius: 4px; text-transform: uppercase;
        }
        .badge-draft { background: #fef3c7; color: #d97706; }
        .badge-sending { background: #dbeafe; color: #1d4ed8; }
        .badge-success { background: #dcfce7; color: #15803d; }
        .preview-divider { height: 1px; background: #f1f5f9; margin: 16px 0; }
        .preview-field-label { font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
        .preview-field-val { font-size: 0.875rem; color: #1e293b; font-weight: 600; }
        .preview-content-box {
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
          padding: 12px; font-size: 0.78rem; color: #475569;
          max-height: 200px; overflow-y: auto; line-height: 1.5;
          word-break: break-all;
        }
        .preview-empty-state {
          font-size: 0.8rem; color: #94a3b8; text-align: center;
          padding: 32px 12px; line-height: 1.6;
        }
        .empty-text { color: #b0bac5; font-style: italic; }

        /* Loading / Empty States */
        .loading-spinner-wrapper {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 48px 0; gap: 12px;
        }
        .loading-text { font-size: 0.84rem; color: #64748b; font-weight: 500; }
        .spin { animation: spin 1s linear infinite; }
        .empty-state { text-align: center; padding: 32px 0; color: #64748b; font-size: 0.9rem; }

        /* Modals */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(15, 23, 42, 0.45);
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
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          animation: slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: center;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-icon { font-size: 2.2rem; margin-bottom: 12px; }
        .modal-title { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
        .modal-msg { font-size: 0.85rem; color: #64748b; line-height: 1.6; margin-bottom: 20px; }
        .modal-code {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          background: #f1f5f9; padding: 1px 6px;
          border-radius: 4px; color: #1d4ed8; font-size: 0.8rem;
        }
        .modal-actions { display: flex; gap: 12px; margin-top: 24px; justify-content: center; }
        .modal-actions .btn { flex: 1; max-width: 140px; }
        .field-error-msg { font-size: 0.72rem; color: #ef4444; margin-top: 5px; font-weight: 500; }

        /* Alerts */
        .cc-alert {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 18px; border-radius: 8px;
          font-size: 0.85rem; margin-bottom: 20px;
          font-weight: 500;
        }
        .cc-alert-error   { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
        .cc-alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }

        /* Responsive adjustments */
        @media (max-width: 900px) {
          .cc-page-layout { grid-template-columns: 1fr; }
          .cc-sidebar-sticky { position: static; }
          .blast-actions-grid { grid-template-columns: 1fr; }
          .modal-actions {
            flex-direction: column;
          }
          .modal-actions .btn {
            max-width: 100%;
            width: 100%;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </Layout>
  );
}
