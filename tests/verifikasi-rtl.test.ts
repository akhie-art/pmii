import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_ROLES } from "@/lib/services/roles";
import { isMenuAllowed } from "@/lib/auth-helpers";
import { CABANG_TENANT_ID } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { paginateItems, DEFAULT_PAGE_SIZE_OPTIONS } from "@/components/ui/table-pagination";
import type {
  CadreFollowUp,
  CadreSubmission,
  EventActivity,
  ParticipantEvaluation,
  ParticipantRegistration,
  Requirement,
  UserAccount,
} from "@/lib/db";
import {
  ALLOWED_REQUIREMENT_ACCEPT,
  MAX_REQUIREMENT_FILE_BYTES,
  validateRequirementFile,
  isSafeDocumentUrl,
  isDeadlineOverdue,
  translateSubmissionStatus,
  isRequirementVisibleInScope,
  canManageRequirement,
  filterRequirementsForContext,
  matchCadreForRegistration,
  resolveSubmissionEventContext,
  calculateRtlProgress,
  deriveCadreStatusAfterReview,
  buildRequirementPayload,
  buildUnifiedEventParticipants,
} from "@/app/dashboard/verifikasi/_components/verifikasi-helper";

const KOM_A_ID = "2342112a-7413-4151-9998-3a13e833902f";
const KOM_B_ID = "66467355-3508-4f25-a999-667f9f287d41";

const pengurusKomA: UserAccount = {
  id: "u-kom-a",
  name: "Pengurus Komisariat A",
  email: "pengurus@koma.pmii.id",
  role: "pengurus",
  commissariat: "Komisariat Ajisaka",
  tenant_id: KOM_A_ID,
  komisariat_id: KOM_A_ID,
  status: "AKTIF",
  createdAt: "",
};

const adminCabang: UserAccount = {
  id: "u-cabang",
  name: "Admin Cabang",
  email: "admin@pcpmii.id",
  role: "admin",
  commissariat: "Pengurus Cabang",
  tenant_id: CABANG_TENANT_ID,
  komisariat_id: CABANG_TENANT_ID,
  status: "AKTIF",
  createdAt: "",
};

const sampleEvents: EventActivity[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "MAPABA Komisariat Ajisaka",
    description: "Masa Penerimaan Anggota Baru",
    level: "MAPABA",
    date: "2026-10-01",
    location: "Aula Kampus A",
    commissariat: "Komisariat Ajisaka",
    tenant_id: KOM_A_ID,
    komisariat_id: KOM_A_ID,
    status: "OPEN",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "PKD Komisariat Ajisaka",
    description: "Pelatihan Kader Dasar",
    level: "PKD",
    date: "2026-11-10",
    location: "Aula Kampus A",
    commissariat: "Komisariat Ajisaka",
    tenant_id: KOM_A_ID,
    komisariat_id: KOM_A_ID,
    status: "OPEN",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "MAPABA Komisariat Tarub",
    description: "Masa Penerimaan Anggota Baru",
    level: "MAPABA",
    date: "2026-10-05",
    location: "Aula Kampus B",
    commissariat: "Komisariat Tarub",
    tenant_id: KOM_B_ID,
    komisariat_id: KOM_B_ID,
    status: "OPEN",
  },
];

describe("Verifikasi RTL — Role Access & Route Permission (/pengurus/verifikasi)", () => {
  it("grants /pengurus/verifikasi to pengurus, ketua_komisariat, and pengurus_komisariat in DEFAULT_ROLES", () => {
    const targetRoleCodes = ["pengurus", "ketua_komisariat", "pengurus_komisariat"];
    for (const code of targetRoleCodes) {
      const role = DEFAULT_ROLES.find((r) => r.code === code);
      expect(role, `DEFAULT_ROLES missing ${code}`).toBeDefined();
      expect(role?.allowed_menus).toContain("/pengurus/verifikasi");
      expect(
        isMenuAllowed(
          "/pengurus/verifikasi",
          { role: code, allowedMenus: role?.allowed_menus },
          "/pengurus"
        )
      ).toBe(true);
    }
  });

  it("includes an idempotent Supabase SQL migration granting /pengurus/verifikasi to pengurus roles", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20261128000001_add_verifikasi_menu_to_pengurus_roles.sql"
    );
    expect(fs.existsSync(migrationPath)).toBe(true);
    const sql = fs.readFileSync(migrationPath, "utf8");
    expect(sql).toContain("/pengurus/verifikasi");
    expect(sql).toContain("pengurus_komisariat");
    expect(sql).toContain("ketua_komisariat");
  });
});

describe("Verifikasi RTL — Tenant Isolation & Requirement Management", () => {
  const reqKomA: Requirement = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    title: "Resume Buku Aswaja",
    description: "Ringkas buku Aswaja minimal 3 halaman",
    level: "MAPABA",
    eventId: sampleEvents[0].id,
    category: "Tugas",
    minSubmissions: 1,
    tenant_id: KOM_A_ID,
    komisariat_id: KOM_A_ID,
    commissariat: "Komisariat Ajisaka",
  };

  const reqKomB: Requirement = {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    title: "Esai Gerakan Tarub",
    description: "Tugas internal Komisariat Tarub",
    level: "MAPABA",
    eventId: sampleEvents[2].id,
    category: "Tugas",
    minSubmissions: 1,
    tenant_id: KOM_B_ID,
    komisariat_id: KOM_B_ID,
    commissariat: "Komisariat Tarub",
  };

  const reqGlobalCabang: Requirement = {
    id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc3",
    title: "Standar Kurikulum Cabang MAPABA",
    description: "Tugas wajib tingkat Cabang",
    level: "MAPABA",
    category: "Tugas",
    minSubmissions: 1,
    tenant_id: CABANG_TENANT_ID,
    komisariat_id: CABANG_TENANT_ID,
  };

  it("hides other komisariat requirements from Pengurus Komisariat A", () => {
    expect(
      isRequirementVisibleInScope(reqKomB, pengurusKomA, "Komisariat Ajisaka", sampleEvents)
    ).toBe(false);
    expect(canManageRequirement(reqKomB, pengurusKomA, sampleEvents)).toBe(false);
  });

  it("lets Pengurus Komisariat A manage own requirements and view Cabang global requirements read-only", () => {
    expect(
      isRequirementVisibleInScope(reqKomA, pengurusKomA, "Komisariat Ajisaka", sampleEvents)
    ).toBe(true);
    expect(canManageRequirement(reqKomA, pengurusKomA, sampleEvents)).toBe(true);

    expect(
      isRequirementVisibleInScope(
        reqGlobalCabang,
        pengurusKomA,
        "Komisariat Ajisaka",
        sampleEvents
      )
    ).toBe(true);
    expect(canManageRequirement(reqGlobalCabang, pengurusKomA, sampleEvents)).toBe(false);

    // Admin Cabang dapat mengelola semuanya
    expect(canManageRequirement(reqGlobalCabang, adminCabang, sampleEvents)).toBe(true);
    expect(canManageRequirement(reqKomB, adminCabang, sampleEvents)).toBe(true);
  });

  it("filters requirements strictly by active event and tenant scope", () => {
    const filtered = filterRequirementsForContext(
      [reqKomA, reqKomB, reqGlobalCabang],
      {
        selectedEvent: sampleEvents[0],
        tugasLevelFilter: "PKD", // harus diabaikan saat selectedEvent aktif
        currentUser: pengurusKomA,
        activeTenant: "Komisariat Ajisaka",
        events: sampleEvents,
      }
    );

    expect(filtered.map((r) => r.id)).toEqual([reqKomA.id, reqGlobalCabang.id]);
    expect(filtered.find((r) => r.id === reqKomB.id)).toBeUndefined();
  });

  it("builds valid UUID requirement payloads stamped with Komisariat tenant_id (never CABANG_TENANT_ID)", () => {
    const payload = buildRequirementPayload({
      title: "  Makalah Ke-PMII-an  ",
      description: "  Minimal 1000 kata  ",
      minSubmissions: 2,
      targetEvent: sampleEvents[0],
      currentUser: pengurusKomA,
      activeTenant: "Komisariat Ajisaka",
    });

    expect(payload.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(payload.title).toBe("Makalah Ke-PMII-an");
    expect(payload.minSubmissions).toBe(2);
    expect(payload.tenant_id).toBe(KOM_A_ID);
    expect(payload.tenant_id).not.toBe(CABANG_TENANT_ID);
  });
});

describe("Verifikasi RTL — Progress Calculation & Graduation Logic", () => {
  const req1: Requirement = {
    id: "req-1",
    title: "Resume Buku",
    description: "",
    level: "MAPABA",
    category: "Tugas",
    minSubmissions: 1,
  };
  const req2: Requirement = {
    id: "req-2",
    title: "Kajian Lapangan",
    description: "",
    level: "MAPABA",
    category: "Tugas",
    minSubmissions: 2,
  };

  it("does NOT mark cadre as SELESAI when 2 submissions are approved on the SAME requirement while another requirement has 0", () => {
    const subs: CadreSubmission[] = [
      {
        id: "s-1",
        requirementId: "req-1",
        title: "Laporan 1",
        description: "",
        fileLink: "https://example.com/1.pdf",
        date: "2026-11-01",
        status: "APPROVED",
      },
      {
        id: "s-2",
        requirementId: "req-1",
        title: "Laporan 1 (Duplikat)",
        description: "",
        fileLink: "https://example.com/2.pdf",
        date: "2026-11-02",
        status: "APPROVED",
      },
    ];

    const summary = calculateRtlProgress(subs, [req1, req2]);
    expect(summary.approvedCount).toBe(1);
    expect(summary.totalRequirements).toBe(2);
    expect(summary.progressPercent).toBe(50);
    expect(summary.allCompleted).toBe(false);

    const status = deriveCadreStatusAfterReview({
      updatedSubmissions: subs,
      applicableReqs: [req1, req2],
      reviewStatus: "APPROVED",
    });
    expect(status).toBe("AKTIF");
  });

  it("enforces minSubmissions > 1 and only marks SELESAI when every requirement hits its minimum approved count", () => {
    const partialSubs: CadreSubmission[] = [
      {
        id: "s-1",
        requirementId: "req-1",
        title: "Resume",
        description: "",
        fileLink: "https://example.com/1.pdf",
        date: "2026-11-01",
        status: "APPROVED",
      },
      {
        id: "s-2",
        requirementId: "req-2",
        title: "Kajian 1",
        description: "",
        fileLink: "https://example.com/2.pdf",
        date: "2026-11-02",
        status: "APPROVED",
      },
    ];

    const partial = calculateRtlProgress(partialSubs, [req1, req2]);
    expect(partial.approvedCount).toBe(1);
    expect(partial.progressPercent).toBe(75);
    expect(partial.allCompleted).toBe(false);
    expect(
      deriveCadreStatusAfterReview({
        updatedSubmissions: partialSubs,
        applicableReqs: [req1, req2],
        reviewStatus: "APPROVED",
      })
    ).toBe("AKTIF");

    const completeSubs: CadreSubmission[] = [
      ...partialSubs,
      {
        id: "s-3",
        requirementId: "req-2",
        title: "Kajian 2",
        description: "",
        fileLink: "https://example.com/3.pdf",
        date: "2026-11-03",
        status: "APPROVED",
      },
    ];

    const completed = calculateRtlProgress(completeSubs, [req1, req2]);
    expect(completed.approvedCount).toBe(2);
    expect(completed.progressPercent).toBe(100);
    expect(completed.allCompleted).toBe(true);
    expect(
      deriveCadreStatusAfterReview({
        updatedSubmissions: completeSubs,
        applicableReqs: [req1, req2],
        reviewStatus: "APPROVED",
      })
    ).toBe("SELESAI");
  });

  it("sets status to REVISI whenever a submission is rejected", () => {
    const subs: CadreSubmission[] = [
      {
        id: "s-1",
        requirementId: "req-1",
        title: "Resume",
        description: "",
        fileLink: "https://example.com/1.pdf",
        date: "2026-11-01",
        status: "REJECTED",
        feedback: "Tambahkan daftar pustaka",
      },
    ];

    expect(
      deriveCadreStatusAfterReview({
        updatedSubmissions: subs,
        applicableReqs: [req1],
        reviewStatus: "REJECTED",
      })
    ).toBe("REVISI");
  });
});

describe("Verifikasi RTL — Multi-Event Attribution & Tenant-Safe Cadre Matching", () => {
  const reqPkd: Requirement = {
    id: "req-pkd-1",
    title: "Riset Sosial PKD",
    description: "",
    level: "PKD",
    eventId: sampleEvents[1].id,
    category: "Tugas",
    minSubmissions: 1,
    tenant_id: KOM_A_ID,
  };

  const cadreMultiEvent: CadreFollowUp = {
    id: "cadre-1",
    name: "Ahmad Fauzi",
    email: "ahmad@koma.pmii.id",
    level: "PKD",
    status: "AKTIF",
    tenant_id: KOM_A_ID,
    komisariat_id: KOM_A_ID,
    submissions: [],
  };

  const registrations: ParticipantRegistration[] = [
    {
      id: "reg-mapaba",
      eventId: sampleEvents[0].id,
      cadreName: "Ahmad Fauzi",
      cadreEmail: "ahmad@koma.pmii.id",
      status: "APPROVED",
      dateApplied: "2026-10-01",
      answers: {},
      notes: "",
      verificationStatus: {},
      tenant_id: KOM_A_ID,
    },
    {
      id: "reg-pkd",
      eventId: sampleEvents[1].id,
      cadreName: "Ahmad Fauzi",
      cadreEmail: "ahmad@koma.pmii.id",
      status: "APPROVED",
      dateApplied: "2026-11-10",
      answers: {},
      notes: "",
      verificationStatus: {},
      tenant_id: KOM_A_ID,
    },
  ];

  it("attributes a PKD submission to the PKD event & registration instead of the earlier MAPABA registration", () => {
    const pkdSub: CadreSubmission = {
      id: "sub-pkd",
      requirementId: reqPkd.id,
      title: "Laporan Riset PKD",
      description: "",
      fileLink: "https://example.com/pkd.pdf",
      date: "2026-11-15",
      status: "PENDING",
    };

    const ctx = resolveSubmissionEventContext(
      cadreMultiEvent,
      pkdSub,
      registrations,
      sampleEvents,
      [reqPkd]
    );
    expect(ctx.event?.id).toBe(sampleEvents[1].id);
    expect(ctx.registration?.id).toBe("reg-pkd");
  });

  it("never cross-matches a same-name cadre from another komisariat when email is absent", () => {
    const regOtherTenant: ParticipantRegistration = {
      id: "reg-kom-b",
      eventId: sampleEvents[2].id,
      cadreName: "Ahmad Fauzi",
      cadreEmail: "",
      status: "APPROVED",
      dateApplied: "2026-10-05",
      answers: {},
      notes: "",
      verificationStatus: {},
      tenant_id: KOM_B_ID,
    };

    const matched = matchCadreForRegistration(
      regOtherTenant,
      [cadreMultiEvent],
      sampleEvents[2]
    );
    expect(matched).toBeNull();
  });
});

describe("Verifikasi RTL — File Validation, URL Security & Helpers", () => {
  it("rejects .zip archives and files larger than 10 MB while accepting supported document/image formats", () => {
    expect(ALLOWED_REQUIREMENT_ACCEPT).not.toContain(".zip");

    expect(
      validateRequirementFile({
        name: "arsip.zip",
        size: 1024,
        type: "application/zip",
      })
    ).toMatch(/tidak didukung/i);

    expect(
      validateRequirementFile({
        name: "modul-besar.pdf",
        size: MAX_REQUIREMENT_FILE_BYTES + 1,
        type: "application/pdf",
      })
    ).toMatch(/10 MB/i);

    expect(
      validateRequirementFile({
        name: "panduan-rtl.pdf",
        size: 512_000,
        type: "application/pdf",
      })
    ).toBeNull();

    expect(
      validateRequirementFile({
        name: "soal.docx",
        size: 120_000,
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })
    ).toBeNull();
  });

  it("blocks unsafe XSS URL protocols and allows only safe HTTPS, relative, private-docs, or image/pdf data URLs", () => {
    expect(isSafeDocumentUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeDocumentUrl("JAVASCRIPT:alert(document.cookie)")).toBe(false);
    expect(isSafeDocumentUrl("vbscript:msgbox(1)")).toBe(false);
    expect(isSafeDocumentUrl("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
    expect(isSafeDocumentUrl("//evil.example/payload.pdf")).toBe(false);
    expect(isSafeDocumentUrl("")).toBe(false);

    expect(isSafeDocumentUrl("https://storage.pmii.id/materials/panduan.pdf")).toBe(true);
    expect(isSafeDocumentUrl("private-docs/komisariat-a/laporan.pdf")).toBe(true);
    expect(isSafeDocumentUrl("/uploads/panduan.pdf")).toBe(true);
    expect(isSafeDocumentUrl("data:application/pdf;base64,JVBERi0xLjQK")).toBe(true);
    expect(isSafeDocumentUrl("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
  });

  it("detects overdue deadlines and translates submission statuses into Indonesian", () => {
    const now = new Date("2026-11-28T12:00:00Z");
    expect(isDeadlineOverdue("2026-11-27T23:59:00Z", now)).toBe(true);
    expect(isDeadlineOverdue("2026-11-29T23:59:00Z", now)).toBe(false);
    expect(isDeadlineOverdue(undefined, now)).toBe(false);

    expect(translateSubmissionStatus("APPROVED")).toBe("Disetujui");
    expect(translateSubmissionStatus("REJECTED")).toBe("Perlu Revisi");
    expect(translateSubmissionStatus("PENDING")).toBe("Menunggu");
  });
});

describe("Verifikasi RTL — Unified Participants Merge (Pendaftaran + Penilaian + Laporan RTL)", () => {
  const reqMapabaA: Requirement = {
    id: "req-mapaba-a",
    title: "Resume MAPABA",
    description: "",
    level: "MAPABA",
    eventId: sampleEvents[0].id,
    category: "Tugas",
    minSubmissions: 1,
    tenant_id: KOM_A_ID,
  };

  it("merges and deduplicates participants across registrations, evaluations, and cadres with RTL submissions while excluding REJECTED and other tenants", () => {
    const registrations: ParticipantRegistration[] = [
      {
        id: "reg-1",
        eventId: sampleEvents[0].id,
        cadreName: "Siti Aminah",
        cadreEmail: "siti@koma.pmii.id",
        status: "APPROVED",
        dateApplied: "2026-10-01",
        answers: {},
        notes: "",
        verificationStatus: {},
        tenant_id: KOM_A_ID,
      },
      {
        id: "reg-rejected",
        eventId: sampleEvents[0].id,
        cadreName: "Peserta Ditolak",
        cadreEmail: "ditolak@koma.pmii.id",
        status: "REJECTED",
        dateApplied: "2026-10-01",
        answers: {},
        notes: "",
        verificationStatus: {},
        tenant_id: KOM_A_ID,
      },
      {
        id: "reg-other-tenant",
        eventId: sampleEvents[2].id,
        cadreName: "Peserta Komisariat B",
        cadreEmail: "b@komb.pmii.id",
        status: "APPROVED",
        dateApplied: "2026-10-05",
        answers: {},
        notes: "",
        verificationStatus: {},
        tenant_id: KOM_B_ID,
      },
    ];

    const evaluations: ParticipantEvaluation[] = [
      // Duplikat dari reg-1 -> tidak boleh ganda
      {
        id: "eval-dup",
        activityId: sampleEvents[0].id,
        activityName: sampleEvents[0].name,
        cadreId: "cadre-siti",
        participantName: "Siti Aminah",
        commissariat: "Komisariat Ajisaka",
        tenant_id: KOM_A_ID,
        level: "MAPABA",
        kognitif: 80,
        afektif: 80,
        psikomotorik: 80,
        finalScore: 80,
        grade: "B",
        status: "LULUS",
        evaluatorId: "",
        evaluatorName: "",
        notes: "",
        updatedAt: "2026-10-02",
      },
      // Peserta tambah manual yang ada di evaluations tetapi belum punya baris pendaftaran
      {
        id: "eval-manual",
        activityId: sampleEvents[0].id,
        activityName: sampleEvents[0].name,
        cadreId: "cadre-budi",
        participantName: "Budi Santoso",
        commissariat: "Komisariat Ajisaka",
        tenant_id: KOM_A_ID,
        level: "MAPABA",
        kognitif: 0,
        afektif: 0,
        psikomotorik: 0,
        finalScore: 0,
        grade: "E",
        status: "BELUM_DINILAI",
        evaluatorId: "",
        evaluatorName: "",
        notes: "",
        updatedAt: "2026-10-02",
      },
    ];

    const tenantCadres: CadreFollowUp[] = [
      {
        id: "cadre-siti",
        name: "Siti Aminah",
        email: "siti@koma.pmii.id",
        level: "MAPABA",
        status: "AKTIF",
        tenant_id: KOM_A_ID,
        submissions: [],
      },
      {
        id: "cadre-budi",
        name: "Budi Santoso",
        email: "budi@koma.pmii.id",
        level: "MAPABA",
        status: "AKTIF",
        tenant_id: KOM_A_ID,
        submissions: [],
      },
      // Kader pengunggah RTL tanpa baris pendaftaran / evaluations -> tetap harus tampil di Tab 2
      {
        id: "cadre-rtl-only",
        name: "Rina Kartika",
        email: "rina@koma.pmii.id",
        level: "MAPABA",
        status: "AKTIF",
        tenant_id: KOM_A_ID,
        submissions: [
          {
            id: "sub-rina-1",
            requirementId: reqMapabaA.id,
            title: "Resume Rina",
            description: "",
            fileLink: "https://example.com/rina.pdf",
            date: "2026-10-03",
            status: "APPROVED",
          },
        ],
      },
      // Alumni/anggota lama tanpa pendaftaran, tanpa evaluasi, tanpa submission -> TIDAK boleh memenuhi tabel
      {
        id: "cadre-alumni",
        name: "Senior Alumni",
        email: "alumni@koma.pmii.id",
        level: "MAPABA",
        status: "SELESAI",
        tenant_id: KOM_A_ID,
        submissions: [],
      },
    ];

    const participants = buildUnifiedEventParticipants({
      registrations,
      evaluations,
      tenantCadres,
      tenantEvents: [sampleEvents[0], sampleEvents[1]],
      allEvents: sampleEvents,
      requirements: [reqMapabaA],
      selectedEventId: sampleEvents[0].id,
      selectedEvent: sampleEvents[0],
      currentUser: pengurusKomA,
      activeTenant: "Komisariat Ajisaka",
    });

    expect(participants.map((p) => p.cadreName)).toEqual([
      "Siti Aminah",
      "Budi Santoso",
      "Rina Kartika",
    ]);
    expect(participants[0]).toMatchObject({
      source: "REGISTRATION",
      hasRegistration: true,
      registrationId: "reg-1",
    });
    expect(participants[1]).toMatchObject({
      source: "EVALUATION",
      hasRegistration: false,
      registrationId: null,
    });
    expect(participants[2]).toMatchObject({
      source: "CADRE_SUBMISSION",
      hasRegistration: false,
      status: "SELESAI",
      progressPercent: 100,
    });
  });

  it("includes backfill migration aligning pendaftaran & evaluations tenant_id from kegiatan", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20261128000002_backfill_pendaftaran_tenant_id_from_kegiatan.sql"
    );
    expect(fs.existsSync(migrationPath)).toBe(true);
    const sql = fs.readFileSync(migrationPath, "utf8");
    expect(sql).toContain("UPDATE public.pendaftaran");
    expect(sql).toContain("UPDATE public.evaluations");
    expect(sql).toContain("protect_pendaftaran_privileged_columns");
  });
});

describe("Shared TablePagination — paginateItems (referensi halaman Pengguna)", () => {
  it("exposes standard 10/25/50/100 page size options and slices pages with continuous row offsets", () => {
    expect([...DEFAULT_PAGE_SIZE_OPTIONS]).toEqual([10, 25, 50, 100]);

    const items = Array.from({ length: 27 }, (_, i) => ({ id: i + 1 }));

    const page1 = paginateItems(items, 1, 10);
    expect(page1.safePage).toBe(1);
    expect(page1.totalPages).toBe(3);
    expect(page1.startIndex).toBe(0);
    expect(page1.endIndex).toBe(10);
    expect(page1.paginatedItems.map((x) => x.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    const page2 = paginateItems(items, 2, 10);
    expect(page2.startIndex).toBe(10);
    expect(page2.endIndex).toBe(20);
    expect(page2.paginatedItems[0].id).toBe(11);

    const page3 = paginateItems(items, 3, 10);
    expect(page3.startIndex).toBe(20);
    expect(page3.endIndex).toBe(27);
    expect(page3.paginatedItems).toHaveLength(7);

    // Clamp out-of-range page numbers safely
    const overflow = paginateItems(items, 99, 10);
    expect(overflow.safePage).toBe(3);
    expect(overflow.paginatedItems).toHaveLength(7);

    const empty = paginateItems([], 2, 10);
    expect(empty.safePage).toBe(1);
    expect(empty.totalPages).toBe(1);
    expect(empty.startIndex).toBe(0);
    expect(empty.endIndex).toBe(0);
    expect(empty.paginatedItems).toEqual([]);
  });
});

describe("Verifikasi RTL — Delta Database Service Exports", () => {
  it("exposes O(1) delta helpers on db so verifikasi never relies on full-table upserts or non-deleting saves", () => {
    expect(typeof db.upsertRequirement).toBe("function");
    expect(typeof db.deleteRequirement).toBe("function");
    expect(typeof db.upsertCadre).toBe("function");
    expect(typeof db.updateCadre).toBe("function");
    expect(typeof db.upsertRegistration).toBe("function");
    expect(typeof db.updateRegistration).toBe("function");
  });
});
