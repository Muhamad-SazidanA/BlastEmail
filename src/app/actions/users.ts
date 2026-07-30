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

// Helper to seed default accounts if database is empty
async function seedDefaultUsersIfNeeded() {
  try {
    // 1. Buat tabel users jika belum ada (tanpa menyentuh tabel lain)
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(191) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
        updated_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Isi data default jika masih kosong
    const count = await db.user.count();
    if (count === 0) {
      await db.user.createMany({
        data: [
          {
            name: "Admin",
            email: "blasteadmin@gmail.com",
            password: "BEA1qa2ws3ed",
            role: "admin",
          },
          {
            name: "User Blast",
            email: "userblast1@gmail.com",
            password: "UserB123456",
            role: "user",
          }
        ]
      });
    }
  } catch (e) {
    console.error("Error seeding default users:", e);
  }
}

export async function getUsersAction() {
  try {
    await seedDefaultUsersIfNeeded();
    const users = await db.user.findMany({
      orderBy: {
        createdAt: "desc"
      },
      select: {
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // Format dates to string
    const formatted = users.map(u => ({
      name: u.name,
      email: u.email,
      role: u.role as "admin" | "user",
      createdAt: u.createdAt.toISOString().replace("T", " ").substring(0, 19)
    }));

    return { success: true, users: formatted };
  } catch (error) {
    console.error("Failed to get users:", error);
    return { success: false, error: friendlyError(error) };
  }
}

// Helper to get variation of email inputs (with or without dot in domain)
function getEmailVariants(email: string): string[] {
  const emailLower = email.trim().toLowerCase();
  const variants = [emailLower];
  
  if (emailLower.endsWith("gmailcom")) {
    variants.push(emailLower.replace("gmailcom", "gmail.com"));
  }
  if (emailLower.endsWith("gmail.com")) {
    variants.push(emailLower.replace("gmail.com", "gmailcom"));
  }

  const parts = emailLower.split("@");
  if (parts.length === 2) {
    const domain = parts[1];
    if (!domain.includes(".")) {
      const tlds = ["com", "net", "org", "co", "id"];
      for (const tld of tlds) {
        if (domain.endsWith(tld) && !domain.endsWith("." + tld)) {
          const mainDomain = domain.substring(0, domain.length - tld.length);
          variants.push(`${parts[0]}@${mainDomain}.${tld}`);
          break;
        }
      }
    } else {
      const tlds = ["com", "net", "org", "co", "id"];
      for (const tld of tlds) {
        if (domain.endsWith("." + tld)) {
          const mainDomain = domain.substring(0, domain.length - tld.length - 1);
          variants.push(`${parts[0]}@${mainDomain}${tld}`);
          break;
        }
      }
    }
  }

  return Array.from(new Set(variants));
}

export async function createUserAction(formData: { name: string; email: string; password: string; role: "admin" | "user" }) {
  try {
    await seedDefaultUsersIfNeeded();
    
    // Check if email already exists (using variants to be safe)
    const emailLower = formData.email.trim().toLowerCase();
    const emailVariants = getEmailVariants(emailLower);
    const existing = await db.user.findFirst({
      where: {
        email: {
          in: emailVariants
        }
      }
    });

    if (existing) {
      return { success: false, error: "Email sudah terdaftar." };
    }

    const newUser = await db.user.create({
      data: {
        name: formData.name.trim(),
        email: emailLower,
        password: formData.password,
        role: formData.role
      }
    });

    return { success: true, user: newUser };
  } catch (error) {
    console.error("Failed to create user:", error);
    return { success: false, error: friendlyError(error) };
  }
}

export async function loginUserAction(credentials: { email: string; password: string }) {
  try {
    await seedDefaultUsersIfNeeded();
    const emailVariants = getEmailVariants(credentials.email);

    // Search for any matching email configuration in the database using IN condition
    const user = await db.user.findFirst({
      where: {
        email: {
          in: emailVariants
        }
      }
    });

    if (!user || user.password !== credentials.password) {
      return { success: false, error: "Email atau password salah." };
    }

    return {
      success: true,
      session: {
        name: user.name,
        email: user.email,
        role: user.role as "admin" | "user"
      }
    };
  } catch (error) {
    console.error("Failed to login user:", error);
    return { success: false, error: friendlyError(error) };
  }
}
