"use server";

import { db } from "@/lib/db";

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
      error: error instanceof Error ? error.message : "Unknown error",
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
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function triggerBlastAction(campaignId: string) {
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

    // Panggil webhook n8n blast dengan payload id_campaign saja
    const webhookUrl = process.env.N8N_BLAST_WEBHOOK_URL || "http://localhost:5678/webhook/blast-email";
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_campaign: updatedCampaign.campaignId,
      }),
    });

    // Coba parsing response body untuk mendapatkan status sukses/error detail
    let resData: any = null;
    try {
      const rawText = await response.text();
      if (rawText) {
        const parsed = JSON.parse(rawText);
        resData = Array.isArray(parsed) ? parsed[0] : parsed;
      }
    } catch (_) {}

    // Jika response HTTP tidak OK atau response data mengindikasikan kegagalan
    if (!response.ok || (resData && resData.success === false)) {
      const errorMsg = resData?.message || resData?.error || `Webhook n8n merespon dengan status: ${response.status}`;
      return {
        success: false,
        error: errorMsg,
      };
    }

    const successMessage = resData?.message || `Blast email untuk campaign "${updatedCampaign.name}" berhasil dijalankan.`;
    return { success: true, message: successMessage, campaign: updatedCampaign };
  } catch (error) {
    console.error("Failed to trigger blast:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memicu blast email. Pastikan n8n aktif.",
    };
  }
}

export async function triggerTestBlastAction(campaignId: string, testEmail: string) {
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

    // Panggil webhook n8n test blast dengan payload id_campaign dan email
    const webhookUrl = process.env.N8N_TEST_BLAST_WEBHOOK_URL || "http://localhost:5678/webhook/test-blast";
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_campaign: campaign.campaignId,
        email: testEmail,
      }),
    });

    // Coba parsing response body untuk mendapatkan status sukses/error detail
    let resData: any = null;
    try {
      const rawText = await response.text();
      if (rawText) {
        const parsed = JSON.parse(rawText);
        resData = Array.isArray(parsed) ? parsed[0] : parsed;
      }
    } catch (_) {}

    // Jika response HTTP tidak OK atau response data mengindikasikan kegagalan
    if (!response.ok || (resData && resData.success === false)) {
      const errorMsg = resData?.message || resData?.error || `Webhook n8n merespon dengan status: ${response.status}`;
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
      error: error instanceof Error ? error.message : "Gagal memicu test blast. Pastikan n8n aktif.",
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
      error: error instanceof Error ? error.message : "Gagal memperbarui campaign.",
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
      error: error instanceof Error ? error.message : "Gagal menghapus campaign.",
    };
  }
}
