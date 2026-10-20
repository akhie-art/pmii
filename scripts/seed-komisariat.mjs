import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("1. Authenticating as Superadmin...");
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: "admin@pmii.org",
    password: "admin123"
  });

  if (authErr) {
    console.error("Login error:", authErr.message);
    process.exit(1);
  }
  console.log("Logged in successfully:", auth.user.email);

  const seedData = [
    {
      id: "13aea81b-ca8c-43c2-b44f-7d70cdc11f7f",
      name: "Komisariat Ki Ageng Getas Pendawa",
      university: "Universitas An Nuur",
      status: "AKTIF",
      contactEmail: "getaspendawa@pmii.org",
      establishedYear: 2018,
      structure: {
        chairman_id: null,
        secretary_id: null,
        treasurer_id: null,
        chairman: "",
        secretary: "",
        treasurer: "",
        period: "2026 - 2027"
      },
      rayons: []
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      name: "Komisariat Ki Ageng Tarub",
      university: "Sekolah Tinggi Agama Islam Walisembilan Semarang",
      status: "AKTIF",
      contactEmail: "kiagengtarub@pmii.org",
      establishedYear: 2019,
      structure: {
        chairman_id: null,
        secretary_id: null,
        treasurer_id: null,
        chairman: "",
        secretary: "",
        treasurer: "",
        period: "2026 - 2027"
      },
      rayons: []
    },
    {
      id: "33333333-3333-3333-3333-333333333333",
      name: "Komisariat Ajisaka",
      university: "Sekolah Tinggi Agama Islam Grobogan",
      status: "AKTIF",
      contactEmail: "ajisaka@pmii.org",
      establishedYear: 2020,
      structure: {
        chairman_id: null,
        secretary_id: null,
        treasurer_id: null,
        chairman: "",
        secretary: "",
        treasurer: "",
        period: "2026 - 2027"
      },
      rayons: []
    },
    {
      id: "44444444-4444-4444-4444-444444444444",
      name: "Komisariat Joko Suro",
      university: "Sekolah Tinggi Agama Islam Walisembilan Semarang",
      status: "AKTIF",
      contactEmail: "jokosuro@pmii.org",
      establishedYear: 2021,
      structure: {
        chairman_id: null,
        secretary_id: null,
        treasurer_id: null,
        chairman: "",
        secretary: "",
        treasurer: "",
        period: "2026 - 2027"
      },
      rayons: []
    }
  ];

  console.log("2. Upserting 4 Komisariat records...");
  for (const item of seedData) {
    const { data, error } = await supabase.from("komisariat").upsert(item).select();
    if (error) {
      console.error(`Error upserting ${item.name}:`, error.message);
    } else {
      console.log(`✅ Berhasil upsert: ${item.name} (${item.university})`);
    }
  }

  // Update AKHIE DESAIN to point to Ki Ageng Getas Pendawa id if possible
  const { data: updateAnggota, error: errAnggota } = await supabase
    .from("anggota")
    .update({ commissariat: "Komisariat Ki Ageng Getas Pendawa" })
    .ilike("name", "%AKHIE DESAIN%")
    .select();
  console.log("Updated anggota Akhie Desain:", updateAnggota?.length, errAnggota?.message);

  console.log("Seeding complete!");
}

run();
