import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpsert = vi.fn();
const mockUpdateEq = vi.fn();
const mockDeleteEq = vi.fn();
const mockSelectSingle = vi.fn();

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: vi.fn(() => ({
      upsert: mockUpsert,
      update: vi.fn(() => ({ eq: mockUpdateEq })),
      delete: vi.fn(() => ({ eq: mockDeleteEq })),
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSelectSingle })) })),
    })),
  },
  deleteStorageFile: vi.fn(async () => true),
  clearSupabaseStorage: vi.fn(),
}));

import { saveTableData, updateTableRow, deleteTableRow } from "@/lib/services/core";
import { upsertSurat, upsertSuratTemplate } from "@/lib/services/letters";

describe("DB Resilience: No Silent Failures on Supabase Write Errors", () => {
  beforeEach(() => {
    mockUpsert.mockReset();
    mockUpdateEq.mockReset();
    mockDeleteEq.mockReset();
    mockSelectSingle.mockReset();
    mockSelectSingle.mockResolvedValue({ data: null, error: null });
  });

  it("returns false from saveTableData & upsertSurat when Supabase rejects an upsert (e.g. RLS violation)", async () => {
    mockUpsert.mockResolvedValue({
      error: { code: "42501", message: "new row violates row-level security policy for table \"surat\"" },
    });

    const ok = await upsertSurat({
      id: "11111111-1111-4111-8111-111111111111",
      nomor: "001.PK-XI.2026",
      type: "KELUAR",
      senderOrRecipient: "Rayon Tarbiyah",
      subject: "Undangan",
      date: "2026-11-25",
      classification: "Undangan",
      status: "Terkirim",
      content: "<p>Isi</p>",
    });

    expect(ok).toBe(false);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });

  it("returns true from saveTableData when Supabase upsert succeeds and strips dropped surat_templates columns", async () => {
    mockUpsert.mockResolvedValue({ error: null });

    const ok = await upsertSuratTemplate({
      id: "22222222-2222-4222-8222-222222222222",
      name: "Template Undangan",
      subject: "Should Be Stripped",
      content: "<p>Konten</p>",
      isDocx: true,
      placeholders: ["nomor_surat"],
    });

    expect(ok).toBe(true);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const sentRows = mockUpsert.mock.calls[0][0];
    expect(sentRows[0]).not.toHaveProperty("subject");
  });

  it("returns false when updateTableRow or deleteTableRow fails on Supabase", async () => {
    mockUpdateEq.mockResolvedValue({ error: { message: "permission denied" } });
    mockDeleteEq.mockResolvedValue({ error: { message: "permission denied" } });

    expect(
      await updateTableRow("surat", "11111111-1111-4111-8111-111111111111", { status: "Selesai" })
    ).toBe(false);
    expect(await deleteTableRow("surat", "11111111-1111-4111-8111-111111111111")).toBe(false);
  });

  it("returns false when saveTableData throws a network exception", async () => {
    mockUpsert.mockRejectedValue(new Error("Failed to fetch"));
    const ok = await saveTableData("surat", "", [
      { id: "33333333-3333-4333-8333-333333333333", nomor: "002" },
    ]);
    expect(ok).toBe(false);
  });
});
