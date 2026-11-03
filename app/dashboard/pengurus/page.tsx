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
  getTenantIdByName,
  getTenantNameById
} from "@/lib/tenancy";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

import {
  type BoardMember,
  DEFAULT_DIVISIONS,
  DEFAULT_BIROS,
  getSystemPeriod
} from "./_components/types";
import { isUserSuperAdmin, isUserAdmin } from "@/lib/auth-helpers";
import { PengurusFilters } from "./_components/PengurusFilters";
import { PengurusGrid } from "./_components/PengurusGrid";
import { PengurusStructureTree } from "./_components/PengurusStructureTree";
import { PengurusFormModal } from "./_components/PengurusFormModal";
import { PengurusDeleteModal } from "./_components/PengurusDeleteModal";
import { DepartmentModal } from "./_components/DepartmentModal";
import { BiroModal } from "./_components/BiroModal";

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
  const [structureTenant, setStructureTenant] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
        const uObj = stored ? JSON.parse(stored) : null;
        if (uObj && !isCabangOrAdmin(uObj)) {
          const t = getActiveTenant(uObj);
          if (t && t !== "ALL") return t;
          if (uObj.commissariat) return uObj.commissariat;
          if (uObj.komisariat) return uObj.komisariat;
          if (uObj.campus) return uObj.campus;
        }
      } catch {}
    }
    return "Pengurus Cabang Grobogan";
  });

  // RBAC permissions check
  const isSuperAdmin = isUserSuperAdmin(currentUser?.role, currentUser?.email);
  const userRole = (currentUser?.role || "").toLowerCase().trim();
  const isKetuaCabang = userRole === "ketua_cabang" || userRole === "ketua cabang";
  const isKetuaKomisariat = userRole === "ketua_komisariat" || userRole === "ketua komisariat";
  const isPengurusCabang = userRole === "pengurus_cabang" || userRole === "pengurus cabang" || userRole.includes("cabang");
  const isPengurusKomisariat = userRole === "pengurus_komisariat" || userRole === "pengurus komisariat" || userRole === "pengurus" || userRole.includes("komisariat");
  const isAdmin = userRole === "admin" || isUserAdmin(currentUser?.role) || isSuperAdmin;
  const canDelete = isAdmin || isKetuaCabang || isKetuaKomisariat || isPengurusCabang || isPengurusKomisariat;

  // Form Modal state (Combined Add & Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<BoardMember | null>(null);

  // Bidang / Divisi Modal states
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [deptInputName, setDeptInputName] = useState("");
  const [deptToDelete, setDeptToDelete] = useState<string | null>(null);

  // Biro states (Sub-divisi di bawah Bidang)
  const [biros, setBiros] = useState<Record<string, string[]>>(DEFAULT_BIROS);
  const [formBiro, setFormBiro] = useState("");
  const [isBiroModalOpen, setIsBiroModalOpen] = useState(false);
  const [biroModalDept, setBiroModalDept] = useState("");
  const [editingBiro, setEditingBiro] = useState<string | null>(null);
  const [biroInputName, setBiroInputName] = useState("");
  const [biroToDelete, setBiroToDelete] = useState<{ dept: string; biroName: string } | null>(null);

  // Cadres from database
  const [cadres, setCadres] = useState<any[]>([]);
  const [selectedCadreData, setSelectedCadreData] = useState<any>(null);

  // Form inputs state
  const [formName, setFormName] = useState("");
  const [formDept, setFormDept] = useState<string>("Kaderisasi");
  const [formPosition, setFormPosition] = useState("Anggota Bidang");
  const [formPeriod, setFormPeriod] = useState("2026 - 2027");
  const [formStatus, setFormStatus] = useState<"AKTIF" | "DEMISIONER">("AKTIF");
  const [formProgramKerja, setFormProgramKerja] = useState<string[]>([]);
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

  const targetStructureTenant = useMemo(() => {
    if (isCabangOrAdmin(currentUser)) {
      return structureTenant || "Pengurus Cabang Grobogan";
    }
    return (
      currentUser?.commissariat ||
      (currentUser as any)?.komisariat ||
      currentUser?.campus ||
      (currentUser as any)?.perguruanTinggi ||
      (activeTenant !== "ALL" ? activeTenant : "") ||
      activeCampus ||
      "Komisariat"
    );
  }, [currentUser, structureTenant, activeTenant, activeCampus]);

  const isStructureCabangLevel = useMemo(() => {
    if (!isCabangOrAdmin(currentUser)) return false;
    return targetStructureTenant.toLowerCase().includes("cabang");
  }, [currentUser, targetStructureTenant]);

  const structureMembers = useMemo(() => {
    return boardMembers.filter((m) => {
      const comm = (
        m.commissariat ||
        (m.tenant_id ? getTenantNameById(m.tenant_id) : "") ||
        "Pengurus Cabang Grobogan"
      ).toLowerCase();
      return (
        comm.includes(targetStructureTenant.toLowerCase()) ||
        targetStructureTenant.toLowerCase().includes(comm)
      );
    });
  }, [boardMembers, targetStructureTenant]);

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

    if (uObj && !isCabangOrAdmin(uObj)) {
      const userComm =
        uObj.commissariat ||
        uObj.komisariat ||
        uObj.campus ||
        (currentTenant !== "ALL" ? currentTenant : "");
      if (userComm) {
        setStructureTenant(userComm);
      }
    }

    const handleTenant = (e: any) => {
      const nextTenant = e.detail?.activeTenant || "ALL";
      setActiveTenant(nextTenant);
      if (nextTenant !== "ALL") {
        setActiveCampus(nextTenant);
      }
    };
    window.addEventListener(TENANT_CHANGED_EVENT, handleTenant);

    // Muat divisi organisasi dan biro dari cloud Supabase dengan fallback LocalStorage
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

      supabase
        .from("pengaturan")
        .select("value")
        .eq("key", "organization_biros")
        .maybeSingle()
        .then(
          ({ data }) => {
            if (data?.value && typeof data.value === "object") {
              setBiros(data.value);
              if (typeof window !== "undefined") {
                localStorage.setItem("PMII_ORGANIZATION_BIROS", JSON.stringify(data.value));
              }
            }
          },
          (err: any) => {
            console.warn("Failed to load biros from cloud:", err);
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

    const savedBiros = typeof window !== "undefined" ? localStorage.getItem("PMII_ORGANIZATION_BIROS") : null;
    if (savedBiros) {
      try {
        const parsed = JSON.parse(savedBiros);
        if (parsed && typeof parsed === "object") {
          setBiros(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved biros", e);
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

  const saveBiros = async (newBiros: Record<string, string[]>) => {
    setBiros(newBiros);
    if (typeof window !== "undefined") {
      localStorage.setItem("PMII_ORGANIZATION_BIROS", JSON.stringify(newBiros));
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from("pengaturan")
          .upsert({
            key: "organization_biros",
            value: newBiros,
            updated_at: new Date().toISOString()
          }, { onConflict: "key" });
      } catch (e) {
        console.warn("Failed to save biros to cloud:", e);
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
      (c) => (member.anggota_id && c.id === member.anggota_id) || c.name?.toLowerCase().trim() === member.name?.toLowerCase().trim()
    );
    return matched?.avatar || "";
  };

  // Helper to get phone directly from member or resolved from cadres database
  const getMemberPhone = (member?: BoardMember | null): string => {
    if (!member) return "-";
    const matched = cadres.find(
      (c) => (member.anggota_id && c.id === member.anggota_id) || c.name?.toLowerCase().trim() === member.name?.toLowerCase().trim()
    );
    return matched?.phone || member.phone || "-";
  };

  // Helper to get email directly from member or resolved from cadres database
  const getMemberEmail = (member?: BoardMember | null): string => {
    if (!member) return "-";
    const matched = cadres.find(
      (c) => (member.anggota_id && c.id === member.anggota_id) || c.name?.toLowerCase().trim() === member.name?.toLowerCase().trim()
    );
    return matched?.email || member.email || "-";
  };

  // Helper to get gender/salutation directly from member or resolved from cadres database
  const getMemberGender = (member?: BoardMember | null): "Sahabat" | "Sahabati" => {
    if (!member) return "Sahabat";
    const matched = cadres.find(
      (c) => (member.anggota_id && c.id === member.anggota_id) || c.name?.toLowerCase().trim() === member.name?.toLowerCase().trim()
    );
    const raw = matched?.gender || member.gender || "Sahabat";
    return raw === "Perempuan" || raw === "Sahabati" ? "Sahabati" : "Sahabat";
  };

  // Reset form inputs
  const resetForm = () => {
    setFormName("");
    setFormDept("Kaderisasi");
    setFormBiro("");
    setFormPosition("Anggota Bidang");
    setFormPeriod(getSystemPeriod());
    setFormStatus("AKTIF");
    setFormProgramKerja([]);
    setSelectedCadreData(null);
    setEditingMember(null);
  };

  const handleOpenAddModal = (
    defaultDept?: string,
    defaultPosition?: string,
    defaultTenant?: string,
    defaultBiro?: string
  ) => {
    resetForm();
    if (defaultTenant) {
      setActiveCampus(defaultTenant);
    }
    if (defaultBiro) {
      setFormBiro(defaultBiro);
    }
    const isCabangTarget = defaultTenant
      ? isCabangOrAdmin(currentUser) && defaultTenant.toLowerCase().includes("cabang")
      : isCabangLevel;

    if (defaultDept) {
      setFormDept(defaultDept);
      if (defaultPosition) {
        setFormPosition(defaultPosition);
      } else if (defaultDept === "BPH") {
        const targetTenant = defaultTenant || activeCampus;
        const tenantPool = boardMembers.filter((m) => {
          if (!targetTenant || targetTenant === "ALL") return true;
          return m.commissariat?.toLowerCase() === targetTenant.toLowerCase();
        });
        const hasExistingKetua = tenantPool.some(
          (m) =>
            m.department === "BPH" &&
            (m.position.toLowerCase().includes("ketua") ||
              m.position.toLowerCase().includes("ketum")) &&
            !m.position.toLowerCase().includes("wakil") &&
            m.status === "AKTIF"
        );
        if (hasExistingKetua) {
          setFormPosition(isCabangTarget ? "Sekretaris Cabang" : "Sekretaris");
        } else {
          setFormPosition(isCabangTarget ? "Ketua Cabang" : "Ketua Komisariat");
        }
      } else {
        setFormPosition("Anggota Bidang");
      }
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

      // Pindahkan biros dari nama lama ke nama baru
      const newBiros = { ...biros };
      if (newBiros[editingDept]) {
        newBiros[trimmed] = newBiros[editingDept];
        delete newBiros[editingDept];
        saveBiros(newBiros);
      }

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

    // Hapus biros di bidang ini
    const newBiros = { ...biros };
    delete newBiros[targetDept];
    saveBiros(newBiros);

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

  // Handlers for Biro CRUD
  const handleOpenAddBiroModal = (dept: string) => {
    setBiroModalDept(dept);
    setEditingBiro(null);
    setBiroInputName("");
    setIsBiroModalOpen(true);
  };

  const handleOpenEditBiroModal = (dept: string, biroName: string) => {
    setBiroModalDept(dept);
    setEditingBiro(biroName);
    setBiroInputName(biroName);
    setIsBiroModalOpen(true);
  };

  const handleSaveBiro = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = biroInputName.trim();
    if (!trimmed || !biroModalDept) return;

    const currentDeptBiros = biros[biroModalDept] || [];

    if (editingBiro) {
      if (trimmed.toLowerCase() === editingBiro.toLowerCase()) {
        setIsBiroModalOpen(false);
        return;
      }
      if (
        currentDeptBiros.some(
          (b) => b.toLowerCase() === trimmed.toLowerCase() && b.toLowerCase() !== editingBiro.toLowerCase()
        )
      ) {
        showError("Nama Biro Digunakan", `Nama biro "${trimmed}" sudah ada di bidang ${biroModalDept}.`);
        return;
      }

      const updatedDeptBiros = currentDeptBiros.map((b) => (b === editingBiro ? trimmed : b));
      const newBiros = { ...biros, [biroModalDept]: updatedDeptBiros };
      saveBiros(newBiros);

      // Update existing board members in this biro
      const updatedMembers = boardMembers.map((m) =>
        m.department === biroModalDept && m.biro === editingBiro
          ? { ...m, biro: trimmed }
          : m
      );
      saveBoardMembers(updatedMembers);
      showToast(`Nama biro "${editingBiro}" berhasil diubah menjadi "${trimmed}".`);
    } else {
      if (currentDeptBiros.some((b) => b.toLowerCase() === trimmed.toLowerCase())) {
        showError("Nama Biro Digunakan", `Nama biro "${trimmed}" sudah ada di bidang ${biroModalDept}.`);
        return;
      }

      const updatedDeptBiros = [...currentDeptBiros, trimmed];
      const newBiros = { ...biros, [biroModalDept]: updatedDeptBiros };
      saveBiros(newBiros);
      showToast(`Biro "${trimmed}" berhasil ditambahkan di bawah Bidang ${biroModalDept}.`);
    }

    setIsBiroModalOpen(false);
    setBiroInputName("");
    setEditingBiro(null);
  };

  const handleOpenDeleteBiroModal = (dept: string, biroName: string) => {
    if (!canDelete) {
      showError("Akses Ditolak", "Anda tidak memiliki izin untuk menghapus biro organisasi.");
      return;
    }
    setBiroToDelete({ dept, biroName });
  };

  const handleConfirmDeleteBiro = () => {
    if (!biroToDelete) return;
    const { dept, biroName } = biroToDelete;

    const currentDeptBiros = biros[dept] || [];
    const updatedDeptBiros = currentDeptBiros.filter((b) => b !== biroName);
    const newBiros = { ...biros, [dept]: updatedDeptBiros };
    saveBiros(newBiros);

    // Unassign members from this biro
    const updatedMembers = boardMembers.map((m) =>
      m.department === dept && m.biro === biroName
        ? { ...m, biro: undefined }
        : m
    );
    saveBoardMembers(updatedMembers);
    setBiroToDelete(null);
    showToast(`Biro "${biroName}" berhasil dihapus.`);
  };

  const handleOpenEditModal = (member: BoardMember) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormDept(member.department);
    setFormBiro(member.biro || "");
    setFormPosition(member.position);
    setFormPeriod(member.period || getSystemPeriod());
    setFormStatus(member.status || "AKTIF");

    const rawProker = member.program_kerja || member.programKerja;
    let initialProker: string[] = [];
    if (Array.isArray(rawProker)) {
      initialProker = rawProker.filter(Boolean);
    } else if (typeof rawProker === "string" && rawProker.trim()) {
      try {
        const parsed = JSON.parse(rawProker);
        if (Array.isArray(parsed)) {
          initialProker = parsed.filter(Boolean);
        } else {
          initialProker = rawProker
            .split("\n")
            .map((s) => s.replace(/^[0-9]+[.\-)]\s*/, "").trim())
            .filter(Boolean);
        }
      } catch {
        initialProker = rawProker
          .split("\n")
          .map((s) => s.replace(/^[0-9]+[.\-)]\s*/, "").trim())
          .filter(Boolean);
      }
    }
    setFormProgramKerja(initialProker);

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

    const cleanProker = formProgramKerja.map((p) => p.trim()).filter(Boolean);
    const prokerToSave = cleanProker.length > 0 ? JSON.stringify(cleanProker) : "";

    if (!editingMember) {
      // Validasi: Anggota yang masih aktif menjabat tidak boleh ditugaskan ke jabatan baru sebelum copot jabatan
      const alreadyActive = boardMembers.find(
        (m) =>
          m.status === "AKTIF" &&
          m.name.toLowerCase().trim() === formName.toLowerCase().trim()
      );
      if (alreadyActive) {
        showError(
          "Anggota Sudah Menjabat",
          `Sahabat/i "${alreadyActive.name}" saat ini masih aktif menjabat sebagai ${alreadyActive.position} (${alreadyActive.department}). Harap copot jabatan atau demisionerkan terlebih dahulu sebelum menugaskan ke jabatan baru.`
        );
        return;
      }
    }

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
              biro: formDept !== "BPH" && formBiro ? formBiro : undefined,
              email: matchedCadre?.email || editingMember.email || "-",
              phone: matchedCadre?.phone || editingMember.phone || "-",
              status: formStatus,
              period: formPeriod.trim() || "2026 - 2027",
              commissariat: resolvedComm || m.commissariat || "Pengurus Cabang Grobogan",
              tenant_id: resolvedTenantId || m.tenant_id || CABANG_TENANT_ID,
              komisariat_id: resolvedTenantId || m.komisariat_id || CABANG_TENANT_ID,
              avatar: memberAvatar,
              anggota_id: matchedCadre?.id || editingMember.anggota_id || null,
              program_kerja: prokerToSave
            }
          : m
      );
      saveBoardMembers(updated);
      showToast(`Data "${formName.trim()}" berhasil diperbarui!`);
    } else {
      // Add new member
      // Resolusi Otomatis Wakil Sekretaris / Wakil Bendahara jika posisi utama sudah ada
      let finalPosition = formPosition.trim();

      if (formDept === "BPH") {
        const posLower = finalPosition.toLowerCase();
        const isSekretaris =
          posLower.includes("sekretaris") && !posLower.includes("bidang");
        const isBendahara =
          posLower.includes("bendahara") && !posLower.includes("bidang");

        // Cari fungsionaris yang sudah terdaftar di tenant/organisasi ini
        const sameTenantMembers = boardMembers.filter((m) => {
          const matchComm =
            resolvedComm &&
            m.commissariat &&
            m.commissariat.toLowerCase() === resolvedComm.toLowerCase();
          const matchTenant =
            resolvedTenantId && m.tenant_id && m.tenant_id === resolvedTenantId;
          return matchComm || matchTenant;
        });

        // Validasi: Cegah duplikasi Ketua utama jika sudah ada Ketua aktif di tenant ini
        const isKetuaChoice =
          (posLower.includes("ketua") || posLower.includes("ketum")) &&
          !posLower.includes("wakil");

        if (isKetuaChoice) {
          const existingKetua = sameTenantMembers.find(
            (m) =>
              m.department === "BPH" &&
              (m.position.toLowerCase().includes("ketua") ||
                m.position.toLowerCase().includes("ketum")) &&
              !m.position.toLowerCase().includes("wakil") &&
              m.status === "AKTIF"
          );
          if (existingKetua) {
            showError(
              "Ketua Sudah Terdaftar",
              `Jabatan ${existingKetua.position} sudah aktif diemban oleh "${existingKetua.name}". Sebuah kepengurusan hanya dapat memiliki satu Ketua utama.`
            );
            return;
          }
        }

        if (isSekretaris) {
          const existingSekretaris = sameTenantMembers.filter(
            (m) =>
              m.department === "BPH" &&
              m.position.toLowerCase().includes("sekretaris") &&
              !m.position.toLowerCase().includes("bidang")
          );
          const hasUtama = existingSekretaris.some(
            (m) => !m.position.toLowerCase().includes("wakil")
          );
          if (hasUtama) {
            const wakilCount = existingSekretaris.filter((m) =>
              m.position.toLowerCase().includes("wakil")
            ).length;
            finalPosition = `Wakil Sekretaris ${wakilCount + 1}`;
          } else {
            finalPosition = isCabangLevel ? "Sekretaris Cabang" : "Sekretaris";
          }
        } else if (isBendahara) {
          const existingBendahara = sameTenantMembers.filter(
            (m) =>
              m.department === "BPH" &&
              m.position.toLowerCase().includes("bendahara") &&
              !m.position.toLowerCase().includes("bidang")
          );
          const hasUtama = existingBendahara.some(
            (m) => !m.position.toLowerCase().includes("wakil")
          );
          if (hasUtama) {
            const wakilCount = existingBendahara.filter((m) =>
              m.position.toLowerCase().includes("wakil")
            ).length;
            finalPosition = `Wakil Bendahara ${wakilCount + 1}`;
          } else {
            finalPosition = isCabangLevel ? "Bendahara Cabang" : "Bendahara";
          }
        }
      }

      if (!finalPosition) {
        finalPosition =
          formDept === "BPH"
            ? isCabangLevel
              ? "Pengurus BPH Cabang"
              : "Pengurus BPH"
            : `Anggota Bidang ${formDept}`;
      }

      const newMember: BoardMember = enforceTenantWrite<BoardMember>(
        currentUser,
        {
          id: generateUUID(),
          name: formName.trim(),
          gender: inferredGender,
          position: finalPosition,
          department: formDept,
          biro: formDept !== "BPH" && formBiro ? formBiro : undefined,
          email: matchedCadre?.email || "-",
          phone: matchedCadre?.phone || "-",
          status: formStatus,
          period: formPeriod.trim() || "2026 - 2027",
          commissariat: resolvedComm,
          tenant_id: resolvedTenantId,
          komisariat_id: resolvedTenantId,
          avatar: memberAvatar,
          anggota_id: matchedCadre?.id || null,
          program_kerja: prokerToSave
        },
        activeTenant
      );
      const updated = [newMember, ...boardMembers];
      saveBoardMembers(updated);
      showToast(`Berhasil menambahkan ${formName.trim()} sebagai ${finalPosition}!`);
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
        "Sapaan": getMemberGender(m),
        "Jabatan": m.position || "-",
        "Departemen / Divisi": m.department || "-",
        "Status": m.status || "AKTIF",
        "Periode": m.period || "-",
        "Komisariat / Afiliasi": m.commissariat || "-",
        "Email": getMemberEmail(m),
        "No. Telepon": getMemberPhone(m)
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
            href="/dashboard"
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
            onClick={() =>
              handleOpenAddModal(
                undefined,
                undefined,
                !isCabangOrAdmin(currentUser) ? targetStructureTenant : undefined
              )
            }
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
              getMemberGender={getMemberGender}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteMember}
              canDelete={canDelete}
              onAddInTenant={(tName) => handleOpenAddModal(undefined, undefined, tName)}
              divisions={divisions}
              biros={biros}
              onOpenAddModal={handleOpenAddModal}
              onOpenAddDeptModal={handleOpenAddDeptModal}
              onOpenEditDeptModal={handleOpenEditDeptModal}
              onDeleteDept={handleOpenDeleteDeptModal}
              onOpenAddBiroModal={handleOpenAddBiroModal}
              onOpenEditBiroModal={handleOpenEditBiroModal}
              onDeleteBiro={handleOpenDeleteBiroModal}
              isCabang={isCabangOrAdmin(currentUser)}
            />
          </div>
        )}

        {/* TAB 2: ORGANIZATIONAL STRUCTURE TREE */}
        {activeTab === "struktur" && (
          <div className="space-y-4">
            {isCabangOrAdmin(currentUser) && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <span className="text-xs font-bold text-zinc-500 shrink-0">Pilih Struktur:</span>
                {["Pengurus Cabang Grobogan", ...availableKomisariats].map((kName) => {
                  const isSelected =
                    (structureTenant || activeCampus).toLowerCase() === kName.toLowerCase();
                  return (
                    <button
                      key={kName}
                      type="button"
                      onClick={() => setStructureTenant(kName)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white font-semibold shadow-xs"
                          : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                      }`}
                    >
                      {kName}
                    </button>
                  );
                })}
              </div>
            )}

            <PengurusStructureTree
              boardMembers={structureMembers}
              divisions={divisions}
              biros={biros}
              getMemberAvatar={getMemberAvatar}
              onOpenAddModal={(dDept, dPos, dBiro) =>
                handleOpenAddModal(
                  dDept,
                  dPos,
                  targetStructureTenant,
                  dBiro
                )
              }
              onOpenEditModal={handleOpenEditModal}
              onDeleteMember={handleOpenDeleteMember}
              onOpenAddDeptModal={handleOpenAddDeptModal}
              onOpenEditDeptModal={handleOpenEditDeptModal}
              onDeleteDept={handleOpenDeleteDeptModal}
              onOpenAddBiroModal={handleOpenAddBiroModal}
              onOpenEditBiroModal={handleOpenEditBiroModal}
              onDeleteBiro={handleOpenDeleteBiroModal}
              isCabangLevel={isStructureCabangLevel}
              canDelete={canDelete}
              tenantTitle={targetStructureTenant}
            />
          </div>
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
        formBiro={formBiro}
        setFormBiro={setFormBiro}
        biros={biros}
        formPosition={formPosition}
        setFormPosition={setFormPosition}
        formPeriod={formPeriod}
        formStatus={formStatus}
        setFormStatus={setFormStatus}
        formProgramKerja={formProgramKerja}
        setFormProgramKerja={setFormProgramKerja}
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

      {/* MODALS: ADD/EDIT BIRO & DELETE BIRO */}
      <BiroModal
        isOpen={isBiroModalOpen}
        onOpenChange={setIsBiroModalOpen}
        targetDept={biroModalDept}
        editingBiro={editingBiro}
        biroInputName={biroInputName}
        setBiroInputName={setBiroInputName}
        onSaveBiro={handleSaveBiro}
        biroToDelete={biroToDelete}
        onCloseDeleteBiro={() => setBiroToDelete(null)}
        onConfirmDeleteBiro={handleConfirmDeleteBiro}
        memberCountInBiro={
          biroToDelete
            ? boardMembers.filter(
                (m) =>
                  m.department === biroToDelete.dept &&
                  m.biro === biroToDelete.biroName
              ).length
            : 0
        }
      />

      {FeedbackModalComponent}
    </div>
  );
}
