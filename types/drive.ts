// types/drive.ts
export interface DocumentItem {
  id: string;
  code: string;
  title: string;
  category: string;
  year: string;
  size: string;
  access: "Public" | "Internal" | "Confidential";
  uploadedDate: string;
  uploader: string;
  downloads: number;
  description: string;
  isStarred: boolean;
  parent?: string | null;
  created_at?: string; // Disiapkan agar tidak error NOT NULL saat migrasi ke Supabase
}

export type DriveTab = "MY_DRIVE" | "PUBLIC" | "STARRED" | "RECENT" | "INTERNAL";

export interface FolderItem {
  name: string;
  color: string;
  borderColor: string;
  iconColor: string;
  isLocked?: boolean;
  password?: string;
  parent?: string | null;
}