import React from "react";
import { Users, Edit2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { type BoardMember, getInitials } from "./types";

interface PengurusGridProps {
  filteredMembers: BoardMember[];
  getMemberAvatar: (member?: BoardMember | null) => string;
  onEdit: (member: BoardMember) => void;
  onDelete: (member: BoardMember) => void;
}

export const PengurusGrid: React.FC<PengurusGridProps> = ({
  filteredMembers,
  getMemberAvatar,
  onEdit,
  onDelete
}) => {
  if (filteredMembers.length === 0) {
    return (
      <Card className="p-12 text-center bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
          <Users className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
          Tidak ada pengurus ditemukan
        </h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
          Coba sesuaikan kata pencarian atau filter divisi/status kepengurusan Anda.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredMembers.map((member) => {
        const avatar = getMemberAvatar(member);
        return (
          <motion.div
            key={member.id}
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <Card className="h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl overflow-hidden shadow-none flex flex-col justify-between group transition-colors">
              {/* Department Accent Ribbon */}
              <div
                className={`h-1 w-full ${
                  member.department === "BPH"
                    ? "bg-amber-500"
                    : member.department === "Kaderisasi"
                    ? "bg-blue-600"
                    : member.department === "Keagamaan & Dakwah"
                    ? "bg-emerald-600"
                    : member.department === "Advokasi & Humas"
                    ? "bg-purple-600"
                    : "bg-pink-600"
                }`}
              />

              {/* Card Content */}
              <div className="p-4 space-y-3.5 flex-1">
                <div className="flex items-start justify-between gap-2">
                  {/* Avatar Photo / Initials */}
                  {avatar ? (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-xs">
                      <img
                        src={avatar}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs select-none shadow-xs shrink-0 ${
                        member.gender === "Sahabat"
                          ? "bg-blue-600 dark:bg-blue-700"
                          : "bg-pink-600 dark:bg-pink-700"
                      }`}
                    >
                      {getInitials(member.name)}
                    </div>
                  )}

                  {/* Status Badge & Period */}
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-none border ${
                        member.status === "AKTIF"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-zinc-500/10 border-zinc-500/20 text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {member.status}
                    </Badge>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                      {member.period}
                    </span>
                  </div>
                </div>

                {/* Name & Position */}
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {member.name}
                  </h4>
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                    {member.position}
                  </p>
                </div>

                {/* Division */}
                <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="text-zinc-400">Divisi</span>
                  <Badge
                    variant="outline"
                    className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 font-medium text-[10px] px-1.5 py-0.5"
                  >
                    {member.department}
                  </Badge>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(member)}
                  className="h-7 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md cursor-pointer flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(member)}
                  className="h-7 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus</span>
                </Button>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
