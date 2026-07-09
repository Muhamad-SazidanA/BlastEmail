"use server";

import { db } from "@/lib/db";

// Helper to seed default accounts if database is empty
async function seedDefaultUsersIfNeeded() {
  try {
    // 1. Buat tabel users jika belum ada (tanpa menyentuh tabel lain)
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
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
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createUserAction(formData: { name: string; email: string; password: string; role: "admin" | "user" }) {
  try {
    await seedDefaultUsersIfNeeded();
    
    // Check if email already exists
    const emailLower = formData.email.trim().toLowerCase();
    const existing = await db.user.findUnique({
      where: { email: emailLower }
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
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function loginUserAction(credentials: { email: string; password: string }) {
  try {
    await seedDefaultUsersIfNeeded();
    const emailLower = credentials.email.trim().toLowerCase();
    
    // Normalize "BlastEAdmin@gmailcom" to "blasteadmin@gmail.com"
    const normalizedEmail = emailLower === "blasteadmin@gmailcom" ? "blasteadmin@gmail.com" : emailLower;

    const user = await db.user.findUnique({
      where: { email: normalizedEmail }
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
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
