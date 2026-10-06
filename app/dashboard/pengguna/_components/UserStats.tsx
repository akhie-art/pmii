import React from "react";
import { UserCheck, ShieldCheck, Mail, Building } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { UserAccount } from "@/lib/db";

interface UserStatsProps {
  users: UserAccount[];
}

export const UserStats: React.FC<UserStatsProps> = ({ users }) => {
  const total = users.length;
  const adminCount = users.filter((u) => u.role?.toLowerCase() === "admin").length;
  const pengurusCount = users.filter((u) => u.role?.toLowerCase() === "pengurus" || u.role?.toLowerCase() === "komisariat").length;
  const activeCount = users.filter((u) => u.status === "AKTIF").length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="p-3.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">Total Akun</span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">{total}</span>
          </div>
        </div>
      </Card>

      <Card className="p-3.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">Admin Sistem</span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">{adminCount}</span>
          </div>
        </div>
      </Card>

      <Card className="p-3.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">Pengurus</span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">{pengurusCount}</span>
          </div>
        </div>
      </Card>

      <Card className="p-3.5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">Status Aktif</span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">{activeCount}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
