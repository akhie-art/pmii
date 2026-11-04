"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { safeSignOut } from "@/lib/supabase";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Sun,
  Moon,
  LogOut,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  CreditCard,
  AlertCircle,
  Check,
  ChevronRight,
  Trash2
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

import { normalizeTenantName } from "@/lib/tenancy";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";

export interface PortalNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  timestamp: number;
  unread: boolean;
  type: "registration" | "event" | "graduation" | "profile" | "system";
  link?: string;
  iconType: "success" | "info" | "warning" | "award" | "profile";
}

export default function KaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeCadre, setActiveCadre] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("peserta");
  const [isStaffUser, setIsStaffUser] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<{ name: string; logo: string | null }>({
    name: "PMII Grobogan",
    logo: null,
  });

  // Dynamic notifications state
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const match = pathname ? pathname.match(/^\/(peserta|anggota|kader)/) : null;
  const rolePrefix = match ? `/${match[1]}` : `/${userRole || "peserta"}`;
  const isPeserta = (match ? match[1] : (userRole || "peserta")) === "peserta";

  const fetchPortalNotifications = async (userEmail?: string, userName?: string, isAnggota?: boolean) => {
    try {
      const emailNorm = (userEmail || "").trim().toLowerCase();
      const nameNorm = (userName || "").trim().toLowerCase();

      let readIds: string[] = [];
      try {
        const stored = localStorage.getItem("PMII_READ_NOTIFICATIONS");
        if (stored) readIds = JSON.parse(stored);
      } catch (e) {}

      let deletedIds: string[] = [];
      try {
        const storedDel = localStorage.getItem("PMII_PORTAL_DELETED_NOTIFS");
        if (storedDel) deletedIds = JSON.parse(storedDel);
      } catch (e) {}

      const [allEvents, allRegs] = await Promise.all([
        db.getEvents([]),
        db.getRegistrations([])
      ]);

      const items: PortalNotification[] = [];

      // 1. Pendaftaran kegiatan user
      const userRegs = allRegs.filter((r) =>
        (emailNorm && r.cadreEmail && r.cadreEmail.trim().toLowerCase() === emailNorm) ||
        (nameNorm && r.cadreName && r.cadreName.trim().toLowerCase() === nameNorm)
      );

      const registeredEventIds = new Set(userRegs.map(r => r.eventId));

      userRegs.forEach((reg) => {
        const ev = allEvents.find(e => e.id === reg.eventId);
        const eventTitle = ev?.name || "Kegiatan Kaderisasi";

        if (reg.isGraduated) {
          const id = `notif-grad-${reg.id}`;
          items.push({
            id,
            title: "Piagam & Kelulusan Terbit",
            message: `Selamat! Anda telah dinyatakan lulus pada kegiatan ${eventTitle}. Piagam kelulusan siap dilihat.`,
            time: reg.dateApplied || "Terbaru",
            timestamp: new Date(reg.dateApplied || Date.now()).getTime(),
            unread: !readIds.includes(id),
            type: "graduation",
            link: `${rolePrefix}/kegiatan?event=${reg.eventId}`,
            iconType: "award"
          });
        } else if (reg.status === "APPROVED") {
          const id = `notif-appr-${reg.id}`;
          items.push({
            id,
            title: "Pendaftaran Disetujui",
            message: `Pendaftaran Anda untuk kegiatan ${eventTitle} telah disetujui & diverifikasi panitia.`,
            time: reg.dateApplied || "Terbaru",
            timestamp: new Date(reg.dateApplied || Date.now()).getTime(),
            unread: !readIds.includes(id),
            type: "registration",
            link: `${rolePrefix}/kegiatan?event=${reg.eventId}`,
            iconType: "success"
          });
        } else if (reg.status === "REJECTED") {
          const id = `notif-rej-${reg.id}`;
          items.push({
            id,
            title: "Pendaftaran Perlu Ditinjau",
            message: `Pendaftaran Anda pada kegiatan ${eventTitle} belum disetujui. Hubungi panitia pengurus.`,
            time: reg.dateApplied || "Terbaru",
            timestamp: new Date(reg.dateApplied || Date.now()).getTime(),
            unread: !readIds.includes(id),
            type: "registration",
            link: `${rolePrefix}/kegiatan?event=${reg.eventId}`,
            iconType: "warning"
          });
        } else {
          const id = `notif-pend-${reg.id}`;
          items.push({
            id,
            title: "Pendaftaran Menunggu Screening",
            message: `Formulir dan berkas pendaftaran ${eventTitle} sedang dalam antrean verifikasi pengurus.`,
            time: reg.dateApplied || "Terbaru",
            timestamp: new Date(reg.dateApplied || Date.now()).getTime(),
            unread: !readIds.includes(id),
            type: "registration",
            link: `${rolePrefix}/kegiatan?event=${reg.eventId}`,
            iconType: "info"
          });
        }
      });

      // 2. Agenda kaderisasi yang sedang dibuka
      allEvents
        .filter(ev => ev.status === "OPEN" && !registeredEventIds.has(ev.id))
        .slice(0, 3)
        .forEach(ev => {
          const id = `notif-open-${ev.id}`;
          items.push({
            id,
            title: "Agenda Baru Dibuka",
            message: `Pendaftaran kegiatan ${ev.name} (${ev.level}) resmi dibuka. Klik untuk mendaftarkan diri.`,
            time: ev.date || (ev as any).startDate || "Agenda Baru",
            timestamp: new Date(ev.date || (ev as any).startDate || Date.now()).getTime(),
            unread: !readIds.includes(id),
            type: "event",
            link: `${rolePrefix}/kegiatan?event=${ev.id}`,
            iconType: "info"
          });
        });

      items.sort((a, b) => {
        if (a.unread !== b.unread) return a.unread ? -1 : 1;
        return b.timestamp - a.timestamp;
      });

      setNotifications(items.filter(item => !deletedIds.includes(item.id)));
    } catch (err) {
      console.warn("Failed to load portal notifications:", err);
    }
  };

  const markNotificationAsRead = (id: string, link?: string) => {
    let currentRead: string[] = [];
    try {
      const stored = localStorage.getItem("PMII_READ_NOTIFICATIONS");
      if (stored) currentRead = JSON.parse(stored);
    } catch (e) {}

    if (!currentRead.includes(id)) {
      currentRead.push(id);
      localStorage.setItem("PMII_READ_NOTIFICATIONS", JSON.stringify(currentRead));
    }

    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, unread: false } : n)
    );

    setNotificationsOpen(false);

    if (link) {
      router.push(link);
    }
  };

  const markAllNotificationsAsRead = () => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem("PMII_READ_NOTIFICATIONS", JSON.stringify(allIds));
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const deletePortalNotif = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let deletedIds: string[] = [];
    try {
      const stored = localStorage.getItem("PMII_PORTAL_DELETED_NOTIFS");
      if (stored) deletedIds = JSON.parse(stored);
    } catch (err) {}

    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem("PMII_PORTAL_DELETED_NOTIFS", JSON.stringify(deletedIds));
    }

    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const deleteAllPortalNotifs = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    let deletedIds: string[] = [];
    try {
      const stored = localStorage.getItem("PMII_PORTAL_DELETED_NOTIFS");
      if (stored) deletedIds = JSON.parse(stored);
    } catch (err) {}

    notifications.forEach(n => {
      if (!deletedIds.includes(n.id)) {
        deletedIds.push(n.id);
      }
    });

    localStorage.setItem("PMII_PORTAL_DELETED_NOTIFS", JSON.stringify(deletedIds));
    setNotifications([]);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const activeCadreId = localStorage.getItem("PMII_ACTIVE_CADRE_ID");
      const savedUser = localStorage.getItem("PMII_LOGGED_IN_USER");

      if (!activeCadreId && !savedUser) {
        const fullPath = window.location.pathname + window.location.search;
        router.replace(`/login?redirect=${encodeURIComponent(fullPath)}`);
        return;
      }

      let detectedRole = "peserta";
      let parsedUser: any = null;
      if (savedUser) {
        try {
          parsedUser = JSON.parse(savedUser);
          if (parsedUser?.needsOnboarding) {
            router.replace("/onboarding");
            return;
          }
          const r = (parsedUser?.role || "").toLowerCase();
          if (r === "admin" || r === "pengurus" || r === "komisariat") {
            setIsStaffUser(true);
            router.replace("/dashboard");
            return;
          } else if (r) {
            detectedRole = r;
          }
        } catch (e) {}
      }
      setUserRole(detectedRole);

      // Fast synchronous hydration from local cache so the layout renders instantly without freeze
      if (parsedUser) {
        setActiveCadre({
          id: parsedUser.id || activeCadreId || "cadre-user",
          name: parsedUser.name || "Kader PMII",
          email: parsedUser.email || "",
          level: "MAPABA",
          commissariat: parsedUser.commissariat || "Ki Ageng Getas Pendawa",
          role: parsedUser.role || detectedRole
        });
        if (parsedUser.commissariat) {
          setTenantInfo({
            name: parsedUser.commissariat,
            logo: null,
          });
        }
        setMounted(true);
        fetchPortalNotifications(parsedUser.email, parsedUser.name, (parsedUser.role || detectedRole) === "anggota");
      }

      // Synchronize browser address bar URL cleanly without freezing Next.js App Router
      const path = window.location.pathname;
      if (path === "/kader" || path.startsWith("/kader/")) {
        const target = path.replace(/^\/kader/, `/${detectedRole}`);
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", target + window.location.search);
        }
      } else {
        const matchRole = path.match(/^\/(peserta|anggota)/);
        if (matchRole && matchRole[1] !== detectedRole && (detectedRole === "peserta" || detectedRole === "anggota")) {
          const target = path.replace(/^\/(peserta|anggota)/, `/${detectedRole}`);
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", target + window.location.search);
          }
        }
      }

      const savedTheme = localStorage.getItem("PMII_THEME") || "dark";
      setDarkMode(savedTheme === "dark");

      const loadCadre = async () => {
        const [cadres, commList] = await Promise.all([
          db.getCadres([]),
          db.getCommissariats().catch(() => [])
        ]);

        let found = null;
        let parsedUser: any = null;
        if (savedUser) {
          try {
            parsedUser = JSON.parse(savedUser);
            if (parsedUser?.email) {
              found = cadres.find(c => c.email && c.email.trim().toLowerCase() === parsedUser.email.trim().toLowerCase());
            }
          } catch (e) {}
        }
        if (!found && activeCadreId) {
          found = cadres.find(c => c.id === activeCadreId);
        }

        const targetComm = found?.commissariat || parsedUser?.commissariat || "PMII Grobogan";
        const targetTenantId = found?.tenant_id || (found as any)?.komisariat_id || parsedUser?.tenant_id;
        const targetNorm = normalizeTenantName(targetComm);

        const matchedTenant = commList.find((c: any) =>
          (targetTenantId && (c.id === targetTenantId || c.tenant_id === targetTenantId)) ||
          (c.name && normalizeTenantName(c.name) === targetNorm) ||
          (c.university && normalizeTenantName(c.university) === targetNorm)
        );

        if (matchedTenant) {
          setTenantInfo({
            name: matchedTenant.name,
            logo: matchedTenant.logo || null,
          });
        } else {
          setTenantInfo({
            name: targetComm,
            logo: null,
          });
        }

        if (found) {
          setActiveCadre(found);
          localStorage.setItem("PMII_ACTIVE_CADRE_ID", found.id);
          if (found.role) {
            setUserRole(found.role.toLowerCase());
          }
        } else if (parsedUser) {
          setActiveCadre({
            id: parsedUser.id || "cadre-user",
            name: parsedUser.name || "Kader PMII",
            email: parsedUser.email || "",
            level: "MAPABA",
            commissariat: parsedUser.commissariat || "Ki Ageng Getas Pendawa",
            role: parsedUser.role || detectedRole
          });
        }
        setMounted(true);
        const activeEmail = found?.email || parsedUser?.email;
        const activeName = found?.name || parsedUser?.name;
        const isAnggota = (found?.role || parsedUser?.role || detectedRole) === "anggota";
        fetchPortalNotifications(activeEmail, activeName, isAnggota);
      };

      loadCadre();
    }
  }, [router]);

  // Real-time listener: refresh notifications when data changes in other tabs/pages
  useEffect(() => {
    if (!mounted) return;
    const handleSync = () => {
      const email = activeCadre?.email;
      const name = activeCadre?.name;
      const isAnggota = (activeCadre?.role || userRole) === "anggota";
      fetchPortalNotifications(email, name, isAnggota);
    };

    window.addEventListener("PMII_TABLE_SYNC", handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      window.removeEventListener("PMII_TABLE_SYNC", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [mounted, activeCadre, userRole]);

  useEffect(() => {
    if (!mounted) return;
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("PMII_THEME", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("PMII_THEME", "light");
    }
  }, [darkMode, mounted]);

  const handleLogout = async () => {
    await safeSignOut();
    router.push("/login");
  };

  useEffect(() => {
    if (isPeserta && pathname && (pathname === `${rolePrefix}/materi` || pathname.startsWith(`${rolePrefix}/materi/`) || pathname === "/kader/materi")) {
      router.replace(rolePrefix);
    }
  }, [isPeserta, pathname, rolePrefix, router]);

  const menuItems = [
    { name: "Dashboard", href: rolePrefix, icon: LayoutDashboard },
    { name: "Kegiatan", href: `${rolePrefix}/kegiatan`, icon: Calendar },
    ...(!isPeserta ? [{ name: "Materi Kaderisasi", href: `${rolePrefix}/materi`, icon: BookOpen }] : []),
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse space-y-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 mx-auto" />
          <div className="h-3.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" />
        </div>
      </div>
    );
  }

  const cadreInitials = activeCadre?.name
    ? activeCadre.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "KD";

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200 font-sans w-full relative">
        
        {/* SIDEBAR */}
        <Sidebar collapsible="icon" className="border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-40">
          <SidebarHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 dark:border-zinc-700 p-1 flex items-center justify-center flex-shrink-0 shadow-xs overflow-hidden">
                <img
                  src={tenantInfo.logo || "/image/logo_komsat.png"}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/image/logo_komsat.png";
                  }}
                />
              </div>
              <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  Portal {userRole === "anggota" ? "Anggota" : "Peserta"}
                </h3>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate" title={tenantInfo.name}>
                  {tenantInfo.name}
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-4 space-y-1 overflow-y-auto">
            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== rolePrefix && pathname.startsWith(item.href + "/"));
                    const Icon = item.icon;

                    return (
                      <SidebarMenuItem key={item.name} className="relative py-0.5">
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.name}
                          render={<Link href={item.href} />}
                          className={`w-full flex items-center py-2.5 px-3 rounded-xl transition-colors duration-150 border-none outline-hidden cursor-pointer ${
                            isActive 
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold" 
                              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          }`}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${
                            isActive ? "text-amber-600 dark:text-amber-400" : "text-zinc-400 dark:text-zinc-500"
                          }`} />
                          
                          <span className="text-xs group-data-[collapsible=icon]:hidden font-medium tracking-wide ml-2">
                            {item.name}
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors duration-150 group-data-[collapsible=icon]:p-2"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Keluar</span>
            </button>
          </SidebarFooter>
        </Sidebar>

        {/* MAIN INSET */}
        <SidebarInset className="flex-1 flex flex-col min-w-0 relative z-10 bg-zinc-50 dark:bg-zinc-950 min-h-screen">
          <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30 w-full transition-colors duration-200">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-white cursor-pointer" />
              {isStaffUser && (
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 font-medium border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer shadow-none"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali ke Dashboard</span>
                  </Button>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* NOTIFICATION DROPDOWN */}
              <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer shadow-none relative"
                      title="Pemberitahuan"
                    >
                      <Bell className="w-4 h-4" />
                      {notifications.filter(n => n.unread).length > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-zinc-950 animate-in fade-in zoom-in">
                          {notifications.filter(n => n.unread).length > 9 ? "9+" : notifications.filter(n => n.unread).length}
                        </span>
                      )}
                    </Button>
                  }
                />
                <DropdownMenuContent
                  align="end"
                  className="w-80 sm:w-96 bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 p-0 overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                        Pemberitahuan
                      </span>
                      {notifications.length > 0 && (
                        <span className="text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-800/50">
                          {notifications.length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      {notifications.filter(n => n.unread).length > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsAsRead}
                          className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold cursor-pointer hover:underline flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Tandai dibaca</span>
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={deleteAllPortalNotifs}
                          className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold cursor-pointer hover:underline flex items-center gap-1"
                          title="Hapus semua pemberitahuan"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus Semua</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notification Items List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center px-4 space-y-2">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                          <Bell className="w-5 h-5 opacity-40" />
                        </div>
                        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                          Belum ada pemberitahuan
                        </p>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          Informasi agenda dan status kegiatan Anda akan muncul di sini.
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationAsRead(notif.id, notif.link)}
                          className={`p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 cursor-pointer flex items-start gap-3 transition-colors group ${
                            notif.unread ? "bg-blue-50/30 dark:bg-blue-950/20" : ""
                          }`}
                        >
                          {/* Notification Icon */}
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            notif.iconType === "award"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : notif.iconType === "success"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : notif.iconType === "warning"
                              ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                              : notif.iconType === "profile"
                              ? "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                              : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                          }`}>
                            {notif.iconType === "award" ? (
                              <Award className="w-4 h-4" />
                            ) : notif.iconType === "success" ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : notif.iconType === "warning" ? (
                              <AlertCircle className="w-4 h-4" />
                            ) : notif.iconType === "profile" ? (
                              <CreditCard className="w-4 h-4" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </div>

                          {/* Notification Content */}
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-xs font-bold truncate ${
                                notif.unread ? "text-zinc-900 dark:text-white" : "text-zinc-700 dark:text-zinc-300"
                              }`}>
                                {notif.title}
                              </span>
                              {notif.unread && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-2">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium block pt-0.5">
                              {notif.time}
                            </span>
                          </div>

                          {/* Delete Item Button */}
                          <button
                            type="button"
                            onClick={(e) => deletePortalNotif(notif.id, e)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all opacity-60 group-hover:opacity-100 cursor-pointer shrink-0 mt-0.5"
                            title="Hapus pemberitahuan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-center">
                    <Link
                      href={`${rolePrefix}/kegiatan`}
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1 hover:underline"
                    >
                      <span>Lihat Semua Kegiatan</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setDarkMode(!darkMode)}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer shadow-none"
                title={darkMode ? "Mode Terang" : "Mode Gelap"}
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
              </Button>

              <div className="h-5 w-px bg-zinc-200 dark:border-zinc-800 hidden sm:block" />

              {/* USER INFO IN NAVBAR */}
              <Link
                href={`${rolePrefix}/profil`}
                className="flex items-center gap-2.5 p-1 -mr-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                title="Lihat Profil Saya"
              >
                <Avatar className="w-8 h-8 border border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                  {activeCadre?.avatar && (
                    <AvatarImage src={activeCadre.avatar} alt={activeCadre.name || "Kader"} />
                  )}
                  <AvatarFallback className="bg-blue-600 dark:bg-blue-700 text-white font-bold text-xs">
                    {cadreInitials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold truncate max-w-[160px] text-zinc-900 dark:text-zinc-100">
                    {activeCadre?.name || "Sahabat"}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-blue-600 dark:text-amber-400">
                    {activeCadre?.role || userRole || "Peserta"}
                  </span>
                </div>
              </Link>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-y-auto relative z-10">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
