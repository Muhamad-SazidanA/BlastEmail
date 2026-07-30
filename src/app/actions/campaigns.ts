"use server";

import { db } from "@/lib/db";

/**
 * Converts raw technical error messages to user-friendly Indonesian messages.
 * This prevents non-IT users from seeing Prisma/SQL/network internals.
 */
function friendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);

  // Database connection errors
  if (msg.includes("Can't reach database server") || msg.includes("ECONNREFUSED")) {
    return "Tidak dapat terhubung ke database. Pastikan server database sudah aktif dan berjalan.";
  }
  if (msg.includes("Connection refused") || msg.includes("connect ETIMEDOUT")) {
    return "Koneksi ke database gagal (timeout). Silakan coba lagi dalam beberapa saat.";
  }
  if (msg.includes("Access denied")) {
    return "Akses ke database ditolak. Hubungi administrator untuk memeriksa konfigurasi.";
  }

  // Table/schema errors
  if (msg.includes("doesn't exist") || msg.includes("does not exist")) {
    return "Struktur database belum lengkap. Hubungi administrator untuk menjalankan migrasi database.";
  }
  if (msg.includes("Unknown column") || msg.includes("Unknown field")) {
    return "Terdapat ketidaksesuaian struktur database. Hubungi administrator.";
  }

  // Prisma-specific
  if (msg.includes("PrismaClientInitializationError")) {
    return "Gagal menginisialisasi koneksi database. Pastikan server database aktif.";
  }
  if (msg.includes("PrismaClientKnownRequestError") || msg.includes("Raw query failed")) {
    return "Terjadi kesalahan saat memproses data. Silakan coba lagi atau hubungi administrator.";
  }

  // n8n / webhook errors
  if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED") || msg.includes("Failed to fetch") || msg.includes("UNABLE_TO_VERIFY") || msg.includes("CERT_")) {
    return `Gagal menghubungi server otomasi n8n (${msg}). Pastikan server n8n aktif dan URL webhook dapat diakses.`;
  }

  // Fallback: still keep it clean
  return "Terjadi kesalahan pada sistem. Silakan coba lagi atau hubungi administrator.";
}

export interface CampaignInput {
  campaign_id: string;
  name: string;
  subject: string;
  content: string;
}

export async function createCampaignAction(data: CampaignInput) {
  try {
    const { campaign_id, name, subject, content } = data;

    if (!campaign_id || !name || !subject || !content) {
      return { success: false, error: "All fields are required" };
    }

    // Check campaign_id uniqueness (selecting only campaignId to avoid zero-date issues)
    const existing = await db.campaign.findUnique({
      where: { campaignId: campaign_id },
      select: { campaignId: true }
    });

    if (existing) {
      return { success: false, error: `Campaign ID "${campaign_id}" already exists` };
    }

    const campaign = await db.campaign.create({
      data: {
        campaignId: campaign_id,
        name,
        subject,
        content,
        status: "DRAFT",
      },
      select: {
        id: true,
        campaignId: true,
        name: true,
        subject: true,
        content: true,
        status: true,
      }
    });

    return { success: true, campaign };
  } catch (error) {
    console.error("Failed to create campaign:", error);
    return {
      success: false,
      error: friendlyError(error),
    };
  }
}

export async function getCampaignsAction() {
  try {
    const campaigns = await db.campaign.findMany({
      orderBy: { id: "desc" },
      select: {
        id: true,
        campaignId: true,
        name: true,
        subject: true,
        content: true,
        status: true,
      }
    });
    return { success: true, campaigns };
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);
    return {
      success: false,
      error: friendlyError(error),
    };
  }
}

export async function triggerBlastAction(campaignId: string, sheetName: string) {
  try {
    const campaign = await db.campaign.findUnique({
      where: { campaignId },
      select: {
        campaignId: true,
        name: true,
        subject: true,
        content: true,
        status: true,
      }
    });

    if (!campaign) {
      return { success: false, error: "Campaign tidak ditemukan." };
    }

    // Ambil sheet_id dari tabel spreadsheet_config jika sheetName diisi
    let sheetId = "";
    if (sheetName) {
      try {
        const sheetConfigs = await db.$queryRawUnsafe<any[]>(
          "SELECT sheet_id as sheetId FROM spreadsheet_config WHERE sheet_name = ? LIMIT 1",
          sheetName
        );
        if (sheetConfigs && sheetConfigs.length > 0) {
          sheetId = sheetConfigs[0].sheetId || "";
        }
      } catch (err) {
        console.warn("Gagal mengambil sheet_id dari spreadsheet_config:", err);
      }
    }

    // Update status ke SENDING dan isi startedAt
    const updatedCampaign = await db.campaign.update({
      where: { campaignId },
      data: {
        status: "SENDING",
        startedAt: new Date(),
      },
      select: {
        campaignId: true,
        name: true,
        subject: true,
        content: true,
        status: true,
      }
    });

    // Panggil webhook n8n blast dengan payload id_campaign dan sheet_name
    const webhookUrl = process.env.N8N_BLAST_WEBHOOK_URL || "http://localhost:5678/webhook/blast-email";
    
    let response: Response;
    try {
      response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaign_id: updatedCampaign.campaignId,
          sheet_name: sheetName,
        }),
      });
    } catch (fetchErr: any) {
      console.error("n8n fetch connection error:", fetchErr);
      await db.campaign.update({
        where: { campaignId },
        data: { status: "FAILED" },
      }).catch(() => {});

      const detail = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      return {
        success: false,
        error: `Gagal terhubung ke server n8n (${detail}). Pastikan URL (${webhookUrl}) valid, server n8n aktif, dan dapat dijangkau.`,
      };
    }

    // Parsing response body
    let resData: any = null;
    let rawText = "";
    try {
      rawText = await response.text();
      if (rawText) {
        const parsed = JSON.parse(rawText);
        resData = Array.isArray(parsed) ? parsed[0] : parsed;
      }
    } catch (_) {}

    // Jika response HTTP tidak OK atau response data mengindikasikan kegagalan
    if (!response.ok || (resData && resData.success === false)) {
      await db.campaign.update({
        where: { campaignId },
        data: { status: "FAILED" },
      }).catch(() => {});

      let errorMsg = resData?.message || resData?.error;
      if (!errorMsg) {
        if (response.status === 404) {
          errorMsg = `Webhook n8n tidak ditemukan (HTTP 404). Pastikan Workflow di n8n sudah di-Aktifkan (Active/ON) dan URL webhook (${webhookUrl}) sesuai.`;
        } else if (response.status === 500) {
          errorMsg = `Server n8n mengalami error internal (HTTP 500). Periksa log node di n8n.`;
        } else {
          errorMsg = `Webhook n8n merespon dengan status: ${response.status} ${response.statusText}`;
        }
      }

      return {
        success: false,
        error: errorMsg,
      };
    }

    const successMessage = resData?.message || `Blast email untuk campaign "${updatedCampaign.name}" berhasil dijalankan.`;
    return { success: true, message: successMessage, campaign: updatedCampaign };
  } catch (error) {
    console.error("Failed to trigger blast:", error);
    try {
      await db.campaign.update({
        where: { campaignId },
        data: { status: "FAILED" },
      });
    } catch (_) {}
    return {
      success: false,
      error: friendlyError(error),
    };
  }
}

export async function triggerTestBlastAction(campaignId: string, testEmail: string, sheetName: string) {
  try {
    const campaign = await db.campaign.findUnique({
      where: { campaignId },
      select: {
        campaignId: true,
        name: true,
        subject: true,
        content: true,
        status: true,
      }
    });

    if (!campaign) {
      return { success: false, error: "Campaign tidak ditemukan." };
    }

    if (!testEmail || !testEmail.includes("@")) {
      return { success: false, error: "Email target tidak valid." };
    }

    // Panggil webhook n8n test blast dengan payload id_campaign dan email saja
    const webhookUrl = process.env.N8N_TEST_BLAST_WEBHOOK_URL || "http://localhost:5678/webhook/test-blast";
    
    let response: Response;
    try {
      response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaign_id: campaign.campaignId,
          email: testEmail,
        }),
      });
    } catch (fetchErr: any) {
      console.error("n8n test blast fetch connection error:", fetchErr);
      const detail = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      return {
        success: false,
        error: `Gagal terhubung ke server n8n (${detail}). Pastikan URL (${webhookUrl}) valid, server n8n aktif, dan dapat dijangkau.`,
      };
    }

    // Parsing response body
    let resData: any = null;
    let rawText = "";
    try {
      rawText = await response.text();
      if (rawText) {
        const parsed = JSON.parse(rawText);
        resData = Array.isArray(parsed) ? parsed[0] : parsed;
      }
    } catch (_) {}

    // Jika response HTTP tidak OK atau response data mengindikasikan kegagalan
    if (!response.ok || (resData && resData.success === false)) {
      let errorMsg = resData?.message || resData?.error;
      if (!errorMsg) {
        if (response.status === 404) {
          errorMsg = `Webhook test n8n tidak ditemukan (HTTP 404). Pastikan Workflow di n8n sudah di-Aktifkan (Active/ON) dan URL webhook (${webhookUrl}) sesuai.`;
        } else if (response.status === 500) {
          errorMsg = `Server n8n mengalami error internal (HTTP 500). Periksa log node di n8n.`;
        } else {
          errorMsg = `Webhook n8n merespon dengan status: ${response.status} ${response.statusText}`;
        }
      }
      return {
        success: false,
        error: errorMsg,
      };
    }

    const successMessage = resData?.message || "Email uji coba berhasil dikirim.";
    return { success: true, message: successMessage };
  } catch (error) {
    console.error("Failed to trigger test blast:", error);
    return {
      success: false,
      error: friendlyError(error),
    };
  }
}

export async function updateCampaignAction(
  campaignId: string,
  data: { name: string; subject: string; content: string }
) {
  try {
    const { name, subject, content } = data;
    if (!name.trim() || !subject.trim() || !content.trim()) {
      return { success: false, error: "Semua field (Nama, Subject, Content) wajib diisi." };
    }

    const updated = await db.campaign.update({
      where: { campaignId },
      data: {
        name: name.trim(),
        subject: subject.trim(),
        content,
      },
      select: {
        campaignId: true,
        name: true,
        subject: true,
        content: true,
        status: true,
      }
    });

    return { success: true, campaign: updated };
  } catch (error) {
    console.error("Failed to update campaign:", error);
    return {
      success: false,
      error: friendlyError(error),
    };
  }
}

export async function deleteCampaignAction(campaignId: string) {
  try {
    await db.campaign.delete({
      where: { campaignId },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete campaign:", error);
    return {
      success: false,
      error: friendlyError(error),
    };
  }
}

export async function getSpreadsheetConfigsAction() {
  try {
    // Auto-create table if it doesn't exist
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS spreadsheet_config (
        id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        sheet_name  VARCHAR(255) NOT NULL,
        sheet_id    VARCHAR(255) NOT NULL DEFAULT '',
        created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Ensure sheet_id column exists using cross-compatible MySQL syntax
    try {
      const cols = await db.$queryRawUnsafe<any[]>(
        "SHOW COLUMNS FROM spreadsheet_config LIKE 'sheet_id'"
      );
      if (!cols || cols.length === 0) {
        await db.$executeRawUnsafe(
          "ALTER TABLE spreadsheet_config ADD COLUMN sheet_id VARCHAR(255) NOT NULL DEFAULT ''"
        );
      }
    } catch (colErr) {
      console.warn("Could not check/add sheet_id column:", colErr);
    }

    let configs: any[] = [];
    try {
      configs = await db.$queryRawUnsafe<any[]>(
        "SELECT id, sheet_name as sheetName, sheet_id as sheetId FROM spreadsheet_config ORDER BY id ASC"
      );
    } catch (_) {
      // Fallback query if sheet_id column is somehow missing
      configs = await db.$queryRawUnsafe<any[]>(
        "SELECT id, sheet_name as sheetName, '' as sheetId FROM spreadsheet_config ORDER BY id ASC"
      );
    }

    // Convert BigInt id to Number for JSON serialization
    const cleanConfigs = configs.map((c) => ({
      id: Number(c.id),
      sheet_name: c.sheetName || "",
      sheet_id: c.sheetId || "",
    }));

    return { success: true, configs: cleanConfigs };
  } catch (error) {
    console.error("Failed to fetch spreadsheet configs:", error);
    return {
      success: false,
      error: friendlyError(error),
    };
  }
}

export async function createSpreadsheetConfigAction(sheetName: string, sheetId: string) {
  try {
    if (!sheetName.trim() || !sheetId.trim()) {
      return { success: false, error: "Nama Sheet dan Sheet ID wajib diisi." };
    }

    await db.$executeRawUnsafe(
      "INSERT INTO spreadsheet_config (sheet_name, sheet_id) VALUES (?, ?)",
      sheetName.trim(),
      sheetId.trim()
    );

    return { success: true };
  } catch (error) {
    console.error("Failed to create spreadsheet config:", error);
    return {
      success: false,
      error: friendlyError(error),
    };
  }
}

export async function updateSpreadsheetConfigAction(id: number, sheetName: string, sheetId: string) {
  try {
    if (!sheetName.trim() || !sheetId.trim()) {
      return { success: false, error: "Nama Sheet dan Sheet ID wajib diisi." };
    }

    await db.$executeRawUnsafe(
      "UPDATE spreadsheet_config SET sheet_name = ?, sheet_id = ? WHERE id = ?",
      sheetName.trim(),
      sheetId.trim(),
      id
    );

    return { success: true };
  } catch (error) {
    console.error("Failed to update spreadsheet config:", error);
    return {
      success: false,
      error: friendlyError(error),
    };
  }
}

export async function deleteSpreadsheetConfigAction(id: number) {
  try {
    await db.$executeRawUnsafe(
      "DELETE FROM spreadsheet_config WHERE id = ?",
      id
    );
    return { success: true };
  } catch (error) {
    console.error("Failed to delete spreadsheet config:", error);
    return {
      success: false,
      error: friendlyError(error),
    };
  }
}
