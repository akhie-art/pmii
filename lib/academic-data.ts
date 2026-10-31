/**
 * Master Data Akademik PMII Cabang Grobogan
 * Meliputi Perguruan Tinggi, Fakultas, dan Program Studi / Jurusan.
 */

export interface FacultyOption {
  name: string;
  majors: string[];
}

export interface UniversityOption {
  name: string;
  faculties: FacultyOption[];
}

export const ACADEMIC_DATA: UniversityOption[] = [
  {
    name: "Sekolah Tinggi Agama Islam Grobogan",
    faculties: [
      {
        name: "-", // Bentuk Sekolah Tinggi tanpa pemisahan fakultas
        majors: [
          "S1 Pendidikan Agama Islam",
          "S1 Pendidikan Guru Madrasah Ibtida’iah",
          "S1 Manajemen Pendidikan Islam",
          "S1 Ekonomi Syari’ah"
        ]
      }
    ]
  },
  {
    name: "Universitas An Nuur",
    faculties: [
      {
        name: "Fakultas Sains dan Kesehatan",
        majors: [
          "S1 Keperawatan",
          "D3 Keperawatan",
          "S1 Kebidanan",
          "S1 Farmasi",
          "S1 Ilmu Komputer"
        ]
      },
      {
        name: "Fakultas Bisnis, Pendidikan dan Terapan",
        majors: [
          "S1 Manajemen",
          "S1 Bahasa Inggris"
        ]
      }
    ]
  }
];

export const UNIVERSITY_NAMES = ACADEMIC_DATA.map((u) => u.name);

/**
 * Mencari konfigurasi universitas berdasarkan nama (toleran terhadap variasi penulisan/singkatan)
 */
export function findUniversity(univName?: string): UniversityOption | undefined {
  if (!univName) return undefined;
  const clean = univName.trim().toLowerCase();

  return ACADEMIC_DATA.find((u) => {
    const target = u.name.toLowerCase();
    if (clean === target) return true;
    if (clean.includes("an nuur") || clean.includes("annuur") || clean.includes("unan")) {
      return target.includes("an nuur");
    }
    if (
      clean.includes("stai") ||
      clean.includes("staig") ||
      clean.includes("ajisaka") ||
      clean.includes("sekolah tinggi agama islam")
    ) {
      return target.includes("sekolah tinggi agama islam");
    }
    return false;
  });
}

/**
 * Mendapatkan daftar nama fakultas untuk suatu perguruan tinggi
 */
export function getFacultiesForUniversity(univName?: string): string[] {
  const univ = findUniversity(univName);
  if (!univ) return [];
  return univ.faculties.map((f) => f.name).filter((name) => name !== "-");
}

/**
 * Mendapatkan daftar jurusan/prodi berdasarkan perguruan tinggi dan fakultas
 */
export function getMajorsForFaculty(univName?: string, facultyName?: string): string[] {
  const univ = findUniversity(univName);
  if (!univ) return [];

  // Jika universitas tidak memiliki fakultas terpisah (seperti STAI Grobogan)
  if (univ.faculties.length === 1 && univ.faculties[0].name === "-") {
    return univ.faculties[0].majors;
  }

  // Jika fakultas dipilih
  if (facultyName) {
    const f = univ.faculties.find(
      (fac) => fac.name.toLowerCase().trim() === facultyName.toLowerCase().trim()
    );
    if (f) return f.majors;
  }

  // Fallback: kembalikan semua prodi di seluruh fakultas universitas tersebut jika belum memilih fakultas
  return univ.faculties.flatMap((f) => f.majors);
}

