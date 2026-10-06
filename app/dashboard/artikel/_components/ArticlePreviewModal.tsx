import React from "react";
import Image from "next/image";
import { X, Calendar, Heart, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatArticleDate } from "@/lib/db";
import type { Article } from "@/lib/db";

interface ArticlePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article | null;
}

export const ArticlePreviewModal: React.FC<ArticlePreviewModalProps> = ({
  isOpen,
  onClose,
  article
}) => {
  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl z-10 flex flex-col">
        {/* Cover Image */}
        <div className="relative aspect-[16/9] w-full bg-zinc-100 dark:bg-zinc-800 shrink-0">
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
            aria-label="Tutup pratinjau"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-[10px] font-semibold uppercase py-0.5 px-2">
                {article.category}
              </Badge>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatArticleDate(article.createdAt || (article as any).created_at || article)}
              </span>
              <span className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                {article.likes || 0} Suka
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 leading-snug">
              {article.title}
            </h2>

            {/* Author Bar */}
            <div className="flex items-center gap-3 py-3 border-y border-zinc-100 dark:border-zinc-800">
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-200 dark:border-blue-900">
                {article.authorInitials || "PM"}
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                  {article.authorName}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                  {article.authorRole}
                </span>
              </div>
            </div>
          </div>

          {/* Body Paragraphs with Rich Text Formatting */}
          <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal prose dark:prose-invert max-w-none">
            {Array.isArray(article.content) ? (
              article.content.map((p, idx) => (
                <div key={idx} dangerouslySetInnerHTML={{ __html: p }} />
              ))
            ) : (
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            )}
          </div>

          {/* Tags */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Tagar:</span>
            {article.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 text-[11px] rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between">
            <a
              href={`/artikel/${article.slug || article.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Halaman Baca Publik</span>
            </a>
            <Button
              onClick={onClose}
              variant="outline"
              className="text-xs h-9 px-4 rounded-lg cursor-pointer"
            >
              Tutup Pratinjau
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
