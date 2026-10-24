"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  FileSpreadsheet,
  LayoutGrid,
  List,
  ChevronRight,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { db, generateUUID } from "@/lib/db";
import { useFeedbackModal } from "@/components/ui/feedback-modal";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  normalizeTenantName,
  isRecordInTenant,
  getActiveTenant,
  setActiveTenant as setGlobalActiveTenant,
  TENANT_CHANGED_EVENT,
  isCabangOrAdmin,
  DEFAULT_KOMISARIAT_LIST,
  getTenantIdByName
} from "@/lib/tenancy";
import { isUserSuperAdmin } from "@/lib/auth-helpers";

import { CommissariatList, KomisariatFormData } from "./_components/types";
import { KomisariatCard } from "./_components/KomisariatCard";
import { KomisariatTable } from "./_components/KomisariatTable";
import { KomisariatModal } from "./_components/KomisariatModal";
import { KomisariatDeleteDialog } from "./_components/KomisariatDeleteDialog";

export default function KomisariatPage() {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTenant, setActiveTenant] = useState<string>("ALL");
  const [komisariats, setKomisariats] = useState<CommissariatList[]>([]);
  const [cadres, setCadres] = useState<any[]>([]);
  const [boardMembers, setBoardMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Dialog States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CommissariatList | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CommissariatList | null>(null);

  const { showSuccess, showError, showFeedback, FeedbackModalComponent } = useFeedbackModal();

  const isSuperAdmin = isUserSuperAdmin(currentUser?.role, currentUser?.email);
  const isTenantView = isSuperAdmin || (pathname ? pathname.includes("/tenant") : false);

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const commPromise = db.getCommissariats();
      const cadrePromise = db.getCadres().catch(() => []);
      const boardPromise = db.getBoards().catch(() => []);

      const commList = await commPromise;
      setKomisariats(commList || []);
      setLoading(false);

      const [cadreList, boardList] = await Promise.all([cadrePromise, boardPromise]);
      setCadres(cadreList || []);
      setBoardMembers(boardList || []);
    } catch (err) {
      console.error("Gagal memuat data komisariat:", err);
      showError("Gagal Memuat Data", "Terjadi gangguan saat mengambil data dari database.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          setCurrentUser(user);
          const isSuper = isUserSuperAdmin(user.role, user.email);
          // Untuk Superadmin atau halaman Tenant, default selalu "ALL" agar seluruh data tenant tampil
          if (isSuper || (pathname && pathname.includes("/tenant"))) {
            setActiveTenant("ALL");
          } else {
            setActiveTenant(getActiveTenant(user) || "ALL");
          }
        } catch {}
      }

      const handleTenant = (e: any) => {
        setActiveTenant(e.detail?.activeTenant || "ALL");
      };
      window.addEventListener(TENANT_CHANGED_EVENT, handleTenant);

      loadData();

      return () => window.removeEventListener(TENANT_CHANGED_EVENT, handleTenant);
    }
  }, [pathname]);

  // Sync URL dynamically based on Superadmin role
  useEffect(() => {
    if (currentUser && pathname) {
      const isSuper = isUserSuperAdmin(currentUser.role, currentUser.email);
      if (isSuper && pathname.includes("/komisariat")) {
        router.replace(pathname.replace("/komisariat", "/tenant"));
      } else if (!isSuper && pathname.includes("/tenant")) {
        router.replace(pathname.replace("/tenant", "/komisariat"));
      }
    }
  }, [currentUser, pathname, router]);

  const getMemberCount = (commName: string) => {
    if (!cadres || cadres.length === 0) return 0;
    const targetNorm = normalizeTenantName(commName);
    return cadres.filter(
      (c) => normalizeTenantName(c.commissariat || c.komisariat) === targetNorm
    ).length;
  };

  // Filtered List - Master list tenant/komisariat
  const filteredKomisariats = useMemo(() => {
    return komisariats.filter((k) => {
      // Filter dropdown tenant: jika user secara spesifik memilih tenant tertentu
      if (activeTenant && activeTenant !== "ALL") {
        const targetNorm = normalizeTenantName(activeTenant);
        const kNorm = normalizeTenantName(k.name);
        const matchId = k.id === activeTenant || k.id === getTenantIdByName(activeTenant);
        const matchName = kNorm.includes(targetNorm) || targetNorm.includes(kNorm);
        if (!matchId && !matchName) return false;
      }

      const matchesSearch =
        searchQuery === "" ||
        k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (k.university && k.university.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (k.campusName && k.campusName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (k.contactEmail && k.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (k.structure?.chairman &&
          k.structure.chairman.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [komisariats, searchQuery, activeTenant]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (k: CommissariatList) => {
    setEditingItem(k);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (k: CommissariatList) => {
    setItemToDelete(k);
    setIsDeleteOpen(true);
  };

  const handleSaveCommissariat = async (formData: KomisariatFormData) => {
    let updatedList: CommissariatList[] = [];

    if (formData.id) {
      // Update existing
      updatedList = komisariats.map((item) => {
        if (item.id === formData.id) {
          return {
            ...item,
            ...formData,
            id: formData.id,
            university: formData.university,
            campusName: formData.university,
          };
        }
        return item;
      });
    } else {
      // Create new
      const newItem: CommissariatList = {
        id: generateUUID(),
        ...formData,
        university: formData.university,
        campusName: formData.university,
      };
      updatedList = [newItem, ...komisariats];
    }

    const success = await db.saveCommissariats(updatedList);
    if (success) {
      setKomisariats(updatedList);
      showSuccess(
        formData.id ? "Berhasil Diperbarui" : `${isTenantView ? "Tenant" : "Komisariat"} Ditambahkan`,
        `Data ${isTenantView ? "tenant" : "komisariat"} ${formData.name} berhasil disimpan ke database.`
      );
    } else {
      throw new Error("Gagal menyimpan ke penyimpanan data.");
    }
  };

  const handleDeleteConfirm = async (k: CommissariatList) => {
    try {
      // 1. Hapus permanen record dari database Supabase dan localStorage
      const deleteSuccess = await db.deleteCommissariat(k.id);

      // 2. Sinkronkan sisa data di state dan tabel
      const updated = komisariats.filter((item) => item.id !== k.id);
      setKomisariats(updated);
      await db.saveCommissariats(updated);

      if (deleteSuccess) {
        showSuccess(
          `${isTenantView ? "Tenant" : "Komisariat"} Dihapus`,
          `${isTenantView ? "Tenant" : "Komisariat"} ${k.name} berhasil dihapus dari sistem.`
        );
      } else {
        throw new Error("Gagal menghapus record dari database.");
      }
    } catch (err) {
      console.error("Gagal menghapus tenant:", err);
      showError(
        "Gagal Menghapus",
        `Terjadi kesalahan saat menghapus ${isTenantView ? "tenant" : "komisariat"}.`
      );
    }
  };

  const handleExportExcel = () => {
    if (filteredKomisariats.length === 0) {
      showFeedback(
        "Tidak Ada Data",
        `Tidak ada ${isTenantView ? "tenant" : "komisariat"} yang dapat diekspor saat ini.`,
        "info"
      );
      return;
    }

    const exportRows = filteredKomisariats.map((k, idx) => ({
      No: idx + 1,
      [isTenantView ? "Nama Tenant" : "Nama Komisariat"]: k.name,
      "Perguruan Tinggi": k.university || k.campusName || "-",
      "Tahun Berdiri": k.establishedYear || "-",
      "Email Kontak": k.contactEmail || "-",
      "Ketua": k.structure?.chairman || "-",
      Sekretaris: k.structure?.secretary || "-",
      Bendahara: k.structure?.treasurer || "-",
      Periode: k.structure?.period || "-",
      "Kader Terdaftar": getMemberCount(k.name),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, isTenantView ? "Data Tenant" : "Data Komisariat");

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Data_${isTenantView ? "Tenant" : "Komisariat"}_PMII_${dateStr}.xlsx`);

    showSuccess(
      "Ekspor Berhasil",
      `File spreadsheet Data_${isTenantView ? "Tenant" : "Komisariat"}_PMII_${dateStr}.xlsx berhasil diunduh.`
    );
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* BREADCRUMB & ACTION TOOLBAR (MINIMALIS SEPERTI HALAMAN PENGURUS) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <Link
            href="/dashboard"
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {isTenantView ? "Tenant" : "Komisariat"}
          </span>
          <Badge
            variant="outline"
            className="ml-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] py-0 px-1.5 font-normal"
          >
            {komisariats.length} {isTenantView ? "Tenant" : "Komisariat"}
          </Badge>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="h-8.5 text-xs gap-1.5 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-500" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-8.5 text-xs gap-1.5 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-emerald-600"
            title="Unduh File Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Ekspor Excel</span>
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium h-8.5 px-3.5 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors border-none"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah {isTenantView ? "Tenant" : "Komisariat"}</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar & View Toggle */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-2.5">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder={isTenantView ? "Cari tenant, kampus, ketua..." : "Cari komisariat, kampus, ketua..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {isCabangOrAdmin(currentUser) && (
            <Select
              value={activeTenant}
              onValueChange={(val) => {
                if (val) {
                  setActiveTenant(val);
                  setGlobalActiveTenant(val);
                }
              }}
            >
              <SelectTrigger className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg min-w-[170px]">
                <SelectValue placeholder="Semua Komisariat" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg max-h-60">
                <SelectItem value="ALL" className="text-xs">
                  Semua {isTenantView ? "Tenant" : "Komisariat"}
                </SelectItem>
                {komisariats.map((c) => (
                  <SelectItem key={c.id} value={c.name} className="text-xs">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Menampilkan <strong>{filteredKomisariats.length}</strong> dari {komisariats.length}
          </span>
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs transition-colors flex items-center justify-center ${
                viewMode === "grid"
                  ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-medium"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
              title="Tampilan Grid Card"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs transition-colors flex items-center justify-center ${
                viewMode === "table"
                  ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-medium"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
              title="Tampilan Tabel Rinci"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering: Grid vs Table */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 animate-pulse"
            />
          ))}
        </div>
      ) : viewMode === "grid" ? (
        filteredKomisariats.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-zinc-400 mb-3 opacity-60" />
            <h4 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
              Tidak ada {isTenantView ? "tenant" : "komisariat"} ditemukan
            </h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian Anda atau tambahkan {isTenantView ? "tenant" : "komisariat"} baru.
            </p>
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="mt-4 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah {isTenantView ? "Tenant" : "Komisariat"} Sekarang
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredKomisariats.map((k) => (
              <KomisariatCard
                key={k.id}
                komisariat={k}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            ))}
          </div>
        )
      ) : (
        <KomisariatTable
          komisariats={filteredKomisariats}
          getMemberCount={getMemberCount}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          isTenantView={isTenantView}
        />
      )}

      {/* Form Dialog: Add / Edit */}
      <KomisariatModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingItem={editingItem}
        onSave={handleSaveCommissariat}
        boardMembers={boardMembers}
        isTenantView={isTenantView}
      />

      {/* Delete Confirmation Dialog */}
      <KomisariatDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        komisariat={itemToDelete}
        onConfirm={handleDeleteConfirm}
        isTenantView={isTenantView}
      />

      {/* Feedback Toast Modal */}
      {FeedbackModalComponent}
    </div>
  );
}
