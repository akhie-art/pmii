import { GalleryItem } from "./types";
import { KEYS, DEFAULT_GALLERY_ITEMS } from "./defaults";
import { getTableData, saveTableData, deleteTableRow, upsertTableRow } from "./core";
import { deleteStorageFile } from "../supabase";

/**
 * Normalisasi data galeri murni (id, tenant_id, image_url, created_at, updated_at)
 */
function normalizeGalleryItem(item: any): GalleryItem {
  const url = item.imageUrl || item.image_url || "";
  return {
    id: item.id,
    tenant_id: item.tenant_id || item.tenantId || item.commissariatId || "",
    image_url: url,
    imageUrl: url,
    created_at: item.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Mengambil semua data foto galeri dari database 'galeri'
 */
export async function getGalleryItems(
  defaultData: GalleryItem[] = DEFAULT_GALLERY_ITEMS
): Promise<GalleryItem[]> {
  const rawItems = await getTableData<GalleryItem>("galeri", KEYS.GALLERY, defaultData);
  return rawItems.map(normalizeGalleryItem);
}

/**
 * Mengambil data foto galeri khusus untuk tenant / komisariat tertentu
 */
export async function getGalleryByTenant(tenantId: string): Promise<GalleryItem[]> {
  const allItems = await getGalleryItems();
  if (!tenantId || tenantId === "ALL") return allItems;
  return allItems.filter((item) => item.tenant_id === tenantId);
}

/**
 * Menyimpan seluruh data galeri ke database 'galeri'
 */
export async function saveGalleryItems(items: GalleryItem[]): Promise<boolean> {
  const normalized = items.map((item) => {
    const norm = normalizeGalleryItem(item);
    return {
      id: norm.id,
      tenant_id: norm.tenant_id,
      image_url: norm.image_url,
      created_at: norm.created_at,
      updated_at: norm.updated_at
    };
  }) as unknown as GalleryItem[];

  return saveTableData<GalleryItem>("galeri", KEYS.GALLERY, normalized, {
    allowDeletion: true,
    forceWipeAll: true
  });
}

/**
 * Menambahkan atau memperbarui satu foto dokumentasi galeri
 */
export async function upsertGalleryItem(item: GalleryItem): Promise<boolean> {
  const norm = normalizeGalleryItem(item);
  const payload = {
    id: norm.id,
    tenant_id: norm.tenant_id,
    image_url: norm.image_url,
    created_at: norm.created_at,
    updated_at: norm.updated_at
  } as unknown as GalleryItem;

  return upsertTableRow<GalleryItem>("galeri", KEYS.GALLERY, payload);
}

/**
 * Menghapus foto dari galeri database serta menghapus file gambar fisik dari Supabase Storage jika ada
 */
export async function deleteGalleryItem(id: string, imageUrl?: string): Promise<boolean> {
  if (imageUrl) {
    try {
      await deleteStorageFile(imageUrl);
    } catch (e) {
      console.warn("Gagal menghapus file gambar galeri dari storage:", e);
    }
  }
  return deleteTableRow("galeri", id, KEYS.GALLERY);
}
