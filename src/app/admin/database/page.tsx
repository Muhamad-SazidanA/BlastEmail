"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { 
  getSpreadsheetConfigsAction, 
  createSpreadsheetConfigAction, 
  updateSpreadsheetConfigAction, 
  deleteSpreadsheetConfigAction 
} from "@/app/actions/campaigns";

interface SpreadsheetConfig {
  id: number;
  sheet_name: string;
  sheet_id: string;
}

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export default function DatabasePage() {
  const [configs, setConfigs] = useState<SpreadsheetConfig[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<SpreadsheetConfig | null>(null);

  // Form Inputs
  const [sheetName, setSheetName] = useState("");
  const [sheetId, setSheetId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to show Toast Notification
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Load configs on mount
  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const res = await getSpreadsheetConfigsAction();
      if (res.success && res.configs) {
        setConfigs(res.configs as SpreadsheetConfig[]);
      } else {
        showToast(res.error ?? "Gagal memuat konfigurasi database spreadsheet.", "error");
      }
    } catch (_) {
      showToast("Koneksi gagal saat mencoba memuat database.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const openCreateModal = () => {
    setSheetName("");
    setSheetId("");
    setIsCreateOpen(true);
  };

  const openEditModal = (config: SpreadsheetConfig) => {
    setSelectedConfig(config);
    setSheetName(config.sheet_name);
    setSheetId(config.sheet_id);
    setIsEditOpen(true);
  };

  const openDeleteModal = (config: SpreadsheetConfig) => {
    setSelectedConfig(config);
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetName.trim() || !sheetId.trim()) {
      showToast("Nama Sheet dan Sheet ID wajib diisi.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await createSpreadsheetConfigAction(sheetName.trim(), sheetId.trim());
      if (res.success) {
        showToast(`Database "${sheetName.trim()}" berhasil dibuat!`, "success");
        setIsCreateOpen(false);
        loadConfigs();
      } else {
        showToast(res.error ?? "Gagal menyimpan database baru.", "error");
      }
    } catch (_) {
      showToast("Gagal menghubungi server database.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfig) return;
    if (!sheetName.trim() || !sheetId.trim()) {
      showToast("Nama Sheet dan Sheet ID wajib diisi.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await updateSpreadsheetConfigAction(selectedConfig.id, sheetName.trim(), sheetId.trim());
      if (res.success) {
        showToast(`Database "${sheetName.trim()}" berhasil diperbarui!`, "success");
        setIsEditOpen(false);
        loadConfigs();
      } else {
        showToast(res.error ?? "Gagal memperbarui database.", "error");
      }
    } catch (_) {
      showToast("Gagal menghubungi server database.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedConfig) return;
    setIsSubmitting(true);
    try {
      const res = await deleteSpreadsheetConfigAction(selectedConfig.id);
      if (res.success) {
        showToast(`Database "${selectedConfig.sheet_name}" berhasil dihapus!`, "success");
        setIsDeleteOpen(false);
        loadConfigs();
      } else {
        showToast(res.error ?? "Gagal menghapus database.", "error");
      }
    } catch (_) {
      showToast("Gagal menghubungi server database.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered configs for search
  const filteredConfigs = configs.filter((c) =>
    c.sheet_name.toLowerCase().includes(search.toLowerCase()) ||
    c.sheet_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      {/* ── Page Header ── */}
      <div className="cc-header">
        <div>
          <nav className="cc-breadcrumb">
            <span>Admin Only</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="cc-breadcrumb-current">Database</span>
          </nav>
          <h1 className="cc-page-title">Manajemen Database Spreadsheet</h1>
          <p className="cc-page-sub">Kelola lembar kerja Google Sheets untuk database pengiriman email massal.</p>
        </div>

        <div className="bp-header-controls">
          <button type="button" className="btn btn-blue" onClick={openCreateModal}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ marginRight: 6 }}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tambah Database
          </button>
        </div>
      </div>

      {/* ── Control & Search Bar ── */}
      <div className="control-bar-wrapper" style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center" }}>
        <div className="search-box-container" style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", zIndex: 5 }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="cc-input"
            placeholder="Cari nama sheet atau ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "36px" }}
          />
        </div>
      </div>

      {/* ── Main Data Card ── */}
      <div className="cc-card bp-table-card">
        <div className="cc-card-head">
          <div className="cc-card-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
            </svg>
          </div>
          <div>
            <h2 className="cc-card-title">Daftar Spreadsheet Database</h2>
            <p className="cc-card-sub">Daftar konfigurasi nama sheet Google Sheets yang siap digunakan</p>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-spinner-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006cb7" strokeWidth={3} className="spin">
              <circle cx="12" cy="12" r="10" strokeOpacity={0.2} />
              <path d="M12 2a10 10 0 0110 10" />
            </svg>
            <span className="loading-text">Memuat database...</span>
          </div>
        ) : filteredConfigs.length === 0 ? (
          <div className="empty-state">
            <p>{search ? "Tidak ada database yang cocok dengan pencarian Anda." : "Belum ada konfigurasi database spreadsheet."}</p>
          </div>
        ) : (
          <div className="bp-table-responsive">
            <table className="bp-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "center", width: 60 }}>No</th>
                  <th>Nama Database (Sheet Name)</th>
                  <th>Google Sheet ID</th>
                  <th style={{ textAlign: "center", width: 120 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredConfigs.map((config, index) => (
                  <tr key={config.id}>
                    <td style={{ textAlign: "center" }} className="font-semibold">{index + 1}</td>
                    <td className="font-semibold text-dark">{config.sheet_name}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "#64748b" }}>{config.sheet_id}</td>
                    <td>
                      <div className="action-buttons-wrapper">
                        <button
                          type="button"
                          className="action-btn edit-btn"
                          title="Edit Database"
                          onClick={() => openEditModal(config)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="action-btn delete-btn"
                          title="Hapus Database"
                          onClick={() => openDeleteModal(config)}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE DATABASE MODAL ── */}
      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2 className="modal-title">Tambah Database Baru</h2>
            <p className="modal-msg" style={{ margin: "4px 0 16px 0" }}>
              Tambahkan konfigurasi sheet dan Google Sheet ID baru.
            </p>
            <form onSubmit={handleCreateSubmit}>
              <div className="cc-field" style={{ textAlign: "left" }}>
                <label className="cc-label" htmlFor="create-sheet-name">Nama Sheet (sheet_name) <span className="cc-req">*</span></label>
                <input
                  id="create-sheet-name"
                  type="text"
                  className="cc-input"
                  placeholder="Contoh: Sheet1"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="cc-field" style={{ textAlign: "left" }}>
                <label className="cc-label" htmlFor="create-sheet-id">Google Sheet ID (sheet_id) <span className="cc-req">*</span></label>
                <input
                  id="create-sheet-id"
                  type="text"
                  className="cc-input"
                  placeholder="Contoh: 1a2b3c4d5e6f..."
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
                  Batal
                </button>
                <button type="submit" className="btn btn-blue" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT DATABASE MODAL ── */}
      {isEditOpen && selectedConfig && (
        <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2 className="modal-title">Edit Database</h2>
            <p className="modal-msg" style={{ margin: "4px 0 16px 0" }}>
              Ubah konfigurasi untuk database spreadsheet ini.
            </p>
            <form onSubmit={handleEditSubmit}>
              <div className="cc-field" style={{ textAlign: "left" }}>
                <label className="cc-label" htmlFor="edit-sheet-name">Nama Sheet (sheet_name) <span className="cc-req">*</span></label>
                <input
                  id="edit-sheet-name"
                  type="text"
                  className="cc-input"
                  placeholder="Contoh: Sheet1"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="cc-field" style={{ textAlign: "left" }}>
                <label className="cc-label" htmlFor="edit-sheet-id">Google Sheet ID (sheet_id) <span className="cc-req">*</span></label>
                <input
                  id="edit-sheet-id"
                  type="text"
                  className="cc-input"
                  placeholder="Contoh: 1a2b3c4d5e6f..."
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setIsEditOpen(false)} disabled={isSubmitting}>
                  Batal
                </button>
                <button type="submit" className="btn btn-blue" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE DATABASE MODAL ── */}
      {isDeleteOpen && selectedConfig && (
        <div className="modal-overlay" onClick={() => setIsDeleteOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: "50%", background: "#fef2f2", margin: "0 auto 16px auto", color: "#dc2626" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </div>
            <h2 className="modal-title">Hapus Database?</h2>
            <p className="modal-msg" style={{ margin: "8px 0 16px 0" }}>
              Apakah Anda yakin ingin menghapus konfigurasi database untuk <strong>"{selectedConfig.sheet_name}"</strong>? Aksi ini tidak dapat dibatalkan.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>
                Batal
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATIONS CONTAINER ── */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">
              {t.type === "success" && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {t.type === "error" && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              {t.type === "info" && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="12" x2="12" y2="16" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
            </span>
            <span className="toast-message">{t.message}</span>
            <button className="toast-close" onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}>
              &times;
            </button>
          </div>
        ))}
      </div>

      <style>{`
        /* ── Page Header ── */
        .cc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
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
        .bp-header-controls {
          display: flex;
          align-items: center;
          gap: 12px;
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

        /* ── Fields & Inputs ── */
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

        /* ── Table Styling ── */
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

        /* ── Action Buttons ── */
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

        /* ── General Layout Utils ── */
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
        @keyframes spin { 100% { transform: rotate(360deg); } }

        /* ── Button elements ── */
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

        /* ── Modals with backdrop filter ── */
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

        /* ── Toast Notifications ── */
        .toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 9999;
          pointer-events: none;
        }
        .toast {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 320px;
          max-width: 420px;
          padding: 14px 18px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideIn {
          from { transform: translateY(-12px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .toast-success { border-left: 4px solid #10b981; }
        .toast-error { border-left: 4px solid #ef4444; }
        .toast-info { border-left: 4px solid #3b82f6; }

        .toast-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .toast-success .toast-icon { color: #10b981; }
        .toast-error .toast-icon { color: #ef4444; }
        .toast-info .toast-icon { color: #3b82f6; }
        
        .toast-message {
          font-size: 0.85rem;
          font-weight: 500;
          color: #1e293b;
          flex: 1;
          line-height: 1.4;
        }
        .toast-close {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 1.1rem;
          padding: 0 4px;
          transition: color 0.15s;
        }
        .toast-close:hover { color: #64748b; }
      `}</style>
    </Layout>
  );
}
