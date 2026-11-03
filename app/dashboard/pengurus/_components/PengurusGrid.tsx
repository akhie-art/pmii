"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Building2,
  Landmark,
  Plus,
  GitFork,
  Calendar,
  Edit2,
  Trash2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { type BoardMember, getInitials } from "./types";
import { getTenantNameById } from "@/lib/tenancy";
import { PengurusStructureTree, parseProgramKerja } from "./PengurusStructureTree";

interface PengurusGridProps {
  filteredMembers: BoardMember[];
  getMemberAvatar: (member?: BoardMember | null) => string;
  getMemberGender?: (member: BoardMember) => "Sahabat" | "Sahabati";
  onEdit: (member: BoardMember) => void;
  onDelete: (member: BoardMember) => void;
  canDelete?: boolean;
  onAddInTenant?: (tenantName: string) => void;
  divisions: string[];
  biros?: Record<string, string[]>;
  onOpenAddModal: (
    defaultDept?: string,
    defaultPosition?: string,
    defaultTenant?: string,
    defaultBiro?: string
  ) => void;
  onOpenAddDeptModal: () => void;
  onOpenEditDeptModal: (dept: string) => void;
  onDeleteDept: (dept: string) => void;
  onOpenAddBiroModal?: (dept: string) => void;
  onOpenEditBiroModal?: (dept: string, biroName: string) => void;
  onDeleteBiro?: (dept: string, biroName: string) => void;
  isCabang?: boolean;
}

export const PengurusGrid: React.FC<PengurusGridProps> = ({
  filteredMembers,
  getMemberAvatar,
  getMemberGender,
  onEdit,
  onDelete,
  canDelete = true,
  onAddInTenant,
  divisions,
  biros = {},
  onOpenAddModal,
  onOpenAddDeptModal,
  onOpenEditDeptModal,
  onDeleteDept,
  onOpenAddBiroModal,
  onOpenEditBiroModal,
  onDeleteBiro,
  isCabang = false
}) => {
  // Modal state for viewing the structure of a selected tenant
  const [selectedTenantForModal, setSelectedTenantForModal] = useState<string | null>(null);

  // Helper to resolve tenant name cleanly
  const getTenantName = (member: BoardMember): string => {
    if (member.commissariat && member.commissariat.trim()) {
      return member.commissariat.trim();
    }
    if (member.tenant_id) {
      const name = getTenantNameById(member.tenant_id);
      if (name) return name;
    }
    if (member.komisariat_id) {
      const name = getTenantNameById(member.komisariat_id);
      if (name) return name;
    }
    return "Pengurus Cabang Grobogan";
  };

  // Group members into exactly 1 record per tenant
  const tenantGroups = useMemo(() => {
    const map = new Map<string, BoardMember[]>();
    for (const member of filteredMembers) {
      const tName = getTenantName(member);
      if (!map.has(tName)) {
        map.set(tName, []);
      }
      map.get(tName)!.push(member);
    }

    // Sort: Cabang first, then alphabetical
    const sortedEntries = Array.from(map.entries()).sort(([a], [b]) => {
      const isCabangA = a.toLowerCase().includes("cabang");
      const isCabangB = b.toLowerCase().includes("cabang");
      if (isCabangA && !isCabangB) return -1;
      if (!isCabangA && isCabangB) return 1;
      return a.localeCompare(b);
    });

    return sortedEntries.map(([tenantName, members]) => {
      const isCabang = tenantName.toLowerCase().includes("cabang");

      // Extract leadership
      const bph = members.filter((m) => m.department === "BPH");
      const ketua =
        bph.find(
          (m) =>
            (m.position.toLowerCase().includes("ketua") || m.position.toLowerCase().includes("ketum")) &&
            !m.position.toLowerCase().includes("wakil")
        ) ||
        members.find(
          (m) =>
            (m.position.toLowerCase().includes("ketua") || m.position.toLowerCase().includes("ketum")) &&
            !m.position.toLowerCase().includes("wakil")
        );

      const sekretarisList = bph.filter((m) =>
        m.position.toLowerCase().includes("sekretaris")
      );
      sekretarisList.sort((a, b) => {
        const isWakilA = a.position.toLowerCase().includes("wakil");
        const isWakilB = b.position.toLowerCase().includes("wakil");
        if (!isWakilA && isWakilB) return -1;
        if (isWakilA && !isWakilB) return 1;
        return a.position.localeCompare(b.position);
      });

      const bendaharaList = bph.filter((m) =>
        m.position.toLowerCase().includes("bendahara")
      );
      bendaharaList.sort((a, b) => {
        const isWakilA = a.position.toLowerCase().includes("wakil");
        const isWakilB = b.position.toLowerCase().includes("wakil");
        if (!isWakilA && isWakilB) return -1;
        if (isWakilA && !isWakilB) return 1;
        return a.position.localeCompare(b.position);
      });

      const period = members[0]?.period || "2026 - 2027";
      const bphCount = bph.length;
      const bidangCount = members.filter((m) => m.department !== "BPH").length;

      return {
        tenantName,
        isCabang,
        members,
        ketua,
        sekretarisList,
        bendaharaList,
        period,
        bphCount,
        bidangCount
      };
    });
  }, [filteredMembers]);

  // Members of the tenant currently opened in modal
  const modalGroup = useMemo(() => {
    if (!selectedTenantForModal) return null;
    return tenantGroups.find((g) => g.tenantName === selectedTenantForModal) || null;
  }, [selectedTenantForModal, tenantGroups]);

  if (tenantGroups.length === 0 || filteredMembers.length === 0) {
    return (
      <Card className="p-10 text-center bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2.5">
        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
          <Users className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
          Tidak ada data kepengurusan ditemukan
        </h4>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs">
          Coba sesuaikan kata pencarian atau filter divisi pada bagian atas.
        </p>
      </Card>
    );
  }

  // JIKA ROLE BUKAN CABANG (Ketua Komisariat / Pengurus Komisariat):
  // Tampilkan Langsung Pisah per Pengurus
  if (!isCabang) {
    return (
      <div className="space-y-4">
        {/* Quick Header Bar */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Daftar Fungsionaris ({filteredMembers.length} Orang)
            </span>
          </div>
        </div>

        {/* Individual Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
          {filteredMembers.map((member) => {
            const avatarUrl = getMemberAvatar(member);
            const prokers = parseProgramKerja(member.program_kerja || member.programKerja);
            const isBph = member.department === "BPH";

            return (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <Card className="h-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 hover:border-blue-500/40 dark:hover:border-blue-500/40 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 group">
                  <div className="space-y-3">
                    {/* Member Profile Header */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                              (getMemberGender ? getMemberGender(member) : member.gender) === "Sahabati" ? "bg-purple-600" : "bg-blue-600"
                            }`}
                          >
                            {getInitials(member.name)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {member.name}
                          </h4>
                          <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 truncate mt-0.5">
                            {member.position}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          member.status === "AKTIF"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/50"
                            : "bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        {member.status === "AKTIF" ? "Aktif" : "Demisioner"}
                      </Badge>
                    </div>

                    {/* Division Badge & Period */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-zinc-400 text-[10px]">Divisi / Bidang:</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                          isBph
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/40"
                            : "bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        {member.department === "BPH" ? "BPH" : `Bidang ${member.department}`}
                      </Badge>
                    </div>

                    {/* Program Kerja (if any) */}
                    {prokers.length > 0 && (
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1">
                        <span className="text-[9.5px] font-semibold text-zinc-400 block uppercase tracking-wider">
                          Program Kerja ({prokers.length})
                        </span>
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-0.5">
                          {prokers.map((p, idx) => (
                            <div
                              key={idx}
                              className="text-[10px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950/60 px-2 py-1 rounded-lg border border-zinc-100 dark:border-zinc-800/80 truncate flex items-center gap-1.5"
                              title={p}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                              <span className="truncate">{p}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(member)}
                      className="h-7.5 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg cursor-pointer flex items-center gap-1 font-medium transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(member)}
                        className="h-7.5 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer flex items-center gap-1 font-medium transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 1 CARD PER TENANT GRID (KHUSUS ROLE SUPERADMIN, KETUA CABANG, & PENGURUS CABANG) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {tenantGroups.map((group) => {
          const {
            tenantName,
            isCabang,
            members,
            ketua,
            sekretarisList,
            bendaharaList,
            period,
            bphCount,
            bidangCount
          } = group;

          const ketuaAvatar = ketua ? getMemberAvatar(ketua) : "";

          return (
            <motion.div
              key={tenantName}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Card className="h-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 hover:border-blue-500/40 dark:hover:border-blue-500/40 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-4 group">
                {/* 1. Card Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                          isCabang
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25"
                        }`}
                      >
                        {isCabang ? (
                          <Landmark className="w-4.5 h-4.5" />
                        ) : (
                          <Building2 className="w-4.5 h-4.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {tenantName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10.5px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          <span>Masa Khidmat {period}</span>
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        isCabang
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/50"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-900/50"
                      }`}
                    >
                      {isCabang ? "Cabang" : "Komisariat"}
                    </Badge>
                  </div>

                  {/* 2. Ketua / Pimpinan Utama */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 space-y-2">
                    <div className="flex items-center gap-2.5">
                      {ketuaAvatar ? (
                        <img
                          src={ketuaAvatar}
                          alt={ketua?.name || "Ketua"}
                          className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {ketua ? getInitials(ketua.name) : "KT"}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {ketua ? ketua.name : "Ketua belum ditetapkan"}
                        </h4>
                        <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 truncate">
                          {ketua ? ketua.position : (isCabang ? "Ketua Cabang" : "Ketua Komisariat")}
                        </p>
                      </div>
                    </div>

                    {/* Sekretaris & Bendahara Quick Labels */}
                    {(sekretarisList.length > 0 || bendaharaList.length > 0) && (
                      <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 grid grid-cols-2 gap-2 text-[10.5px]">
                        <div className="truncate">
                          <span className="text-zinc-400 block text-[9.5px]">
                            Sekretaris {sekretarisList.length > 1 ? `(${sekretarisList.length})` : ""}:
                          </span>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate block" title={sekretarisList.map((s) => `${s.name} (${s.position})`).join(", ")}>
                            {sekretarisList.map((s) => s.name).join(", ") || "-"}
                          </span>
                        </div>
                        <div className="truncate">
                          <span className="text-zinc-400 block text-[9.5px]">
                            Bendahara {bendaharaList.length > 1 ? `(${bendaharaList.length})` : ""}:
                          </span>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate block" title={bendaharaList.map((b) => `${b.name} (${b.position})`).join(", ")}>
                            {bendaharaList.map((b) => b.name).join(", ") || "-"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Stats & Fungsionaris Avatar Stack */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-[11px]">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {members.length} Pengurus
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span>{bphCount} BPH</span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span>{bidangCount} Bidang</span>
                    </div>

                    {/* Avatar Overlap Stack */}
                    <div className="flex -space-x-1.5 overflow-hidden items-center shrink-0">
                      {members.slice(0, 4).map((m, idx) => {
                        const av = getMemberAvatar(m);
                        return av ? (
                          <img
                            key={m.id || idx}
                            src={av}
                            alt={m.name}
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover"
                          />
                        ) : (
                          <div
                            key={m.id || idx}
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white dark:ring-zinc-900 text-[9px] font-bold text-white ${
                              (getMemberGender ? getMemberGender(m) : m.gender) === "Sahabati" ? "bg-purple-600" : "bg-blue-600"
                            }`}
                          >
                            {getInitials(m.name)}
                          </div>
                        );
                      })}
                      {members.length > 4 && (
                        <div className="inline-flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white dark:ring-zinc-900 bg-zinc-100 dark:bg-zinc-800 text-[9px] font-semibold text-zinc-600 dark:text-zinc-300">
                          +{members.length - 4}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      onClick={() => setSelectedTenantForModal(tenantName)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 px-3.5 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors border-none"
                    >
                      <GitFork className="w-3.5 h-3.5" />
                      <span>Detail Struktur</span>
                    </Button>

                    {onAddInTenant && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAddInTenant(tenantName)}
                        className="h-9 px-3 text-xs border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl cursor-pointer flex items-center gap-1 shrink-0"
                        title="Tambah Pengurus di Tenant Ini"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Tambah</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* DETAIL STRUKTUR ORGANISASI MODAL */}
      <Dialog
        open={!!selectedTenantForModal}
        onOpenChange={(open) => !open && setSelectedTenantForModal(null)}
      >
        <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
          {modalGroup && (
            <div>
              {/* Modal Sticky Header */}
              <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={
                          modalGroup.isCabang
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 text-[10px]"
                            : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 text-[10px]"
                        }
                      >
                        {modalGroup.isCabang ? "Tingkat Cabang" : "Tingkat Komisariat"}
                      </Badge>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span className="text-xs text-zinc-500 font-medium">
                        {modalGroup.members.length} Fungsionaris Terdaftar
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span className="text-xs text-zinc-500 font-medium">
                        Masa Khidmat {modalGroup.period}
                      </span>
                    </div>

                    <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <GitFork className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span>Struktur Organisasi {modalGroup.tenantName}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                      Bagan hierarki fungsionaris, pimpinan harian (BPH), dan bidang-bidang pelaksana organisasi.
                    </DialogDescription>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {onAddInTenant && (
                      <Button
                        size="sm"
                        onClick={() => onAddInTenant(modalGroup.tenantName)}
                        className="h-8.5 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer flex items-center gap-1.5 font-medium shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Pengurus</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Body: Interactive Structure Tree */}
              <div className="p-4 sm:p-6 bg-zinc-50/40 dark:bg-zinc-950/30">
                <PengurusStructureTree
                  boardMembers={modalGroup.members}
                  divisions={divisions}
                  biros={biros}
                  getMemberAvatar={getMemberAvatar}
                  onOpenAddModal={(dDept, dPos, dBiro) =>
                    onOpenAddModal(dDept, dPos, modalGroup.tenantName, dBiro)
                  }
                  onOpenEditModal={onEdit}
                  onDeleteMember={onDelete}
                  onOpenAddDeptModal={onOpenAddDeptModal}
                  onOpenEditDeptModal={onOpenEditDeptModal}
                  onDeleteDept={onDeleteDept}
                  onOpenAddBiroModal={onOpenAddBiroModal}
                  onOpenEditBiroModal={onOpenEditBiroModal}
                  onDeleteBiro={onDeleteBiro}
                  isCabangLevel={modalGroup.isCabang}
                  canDelete={canDelete}
                  tenantTitle={modalGroup.tenantName}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
