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
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
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
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
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

  // Form States
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("pengurus");
  const [formComm, setFormComm] = useState("");
  const [formStatus, setFormStatus] = useState<"AKTIF" | "NONAKTIF">("AKTIF");
  const [formAllowedMenus, setFormAllowedMenus] = useState<string[]>([]);

  const [notification, setNotification] = useState<{ type: "success" | "error", message: string } | null>(null);

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

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleOpenCreate = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("pengurus");
    const initialComms = getAvailableKomisariats();
    setFormComm(initialComms[0] || "");
    setFormStatus("AKTIF");
    const defaultMenus = AVAILABLE_MENUS.filter(m => m.defaultRoles.map(r => r.toLowerCase()).includes("pengurus")).map(m => m.href);
    setFormAllowedMenus(defaultMenus);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword(user.password || "");
    setFormRole(user.role);
    setFormComm(user.commissariat || getAvailableKomisariats()[0] || "");
    setFormStatus(user.status);
    setFormAllowedMenus(
      Array.isArray(user.allowedMenus)
        ? user.allowedMenus
        : AVAILABLE_MENUS.filter(m => m.defaultRoles.map(r => r.toLowerCase()).includes((user.role || "").toLowerCase())).map(m => m.href)
    );
    setIsEditOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formPassword) {
      showNotification("error", "Harap isi semua kolom wajib!");
      return;
    }

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      name: formName,
      email: formEmail.toLowerCase(),
      password: formPassword,
      role: formRole,
      commissariat: formRole !== "ADMIN" ? formComm : undefined,
      status: formStatus,
      allowedMenus: formAllowedMenus,
      createdAt: new Date().toISOString().split("T")[0]
    };

    const updatedList = [...users, newUser];
    const success = await db.saveUsers(updatedList);
    if (success) {
      setUsers(updatedList);
      setIsCreateOpen(false);
      showNotification("success", `Akun pengurus ${formName} berhasil dibuat!`);
    } else {
      showNotification("error", "Gagal menyimpan akun ke database.");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!formName || !formEmail) {
      showNotification("error", "Nama dan Email wajib diisi!");
      return;
    }

    const updatedList = users.map(u => {
      if (u.id === selectedUser.id) {
        return {
          ...u,
          name: formName,
          email: formEmail.toLowerCase(),
          password: formPassword || u.password,
          role: formRole,
          commissariat: formRole !== "ADMIN" ? formComm : undefined,
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
            const foundUpdated = updatedList.find(u => u.id === curr.id);
            if (foundUpdated) {
              localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(foundUpdated));
            }
          } catch (e) {
            console.error(e);
          }
        }
      }

      showNotification("success", `Akun pengurus ${formName} berhasil diperbarui!`);
    } else {
      showNotification("error", "Gagal memperbarui akun.");
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun pengurus ${name}?`)) {
      const updatedList = users.filter(u => u.id !== id);
      const success = await db.saveUsers(updatedList);
      if (success) {
        setUsers(updatedList);
        showNotification("success", `Akun ${name} telah berhasil dihapus.`);
      } else {
        showNotification("error", "Gagal menghapus akun dari database.");
      }
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const roleNorm = (u.role || "").toLowerCase();
    const filterNorm = roleFilter.toLowerCase();
    const matchRole = 
      roleFilter === "ALL" || 
      roleNorm === filterNorm || 
      (filterNorm === "pengurus" && roleNorm === "komisariat");
    const matchStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  if (!mounted) {
    return (
      <div className="p-8 flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pmii-gold" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 h-[60vh] flex flex-col justify-center items-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/25">
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-lg font-black text-rose-500 uppercase tracking-wide">Akses Ditolak</h2>
        <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
          Maaf, halaman Manajemen Pengguna ini hanya dapat diakses oleh administrator tingkat **Cabang (PC PMII)**.
          Silakan masuk menggunakan kredensial Cabang untuk melanjutkan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative select-none">
      
      {/* Dynamic Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`fixed top-4 left-1/2 z-55 px-4 py-2.5 rounded-lg border text-xs font-semibold shadow-lg flex items-center gap-2.5 ${
              notification.type === "success" 
                ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                : "bg-rose-950 text-rose-300 border-rose-500/40"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-pmii-blue dark:text-pmii-gold" />
            Manajemen Pengguna
          </h2>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
            Atur hak akses login pengurus dan anggota PK PMII Ki Ageng Getas Pendawa secara terpusat
          </p>
        </div>
        
        <Button 
          onClick={handleOpenCreate}
          className="bg-pmii-blue hover:bg-pmii-blue-light text-white dark:bg-pmii-gold dark:hover:bg-pmii-gold-light dark:text-[#090d16] font-bold text-xs rounded-xl shadow-md border-none flex items-center gap-2 cursor-pointer h-9 px-4 transform hover:-translate-y-0.5 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Pengguna
        </Button>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <Card className="bg-white dark:bg-[#090d16]/80 border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4.5 h-4.5 text-zinc-450 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari nama pengurus atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800/80 text-foreground placeholder-zinc-500 focus:border-pmii-blue dark:focus:border-pmii-gold w-full h-9 focus:ring-1 focus:ring-pmii-blue"
            />
          </div>

          <div className="flex flex-wrap gap-2.5">
            {/* Filter Role */}
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-3 py-1.5">
              <span className="text-[10px] font-black uppercase text-zinc-500">Peran:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-[11px] font-bold bg-transparent border-none outline-none text-zinc-700 dark:text-zinc-300 pr-1 cursor-pointer"
              >
                <option value="ALL">Semua Peran</option>
                <option value="admin">Admin</option>
                <option value="pengurus">Pengurus</option>
                <option value="anggota">Anggota</option>
                <option value="peserta">Peserta</option>
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-3 py-1.5">
              <span className="text-[10px] font-black uppercase text-zinc-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-[11px] font-bold bg-transparent border-none outline-none text-zinc-700 dark:text-zinc-300 pr-1 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="AKTIF">Aktif</option>
                <option value="NONAKTIF">Non-Aktif</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* USERS DATA TABLE */}
      <Card className="bg-white dark:bg-[#090d16]/80 border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/20 border-b border-zinc-200 dark:border-zinc-800">
                <TableRow>
                  <TableHead className="text-[10px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 w-[240px]">Pengurus</TableHead>
                  <TableHead className="text-[10px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 w-[140px]">Peran / Level</TableHead>
                  <TableHead className="text-[10px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500">Scope Wilayah / Lingkup</TableHead>
                  <TableHead className="text-[10px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 w-[100px]">Tanggal Dibuat</TableHead>
                  <TableHead className="text-[10px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 w-[100px]">Status</TableHead>
                  <TableHead className="text-[10px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 w-[100px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10">
                      
                      {/* Name & Email */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                            <AvatarFallback className="text-[10px] font-extrabold bg-gradient-to-tr from-pmii-blue/20 to-pmii-gold/20 text-pmii-blue dark:text-pmii-gold">
                              {user.name.split(" ").map(w => w[0]).join("").substring(0,2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-foreground truncate">{user.name}</span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 font-mono">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Role Level */}
                      <TableCell className="py-3">
                        {(() => {
                          const r = (user.role || "").toLowerCase();
                          if (r === "admin") {
                            return (
                              <Badge className="text-[9px] font-bold tracking-wide rounded-lg border-none px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                Admin
                              </Badge>
                            );
                          }
                          if (r === "pengurus" || r === "komisariat") {
                            return (
                              <Badge className="text-[9px] font-bold tracking-wide rounded-lg border-none px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                Pengurus
                              </Badge>
                            );
                          }
                          if (r === "anggota") {
                            return (
                              <Badge className="text-[9px] font-bold tracking-wide rounded-lg border-none px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                Anggota
                              </Badge>
                            );
                          }
                          return (
                            <Badge className="text-[9px] font-bold tracking-wide rounded-lg border-none px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              Peserta
                            </Badge>
                          );
                        })()}
                      </TableCell>

                      {/* Scope Area */}
                      <TableCell className="py-3">
                        {user.role === "ADMIN" ? (
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic font-semibold">Cakupan Seluruh Cabang (Global)</span>
                        ) : (
                          <div className="flex flex-col gap-0.5 text-[11px] font-bold text-foreground">
                            <span className="flex items-center gap-1">
                              <Building className="w-3.5 h-3.5 text-zinc-450 dark:text-zinc-500" />
                              {user.commissariat}
                            </span>
                          </div>
                        )}
                      </TableCell>

                      {/* Created Date */}
                      <TableCell className="py-3 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 font-mono">
                        {user.createdAt}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3">
                        <Badge className={`text-[9px] font-extrabold rounded-lg border-none px-2 py-0.5 ${
                          user.status === "AKTIF" 
                            ? "bg-emerald-500/15 text-emerald-500" 
                            : "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400"
                        }`}>
                          {user.status === "AKTIF" ? "AKTIF" : "NON-AKTIF"}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleOpenEdit(user)}
                            className="w-7 h-7 rounded-lg text-zinc-500 hover:text-pmii-blue hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={user.id === "user-1"} // Prevent deleting primary admin
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className={`w-7 h-7 rounded-lg text-zinc-550 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer ${
                              user.id === "user-1" ? "opacity-30 cursor-not-allowed" : ""
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>

                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-xs text-zinc-500 font-bold uppercase tracking-wider">
                      Tidak ada data pengurus ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* DIALOG 1: CREATE USER */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-[#090d16] border border-zinc-800 text-white rounded-3xl p-6 max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-pmii-gold" />
              Buat Akun Pengguna Baru
            </DialogTitle>
            <DialogDescription className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest pt-1">
              Tambahkan akun pengguna atau admin pengurus baru
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 pt-3">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Nama Lengkap</label>
              <Input
                type="text"
                required
                placeholder="Sahabat Ahmad..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="text-xs bg-zinc-950 border-zinc-800 rounded-xl h-9.5 text-white placeholder-zinc-700"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Alamat Surel (Email)</label>
              <Input
                type="email"
                required
                placeholder="pengurus@pmii.org"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="text-xs bg-zinc-950 border-zinc-800 rounded-xl h-9.5 text-white placeholder-zinc-700"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Kata Sandi (Password)</label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="text-xs bg-zinc-950 border-zinc-800 rounded-xl h-9.5 text-white placeholder-zinc-700"
              />
            </div>

            {/* Role Level select */}
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Level Peran (Role)</label>
              <select
                value={formRole.toLowerCase()}
                onChange={(e) => {
                  const newRole = e.target.value as any;
                  setFormRole(newRole);
                  const defaultMenus = AVAILABLE_MENUS.filter(m => m.defaultRoles.map(r => r.toLowerCase()).includes(newRole.toLowerCase())).map(m => m.href);
                  setFormAllowedMenus(defaultMenus);
                }}
                className="text-xs w-full bg-zinc-950 border border-zinc-800 rounded-xl h-9.5 px-3 text-white focus:outline-none"
              >
                <option value="admin">Admin (Akses Penuh)</option>
                <option value="pengurus">Pengurus</option>
                <option value="anggota">Anggota (Kader Resmi)</option>
                <option value="peserta">Peserta (Calon Anggota)</option>
              </select>
            </div>

            {/* Commissariat select */}
            {formRole !== "ADMIN" && (
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Komisariat Kampus</label>
                <select
                  value={formComm}
                  onChange={(e) => setFormComm(e.target.value)}
                  className="text-xs w-full bg-zinc-950 border border-zinc-800 rounded-xl h-9.5 px-3 text-white focus:outline-none"
                >
                  {getAvailableKomisariats().map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Status */}
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Status Akun</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="text-xs w-full bg-zinc-950 border border-zinc-800 rounded-xl h-9.5 px-3 text-white focus:outline-none"
              >
                <option value="AKTIF">Aktif</option>
                <option value="NONAKTIF">Non-Aktif</option>
              </select>
            </div>

            {/* Menu Authorization Checklist */}
            <div className="space-y-2 border-t border-zinc-800/80 pt-3">
              <label className="text-[10px] font-black uppercase text-pmii-gold tracking-wider flex items-center justify-between">
                <span>Hak Akses Menu Sidebar</span>
                <span className="text-[8px] text-zinc-500 font-semibold lowercase">Pilih menu yang tampil di sidebar</span>
              </label>
              
              <div className="max-h-48 overflow-y-auto border border-zinc-800 bg-zinc-950/60 rounded-xl p-3 space-y-3 custom-scrollbar text-xs">
                {Object.entries(
                  AVAILABLE_MENUS.reduce((acc, menu) => {
                    if (!acc[menu.group]) acc[menu.group] = [];
                    acc[menu.group].push(menu);
                    return acc;
                  }, {} as Record<string, typeof AVAILABLE_MENUS>)
                ).map(([groupName, menus]) => (
                  <div key={groupName} className="space-y-1.5">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">{groupName}</span>
                    <div className="grid grid-cols-1 gap-1.5 pl-1.5">
                      {menus.map((menu) => {
                        const isChecked = formAllowedMenus.includes(menu.href);
                        return (
                          <label key={menu.href} className="flex items-center gap-2.5 text-zinc-300 hover:text-white cursor-pointer select-none py-0.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setFormAllowedMenus(formAllowedMenus.filter(h => h !== menu.href));
                                } else {
                                  setFormAllowedMenus([...formAllowedMenus, menu.href]);
                                }
                              }}
                              className="rounded border-zinc-800 bg-zinc-900 text-pmii-gold focus:ring-pmii-gold focus:ring-opacity-25 w-4 h-4 cursor-pointer"
                            />
                            <span className="font-semibold text-[11px]">
                              {menu.name === "Pengaturan Sistem" && formRole === "KOMISARIAT" ? "Pengaturan Komisariat" : menu.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <DialogClose render={<Button type="button" variant="outline" className="h-9 rounded-xl text-xs font-bold border-zinc-800 bg-transparent text-zinc-400 hover:text-white" />}>
                Batal
              </DialogClose>
              <Button type="submit" className="h-9 rounded-xl text-xs font-bold bg-pmii-gold hover:bg-pmii-gold-light text-[#090d16] border-none px-4">
                Simpan Akun
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: EDIT USER */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-[#090d16] border border-zinc-800 text-white rounded-3xl p-6 max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-pmii-gold" />
              Edit Akun Pengurus
            </DialogTitle>
            <DialogDescription className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest pt-1">
              Perbarui hak akses, status, atau kata sandi pengurus {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateUser} className="space-y-4 pt-3">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Nama Lengkap</label>
              <Input
                type="text"
                required
                placeholder="Sahabat Ahmad..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="text-xs bg-zinc-950 border-zinc-800 rounded-xl h-9.5 text-white placeholder-zinc-700"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Alamat Surel (Email)</label>
              <Input
                type="email"
                required
                placeholder="pengurus@pmii.org"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="text-xs bg-zinc-950 border-zinc-800 rounded-xl h-9.5 text-white placeholder-zinc-700"
              />
            </div>

            {/* Password (Optional modification) */}
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Ubah Kata Sandi (Kosongkan jika tetap)</label>
              <Input
                type="password"
                placeholder="•••••••• (Tetap)"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="text-xs bg-zinc-950 border-zinc-800 rounded-xl h-9.5 text-white placeholder-zinc-750"
              />
            </div>

            {/* Role Level select */}
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Level Peran (Role)</label>
              <select
                value={formRole.toLowerCase()}
                disabled={selectedUser?.id === "user-admin"} // Enforce Admin role for master admin
                onChange={(e) => {
                  const newRole = e.target.value as any;
                  setFormRole(newRole);
                  const defaultMenus = AVAILABLE_MENUS.filter(m => m.defaultRoles.map(r => r.toLowerCase()).includes(newRole.toLowerCase())).map(m => m.href);
                  setFormAllowedMenus(defaultMenus);
                }}
                className="text-xs w-full bg-zinc-950 border border-zinc-800 rounded-xl h-9.5 px-3 text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="admin">Admin (Akses Penuh)</option>
                <option value="pengurus">Pengurus</option>
                <option value="anggota">Anggota (Kader Resmi)</option>
                <option value="peserta">Peserta (Calon Anggota)</option>
              </select>
            </div>

            {/* Commissariat select */}
            {formRole !== "ADMIN" && (
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Komisariat Kampus</label>
                <select
                  value={formComm}
                  onChange={(e) => setFormComm(e.target.value)}
                  className="text-xs w-full bg-zinc-950 border border-zinc-800 rounded-xl h-9.5 px-3 text-white focus:outline-none"
                >
                  {getAvailableKomisariats().map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Status */}
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Status Akun</label>
              <select
                value={formStatus}
                disabled={selectedUser?.id === "user-1"} // Enforce active status for master admin
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="text-xs w-full bg-zinc-950 border border-zinc-800 rounded-xl h-9.5 px-3 text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="AKTIF">Aktif</option>
                <option value="NONAKTIF">Non-Aktif</option>
              </select>
            </div>

            {/* Menu Authorization Checklist */}
            <div className="space-y-2 border-t border-zinc-800/80 pt-3">
              <label className="text-[10px] font-black uppercase text-pmii-gold tracking-wider flex items-center justify-between">
                <span>Hak Akses Menu Sidebar</span>
                <span className="text-[8px] text-zinc-500 font-semibold lowercase">Pilih menu yang tampil di sidebar</span>
              </label>
              
              <div className="max-h-48 overflow-y-auto border border-zinc-800 bg-zinc-950/60 rounded-xl p-3 space-y-3 custom-scrollbar text-xs">
                {Object.entries(
                  AVAILABLE_MENUS.reduce((acc, menu) => {
                    if (!acc[menu.group]) acc[menu.group] = [];
                    acc[menu.group].push(menu);
                    return acc;
                  }, {} as Record<string, typeof AVAILABLE_MENUS>)
                ).map(([groupName, menus]) => (
                  <div key={groupName} className="space-y-1.5">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">{groupName}</span>
                    <div className="grid grid-cols-1 gap-1.5 pl-1.5">
                      {menus.map((menu) => {
                        const isChecked = formAllowedMenus.includes(menu.href);
                        return (
                          <label key={menu.href} className="flex items-center gap-2.5 text-zinc-300 hover:text-white cursor-pointer select-none py-0.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setFormAllowedMenus(formAllowedMenus.filter(h => h !== menu.href));
                                } else {
                                  setFormAllowedMenus([...formAllowedMenus, menu.href]);
                                }
                              }}
                              className="rounded border-zinc-800 bg-zinc-900 text-pmii-gold focus:ring-pmii-gold focus:ring-opacity-25 w-4 h-4 cursor-pointer"
                            />
                            <span className="font-semibold text-[11px]">
                              {menu.name === "Pengaturan Sistem" && formRole === "KOMISARIAT" ? "Pengaturan Komisariat" : menu.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <DialogClose render={<Button type="button" variant="outline" className="h-9 rounded-xl text-xs font-bold border-zinc-800 bg-transparent text-zinc-400 hover:text-white" />}>
                Batal
              </DialogClose>
              <Button type="submit" className="h-9 rounded-xl text-xs font-bold bg-pmii-gold hover:bg-pmii-gold-light text-[#090d16] border-none px-4">
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
