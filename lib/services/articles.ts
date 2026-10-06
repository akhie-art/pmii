import { Article } from "./types";
import { KEYS, DEFAULT_ARTICLES } from "./defaults";
import { getTableData, saveTableData } from "./core";

export function formatArticleDate(input?: any): string {
  let dateVal: any = input;
  if (typeof input === "object" && input !== null && !(input instanceof Date)) {
    dateVal = input.createdAt || input.created_at || input.date || input.establishedDate;
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
      year: "numeric"
    });

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${dayName}, ${dateFormatted}, pukul ${hours}.${minutes} WIB`;
  } catch {
    return String(dateVal || "");
  }
}

export async function getArticles(): Promise<Article[]> {
  const list = await getTableData<Article>("articles", KEYS.ARTICLES, DEFAULT_ARTICLES);
  return list.map((item: any) => {
    const dateVal = item.createdAt || item.created_at || item.date || new Date().toISOString();
    return {
      ...item,
      createdAt: dateVal,
      created_at: dateVal,
    };
  });
}

export async function saveArticles(articles: Article[]): Promise<boolean> {
  const sanitized = articles.map((item: any) => {
    const dateVal = item.createdAt || item.created_at || item.date || new Date().toISOString();
    return {
      ...item,
      createdAt: dateVal,
      created_at: dateVal,
    };
  });
  return saveTableData<Article>("articles", KEYS.ARTICLES, sanitized);
}

export async function likeArticle(articleId: string): Promise<number> {
  const articles = await getTableData<Article>("articles", KEYS.ARTICLES, DEFAULT_ARTICLES);
  let newLikes = 0;
  const updated = articles.map((a) => {
    if (a.id === articleId || a.slug === articleId) {
      newLikes = (a.likes || 0) + 1;
      return { ...a, likes: newLikes };
    }
    return a;
  });
  await saveTableData<Article>("articles", KEYS.ARTICLES, updated);
  return newLikes;
}
