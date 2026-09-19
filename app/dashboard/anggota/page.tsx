"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Users,
  Award,
  CheckCircle2,
  GraduationCap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { db } from "@/lib/db";
import { isRecordInTenant } from "@/lib/tenancy";
import * as XLSX from "xlsx";

import type { Member, CadreHistory } from "./_components/types";
import { mapCadreToMember, mapMemberToCadre } from "./_components/types";
import MemberFormModal from "./_components/MemberFormModal";
import MemberDetailModal from "./_components/MemberDetailModal";
import DeleteMemberModal from "./_components/DeleteMemberModal";

export default function AnggotaPage() {
  const [mounted, setMounted] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [komisariatFilter, setKomisariatFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailMember, setDetailMember] = useState<Member | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);

  // UI state
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), duration);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing user session", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    const fetchCadres = async () => {
      try {
        const dbCadres = await db.getCadres([]);
        const mapped = dbCadres.map((c) => mapCadreToMember(c));
        setMembers(mapped);
      } catch (err) {
        console.error("Error fetching cadres:", err);
      } finally {
        setMounted(true);
      }
    };
    fetchCadres();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, levelFilter, komisariatFilter]);

  // Filtered members list
  const filteredMembers = members.filter((member) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      member.name.toLowerCase().includes(query) ||
      (member.nipa && member.nipa.toLowerCase().includes(query)) ||
      (member.email && member.email.toLowerCase().includes(query)) ||
      (member.phone && member.phone.toLowerCase().includes(query)) ||
      (member.perguruanTinggi && member.perguruanTinggi.toLowerCase().includes(query));

    const matchesLevel = levelFilter === "ALL" || member.level === levelFilter;

    const matchesTenant = isRecordInTenant(currentUser, {
      commissariat: member.komisariat
    });

    const matchesKomisariat =
      komisariatFilter === "ALL" || member.komisariat === komisariatFilter;

    return (
      matchesSearch &&
      matchesLevel &&
      matchesTenant &&
      (currentUser?.role === "ADMIN" ? matchesKomisariat : true)
    );
  });

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMembers = filteredMembers.slice(indexOfFirstItem, indexOfLastItem);

  // Add Member
  const handleAddMember = async (data: Partial<Member>) => {
    const targetAngkatan = data.angkatan || "2026";
    const targetKomisariat = data.komisariat || "PK PMII Ki Ageng Getas Pendawa";
    const targetLevel = data.level || "MAPABA";

    const newNipa = `PMII.${targetAngkatan}.11.${
      targetKomisariat.includes("Walisongo") ? "05" : targetKomisariat.includes("Diponegoro") ? "02" : "03"
    }.${String(members.length + 1).padStart(4, "0")}`;

    const newHistory: CadreHistory[] = [
      {
        level: targetLevel,
        date: `Mar ${targetAngkatan}`,
        location: targetKomisariat,
        status: "Selesai"
      }
    ];

    const newMember: Member = {
      id: `cadre-${Date.now()}`,
      name: data.name || "",
      level: targetLevel,
      komisariat: targetKomisariat,
      angkatan: targetAngkatan,
      status: "Aktif",
      email: data.email || "",
      phone: data.phone || "",
      jabatan: data.jabatan || "Anggota",
      nipa: newNipa,
      gender: data.gender || "Laki-laki",
      history: newHistory,
      provinsi: data.provinsi || "",
      kabupaten: data.kabupaten || "",
      kecamatan: data.kecamatan || "",
      nik: data.nik || "",
      ktpName: data.ktpName || "",
      tempatLahir: data.tempatLahir || "",
      tanggalLahir: data.tanggalLahir || "",
      alamatRumah: data.alamatRumah || "",
      alamatDomisili: data.alamatDomisili || "",
      pendidikanSD: data.pendidikanSD || "",
      pendidikanSMP: data.pendidikanSMP || "",
      pendidikanSMA: data.pendidikanSMA || "",
      perguruanTinggi: data.perguruanTinggi || "",
      fakultas: data.fakultas || "",
      jurusan: data.jurusan || "",
      ktmName: data.ktmName || "",
      instagram: data.instagram || "",
      twitter: data.twitter || "",
      facebook: data.facebook || "",
      pasFotoName: data.pasFotoName || "",
      avatar: data.avatar || "",
      riwayatPenyakit: data.riwayatPenyakit || "",
      golonganDarah: data.golonganDarah || "O",
      organisasiSD: data.organisasiSD || "",
      organisasiSMP: data.organisasiSMP || "",
      organisasiSMA: data.organisasiSMA || "",
      organisasiPT: data.organisasiPT || "",
      orientasiProfetik: data.orientasiProfetik || "",
      minatPassion: data.minatPassion || "",
      motivasiMapaba: data.motivasiMapaba || ""
    };

    const updatedList = [newMember, ...members];
    setMembers(updatedList);
    await db.saveCadres(updatedList.map((m) => mapMemberToCadre(m)));

    setShowAddModal(false);
    showToast(`Sahabat ${newMember.name} berhasil didaftarkan.`);
  };

  // Edit Member
  const handleEditMember = async (data: Partial<Member>) => {
    if (!editingMember) return;

    const updatedList = members.map((m) => {
      if (m.id === editingMember.id) {
        return {
          ...m,
          ...data
        };
      }
      return m;
    });

    setMembers(updatedList);
    await db.saveCadres(updatedList.map((m) => mapMemberToCadre(m)));

    setShowEditModal(false);
    setEditingMember(null);
    showToast(`Data ${editingMember.name} berhasil diperbarui.`);
  };

  // Delete Member
  const handleDeleteMember = async () => {
    if (!deletingMember) return;

    const remaining = members.filter((m) => m.id !== deletingMember.id);
    setMembers(remaining);
    await db.saveCadres(remaining.map((m) => mapMemberToCadre(m)));

    setShowDeleteModal(false);
    showToast(`Data ${deletingMember.name} berhasil dihapus.`);
    setDeletingMember(null);
  };

  // Export Excel
  const handleExportExcel = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const headers = [
          "NIPA/NTA",
          "Nama Lengkap",
          "Gender",
          "Tingkat Kaderisasi",
          "Komisariat",
          "Angkatan",
          "Status",
          "Jabatan",
          "Email",
          "Phone",
          "NIK",
          "Tempat Lahir",
          "Tanggal Lahir",
          "Alamat Rumah",
          "Alamat Domisili",
          "Perguruan Tinggi",
          "Fakultas",
          "Jurusan",
          "Golongan Darah",
          "Riwayat Penyakit"
        ];

        const rows = filteredMembers.map((m) => ({
          "NIPA/NTA": m.nipa || "-",
          "Nama Lengkap": m.name || "-",
          "Gender": m.gender || "-",
          "Tingkat Kaderisasi": m.level || "-",
          "Komisariat": m.komisariat || "-",
          "Angkatan": m.angkatan || "-",
          "Status": m.status || "-",
          "Jabatan": m.jabatan || "-",
          "Email": m.email || "-",
          "Phone": m.phone || "-",
          "NIK": m.nik || "-",
          "Tempat Lahir": m.tempatLahir || "-",
          "Tanggal Lahir": m.tanggalLahir || "-",
          "Alamat Rumah": m.alamatRumah || "-",
          "Alamat Domisili": m.alamatDomisili || "-",
          "Perguruan Tinggi": m.perguruanTinggi || "-",
          "Fakultas": m.fakultas || "-",
          "Jurusan": m.jurusan || "-",
          "Golongan Darah": m.golonganDarah || "-",
          "Riwayat Penyakit": m.riwayatPenyakit || "-"
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });

        const objectWidths = headers.map((header) => {
          let maxLen = header.length;
          rows.forEach((row) => {
            const val = String((row as any)[header] || "");
            if (val.length > maxLen) maxLen = val.length;
          });
          return { wch: maxLen + 2 };
        });
        worksheet["!cols"] = objectWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data Kader");
        XLSX.writeFile(
          workbook,
          `Data_Kader_PMII_${new Date().toISOString().split("T")[0]}.xlsx`
        );

        setIsExporting(false);
        showToast(`Berhasil mengekspor ${filteredMembers.length} data kader ke Excel.`);
      } catch (error) {
        console.error("Export error:", error);
        setIsExporting(false);
        showToast("Gagal melakukan ekspor data ke Excel.");
      }
    }, 800);
  };

  // Download KTA via HTML5 Canvas
  const handleDownloadKTA = (member: Member, theme: "gold" | "emerald" | "dark") => {
    showToast(`Menyiapkan KTA Digital untuk ${member.name}...`);

    const canvas = document.createElement("canvas");
    canvas.width = 1012;
    canvas.height = 638;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    let bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    let primaryColor = "#F7C738";
    let secondaryColor = "#0A2A5C";

    if (theme === "emerald") {
      bgGrad.addColorStop(0, "#022c22");
      bgGrad.addColorStop(0.5, "#064e3b");
      bgGrad.addColorStop(1, "#115e59");
      primaryColor = "#34d399";
      secondaryColor = "#022c22";
    } else if (theme === "dark") {
      bgGrad.addColorStop(0, "#0f172a");
      bgGrad.addColorStop(0.5, "#1e293b");
      bgGrad.addColorStop(1, "#0f172a");
      primaryColor = "#cbd5e1";
      secondaryColor = "#0f172a";
    } else {
      bgGrad.addColorStop(0, "#061833");
      bgGrad.addColorStop(0.5, "#0b2447");
      bgGrad.addColorStop(1, "#1e3a8a");
      primaryColor = "#F7C738";
      secondaryColor = "#0A2A5C";
    }

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 100, canvas.height);
      ctx.stroke();
    }

    ctx.strokeStyle = primaryColor + "55";
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    ctx.strokeStyle = primaryColor + "AA";
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

    ctx.font = "bold 26px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.textAlign = "right";
    ctx.fillText(member.komisariat.toUpperCase(), canvas.width - 48, 68);

    ctx.textAlign = "left";
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.roundRect(48, 44, 46, 46, 10);
    ctx.fill();

    ctx.font = "900 32px sans-serif";
    ctx.fillStyle = secondaryColor;
    ctx.fillText("P", 60, 78);

    ctx.font = "900 30px sans-serif";
    ctx.fillStyle = primaryColor;
    ctx.fillText("KTA PMII DIGITAL", 110, 64);

    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pergerakan Mahasiswa Islam Indonesia", 110, 84);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(48, 108);
    ctx.lineTo(canvas.width - 48, 108);
    ctx.stroke();

    const avatarX = 140;
    const avatarY = 300;
    const avatarR = 80;

    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR + 6, 0, Math.PI * 2);
    ctx.fill();

    let avatarGrad = ctx.createLinearGradient(
      avatarX - avatarR,
      avatarY - avatarR,
      avatarX + avatarR,
      avatarY + avatarR
    );
    avatarGrad.addColorStop(0, primaryColor);
    avatarGrad.addColorStop(1, theme === "dark" ? "#64748b" : "#c2410c");
    ctx.fillStyle = avatarGrad;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "bold 64px sans-serif";
    ctx.fillStyle = secondaryColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const initials = member.name
      .split(" ")
      .slice(-2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    ctx.fillText(initials, avatarX, avatarY);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    const detailsX = 260;
    const drawDetailRow = (label: string, value: string, yPos: number, isTitle = false) => {
      ctx.font = "bold 16px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillText(label.toUpperCase(), detailsX, yPos);

      if (isTitle) {
        ctx.font = "bold 34px sans-serif";
        ctx.fillStyle = primaryColor;
      } else {
        ctx.font = "bold 22px sans-serif";
        ctx.fillStyle = "#ffffff";
      }
      ctx.fillText(value, detailsX, yPos + 28);
    };

    drawDetailRow("Nama Lengkap", member.name, 150, true);
    drawDetailRow("Nomor Induk Anggota (NIPA)", member.nipa, 240);
    drawDetailRow("Komisariat", member.komisariat, 320);

    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("KADERISASI UTAMA", detailsX, 400);

    ctx.font = "900 24px sans-serif";
    ctx.fillStyle = primaryColor;
    ctx.fillText(member.level, detailsX, 428);

    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("ANGKATAN", detailsX + 240, 400);

    ctx.font = "24px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(member.angkatan, detailsX + 240, 428);

    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillText("DIKELUARKAN SECARA DIGITAL OLEH PENGURUS CABANG PMII", 48, 570);

    const stampX = canvas.width - 160;
    const stampY = canvas.height - 130;

    ctx.save();
    ctx.translate(stampX, stampY);
    ctx.rotate(-0.08);

    ctx.strokeStyle = "rgba(16, 185, 129, 0.8)";
    ctx.lineWidth = 4;
    ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
    ctx.beginPath();
    ctx.roundRect(-70, -30, 140, 60, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = "900 20px sans-serif";
    ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("VALID", 0, -8);

    ctx.font = "bold 12px sans-serif";
    ctx.fillStyle = "rgba(16, 185, 129, 0.8)";
    ctx.fillText("PC PMII OFFICIAL", 0, 14);
    ctx.restore();

    setTimeout(() => {
      try {
        const link = document.createElement("a");
        link.download = `KTA_PMII_${member.name.replace(/\s+/g, "_")}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        showToast(`KTA Digital untuk ${member.name} berhasil diunduh.`);
      } catch (err) {
        console.error(err);
        showToast("Gagal mengunduh KTA digital.");
      }
    }, 600);
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "MAPABA":
        return (
          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-[10px] font-semibold rounded-md px-2 py-0.5">
            MAPABA
          </Badge>
        );
      case "PKD":
        return (
          <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-[10px] font-semibold rounded-md px-2 py-0.5">
            PKD
          </Badge>
        );
      case "PKL":
        return (
          <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-[10px] font-semibold rounded-md px-2 py-0.5">
            PKL
          </Badge>
        );
      case "PKN":
        return (
          <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[10px] font-semibold rounded-md px-2 py-0.5">
            PKN
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[10px] font-semibold rounded-md px-2 py-0.5">
            {level}
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Aktif":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-semibold rounded-md px-2 py-0.5">
            Aktif
          </Badge>
        );
      case "Alumni":
        return (
          <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 text-[10px] font-semibold rounded-md px-2 py-0.5">
            Alumni
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 text-[10px] font-semibold rounded-md px-2 py-0.5">
            {status}
          </Badge>
        );
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        </div>
        <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5 select-none pb-8">
      {/* MINIMAL HEADER (Benchmarked from dashboard/kegiatan) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Database Anggota & Kader
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Kelola data keanggotaan, histori kaderisasi, dan KTA digital secara terpusat
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportExcel}
            disabled={isExporting}
            variant="outline"
            className="h-8.5 text-xs font-medium border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isExporting ? "Mengekspor..." : "Ekspor Excel"}</span>
          </Button>

          <Button
            onClick={() => setShowAddModal(true)}
            className="h-8.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 border-none cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrasi Anggota</span>
          </Button>
        </div>
      </div>

      {/* TOAST NOTIFICATION (Benchmarked from dashboard/kegiatan) */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 px-3.5 py-2.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-blue-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3.5 shadow-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Total Anggota
              </p>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">
                {members.length}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3.5 shadow-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <GraduationCap className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                MAPABA (Mu'taqid)
              </p>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">
                {members.filter((m) => m.level === "MAPABA").length}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3.5 shadow-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Award className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                PKD (Mujahid)
              </p>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">
                {members.filter((m) => m.level === "PKD").length}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3.5 shadow-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Award className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                PKL & PKN
              </p>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">
                {members.filter((m) => m.level === "PKL" || m.level === "PKN").length}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* FILTER PANEL */}
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none p-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari nama, NIPA, kampus..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium mr-1">
              <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Filter:</span>
            </div>

            <Select value={levelFilter} onValueChange={(val) => setLevelFilter(val ?? "ALL")}>
              <SelectTrigger className="h-8.5 w-[140px] text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg">
                <SelectValue placeholder="Kaderisasi" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <SelectItem value="ALL">Semua Tingkat</SelectItem>
                <SelectItem value="MAPABA">MAPABA</SelectItem>
                <SelectItem value="PKD">PKD</SelectItem>
                <SelectItem value="PKL">PKL</SelectItem>
                <SelectItem value="PKN">PKN</SelectItem>
              </SelectContent>
            </Select>

            {currentUser?.role === "ADMIN" && (
              <Select
                value={komisariatFilter}
                onValueChange={(val) => setKomisariatFilter(val ?? "ALL")}
              >
                <SelectTrigger className="h-8.5 w-[160px] text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <SelectValue placeholder="Komisariat" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectItem value="ALL">Semua Komisariat</SelectItem>
                  <SelectItem value="PK PMII Ki Ageng Getas Pendawa">Ki Ageng Getas Pendawa</SelectItem>
                  <SelectItem value="Komisariat Walisongo">Komisariat Walisongo</SelectItem>
                  <SelectItem value="Komisariat Diponegoro">Komisariat Diponegoro</SelectItem>
                </SelectContent>
              </Select>
            )}

            {(levelFilter !== "ALL" || komisariatFilter !== "ALL" || searchTerm !== "") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLevelFilter("ALL");
                  setKomisariatFilter("ALL");
                  setSearchTerm("");
                }}
                className="h-8.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer px-2"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* TABLE */}
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/70 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider pl-4 py-3">
                Nama & NIPA
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider py-3">
                Komisariat
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider py-3">
                Tingkat
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider py-3">
                Jabatan
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider py-3">
                Angkatan
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider py-3">
                Status
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-center pr-4 py-3">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {currentMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-36 text-center text-xs text-zinc-400">
                  Tidak ada data anggota yang sesuai filter.
                </TableCell>
              </TableRow>
            ) : (
              currentMembers.map((member) => {
                const initials = member.name
                  .split(" ")
                  .slice(-2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();

                const photoSrc =
                  member.avatar ||
                  (member.pasFotoName &&
                  (member.pasFotoName.startsWith("data:") ||
                    member.pasFotoName.startsWith("http") ||
                    member.pasFotoName.startsWith("/"))
                    ? member.pasFotoName
                    : "");

                return (
                  <TableRow
                    key={member.id}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800/80 transition-colors"
                  >
                    {/* Nama & NIPA */}
                    <TableCell className="pl-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 shrink-0 overflow-hidden">
                          {photoSrc && (
                            <AvatarImage
                              src={photoSrc}
                              alt={member.name}
                              className="object-cover w-full h-full"
                            />
                          )}
                          <AvatarFallback className="bg-blue-600 text-white font-bold text-[11px] rounded-lg">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate block">
                            {member.name}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                            {member.nipa || "-"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Komisariat */}
                    <TableCell className="py-3 text-xs text-zinc-600 dark:text-zinc-300">
                      {member.komisariat}
                    </TableCell>

                    {/* Tingkat */}
                    <TableCell className="py-3">
                      {getLevelBadge(member.level)}
                    </TableCell>

                    {/* Jabatan */}
                    <TableCell className="py-3 text-xs text-zinc-600 dark:text-zinc-300">
                      {member.jabatan || "Anggota"}
                    </TableCell>

                    {/* Angkatan */}
                    <TableCell className="py-3 font-mono text-xs text-zinc-500">
                      {member.angkatan}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3">
                      {getStatusBadge(member.status)}
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="text-center pr-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDetailMember(member);
                            setShowDetailModal(true);
                          }}
                          className="h-7 w-7 p-0 rounded-lg text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                          title="Detail Profil & KTA"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingMember(member);
                            setShowEditModal(true);
                          }}
                          className="h-7 w-7 p-0 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                          title="Edit Anggota"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingMember(member);
                            setShowDeleteModal(true);
                          }}
                          className="h-7 w-7 p-0 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Hapus Anggota"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* PAGINATION */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Menampilkan {currentMembers.length} dari {filteredMembers.length} kader
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-zinc-400 mr-1">
              Halaman {currentPage} dari {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* MODALS */}
      <MemberFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddMember}
        defaultKomisariat={currentUser?.commissariat || "PK PMII Ki Ageng Getas Pendawa"}
        isAdmin={currentUser?.role === "ADMIN"}
      />

      <MemberFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingMember(null);
        }}
        member={editingMember}
        onSubmit={handleEditMember}
        defaultKomisariat={currentUser?.commissariat || "PK PMII Ki Ageng Getas Pendawa"}
        isAdmin={currentUser?.role === "ADMIN"}
      />

      <MemberDetailModal
        isOpen={showDetailModal}
        member={detailMember}
        onClose={() => {
          setShowDetailModal(false);
          setDetailMember(null);
        }}
        onDownloadKTA={handleDownloadKTA}
      />

      <DeleteMemberModal
        isOpen={showDeleteModal}
        memberName={deletingMember?.name || "Anggota"}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingMember(null);
        }}
        onConfirm={handleDeleteMember}
      />
    </div>
  );
}
