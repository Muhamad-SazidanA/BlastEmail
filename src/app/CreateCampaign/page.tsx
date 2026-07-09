"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Layout from "@/components/Layout";
import { createCampaignAction, triggerTestBlastAction } from "@/app/actions/campaigns";

const BlockNoteEditor = dynamic(
  () => import("@/components/BlockNoteEditor"),
  { ssr: false }
);

// ── Slug helper ────────────────────────────────────────────────────────────

/** Buat campaign_id dari nama: lowercase, hapus simbol, spasi → tanda hubung */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")   // hapus semua selain huruf, angka, spasi
    .trim()
    .replace(/\s+/g, "-");           // spasi → tanda hubung
}

// ── Confirm Modal ─────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  campaignName: string;
  campaignId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ isOpen, campaignName, campaignId, onConfirm, onCancel }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="cc-modal-title">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: "50%", background: "#eff6ff", margin: "0 auto 16px auto", color: "#006cb7" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        </div>
        <h2 id="cc-modal-title" className="modal-title">Simpan Campaign?</h2>
        <p className="modal-msg" style={{ margin: "8px 0 20px 0" }}>
          Simpan campaign <strong>"{campaignName}"</strong> ke database?
        </p>
        <div className="modal-actions">
          <button
            id="modal-no-btn"
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
          >
            Batal
          </button>
          <button
            id="modal-yes-btn"
            type="button"
            className="btn btn-blue"
            onClick={onConfirm}
          >
            Ya, Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

interface TestModalProps {
  isOpen: boolean;
  campaignName: string;
  campaignId: string;
  testEmail: string;
  setTestEmail: (val: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function ConfirmSaveAndTestModal({
  isOpen,
  campaignName,
  campaignId,
  testEmail,
  setTestEmail,
  onConfirm,
  onCancel,
  isSubmitting,
}: TestModalProps) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="test-modal-title">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: "50%", background: "#fffbeb", margin: "0 auto 16px auto", color: "#d97706" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12" />
            <path d="M8 3v6" />
            <path d="M16 3v6" />
            <path d="M16 9a6 6 0 0 1 2.9 8.2l.1.2c.4.8.4 1.8 0 2.6L18 21H6l-1-1c-.4-.8-.4-1.8 0-2.6l.1-.2A6 6 0 0 1 8 9h8z" />
          </svg>
        </div>
        <h2 id="test-modal-title" className="modal-title">Simpan & Test Blast?</h2>
        <p className="modal-msg" style={{ margin: "8px 0 12px 0" }}>
          Simpan campaign <strong>"{campaignName}"</strong> dan kirim email uji coba ke:
        </p>
        <div className="cc-field" style={{ marginTop: 8, textAlign: "left", marginBottom: 20 }}>
          <input
            type="email"
            className="cc-input"
            placeholder="nama@email.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            required
            disabled={isSubmitting}
            style={{ padding: "8px 12px", borderRadius: "8px" }}
          />
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
            type="button"
            className="btn btn-blue"
            onClick={onConfirm}
            disabled={isSubmitting || !testEmail.trim()}
          >
            {isSubmitting ? "Memproses..." : "Ya, Simpan & Test"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function CreateCampaignPage() {
  const router = useRouter();

  // Form fields
  const [name,    setName]    = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [editorMode, setEditorMode] = useState<"manual" | "html">("manual");

  // UI state
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState(false);
  const [showTestConfirm, setShowTestConfirm] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const campaignId = toSlug(name);

  const handleContentChange = useCallback((html: string) => setContent(html), []);

  // ── Validate & open confirm modal ────────────────────────────────────────
  const handleSubmitClick = () => {
    setError(null);
    if (!name.trim())    { setError("Campaign name wajib diisi."); return; }
    if (!subject.trim()) { setError("Email subject wajib diisi.");  return; }
    const stripped = content.replace(/<[^>]*>/g, "").trim();
    if (!stripped)       { setError("Email content tidak boleh kosong."); return; }
    setShowConfirm(true);
  };

  // ── Save Campaign via Server Action ─────────────────────────────────────────
  const handleConfirm = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createCampaignAction({
        campaign_id: campaignId,
        name:        name.trim(),
        subject:     subject.trim(),
        content,
      });

      if (!result.success) {
        setError(result.error ?? "Gagal membuat campaign.");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      // Reset form
      setName(""); setSubject(""); setContent("");
      setTimeout(() => {
        router.push("/DataCampaign");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan campaign. Silakan coba lagi.");
      setIsSubmitting(false);
    }
  };

  // ── Validate & open test confirm modal ────────────────────────────────────
  const handleTestClick = () => {
    setError(null);
    if (!name.trim())    { setError("Campaign name wajib diisi."); return; }
    if (!subject.trim()) { setError("Email subject wajib diisi.");  return; }
    const stripped = content.replace(/<[^>]*>/g, "").trim();
    if (!stripped)       { setError("Email content tidak boleh kosong."); return; }
    setShowTestConfirm(true);
  };

  // ── Save Campaign and Test Blast via Server Action ──────────────────────
  const handleSaveAndTest = async () => {
    setShowTestConfirm(false);
    setIsSubmitting(true);
    setError(null);

    if (!testEmail || !testEmail.includes("@")) {
      setError("Email target tidak valid.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Simpan Campaign
      const saveResult = await createCampaignAction({
        campaign_id: campaignId,
        name:        name.trim(),
        subject:     subject.trim(),
        content,
      });

      if (!saveResult.success) {
        setError(saveResult.error ?? "Gagal menyimpan campaign.");
        setIsSubmitting(false);
        return;
      }

      // 2. Kirim Test Blast
      const testResult = await triggerTestBlastAction(campaignId, testEmail);

      if (testResult.success) {
        setSuccess(true);
        // Reset form
        setName(""); setSubject(""); setContent(""); setTestEmail("");
        setTimeout(() => {
          router.push("/DataCampaign");
          router.refresh();
        }, 2000);
      } else {
        // Saved successfully but failed to send test blast
        setError(`Campaign berhasil disimpan, tetapi gagal mengirim email uji coba: ${testResult.error}`);
        setTimeout(() => {
          router.push("/DataCampaign");
          router.refresh();
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan atau mengirim test blast.");
      setIsSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Layout
      userName="Admin"
      userEmail="admin@blastmail.com"
      role="admin"                  // ganti ke "user" untuk role user biasa
    >
      {/* ── Page Header ── */}
      <div className="cc-header">
        <div>
          <nav className="cc-breadcrumb">
            <span>Campaigns</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9 18 15 12 9 6" /></svg>
            <span className="cc-breadcrumb-current">Create New</span>
          </nav>
          <h1 className="cc-page-title">Create Campaign</h1>
          <p className="cc-page-sub">Isi detail campaign email blast yang akan dikirim ke penerima.</p>
        </div>
        <div className="cc-header-controls">
          <button
            type="button"
            className="btn btn-outline cc-data-btn"
            onClick={() => router.push("/DataCampaign")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
              <path d="M12 3v18" />
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18" />
              <path d="M3 15h18" />
            </svg>
            Data Campaign
          </button>
        </div>
      </div>

      {/* ── Error / Success Alert ── */}
      {error && (
        <div className="cc-alert cc-alert-error" id="cc-error-msg">
          <span>⚠</span> {error}
        </div>
      )}
      {success && (
        <div className="cc-alert cc-alert-success" id="cc-success-msg">
          <span>✓</span> Campaign berhasil dibuat! Mengalihkan…
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="cc-page-layout">

        {/* LEFT: form + bottom actions */}
        <div className="cc-col-main">

          {/* Card: Form + Content (merged) */}
          <div className="cc-card">
            <div className="cc-card-head">
              <div className="cc-card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div>
                <div className="cc-card-title">Campaign Information</div>
                <div className="cc-card-sub">Isi detail campaign email blast</div>
              </div>
            </div>

            {/* Campaign Name */}
            <div className="cc-field">
              <label htmlFor="cc-name" className="cc-label">
                Campaign Name <span className="cc-req">*</span>
              </label>
              <input
                id="cc-name"
                type="text"
                className="cc-input"
                placeholder="contoh: Promo Januari 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
              />
            </div>

            {/* Email Subject */}
            <div className="cc-field">
              <label htmlFor="cc-subject" className="cc-label">
                Email Subject <span className="cc-req">*</span>
              </label>
              <input
                id="cc-subject"
                type="text"
                className="cc-input"
                placeholder="contoh: Promo Spesial Januari — Diskon hingga 50%"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="cc-hint">
                Subject line yang terlihat di inbox penerima email.
              </p>
            </div>

            {/* Email Content */}
            <div className="cc-field" style={{ marginBottom: 0 }}>
              <div className="cc-content-head">
                <label className="cc-label" style={{ margin: 0 }}>
                  Email Content <span className="cc-req">*</span>
                </label>
                {/* Mode toggle */}
                <div className="cc-mode-toggle">
                  <button
                    id="editor-manual-btn"
                    type="button"
                    className={`cc-mode-btn${editorMode === "manual" ? " cc-mode-btn-active" : ""}`}
                    onClick={() => setEditorMode("manual")}
                  >
                    Manual (Visual)
                  </button>
                  <button
                    id="editor-html-btn"
                    type="button"
                    className={`cc-mode-btn${editorMode === "html" ? " cc-mode-btn-active" : ""}`}
                    onClick={() => setEditorMode("html")}
                  >
                    HTML
                  </button>
                </div>
              </div>
              <p className="cc-hint" style={{ marginBottom: 10 }}>
                Body HTML email yang akan dikirim ke penerima.
              </p>

              {editorMode === "manual" ? (
                <BlockNoteEditor initialHTML={content} onChange={handleContentChange} />
              ) : (
                <>
                  <p className="cc-hint" style={{ marginBottom: 8 }}>
                    Ketik/paste HTML langsung. Mendukung semua tag email HTML standar.
                  </p>
                  <textarea
                    id="cc-html-editor"
                    className="cc-html-textarea"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={"<p>Halo <b>{{name}}</b>, selamat datang di promo kami!</p>"}
                    disabled={isSubmitting}
                    rows={14}
                  />
                </>
              )}
            </div>
          </div>

          {/* Ringkasan & Actions */}
          <div className="cc-bottom-row">

            {/* Status Badge */}
            <div className="cc-card cc-status-card">
              <div className="cc-status-inner">
                <div className="cc-status-left">
                  <div className="cc-status-label">Status Awal</div>
                  <span className="cc-badge-draft">DRAFT</span>
                </div>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#006cb7" strokeWidth="1.5" opacity="0.3">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <p className="cc-status-hint">Campaign akan disimpan sebagai draft dan bisa diedit sebelum dikirim.</p>
            </div>

            {/* Action Buttons */}
            <div className="cc-action-row">
              <button
                id="cc-submit-btn"
                type="button"
                className="btn btn-blue cc-submit-btn"
                onClick={handleSubmitClick}
                disabled={isSubmitting || success}
              >
                {isSubmitting ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: "spin 1s linear infinite" }}><circle cx="12" cy="12" r="10" strokeOpacity={0.2}/><path d="M12 2a10 10 0 0110 10"/></svg>
                    Menyimpan…
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
                    Simpan Campaign
                  </>
                )}
              </button>
              <button
                id="cc-test-btn"
                type="button"
                className="btn btn-outline cc-test-btn"
                onClick={handleTestClick}
                disabled={isSubmitting || success}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M4.7 22h14.6c.9 0 1.4-1 .8-1.7L13 10.4V4.5c0-.8.6-1.5 1.4-1.5h1.1a1 1 0 000-2H8.5a1 1 0 000 2H9.6c.8 0 1.4.7 1.4 1.5v5.9L4 20.3c-.6.7-.1 1.7.7 1.7z"/></svg>
                Test Blast
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT: sticky Tips sidebar */}
        <div className="cc-sidebar">
          <div className="cc-sidebar-sticky">
            <div className="cc-card cc-tips-card">
              <div className="cc-tips-title">Tips</div>
              <ul className="cc-tips-list">
                <li>Status awal selalu <strong>DRAFT</strong> — campaign belum dikirim ke siapapun.</li>
                <li>Gunakan mode <strong>HTML</strong> untuk layout email yang lebih kompleks.</li>
                <li>Campaign bisa diedit kembali sebelum di-blast ke penerima.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* ── Confirm Modal ── */}
      <ConfirmModal
        isOpen={showConfirm}
        campaignName={name}
        campaignId={campaignId}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />

      {/* ── Confirm Save & Test Modal ── */}
      <ConfirmSaveAndTestModal
        isOpen={showTestConfirm}
        campaignName={name}
        campaignId={campaignId}
        testEmail={testEmail}
        setTestEmail={setTestEmail}
        onConfirm={handleSaveAndTest}
        onCancel={() => setShowTestConfirm(false)}
        isSubmitting={isSubmitting}
      />

      {/* ── Scoped Styles ── */}
      <style>{`
        /* ── Header ── */
        .cc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
        }
        .cc-header-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }
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

        /* ── Two-column page layout ── */
        .cc-page-layout {
          display: grid;
          grid-template-columns: 1fr 240px;
          gap: 24px;
          align-items: start;
        }

        /* ── Left column ── */
        .cc-col-main { display: flex; flex-direction: column; gap: 20px; }

        /* ── Right sidebar (sticky Tips) ── */
        .cc-sidebar { /* column container, fills grid cell */ }
        .cc-sidebar-sticky {
          position: sticky;
          top: 24px;          /* sticks 24px from top of viewport when scrolling */
        }

        /* ── Bottom row (status + actions) inside left column ── */
        .cc-bottom-row {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 16px;
          align-items: start;
        }

        /* ── Action Row (buttons) ── */
        .cc-action-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-self: start;
        }

        /* ── Card ── */
        .cc-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05), 0 0 0 0 transparent;
          transition: box-shadow 0.2s;
        }
        .cc-card:focus-within {
          box-shadow: 0 2px 12px rgba(0,108,183,0.08);
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

        /* ── Status Card ── */
        .cc-status-card {
          background: linear-gradient(135deg, #f0f7ff, #e8f2ff);
          border-color: #bfdbfe;
        }
        .cc-status-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .cc-status-left { display: flex; flex-direction: column; gap: 6px; }
        .cc-status-label { font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .cc-status-hint { font-size: 0.72rem; color: #64748b; line-height: 1.5; margin: 0; }

        /* ── Fields ── */
        .cc-field { margin-bottom: 22px; }
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
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .cc-input::placeholder { color: #c4cdd8; }
        .cc-input:hover:not(:focus) { border-color: #94a3b8; background: #fafbfc; }
        .cc-input:focus {
          border-color: #006cb7;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(0,108,183,0.1);
        }
        .cc-hint { font-size: 0.72rem; color: #b0bac5; margin-top: 5px; line-height: 1.5; }

        /* ── Content Section Header ── */
        .cc-content-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        /* ── Mode Toggle ── */
        .cc-mode-toggle {
          display: flex;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 3px; gap: 2px;
          flex-shrink: 0;
        }
        .cc-mode-btn {
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 0.75rem; font-weight: 600;
          cursor: pointer; border: none;
          background: transparent; color: #64748b;
          transition: all 0.15s; font-family: inherit;
        }
        .cc-mode-btn:hover:not(.cc-mode-btn-active) { color: #0f172a; background: #e2e8f0; }
        .cc-mode-btn-active {
          background: #006cb7 !important;
          color: #fff !important;
          box-shadow: 0 1px 4px rgba(0,108,183,0.3);
        }

        /* ── HTML Textarea ── */
        .cc-html-textarea {
          width: 100%; min-height: 280px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 14px;
          color: #1d4ed8;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.82rem; resize: vertical;
          outline: none; line-height: 1.7;
          transition: border-color 0.2s;
        }
        .cc-html-textarea:focus { border-color: #006cb7; box-shadow: 0 0 0 3px rgba(0,108,183,0.1); }
        .cc-html-textarea::placeholder { color: #cbd5e1; }

        /* ── Badge ── */
        .cc-badge-draft { color: #d97706 !important; font-weight: 700; }

        /* ── Buttons ── */
        .btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px; border-radius: 8px;
          font-size: 0.875rem; font-weight: 600;
          cursor: pointer; border: none;
          transition: all 0.18s; font-family: inherit;
          text-decoration: none; white-space: nowrap;
        }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-blue {
          background: #006cb7; color: #fff;
          padding: 11px 20px;
          box-shadow: 0 2px 6px rgba(0,108,183,0.25);
        }
        .btn-blue:hover:not(:disabled) {
          background: #005fa3;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,108,183,0.35);
        }
        .btn-outline {
          background: transparent; color: #64748b;
          border: 1px solid #e2e8f0; padding: 10px 20px;
        }
        .btn-outline:hover:not(:disabled) { background: #f8fafc; color: #0f172a; }
        .cc-submit-btn { width: 100%; }
        .cc-test-btn {
          width: 100%;
          border: 1.5px solid #006cb7 !important;
          color: #006cb7 !important;
          background: #f0f9ff !important;
          box-shadow: 0 1px 3px rgba(0,108,183,0.08);
          padding: 10px 20px !important;
        }
        .cc-test-btn:hover:not(:disabled) {
          background: #e0f2fe !important;
          color: #0369a1 !important;
          border-color: #0369a1 !important;
          transform: translateY(-1px);
        }
        .cc-data-btn {
          border: 1.5px solid #475569 !important;
          color: #475569 !important;
          background: #fff !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          padding: 8px 16px !important;
        }
        .cc-data-btn:hover:not(:disabled) {
          background: #f1f5f9 !important;
          color: #0f172a !important;
          border-color: #0f172a !important;
          transform: translateY(-1px);
        }

        /* ── Tips Card (sidebar) ── */
        .cc-tips-card {
          background: linear-gradient(135deg, #fffbeb, #fef9ec);
          border-color: #fde68a;
          padding: 18px 20px;
        }
        .cc-tips-title {
          font-size: 0.75rem; font-weight: 700; color: #92400e;
          text-transform: uppercase; letter-spacing: 0.06em;
          margin-bottom: 10px;
        }
        .cc-tips-list {
          color: #64748b; font-size: 0.78rem; line-height: 1.7;
          padding-left: 1.2em; display: flex; flex-direction: column; gap: 4px;
        }

        /* ── Alerts ── */
        .cc-alert {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 16px; border-radius: 8px;
          font-size: 0.84rem; margin-bottom: 20px;
        }
        .cc-alert-error   { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
        .cc-alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }

        /* ── Modal ── */
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
          text-align: center;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-icon { font-size: 2rem; text-align: center; margin-bottom: 12px; }
        .modal-title {
          font-size: 1.1rem; font-weight: 800; text-align: center;
          color: #0f172a; margin-bottom: 8px;
        }
        .modal-msg {
          font-size: 0.875rem; color: #64748b;
          text-align: center; line-height: 1.65; margin-bottom: 24px;
        }
        .modal-code {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          background: #f1f5f9; padding: 1px 6px;
          border-radius: 4px; color: #1d4ed8; font-size: 0.82rem;
        }
        .modal-actions { display: flex; gap: 12px; justify-content: center; }
        .modal-actions .btn { flex: 1; max-width: 140px; }

         /* ── Responsive ── */
        @media (max-width: 900px) {
          .cc-page-layout { grid-template-columns: 1fr; }
          .cc-sidebar-sticky { position: static; }
          .cc-bottom-row { grid-template-columns: auto 1fr; }
          .cc-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .cc-header-controls {
            width: 100%;
            display: flex;
            justify-content: flex-end;
          }
          .modal-actions {
            flex-direction: column;
          }
          .modal-actions .btn {
            max-width: 100%;
            width: 100%;
          }
        }

        /* ── Spin ── */
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </Layout>
  );
}
