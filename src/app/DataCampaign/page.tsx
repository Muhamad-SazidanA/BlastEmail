"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Layout from "@/components/Layout";
import {
  getCampaignsAction,
  updateCampaignAction,
  deleteCampaignAction,
  triggerBlastAction,
  triggerTestBlastAction,
} from "@/app/actions/campaigns";

const BlockNoteEditor = dynamic(
  () => import("@/components/BlockNoteEditor"),
  { ssr: false }
);

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
            className="btn btn-blue"
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
              style={{ padding: "8px 12px", borderRadius: "8px", width: "100%", boxSizing: "border-box" }}
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

// ── Confirm Delete Modal ──────────────────────────────────────────────────────
interface DeleteModalProps {
  isOpen: boolean;
  campaignName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function ConfirmDeleteModal({ isOpen, campaignName, onConfirm, onCancel, isSubmitting }: DeleteModalProps) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
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
          Hapus campaign <strong>"{campaignName}"</strong>?<br />
          Tindakan ini tidak bisa dibatalkan.
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
            {isSubmitting ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
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
  const [blastCampaign, setBlastCampaign] = useState<Campaign | null>(null);
  const [testBlastCampaign, setTestBlastCampaign] = useState<Campaign | null>(null);
  const [deleteCampaign, setDeleteCampaign] = useState<Campaign | null>(null);
  
  // Edit Campaign form states
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [editName, setEditName] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editEditorMode, setEditEditorMode] = useState<"manual" | "html">("manual");
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
    // Detect if content is raw HTML or manual BlockNote
    const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(c.content);
    setEditEditorMode(hasHtmlTags ? "html" : "manual");
  };

  // Submit Edit Form
  const handleEditSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editCampaign) return;
    setEditError(null);

    if (!editName.trim()) { setEditError("Nama campaign wajib diisi."); return; }
    if (!editSubject.trim()) { setEditError("Subject email wajib diisi."); return; }
    const strippedContent = editContent.replace(/<[^>]*>/g, "").trim();
    if (!strippedContent) { setEditError("Konten email tidak boleh kosong."); return; }

    setIsSubmitting(true);
    try {
      const result = await updateCampaignAction(editCampaign.campaignId, {
        name: editName.trim(),
        subject: editSubject.trim(),
        content: editContent,
      });

      if (result.success) {
        setSuccess(`Campaign "${editName}" berhasil diperbarui!`);
        setEditCampaign(null);
        loadCampaigns(false);
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

  // Submit Blast Action
  const handleBlastConfirm = async () => {
    if (!blastCampaign) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await triggerBlastAction(blastCampaign.campaignId);
      if (result.success) {
        setSuccess(`Blast email untuk campaign "${blastCampaign.name}" berhasil dipicu.`);
        setBlastCampaign(null);
        loadCampaigns(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error ?? "Gagal memicu blast email.");
        setBlastCampaign(null);
      }
    } catch (err) {
      setError("Koneksi gagal saat mencoba memulai blast.");
      setBlastCampaign(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Test Blast Action
  const handleTestBlastConfirm = async (targetEmail: string) => {
    if (!testBlastCampaign) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await triggerTestBlastAction(testBlastCampaign.campaignId, targetEmail);
      if (result.success) {
        setSuccess(`Email uji coba campaign "${testBlastCampaign.name}" berhasil dikirim ke ${targetEmail}.`);
        setTestBlastCampaign(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error ?? "Gagal mengirim email uji coba.");
        setTestBlastCampaign(null);
      }
    } catch (err) {
      setError("Koneksi gagal saat mencoba mengirim email uji coba.");
      setTestBlastCampaign(null);
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

  // Render the styles (shared custom CSS rules)
  const renderStyles = () => (
    <style>{`
      /* ── Page Header ── */
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
      .cc-sidebar-sticky {
        position: sticky;
        top: 24px;
      }

      /* ── Bottom row inside left column ── */
      .cc-bottom-row {
        display: flex;
        gap: 16px;
        align-items: start;
      }

      /* ── Card styles ── */
      .cc-card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 24px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.05);
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

      .bp-table-card {
        padding: 24px 0 0 0;
        overflow: hidden;
      }
      .bp-table-card .cc-card-head {
        margin-left: 24px;
        margin-right: 24px;
      }

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
        box-sizing: border-box;
      }
      .cc-input::placeholder { color: #c4cdd8; }
      .cc-input:hover:not(:focus):not(:disabled) { border-color: #94a3b8; background: #fafbfc; }
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
        box-sizing: border-box;
      }
      .cc-html-textarea:focus { border-color: #006cb7; box-shadow: 0 0 0 3px rgba(0,108,183,0.1); }
      .cc-html-textarea::placeholder { color: #cbd5e1; }

      /* ── Tips Card ── */
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

      /* ── Table custom design ── */
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
      .bp-table th:last-child {
        background: #f8fafc !important;
      }
      .bp-table td:last-child {
        background: #ffffff !important;
      }
      .bp-table tbody tr:hover td:last-child {
        background-color: #fafbfc !important;
      }

      /* Text line clamping */
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
      .action-btn:hover:not(:disabled) {
        transform: translateY(-1px);
      }
      .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .blast-btn:hover:not(:disabled) {
        color: #2563eb;
        border-color: #bfdbfe;
        background: #eff6ff;
      }
      .test-btn:hover:not(:disabled) {
        color: #d97706;
        border-color: #fde68a;
        background: #fffbeb;
      }
      .edit-btn:hover:not(:disabled) {
        color: #10b981;
        border-color: #a7f3d0;
        background: #ecfdf5;
      }
      .delete-btn:hover:not(:disabled) {
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

      /* Button elements */
      .btn {
        display: inline-flex; align-items: center; justify-content: center;
        gap: 8px; border-radius: 8px;
        font-size: 0.875rem; font-weight: 600;
        cursor: pointer; border: none;
        transition: all 0.18s; font-family: inherit;
        padding: 10px 18px;
        text-decoration: none;
        white-space: nowrap;
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

      /* Modals styles */
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

      /* Responsive designs */
      @media (max-width: 900px) {
        .cc-page-layout { grid-template-columns: 1fr; }
        .cc-sidebar-sticky { position: static; }
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
    `}</style>
  );

  // ── Render View 1: Edit Campaign Form ───────────────────────────────────────
  if (editCampaign) {
    return (
      <Layout userName="Admin" userEmail="admin@blastmail.com" role="admin">
        {/* ── Page Header ── */}
        <div className="cc-header">
          <div>
            <nav className="cc-breadcrumb">
              <span>Campaigns</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9 18 15 12 9 6" /></svg>
              <span>Data Campaign</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9 18 15 12 9 6" /></svg>
              <span className="cc-breadcrumb-current">Edit Campaign</span>
            </nav>
            <h1 className="cc-page-title">Edit Campaign</h1>
            <p className="cc-page-sub">Edit detail campaign email blast yang akan disimpan ke database.</p>
          </div>
          <div className="cc-header-controls">
            <button
              type="button"
              className="btn btn-outline cc-data-btn"
              onClick={() => setEditCampaign(null)}
            >
              Kembali ke List
            </button>
          </div>
        </div>

        {/* ── Error Alert ── */}
        {editError && (
          <div className="cc-alert cc-alert-error">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ marginRight: 6, flexShrink: 0 }}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {editError}
          </div>
        )}

        {/* ── Two-column layout ── */}
        <div className="cc-page-layout">
          {/* LEFT: form + bottom actions */}
          <div className="cc-col-main">
            <div className="cc-card">
              <div className="cc-card-head">
                <div className="cc-card-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div>
                  <div className="cc-card-title">Campaign Information</div>
                  <div className="cc-card-sub">Ubah informasi detail campaign</div>
                </div>
              </div>

              {/* Campaign ID (Disabled) */}
              <div className="cc-field">
                <label className="cc-label">Campaign ID (Tidak dapat diubah)</label>
                <input
                  type="text"
                  className="cc-input"
                  value={editCampaign.campaignId}
                  disabled
                  style={{ background: "#f1f5f9", cursor: "not-allowed", border: "1.5px solid #cbd5e1" }}
                />
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
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
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
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
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
                  <div className="cc-mode-toggle">
                    <button
                      type="button"
                      className={`cc-mode-btn${editEditorMode === "manual" ? " cc-mode-btn-active" : ""}`}
                      onClick={() => setEditEditorMode("manual")}
                    >
                      Manual (Visual)
                    </button>
                    <button
                      type="button"
                      className={`cc-mode-btn${editEditorMode === "html" ? " cc-mode-btn-active" : ""}`}
                      onClick={() => setEditEditorMode("html")}
                    >
                      HTML
                    </button>
                  </div>
                </div>
                <p className="cc-hint" style={{ marginBottom: 10 }}>
                  Body HTML email yang akan dikirim ke penerima.
                </p>

                {editEditorMode === "manual" ? (
                  <BlockNoteEditor initialHTML={editContent} onChange={(html) => setEditContent(html)} />
                ) : (
                  <>
                    <p className="cc-hint" style={{ marginBottom: 8 }}>
                      Ketik/paste HTML langsung. Mendukung semua tag email HTML standar.
                    </p>
                    <textarea
                      id="cc-html-editor"
                      className="cc-html-textarea"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder={"<p>Halo <b>{{name}}</b>, selamat datang di promo kami!</p>"}
                      disabled={isSubmitting}
                      rows={14}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="cc-bottom-row" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setEditCampaign(null)}
                disabled={isSubmitting}
                style={{ width: "auto", padding: "10px 24px" }}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-blue"
                onClick={() => handleEditSubmit()}
                disabled={isSubmitting}
                style={{ width: "auto", padding: "10px 24px" }}
              >
                {isSubmitting ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: "spin 1s linear infinite", marginRight: "6px" }}><circle cx="12" cy="12" r="10" strokeOpacity={0.2}/><path d="M12 2a10 10 0 0110 10"/></svg>
                    Menyimpan…
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ marginRight: "6px" }}><polyline points="20 6 9 17 4 12"/></svg>
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT: sticky Tips sidebar */}
          <div className="cc-sidebar">
            <div className="cc-sidebar-sticky">
              <div className="cc-card cc-tips-card">
                <div className="cc-tips-title">Tips</div>
                <ul className="cc-tips-list">
                  <li>Mengubah detail campaign tidak akan memengaruhi data yang sudah terkirim sebelumnya.</li>
                  <li>Gunakan mode <strong>HTML</strong> untuk tata letak email yang lebih presisi jika diinginkan.</li>
                  <li>Pastikan Anda menguji campaign Anda terlebih dahulu menggunakan tombol <strong>Test Blast</strong> di halaman utama list.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Stylesheet styles */}
        {renderStyles()}
      </Layout>
    );
  }

  // ── Render View 2: List Campaigns Table ──────────────────────────────────────
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
          <p className="cc-page-sub">Manajemen template campaign, edit konten, kirim email blast, atau hapus campaign Anda.</p>
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
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ marginRight: 6, flexShrink: 0 }}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          {error}
        </div>
      )}
      {success && (
        <div className="cc-alert cc-alert-success">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ marginRight: 6, flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
          {success}
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
                  <th style={{ textAlign: "center", width: 180 }}>Aksi</th>
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

                      {/* Actions (4 buttons: Blast, Test, Edit, Delete) */}
                      <td style={{ textAlign: "center" }}>
                        <div className="action-buttons-wrapper">
                          <button
                            type="button"
                            className="action-btn blast-btn"
                            title="Blast Campaign"
                            onClick={() => setBlastCampaign(c)}
                            disabled={isSubmitting}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <line x1="22" y1="2" x2="11" y2="13" />
                              <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            className="action-btn test-btn"
                            title="Test Blast"
                            onClick={() => setTestBlastCampaign(c)}
                            disabled={isSubmitting}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path d="M4.7 22h14.6c.9 0 1.4-1 .8-1.7L13 10.4V4.5c0-.8.6-1.5 1.4-1.5h1.1a1 1 0 0 0 0-2H8.5a1 1 0 0 0 0 2H9.6c.8 0 1.4.7 1.4 1.5v5.9L4 20.3c-.6.7-.1 1.7.7 1.7z"/>
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

      {/* ── Confirm Blast Modal ── */}
      <ConfirmBlastModal
        isOpen={blastCampaign !== null}
        campaignName={blastCampaign?.name ?? ""}
        onConfirm={handleBlastConfirm}
        onCancel={() => setBlastCampaign(null)}
        isSubmitting={isSubmitting}
      />

      {/* ── Confirm Test Blast Modal ── */}
      <ConfirmTestModal
        isOpen={testBlastCampaign !== null}
        campaignName={testBlastCampaign?.name ?? ""}
        onConfirm={handleTestBlastConfirm}
        onCancel={() => setTestBlastCampaign(null)}
        isSubmitting={isSubmitting}
      />

      {/* ── Confirm Delete Modal ── */}
      <ConfirmDeleteModal
        isOpen={deleteCampaign !== null}
        campaignName={deleteCampaign?.name ?? ""}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteCampaign(null)}
        isSubmitting={isSubmitting}
      />

      {/* Stylesheet styles */}
      {renderStyles()}
    </Layout>
  );
}
