"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { getUsersAction, createUserAction } from "@/app/actions/users";

interface UserAccount {
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
}

export default function CreateUserPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch users from database on mount
  const fetchUsers = async () => {
    const res = await getUsersAction();
    if (res.success && res.users) {
      setUsers(res.users);
    } else {
      setErrorMsg(res.error ?? "Gagal mengambil data user.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg("Semua field wajib diisi.");
      return;
    }

    const res = await createUserAction({
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      role
    });

    if (res.success) {
      setSuccessMsg(`User "${name.trim()}" berhasil dibuat!`);
      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setRole("user");
      // Refresh user list
      fetchUsers();
    } else {
      setErrorMsg(res.error ?? "Gagal membuat user baru.");
    }
  };

  return (
    <Layout>
      {/* ── Page Header ── */}
      <div className="admin-header">
        <nav className="admin-breadcrumb">
          <span>Admin Only</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="admin-breadcrumb-current">Create User</span>
        </nav>
        <h1 className="admin-page-title">Manajemen Akun User</h1>
        <p className="admin-page-sub">Buat dan kelola kredensial pengguna yang dapat mengakses aplikasi BlastMail.</p>
      </div>

      <div className="admin-layout">
        {/* KIRI: Form Tambah User */}
        <div className="form-card">
          <h2 className="card-title">Buat User Baru</h2>
          <p className="card-subtitle">Kredensial baru ini dapat digunakan langsung untuk login.</p>
          
          {successMsg && (
            <div className="alert success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="alert error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-group">
              <label htmlFor="name-input">Nama Lengkap</label>
              <input
                id="name-input"
                type="text"
                className="form-control"
                placeholder="Contoh: John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email-input">Alamat Email</label>
              <input
                id="email-input"
                type="email"
                className="form-control"
                placeholder="Contoh: johndoe@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password-input">Password</label>
              <input
                id="password-input"
                type="password"
                className="form-control"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role-select">Role Akses</label>
              <select
                id="role-select"
                className="form-control select-ctrl"
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "user")}
              >
                <option value="user">User (Akses Terbatas)</option>
                <option value="admin">Admin (Akses Penuh)</option>
              </select>
            </div>

            <button type="submit" className="submit-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Buat User Akun
            </button>
          </form>
        </div>

        {/* KANAN: Daftar User Aktif */}
        <div className="list-card">
          <h2 className="card-title">Daftar Akun Terdaftar ({users.length})</h2>
          <p className="card-subtitle">Daftar akun yang terintegrasi di database sesi simulasi.</p>
          
          <div className="table-responsive">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Dibuat Pada</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="user-avatar-cell">
                        <span className={`avatar-initial ${u.role}`}>
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="user-name">{u.name}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge ${u.role}`}>
                        {u.role === "admin" ? "ADMIN" : "USER"}
                      </span>
                    </td>
                    <td className="date-cell">{u.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .admin-header { margin-bottom: 24px; }
        .admin-breadcrumb {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px;
        }
        .admin-breadcrumb-current { color: #64748b; }
        .admin-page-title {
          font-size: 1.5rem; font-weight: 800; color: #0f172a;
          letter-spacing: -0.02em;
        }
        .admin-page-sub { font-size: 0.8rem; color: #94a3b8; margin-top: 2px; }

        /* Grid Layout */
        .admin-layout {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 24px;
          align-items: start;
        }

        .form-card, .list-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }

        .card-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
        }

        .card-subtitle {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 2px;
          margin-bottom: 20px;
        }

        /* Form Controls */
        .user-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-control {
          width: 100%;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 0.85rem;
          color: #0f172a;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-control:focus {
          border-color: #006cb7;
        }

        .select-ctrl {
          cursor: pointer;
        }

        .submit-btn {
          margin-top: 8px;
          padding: 12px;
          background: #006cb7;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-btn:hover {
          background: #005fa3;
        }

        /* Alerts */
        .alert {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .alert.success {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #059669;
        }

        .alert.error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        /* Table Styles */
        .table-responsive {
          overflow-x: auto;
        }

        .user-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.85rem;
        }

        .user-table th {
          padding: 12px;
          border-bottom: 2.5px solid #e2e8f0;
          font-weight: 700;
          color: #64748b;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .user-table td {
          padding: 12px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }

        .user-avatar-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .avatar-initial {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
        }
        .avatar-initial.admin { background: #dbeafe; color: #1d4ed8; }
        .avatar-initial.user { background: #faf5ff; color: #7e22ce; }

        .user-name {
          font-weight: 600;
          color: #0f172a;
        }

        .role-badge {
          display: inline-flex;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
        }
        .role-badge.admin { background: #dbeafe; color: #1d4ed8; }
        .role-badge.user { background: #f3e8ff; color: #7e22ce; }

        .date-cell {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.75rem;
          color: #64748b;
        }

        @media (max-width: 900px) {
          .admin-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
}
