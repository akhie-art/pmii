import { UserAccount } from "./db";

export interface TenantScoped {
  commissariat?: string;
  rayon?: string;
  komisariat?: string; // mapped representation in some parts of the app
}

/**
 * Standardizes name comparison for multi-tenancy to avoid name mismatches
 * (e.g., "Komisariat Walisongo" vs "UIN Walisongo").
 */
function normalizeName(name: string | undefined): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/komisariat|rayon|perguruan\s+tinggi/gi, "")
    .replace(/&/g, "dan")
    .replace(/[\s\-_]/g, "")
    .trim();
}

/**
 * Checks if a specific data record falls within the active user session's tenant scope.
 */
export function isRecordInTenant(user: UserAccount | null, record: TenantScoped): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;

  const userComm = normalizeName(user.commissariat);
  const recordComm = normalizeName(record.commissariat || record.komisariat);

  if (!userComm) return false;

  // Commissariat isolation check
  const commMatch = recordComm.includes(userComm) || userComm.includes(recordComm);

  if (user.role === "KOMISARIAT" || user.role === "PENGURUS" || user.role === "pengurus") {
    return commMatch;
  }

  return true;
}

/**
 * Normalizes write properties before writing to database,
 * forcing non-CABANG users to only write records scoped to their own tenant.
 */
export function enforceTenantWrite<T extends TenantScoped>(user: UserAccount | null, record: T): T {
  if (!user || user.role === "ADMIN") return record;

  const updated: any = { ...record };

  // Set commissariat fields
  if ("komisariat" in record) {
    updated.komisariat = user.commissariat;
  }
  if ("commissariat" in record || !("komisariat" in record)) {
    updated.commissariat = user.commissariat;
  }

  return updated as T;
}
