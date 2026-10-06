"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DirectKegiatanRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const eventId = params.get("event") || params.get("id");
      const level = params.get("level") || params.get("kaderisasi");

      const activeCadreId = localStorage.getItem("PMII_ACTIVE_CADRE_ID");
      const savedUser = localStorage.getItem("PMII_LOGGED_IN_USER");

      let role = "peserta";
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed?.role) {
            const r = parsed.role.toLowerCase();
            if (r === "admin" || r === "pengurus" || r === "komisariat") {
              role = r === "admin" ? "admin" : "pengurus";
            } else {
              role = r;
            }
          }
        } catch (e) {}
      }

      const targetDestination = eventId
        ? `/${role}/kegiatan?event=${encodeURIComponent(eventId)}`
        : level
        ? `/${role}/kegiatan?level=${encodeURIComponent(level)}`
        : `/${role}/kegiatan`;

      if (!activeCadreId && !savedUser) {
        router.replace(`/login?redirect=${encodeURIComponent(targetDestination)}`);
      } else {
        router.replace(targetDestination);
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center font-sans">
      <div className="animate-pulse space-y-3 text-center">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 mx-auto flex items-center justify-center text-amber-500 font-bold text-xs">
          PMII
        </div>
        <div className="text-xs text-zinc-500 font-medium">Mengarahkan ke pendaftaran kegiatan...</div>
      </div>
    </div>
  );
}
