"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db, createAuthUser, updateAuthUser, normalizeKomisariat } from "@/lib/db";
import type { UserAccount, UserRole, Role } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useFeedbackModal } from "@/components/ui/feedback-modal";

import { isUserAdmin, isUserSuperAdmin, isMenuAllowed } from "@/lib/auth-helpers";
import {
  getKomisariatIdByName,
  isRecordInTenant,
  getActiveTenant,
  TENANT_CHANGED_EVENT,
  isCabangOrAdmin,
} from "@/lib/tenancy";
import { generateUUID, isValidUUID } from "@/lib/utils";
import { AVAILABLE_MENUS, isMasterAdmin } from "./_components/types";
import { UserStats } from "./_components/UserStats";
import { UserFilters } from "./_components/UserFilters";
import { UserTable } from "./_components/UserTable";
import { UserFormDialog } from "./_components/UserFormDialog";
import { UserDeleteDialog } from "./_components/UserDeleteDialog";
import { UserBulkActionBar } from "./_components/UserBulkActionBar";
import { UserBulkDeleteDialog } from "./_components/UserBulkDeleteDialog";

export default function UserManagementPage() {
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTenant, setActiveTenant] = useState<string>("ALL");
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [commissariats, setCommissariats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("pengurus");
  const [formComm, setFormComm] = useState("");
  const [formStatus, setFormStatus] = useState<"AKTIF" | "NONAKTIF">("AKTIF");
  const [formAllowedMenus, setFormAllowedMenus] = useState<string[]>([]);

  const { showToast, FeedbackModalComponent } = useFeedbackModal();

  useEffect(() => {
    setMounted(true);
    const checkAuthAndLoad = async () => {
      let isAllowed = false;

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setCurrentUser(parsed);
            if (
              isUserAdmin(parsed.role) ||
              isUserSuperAdmin(parsed.role, parsed.email) ||
              isMenuAllowed("/dashboard/pengguna", parsed, "/pengurus")
            ) {
              isAllowed = true;
            }
          } catch (e) {
            console.error("Error parsing logged in user", e);
          }
        }
        // Di halaman manajemen pengguna, defaultkan filter ke ALL untuk superadmin/cabang
        setActiveTenant("ALL");
      }

      setAuthorized(isAllowed);

      if (isAllowed) {
        try {
          const userList = await db.getUsers();
          setUsers(userList);
        } catch (err) {
          console.error("Failed to load users:", err);
        }

        try {
          const roleList = await db.getRoles();
          setRoles(roleList);
        } catch (err) {
          console.error("Failed to load roles:", err);
        }

        try {
          const commList = await db.getCommissariats();
          setCommissariats(commList);
          const campusComms = commList.filter(
            (c) => !c.name?.toLowerCase().includes("cabang") && c.level !== "CABANG"
          );
          if (campusComms.length > 0) {
            setFormComm(normalizeKomisariat(campusComms[0].name));
          } else {
            setFormComm("Komisariat Ki Ageng Getas Pendawa");
          }
        } catch (err) {
          console.error("Failed to load commissariats:", err);
        }
      }
    };

    checkAuthAndLoad();
  }, []);

  useEffect(() => {
    const handleTenant = (e: any) => {
      setActiveTenant(e.detail?.activeTenant || getActiveTenant() || "ALL");
    };
    window.addEventListener(TENANT_CHANGED_EVENT, handleTenant);
    return () => {
      window.removeEventListener(TENANT_CHANGED_EVENT, handleTenant);
    };
  }, []);

  const getAvailableKomisariats = () => {
    if (currentUser && !isCabangOrAdmin(currentUser) && currentUser.commissariat) {
      return [normalizeKomisariat(currentUser.commissariat)];
    }

    const defaultList = [
      "Komisariat Ki Ageng Getas Pendawa",
      "Komisariat Ki Ageng Tarub",
      "Komisariat Ajisaka",
      "Komisariat Joko Suro",
    ];

    const uniqueSet = new Set<string>();

    // 1. Ambil dari master tabel tenant / komisariat yang berlevel KOMISARIAT (bukan CABANG)
    commissariats.forEach((c) => {
      const isCabang =
        (c.level && c.level.toUpperCase() === "CABANG") ||
        (c.type && c.type.toUpperCase() === "CABANG") ||
        (c.name && c.name.toLowerCase().includes("cabang"));
      if (!isCabang && c.name) {
        uniqueSet.add(normalizeKomisariat(c.name));
      }
    });

    // 2. Ambil dari users jika ada komisariat kampus tambahan
    users.forEach((u) => {
      if (u.commissariat && !u.commissariat.toLowerCase().includes("cabang")) {
        uniqueSet.add(normalizeKomisariat(u.commissariat));
      }
    });

    // 3. Pastikan 4 komisariat resmi selalu ada
    defaultList.forEach((def) => uniqueSet.add(def));

    return Array.from(uniqueSet).sort();
  };

  const isSuper = isUserSuperAdmin(currentUser?.role, currentUser?.email) || (currentUser?.role && currentUser.role.toLowerCase() === "superadmin");
  const isCabang = isCabangOrAdmin(currentUser);

  const allowedRolesForCurrent = roles.filter((r) => {
    if (!currentUser || isCabang) return true;
    const code = r.code.toLowerCase();
    return code === "pengurus" || code === "anggota" || code === "peserta";
  });

  const tenantScopedUsers = users.filter((u) => {
    // Superadmin & Cabang admin melihat seluruh pengguna saat activeTenant === 'ALL'
    if (isCabang) {
      if (!activeTenant || activeTenant === "ALL" || activeTenant === "Semua Komisariat") {
        return true;
      }
      return isRecordInTenant(
        currentUser,
        {
          commissariat: u.commissariat,
          komisariat_id: (u as any).komisariat_id || (u as any).tenant_id,
          tenant_id: (u as any).tenant_id || (u as any).komisariat_id,
        },
        activeTenant
      );
    }

    // Akun non-cabang hanya melihat data komisariatnya sendiri
    return isRecordInTenant(
      currentUser,
      {
        commissariat: u.commissariat,
        komisariat_id: (u as any).komisariat_id || (u as any).tenant_id,
        tenant_id: (u as any).tenant_id || (u as any).komisariat_id,
      },
      currentUser?.commissariat
    );
  });

  const filteredUsers = tenantScopedUsers.filter((u) => {
    const matchesSearch =
      searchQuery === "" ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.commissariat && u.commissariat.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      roleFilter === "ALL" ||
      (u.role && u.role.toLowerCase() === roleFilter.toLowerCase()) ||
      ((u as any).role_name && (u as any).role_name.toLowerCase() === roleFilter.toLowerCase()) ||
      ((u as any).role_id && (u as any).role_id === roleFilter);

    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const selectableUsers = filteredUsers.filter((u) => !isMasterAdmin(u));
  const isAllSelected = selectableUsers.length > 0 && selectableUsers.every((u) => selectedIds.includes(u.id));
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelect = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableUsers.map((u) => u.id));
    }
  };

  const handleBulkActivate = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const updated = users.map((u) => {
        if (selectedIds.includes(u.id)) {
          const mod = { ...u, status: "AKTIF" as const };
          updateAuthUser(mod);
          return mod;
        }
        return u;
      });
      setUsers(updated);
      await db.saveUsers(updated);
      showToast(`${selectedIds.length} akun pengguna berhasil diaktifkan!`);
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk activate error:", err);
      showToast("Gagal mengaktifkan pengguna terpilih.");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      let count = 0;
      const updated = users.map((u) => {
        if (selectedIds.includes(u.id) && !isMasterAdmin(u)) {
          count++;
          const mod = { ...u, status: "NONAKTIF" as const };
          updateAuthUser(mod);
          return mod;
        }
        return u;
      });
      setUsers(updated);
      await db.saveUsers(updated);
      showToast(`${count} akun pengguna dinonaktifkan.`);
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk deactivate error:", err);
      showToast("Gagal menonaktifkan pengguna terpilih.");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const targetUsers = users.filter((u) => selectedIds.includes(u.id) && !isMasterAdmin(u));
      const targetIds = targetUsers.map((u) => u.id);

      const updated = users.filter((u) => !targetIds.includes(u.id));
      setUsers(updated);
      await db.saveUsers(updated);

      // Hapus akun langsung dari Supabase Users Authentication (auth.users)
      await db.deleteUsersFromAuth(targetUsers);

      showToast(`${targetIds.length} pengguna berhasil dihapus.`);
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
    } catch (err) {
      console.error("Bulk delete error:", err);
      showToast("Gagal menghapus pengguna terpilih.");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleOpenCreate = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("pengurus");
    const comms = getAvailableKomisariats();
    setFormComm(comms[0] || "Komisariat Ki Ageng Getas Pendawa");
    setFormStatus("AKTIF");
    setFormAllowedMenus(
      AVAILABLE_MENUS.filter((m) => m.defaultRoles.map((r) => r.toLowerCase()).includes("pengurus")).map((m) => m.href)
    );
    setIsCreateOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      showToast("Nama, Email, dan Password wajib diisi!");
      return;
    }

    if (users.some((u) => u.email.toLowerCase() === formEmail.trim().toLowerCase())) {
      showToast("Email sudah terdaftar!");
      return;
    }

    try {
      const isUserCabang = isCabangOrAdmin(currentUser);
      const roleLower = formRole.toLowerCase().trim();
      const isCabangRoleTarget =
        isUserCabang && (
          roleLower === "admin" ||
          roleLower === "superadmin" ||
          roleLower === "super_admin" ||
          roleLower === "ketua_cabang" ||
          roleLower === "pengurus_cabang" ||
          roleLower.includes("cabang")
        );
      const targetComm = !isUserCabang && currentUser?.commissariat
        ? currentUser.commissariat
        : (isCabangRoleTarget ? "Pengurus Cabang Grobogan" : formComm);
      const matchedComm = commissariats.find((c) => {
        if (isCabangRoleTarget) {
          return (c.level && c.level.toUpperCase() === "CABANG") || (c.type && c.type.toUpperCase() === "CABANG") || (c.name && c.name.toLowerCase().includes("cabang"));
        }
        return c.name === targetComm || c.id === targetComm || c.id === formComm || normalizeKomisariat(c.name) === normalizeKomisariat(targetComm);
      });
      const targetKomisariatId = !isUserCabang && (currentUser?.tenant_id || currentUser?.komisariat_id)
        ? (currentUser.tenant_id || currentUser.komisariat_id)
        : (matchedComm ? matchedComm.id : undefined);

      let created = await createAuthUser({
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        password: formPassword.trim(),
        role: formRole,
        commissariat: targetComm,
        komisariat_id: isCabangRoleTarget ? undefined : (targetKomisariatId || undefined),
        status: formStatus,
        allowedMenus: formAllowedMenus,
      });

      // Fallback local jika RPC Supabase belum mengembalikan data
      if (!created) {
        const fallbackId = generateUUID();
        created = {
          id: fallbackId,
          user_id: fallbackId,
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          password: formPassword.trim(),
          role: formRole,
          commissariat: targetComm,
          komisariat_id: isCabangRoleTarget ? undefined : (targetKomisariatId || undefined),
          status: formStatus,
          createdAt: new Date().toISOString(),
          allowedMenus: formAllowedMenus
        };
      }

      const updated = [created, ...users.filter(u => u.id !== created.id && u.email.toLowerCase() !== created.email.toLowerCase())];
      setUsers(updated);
      await db.saveUsers(updated);

      // Sinkronkan ke tabel anggota agar data kader/pengurus tidak terpisah
      if (formRole.toLowerCase() !== "peserta") {
        try {
          const cadresList = await db.getCadres();
          const exists = cadresList.some(c => c.email?.toLowerCase() === formEmail.trim().toLowerCase());
          if (!exists) {
            const cadreId = (created.id && isValidUUID(created.id)) ? created.id : generateUUID();
            const newCadre = {
              id: cadreId,
              user_id: (created.user_id && isValidUUID(created.user_id)) ? created.user_id : cadreId,
              name: formName.trim(),
              level: formRole.toLowerCase() === "admin" ? "PKL" : "PKD",
              commissariat: targetComm,
              komisariat_id: isCabangRoleTarget ? null : (targetKomisariatId || undefined),
              tenant_id: isCabangRoleTarget ? null : (targetKomisariatId || undefined),
              status: formStatus === "AKTIF" ? "AKTIF" : "REVISI",
              startDate: new Date().toISOString().split("T")[0],
              email: formEmail.trim().toLowerCase(),
              role: formRole,
              submissions: [],
              isGraduated: true,
              address: `Komisariat ${targetComm}`
            };
            await db.saveCadres([...cadresList, newCadre as any]);
          }
        } catch (cadreErr) {
          console.warn("Notice syncing cadre on user create:", cadreErr);
        }
      }

      setIsCreateOpen(false);
      showToast("Pengguna baru berhasil ditambahkan!");
    } catch (err: any) {
      console.error("Create user error:", err);
      showToast(err.message || "Gagal menambahkan pengguna baru!");
    }
  };

  const handleOpenEdit = (user: UserAccount) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword("");
    setFormRole(user.role);
    setFormComm(user.commissariat || getAvailableKomisariats()[0] || "");
    setFormStatus(user.status);
    const initialMenus =
      user.allowedMenus && user.allowedMenus.length > 0
        ? user.allowedMenus.map((m) =>
            m.startsWith("/dashboard")
              ? m
              : m.replace(/^\/(admin|pengurus|instruktur)/, "/dashboard")
          )
        : AVAILABLE_MENUS.filter((m) =>
            m.defaultRoles.map((r) => r.toLowerCase()).includes((user.role || "").toLowerCase())
          ).map((m) => m.href);
    setFormAllowedMenus(initialMenus);
    setIsEditOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!formName.trim() || !formEmail.trim()) {
      showToast("Nama dan Email wajib diisi!");
      return;
    }

    const isUserCabang = isCabangOrAdmin(currentUser);
    const isMaster = isMasterAdmin(selectedUser);
    const finalRole = isMaster ? "admin" : formRole;
    const finalStatus = isMaster ? "AKTIF" : formStatus;
    const roleLower = finalRole.toLowerCase().trim();
    const isCabangRoleTarget =
      isUserCabang && (
        roleLower === "admin" ||
        roleLower === "superadmin" ||
        roleLower === "super_admin" ||
        roleLower === "ketua_cabang" ||
        roleLower === "pengurus_cabang" ||
        roleLower.includes("cabang")
      );
    const targetComm = !isUserCabang && currentUser?.commissariat
      ? currentUser.commissariat
      : (isCabangRoleTarget ? "Pengurus Cabang Grobogan" : formComm);
    const matchedComm = commissariats.find((c) => {
      if (isCabangRoleTarget) {
        return (c.level && c.level.toUpperCase() === "CABANG") || (c.type && c.type.toUpperCase() === "CABANG") || (c.name && c.name.toLowerCase().includes("cabang"));
      }
      return c.name === targetComm || c.id === targetComm || c.id === formComm || normalizeKomisariat(c.name) === normalizeKomisariat(targetComm);
    });
    const targetKomisariatId = !isUserCabang && (currentUser?.tenant_id || currentUser?.komisariat_id)
      ? (currentUser.tenant_id || currentUser.komisariat_id)
      : (matchedComm ? matchedComm.id : (selectedUser.komisariat_id || (selectedUser as any).tenant_id));

    const updatedUser: UserAccount = {
      ...selectedUser,
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      role: finalRole,
      commissariat: targetComm,
      komisariat_id: isCabangRoleTarget ? undefined : (targetKomisariatId || selectedUser.komisariat_id),
      status: finalStatus,
      allowedMenus: formAllowedMenus,
      password: formPassword.trim() ? formPassword.trim() : selectedUser.password,
    };

    const updated = users.map((u) => (u.id === selectedUser.id ? updatedUser : u));
    setUsers(updated);
    await updateAuthUser(updatedUser);
    await db.saveUsers(updated);

    // Jika pengguna yang diedit adalah akun yang sedang aktif di browser ini, perbarui sesi langsung
    if (typeof window !== "undefined") {
      try {
        const storedStr = localStorage.getItem("PMII_LOGGED_IN_USER");
        if (storedStr) {
          const loggedIn = JSON.parse(storedStr);
          const isSameUser =
            (loggedIn.id && (loggedIn.id === selectedUser.id || loggedIn.id === selectedUser.user_id)) ||
            (loggedIn.email && selectedUser.email && loggedIn.email.toLowerCase() === selectedUser.email.toLowerCase());
          if (isSameUser) {
            const newSession = {
              ...loggedIn,
              ...updatedUser,
              role: finalRole,
              allowedMenus: formAllowedMenus,
            };
            localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(newSession));
            window.dispatchEvent(new CustomEvent("pmii-profile-updated", { detail: newSession }));
          }
        }
      } catch (sessErr) {
        console.warn("Notice updating logged in user session:", sessErr);
      }
    }

    // Update data di tabel anggota jika ada
    try {
      const cadresList = await db.getCadres();
      const cadreMatch = cadresList.find(c => 
        (c.id && c.id === selectedUser.id) || 
        (c.email && c.email.toLowerCase() === selectedUser.email.toLowerCase())
      );
      if (cadreMatch) {
        const updatedCadres = cadresList.map(c => {
          if (c.id === cadreMatch.id) {
            return {
              ...c,
              name: formName.trim(),
              email: formEmail.trim().toLowerCase(),
              commissariat: targetComm,
              komisariat_id: isCabangRoleTarget ? null : (targetKomisariatId || c.komisariat_id),
              tenant_id: isCabangRoleTarget ? null : (targetKomisariatId || c.tenant_id),
              role: finalRole,
              status: finalStatus === "AKTIF" ? "AKTIF" : "REVISI"
            };
          }
          return c;
        });
        await db.saveCadres(updatedCadres);
      }
    } catch (cadreUpdateErr) {
      console.warn("Notice updating cadre on user update:", cadreUpdateErr);
    }

    setIsEditOpen(false);
    setSelectedUser(null);
    showToast("Data pengguna berhasil diperbarui!");
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    if (isMasterAdmin(userToDelete)) {
      showToast("Akun Master Admin tidak dapat dihapus!");
      setIsDeleteConfirmOpen(false);
      return;
    }

    const updated = users.filter((u) => u.id !== userToDelete.id);
    setUsers(updated);
    await db.saveUsers(updated);

    // Hapus juga akun dari Supabase Users Authentication (auth.users)
    await db.deleteUserFromAuth(userToDelete);

    setIsDeleteConfirmOpen(false);
    setUserToDelete(null);
    showToast("Pengguna berhasil dihapus.");
  };

  if (!mounted) return null;

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Akses Dibatasi</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
          Halaman Manajemen Pengguna hanya dapat diakses oleh Administrator Sistem.
        </p>
        <Button
          onClick={() => { window.location.href = "/dashboard"; }}
          variant="outline"
          className="text-xs h-8 px-3 rounded-lg mt-2 cursor-pointer"
        >
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Manajemen Pengguna
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Kelola akun, peran pengurus, dan konfigurasi izin akses menu dashboard.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <UserStats users={tenantScopedUsers} />

      {/* Filter & Search Bar */}
      <UserFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        tenantFilter={activeTenant}
        setTenantFilter={setActiveTenant}
        availableKomisariats={getAvailableKomisariats()}
        isCabang={isCabang}
        availableRoles={allowedRolesForCurrent}
        onOpenCreate={handleOpenCreate}
      />

      {/* Users Table */}
      <UserTable
        users={filteredUsers}
        roles={allowedRolesForCurrent}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        isAllSelected={isAllSelected}
        isSomeSelected={isSomeSelected}
        onOpenEdit={handleOpenEdit}
        onOpenDelete={(u) => {
          setUserToDelete(u);
          setIsDeleteConfirmOpen(true);
        }}
      />

      {/* FLOATING BULK ACTION BAR */}
      <UserBulkActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredUsers.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkActivate={handleBulkActivate}
        onBulkDeactivate={handleBulkDeactivate}
        onOpenBulkDelete={() => setIsBulkDeleteOpen(true)}
        isProcessing={isBulkProcessing}
      />

      {/* BULK DELETE CONFIRMATION DIALOG */}
      <UserBulkDeleteDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        selectedCount={selectedIds.length}
        onConfirm={handleBulkDelete}
        isProcessing={isBulkProcessing}
      />

      {/* CREATE USER DIALOG */}
      <UserFormDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        isEdit={false}
        selectedUser={null}
        formName={formName}
        setFormName={setFormName}
        formEmail={formEmail}
        setFormEmail={setFormEmail}
        formPassword={formPassword}
        setFormPassword={setFormPassword}
        formRole={formRole}
        setFormRole={setFormRole}
        formStatus={formStatus}
        setFormStatus={setFormStatus}
        formComm={formComm}
        setFormComm={setFormComm}
        formAllowedMenus={formAllowedMenus}
        setFormAllowedMenus={setFormAllowedMenus}
        availableKomisariats={getAvailableKomisariats()}
        availableRoles={allowedRolesForCurrent}
        onSubmit={handleCreateUser}
      />

      {/* EDIT USER DIALOG */}
      <UserFormDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        isEdit={true}
        selectedUser={selectedUser}
        formName={formName}
        setFormName={setFormName}
        formEmail={formEmail}
        setFormEmail={setFormEmail}
        formPassword={formPassword}
        setFormPassword={setFormPassword}
        formRole={formRole}
        setFormRole={setFormRole}
        formStatus={formStatus}
        setFormStatus={setFormStatus}
        formComm={formComm}
        setFormComm={setFormComm}
        formAllowedMenus={formAllowedMenus}
        setFormAllowedMenus={setFormAllowedMenus}
        availableKomisariats={getAvailableKomisariats()}
        availableRoles={allowedRolesForCurrent}
        onSubmit={handleUpdateUser}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      <UserDeleteDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        user={userToDelete}
        onConfirm={handleDeleteUser}
      />

      {FeedbackModalComponent}
    </div>
  );
}
