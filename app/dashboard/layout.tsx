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
  Award
} from "lucide-react";

// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
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
        // Jika akun anggota, peserta, atau kader, alihkan ke URL dinamis sesuai data role akunnya
        if (roleNormalized === "anggota" || roleNormalized === "peserta" || roleNormalized === "kader") {
          localStorage.setItem("PMII_ACTIVE_CADRE_ID", user.id);
          router.push(`/${roleNormalized}`);
          return;
        }

        const isAdmin = roleNormalized === "admin";
        const isPengurus = roleNormalized === "pengurus" || roleNormalized === "komisariat";
        const isInstruktur = roleNormalized === "instruktur";
        const targetStaffPrefix = isAdmin ? "/admin" : (isInstruktur ? "/instruktur" : "/pengurus");

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

        // Route Guard for Pengurus (cannot access admin-only menus)
        if (isPengurus) {
          if (
            normalizedPath === `${targetStaffPrefix}/pengguna` ||
            normalizedPath.startsWith(`${targetStaffPrefix}/pengguna/`) ||
            normalizedPath === `${targetStaffPrefix}/pengaturan` ||
            normalizedPath.startsWith(`${targetStaffPrefix}/pengaturan/`) ||
            normalizedPath === "/admin/pengguna" ||
            normalizedPath.startsWith("/admin/pengguna/") ||
            normalizedPath === "/admin/pengaturan" ||
            normalizedPath.startsWith("/admin/pengaturan/")
          ) {
            router.push(targetStaffPrefix);
            return;
          }

          // Check custom allowedMenus if assigned
          if (Array.isArray(user.allowedMenus) && user.allowedMenus.length > 0) {
            if (
              normalizedPath !== targetStaffPrefix &&
              normalizedPath !== `${targetStaffPrefix}/profil`
            ) {
              const isAllowed = user.allowedMenus.some((href: string) => {
                const normalizedHref = href.replace(/\/$/, "");
                return normalizedPath === normalizedHref || normalizedPath.startsWith(normalizedHref + "/");
              });
              if (!isAllowed) {
                router.push(targetStaffPrefix);
              }
            }
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
  const isAdmin = userRole === "admin";
  const isPengurus = userRole === "pengurus" || userRole === "komisariat";
  const isInstruktur = userRole === "instruktur";

  const matchRole = pathname ? pathname.match(/^\/(admin|pengurus|instruktur|dashboard)/) : null;
  const staffPrefix = matchRole && matchRole[1] !== "dashboard"
    ? `/${matchRole[1]}`
    : (isAdmin ? "/admin" : isInstruktur ? "/instruktur" : "/pengurus");

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
        ...(isAdmin
          ? [
              {
                groupLabel: "Konfigurasi & Pengaturan",
                items: [
                  { name: "Manajemen Pengguna", href: `${staffPrefix}/pengguna`, icon: ShieldCheck },
                  { name: "Pengaturan Sistem", href: `${staffPrefix}/pengaturan`, icon: Settings },
                ]
              }
            ]
          : [])
      ];

  const filteredGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (isAdmin) return true;
      if (currentUser && Array.isArray(currentUser.allowedMenus) && currentUser.allowedMenus.length > 0) {
        return currentUser.allowedMenus.some((m: string) => {
          const subPath = m.replace(/^\/dashboard/, staffPrefix);
          return item.href === subPath || item.href === m;
        });
      }
      return true;
    })
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
                  PK PMII Ki Ageng Getas Pendawa
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
                      const isActive = pathname === item.href || (item.href !== staffPrefix && pathname.startsWith(item.href + "/"));
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

          {/* Sidebar Footer */}
          <SidebarFooter className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
            <div className="flex flex-col gap-2">
              {/* User Profile Card - Hanya tampil di sidebar jika BUKAN Pengurus (karena Pengurus dipindah ke Navbar) */}
              {!isPengurus && (
                <Link
                  href={`${staffPrefix}/profil`}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors group"
                  title="Lihat & Kelola Profil"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : "AD"}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {currentUser?.name || "Admin PK PMII"}
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 truncate">
                      <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate">
                        {userRole === "admin" ? "Administrator" : currentUser?.role || "Administrator"}
                      </span>
                    </span>
                  </div>
                </Link>
              )}
              
              {/* Logout Button */}
              <Link 
                href="/login" 
                className="w-full"
                onClick={() => {
                  localStorage.removeItem("PMII_LOGGED_IN_USER");
                  localStorage.removeItem("PMII_ACTIVE_COMMISSARIAT");
                  localStorage.removeItem("PMII_ACTIVE_CADRE_ID");
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 h-8 rounded-lg text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors duration-150 group-data-[collapsible=icon]:p-0"
                  title="Keluar Sistem"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">Keluar Sistem</span>
                </Button>
              </Link>
            </div>
          </SidebarFooter>
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
            <div className="flex items-center gap-3">
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
              
              {/* User Profile in Navbar for Pengurus & Anggota */}
              {!isAdmin ? (
                <div className="flex items-center pl-2 border-l border-zinc-200 dark:border-zinc-800">
                  <Link
                    href={`${staffPrefix}/profil`}
                    className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 hover:bg-zinc-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80 transition-all duration-150 cursor-pointer group shadow-2xs"
                    title="Klik untuk membuka Halaman Profil"
                  >
                    <Avatar className="w-7 h-7 rounded-full border border-blue-200 dark:border-blue-900 shrink-0 overflow-hidden">
                      {currentUser?.avatar ? (
                        <AvatarImage src={currentUser.avatar} alt={currentUser.name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                        {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : "PM"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col text-left min-w-0 max-w-[130px] md:max-w-[170px]">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {currentUser?.name || (isAdmin ? "Admin PMII" : isInstruktur ? "Instruktur PMII" : "Pengurus PMII")}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">
                          {isAdmin ? "Administrator" : isInstruktur ? "Tim Instruktur" : isPengurus ? "Pengurus" : userRole === "peserta" ? "Peserta MAPABA" : "Kader Aktif"}
                        </span>
                      </span>
                    </div>
                    <User className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ml-0.5 shrink-0 hidden sm:block" />
                  </Link>
                </div>
              ) : (
                /* Quick Action for Admin */
                <div className="hidden md:flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] font-bold px-2.5 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono tracking-wider select-none text-zinc-600 dark:text-zinc-400">
                    SHIFT + K
                  </span>
                </div>
              )}
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
