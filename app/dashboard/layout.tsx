"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Mail,
  FolderOpen,
  BookOpen,
  TrendingUp,
  Settings,
  LogOut,
  Bell,
  Search,
  Sun,
  Moon,
  ShieldCheck,
  Building2,
  Calendar,
  ClipboardCheck,
  UserCheck,
  User,
  GraduationCap,
  Newspaper,
  Award,
  ChevronDown,
} from "lucide-react";

// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { safeSignOut, supabase, isSupabaseConfigured } from "@/lib/supabase";
import { db } from "@/lib/db";
import {
  isUserAdmin,
  isUserSuperAdmin,
  isUserPengurus,
  isUserInstruktur,
  getTargetStaffPrefix,
  isMenuAllowed
} from "@/lib/auth-helpers";
import { getTenantNameById } from "@/lib/tenancy";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load saved theme
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("PMII_THEME");
      if (savedTheme) {
        setDarkMode(savedTheme === "dark");
      }
    }
  }, []);

  // Keep dark mode synced with document body class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      }
    };
    window.addEventListener("pmii-profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("pmii-profile-updated", handleProfileUpdate);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (!stored) {
        router.push("/login");
        return;
      }
      try {
        const user = JSON.parse(stored);
        if (!user) {
          router.push("/login");
          return;
        }

        const roleNormalized = (user.role || "pengurus").toLowerCase();
        const isSuperAdminUser = isUserSuperAdmin(roleNormalized);

        // Jika akun butuh onboarding atau belum terdaftar di basis data keanggotaan (anggota/kader)
        if (!isSuperAdminUser) {
          if (user.needsOnboarding) {
            router.replace("/onboarding");
            return;
          }

          // Cek apakah akun terdaftar di data anggota
          (async () => {
            try {
              const cadres = await db.getCadres();
              const foundCadre: any = cadres.find(
                (c: any) =>
                  (c.email && user.email && c.email.toLowerCase() === user.email.toLowerCase()) ||
                  c.id === user.id ||
                  (user.user_id && c.user_id === user.user_id)
              );
              if (!foundCadre) {
                const updatedSession = { ...user, needsOnboarding: true };
                localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(updatedSession));
                router.replace("/onboarding");
                return;
              }

              // Sinkronkan informasi tenant jika belum lengkap di session
              const resolvedTid = foundCadre.tenant_id || foundCadre.komisariat_id || user.tenant_id || user.komisariat_id;
              const resolvedComm = user.commissariat || foundCadre.commissariat || (resolvedTid ? getTenantNameById(resolvedTid) : null);
              if ((!user.tenant_id && resolvedTid) || (!user.commissariat && resolvedComm)) {
                const updatedSession = {
                  ...user,
                  tenant_id: resolvedTid,
                  komisariat_id: resolvedTid,
                  commissariat: resolvedComm || user.commissariat
                };
                localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(updatedSession));
              }
            } catch (err) {
              console.warn("Notice verifying membership in layout:", err);
            }
          })();
        }

        // Jika akun anggota, peserta, atau kader, alihkan ke URL dinamis sesuai data role akunnya
        if (roleNormalized === "anggota" || roleNormalized === "peserta" || roleNormalized === "kader") {
          localStorage.setItem("PMII_ACTIVE_CADRE_ID", user.id);
          router.push(`/${roleNormalized}`);
          return;
        }

        const isAdmin = isUserAdmin(roleNormalized);
        const isPengurus = isUserPengurus(roleNormalized);
        const isInstruktur = isUserInstruktur(roleNormalized);
        const targetStaffPrefix = getTargetStaffPrefix(roleNormalized);

        // URL dynamic role routing: if user is at legacy /dashboard or /dashboard/*, redirect to /admin, /pengurus, or /instruktur
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          if (currentPath === "/dashboard" || currentPath === "/dashboard/") {
            router.replace(targetStaffPrefix);
            return;
          } else if (currentPath.startsWith("/dashboard/")) {
            router.replace(currentPath.replace(/^\/dashboard/, targetStaffPrefix) + window.location.search);
            return;
          }

          // If role is instruktur but enters /admin or /pengurus, redirect to /instruktur
          if (isInstruktur && (currentPath.startsWith("/admin") || currentPath.startsWith("/pengurus"))) {
            router.replace(currentPath.replace(/^\/(admin|pengurus)/, "/instruktur") + window.location.search);
            return;
          }

          // If pengurus enters /admin or /instruktur, redirect to /pengurus
          if (isPengurus && (currentPath.startsWith("/admin") || currentPath.startsWith("/instruktur"))) {
            router.replace(currentPath.replace(/^\/(admin|instruktur)/, "/pengurus") + window.location.search);
            return;
          }
          // If admin enters /pengurus or /instruktur, redirect to /admin
          if (isAdmin && (currentPath.startsWith("/pengurus") || currentPath.startsWith("/instruktur"))) {
            router.replace(currentPath.replace(/^\/(pengurus|instruktur)/, "/admin") + window.location.search);
            return;
          }
        }

        setCurrentUser(user);
        setLoading(false);

        // Background synchronization with Supabase Users Auth for live role/allowedMenus updates
        if (isSupabaseConfigured && supabase && user.email) {
          (async () => {
            try {
              const { data: usersData, error } = await supabase.rpc("get_auth_users");
              if (!error && Array.isArray(usersData)) {
                const fresh = usersData.find((u: any) =>
                  (u.email && u.email.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
                  (u.id && (u.id === user.id || u.id === user.user_id))
                );
                if (fresh) {
                  const freshRole = fresh.role || user.role || "pengurus";
                  const freshAllowed = Array.isArray(fresh.allowedMenus) ? fresh.allowedMenus : (user.allowedMenus || []);
                  const freshStatus = fresh.status || user.status || "AKTIF";
                  const freshComm = fresh.commissariat || user.commissariat;

                  const roleChanged = freshRole !== user.role;
                  const menusChanged = JSON.stringify(freshAllowed) !== JSON.stringify(user.allowedMenus);
                  const statusChanged = freshStatus !== user.status;

                  if (roleChanged || menusChanged || statusChanged) {
                    const updatedSession = {
                      ...user,
                      role: freshRole,
                      allowedMenus: freshAllowed,
                      status: freshStatus,
                      commissariat: freshComm
                    };
                    localStorage.setItem("PMII_LOGGED_IN_USER", JSON.stringify(updatedSession));
                    setCurrentUser(updatedSession);
                  }
                }
              }
            } catch (syncErr) {
              console.warn("Notice syncing user session in layout:", syncErr);
            }
          })();
        }

        // Route Guard for Instruktur
        const normalizedPath = pathname.replace(/\/$/, "");
        if (isInstruktur) {
          const allowedForInstruktur = [
            targetStaffPrefix,
            `${targetStaffPrefix}/penilaian`,
            `${targetStaffPrefix}/rekap-nilai`,
            `${targetStaffPrefix}/materi`,
            `${targetStaffPrefix}/kegiatan`,
            `${targetStaffPrefix}/anggota`,
            `${targetStaffPrefix}/profil`
          ];
          const isAllowed = allowedForInstruktur.some(p => normalizedPath === p || normalizedPath.startsWith(p + "/"));
          if (!isAllowed) {
            router.push(targetStaffPrefix);
            return;
          }
        }

        // Route Guard for Custom allowedMenus / Restricted Roles
        const isRootHome =
          normalizedPath === "/dashboard" ||
          normalizedPath === "/admin" ||
          normalizedPath === "/pengurus" ||
          normalizedPath === "/instruktur" ||
          normalizedPath === targetStaffPrefix;
        const isProfil = normalizedPath.endsWith("/profil");

        if (!isSuperAdminUser && !isRootHome && !isProfil) {
          // If pengurus tries to access legacy /admin routes, redirect to targetStaffPrefix
          if (isPengurus && (normalizedPath === "/admin" || normalizedPath.startsWith("/admin/"))) {
            router.push(targetStaffPrefix);
            return;
          }

          const isAllowed = isMenuAllowed(normalizedPath, user, targetStaffPrefix);
          if (!isAllowed) {
            router.push(targetStaffPrefix);
            return;
          }
        }
      } catch (e) {
        console.error("Error parsing user session:", e);
        router.push("/login");
      }
    }
  }, [router, pathname]);

  interface NavMenuItem {
    name: string;
    href: string;
    icon: any;
    badge?: string;
    roles?: string[];
  }

  interface MenuGroup {
    groupLabel: string;
    items: NavMenuItem[];
  }

  const userRole = (currentUser?.role || "").toLowerCase();
  const isAdmin = isUserAdmin(userRole);
  const isSuperAdmin = isUserSuperAdmin(userRole, currentUser?.email);
  const isPengurus = isUserPengurus(userRole);
  const isInstruktur = isUserInstruktur(userRole);

  const matchRole = pathname ? pathname.match(/^\/(admin|pengurus|instruktur|dashboard)/) : null;
  const staffPrefix = matchRole && matchRole[1] !== "dashboard"
    ? `/${matchRole[1]}`
    : getTargetStaffPrefix(userRole);

  const menuGroups: MenuGroup[] = isInstruktur
    ? [
        {
          groupLabel: "Penilaian Kaderisasi",
          items: [
            { name: "Dashboard", href: staffPrefix, icon: LayoutDashboard },
            { name: "Penilaian Peserta", href: `${staffPrefix}/penilaian`, icon: Award },
            { name: "Rekap & Yudisium", href: `${staffPrefix}/rekap-nilai`, icon: TrendingUp },
          ]
        }
      ]
    : [
        {
          groupLabel: "Utama",
          items: [
            { name: "Dashboard", href: staffPrefix, icon: LayoutDashboard },
          ]
        },
        {
          groupLabel: "Keanggotaan & Struktur",
          items: [
            {
              name: isSuperAdmin ? "Tenant" : "Data Komisariat",
              href: `${staffPrefix}/${isSuperAdmin ? "tenant" : "komisariat"}`,
              icon: Building2
            },
            { name: "Database Anggota", href: `${staffPrefix}/anggota`, icon: Users },
            { name: "Data Pengurus", href: `${staffPrefix}/pengurus`, icon: UserCheck },
          ]
        },
        {
          groupLabel: "Kaderisasi & Pembinaan",
          items: [
            { name: "Sistem Kaderisasi", href: `${staffPrefix}/kaderisasi`, icon: GraduationCap },
            { name: "Penilaian Peserta", href: `${staffPrefix}/penilaian`, icon: Award },
            { name: "Rekap & Yudisium", href: `${staffPrefix}/rekap-nilai`, icon: TrendingUp },
            { name: "Materi & Kurikulum", href: `${staffPrefix}/materi`, icon: BookOpen },
            { name: "Kegiatan & Acara", href: `${staffPrefix}/kegiatan`, icon: Calendar },
            { name: "RTL & Verifikasi", href: `${staffPrefix}/verifikasi`, icon: ClipboardCheck },
          ]
        },
        {
          groupLabel: "Administrasi & Dokumen",
          items: [
            { name: "Surat Menyurat", href: `${staffPrefix}/surat`, icon: Mail },
            { name: "Arsip Dokumen", href: `${staffPrefix}/arsip`, icon: FolderOpen },
          ]
        },
        {
          groupLabel: "Publikasi & Media",
          items: [
            { name: "Artikel & Berita", href: `${staffPrefix}/artikel`, icon: Newspaper },
          ]
        },
        {
          groupLabel: "Konfigurasi & Pengaturan",
          items: [
            { name: "Manajemen Pengguna", href: `${staffPrefix}/pengguna`, icon: ShieldCheck },
            { name: "Pengaturan Sistem", href: `${staffPrefix}/pengaturan`, icon: Settings },
          ]
        }
      ];

  const filteredGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => isMenuAllowed(item.href, currentUser, staffPrefix))
  })).filter(group => group.items.length > 0);

  const notifications = [
    { id: 1, text: "Pendaftaran kegiatan kaderisasi baru masuk", time: "5 menit yang lalu", unread: true },
    { id: 2, text: "Laporan tugas follow-up menunggu verifikasi pengurus", time: "2 jam yang lalu", unread: true },
    { id: 3, text: "SK Kepengurusan PK PMII Ki Ageng Getas Pendawa tersimpan", time: "1 hari yang lalu", unread: false },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-800 mx-auto" />
          <div className="h-4 w-28 bg-zinc-800 rounded mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className={`min-h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200 font-sans w-full relative`}>
        {/* OFFICIAL SHADCN SIDEBAR Component */}
        <Sidebar collapsible="icon" className="border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-40">
          <SidebarHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 dark:border-zinc-700 p-1 flex items-center justify-center flex-shrink-0 shadow-xs">
                <Image
                  src="/image/logo_komsat.png"
                  alt="Logo"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {isAdmin ? "Panel Administrator" : isInstruktur ? "Panel Tim Instruktur" : "Panel Pengurus"}
                </h3>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                  {isAdmin
                    ? "PC PMII Grobogan"
                    : (currentUser?.commissariat || "Pengurus PMII")}
                </p>
              </div>
            </div>
          </SidebarHeader>

          {/* Sidebar Content */}
          <SidebarContent className="px-3 py-3 space-y-4 overflow-y-auto flex-1 min-h-0">
            {filteredGroups.map((group) => (
              <SidebarGroup key={group.groupLabel} className="p-0">
                <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1 px-3 group-data-[collapsible=icon]:hidden select-none">
                  {group.groupLabel}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5">
                    {group.items.map((item) => {
                      const isTenantOrKomisariatMatch =
                        (item.href.endsWith("/tenant") || item.href.endsWith("/komisariat")) &&
                        (pathname.endsWith("/tenant") || pathname.endsWith("/komisariat") || pathname.includes("/tenant/") || pathname.includes("/komisariat/"));

                      const isActive =
                        pathname === item.href ||
                        (item.href !== staffPrefix && pathname.startsWith(item.href + "/")) ||
                        isTenantOrKomisariatMatch;
                      const Icon = item.icon;

                      return (
                        <SidebarMenuItem key={item.name} className="relative">
                          <SidebarMenuButton
                            isActive={isActive}
                            tooltip={item.name}
                            render={<Link href={item.href} />}
                            className={`w-full flex items-center gap-2.5 h-9 px-3 rounded-lg transition-colors duration-150 border-none outline-hidden cursor-pointer ${
                              isActive 
                                ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold" 
                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                            }`}
                          >
                            <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${
                              isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                            }`} />
                            
                            <span className="text-xs group-data-[collapsible=icon]:hidden font-medium truncate">
                              {item.name}
                            </span>

                            {/* Optional Badge */}
                            {item.badge && (
                              <span className="ml-auto group-data-[collapsible=icon]:hidden bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none">
                                {item.badge}
                              </span>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
        </Sidebar>

        {/* OFFICIAL SHADCN SIDEBAR INSET COMPONENT */}
        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-zinc-50 dark:bg-zinc-950 min-h-screen">
          
          {/* HEADER */}
          <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30 w-full">
            
            {/* LEFT: Trigger & Search */}
            <div className="flex items-center gap-4 flex-1 max-w-lg">
              <SidebarTrigger className="text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-white cursor-pointer" />

              {/* Search Bar */}
              <div className="relative w-full max-w-sm hidden sm:block">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                <Input
                  type="text"
                  placeholder="Pencarian cepat data kader & arsip (Tekan Enter)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      router.push(`${staffPrefix}/anggota?q=${encodeURIComponent(searchQuery.trim())}`);
                    }
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-blue-600 dark:focus:border-blue-500 outline-hidden transition-all placeholder-zinc-400 dark:placeholder-zinc-500 h-8"
                />
              </div>
            </div>

            {/* RIGHT: Notifications, Theme Toggle, Profile */}
            <div className="flex items-center gap-2.5 sm:gap-3">

              {/* Theme Toggle Button */}
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => {
                  const newMode = !darkMode;
                  setDarkMode(newMode);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("PMII_THEME", newMode ? "dark" : "light");
                  }
                }}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer bg-white dark:bg-zinc-900"
              >
                {darkMode ? <Sun className="w-4.5 h-4.5 text-pmii-gold" /> : <Moon className="w-4.5 h-4.5 text-blue-600" />}
              </Button>

              {/* Notifications using shadcn DropdownMenu */}
              <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer relative"
                    >
                      <Bell className="w-4.5 h-4.5" />
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-950" />
                    </Button>
                  }
                />
                <DropdownMenuContent
                  align="end"
                  className="w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 p-0 overflow-hidden"
                >
                  <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900">
                    <span className="text-xs font-extrabold tracking-wide">Pemberitahuan</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold cursor-pointer">Tandai semua dibaca</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                    {notifications.map((notif) => (
                      <DropdownMenuItem
                        key={notif.id}
                        className="p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer flex flex-col items-start gap-1 transition-colors duration-150 rounded-none focus:bg-zinc-50 dark:focus:bg-zinc-800/50"
                      >
                        <div className="flex items-start gap-2">
                          {notif.unread && <span className="w-2 h-2 mt-1.5 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0" />}
                          <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium select-text">
                            {notif.text}
                          </p>
                        </div>
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium pl-4">{notif.time}</span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* User Profile in Navbar (untuk semua role) */}
              <div className="flex items-center pl-2 border-l border-zinc-200 dark:border-zinc-800">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 hover:bg-zinc-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80 transition-all duration-150 cursor-pointer group shadow-2xs outline-none"
                        title="Menu Akun Pengguna"
                      >
                        {currentUser?.avatar ? (
                          <Avatar className="w-7 h-7 rounded-lg border border-blue-200 dark:border-blue-900 shrink-0 overflow-hidden">
                            <AvatarImage src={currentUser.avatar} alt={currentUser.name} className="object-cover" />
                            <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                              {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : "AD"}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-blue-600 dark:bg-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : "AD"}
                          </div>
                        )}
                        <div className="hidden sm:flex flex-col text-left min-w-0 max-w-[130px] md:max-w-[190px]">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {currentUser?.name || (isAdmin ? "Admin Pengurus Cabang" : isInstruktur ? "Instruktur PMII" : "Pengurus PMII")}
                          </span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 truncate">
                            <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span className="truncate">
                              {userRole === "admin" ? "Administrator" : isInstruktur ? "Tim Instruktur" : isPengurus ? "Pengurus" : currentUser?.role || "Administrator"}
                            </span>
                          </span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors ml-0.5 shrink-0 hidden sm:block" />
                      </button>
                    }
                  />
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg p-1.5 z-50"
                  >
                    <div className="px-2.5 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {currentUser?.name || "Akun PMII"}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {currentUser?.email || (isAdmin ? "admin@pmii.id" : "pengurus@pmii.id")}
                      </p>
                    </div>
                    <DropdownMenuItem
                      onClick={() => router.push(`${staffPrefix}/profil`)}
                      className="cursor-pointer text-xs font-medium gap-2 p-2 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800"
                    >
                      <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Profil Saya</span>
                    </DropdownMenuItem>
                    {isMenuAllowed(`${staffPrefix}/pengguna`, currentUser, staffPrefix) && (
                      <DropdownMenuItem
                        onClick={() => router.push(`${staffPrefix}/pengguna`)}
                        className="cursor-pointer text-xs font-medium gap-2 p-2 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Manajemen Pengguna</span>
                      </DropdownMenuItem>
                    )}
                    {isMenuAllowed(`${staffPrefix}/pengaturan`, currentUser, staffPrefix) && (
                      <DropdownMenuItem
                        onClick={() => router.push(`${staffPrefix}/pengaturan`)}
                        className="cursor-pointer text-xs font-medium gap-2 p-2 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800"
                      >
                        <Settings className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Pengaturan Sistem</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="my-1 bg-zinc-100 dark:bg-zinc-800" />
                    <DropdownMenuItem
                      onClick={async () => {
                        await safeSignOut();
                        router.push("/login");
                      }}
                      className="cursor-pointer text-xs font-medium gap-2 p-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 focus:bg-rose-50 dark:focus:bg-rose-950/30"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Keluar Sistem</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <main className="flex-1 p-3.5 sm:p-6 overflow-y-auto custom-scrollbar">
            {children}
          </main>
        </SidebarInset>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: "!bg-zinc-900 !border !border-zinc-800 !text-zinc-100 !shadow-2xl !rounded-xl !text-xs !font-semibold",
            title: "!text-zinc-50 !font-bold !text-xs",
            description: "!text-zinc-400 !text-[10px]",
            success: "!border-emerald-500/30",
            error: "!border-rose-500/30",
            warning: "!border-amber-500/30",
            info: "!border-blue-500/30",
            actionButton: "!bg-pmii-gold !text-zinc-900 !font-bold !text-[10px] !rounded-lg",
            cancelButton: "!bg-zinc-800 !text-zinc-400 !text-[10px] !rounded-lg",
          }
        }}
        richColors
        closeButton
      />
    </SidebarProvider>
  );
}
