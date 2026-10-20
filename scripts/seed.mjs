/**
 * SEEDER SCRIPT: Akun Pengurus Cabang Grobogan (Admin)
 * File: scripts/seed.mjs
 * 
 * Menjalankan seeder akun Pengurus Cabang Grobogan via Supabase JS SDK.
 * Penggunaan: node scripts/seed.mjs
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY harus ada di .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function runSeed() {
  console.log("========================================================");
  console.log("🌱 MENJALANKAN SEEDER: AKUN SUPER ADMINISTRATOR PMII");
  console.log("========================================================\n");

  // 1. Verifikasi / Sign-In akun Super Administrator
  console.log("1️⃣ Memverifikasi akun Super Administrator (admin@pmii.org)...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@pmii.org",
    password: "admin123"
  });

  if (authError) {
    console.warn("⚠️ Login gagal atau akun belum dibuat:", authError.message);
    console.log("Mencoba mendaftarkan akun Super Administrator via RPC create_auth_user...");
    const { data: rpcData, error: rpcError } = await supabase.rpc("create_auth_user", {
      p_email: "admin@pmii.org",
      p_password: "admin123",
      p_name: "Super Administrator PMII",
      p_role: "superadmin",
      p_commissariat: "Pusat / Super Administrator",
      p_status: "AKTIF",
      p_allowed_menus: []
    });

    if (rpcError) {
      console.error("❌ Gagal membuat akun via RPC:", rpcError.message);
    } else {
      console.log("✅ Berhasil membuat akun Super Administrator via RPC!");
    }
  } else {
    console.log("✅ Akun terverifikasi. Mengupdate metadata Super Administrator...");
    const { error: updateAuthErr } = await supabase.auth.updateUser({
      data: {
        name: "Super Administrator PMII",
        role: "superadmin",
        commissariat: "Pusat / Super Administrator"
      }
    });

    if (updateAuthErr) {
      console.warn("Notice updating user metadata:", updateAuthErr.message);
    } else {
      console.log("✅ Metadata akun berhasil diperbarui ke Super Administrator!");
    }
  }

  // 2. Update / Upsert di public.anggota
  console.log("\n2️⃣ Menyinkronkan profil ke tabel public.anggota...");
  const adminId = authData?.user?.id || "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const { error: anggotaErr } = await supabase.from("anggota").upsert({
    id: adminId,
    user_id: adminId,
    name: "Super Administrator PMII",
    email: "admin@pmii.org",
    role: "superadmin",
    role_id: "b0000000-0000-0000-0000-000000000001",
    tenant_id: null,
    status: "AKTIF",
    level: "SUPERADMIN"
  }, { onConflict: "id" });

  if (anggotaErr) {
    console.warn("Notice tabel anggota:", anggotaErr.message);
  } else {
    console.log("✅ Profil public.anggota berhasil diperbarui!");
  }

  console.log("\n========================================================");
  console.log("🎉 SEEDER BERHASIL DIJALANKAN DARI TERMINAL!");
  console.log("========================================================");
  console.log("🔑 Kredensial Login Super Administrator:");
  console.log("   Email    : admin@pmii.org");
  console.log("   Password : admin123");
  console.log("   Nama     : Super Administrator PMII");
  console.log("   Role     : superadmin (Global Multi-Tenancy)");
  console.log("========================================================\n");
}

runSeed().catch((err) => {
  console.error("❌ Error running seed:", err);
  process.exit(1);
});
