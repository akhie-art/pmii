import { describe, it, expect } from "vitest";
import { sanitizeHtml, sanitizeLetterHtml, sanitizeDocumentCss, escapeHtml } from "@/lib/sanitize";
import {
  isUserSuperAdmin,
  isUserAdmin,
  isUserPengurus,
  isUserInstruktur,
  normalizeRole,
  getTargetStaffPrefix,
  isMenuAllowed,
} from "@/lib/auth-helpers";
import {
  normalizeTenantName,
  getKomisariatSlug,
  isCabangOrAdmin,
  CABANG_TENANT_ID,
} from "@/lib/tenancy";
import {
  getUserCredentials,
  getUserPassword,
  setUserPassword,
} from "@/lib/services/credentials";
import {
  readSpreadsheetTo2DArray,
  spreadsheetBufferToSafeHtml,
} from "@/lib/excel";
import {
  isValidUUID,
  generateUUID,
  createTimestampedId,
  createUniqueFileName,
  createRegistrationCode,
} from "@/lib/utils";
import {
  isSafeImageSrc,
  canOptimizeWithNextImage,
} from "@/components/ui/smart-image";

describe("Security: HTML Sanitization & XSS Prevention", () => {
  it("strips script tags, event handlers, and javascript: URIs", () => {
    const malicious =
      '<p>Halo</p><script>alert(1)</script><img src=x onerror="alert(2)" /><a href="javascript:alert(3)">Klik</a><iframe src="https://evil.com"></iframe>';
    const clean = sanitizeHtml(malicious);

    expect(clean).toContain("<p>Halo</p>");
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("onerror");
    expect(clean).not.toContain("javascript:");
    expect(clean).not.toContain("<iframe");
  });

  it("preserves safe formatting tags for articles and official letters", () => {
    const safeHtml =
      '<h2>Judul</h2><p>Paragraf <strong>tebal</strong> dan <em>miring</em>.</p><table><tr><td>Sel</td></tr></table>';
    const clean = sanitizeHtml(safeHtml);

    expect(clean).toContain("<h2>Judul</h2>");
    expect(clean).toContain("<strong>tebal</strong>");
    expect(clean).toContain("<table>");
  });

  it("escapes plain text properly in escapeHtml", () => {
    expect(escapeHtml('<script>"test" & \'x\'</script>')).toBe(
      "&lt;script&gt;&quot;test&quot; &amp; &#39;x&#39;&lt;/script&gt;"
    );
  });

  it("preserves safe letter placeholders & DOCX layout in sanitizeLetterHtml while blocking XSS and malicious CSS", () => {
    const liveHtml =
      '<div data-field="nomor-value" data-evil="1">001</div><span data-placeholder="jabatan" onclick="alert(1)">Ketua</span><script>alert(2)</script>';
    const cleanLive = sanitizeLetterHtml(liveHtml, {
      preservePlaceholders: true,
      preserveDocxLayout: false,
    });
    expect(cleanLive).toContain('data-field="nomor-value"');
    expect(cleanLive).toContain('data-placeholder="jabatan"');
    expect(cleanLive).not.toContain("data-evil");
    expect(cleanLive).not.toContain("onclick");
    expect(cleanLive).not.toContain("<script");

    const docxHtml =
      '<style>@import url("https://evil.com/a.css"); .docx-wrapper > section.docx { width: 210mm; background: url("https://evil.com/track.png"); } .ok { background-image: url("data:image/png;base64,AAAA"); behavior: url(xss.htc); width: expression(alert(1)); }</style><div class="docx-wrapper"><section class="docx"><header>Kop</header><article><p>Isi</p></article><footer>Kaki</footer></section></div><iframe src="https://evil.com"></iframe>';
    const cleanDocx = sanitizeLetterHtml(docxHtml, { preserveDocxLayout: true });
    expect(cleanDocx).toContain("<section class=\"docx\">");
    expect(cleanDocx).toContain("<header>Kop</header>");
    expect(cleanDocx).toContain("<footer>Kaki</footer>");
    expect(cleanDocx).toContain(".docx-wrapper > section.docx");
    expect(cleanDocx).toContain('url("data:image/png;base64,AAAA")');
    expect(cleanDocx).not.toContain("@import");
    expect(cleanDocx).not.toContain("https://evil.com");
    expect(cleanDocx).not.toContain("expression(");
    expect(cleanDocx).not.toContain("behavior:");
    expect(cleanDocx).not.toContain("<iframe");

    expect(sanitizeDocumentCss(".a > .b { color: red; } </style><script>alert(1)</script>")).not.toContain("<");
  });
});

describe("Security: Credentials Store Hardening", () => {
  it("never exposes hardcoded passwords or stores plaintext passwords", () => {
    setUserPassword(["admin@pmii.org", "user-1"], "secret123");
    expect(getUserCredentials()).toEqual({});
    expect(getUserPassword("admin@pmii.org")).toBeUndefined();
    expect(getUserPassword({ email: "admin@pmii.org" })).toBeUndefined();
  });
});

describe("Auth Helpers & Role Normalization", () => {
  it("identifies roles accurately", () => {
    expect(isUserSuperAdmin("superadmin")).toBe(true);
    expect(isUserSuperAdmin("pengurus")).toBe(false);
    expect(isUserAdmin("ketua_cabang")).toBe(true);
    expect(isUserAdmin("pengurus_komisariat")).toBe(false);
    expect(isUserPengurus("pengurus_komisariat")).toBe(true);
    expect(isUserPengurus("admin")).toBe(false);
    expect(isUserInstruktur("instruktur")).toBe(true);
  });

  it("normalizes roles and staff route prefixes", () => {
    expect(normalizeRole("superadmin")).toBe("admin");
    expect(normalizeRole("ketua_komisariat")).toBe("pengurus");
    expect(normalizeRole("instruktur")).toBe("instruktur");
    expect(normalizeRole("calon")).toBe("peserta");
    expect(normalizeRole("anggota")).toBe("anggota");

    expect(getTargetStaffPrefix("admin")).toBe("/admin");
    expect(getTargetStaffPrefix("instruktur")).toBe("/instruktur");
    expect(getTargetStaffPrefix("pengurus")).toBe("/pengurus");
  });

  it("enforces menu access controls", () => {
    expect(isMenuAllowed("/admin/pengguna", null, "/admin")).toBe(false);
    expect(
      isMenuAllowed(
        "/admin/pengguna",
        { role: "superadmin", allowedMenus: [] },
        "/admin"
      )
    ).toBe(true);
    expect(
      isMenuAllowed(
        "/pengurus/pengguna",
        { role: "pengurus", allowedMenus: ["/pengurus/anggota"] },
        "/pengurus"
      )
    ).toBe(false);
    expect(
      isMenuAllowed(
        "/pengurus/anggota",
        { role: "pengurus", allowedMenus: ["/pengurus/anggota"] },
        "/pengurus"
      )
    ).toBe(true);
  });
});

describe("Multi-Tenancy Helpers", () => {
  it("normalizes tenant names and generates clean slugs", () => {
    expect(normalizeTenantName("Komisariat Ki Ageng Getas Pendawa")).toBe(
      "kiagenggetaspendawa"
    );
    expect(getKomisariatSlug("Komisariat Ki Ageng Getas Pendawa")).toBe(
      "ki-ageng-getas-pendawa"
    );
  });

  it("distinguishes cabang admins from komisariat staff", () => {
    expect(
      isCabangOrAdmin({
        id: "1",
        name: "Ketua Cabang",
        email: "cabang@pmii.org",
        role: "admin",
        commissariat: "Pengurus Cabang PMII Grobogan",
        tenant_id: CABANG_TENANT_ID,
        status: "AKTIF",
        createdAt: "",
      })
    ).toBe(true);

    expect(
      isCabangOrAdmin({
        id: "2",
        name: "Ketua Komisariat",
        email: "komisariat@pmii.org",
        role: "pengurus",
        commissariat: "Komisariat Ajisaka",
        tenant_id: "2342112a-7413-4151-9998-3a13e833902f",
        status: "AKTIF",
        createdAt: "",
      })
    ).toBe(false);
  });
});

describe("Spreadsheet Parsing & XSS-Safe Preview (ExcelJS)", () => {
  it("parses CSV buffers cleanly and escapes malicious HTML cells", async () => {
    const csv = 'Nama,Catatan\n"Sahabat Ali","<img src=x onerror=alert(1)>"';
    const encoder = new TextEncoder();
    const buf = encoder.encode(csv).buffer;

    const parsed = await readSpreadsheetTo2DArray(buf, { fileName: "test.csv" });
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[1][0]).toBe("Sahabat Ali");

    const preview = await spreadsheetBufferToSafeHtml(buf, "test.csv");
    expect(preview.htmlTable).not.toContain("<img");
    expect(preview.htmlTable).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });
});

describe("Utility & Safe Image Helpers", () => {
  it("generates and validates UUIDs and unique identifiers cleanly", () => {
    const id = generateUUID();
    expect(isValidUUID(id)).toBe(true);
    expect(isValidUUID("not-a-uuid")).toBe(false);
    expect(isValidUUID(null)).toBe(false);

    expect(createTimestampedId("sub")).toMatch(/^sub-\d+-[a-z0-9]+$/);
    expect(createUniqueFileName("my photo!!", "PNG")).toMatch(/^my_photo__-\d+-[a-z0-9]+\.PNG$/);
    expect(createRegistrationCode("MAP", 6)).toMatch(/^MAP-\d{6}$/);
  });

  it("blocks unsafe image protocols and optimizes only allowed Next.js Image sources", () => {
    expect(isSafeImageSrc("javascript:alert(1)")).toBe(false);
    expect(isSafeImageSrc("//evil.com/x.png")).toBe(false);
    expect(isSafeImageSrc("")).toBe(false);
    expect(isSafeImageSrc("/image/logo_komsat.png")).toBe(true);
    expect(isSafeImageSrc("data:image/png;base64,AAA")).toBe(true);
    expect(isSafeImageSrc("blob:https://pmii.or.id/123")).toBe(true);

    expect(canOptimizeWithNextImage("/image/logo_komsat.png")).toBe(true);
    expect(
      canOptimizeWithNextImage("https://abc.supabase.co/storage/v1/object/public/materials/a.png")
    ).toBe(true);
    expect(
      canOptimizeWithNextImage("https://lh3.googleusercontent.com/a/photo")
    ).toBe(true);
    expect(
      canOptimizeWithNextImage("https://abc.supabase.co/storage/v1/object/sign/private-docs/a.png")
    ).toBe(false);
    expect(canOptimizeWithNextImage("data:image/png;base64,AAA")).toBe(false);
    expect(canOptimizeWithNextImage("https://unconfigured.example.com/pic.jpg")).toBe(false);
  });
});
