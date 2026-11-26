/**
 * SEEDER SCRIPT: Akun Super Administrator PMII (Aman, berbasis Environment Variables)
 * File: scripts/seed.mjs
 *
 * Penggunaan (Node 20.6+ tanpa dependensi dotenv eksternal):
 *   SUPABASE_SERVICE_ROLE_KEY=... SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... node --env-file=.env.local scripts/seed.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";

if (typeof process.loadEnvFile === "function" && existsSync(".env.local")) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Abaikan jika env sudah dimuat lewat CLI
  }
}

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const adminEmail = (process.env.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
const adminPassword = (process.env.SEED_ADMIN_PASSWORD || "").trim();

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌ NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib disetel (jangan gunakan anon key untuk seeding admin)."
  );
  process.exit(1);
}

if (!adminEmail || !adminEmail.includes("@") || adminPassword.length < 8) {
  console.error(
    "❌ SEED_ADMIN_EMAIL (valid email) dan SEED_ADMIN_PASSWORD (min. 8 karakter) wajib disetel via environment variable."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function runSeed() {
  console.log("========================================================");
  console.log("🌱 MENJALANKAN SEEDER: AKUN SUPER ADMINISTRATOR PMII");
  console.log("========================================================\n");

  const { data: rpcData, error: rpcError } = await supabase.rpc("create_auth_user", {
    p_email: adminEmail,
    p_password: adminPassword,
    p_name: process.env.SEED_ADMIN_NAME || "Super Administrator PMII",
    p_role: "superadmin",
    p_commissariat: "Pusat / Super Administrator",
    p_status: "AKTIF",
    p_allowed_menus: [],
    p_komisariat_id: null,
  });

  if (rpcError) {
    if (rpcError.message?.toLowerCase().includes("sudah terdaftar")) {
      console.log(`ℹ️ Akun ${adminEmail} sudah terdaftar. Tidak menimpa kata sandi secara otomatis.`);
    } else {
      console.error("❌ Gagal membuat akun Super Administrator:", rpcError.message);
      process.exit(1);
    }
  } else {
    console.log(`✅ Akun Super Administrator (${adminEmail}) berhasil dibuat (ID: ${rpcData?.id || "-"})`);
  }

  console.log("\n✅ Proses seeder selesai.");
}

runSeed().catch((err) => {
  console.error("❌ Seeder gagal:", err);
  process.exit(1);
});
