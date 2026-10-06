"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { db } from "@/lib/db";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Sun,
  Moon,
  LogOut,
  ArrowLeft
} from "lucide-react";

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
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          const r = (parsed?.role || "").toLowerCase();
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

      // Routing rule: URL must dynamically match the user's role
      const path = window.location.pathname;
      if (path === "/kader" || path.startsWith("/kader/")) {
        const target = path.replace(/^\/kader/, `/${detectedRole}`);
        router.replace(target + window.location.search);
        return;
      }

      // If user is at /peserta but role is anggota (or vice versa), redirect to their actual role URL
      const matchRole = path.match(/^\/(peserta|anggota)/);
      if (matchRole && matchRole[1] !== detectedRole && (detectedRole === "peserta" || detectedRole === "anggota")) {
        const target = path.replace(/^\/(peserta|anggota)/, `/${detectedRole}`);
        router.replace(target + window.location.search);
        return;
      }

      const savedTheme = localStorage.getItem("PMII_THEME") || "dark";
      setDarkMode(savedTheme === "dark");

      const loadCadre = async () => {
        const cadres = await db.getCadres([]);
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
      };

      loadCadre();
    }
  }, [router]);

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

  const handleLogout = () => {
    localStorage.removeItem("PMII_ACTIVE_CADRE_ID");
    localStorage.removeItem("PMII_LOGGED_IN_USER");
    router.push("/login");
  };

  const match = pathname ? pathname.match(/^\/(peserta|anggota|kader)/) : null;
  const rolePrefix = match ? `/${match[1]}` : `/${userRole || "peserta"}`;

  const menuItems = [
    { name: "Dashboard", href: rolePrefix, icon: LayoutDashboard },
    { name: "Kegiatan", href: `${rolePrefix}/kegiatan`, icon: Calendar },
    { name: "Materi Kaderisasi", href: `${rolePrefix}/materi`, icon: BookOpen },
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
                  Portal {userRole === "anggota" ? "Anggota" : "Peserta"}
                </h3>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                  PK PMII Ki Ageng Getas Pendawa
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

            <div className="flex items-center gap-3">
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
