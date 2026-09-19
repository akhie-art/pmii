// components/DriveBadges.tsx
import React from "react";
import { Globe, Lock, FileCheck, BookOpen, FileText, ShieldCheck, Folder } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DocumentItem } from "@/types/drive";

export const CategoryIcon = ({ category, className = "w-4 h-4" }: { category: string; className?: string }) => {
  switch (category.toLowerCase()) {
    case "sk kepengurusan": return <FileCheck className={`${className} text-emerald-500`} />;
    case "modul kaderisasi": return <BookOpen className={`${className} text-pmii-blue dark:text-sky-400`} />;
    case "ketetapan rapat": return <FileText className={`${className} text-amber-500`} />;
    case "sertifikat & template":
    case "sertifikat": return <ShieldCheck className={`${className} text-purple-500`} />;
    case "publikasi & riset":
    case "publikasi": return <FileText className={`${className} text-rose-500`} />;
    default: return <Folder className={`${className} text-pmii-gold`} />;
  }
};

export const AccessBadge = ({ access }: { access: DocumentItem["access"] }) => {
  switch (access) {
    case "Public":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-[9px] uppercase tracking-wider rounded-md shadow-none px-2 py-0.5 flex items-center gap-1 w-fit">
          <Globe className="w-2.5 h-2.5" /> Publik
        </Badge>
      );
    case "Confidential":
      return (
        <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-black text-[9px] uppercase tracking-wider rounded-md shadow-none px-2 py-0.5 flex items-center gap-1 w-fit">
          <Lock className="w-2.5 h-2.5" /> Rahasia
        </Badge>
      );
    default:
      return (
        <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-black text-[9px] uppercase tracking-wider rounded-md shadow-none px-2 py-0.5 flex items-center gap-1 w-fit">
          <Lock className="w-2.5 h-2.5" /> Internal
        </Badge>
      );
  }
};

export const CategoryBadge = ({ category }: { category: string }) => {
  switch (category.toLowerCase()) {
    case "sk kepengurusan":
      return <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-extrabold rounded-md text-[9.5px] px-1.5 py-0.5">{category}</Badge>;
    case "modul kaderisasi":
      return <Badge className="bg-sky-500/10 text-sky-500 border border-sky-500/20 font-extrabold rounded-md text-[9.5px] px-1.5 py-0.5">{category}</Badge>;
    case "ketetapan rapat":
      return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-extrabold rounded-md text-[9.5px] px-1.5 py-0.5">{category}</Badge>;
    case "sertifikat & template":
    case "sertifikat":
      return <Badge className="bg-purple-500/10 text-purple-500 border border-purple-500/20 font-extrabold rounded-md text-[9.5px] px-1.5 py-0.5">{category}</Badge>;
    case "publikasi & riset":
    case "publikasi":
      return <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 font-extrabold rounded-md text-[9.5px] px-1.5 py-0.5">{category}</Badge>;
    default:
      return <Badge className="bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20 font-extrabold rounded-md text-[9.5px] px-1.5 py-0.5">{category}</Badge>;
  }
};