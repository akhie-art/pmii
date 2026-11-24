import { Article } from "./types";
import { KEYS } from "./defaults";
import { getTableData, saveTableData, deleteTableRow } from "./core";
import { supabase, isSupabaseConfigured } from "../supabase";
import { isValidUUID } from "../utils";

export function formatArticleDate(input?: unknown): string {
  let dateVal: unknown = input;
  if (typeof input === "object" && input !== null && !(input instanceof Date)) {
    const obj = input as Record<string, unknown>;
    dateVal = obj.createdAt || obj.created_at || obj.date || obj.establishedDate;
  }

  if (!dateVal) {
    dateVal = new Date();
  }

  try {
    let d: Date;
    if (dateVal instanceof Date) {
      d = dateVal;
    } else {
      d = new Date(String(dateVal));
    }

    if (isNaN(d.getTime())) {
      const parsed = Date.parse(String(dateVal));
      if (!isNaN(parsed)) {
        d = new Date(parsed);
      } else {
        return String(dateVal);
      }
    }

    const dayName = d.toLocaleDateString("id-ID", { weekday: "long" });
    const dateFormatted = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${dayName}, ${dateFormatted}, pukul ${hours}.${minutes} WIB`;
  } catch {
    return String(dateVal || "");
  }
}

export async function getArticles(): Promise<Article[]> {
  const list = await getTableData<Article>("articles", KEYS.ARTICLES, []);
  return list.map((item) => {
    const rec = item as Article & { created_at?: string; date?: string };
    const dateVal = rec.createdAt || rec.created_at || rec.date || new Date().toISOString();
    return {
      ...item,
      createdAt: dateVal,
      created_at: dateVal,
    };
  });
}

export async function saveArticles(articles: Article[]): Promise<boolean> {
  const sanitized = articles.map((item) => {
    const rec = item as Article & { created_at?: string; date?: string };
    const dateVal = rec.createdAt || rec.created_at || rec.date || new Date().toISOString();
    return {
      ...item,
      createdAt: dateVal,
      created_at: dateVal,
    };
  });
  return saveTableData<Article>("articles", KEYS.ARTICLES, sanitized);
}

export async function deleteArticle(articleId: string): Promise<boolean> {
  return deleteTableRow("articles", articleId, KEYS.ARTICLES);
}

export async function incrementArticleViews(articleId: string): Promise<number> {
  if (isSupabaseConfigured && supabase && isValidUUID(articleId)) {
    try {
      const { data, error } = await supabase.rpc("increment_article_views", {
        p_article_id: articleId,
      });
      if (!error && typeof data === "number") return data;
    } catch {}
  }
  return 0;
}

export async function likeArticle(articleId: string, delta: 1 | -1 = 1): Promise<number> {
  if (isSupabaseConfigured && supabase && isValidUUID(articleId)) {
    try {
      const { data, error } = await supabase.rpc("toggle_article_like", {
        p_article_id: articleId,
        p_delta: delta,
      });
      if (!error && typeof data === "number") return data;
    } catch {}
  }
  return 0;
}
