"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  UserPlus, 
  Filter, 
  ShieldCheck, 
  Mail, 
  Trash2, 
  X, 
  Check, 
  User, 
  Plus, 
  Key,
  Building,
  Activity,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table";
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
import { db } from "@/lib/db";
import type { UserAccount, UserRole } from "@/lib/db";

const AVAILABLE_MENUS = [
  { group: "Utama", name: "Dashboard", href: "/dashboard", defaultRoles: ["admin", "pengurus", "ADMIN", "PENGURUS", "KOMISARIAT"] },
  { group: "Keanggotaan & Struktur", name: "Database Anggota", href: "/dashboard/anggota", defaultRoles: ["admin", "pengurus", "ADMIN", "PENGURUS", "KOMISARIAT"] },
  { group: "Keanggotaan & Struktur", name: "Data Pengurus", href: "/dashboard/pengurus", defaultRoles: ["admin", "pengurus", "ADMIN", "PENGURUS"] },
  { group: "Kaderisasi & Pembinaan", name: "Sistem Kaderisasi", href: "/dashboard/kaderisasi", defaultRoles: ["admin", "pengurus", "ADMIN", "PENGURUS"] },
  { group: "Kaderisasi & Pembinaan", name: "Materi & Kurikulum", href: "/dashboard/materi", defaultRoles: ["admin", "pengurus", "ADMIN", "PENGURUS"] },
  { group: "Kaderisasi & Pembinaan", name: "Kegiatan & Acara", href: "/dashboard/kegiatan", defaultRoles: ["admin", "pengurus", "ADMIN", "PENGURUS"] },
  { group: "Kaderisasi & Pembinaan", name: "Verifikasi RKTL", href: "/dashboard/verifikasi", defaultRoles: ["admin", "pengurus", "ADMIN", "PENGURUS"] },
  { group: "Kaderisasi & Pembinaan", name: "Follow Up", href: "/dashboard/follow-up", defaultRoles: ["admin", "pengurus", "ADMIN", "PENGURUS"] },
  { group: "Administrasi & Dokumen", name: "Surat Menyurat", href: "/dashboard/surat", defaultRoles: ["admin", "pengurus", "ADMIN", "PENGURUS"] },
  { group: "Administrasi & Dokumen", name: "Arsip Dokumen", href: "/dashboard/arsip", defaultRoles: ["admin", "pengurus", "ADMIN", "PENGURUS"] },
  { group: "Konfigurasi & Pengaturan", name: "Manajemen Pengguna", href: "/dashboard/pengguna", defaultRoles: ["admin", "ADMIN"] },
  { group: "Konfigurasi & Pengaturan", name: "Pengaturan Sistem", href: "/dashboard/pengaturan", defaultRoles: ["admin", "ADMIN"] },
];

export default function UserManagementPage() {
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [commissariats, setCommissariats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // Delete Confirmation Dialog state
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Form States
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("pengurus");
  const [formComm, setFormComm] = useState("");
  const [formStatus, setFormStatus] = useState<"AKTIF" | "NONAKTIF">("AKTIF");
  const [formAllowedMenus, setFormAllowedMenus] = useState<string[]>([]);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string>("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const getInitials = (name: string): string => {
    return (
      name
        .split(" ")
        .filter((w) => w.toLowerCase() !== "sahabat" && w.toLowerCase() !== "sahabati")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "US"
    );
  };

  const isMasterAdmin = (user?: UserAccount | null): boolean => {
    if (!user) return false;
    return (
      user.id === "user-1" ||
      user.id === "user-admin" ||
      user.email?.toLowerCase() === "admin@pmii.org"
    );
  };

  const getAvailableKomisariats = (): string[] => {
    return commissariats.map((c) => c.name);
  };

  useEffect(() => {
    const init = async () => {
      // Check auth level
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
        if (stored) {
          try {
            const user = JSON.parse(stored);
            const r = (user.role || "").toLowerCase();
            if (r === "admin") {
              setAuthorized(true);
            } else {
              setAuthorized(false);
            }
          } catch (e) {
            setAuthorized(false);
          }
        } else {
          setAuthorized(false);
        }
      }

      const [list, commList] = await Promise.all([
        db.getUsers(),
        db.getCommissariats()
      ]);
      setUsers(list);
      setCommissariats(commList);
      setMounted(true);
    };
    init();
  }, []);

  const handleOpenCreate = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("pengurus");
    const initialComms = getAvailableKomisariats();
    setFormComm(initialComms[0] || "");
    setFormStatus("AKTIF");
    const defaultMenus = AVAILABLE_MENUS.filter((m) =>
      m.defaultRoles.map((r) => r.toLowerCase()).includes("pengurus")
    ).map((m) => m.href);
    setFormAllowedMenus(defaultMenus);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword("");
    setFormRole(user.role);
    setFormComm(user.commissariat || getAvailableKomisariats()[0] || "");
    setFormStatus(user.status);
    setFormAllowedMenus(
      Array.isArray(user.allowedMenus)
        ? user.allowedMenus
        : AVAILABLE_MENUS.filter((m) =>
            m.defaultRoles.map((r) => r.toLowerCase()).includes((user.role || "").toLowerCase())
          ).map((m) => m.href)
    );
    setIsEditOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      showToast("Harap lengkapi semua kolom wajib!");
      return;
    }

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      password: formPassword.trim(),
      role: formRole,
      commissariat: formRole.toUpperCase() !== "ADMIN" ? formComm : undefined,
      status: formStatus,
      allowedMenus: formAllowedMenus,
      createdAt: new Date().toISOString().split("T")[0]
    };

    const updatedList = [...users, newUser];
    const success = await db.saveUsers(updatedList);
    if (success) {
      setUsers(updatedList);
      setIsCreateOpen(false);
      showToast(`Akun "${formName.trim()}" berhasil dibuat.`);
    } else {
      showToast("Gagal menyimpan akun ke database.");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!formName.trim() || !formEmail.trim()) {
      showToast("Nama dan Email wajib diisi!");
      return;
    }

    const updatedList = users.map((u) => {
      if (u.id === selectedUser.id) {
        return {
          ...u,
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          password: formPassword.trim() || u.password,
          role: formRole,
          commissariat: formRole.toUpperCase() !== "ADMIN" ? formComm : undefined,
          status: formStatus,
          allowedMenus: formAllowedMenus
        };
      }
      return u;
    });

    const success = await db.saveUsers(updatedList);
    if (success) {
      setUsers(updatedList);
      setIsEditOpen(false);

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
        if (stored) {
          try {
            const curr = JSON.parse(stored);
            const foundUpdated = updatedList.find((u) => u.id === curr.id);
            if (foundUpdated) {
              localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(foundUpdated));
            }
          } catch (e) {
            console.error(e);
          }
        }
      }

      showToast(`Akun "${formName.trim()}" berhasil diperbarui.`);
    } else {
      showToast("Gagal memperbarui akun.");
    }
  };

  const handleOpenDeleteConfirm = (user: UserAccount) => {
    if (isMasterAdmin(user)) {
      showToast("Akun Master Admin Cabang tidak dapat dihapus!");
      return;
    }
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;

    const updatedList = users.filter((u) => u.id !== userToDelete.id);
    const success = await db.saveUsers(updatedList);
    if (success) {
      setUsers(updatedList);
      setIsDeleteConfirmOpen(false);
      showToast(`Akun "${userToDelete.name}" telah berhasil dihapus.`);
      setUserToDelete(null);
    } else {
      showToast("Gagal menghapus akun dari database.");
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.commissariat || "").toLowerCase().includes(searchQuery.toLowerCase());
    const roleNorm = (u.role || "").toLowerCase();
    const filterNorm = roleFilter.toLowerCase();
    const matchRole =
      roleFilter === "ALL" ||
      roleNorm === filterNorm ||
      (filterNorm === "pengurus" && roleNorm === "komisariat");
    const matchStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const activeCount = users.filter((u) => u.status === "AKTIF").length;
  const nonActiveCount = users.filter((u) => u.status !== "AKTIF").length;

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full" />
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/3" />
        <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 h-[60vh] flex flex-col justify-center items-center">
        <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center border border-rose-200 dark:border-rose-900">
          <AlertCircle className="w-7 h-7 text-rose-600 dark:text-rose-400" />
        </div>
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
          Akses Ditolak
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md">
          Halaman Manajemen Pengguna ini memiliki hak akses istimewa dan hanya dapat dikelola oleh administrator tingkat <strong>Cabang (PC PMII)</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-10 font-sans text-zinc-900 dark:text-zinc-100 pb-12">
      {/* TOAST NOTIFICATION (STANDAR VERIFIKASI) */}
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

      {/* 1. HERO HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 rounded-xl shadow-none">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white shadow-sm shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Manajemen Pengguna
              </h1>
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold uppercase py-0.5 tracking-wider px-2">
                Cabang (PC PMII)
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-xl leading-relaxed">
              Atur akun login, peran, lingkup wilayah, dan hak akses menu navigasi pengurus secara terpusat.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
            <span className="font-bold">{activeCount}</span> Aktif
          </div>
          {nonActiveCount > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
              <span className="font-bold">{nonActiveCount}</span> Non-Aktif
            </div>
          )}
          <Button 
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-9 px-3.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna</span>
          </Button>
        </div>
      </div>

      {/* 2. SEARCH & FILTERS BAR */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-none">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari nama pengurus, surel, atau komisariat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={(val) => { if (val) setRoleFilter(val); }}>
            <SelectTrigger className="w-[140px] text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9 font-medium">
              <SelectValue placeholder="Filter Peran" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
              <SelectItem value="ALL" className="text-xs">Semua Peran</SelectItem>
              <SelectItem value="admin" className="text-xs">Admin</SelectItem>
              <SelectItem value="pengurus" className="text-xs">Pengurus</SelectItem>
              <SelectItem value="anggota" className="text-xs">Anggota</SelectItem>
              <SelectItem value="peserta" className="text-xs">Peserta</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(val) => { if (val) setStatusFilter(val); }}>
            <SelectTrigger className="w-[140px] text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9 font-medium">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
              <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
              <SelectItem value="AKTIF" className="text-xs">Aktif</SelectItem>
              <SelectItem value="NONAKTIF" className="text-xs">Non-Aktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 3. USERS DATA TABLE */}
      <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/70 dark:bg-zinc-950/60">
              <TableRow className="border-b border-zinc-200 dark:border-zinc-800">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 py-3 pl-5 w-[260px]">
                  Pengguna
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 py-3 w-[130px]">
                  Peran / Level
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 py-3">
                  Scope Wilayah / Lingkup
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 py-3 w-[120px]">
                  Tanggal Dibuat
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 py-3 w-[100px]">
                  Status
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 py-3 text-right pr-5 w-[100px]">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const r = (user.role || "").toLowerCase();
                  const isMaster = isMasterAdmin(user);

                  return (
                    <TableRow 
                      key={user.id} 
                      className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Name & Email */}
                      <TableCell className="py-3 pl-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center justify-center border border-blue-200/60 dark:border-blue-900/60 shrink-0">
                            {getInitials(user.name)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {user.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                              <Mail className="w-3 h-3 shrink-0" />
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Role Level */}
                      <TableCell className="py-3">
                        {r === "admin" ? (
                          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold">
                            Admin
                          </Badge>
                        ) : r === "pengurus" || r === "komisariat" ? (
                          <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/60 text-[10px] font-semibold">
                            Pengurus
                          </Badge>
                        ) : r === "anggota" ? (
                          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60 text-[10px] font-semibold">
                            Anggota
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60 text-[10px] font-semibold">
                            Peserta
                          </Badge>
                        )}
                      </TableCell>

                      {/* Scope Area */}
                      <TableCell className="py-3">
                        {r === "admin" ? (
                          <span className="text-xs text-zinc-400 dark:text-zinc-500 italic font-medium">
                            Cakupan Seluruh Cabang (Global)
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                            <Building className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="truncate">{user.commissariat || "Belum Ditentukan"}</span>
                          </div>
                        )}
                      </TableCell>

                      {/* Created Date */}
                      <TableCell className="py-3 text-[11px] text-zinc-400 font-mono">
                        {user.createdAt || "-"}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3">
                        <Badge
                          className={`text-[10px] font-semibold border ${
                            user.status === "AKTIF"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          {user.status === "AKTIF" ? "Aktif" : "Non-Aktif"}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 text-right pr-5">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(user)}
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg cursor-pointer"
                            title="Edit Pengguna & Hak Akses"
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isMaster}
                            onClick={() => handleOpenDeleteConfirm(user)}
                            className={`h-8 w-8 p-0 rounded-lg cursor-pointer ${
                              isMaster
                                ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                                : "text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400"
                            }`}
                            title={isMaster ? "Akun Utama Dilindungi" : "Hapus Pengguna"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-xs text-zinc-500">
                    Tidak ada data pengguna yang cocok dengan kriteria pencarian atau filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ========================================================
         MODAL 1: CREATE USER (ADAPTIF LIGHT & DARK)
         ======================================================== */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-lg w-full p-0 overflow-hidden">
          <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Buat Akun Pengguna Baru
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Tambahkan akun pengurus cabang atau komisariat dengan hak akses kustom.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateUser}>
            <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="cth. Sahabat Ahmad Fudholi"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Alamat Surel (Email) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="email"
                  required
                  placeholder="pengurus@pmii.or.id"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Kata Sandi (Password) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Level Peran (Role)
                  </label>
                  <Select
                    value={formRole.toLowerCase()}
                    onValueChange={(val: any) => {
                      if (!val) return;
                      setFormRole(val);
                      const defaultMenus = AVAILABLE_MENUS.filter((m) =>
                        m.defaultRoles.map((r) => r.toLowerCase()).includes(val.toLowerCase())
                      ).map((m) => m.href);
                      setFormAllowedMenus(defaultMenus);
                    }}
                  >
                    <SelectTrigger className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg font-medium">
                      <SelectValue placeholder="Pilih Peran" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                      <SelectItem value="admin" className="text-xs">Admin (Akses Penuh)</SelectItem>
                      <SelectItem value="pengurus" className="text-xs">Pengurus</SelectItem>
                      <SelectItem value="anggota" className="text-xs">Anggota (Kader Resmi)</SelectItem>
                      <SelectItem value="peserta" className="text-xs">Peserta (Calon Anggota)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Status Akun
                  </label>
                  <Select
                    value={formStatus}
                    onValueChange={(val: any) => {
                      if (val) setFormStatus(val);
                    }}
                  >
                    <SelectTrigger className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg font-medium">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                      <SelectItem value="AKTIF" className="text-xs">Aktif</SelectItem>
                      <SelectItem value="NONAKTIF" className="text-xs">Non-Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formRole.toUpperCase() !== "ADMIN" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Komisariat Kampus
                  </label>
                  <Select
                    value={formComm}
                    onValueChange={(val) => {
                      if (val) setFormComm(val);
                    }}
                  >
                    <SelectTrigger className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg font-medium">
                      <SelectValue placeholder="Pilih Komisariat" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                      {getAvailableKomisariats().map((opt) => (
                        <SelectItem key={opt} value={opt} className="text-xs">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Menu Authorization Checklist */}
              <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Hak Akses Menu Sidebar
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Pilih menu yang tampil di sidebar
                  </span>
                </div>

                <div className="max-h-44 overflow-y-auto border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-lg p-3 space-y-3 text-xs">
                  {Object.entries(
                    AVAILABLE_MENUS.reduce((acc, menu) => {
                      if (!acc[menu.group]) acc[menu.group] = [];
                      acc[menu.group].push(menu);
                      return acc;
                    }, {} as Record<string, typeof AVAILABLE_MENUS>)
                  ).map(([groupName, menus]) => (
                    <div key={groupName} className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                        {groupName}
                      </span>
                      <div className="grid grid-cols-1 gap-1.5 pl-1">
                        {menus.map((menu) => {
                          const isChecked = formAllowedMenus.includes(menu.href);
                          return (
                            <label
                              key={menu.href}
                              className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white cursor-pointer select-none py-0.5"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setFormAllowedMenus(formAllowedMenus.filter((h) => h !== menu.href));
                                  } else {
                                    setFormAllowedMenus([...formAllowedMenus, menu.href]);
                                  }
                                }}
                                className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                              />
                              <span className="text-xs font-medium">{menu.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-9 px-4 rounded-lg cursor-pointer"
              >
                Simpan Akun
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================
         MODAL 2: EDIT USER (ADAPTIF LIGHT & DARK)
         ======================================================== */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-lg w-full p-0 overflow-hidden">
          <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Edit Akun Pengguna
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Perbarui profil, kata sandi, peran, atau hak akses menu {selectedUser?.name}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleUpdateUser}>
            <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Sahabat Ahmad..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Alamat Surel (Email) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="email"
                  required
                  placeholder="pengurus@pmii.or.id"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Ubah Kata Sandi <span className="text-zinc-400 font-normal">(kosongkan jika tetap)</span>
                </label>
                <Input
                  type="password"
                  placeholder="•••••••• (Tetap)"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Level Peran (Role)
                  </label>
                  <Select
                    value={formRole.toLowerCase()}
                    disabled={isMasterAdmin(selectedUser)}
                    onValueChange={(val: any) => {
                      if (!val) return;
                      setFormRole(val);
                      const defaultMenus = AVAILABLE_MENUS.filter((m) =>
                        m.defaultRoles.map((r) => r.toLowerCase()).includes(val.toLowerCase())
                      ).map((m) => m.href);
                      setFormAllowedMenus(defaultMenus);
                    }}
                  >
                    <SelectTrigger className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed">
                      <SelectValue placeholder="Pilih Peran" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                      <SelectItem value="admin" className="text-xs">Admin (Akses Penuh)</SelectItem>
                      <SelectItem value="pengurus" className="text-xs">Pengurus</SelectItem>
                      <SelectItem value="anggota" className="text-xs">Anggota (Kader Resmi)</SelectItem>
                      <SelectItem value="peserta" className="text-xs">Peserta (Calon Anggota)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Status Akun
                  </label>
                  <Select
                    value={formStatus}
                    disabled={isMasterAdmin(selectedUser)}
                    onValueChange={(val: any) => {
                      if (val) setFormStatus(val);
                    }}
                  >
                    <SelectTrigger className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                      <SelectItem value="AKTIF" className="text-xs">Aktif</SelectItem>
                      <SelectItem value="NONAKTIF" className="text-xs">Non-Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formRole.toUpperCase() !== "ADMIN" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Komisariat Kampus
                  </label>
                  <Select
                    value={formComm}
                    onValueChange={(val) => {
                      if (val) setFormComm(val);
                    }}
                  >
                    <SelectTrigger className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg font-medium">
                      <SelectValue placeholder="Pilih Komisariat" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                      {getAvailableKomisariats().map((opt) => (
                        <SelectItem key={opt} value={opt} className="text-xs">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Menu Authorization Checklist */}
              <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Hak Akses Menu Sidebar
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Pilih menu yang tampil di sidebar
                  </span>
                </div>

                <div className="max-h-44 overflow-y-auto border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-lg p-3 space-y-3 text-xs">
                  {Object.entries(
                    AVAILABLE_MENUS.reduce((acc, menu) => {
                      if (!acc[menu.group]) acc[menu.group] = [];
                      acc[menu.group].push(menu);
                      return acc;
                    }, {} as Record<string, typeof AVAILABLE_MENUS>)
                  ).map(([groupName, menus]) => (
                    <div key={groupName} className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                        {groupName}
                      </span>
                      <div className="grid grid-cols-1 gap-1.5 pl-1">
                        {menus.map((menu) => {
                          const isChecked = formAllowedMenus.includes(menu.href);
                          return (
                            <label
                              key={menu.href}
                              className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white cursor-pointer select-none py-0.5"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setFormAllowedMenus(formAllowedMenus.filter((h) => h !== menu.href));
                                  } else {
                                    setFormAllowedMenus([...formAllowedMenus, menu.href]);
                                  }
                                }}
                                className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                              />
                              <span className="text-xs font-medium">{menu.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-9 px-4 rounded-lg cursor-pointer"
              >
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================
         MODAL 3: DELETE CONFIRMATION DIALOG
         ======================================================== */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Hapus Akun Pengguna?
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </div>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Apakah Anda yakin ingin menghapus akun pengurus <strong>{userToDelete?.name}</strong> ({userToDelete?.email})? Pengguna ini tidak akan dapat login lagi ke portal.
          </p>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="h-9 text-xs border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDeleteUser}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium h-9 px-4 rounded-lg cursor-pointer"
            >
              Ya, Hapus Akun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
