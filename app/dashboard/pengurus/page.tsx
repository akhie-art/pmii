"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  UserPlus,
  LayoutGrid,
  GitFork,
  ChevronRight,
  Download
} from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { useFeedbackModal } from "@/components/ui/feedback-modal";
import { generateUUID } from "@/lib/utils";
import {
  isRecordInTenant,
  isCabangRecord,
  enforceTenantWrite,
  getActiveTenant,
  setActiveTenant as setGlobalActiveTenant,
  isCabangOrAdmin,
  DEFAULT_KOMISARIAT_LIST,
  TENANT_CHANGED_EVENT,
  CABANG_TENANT_ID,
  getTenantIdByName
} from "@/lib/tenancy";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

import {
  type BoardMember,
  DEFAULT_DIVISIONS,
  getSystemPeriod
} from "./_components/types";
import { isUserSuperAdmin, isUserAdmin } from "@/lib/auth-helpers";
import { PengurusFilters } from "./_components/PengurusFilters";
import { PengurusGrid } from "./_components/PengurusGrid";
import { PengurusStructureTree } from "./_components/PengurusStructureTree";
import { PengurusFormModal } from "./_components/PengurusFormModal";
import { PengurusDeleteModal } from "./_components/PengurusDeleteModal";
import { DepartmentModal } from "./_components/DepartmentModal";

export default function KomisariatPengurusPage() {
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return null;
  });

  const [activeTenant, setActiveTenant] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
        const uObj = stored ? JSON.parse(stored) : null;
        return getActiveTenant(uObj) || "ALL";
      } catch {}
    }
    return "ALL";
  });

  const [activeCampus, setActiveCampus] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
        const uObj = stored ? JSON.parse(stored) : null;
        const currentTenant = getActiveTenant(uObj) || "ALL";
        if (currentTenant !== "ALL") return currentTenant;
        if (uObj?.commissariat) return uObj.commissariat;
        if (uObj?.campus) return uObj.campus;
      } catch {}
    }
    return "PMII Cabang Grobogan";
  });

  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [activeTab, setActiveTab] = useState<"daftar" | "struktur">("daftar");

  // Divisions / Bidang state
  const [divisions, setDivisions] = useState<string[]>(DEFAULT_DIVISIONS);
  const allDepartments = ["BPH", ...divisions];

  // Dynamic Komisariats list for filter
  const [availableKomisariats, setAvailableKomisariats] = useState<string[]>(DEFAULT_KOMISARIAT_LIST);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // RBAC permissions check
  const isSuperAdmin = isUserSuperAdmin(currentUser?.role, currentUser?.email);
  const userRole = (currentUser?.role || "").toLowerCase().trim();
  const isKetuaCabang = userRole === "ketua_cabang" || userRole === "ketua cabang";
  const isKetuaKomisariat = userRole === "ketua_komisariat" || userRole === "ketua komisariat";
  const isAdmin = userRole === "admin" || isUserAdmin(currentUser?.role) || isSuperAdmin;
  const canDelete = isAdmin || isKetuaCabang || isKetuaKomisariat;

  // Form Modal state (Combined Add & Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<BoardMember | null>(null);

  // Bidang / Divisi Modal states
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [deptInputName, setDeptInputName] = useState("");
  const [deptToDelete, setDeptToDelete] = useState<string | null>(null);

  // Cadres from database
  const [cadres, setCadres] = useState<any[]>([]);
  const [selectedCadreData, setSelectedCadreData] = useState<any>(null);

  // Form inputs state
  const [formName, setFormName] = useState("");
  const [formDept, setFormDept] = useState<string>("Kaderisasi");
  const [formPosition, setFormPosition] = useState("Anggota Bidang");
  const [formPeriod, setFormPeriod] = useState("2026 - 2027");
  const [formStatus, setFormStatus] = useState<"AKTIF" | "DEMISIONER">("AKTIF");
  const [isExporting, setIsExporting] = useState(false);

  // Level status (Cabang vs Komisariat)
  const isCabangLevel =
    isCabangOrAdmin(currentUser) &&
    (activeTenant === "ALL" ||
      activeTenant.toLowerCase().includes("cabang") ||
      activeTenant === CABANG_TENANT_ID);

  // Filter cadres according to the current logged-in user / active tenant
  const availableCadres = useMemo(() => {
    return cadres.filter((c) => {
      const cadreScoped = {
        ...c,
        commissariat: c.commissariat || c.komisariat,
        komisariat: c.komisariat || c.commissariat,
        campus: c.campus || c.perguruanTinggi,
        perguruanTinggi: c.perguruanTinggi || c.campus,
        tenant_id: c.tenant_id || c.komisariat_id,
        komisariat_id: c.komisariat_id || c.tenant_id
      };

      if (!isCabangOrAdmin(currentUser)) {
        // Akun Pengurus / Kader / Anggota Komisariat: HANYA tampilkan anggota milik tenant akun ini!
        return isRecordInTenant(currentUser, cadreScoped);
      }

      // Akun Pengurus Cabang / Super Admin:
      // Jika memilih tenant tertentu di filter switcher, saring sesuai tenant tersebut
      if (activeTenant && activeTenant !== "ALL") {
        return isRecordInTenant(currentUser, cadreScoped, activeTenant);
      }

      // Jika Cabang dan filter "ALL", tampilkan semua kader terdaftar
      return true;
    });
  }, [cadres, currentUser, activeTenant]);

  // Delete Confirmation Dialog state
  const [memberToDelete, setMemberToDelete] = useState<BoardMember | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  // Feedback Modal
  const { showToast, showError, FeedbackModalComponent } = useFeedbackModal();

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("PMII_LOGGED_IN_USER") : null;
    let uObj: any = null;
    if (storedUser) {
      try {
        uObj = JSON.parse(storedUser);
        setCurrentUser(uObj);
      } catch {}
    }
    const currentTenant = getActiveTenant(uObj) || "ALL";
    setActiveTenant(currentTenant);
    if (currentTenant !== "ALL") {
      setActiveCampus(currentTenant);
    } else if (uObj?.commissariat) {
      setActiveCampus(uObj.commissariat);
    } else if (uObj?.campus) {
      setActiveCampus(uObj.campus);
    }

    const handleTenant = (e: any) => {
      const nextTenant = e.detail?.activeTenant || "ALL";
      setActiveTenant(nextTenant);
      if (nextTenant !== "ALL") {
        setActiveCampus(nextTenant);
      }
    };
    window.addEventListener(TENANT_CHANGED_EVENT, handleTenant);

    // Muat divisi organisasi dari cloud Supabase dengan fallback LocalStorage
    if (isSupabaseConfigured && supabase) {
      supabase
        .from("pengaturan")
        .select("value")
        .eq("key", "organization_divisions")
        .maybeSingle()
        .then(
          ({ data }) => {
            if (data?.value && Array.isArray(data.value) && data.value.length > 0) {
              setDivisions(data.value);
              if (typeof window !== "undefined") {
                localStorage.setItem("PMII_ORGANIZATION_DIVISIONS", JSON.stringify(data.value));
              }
            }
          },
          (err: any) => {
            console.warn("Failed to load divisions from cloud:", err);
          }
        );
    }

    const savedDivs = typeof window !== "undefined" ? localStorage.getItem("PMII_ORGANIZATION_DIVISIONS") : null;
    if (savedDivs) {
      try {
        const parsed = JSON.parse(savedDivs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDivisions(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved divisions", e);
      }
    }

    Promise.all([
      db.getBoards(),
      db.getCadres([]),
      db.getCommissariats ? db.getCommissariats().catch(() => []) : Promise.resolve([])
    ]).then(([boardsData, cadresData, commData]) => {
      setBoardMembers(boardsData as any);
      setCadres(cadresData as any);
      if (Array.isArray(commData) && commData.length > 0) {
        const names = commData
          .map((k: any) => k.name)
          .filter((name: string) => name && !name.toLowerCase().includes("pengurus cabang"));
        if (names.length > 0) {
          setAvailableKomisariats(names);
        }
      }
      setMounted(true);
    });

    return () => {
      window.removeEventListener(TENANT_CHANGED_EVENT, handleTenant);
    };
  }, []);

  const saveDivisions = async (newDivs: string[]) => {
    setDivisions(newDivs);
    if (typeof window !== "undefined") {
      localStorage.setItem("PMII_ORGANIZATION_DIVISIONS", JSON.stringify(newDivs));
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from("pengaturan")
          .upsert({
            key: "organization_divisions",
            value: newDivs,
            updated_at: new Date().toISOString()
          }, { onConflict: "key" });
      } catch (e) {
        console.warn("Failed to save divisions to cloud:", e);
      }
    }
  };

  const saveBoardMembers = async (members: BoardMember[]) => {
    setBoardMembers(members);
    await db.saveBoards(members as any);
  };

  // Helper to get avatar either from member directly or matched from cadres database
  const getMemberAvatar = (member?: BoardMember | null): string => {
    if (!member) return "";
    if (member.avatar) return member.avatar;
    const matched = cadres.find(
      (c) => c.name?.toLowerCase().trim() === member.name?.toLowerCase().trim()
    );
    return matched?.avatar || "";
  };

  // Reset form inputs
  const resetForm = () => {
    setFormName("");
    setFormDept("Kaderisasi");
    setFormPosition("Anggota Bidang");
    setFormPeriod(getSystemPeriod());
    setFormStatus("AKTIF");
    setSelectedCadreData(null);
    setEditingMember(null);
  };

  const handleOpenAddModal = (defaultDept?: string, defaultPosition?: string) => {
    resetForm();
    if (defaultDept) {
      setFormDept(defaultDept);
      setFormPosition(
        defaultPosition ||
          (defaultDept === "BPH"
            ? isCabangLevel
              ? "Ketua Cabang"
              : "Ketua Komisariat"
            : "Anggota Bidang")
      );
    } else if (defaultPosition) {
      setFormPosition(defaultPosition);
    }
    setIsFormModalOpen(true);
  };

  // Handlers for Bidang (Division) CRUD
  const handleOpenAddDeptModal = () => {
    setEditingDept(null);
    setDeptInputName("");
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDeptModal = (dept: string) => {
    setEditingDept(dept);
    setDeptInputName(dept);
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = deptInputName.trim();
    if (!trimmed) return;

    if (editingDept) {
      if (trimmed.toLowerCase() === editingDept.toLowerCase()) {
        setIsDeptModalOpen(false);
        return;
      }
      if (
        divisions.some((d) => d.toLowerCase() === trimmed.toLowerCase() && d.toLowerCase() !== editingDept.toLowerCase()) ||
        trimmed.toLowerCase() === "bph"
      ) {
        showError("Nama Bidang Digunakan", "Nama bidang sudah digunakan atau merupakan bidang khusus (BPH).");
        return;
      }
      const updatedDivs = divisions.map((d) => (d === editingDept ? trimmed : d));
      saveDivisions(updatedDivs);

      // Update members belonging to this department
      const updatedMembers = boardMembers.map((m) =>
        m.department === editingDept ? { ...m, department: trimmed } : m
      );
      saveBoardMembers(updatedMembers);
      showToast(`Nama bidang "${editingDept}" berhasil diubah menjadi "${trimmed}".`);
    } else {
      if (
        divisions.some((d) => d.toLowerCase() === trimmed.toLowerCase()) ||
        trimmed.toLowerCase() === "bph"
      ) {
        showError("Nama Bidang Digunakan", "Nama bidang sudah digunakan atau merupakan bidang khusus (BPH).");
        return;
      }
      const updatedDivs = [...divisions, trimmed];
      saveDivisions(updatedDivs);
      showToast(`Bidang "${trimmed}" berhasil ditambahkan.`);
    }

    setIsDeptModalOpen(false);
    setDeptInputName("");
    setEditingDept(null);
  };

  const handleOpenDeleteDeptModal = (dept: string) => {
    if (!canDelete) {
      showError("Akses Ditolak", "Hanya Ketua Cabang, Ketua Komisariat, atau Superadmin yang memiliki izin untuk menghapus bidang organisasi.");
      return;
    }
    setDeptToDelete(dept);
  };

  const handleConfirmDeleteDept = async () => {
    if (!canDelete) {
      showError("Akses Ditolak", "Anda tidak memiliki izin untuk menghapus bidang organisasi.");
      setDeptToDelete(null);
      return;
    }
    if (!deptToDelete) return;
    const targetDept = deptToDelete;
    const updatedDivs = divisions.filter((d) => d !== targetDept);
    saveDivisions(updatedDivs);

    // Remove members from this department
    const membersToDelete = boardMembers.filter((m) => m.department === targetDept);
    const updatedMembers = boardMembers.filter((m) => m.department !== targetDept);
    setBoardMembers(updatedMembers);
    setDeptToDelete(null);

    try {
      for (const m of membersToDelete) {
        await db.deleteBoard(String(m.id), m.name);
      }
      showToast(`Bidang "${targetDept}" dan fungsionarisnya berhasil dihapus.`);
    } catch (err) {
      console.error("Gagal menghapus fungsionaris bidang dari database:", err);
      await db.saveBoards(updatedMembers as any);
      showToast(`Bidang "${targetDept}" dan fungsionarisnya berhasil dihapus.`);
    }
  };

  const handleOpenEditModal = (member: BoardMember) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormDept(member.department);
    setFormPosition(member.position);
    setFormPeriod(member.period || getSystemPeriod());
    setFormStatus(member.status || "AKTIF");
    const matched = cadres.find((c) => c.name === member.name);
    setSelectedCadreData(matched || null);
    setIsFormModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const matchedCadre =
      selectedCadreData ||
      availableCadres.find((c) => c.name === formName.trim()) ||
      cadres.find((c) => c.name === formName.trim());
    const inferredGender: "Sahabat" | "Sahabati" =
      matchedCadre?.gender === "Perempuan" || matchedCadre?.gender === "Sahabati"
        ? "Sahabati"
        : "Sahabat";
    const memberAvatar = matchedCadre?.avatar || (editingMember ? editingMember.avatar : "") || "";

    const resolvedComm =
      matchedCadre?.commissariat ||
      (editingMember?.commissariat) ||
      (!isCabangOrAdmin(currentUser)
        ? currentUser?.commissariat || currentUser?.campus || activeCampus
        : (activeTenant !== "ALL" ? activeTenant : (currentUser?.commissariat || "Pengurus Cabang Grobogan")));

    const resolvedTenantId =
      getTenantIdByName(resolvedComm) ||
      (matchedCadre as any)?.tenant_id ||
      (matchedCadre as any)?.komisariat_id ||
      (editingMember?.tenant_id) ||
      (activeTenant !== "ALL" ? getTenantIdByName(activeTenant) : CABANG_TENANT_ID) ||
      CABANG_TENANT_ID;

    if (editingMember) {
      // Edit existing member
      const updated = boardMembers.map((m) =>
        m.id === editingMember.id
          ? {
              ...m,
              name: formName.trim(),
              gender: matchedCadre ? inferredGender : (editingMember.gender || "Sahabat"),
              position: formPosition.trim() || editingMember.position || formDept,
              department: formDept,
              email: matchedCadre?.email || editingMember.email || "-",
              phone: matchedCadre?.phone || editingMember.phone || "-",
              status: formStatus,
              period: formPeriod.trim() || "2026 - 2027",
              commissariat: resolvedComm || m.commissariat || "Pengurus Cabang Grobogan",
              tenant_id: resolvedTenantId || m.tenant_id || CABANG_TENANT_ID,
              komisariat_id: resolvedTenantId || m.komisariat_id || CABANG_TENANT_ID,
              avatar: memberAvatar
            }
          : m
      );
      saveBoardMembers(updated);
      showToast(`Data "${formName.trim()}" berhasil diperbarui!`);
    } else {
      // Add new member
      const newMember: BoardMember = enforceTenantWrite<BoardMember>(
        currentUser,
        {
          id: generateUUID(),
          name: formName.trim(),
          gender: inferredGender,
          position:
            formPosition.trim() ||
            (formDept === "BPH"
              ? isCabangLevel
                ? "Pengurus BPH Cabang"
                : "Pengurus BPH"
              : `Anggota Bidang ${formDept}`),
          department: formDept,
          email: matchedCadre?.email || "-",
          phone: matchedCadre?.phone || "-",
          status: formStatus,
          period: formPeriod.trim() || "2026 - 2027",
          commissariat: resolvedComm,
          tenant_id: resolvedTenantId,
          komisariat_id: resolvedTenantId,
          avatar: memberAvatar
        },
        activeTenant
      );
      const updated = [newMember, ...boardMembers];
      saveBoardMembers(updated);
      showToast(`Berhasil menambahkan ${formName.trim()} sebagai pengurus!`);
    }

    setIsFormModalOpen(false);
    resetForm();
  };

  const handleOpenDeleteMember = (member: BoardMember) => {
    if (!canDelete) {
      showError("Akses Ditolak", "Hanya Ketua Cabang, Ketua Komisariat, atau Superadmin yang memiliki izin untuk menghapus data pengurus.");
      return;
    }
    setMemberToDelete(member);
  };

  const confirmDelete = async () => {
    if (!canDelete) {
      showError("Akses Ditolak", "Hanya Ketua Cabang, Ketua Komisariat, atau Superadmin yang memiliki izin untuk menghapus data pengurus.");
      setMemberToDelete(null);
      return;
    }
    if (!memberToDelete) return;
    const target = memberToDelete;
    setIsDeletingMember(true);

    // 1. Optimistic update local state immediately
    const updated = boardMembers.filter((m) => m.id !== target.id);
    setBoardMembers(updated);

    try {
      // 2. Perform actual deletion in Supabase & LocalStorage
      await db.deleteBoard(String(target.id), target.name);
      showToast(`Data pengurus "${target.name}" berhasil dihapus.`);
    } catch (err) {
      console.error("Gagal menghapus pengurus:", err);
      await db.saveBoards(updated as any);
      showToast(`Data pengurus "${target.name}" berhasil dihapus.`);
    } finally {
      setIsDeletingMember(false);
      setMemberToDelete(null);
    }
  };

  const handleExportToExcel = () => {
    if (filteredMembers.length === 0) {
      showError("Tidak Ada Data", "Tidak ada data pengurus untuk diekspor.");
      return;
    }
    setIsExporting(true);
    try {
      const headers = [
        "No",
        "Nama Pengurus",
        "Sapaan",
        "Jabatan",
        "Departemen / Divisi",
        "Status",
        "Periode",
        "Komisariat / Afiliasi",
        "Email",
        "No. Telepon"
      ];

      const rows = filteredMembers.map((m, idx) => ({
        "No": idx + 1,
        "Nama Pengurus": m.name || "-",
        "Sapaan": m.gender || "Sahabat",
        "Jabatan": m.position || "-",
        "Departemen / Divisi": m.department || "-",
        "Status": m.status || "AKTIF",
        "Periode": m.period || "-",
        "Komisariat / Afiliasi": m.commissariat || "-",
        "Email": m.email || "-",
        "No. Telepon": m.phone || "-"
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });

      const objectWidths = headers.map((header) => {
        let maxLen = header.length;
        rows.forEach((row) => {
          const val = String((row as any)[header] || "");
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.max(maxLen + 3, 10) };
      });
      worksheet["!cols"] = objectWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pengurus");
      const dateStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(
        workbook,
        `Data_Pengurus_PMII_${isCabangLevel ? "Cabang" : "Komisariat"}_${dateStr}.xlsx`
      );
      showToast(`Berhasil mengekspor ${filteredMembers.length} data pengurus ke Excel.`);
    } catch (err) {
      console.error("Failed to export pengurus data", err);
      showError("Gagal Ekspor", "Gagal mengekspor data ke Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  // Filtering logic
  const filteredMembers = boardMembers.filter((m) => {
    const matchesTenant = isRecordInTenant(
      currentUser,
      m,
      activeTenant
    );
    if (!matchesTenant) return false;

    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === "ALL" || m.department === selectedDept;
    const matchesStatus = selectedStatus === "ALL" || m.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-10 font-sans text-zinc-900 dark:text-zinc-100 pb-10">
      {/* BREADCRUMB & ACTION TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Link
            href={isCabangOrAdmin(currentUser) ? "/admin" : "/pengurus"}
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Pengurus
          </span>
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={handleExportToExcel}
            disabled={isExporting || filteredMembers.length === 0}
            className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium h-8.5 px-3 rounded-lg shadow-none cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Ekspor daftar pengurus ke spreadsheet Excel"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>{isExporting ? "Mengekspor..." : "Ekspor Excel"}</span>
          </Button>

          <Button
            onClick={() => handleOpenAddModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-8.5 px-3.5 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors border-none"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengurus</span>
          </Button>
        </div>
      </div>

      {/* 2. TABS SELECTOR */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 text-xs font-medium">
        {[
          { id: "daftar", label: "Daftar Pengurus", icon: LayoutGrid, count: boardMembers.length },
          { id: "struktur", label: "Struktur Organisasi", icon: GitFork }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 cursor-pointer border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. MAIN TAB CONTENTS */}
      <div className="min-h-[400px]">
        {/* TAB 1: LIST VIEW */}
        {activeTab === "daftar" && (
          <div className="space-y-4">
            <PengurusFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedDept={selectedDept}
              setSelectedDept={setSelectedDept}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              tenantFilter={activeTenant}
              setTenantFilter={(val) => {
                setActiveTenant(val);
                setGlobalActiveTenant(val);
              }}
              availableKomisariats={availableKomisariats}
              isCabang={isCabangOrAdmin(currentUser)}
              allDepartments={allDepartments}
            />

            <PengurusGrid
              filteredMembers={filteredMembers}
              getMemberAvatar={getMemberAvatar}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteMember}
              canDelete={canDelete}
            />
          </div>
        )}

        {/* TAB 2: ORGANIZATIONAL STRUCTURE TREE */}
        {activeTab === "struktur" && (
          <PengurusStructureTree
            boardMembers={boardMembers}
            divisions={divisions}
            getMemberAvatar={getMemberAvatar}
            onOpenAddModal={handleOpenAddModal}
            onOpenEditModal={handleOpenEditModal}
            onDeleteMember={handleOpenDeleteMember}
            onOpenAddDeptModal={handleOpenAddDeptModal}
            onOpenEditDeptModal={handleOpenEditDeptModal}
            onDeleteDept={handleOpenDeleteDeptModal}
            isCabangLevel={isCabangLevel}
            canDelete={canDelete}
          />
        )}
      </div>

      {/* MODAL: ADD / EDIT PENGURUS */}
      <PengurusFormModal
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        editingMember={editingMember}
        formName={formName}
        setFormName={setFormName}
        formDept={formDept}
        setFormDept={setFormDept}
        formPosition={formPosition}
        setFormPosition={setFormPosition}
        formPeriod={formPeriod}
        formStatus={formStatus}
        setFormStatus={setFormStatus}
        cadres={availableCadres}
        selectedCadreData={selectedCadreData}
        setSelectedCadreData={setSelectedCadreData}
        allDepartments={allDepartments}
        activeCampus={
          !isCabangOrAdmin(currentUser)
            ? currentUser?.commissariat || currentUser?.campus || activeCampus
            : (activeTenant !== "ALL" ? activeTenant : "Pengurus Cabang Grobogan")
        }
        isCabangLevel={isCabangLevel}
        boardMembers={boardMembers}
        onSubmit={handleSaveMember}
      />

      {/* MODAL: DELETE PENGURUS */}
      <PengurusDeleteModal
        memberToDelete={memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeletingMember}
      />

      {/* MODALS: ADD/EDIT DEPARTMENT & DELETE DEPARTMENT */}
      <DepartmentModal
        isOpen={isDeptModalOpen}
        onOpenChange={setIsDeptModalOpen}
        editingDept={editingDept}
        deptInputName={deptInputName}
        setDeptInputName={setDeptInputName}
        onSaveDept={handleSaveDept}
        deptToDelete={deptToDelete}
        onCloseDeleteDept={() => setDeptToDelete(null)}
        onConfirmDeleteDept={handleConfirmDeleteDept}
        memberCountInDept={
          deptToDelete
            ? boardMembers.filter((m) => m.department === deptToDelete).length
            : 0
        }
      />

      {FeedbackModalComponent}
    </div>
  );
}
