"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  Phone,
  Mail,
  Building,
  GraduationCap,
  Calendar,
  MapPin,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const Label = ({ className = "", children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={`text-xs font-medium text-zinc-700 dark:text-zinc-300 block ${className}`} {...props}>
    {children}
  </label>
);
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from "@/lib/db";
import { supabase, isSupabaseConfigured, deleteStorageFile } from "@/lib/supabase";

export default function LengkapiDataPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [memberData, setMemberData] = useState<any>(null);

  // Form states
  const [name, setName] = useState("");
  const [nik, setNik] = useState("");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [gender, setGender] = useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [golonganDarah, setGolonganDarah] = useState("O");

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [alamatRumah, setAlamatRumah] = useState("");
  const [alamatDomisili, setAlamatDomisili] = useState("");
  const [provinsi, setProvinsi] = useState("Jawa Tengah");
  const [kabupaten, setKabupaten] = useState("Semarang");
  const [kecamatan, setKecamatan] = useState("");

  const [perguruanTinggi, setPerguruanTinggi] = useState("");
  const [fakultas, setFakultas] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [angkatan, setAngkatan] = useState("2024");
  const [level, setLevel] = useState("MAPABA");
  const [komisariat, setKomisariat] = useState("Ki Ageng Getas Pendawa");

  const [avatar, setAvatar] = useState("");
  const [pasFotoName, setPasFotoName] = useState("");

  // Opsi aktivasi akun login
  const [createAccount, setCreateAccount] = useState(true);
  const [password, setPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadMember() {
      if (!memberId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        let foundCadre: any = null;

        // Coba cari dari Supabase terlebih dahulu
        if (isSupabaseConfigured && supabase) {
          let { data, error } = await supabase
            .from("anggota")
            .select("*")
            .eq("id", memberId)
            .maybeSingle();

          if (error) {
            // Fallback ke tabel kader jika belum di-rename
            const altRes = await supabase
              .from("kader")
              .select("*")
              .eq("id", memberId)
              .maybeSingle();
            if (!altRes.error && altRes.data) {
              data = altRes.data;
              error = null;
            }
          }

          if (!error && data) {
            foundCadre = data;
          }
        }

        // Fallback dari db.getCadres
        if (!foundCadre) {
          const cadres = await db.getCadres([]);
          foundCadre = cadres.find((c: any) => c.id === memberId);
        }

        if (!foundCadre) {
          setNotFound(true);
        } else {
          setMemberData(foundCadre);
          setName(foundCadre.name || "");
          setNik(foundCadre.nik || "");
          setTempatLahir(foundCadre.tempatLahir || "");
          setTanggalLahir(foundCadre.tanggalLahir || "");
          setGender(foundCadre.gender === "Perempuan" ? "Perempuan" : "Laki-laki");
          setGolonganDarah(foundCadre.golonganDarah || "O");
          setPhone(foundCadre.phone || "");
          setEmail(foundCadre.email || "");
          setAlamatRumah(foundCadre.alamatRumah || foundCadre.address || "");
          setAlamatDomisili(foundCadre.alamatDomisili || "");
          setProvinsi(foundCadre.provinsi || "Jawa Tengah");
          setKabupaten(foundCadre.kabupaten || "Semarang");
          setKecamatan(foundCadre.kecamatan || "");
          setPerguruanTinggi(foundCadre.perguruanTinggi || "Universitas Islam Sultan Agung");
          setFakultas(foundCadre.fakultas || "");
          setJurusan(foundCadre.jurusan || "");
          setAngkatan(foundCadre.angkatan || "2024");
          setLevel(foundCadre.level || "MAPABA");
          setKomisariat(foundCadre.commissariat || "Ki Ageng Getas Pendawa");
          setAvatar(foundCadre.avatar || foundCadre.pasFotoName || "");
          setPasFotoName(foundCadre.pasFotoName || "");
        }
      } catch (err) {
        console.error("Error loading member data:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadMember();
  }, [memberId]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Format file tidak didukung. Harap pilih gambar (JPG, PNG, atau WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran foto maksimal 5MB.");
      return;
    }

    try {
      const prevAvatar = avatar;
      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split(".").pop() || "jpg";
        const targetId = memberId || "avatar";
        const filePath = `avatars/${targetId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (uploadError) {
          console.error("Supabase avatar upload error:", uploadError);
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setAvatar(base64);
            setPasFotoName(file.name);
          };
          reader.readAsDataURL(file);
          return;
        }

        const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        if (prevAvatar && prevAvatar !== publicUrl) {
          deleteStorageFile(prevAvatar).catch(() => {});
        }

        setAvatar(publicUrl);
        setPasFotoName(file.name);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setAvatar(base64);
          setPasFotoName(file.name);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      alert("Gagal memproses foto.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Nama lengkap wajib diisi.");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("Nomor WhatsApp/HP wajib diisi untuk verifikasi.");
      return;
    }
    if (createAccount && email.trim() && !password.trim()) {
      setErrorMsg("Silakan buat kata sandi akun untuk akses aplikasi.");
      return;
    }

    setSubmitting(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const updatedCadre = {
        ...memberData,
        id: memberId,
        name: name.trim(),
        nik: nik.trim(),
        tempatLahir: tempatLahir.trim(),
        tanggalLahir: tanggalLahir.trim(),
        gender,
        golonganDarah,
        phone: phone.trim(),
        email: cleanEmail,
        alamatRumah: alamatRumah.trim(),
        address: alamatRumah.trim(),
        alamatDomisili: alamatDomisili.trim(),
        provinsi: provinsi.trim(),
        kabupaten: kabupaten.trim(),
        kecamatan: kecamatan.trim(),
        perguruanTinggi: perguruanTinggi.trim(),
        fakultas: fakultas.trim(),
        jurusan: jurusan.trim(),
        angkatan: angkatan.trim(),
        level,
        commissariat: komisariat,
        avatar,
        pasFotoName: avatar,
        status: "AKTIF"
      };

      // 1. Simpan ke Supabase tabel anggota secara langsung (dengan fallback kader)
      if (isSupabaseConfigured && supabase) {
        const { error: dbError } = await supabase
          .from("anggota")
          .update(updatedCadre)
          .eq("id", memberId);

        if (dbError) {
          const altRes = await supabase
            .from("kader")
            .update(updatedCadre)
            .eq("id", memberId);
          if (altRes.error) {
            console.warn("Notice Supabase direct update, falling back to db helper:", altRes.error.message);
          }
        }
      }

      // 2. Simpan via db helper agar cache lokal tersinkronisasi
      const cadres = await db.getCadres([]);
      const updatedCadres = cadres.map((c: any) => (c.id === memberId ? updatedCadre : c));
      await db.saveCadres(updatedCadres);

      // 3. Jika kader mengisi email dan memilih buat akun, sinkronkan ke Supabase Users Authentication
      if (cleanEmail && cleanEmail.includes("@")) {
        const pwd = password.trim() || "pmii1960";
        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.rpc("sync_user_to_auth", {
              p_email: cleanEmail,
              p_password: pwd,
              p_name: name.trim(),
              p_role: "anggota",
              p_commissariat: komisariat
            });
          } catch (authErr) {
            console.warn("Notice sync user to auth:", authErr);
          }
        }
      }

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Error updating member data:", err);
      setErrorMsg(err.message || "Gagal menyimpan data. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-zinc-500 font-medium">Memuat data keanggotaan PMII...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-zinc-200 dark:border-zinc-800 shadow-sm text-center p-6">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white">
            Tautan Tidak Ditemukan
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 mt-2">
            Data anggota tidak ditemukan dalam sistem atau tautan yang Anda buka telah kedaluwarsa.
            Silakan hubungi pengurus komisariat Anda untuk mendapatkan tautan terbaru.
          </CardDescription>
          <div className="mt-6">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="text-xs"
            >
              Kembali ke Beranda
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-zinc-200 dark:border-zinc-800 shadow-lg text-center p-6 sm:p-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] mb-2">
            Pemutakhiran Berhasil
          </Badge>
          <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">
            Terima Kasih, Sahabat {name}!
          </CardTitle>
          <CardDescription className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
            Biodata keanggotaan Anda telah berhasil disimpan di pangkalan data resmi PMII. Data Anda akan diverifikasi oleh pengurus komisariat untuk penerbitan KTA Digital.
          </CardDescription>

          <div className="my-6 p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-left text-xs space-y-2">
            <div className="flex justify-between border-b border-blue-100/80 dark:border-blue-900/30 pb-1.5">
              <span className="text-zinc-500">Nama Lengkap</span>
              <span className="font-semibold text-zinc-900 dark:text-white">{name}</span>
            </div>
            <div className="flex justify-between border-b border-blue-100/80 dark:border-blue-900/30 pb-1.5">
              <span className="text-zinc-500">Komisariat</span>
              <span className="font-semibold text-zinc-900 dark:text-white">{komisariat}</span>
            </div>
            <div className="flex justify-between border-b border-blue-100/80 dark:border-blue-900/30 pb-1.5">
              <span className="text-zinc-500">Tingkat Kaderisasi</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Status Data</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Lengkap
              </span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 italic mb-6">
            "Tangan Terkepal dan Maju Ke Muka! Salam Pergerakan!"
          </p>

          <div className="space-y-2">
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-10 gap-2"
            >
              Masuk ke Portal Anggota
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="w-full text-xs text-zinc-500"
            >
              Kembali ke Beranda Utama
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Portal Mandiri Kader PMII
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
            Formulir Pemutakhiran Biodata Anggota
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-lg mx-auto">
            Silakan lengkapi identitas Anda di bawah ini untuk pemutakhiran data pengkaderan dan penerbitan Kartu Tanda Anggota (KTA) Digital PMII.
          </p>
        </div>

        {/* Member Greeting Notice */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/50 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0">
              {avatar ? (
                <AvatarImage src={avatar} alt={name} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-blue-600 text-white font-bold text-sm">
                  {name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <span className="text-[11px] text-zinc-400 block font-medium">Pemilik Data:</span>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">{name}</h2>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{komisariat}</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 border-amber-200 text-[11px] shrink-0">
            Perlu Dilengkapi
          </Badge>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SEKSI 1: PAS FOTO */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <Camera className="w-4 h-4 text-blue-600" />
                Pas Foto Formal (Background Merah/Biru/Polos)
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Unggah pas foto formal berpakaian rapi / berjas almamater PMII untuk dicetak pada KTA Digital.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <Avatar className="w-24 h-32 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {avatar ? (
                    <AvatarImage src={avatar} alt={name} className="object-cover w-full h-full" />
                  ) : (
                    <AvatarFallback className="bg-transparent text-zinc-400 text-xs flex flex-col items-center justify-center p-2 text-center">
                      <Camera className="w-6 h-6 mb-1 text-zinc-400" />
                      Belum Ada Foto
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="space-y-2 text-center sm:text-left">
                  <Label
                    htmlFor="foto-upload"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium cursor-pointer border border-zinc-200 dark:border-zinc-700 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Pilih Foto dari Galeri / Kamera
                  </Label>
                  <input
                    id="foto-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <p className="text-[11px] text-zinc-400">
                    Format: JPG, PNG. Maksimal 3MB. Disarankan foto portrait tegak menghadap ke depan.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEKSI 2: IDENTITAS DIRI */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Informasi Identitas Diri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama Lengkap (sesuai KTP) *</Label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Sahabat Ahmad Dahlan"
                    className="text-xs bg-zinc-50 dark:bg-zinc-950"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nomor Induk Kependudukan (NIK 16 Digit)</Label>
                  <Input
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    maxLength={16}
                    placeholder="Contoh: 3324010101010001"
                    className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tempat Lahir</Label>
                  <Input
                    value={tempatLahir}
                    onChange={(e) => setTempatLahir(e.target.value)}
                    placeholder="Contoh: Semarang"
                    className="text-xs bg-zinc-50 dark:bg-zinc-950"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tanggal Lahir</Label>
                  <Input
                    type="date"
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                    className="text-xs bg-zinc-50 dark:bg-zinc-950"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Jenis Kelamin</Label>
                  <Select value={gender} onValueChange={(val: any) => setGender(val)}>
                    <SelectTrigger className="text-xs bg-zinc-50 dark:bg-zinc-950">
                      <SelectValue placeholder="Pilih Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Golongan Darah</Label>
                  <Select value={golonganDarah} onValueChange={(val) => setGolonganDarah(val || "O")}>
                    <SelectTrigger className="text-xs bg-zinc-50 dark:bg-zinc-950">
                      <SelectValue placeholder="Golongan Darah" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="AB">AB</SelectItem>
                      <SelectItem value="O">O</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tingkat Kaderisasi PMII</Label>
                  <Select value={level} onValueChange={(val) => setLevel(val || "MAPABA")}>
                    <SelectTrigger className="text-xs bg-zinc-50 dark:bg-zinc-950">
                      <SelectValue placeholder="Pilih Jenjang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAPABA">MAPABA (Masa Penerimaan Anggota Baru)</SelectItem>
                      <SelectItem value="PKD">PKD (Pelatihan Kader Dasar)</SelectItem>
                      <SelectItem value="PKL">PKL (Pelatihan Kader Lanjut)</SelectItem>
                      <SelectItem value="PKN">PKN (Pelatihan Kader Nasional)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEKSI 3: KONTAK & DOMISILI */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <Phone className="w-4 h-4 text-emerald-600" />
                Kontak & Alamat Domisili
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nomor WhatsApp / HP Aktif *</Label>
                  <Input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="text-xs bg-zinc-50 dark:bg-zinc-950"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Alamat Email Aktif</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Contoh: sahabat@gmail.com"
                    className="text-xs bg-zinc-50 dark:bg-zinc-950"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Alamat Lengkap Asal (KTP)</Label>
                <Input
                  value={alamatRumah}
                  onChange={(e) => setAlamatRumah(e.target.value)}
                  placeholder="Nama jalan, RT/RW, Dusun/Desa"
                  className="text-xs bg-zinc-50 dark:bg-zinc-950"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Kecamatan</Label>
                  <Input
                    value={kecamatan}
                    onChange={(e) => setKecamatan(e.target.value)}
                    placeholder="Kecamatan"
                    className="text-xs bg-zinc-50 dark:bg-zinc-950"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Kabupaten / Kota</Label>
                  <Input
                    value={kabupaten}
                    onChange={(e) => setKabupaten(e.target.value)}
                    placeholder="Kabupaten / Kota"
                    className="text-xs bg-zinc-50 dark:bg-zinc-950"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Provinsi</Label>
                  <Input
                    value={provinsi}
                    onChange={(e) => setProvinsi(e.target.value)}
                    placeholder="Provinsi"
                    className="text-xs bg-zinc-50 dark:bg-zinc-950"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEKSI 4: KAMPUS & PENDIDIKAN TINGGI */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                Data Kampus & Akademik
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Perguruan Tinggi / Universitas</Label>
                <Input
                  value={perguruanTinggi}
                  onChange={(e) => setPerguruanTinggi(e.target.value)}
                  placeholder="Contoh: Universitas Islam Sultan Agung / UNNES / UNDIP"
                  className="text-xs bg-zinc-50 dark:bg-zinc-950"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Fakultas</Label>
                  <Input
                    value={fakultas}
                    onChange={(e) => setFakultas(e.target.value)}
                    placeholder="Contoh: Fakultas Tarbiyah"
                    className="text-xs bg-zinc-50 dark:bg-zinc-950"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Program Studi / Jurusan</Label>
                  <Input
                    value={jurusan}
                    onChange={(e) => setJurusan(e.target.value)}
                    placeholder="Contoh: Pendidikan Agama Islam"
                    className="text-xs bg-zinc-50 dark:bg-zinc-950"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tahun Angkatan Kuliah</Label>
                  <Input
                    value={angkatan}
                    onChange={(e) => setAngkatan(e.target.value)}
                    placeholder="Contoh: 2024"
                    className="text-xs bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEKSI 5: AKTIVASI AKUN LOGIN (OPSIONAL) */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <Lock className="w-4 h-4 text-amber-500" />
                Aktivasi Akun Portal Anggota (Login)
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Buat kata sandi agar Anda dapat masuk ke aplikasi untuk mengunduh modul pengkaderan dan melihat KTA digital Anda secara mandiri.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Buat Kata Sandi Akun</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi (minimal 6 karakter)"
                  className="text-xs bg-zinc-50 dark:bg-zinc-950"
                />
                <p className="text-[11px] text-zinc-400">
                  Kata sandi ini digunakan bersama email Anda untuk login ke web sistem PMII.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm h-12 rounded-xl shadow-md gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menyimpan & Memperbarui Data...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Kirim & Perbarui Biodata Saya
                </>
              )}
            </Button>
            <p className="text-center text-[11px] text-zinc-400 mt-3">
              Dengan mengirimkan formulir ini, Anda menyatakan bahwa data yang diisikan adalah benar untuk keperluan organisasi PMII.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
