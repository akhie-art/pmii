"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db, createAuthUser, updateAuthUser } from "@/lib/db";
import type { UserAccount, UserRole } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useFeedbackModal } from "@/components/ui/feedback-modal";

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
  const [users, setUsers] = useState<UserAccount[]>([]);
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
            if (parsed.role && parsed.role.toLowerCase() === "admin") {
              isAllowed = true;
            }
          } catch (e) {
            console.error("Error parsing logged in user", e);
          }
        }
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
          const commList = await db.getCommissariats();
          setCommissariats(commList);
          if (commList.length > 0) {
            setFormComm(commList[0].name || "");
          }
        } catch (err) {
          console.error("Failed to load commissariats:", err);
        }
      }
    };

    checkAuthAndLoad();
  }, []);

  const getAvailableKomisariats = () => {
    const list: string[] = [];
    commissariats.forEach((c) => {
      const name = c.name;
      if (name && !list.includes(name)) list.push(name);
    });
    users.forEach((u) => {
      if (u.commissariat && !list.includes(u.commissariat)) list.push(u.commissariat);
    });
    if (!list.includes("Ki Ageng Getas Pendawa")) list.push("Ki Ageng Getas Pendawa");
    return list;
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      searchQuery === "" ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.commissariat && u.commissariat.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === "ALL" || (u.role && u.role.toLowerCase() === roleFilter.toLowerCase());
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
    setFormComm(comms[0] || "Ki Ageng Getas Pendawa");
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
      const created = await createAuthUser({
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        password: formPassword.trim(),
        role: formRole,
        commissariat: formRole.toUpperCase() === "ADMIN" ? undefined : formComm,
        status: formStatus,
        allowedMenus: formAllowedMenus,
      });

      if (created) {
        const updated = [created, ...users.filter(u => u.id !== created.id && u.email.toLowerCase() !== created.email.toLowerCase())];
        setUsers(updated);
        await db.saveUsers(updated);
        setIsCreateOpen(false);
        showToast("Pengguna baru berhasil ditambahkan ke Users Authentication!");
      }
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
        ? user.allowedMenus
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

    const isMaster = isMasterAdmin(selectedUser);
    const finalRole = isMaster ? "admin" : formRole;
    const finalStatus = isMaster ? "AKTIF" : formStatus;

    const updatedUser: UserAccount = {
      ...selectedUser,
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      role: finalRole,
      commissariat: finalRole.toUpperCase() === "ADMIN" ? undefined : formComm,
      status: finalStatus,
      allowedMenus: formAllowedMenus,
      password: formPassword.trim() ? formPassword.trim() : selectedUser.password,
    };

    const updated = users.map((u) => (u.id === selectedUser.id ? updatedUser : u));
    setUsers(updated);
    await updateAuthUser(updatedUser);
    await db.saveUsers(updated);
    setIsEditOpen(false);
    setSelectedUser(null);
    showToast("Data pengguna berhasil diperbarui di Users Authentication!");
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
      <UserStats users={users} />

      {/* Filter & Search Bar */}
      <UserFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onOpenCreate={handleOpenCreate}
      />

      {/* Users Table */}
      <UserTable
        users={filteredUsers}
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
