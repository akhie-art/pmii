"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { db } from "@/lib/db";
import {
  LayoutDashboard,
  Calendar,
  Upload,
  BookOpen,
  Sun,
  Moon,
  LogOut
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const activeCadreId = localStorage.getItem("PMII_ACTIVE_CADRE_ID");
      const savedUser = localStorage.getItem("PMII_LOGGED_IN_USER");

      if (!activeCadreId && !savedUser) {
        const fullPath = window.location.pathname + window.location.search;
        router.replace(`/login?redirect=${encodeURIComponent(fullPath)}`);
        return;
      }

      const savedTheme = localStorage.getItem("PMII_THEME") || "dark";
      setDarkMode(savedTheme === "dark");

      const loadCadre = async () => {
        const cadres = await db.getCadres([]);
        const found = cadres.find(c => c.id === activeCadreId);
        if (found) {
          setActiveCadre(found);
        } else if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            setActiveCadre({
              name: parsed.name || "Kader PMII",
              level: "MAPABA",
              commissariat: parsed.commissariat || "Ki Ageng Getas Pendawa"
            });
          } catch (e) {}
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

  const menuItems = [
    { name: "Dashboard", href: "/kader", icon: LayoutDashboard },
    { name: "Kegiatan", href: "/kader/kegiatan", icon: Calendar },
    { name: "Upload Laporan", href: "/kader/laporan", icon: Upload },
    { name: "Materi Kaderisasi", href: "/kader/materi", icon: BookOpen },
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
          <SidebarContent className="px-3 py-4 space-y-1 overflow-y-auto">
            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/kader" && pathname.startsWith(item.href + "/"));
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

              <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

              {/* USER INFO IN NAVBAR */}
              <Link
                href="/kader/profil"
                className="flex items-center gap-2.5 p-1 -mr-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                title="Lihat Profil Kader"
              >
                <Avatar className="w-8 h-8 border border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                  {activeCadre?.avatar && (
                    <AvatarImage src={activeCadre.avatar} alt={activeCadre.name || "Kader"} />
                  )}
                  <AvatarFallback className="bg-blue-600 dark:bg-blue-700 text-white font-bold text-xs">
                    {cadreInitials}
                  </AvatarFallback>
                </Avatar>
                
                <span className="hidden sm:inline-block text-xs font-bold truncate max-w-[160px] text-zinc-900 dark:text-zinc-100">
                  {activeCadre?.name || "Sahabat Kader"}
                </span>
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
