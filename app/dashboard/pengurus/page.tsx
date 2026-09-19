"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/db";
import {
  ShieldCheck,
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Check,
  X,
  GitFork,
  UserCheck,
  UserPlus,
  Info,
  ChevronDown,
  LayoutGrid,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Lock
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

interface BoardMember {
  id: string;
  name: string;
  position: string;
  department: string;
  gender: "Sahabat" | "Sahabati";
  email: string;
  phone: string;
  status: "AKTIF" | "DEMISIONER";
  period: string;
  commissariat?: string;
  avatar?: string;
}

const DEFAULT_DIVISIONS = [
  "Kaderisasi",
  "Keagamaan & Dakwah",
  "Advokasi & Humas",
  "Minat, Bakat & Seni"
];

export default function KomisariatPengurusPage() {
  const [mounted, setMounted] = useState(false);
  const [activeCampus, setActiveCampus] = useState("UIN Walisongo");
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [activeTab, setActiveTab] = useState<"daftar" | "struktur">("daftar");

  // Divisions / Bidang state
  const [divisions, setDivisions] = useState<string[]>(DEFAULT_DIVISIONS);
  const allDepartments = ["BPH", ...divisions];

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

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

  // Delete Confirmation Dialog state
  const [memberToDelete, setMemberToDelete] = useState<BoardMember | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const campus = typeof window !== "undefined" ? (localStorage.getItem("PMII_ACTIVE_COMMISSARIAT") || "UIN Walisongo") : "UIN Walisongo";
    setActiveCampus(campus);

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
      db.getCadres([])
    ]).then(([boardsData, cadresData]) => {
      setBoardMembers(boardsData as any);
      setCadres(cadresData as any);
      setMounted(true);
    });
  }, []);

  const saveDivisions = (newDivs: string[]) => {
    setDivisions(newDivs);
    if (typeof window !== "undefined") {
      localStorage.setItem("PMII_ORGANIZATION_DIVISIONS", JSON.stringify(newDivs));
    }
  };

  const saveBoardMembers = async (members: BoardMember[]) => {
    setBoardMembers(members);
    await db.saveBoards(members as any);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
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

  // Helper for name initials
  const getInitials = (name: string): string => {
    return (
      name
        .split(" ")
        .filter((w) => w.toLowerCase() !== "sahabat" && w.toLowerCase() !== "sahabati")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "KD"
    );
  };

  // Helper to read active period from system settings
  const getSystemPeriod = (): string => {
    if (typeof window === "undefined") return "2026 - 2027";
    try {
      const saved = localStorage.getItem("PMII_SYSTEM_SETTINGS");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.organization?.period) {
          return parsed.organization.period;
        }
      }
    } catch (e) {
      console.error("Failed to read system period", e);
    }
    return "2026 - 2027";
  };

  // Reset form inputs
  const resetForm = () => {
    setFormName("");
    setFormDept("Kaderisasi");
    setFormPosition("Anggota Bidang");
    setFormPeriod(getSystemPeriod());
    setSelectedCadreData(null);
    setEditingMember(null);
  };

  const handleOpenAddModal = (defaultDept?: string, defaultPosition?: string) => {
    resetForm();
    if (defaultDept) {
      setFormDept(defaultDept);
      setFormPosition(defaultPosition || (defaultDept === "BPH" ? "Ketua Komisariat" : "Anggota Bidang"));
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
        alert("Nama bidang sudah digunakan.");
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
        alert("Nama bidang sudah ada.");
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

  const handleConfirmDeleteDept = () => {
    if (!deptToDelete) return;
    const updatedDivs = divisions.filter((d) => d !== deptToDelete);
    saveDivisions(updatedDivs);

    // Remove members from this department
    const updatedMembers = boardMembers.filter((m) => m.department !== deptToDelete);
    saveBoardMembers(updatedMembers);

    showToast(`Bidang "${deptToDelete}" dan fungsionarisnya berhasil dihapus.`);
    setDeptToDelete(null);
  };

  const handleOpenEditModal = (member: BoardMember) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormDept(member.department);
    setFormPosition(member.position);
    setFormPeriod(member.period || getSystemPeriod());
    const matched = cadres.find((c) => c.name === member.name);
    setSelectedCadreData(matched || null);
    setIsFormModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const matchedCadre = selectedCadreData || cadres.find((c) => c.name === formName.trim());
    const inferredGender: "Sahabat" | "Sahabati" =
      matchedCadre?.gender === "Perempuan" || matchedCadre?.gender === "Sahabati"
        ? "Sahabati"
        : "Sahabat";
    const memberAvatar = matchedCadre?.avatar || (editingMember ? editingMember.avatar : "") || "";

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
              status: editingMember.status || "AKTIF",
              period: formPeriod.trim() || "2026 - 2027",
              commissariat: m.commissariat || activeCampus,
              avatar: memberAvatar
            }
          : m
      );
      saveBoardMembers(updated);
      showToast(`Data "${formName.trim()}" berhasil diperbarui!`);
    } else {
      // Add new member
      const newMember: BoardMember = {
        id: `board-${Date.now()}`,
        name: formName.trim(),
        gender: inferredGender,
        position: formPosition.trim() || (formDept === "BPH" ? "Pengurus BPH" : `Anggota Bidang ${formDept}`),
        department: formDept,
        email: matchedCadre?.email || "-",
        phone: matchedCadre?.phone || "-",
        status: "AKTIF",
        period: formPeriod.trim() || "2026 - 2027",
        commissariat: matchedCadre?.commissariat || activeCampus,
        avatar: memberAvatar
      };
      const updated = [newMember, ...boardMembers];
      saveBoardMembers(updated);
      showToast(`Berhasil menambahkan ${formName.trim()} sebagai pengurus!`);
    }

    setIsFormModalOpen(false);
    resetForm();
  };

  const confirmDelete = () => {
    if (!memberToDelete) return;
    const updated = boardMembers.filter((m) => m.id !== memberToDelete.id);
    saveBoardMembers(updated);
    showToast(`Data pengurus "${memberToDelete.name}" berhasil dihapus.`);
    setMemberToDelete(null);
  };

  // Filtering logic
  const filteredMembers = boardMembers.filter((m) => {
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

  // Find structure elements for tree
  const ketua = boardMembers.find((m) => m.position.toLowerCase().includes("ketua") && m.department === "BPH");
  const sekretaris = boardMembers.find((m) => m.position.toLowerCase().includes("sekretaris") && m.department === "BPH");
  const bendahara = boardMembers.find((m) => m.position.toLowerCase().includes("bendahara") && m.department === "BPH");

  return (
    <div className="space-y-6 relative z-10 font-sans text-zinc-900 dark:text-zinc-100 pb-10">
      
      {/* TOAST ALERTS */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 right-6 z-50 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-zinc-700 dark:border-zinc-300"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. HEADER HERO BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 rounded-xl shadow-none">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white shadow-sm shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Data Pengurus
              </h1>
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold uppercase py-0.5 tracking-wider px-2">
                Struktur PK
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-xl leading-relaxed">
              Kelola struktur kepengurusan {activeCampus}, atur penugasan divisi, dan visualisasikan diagram organisasi kepengurusan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={() => handleOpenAddModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-9 px-4 rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5 transition-colors"
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

      {/* 4. MAIN TAB CONTENTS */}
      <div className="min-h-[400px]">
        {/* TAB 1: LIST VIEW */}
        {activeTab === "daftar" && (
          <div className="space-y-4">
            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-none">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Cari nama atau jabatan pengurus..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg w-full text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Department Filter */}
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-zinc-700 dark:text-zinc-300 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ALL">Semua Divisi</option>
                  {allDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d === "BPH" ? "BPH" : `Bidang ${d}`}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-zinc-700 dark:text-zinc-300 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="AKTIF">Aktif</option>
                  <option value="DEMISIONER">Demisioner</option>
                </select>
              </div>
            </div>

            {/* Members Grid */}
            {filteredMembers.length === 0 ? (
              <Card className="p-12 text-center bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Tidak ada pengurus ditemukan</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                  Coba sesuaikan kata pencarian atau filter divisi/status kepengurusan Anda.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMembers.map((member) => {
                  const avatar = getMemberAvatar(member);
                  return (
                    <motion.div
                      key={member.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Card className="h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl overflow-hidden shadow-none flex flex-col justify-between group transition-colors">
                        
                        {/* Department Accent Ribbon */}
                        <div
                          className={`h-1 w-full ${
                            member.department === "BPH"
                              ? "bg-amber-500"
                              : member.department === "Kaderisasi"
                              ? "bg-blue-600"
                              : member.department === "Keagamaan & Dakwah"
                              ? "bg-emerald-600"
                              : member.department === "Advokasi & Humas"
                              ? "bg-purple-600"
                              : "bg-pink-600"
                          }`}
                        />

                        {/* Card Content */}
                        <div className="p-4 space-y-3.5 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            {/* Avatar Photo / Initials */}
                            {avatar ? (
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-xs">
                                <img
                                  src={avatar}
                                  alt={member.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs select-none shadow-xs shrink-0 ${
                                  member.gender === "Sahabat"
                                    ? "bg-blue-600 dark:bg-blue-700"
                                    : "bg-pink-600 dark:bg-pink-700"
                                }`}
                              >
                                {getInitials(member.name)}
                              </div>
                            )}

                            {/* Status Badge & Period */}
                            <div className="flex flex-col items-end gap-1">
                              <Badge
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-none border ${
                                  member.status === "AKTIF"
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                    : "bg-zinc-500/10 border-zinc-500/20 text-zinc-500 dark:text-zinc-400"
                                }`}
                              >
                                {member.status}
                              </Badge>
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                                {member.period}
                              </span>
                            </div>
                          </div>

                          {/* Name & Position */}
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {member.name}
                            </h4>
                            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                              {member.position}
                            </p>
                          </div>

                          {/* Division */}
                          <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span className="text-zinc-400">Divisi</span>
                            <Badge variant="outline" className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 font-medium text-[10px] px-1.5 py-0.5">
                              {member.department}
                            </Badge>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(member)}
                            className="h-7 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMemberToDelete(member)}
                            className="h-7 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORGANIZATIONAL STRUCTURE TREE WITH FULL CRUD */}
        {activeTab === "struktur" && (
          <div className="space-y-4">

            {/* ACTION TOOLBAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <GitFork className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Diagram Struktur Organisasi
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Kelola struktur dan bidang secara langsung: tambah bidang baru, sesuaikan nama, atau tetapkan fungsionaris.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenAddDeptModal}
                  className="h-8 px-3 text-xs border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Bidang</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleOpenAddModal()}
                  className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tambah Pengurus</span>
                </Button>
              </div>
            </div>
            
            {/* MOBILE VIEW: HIERARCHICAL CARD LIST (< md) */}
            <div className="block md:hidden space-y-4">
              {/* BPH SECTION */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Badan Pengurus Harian (BPH)
                </span>
                
                {/* Ketua Mobile */}
                <Card className="p-3.5 bg-white dark:bg-zinc-900 border-l-4 border-l-amber-500 border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {ketua && getMemberAvatar(ketua) ? (
                        <img
                          src={getMemberAvatar(ketua)}
                          alt={ketua.name}
                          className="w-11 h-11 rounded-full object-cover border border-amber-500/30 shrink-0 shadow-xs"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/20 shrink-0">
                          {ketua ? getInitials(ketua.name) : "KT"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none text-[10px] font-semibold px-2 py-0.5">
                          {ketua?.position || "Ketua Komisariat"}
                        </Badge>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1 truncate">
                          {ketua?.name || "Ketua Belum Ditetapkan"}
                        </h4>
                        <p className="text-[10px] text-zinc-400">{ketua?.period || "2026 - 2027"}</p>
                      </div>
                    </div>
                    {ketua ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(ketua)} className="h-7 px-2 text-xs shrink-0 cursor-pointer">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setMemberToDelete(ketua)} className="h-7 px-2 text-xs shrink-0 text-rose-500 hover:text-rose-600 border-rose-200 dark:border-rose-900/50 cursor-pointer">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => handleOpenAddModal("BPH", "Ketua Komisariat")} className="h-7 px-2.5 text-[11px] bg-amber-600 hover:bg-amber-700 text-white shrink-0 cursor-pointer">
                        <Plus className="w-3 h-3 mr-1" /> Tetapkan
                      </Button>
                    )}
                  </div>
                </Card>

                {/* Sekretaris & Bendahara Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Card className="p-3 bg-white dark:bg-zinc-900 border-l-4 border-l-blue-500 border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none">
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {sekretaris && getMemberAvatar(sekretaris) ? (
                          <img
                            src={getMemberAvatar(sekretaris)}
                            alt={sekretaris.name}
                            className="w-9 h-9 rounded-full object-cover border border-blue-500/30 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center justify-center border border-blue-500/20 shrink-0">
                            {sekretaris ? getInitials(sekretaris.name) : "SK"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">Sekretaris</span>
                          <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {sekretaris?.name || "Belum Ditetapkan"}
                          </h5>
                        </div>
                      </div>
                      {sekretaris ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(sekretaris)} className="h-7 px-1.5 text-xs shrink-0 cursor-pointer">
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setMemberToDelete(sekretaris)} className="h-7 px-1.5 text-xs shrink-0 text-rose-500 hover:text-rose-600 border-rose-200 dark:border-rose-900/50 cursor-pointer">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => handleOpenAddModal("BPH", "Sekretaris")} className="h-7 px-2 text-[10px] bg-blue-600 hover:bg-blue-700 text-white shrink-0 cursor-pointer">
                          <Plus className="w-3 h-3 mr-0.5" /> Tetapkan
                        </Button>
                      )}
                    </div>
                  </Card>

                  <Card className="p-3 bg-white dark:bg-zinc-900 border-l-4 border-l-emerald-500 border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none">
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {bendahara && getMemberAvatar(bendahara) ? (
                          <img
                            src={getMemberAvatar(bendahara)}
                            alt={bendahara.name}
                            className="w-9 h-9 rounded-full object-cover border border-emerald-500/30 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-center border border-emerald-500/20 shrink-0">
                            {bendahara ? getInitials(bendahara.name) : "BD"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Bendahara</span>
                          <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {bendahara?.name || "Belum Ditetapkan"}
                          </h5>
                        </div>
                      </div>
                      {bendahara ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(bendahara)} className="h-7 px-1.5 text-xs shrink-0 cursor-pointer">
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setMemberToDelete(bendahara)} className="h-7 px-1.5 text-xs shrink-0 text-rose-500 hover:text-rose-600 border-rose-200 dark:border-rose-900/50 cursor-pointer">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => handleOpenAddModal("BPH", "Bendahara")} className="h-7 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 cursor-pointer">
                          <Plus className="w-3 h-3 mr-0.5" /> Tetapkan
                        </Button>
                      )}
                    </div>
                  </Card>
                </div>
              </div>

              {/* DIVISIONS SECTION MOBILE */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Bidang-Bidang Pelaksana ({divisions.length})
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenAddDeptModal}
                    className="h-6 px-2 text-[10px] text-blue-600 border-blue-200 dark:border-blue-900/60 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Tambah Bidang
                  </Button>
                </div>

                {divisions.map((dept) => {
                  const divMembers = boardMembers.filter((m) => m.department === dept);
                  const headOfDiv = divMembers.find((m) => m.position.toLowerCase().includes("kepala") || m.position.toLowerCase().includes("kabid"));
                  const staffOfDiv = divMembers.filter((m) => m.id !== headOfDiv?.id);

                  return (
                    <Card key={dept} className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none space-y-2.5">
                      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">Bidang {dept}</span>
                          <button
                            onClick={() => handleOpenEditDeptModal(dept)}
                            className="text-zinc-400 hover:text-blue-600 cursor-pointer p-0.5"
                            title="Edit nama bidang"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={() => setDeptToDelete(dept)}
                            className="text-zinc-400 hover:text-rose-600 cursor-pointer p-0.5"
                            title="Hapus bidang"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] font-medium">
                            {divMembers.length} Fungsionaris
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenAddModal(dept, "Anggota Bidang")}
                            className="h-6 px-2 text-[10px] text-blue-600 hover:text-blue-700 border-blue-200 dark:border-blue-900/60 cursor-pointer"
                          >
                            <Plus className="w-3 h-3 mr-0.5" /> Tambah
                          </Button>
                        </div>
                      </div>

                      {/* Kabid Mobile */}
                      <div className="text-xs">
                        <span className="text-[10px] text-zinc-400 block mb-1">Kepala Bidang:</span>
                        <div className="flex items-center justify-between font-semibold text-zinc-800 dark:text-zinc-200">
                          <div className="flex items-center gap-2 min-w-0">
                            {headOfDiv && getMemberAvatar(headOfDiv) ? (
                              <img
                                src={getMemberAvatar(headOfDiv)}
                                alt={headOfDiv.name}
                                className="w-7 h-7 rounded-full object-cover border border-zinc-300 dark:border-zinc-700 shrink-0"
                              />
                            ) : headOfDiv ? (
                              <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {getInitials(headOfDiv.name)}
                              </div>
                            ) : null}
                            <span className="truncate">{headOfDiv?.name || "Belum Ditetapkan"}</span>
                          </div>
                          {headOfDiv ? (
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <button onClick={() => handleOpenEditModal(headOfDiv)} className="text-blue-600 text-[11px] hover:underline cursor-pointer">
                                Edit
                              </button>
                              <span className="text-zinc-300 dark:text-zinc-700 text-xs">•</span>
                              <button onClick={() => setMemberToDelete(headOfDiv)} className="text-rose-500 text-[11px] hover:underline cursor-pointer">
                                Hapus
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenAddModal(dept, "Kepala Bidang")}
                              className="text-blue-600 text-[11px] font-medium hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              <Plus className="w-3 h-3" /> Tetapkan
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Staff Mobile */}
                      {staffOfDiv.length > 0 && (
                        <div className="pt-1 text-[11px]">
                          <span className="text-zinc-400 block mb-1.5">Anggota Bidang ({staffOfDiv.length}):</span>
                          <div className="flex flex-wrap gap-1.5">
                            {staffOfDiv.map((staff) => {
                              const staffAvatar = getMemberAvatar(staff);
                              return (
                                <span key={staff.id} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] group/item">
                                  {staffAvatar ? (
                                    <img src={staffAvatar} alt={staff.name} className="w-4 h-4 rounded-full object-cover" />
                                  ) : (
                                    <span className="w-3.5 h-3.5 rounded-full bg-zinc-300 dark:bg-zinc-700 text-[8px] flex items-center justify-center font-bold">
                                      {getInitials(staff.name)[0]}
                                    </span>
                                  )}
                                  <span>{staff.name.replace(/Sahabat|Sahabati/g, "").trim()}</span>
                                  <button
                                    onClick={() => handleOpenEditModal(staff)}
                                    className="text-zinc-400 hover:text-blue-600 cursor-pointer ml-0.5"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    onClick={() => setMemberToDelete(staff)}
                                    className="text-zinc-400 hover:text-rose-600 cursor-pointer"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* DESKTOP VIEW: INTERACTIVE TREE DIAGRAM (>= md) */}
            <div className="hidden md:block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 overflow-x-auto shadow-none">
              <div className="min-w-[850px] flex flex-col items-center py-6">
                
                {/* TOP LEVEL: KETUA */}
                <div className="flex flex-col items-center">
                  {ketua ? (
                    <div className="p-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-md transition-transform hover:-translate-y-0.5 duration-200">
                      <div className="bg-white dark:bg-zinc-900 px-6 py-4 rounded-[10px] text-center w-64 space-y-2 flex flex-col items-center">
                        {/* Photo avatar */}
                        <div className="relative">
                          {getMemberAvatar(ketua) ? (
                            <img
                              src={getMemberAvatar(ketua)}
                              alt={ketua.name}
                              className="w-14 h-14 rounded-full object-cover border-2 border-amber-500 shadow-sm"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-sm flex items-center justify-center border-2 border-amber-500/30 shadow-xs">
                              {getInitials(ketua.name)}
                            </div>
                          )}
                        </div>

                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-semibold uppercase py-0.5 px-2 mx-auto w-fit">
                          {ketua.position}
                        </Badge>
                        <div className="w-full">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{ketua.name}</h4>
                          <p className="text-[10px] text-zinc-400">{ketua.period} • BPH</p>
                        </div>
                        
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 w-full flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleOpenEditModal(ketua)}
                            className="text-[10px] font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400 cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <span className="text-zinc-300 dark:text-zinc-700 text-[10px]">•</span>
                          <button
                            onClick={() => setMemberToDelete(ketua)}
                            className="text-[10px] font-medium text-rose-500 hover:text-rose-600 dark:text-rose-400 cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenAddModal("BPH", "Ketua Komisariat")}
                      className="group bg-zinc-50 hover:bg-amber-50/50 dark:bg-zinc-950 dark:hover:bg-amber-950/20 border border-dashed border-zinc-300 hover:border-amber-400 dark:border-zinc-800 dark:hover:border-amber-700 rounded-xl px-6 py-5 text-center w-64 transition-all cursor-pointer flex flex-col items-center gap-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 block">
                          + Tetapkan Ketua
                        </span>
                        <span className="text-[10px] text-zinc-400">Pilih dari database anggota</span>
                      </div>
                    </button>
                  )}
                  
                  {/* Connector Line down from Ketua */}
                  <div className="w-0.5 h-8 bg-zinc-200 dark:bg-zinc-800" />
                </div>

                {/* LEVEL 2: SEKRETARIS & BENDAHARA */}
                <div className="relative w-full max-w-2xl flex items-center justify-between before:absolute before:top-0 before:left-1/4 before:right-1/4 before:h-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                  {/* Vertical lines connecting from horizontal line */}
                  <div className="absolute top-0 left-1/4 w-0.5 h-6 bg-zinc-200 dark:bg-zinc-800" />
                  <div className="absolute top-0 right-1/4 w-0.5 h-6 bg-zinc-200 dark:bg-zinc-800" />

                  {/* Sekretaris Card (Left) */}
                  <div className="flex flex-col items-center w-1/2 pt-6">
                    {sekretaris ? (
                      <div className="p-0.5 bg-blue-500/30 rounded-xl shadow-xs transition-transform hover:-translate-y-0.5 duration-200">
                        <div className="bg-white dark:bg-zinc-900 px-5 py-3.5 rounded-[10px] text-center w-56 space-y-1.5 flex flex-col items-center">
                          {/* Photo avatar */}
                          {getMemberAvatar(sekretaris) ? (
                            <img
                              src={getMemberAvatar(sekretaris)}
                              alt={sekretaris.name}
                              className="w-11 h-11 rounded-full object-cover border-2 border-blue-500/40 shadow-xs"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center border-2 border-blue-500/20 shadow-xs">
                              {getInitials(sekretaris.name)}
                            </div>
                          )}

                          <Badge className="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60 text-[9px] font-semibold uppercase py-0.5 px-2 mx-auto w-fit">
                            Sekretaris
                          </Badge>
                          <div className="w-full">
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{sekretaris.name}</h4>
                            <p className="text-[10px] text-zinc-400">{sekretaris.period}</p>
                          </div>
                          
                          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 w-full flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleOpenEditModal(sekretaris)}
                              className="text-[10px] font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 cursor-pointer flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <span className="text-zinc-300 dark:text-zinc-700 text-[10px]">•</span>
                            <button
                              onClick={() => setMemberToDelete(sekretaris)}
                              className="text-[10px] font-medium text-rose-500 hover:text-rose-600 dark:text-rose-400 cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenAddModal("BPH", "Sekretaris")}
                        className="group bg-zinc-50 hover:bg-blue-50/50 dark:bg-zinc-950 dark:hover:bg-blue-950/20 border border-dashed border-zinc-300 hover:border-blue-400 dark:border-zinc-800 dark:hover:border-blue-700 rounded-xl px-5 py-4 text-center w-56 transition-all cursor-pointer flex flex-col items-center gap-1.5"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <UserPlus className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          + Tetapkan Sekretaris
                        </span>
                        <span className="text-[10px] text-zinc-400">Pilih dari database</span>
                      </button>
                    )}
                  </div>

                  {/* Bendahara Card (Right) */}
                  <div className="flex flex-col items-center w-1/2 pt-6">
                    {bendahara ? (
                      <div className="p-0.5 bg-emerald-500/30 rounded-xl shadow-xs transition-transform hover:-translate-y-0.5 duration-200">
                        <div className="bg-white dark:bg-zinc-900 px-5 py-3.5 rounded-[10px] text-center w-56 space-y-1.5 flex flex-col items-center">
                          {/* Photo avatar */}
                          {getMemberAvatar(bendahara) ? (
                            <img
                              src={getMemberAvatar(bendahara)}
                              alt={bendahara.name}
                              className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500/40 shadow-xs"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center border-2 border-emerald-500/20 shadow-xs">
                              {getInitials(bendahara.name)}
                            </div>
                          )}

                          <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60 text-[9px] font-semibold uppercase py-0.5 px-2 mx-auto w-fit">
                            Bendahara
                          </Badge>
                          <div className="w-full">
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{bendahara.name}</h4>
                            <p className="text-[10px] text-zinc-400">{bendahara.period}</p>
                          </div>
                          
                          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 w-full flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleOpenEditModal(bendahara)}
                              className="text-[10px] font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 cursor-pointer flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <span className="text-zinc-300 dark:text-zinc-700 text-[10px]">•</span>
                            <button
                              onClick={() => setMemberToDelete(bendahara)}
                              className="text-[10px] font-medium text-rose-500 hover:text-rose-600 dark:text-rose-400 cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenAddModal("BPH", "Bendahara")}
                        className="group bg-zinc-50 hover:bg-emerald-50/50 dark:bg-zinc-950 dark:hover:bg-emerald-950/20 border border-dashed border-zinc-300 hover:border-emerald-400 dark:border-zinc-800 dark:hover:border-emerald-700 rounded-xl px-5 py-4 text-center w-56 transition-all cursor-pointer flex flex-col items-center gap-1.5"
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <UserPlus className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          + Tetapkan Bendahara
                        </span>
                        <span className="text-[10px] text-zinc-400">Pilih dari database</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Main vertical connector to divisions line */}
                <div className="w-0.5 h-10 bg-zinc-200 dark:bg-zinc-800 mt-6" />

                {/* LEVEL 3: DEPARTMENTS / BIDANG */}
                <div className="relative w-full border-t border-zinc-200 dark:border-zinc-800 pt-6">
                  {/* Horizontal line across divisions */}
                  <div className="absolute top-0 left-[10%] right-[10%] h-0.5 bg-zinc-200 dark:bg-zinc-800" />

                  <div className="flex flex-wrap justify-center gap-5 w-full px-2">
                    {divisions.map((dept) => {
                      const divisionMembers = boardMembers.filter((m) => m.department === dept);
                      const headOfDiv = divisionMembers.find((m) => m.position.toLowerCase().includes("kepala") || m.position.toLowerCase().includes("kabid"));
                      const staffOfDiv = divisionMembers.filter((m) => m.id !== headOfDiv?.id);

                      return (
                        <div key={dept} className="w-60 min-w-[240px] max-w-[280px] flex flex-col items-center relative">
                          {/* Connecting Line down into each division head */}
                          <div className="absolute -top-6 w-0.5 h-6 bg-zinc-200 dark:bg-zinc-800" />

                          {/* Division Card Container */}
                          <div className="text-center space-y-3 w-full">
                            <div className="p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1 min-w-0 flex-1">
                                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 block uppercase tracking-wider truncate" title={`Bidang ${dept}`}>
                                  Bidang {dept}
                                </span>
                                <div className="flex items-center shrink-0">
                                  <button
                                    onClick={() => handleOpenEditDeptModal(dept)}
                                    className="w-5 h-5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                                    title="Ubah nama bidang"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeptToDelete(dept)}
                                    className="w-5 h-5 rounded hover:bg-rose-100 dark:hover:bg-rose-950/50 flex items-center justify-center text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                                    title="Hapus bidang"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                              <button
                                onClick={() => handleOpenAddModal(dept, "Anggota Bidang")}
                                className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5 cursor-pointer shrink-0 pl-1 border-l border-zinc-200 dark:border-zinc-800"
                                title={`Tambah ke bidang ${dept}`}
                              >
                                <Plus className="w-3 h-3" /> Tambah
                              </button>
                            </div>

                            {/* Kabid Card */}
                            <div>
                              {headOfDiv ? (
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg text-center space-y-1.5 shadow-none transition-colors hover:border-blue-500/40 flex flex-col items-center">
                                  {getMemberAvatar(headOfDiv) ? (
                                    <img
                                      src={getMemberAvatar(headOfDiv)}
                                      alt={headOfDiv.name}
                                      className="w-10 h-10 rounded-full object-cover border border-zinc-300 dark:border-zinc-700 shadow-2xs"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center justify-center border border-blue-500/20">
                                      {getInitials(headOfDiv.name)}
                                    </div>
                                  )}

                                  <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[8.5px] font-semibold uppercase py-0.5 px-2 mx-auto w-fit block truncate">
                                    Kabid
                                  </Badge>
                                  <div className="w-full">
                                    <h5 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                      {headOfDiv.name}
                                    </h5>
                                  </div>
                                  <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800 w-full flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleOpenEditModal(headOfDiv)}
                                      className="text-[9px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-0.5"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" /> Edit
                                    </button>
                                    <span className="text-zinc-300 dark:text-zinc-700 text-[8px]">•</span>
                                    <button
                                      onClick={() => setMemberToDelete(headOfDiv)}
                                      className="text-[9px] font-medium text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-0.5"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" /> Hapus
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleOpenAddModal(dept, "Kepala Bidang")}
                                  className="w-full bg-zinc-50 hover:bg-blue-50/50 dark:bg-zinc-950 dark:hover:bg-blue-950/20 border border-dashed border-zinc-300 hover:border-blue-400 dark:border-zinc-800 dark:hover:border-blue-700 rounded-lg p-3 text-center text-xs font-semibold text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ Tetapkan Kabid</span>
                                </button>
                              )}
                            </div>

                            {/* Staff Members List */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block text-left">
                                  Anggota ({staffOfDiv.length})
                                </span>
                                <button
                                  onClick={() => handleOpenAddModal(dept, "Anggota Bidang")}
                                  className="text-[9px] font-medium text-blue-600 hover:underline cursor-pointer"
                                >
                                  + Tambah
                                </button>
                              </div>
                              {staffOfDiv.length > 0 ? (
                                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                                  {staffOfDiv.map((staff) => {
                                    const staffAvatar = getMemberAvatar(staff);
                                    return (
                                      <div
                                        key={staff.id}
                                        className="bg-zinc-50/70 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/60 p-2 rounded-md flex items-center justify-between text-left group/staff gap-2"
                                      >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          {staffAvatar ? (
                                            <img
                                              src={staffAvatar}
                                              alt={staff.name}
                                              className="w-6 h-6 rounded-full object-cover border border-zinc-300 dark:border-zinc-700 shrink-0"
                                            />
                                          ) : (
                                            <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[9px] font-bold flex items-center justify-center shrink-0">
                                              {getInitials(staff.name)[0]}
                                            </div>
                                          )}
                                          <div className="min-w-0 flex-1">
                                            <h6 className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate">
                                              {staff.name.replace(/Sahabat|Sahabati/g, "").trim()}
                                            </h6>
                                            <p className="text-[9px] text-zinc-400 truncate uppercase">
                                              {staff.position}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover/staff:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => handleOpenEditModal(staff)}
                                            className="w-5 h-5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                                            title="Edit data"
                                          >
                                            <Edit2 className="w-2.5 h-2.5" />
                                          </button>
                                          <button
                                            onClick={() => setMemberToDelete(staff)}
                                            className="w-5 h-5 rounded hover:bg-rose-100 dark:hover:bg-rose-950/50 flex items-center justify-center text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                                            title="Hapus fungsionaris"
                                          >
                                            <Trash2 className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleOpenAddModal(dept, "Anggota Bidang")}
                                  className="w-full bg-zinc-50/50 hover:bg-blue-50/50 dark:bg-zinc-950/30 dark:hover:bg-blue-950/20 border border-dashed border-zinc-200 hover:border-blue-300 dark:border-zinc-800 dark:hover:border-blue-800 rounded-lg p-2.5 text-center text-[10px] text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Tambah Anggota Bidang</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add New Division Card */}
                    <div className="w-60 min-w-[240px] max-w-[280px] flex flex-col items-center relative pt-0">
                      <div className="absolute -top-6 w-0.5 h-6 bg-zinc-200 dark:bg-zinc-800" />
                      <button
                        onClick={handleOpenAddDeptModal}
                        className="group w-full min-h-[220px] bg-zinc-50/50 hover:bg-blue-50/50 dark:bg-zinc-950/40 dark:hover:bg-blue-950/20 border-2 border-dashed border-zinc-200 hover:border-blue-400 dark:border-zinc-800 dark:hover:border-blue-700 rounded-xl p-5 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plus className="w-4 h-4" />
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 block">
                            + Tambah Bidang
                          </span>
                          <span className="text-[10px] text-zinc-400 mt-0.5 block">
                            Buat divisi kepengurusan baru
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>

      {/* 5. ADD / EDIT UNIFIED MODAL */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-lg w-full p-0 overflow-hidden">
          <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                {editingMember ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {editingMember ? "Edit Data Pengurus" : "Tambah Pengurus Baru"}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {editingMember
                    ? "Perbarui informasi fungsionaris kepengurusan terpilih."
                    : "Formulir pendaftaran fungsionaris baru komisariat."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveMember}>
            <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Nama Pengurus (Select option dari Database Anggota) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Nama Lengkap Pengurus <span className="text-rose-500">*</span></span>
                  {cadres.length > 0 && (
                    <span className="text-[10px] text-zinc-400 font-normal">
                      {cadres.length} anggota terdaftar
                    </span>
                  )}
                </label>

                {cadres.length > 0 ? (
                  <select
                    required
                    value={formName}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      setFormName(selectedName);
                      const found = cadres.find((c) => c.name === selectedName);
                      setSelectedCadreData(found || null);
                    }}
                    className="w-full h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">-- Pilih Anggota dari Database --</option>
                    {formName && !cadres.some((c) => c.name === formName) && (
                      <option value={formName}>{formName} (Pengurus Saat Ini)</option>
                    )}
                    {cadres.map((cadre) => (
                      <option key={cadre.id} value={cadre.name}>
                        {cadre.name} {cadre.commissariat ? `— ${cadre.commissariat}` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Muhammad Ali Ridho"
                    className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                  />
                )}

                {selectedCadreData && (
                  <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-3">
                    {selectedCadreData.avatar ? (
                      <img
                        src={selectedCadreData.avatar}
                        alt={selectedCadreData.name}
                        className="w-9 h-9 rounded-full object-cover border border-blue-300 dark:border-blue-700 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(selectedCadreData.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {selectedCadreData.name}
                        </span>
                        {selectedCadreData.level && (
                          <Badge variant="outline" className="text-[9px] h-5 px-1.5 font-semibold">
                            {selectedCadreData.level}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate">
                        Komisariat: {selectedCadreData.commissariat || activeCampus}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Departemen & Jabatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Departemen / Divisi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formDept}
                    onChange={(e) => {
                      const newDept = e.target.value as any;
                      setFormDept(newDept);
                      if (newDept === "BPH") {
                        setFormPosition("Ketua Komisariat");
                      } else {
                        setFormPosition("Kepala Bidang");
                      }
                    }}
                    className="w-full h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    {allDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Jabatan / Posisi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    className="w-full h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    {formDept === "BPH" ? (
                      <>
                        <option value="Ketua Komisariat">Ketua Komisariat</option>
                        <option value="Wakil Ketua">Wakil Ketua</option>
                        <option value="Sekretaris">Sekretaris</option>
                        <option value="Wakil Sekretaris">Wakil Sekretaris</option>
                        <option value="Bendahara">Bendahara</option>
                        <option value="Wakil Bendahara">Wakil Bendahara</option>
                        <option value="Pengurus BPH">Pengurus BPH</option>
                      </>
                    ) : (
                      <>
                        <option value="Kepala Bidang">Kepala Bidang (Kabid)</option>
                        <option value="Sekretaris Bidang">Sekretaris Bidang</option>
                        <option value="Bendahara Bidang">Bendahara Bidang</option>
                        <option value="Anggota Bidang">Anggota Bidang</option>
                      </>
                    )}
                    {formPosition &&
                      ![
                        "Ketua Komisariat",
                        "Wakil Ketua",
                        "Sekretaris",
                        "Wakil Sekretaris",
                        "Bendahara",
                        "Wakil Bendahara",
                        "Pengurus BPH",
                        "Kepala Bidang",
                        "Sekretaris Bidang",
                        "Bendahara Bidang",
                        "Anggota Bidang"
                      ].includes(formPosition) && (
                        <option value={formPosition}>{formPosition}</option>
                      )}
                  </select>
                </div>
              </div>

              {/* Periode Kepengurusan */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Periode Kepengurusan</span>
                </label>
                <Input
                  type="text"
                  disabled
                  value={formPeriod}
                  className="h-9 text-xs bg-zinc-100 dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 cursor-not-allowed font-medium select-none"
                />
              </div>
            </div>

            <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormModalOpen(false)}
                className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
              >
                {editingMember ? "Simpan Perubahan" : "Tambahkan Pengurus"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!memberToDelete} onOpenChange={(open) => { if (!open) setMemberToDelete(null); }}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-sm w-full p-6">
          <DialogHeader className="flex flex-col items-center justify-center text-center space-y-2 pb-2">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Hapus Data Pengurus?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
              Apakah Anda yakin ingin menghapus data pengurus <span className="font-semibold text-zinc-800 dark:text-zinc-200">&quot;{memberToDelete?.name}&quot;</span> ({memberToDelete?.position})? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMemberToDelete(null)}
              className="w-full sm:w-1/2 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg h-8.5 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              className="w-full sm:w-1/2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg h-8.5 cursor-pointer"
            >
              Hapus Pengurus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. ADD / EDIT BIDANG / DIVISI MODAL */}
      <Dialog open={isDeptModalOpen} onOpenChange={setIsDeptModalOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-sm w-full p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <GitFork className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {editingDept ? "Ubah Nama Bidang" : "Tambah Bidang Baru"}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {editingDept
                    ? "Perbarui nama divisi atau bidang kepengurusan."
                    : "Tambahkan divisi pelaksana baru ke dalam struktur kepengurusan."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveDept}>
            <div className="p-5 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Nama Bidang / Divisi <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  autoFocus
                  value={deptInputName}
                  onChange={(e) => setDeptInputName(e.target.value)}
                  placeholder="Contoh: Media & Publikasi, Kajian Strategis..."
                  className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeptModalOpen(false)}
                className="h-8.5 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="h-8.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
              >
                {editingDept ? "Simpan Perubahan" : "Tambahkan Bidang"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 8. DELETE BIDANG CONFIRMATION DIALOG */}
      <Dialog open={!!deptToDelete} onOpenChange={(open) => { if (!open) setDeptToDelete(null); }}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-sm w-full p-6">
          <DialogHeader className="flex flex-col items-center justify-center text-center space-y-2 pb-2">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Hapus Bidang {deptToDelete}?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed text-center">
              Apakah Anda yakin ingin menghapus <span className="font-semibold text-zinc-800 dark:text-zinc-200">&quot;Bidang {deptToDelete}&quot;</span> dari struktur organisasi? Seluruh fungsionaris pada bidang ini juga akan dihapus.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeptToDelete(null)}
              className="text-xs border-zinc-200 dark:border-zinc-800 h-8.5 rounded-lg cursor-pointer flex-1"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDeleteDept}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8.5 rounded-lg border-none cursor-pointer flex-1"
            >
              Ya, Hapus Bidang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
