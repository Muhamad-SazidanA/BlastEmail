"use server";

import { db } from "@/lib/db";

/**
 * Converts raw technical error messages to user-friendly Indonesian messages.
 */
function friendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes("Can't reach database server") || msg.includes("ECONNREFUSED"))
    return "Tidak dapat terhubung ke database. Pastikan server database sudah aktif dan berjalan.";
  if (msg.includes("Connection refused") || msg.includes("connect ETIMEDOUT"))
    return "Koneksi ke database gagal (timeout). Silakan coba lagi dalam beberapa saat.";
  if (msg.includes("doesn't exist") || msg.includes("does not exist"))
    return "Struktur database belum lengkap. Hubungi administrator untuk menjalankan migrasi database.";
  if (msg.includes("PrismaClientInitializationError"))
    return "Gagal menginisialisasi koneksi database. Pastikan server database aktif.";
  return "Terjadi kesalahan pada sistem. Silakan coba lagi atau hubungi administrator.";
}

export async function getRobotStatusesAction() {
  try {
    // Bypassing Prisma Client model generation synchronization issues by using raw SQL query.
    // This allows fetching from 'robot_status' immediately even if npx prisma generate hasn't been run yet.
    const statuses = await db.$queryRawUnsafe<any[]>(
      `SELECT id, robot_name as robotName, sender_email as senderEmail, status, current_campaign as currentCampaign, total_target as totalTarget, total_sent as totalSent, total_failed as totalFailed, last_error as lastError FROM robot_status ORDER BY id ASC`
    );

    // Explicitly convert BigInt columns (returned by raw query on some DB platforms/types) 
    // to standard JavaScript Numbers to avoid serialization and frontend calculation crashes.
    const cleanStatuses = statuses.map((bot) => ({
      id: Number(bot.id),
      robotName: bot.robotName,
      senderEmail: bot.senderEmail,
      status: bot.status,
      currentCampaign: bot.currentCampaign,
      totalTarget: Number(bot.totalTarget || 0),
      totalSent: Number(bot.totalSent || 0),
      totalFailed: Number(bot.totalFailed || 0),
      lastError: bot.lastError,
    }));

    return { success: true, data: cleanStatuses };
  } catch (error) {
    console.error("Failed to fetch robot statuses via raw query:", error);
    return {
      success: false,
      error: friendlyError(error),
    };
  }
}
