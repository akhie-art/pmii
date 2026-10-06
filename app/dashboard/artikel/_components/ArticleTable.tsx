import React from "react";
import Image from "next/image";
import { Eye, Edit, Trash2, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatArticleDate } from "@/lib/db";
import type { Article } from "@/lib/db";

interface ArticleTableProps {
  articles: Article[];
  onToggleStatus: (article: Article) => void;
  onOpenPreview: (article: Article) => void;
  onOpenEdit: (article: Article) => void;
  onConfirmDelete: (article: Article) => void;
}

export const ArticleTable: React.FC<ArticleTableProps> = ({
  articles,
  onToggleStatus,
  onOpenPreview,
  onOpenEdit,
  onConfirmDelete
}) => {
  return (
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium">
            <tr>
              <th className="px-4 py-3.5">Artikel & Judul</th>
              <th className="px-4 py-3.5">Kategori</th>
              <th className="px-4 py-3.5">Penulis</th>
              <th className="px-4 py-3.5">Tanggal</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-center">Statistik</th>
              <th className="px-4 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {articles.map((art) => (
              <tr
                key={art.id}
                className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
              >
                {/* Article Title & Cover */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-9 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                      <Image
                        src={art.image}
                        alt={art.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 max-w-xs sm:max-w-md">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 block truncate transition-colors">
                        {art.title}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate block mt-0.5">
                        {art.excerpt}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px]">
                    {art.category}
                  </Badge>
                </td>

                {/* Author */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-[9px] flex items-center justify-center shrink-0">
                      {art.authorInitials || "PM"}
                    </div>
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 block leading-none">
                        {art.authorName}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                        {art.authorRole}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Date */}
                <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                  <span>{formatArticleDate(art.createdAt || (art as any).created_at || art)}</span>
                </td>

                {/* Status */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => onToggleStatus(art)}
                    title="Klik untuk ubah status"
                    className="cursor-pointer"
                  >
                    <Badge
                      className={`text-[10px] font-semibold border ${
                        art.status === "DITAMPILKAN"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                          : art.status === "DRAFT"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      {art.status}
                    </Badge>
                  </button>
                </td>

                {/* Views & Likes */}
                <td className="px-4 py-3 whitespace-nowrap text-center text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center justify-center gap-2">
                    <span className="flex items-center gap-1 font-mono text-[11px]" title="Dibaca">
                      <Eye className="w-3.5 h-3.5 text-zinc-400" />
                      {art.views || 0}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <span className="flex items-center gap-1 font-mono text-[11px] text-rose-600 dark:text-rose-400 font-medium" title="Disukai">
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      {art.likes || 0}
                    </span>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onOpenPreview(art)}
                      className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center transition-colors cursor-pointer"
                      title="Lihat Pratinjau"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenEdit(art)}
                      className="w-7 h-7 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
                      title="Edit Artikel"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onConfirmDelete(art)}
                      className="w-7 h-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                      title="Hapus Artikel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
