import React from "react";
import Image from "next/image";
import { Eye, Edit, Trash2, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatArticleDate } from "@/lib/db";
import type { Article } from "@/lib/db";

interface ArticleGridProps {
  articles: Article[];
  onOpenPreview: (article: Article) => void;
  onOpenEdit: (article: Article) => void;
  onConfirmDelete: (article: Article) => void;
}

export const ArticleGrid: React.FC<ArticleGridProps> = ({
  articles,
  onOpenPreview,
  onOpenEdit,
  onConfirmDelete
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {articles.map((art) => (
        <Card
          key={art.id}
          className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
        >
          <div>
            {/* Image Cover */}
            <div className="relative aspect-[16/10] bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <Image
                src={art.image}
                alt={art.title}
                fill
                className="object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <Badge className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-[10px] font-semibold text-blue-600 dark:text-blue-400 border border-zinc-200/60 dark:border-zinc-800">
                  {art.category}
                </Badge>
              </div>
              <div className="absolute top-3 right-3">
                <Badge
                  className={`text-[9px] font-semibold ${
                    art.status === "DITAMPILKAN"
                      ? "bg-emerald-500 text-white"
                      : art.status === "DRAFT"
                      ? "bg-amber-500 text-white"
                      : "bg-zinc-600 text-white"
                  }`}
                >
                  {art.status}
                </Badge>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatArticleDate(art.createdAt || (art as any).created_at || art)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {art.views || 0}
                </span>
              </div>

              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                {art.title}
              </h3>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                {art.excerpt}
              </p>
            </div>
          </div>

          {/* Card Footer */}
          <div className="p-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-[9px] flex items-center justify-center">
                {art.authorInitials || "PM"}
              </div>
              <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[110px]">
                {art.authorName}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onOpenPreview(art)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
                title="Pratinjau"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onOpenEdit(art)}
                className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                title="Edit"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onConfirmDelete(art)}
                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                title="Hapus"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
