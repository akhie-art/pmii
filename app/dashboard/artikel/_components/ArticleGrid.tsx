import React from "react";
import Image from "next/image";
import { Eye, Edit, Trash2, Calendar, Newspaper, ChevronLeft, ChevronRight, Building2, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatArticleDate } from "@/lib/db";
import type { Article } from "@/lib/db";
import { isCabangRecord } from "@/lib/tenancy";

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
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 9;
  const totalPages = Math.ceil(articles.length / pageSize) || 1;

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [articles.length, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedArticles = articles.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {paginatedArticles.map((art) => (
        <Card
          key={art.id}
          className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
        >
          <div>
            {/* Image Cover */}
            <div className="relative aspect-[16/10] bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
              {art.image ? (
                <Image
                  src={art.image}
                  alt={art.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-400 gap-1 select-none">
                  <Newspaper className="w-7 h-7 text-zinc-400" />
                  <span className="text-[10px] font-medium text-zinc-400">Tanpa Sampul</span>
                </div>
              )}
              <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 max-w-[70%]">
                <Badge className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-[10px] font-semibold text-blue-600 dark:text-blue-400 border border-zinc-200/60 dark:border-zinc-800">
                  {art.category}
                </Badge>
                {isCabangRecord(art) ? (
                  <Badge className="bg-emerald-600/90 text-white backdrop-blur-md text-[9px] font-semibold border-none flex items-center gap-1">
                    <Building2 className="w-2.5 h-2.5" />
                    <span>Cabang</span>
                  </Badge>
                ) : art.commissariat ? (
                  <Badge className="bg-blue-600/90 text-white backdrop-blur-md text-[9px] font-medium truncate max-w-[120px] border-none flex items-center gap-1">
                    <GraduationCap className="w-2.5 h-2.5" />
                    <span>{art.commissariat}</span>
                  </Badge>
                ) : null}
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

      {/* Pagination Footer */}
      {articles.length > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-500 shadow-xs">
          <div>
            Menampilkan <span className="font-semibold text-zinc-700 dark:text-zinc-300">{startIndex + 1}</span>–
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {Math.min(startIndex + pageSize, articles.length)}
            </span> dari{" "}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{articles.length}</span> artikel
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 text-xs px-2.5 rounded-lg cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
              Sebelumnya
            </Button>
            <span className="px-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Hal. {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 text-xs px-2.5 rounded-lg cursor-pointer"
            >
              Selanjutnya
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
