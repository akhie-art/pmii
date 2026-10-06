"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  UserPlus,
  LayoutGrid,
  GitFork,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeedbackModal } from "@/components/ui/feedback-modal";

import {
  type BoardMember,
  DEFAULT_DIVISIONS,
  getSystemPeriod
} from "./_components/types";
import { PengurusFilters } from "./_components/PengurusFilters";
import { PengurusGrid } from "./_components/PengurusGrid";
import { PengurusStructureTree } from "./_components/PengurusStructureTree";
import { PengurusFormModal } from "./_components/PengurusFormModal";
import { PengurusDeleteModal } from "./_components/PengurusDeleteModal";
import { DepartmentModal } from "./_components/DepartmentModal";

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

  // Feedback Modal
  const { showToast, FeedbackModalComponent } = useFeedbackModal();

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
              allDepartments={allDepartments}
            />

            <PengurusGrid
              filteredMembers={filteredMembers}
              getMemberAvatar={getMemberAvatar}
              onEdit={handleOpenEditModal}
              onDelete={(m) => setMemberToDelete(m)}
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
            onDeleteMember={(m) => setMemberToDelete(m)}
            onOpenAddDeptModal={handleOpenAddDeptModal}
            onOpenEditDeptModal={handleOpenEditDeptModal}
            onDeleteDept={(dept) => setDeptToDelete(dept)}
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
        cadres={cadres}
        selectedCadreData={selectedCadreData}
        setSelectedCadreData={setSelectedCadreData}
        allDepartments={allDepartments}
        activeCampus={activeCampus}
        onSubmit={handleSaveMember}
      />

      {/* MODAL: DELETE PENGURUS */}
      <PengurusDeleteModal
        memberToDelete={memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={confirmDelete}
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
      />

      {FeedbackModalComponent}
    </div>
  );
}
