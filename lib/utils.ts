import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidUUID(str: string | undefined | null): boolean {
  if (!str || typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createTimestampedId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createUniqueFileName(prefix: string, ext: string): string {
  const safePrefix = (prefix || "file").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
  const safeExt = (ext || "bin").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) || "bin";
  return `${safePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
}

export function createRegistrationCode(prefix: string, digits = 6): string {
  const min = Math.pow(10, Math.max(1, digits - 1));
  const range = Math.pow(10, Math.max(1, digits)) - min;
  const num = Math.floor(min + Math.random() * range);
  return `${prefix}-${num}`;
}
