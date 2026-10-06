/**
 * Modul Instrumen Analisis Preferensi Kognitif & Arah Karier Mahasiswa (16 MBTI)
 * Berbasis skenario gaya hidup & situasi sehari-hari yang relate dengan generasi muda / Gen Z.
 */

export interface CareerMBTIProfile {
  talent: string;
  interest: string;
  formulaResult: string;
  role: string;
  description: string;
}

export interface CareerQuestionOption {
  key: string;
  label: string;
  dimension: "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";
}

export interface CareerQuestion {
  id: number;
  category: string;
  question: string;
  options: CareerQuestionOption[];
}

export interface CareerAssessmentResult {
  mbtiCode: string;
  talent: string;
  interest: string;
  formulaResult: string;
  cognitiveType: string;
  careerPath: string;
  strategicRole: string;
  description: string;
  submittedAt: string;
  dimensionScores: {
    E: number;
    I: number;
    S: number;
    N: number;
    T: number;
    F: number;
    J: number;
    P: number;
  };
  answers: Record<number, string>;
}

// 16 Profil MBTI dengan Rumus Standar Resmi:
// =IFS(AC2="INTJ"; "Bakat: Analisis Strategis. Minat: IT, Riset, Sistem."; ...)
export const CAREER_MBTI_PROFILES: Record<string, CareerMBTIProfile> = {
  INTJ: {
    talent: "Analisis Strategis",
    interest: "IT, Riset, Sistem",
    formulaResult: "Bakat: Analisis Strategis. Minat: IT, Riset, Sistem.",
    role: "Tim Perumus Garis Besar Haluan, Perancang Kebijakan Organisasi & Riset Kebijakan Publik",
    description: "Pemikir strategis dengan visi jangka panjang yang tajam, sangat sistematis dalam mengurai persoalan rumit, dan berorientasi pada inovasi struktural."
  },
  INTP: {
    talent: "Logika Teoretis",
    interest: "Programming, Filsafat, Sains",
    formulaResult: "Bakat: Logika Teoretis. Minat: Programming, Filsafat, Sains.",
    role: "Dewan Kajian Pemikiran Filsafat, Riset Teknologi, Intelektual Organik & Dialektika Kritis",
    description: "Intelektual sejati yang mencintai eksplorasi teori ilmiah dan perdebatan filosofis; sangat mendalam dalam membedah konsep logika dan pemecahan masalah kompleks."
  },
  ENTJ: {
    talent: "Kepemimpinan & Eksekusi",
    interest: "Bisnis, Manajemen, Politik",
    formulaResult: "Bakat: Kepemimpinan & Eksekusi. Minat: Bisnis, Manajemen, Politik.",
    role: "Ketua Mandataris, Koordinator Strategis Wilayah & Komandan Eksekutif Organisasi",
    description: "Pemimpin visioner dan berprinsip tegas, berkapabilitas komando tinggi, andal dalam mengorganisir sumber daya manusia dan mengeksekusi visi berskala besar."
  },
  ENTP: {
    talent: "Inovasi & Debat",
    interest: "Startup, Marketing, Konsultan",
    formulaResult: "Bakat: Inovasi & Debat. Minat: Startup, Marketing, Konsultan.",
    role: "Inisiator Proyek Strategis, Hubungan Eksternal, Advokasi Publik & Inkubasi Kader",
    description: "Inovator lincah yang gemar mendobrak kebiasaan lama, piawai berdialektika dan berargumen cerdas, serta jeli melihat ceruk peluang masa depan."
  },
  INFJ: {
    talent: "Visi Humanis",
    interest: "Psikologi, Konseling, Penulis",
    formulaResult: "Bakat: Visi Humanis. Minat: Psikologi, Konseling, Penulis.",
    role: "Biro Kaderisasi Personal, Pendamping Spiritual, Riset Advokasi Sosial & Penulisan Opini",
    description: "Pribadi berempati tinggi dengan intuisi humanis mendalam, berdedikasi membimbing sesama kader dan memperjuangkan nilai-nilai kemanusiaan universal."
  },
  INFP: {
    talent: "Kreativitas Idealis",
    interest: "Seni, Sastra, Kemanusiaan",
    formulaResult: "Bakat: Kreativitas Idealis. Minat: Seni, Sastra, Kemanusiaan.",
    role: "Lembaga Seni Budaya, Redaksi Jurnalistik & Literasi, Advokasi Hak Dasar & Narasi Gerakan",
    description: "Sosok idealis yang dipandu kompas moral dan nurani luhur, memiliki kekayaan imajinasi artistik, dan peka terhadap penderitaan sosial kemasyarakatan."
  },
  ENFJ: {
    talent: "Edukator & Motivator",
    interest: "Pengajar, HRD, Public Relation",
    formulaResult: "Bakat: Edukator & Motivator. Minat: Pengajar, HRD, Public Relation.",
    role: "Instruktur Pelatihan Kader, Master of Training, Hubungan Masyarakat & Pengkader Utama",
    description: "Edukator karismatik yang mampu memantik potensi terbaik orang lain, membangun konsensus harmonis, dan memimpin gerakan dengan penuh ketulusan."
  },
  ENFP: {
    talent: "Komunikasi Kreatif",
    interest: "Content Creator, Event Organizer",
    formulaResult: "Bakat: Komunikasi Kreatif. Minat: Content Creator, Event Organizer.",
    role: "Koordinator Kampanye Media Kreatif, Event Organizer Kaderisasi & Mobilisasi Massa",
    description: "Pribadi antusias, enerjik, dan penuh daya cipta; sangat lihai dalam komunikasi publik, merancang agenda yang menarik, dan menghidupkan antusiasme generasi muda."
  },
  ISTJ: {
    talent: "Manajemen Detail",
    interest: "Akuntansi, Logistik, Administrasi",
    formulaResult: "Bakat: Manajemen Detail. Minat: Akuntansi, Logistik, Administrasi.",
    role: "Sekretaris Jenderal, Bendahara Umum, Biro Administrasi & Audit Internal Organisasi",
    description: "Pilar keandalan organisasi dengan integritas dan ketelitian luar biasa; sangat disiplin menjaga regulasi kelembagaan, kepatuhan jadwal, dan ketertiban tata kelola."
  },
  ISFJ: {
    talent: "Pelayanan & Organisasi",
    interest: "Kesehatan, Sosial, Customer Service",
    formulaResult: "Bakat: Pelayanan & Organisasi. Minat: Kesehatan, Sosial, Customer Service.",
    role: "Biro Kesejahteraan Anggota, Penanggungjawab Logistik & Posko Tanggap Sosial Kader",
    description: "Sosok berdedikasi tinggi yang tulus melayani kebutuhan kelompok, cermat merawat keharmonisan hubungan internal, dan setia pada amanah yang diemban."
  },
  ESTJ: {
    talent: "Implementasi Praktis",
    interest: "Operasional, Militer, Hukum",
    formulaResult: "Bakat: Implementasi Praktis. Minat: Operasional, Militer, Hukum.",
    role: "Ketua Panitia Pelaksana, Komandan Pasukan Pengamanan (Korpri/Kopri), Disiplin Kader",
    description: "Pengarah operasional yang tegas, berorientasi hasil nyata, disiplin terhadap aturan, dan andal memimpin rantai komando kerja di lapangan."
  },
  ESFJ: {
    talent: "Kerjasama Tim",
    interest: "Perhotelan, Pendidikan, Perawat",
    formulaResult: "Bakat: Kerjasama Tim. Minat: Perhotelan, Pendidikan, Perawat.",
    role: "Sie Akomodasi & Konsumsi, Liaison Officer (LO), Keakraban Kader & Pengabdian Masyarakat",
    description: "Pembangun kebersamaan yang hangat, ramah, dan kooperatif; sangat peka terhadap dinamika tim serta mahir menciptakan atmosfer persaudaraan yang rukun."
  },
  ISTP: {
    talent: "Troubleshooting Teknis",
    interest: "Teknik, Mekanik, IT Support",
    formulaResult: "Bakat: Troubleshooting Teknis. Minat: Teknik, Mekanik, IT Support.",
    role: "Tim Perlengkapan Teknis, Operator Multimedia/Sound System & Keamanan Siber",
    description: "Penyelesai masalah taktis yang tenang dan analitis; terampil membaca mekanisme operasional teknis serta cekatan mencari jalan keluar saat darurat."
  },
  ISFP: {
    talent: "Estetika Praktis",
    interest: "Desain Grafis, Fotografi, Kuliner",
    formulaResult: "Bakat: Estetika Praktis. Minat: Desain Grafis, Fotografi, Kuliner.",
    role: "Tim Desain Grafis, Dokumentasi Kreatif & Fotografi, Tata Panggung & Estetika Acara",
    description: "Kader artistik dengan rasa keindahan visual yang tinggi, bersahaja, menikmati realitas momen, dan terampil menuangkan imajinasi ke dalam karya estetis."
  },
  ESTP: {
    talent: "Aksi & Negosiasi",
    interest: "Penjualan, Atlet, Entrepreneur",
    formulaResult: "Bakat: Aksi & Negosiasi. Minat: Penjualan, Atlet, Entrepreneur.",
    role: "Koordinator Aksi Lapangan, Sponsorship & Penggalangan Dana, Lobi Cepat",
    description: "Eksekutor lapangan yang berani mengambil risiko, tanggap situasi darurat, lihai bernegosiasi persuasif, dan bertindak cepat menyelesaikan target."
  },
  ESFP: {
    talent: "Entertainer",
    interest: "Hiburan, Pariwisata, Penyiaran",
    formulaResult: "Bakat: Entertainer. Minat: Hiburan, Pariwisata, Penyiaran.",
    role: "Master of Ceremony (MC), Pemandu Ice Breaking & Yel-Yel, Tim Konten Publikasi Kreatif",
    description: "Pencair suasana yang karismatik dan ceria; piawai membakar semangat forum, mencairkan keheningan, dan membuat proses kaderisasi menjadi hangat dan menggembirakan."
  }
};

// 12 Pertanyaan Relate Gaya Hidup & Keseharian Mahasiswa Gen Z
export const CAREER_QUESTIONS: CareerQuestion[] = [
  // 1-3: Orientasi Energi (Extraversion [E] vs Introversion [I])
  {
    id: 1,
    category: "Recharge Energi (E vs I)",
    question: "Waktu weekend tiba setelah seminggu penuh kuliah dan tugas padat, gimana cara kamu ngecas energi?",
    options: [
      { key: "A", label: "Hangout bareng circle teman, nongkrong di kafe hits, atau jalan-jalan cari keramaian seru.", dimension: "E" },
      { key: "B", label: "Rebahan di kamar, nonton series/film, scroll sosmed, atau me-time tenang sendirian.", dimension: "I" },
    ]
  },
  {
    id: 2,
    category: "Sosialisasi & Lingkungan Baru (E vs I)",
    question: "Pas diajak teman ke acara pesta atau tongkrongan yang isinya banyak orang yang belum kamu kenal, kamu biasanya:",
    options: [
      { key: "A", label: "Antusias dan gampang membaur, langsung ngobrol santai dan cepat akrab sama kenalan baru.", dimension: "E" },
      { key: "B", label: "Cenderung nempel sama teman yang udah kenal, mengamati sekitar dulu sebelum mulai ngobrol.", dimension: "I" },
    ]
  },
  {
    id: 3,
    category: "Ekspresi Pikiran & Curhat (E vs I)",
    question: "Ketika lagi kepikiran ide seru atau punya unek-unek yang ngeganjal di hati, kamu lebih suka:",
    options: [
      { key: "A", label: "Langsung telepon atau ngobrolin langsung ke teman biar plong dan dapat tanggapan instan.", dimension: "E" },
      { key: "B", label: "Mikirin dan mencerna sendiri dulu di kepala, atau nulis di notes/diary sebelum diceritain.", dimension: "I" },
    ]
  },

  // 4-6: Penyerapan Informasi & Persepsi (Sensing [S] vs Intuition [N])
  {
    id: 4,
    category: "Topik Obrolan Nongkrong (S vs N)",
    question: "Topik obrolan di kafe bareng teman yang paling bikin kamu betah ngobrol berjam-jam adalah:",
    options: [
      { key: "A", label: "Cerita pengalaman nyata sehari-hari, rekomendasi tempat hits, film/musik viral, atau gosip seru.", dimension: "S" },
      { key: "B", label: "Membahas teori konspirasi, masa depan AI, filsafat kehidupan, atau mimpi-mimpi besar masa depan.", dimension: "N" },
    ]
  },
  {
    id: 5,
    category: "Beli Barang / Belanja Online (S vs N)",
    question: "Saat mau checkout barang di e-commerce atau beli gadget baru, kamu lebih condong mempertimbangkan:",
    options: [
      { key: "A", label: "Spesifikasi teknis nyata, kegunaan praktis sehari-hari, dan ulasan foto riil para pembeli.", dimension: "S" },
      { key: "B", label: "Konsep keunikan produk, inovasi masa depan, dan nilai estetika yang mencerminkan jati dirimu.", dimension: "N" },
    ]
  },
  {
    id: 6,
    category: "Mengerjakan Tugas Kuliah (S vs N)",
    question: "Waktu dosen ngasih tugas makalah atau proyek kelompok yang instruksinya bebas, kamu biasanya:",
    options: [
      { key: "A", label: "Mencari contoh tugas kating yang sudah terbukti dapat nilai A lalu mengikuti struktur pastinya.", dimension: "S" },
      { key: "B", label: "Bikin konsep eksperimental orisinal yang baru dan belum pernah dibikin orang lain sebelumnya.", dimension: "N" },
    ]
  },

  // 7-9: Pengambilan Keputusan (Thinking [T] vs Feeling [F])
  {
    id: 7,
    category: "Memilih Tempat Makan / Nongkrong (T vs F)",
    question: "Saat kelompok teman bingung milih tempat nongkrong atau makan siang, pertimbangan utamamu:",
    options: [
      { key: "A", label: "Faktor efisiensi — jarak terdekat, harga terjangkau, dan rasio value-for-money yang masuk akal.", dimension: "T" },
      { key: "B", label: "Faktor 'feeling' suka pada pandangan pertama, estetika yang sesuai gayamu, dan bikin hati senang.", dimension: "F" },
    ]
  },
  {
    id: 8,
    category: "Respons Curhatan Teman (T vs F)",
    question: "Pas teman dekatmu datang curhat sambil sedih atau nangis soal masalah yang lagi dialaminya, reaksi pertamamu:",
    options: [
      { key: "A", label: "Menganalisis akar masalahnya dan ngasih solusi logis serta langkah konkret biar masalah cepat beres.", dimension: "T" },
      { key: "B", label: "Dengerin sepenuh hati, memvalidasi perasaannya, meluk/nemenin dia, dan menenangkan emosinya dulu.", dimension: "F" },
    ]
  },
  {
    id: 9,
    category: "Menghadapi Beda Pendapat (T vs F)",
    question: "Kalau ada perdebatan argumen yang cukup sengit sama teman saat kerja kelompok kuliah, sikapmu:",
    options: [
      { key: "A", label: "Fokus ke argumen mana yang paling benar secara logika dan data, walau suasananya jadi agak kaku.", dimension: "T" },
      { key: "B", label: "Berusaha meredam ketegangan dan menjaga suasana hati teman-teman agar relasi tetap hangat dan rukun.", dimension: "F" },
    ]
  },

  // 10-12: Pola Hidup & Eksekusi (Judging [J] vs Perceiving [P])
  {
    id: 10,
    category: "Rencana Liburan / Trip (J vs P)",
    question: "Waktu ngerencanain liburan atau jalan-jalan bareng teman-teman, gaya traveling kamu lebih ke:",
    options: [
      { key: "A", label: "Bikin itinerary rapi dari jauh hari — jadwal jam, rute jelas, dan tiket/penginapan sudah booking pasti.", dimension: "J" },
      { key: "B", label: "Go with the flow — tentukan kota tujuan aja, sisanya spontan mau ke mana sesuai mood di lokasi.", dimension: "P" },
    ]
  },
  {
    id: 11,
    category: "Menuntaskan Tugas Kuliah (J vs P)",
    question: "Gimana kebiasaanmu dalam nuntasin tugas kuliah atau deadline pekerjaan?",
    options: [
      { key: "A", label: "Dicicil teratur dari jauh-jauh hari sesuai jadwal harian biar tenang dan selesai sebelum tenggat.", dimension: "J" },
      { key: "B", label: "Sistem Kebut Semalam (SKS) — justru saat mepet deadline adrenalin dan inspirasi kreatifmu keluar maksimal.", dimension: "P" },
    ]
  },
  {
    id: 12,
    category: "Kerapian Ruang Pribadi (J vs P)",
    question: "Kondisi meja belajar, kamar tidur, atau isi file desktop laptop kamu biasanya:",
    options: [
      { key: "A", label: "Tertata rapi, file dikelompokkan ke folder yang teratur, dan barang-barang ditaruh kembali ke tempatnya.", dimension: "J" },
      { key: "B", label: "Kelihatan berantakan bagi orang lain, tapi di mata kamu itu 'berantakan yang terorganisir' dan kamu hafal letaknya.", dimension: "P" },
    ]
  }
];

export function calculateCareerMBTI(answers: Record<number, string>): CareerAssessmentResult {
  const counts: Record<string, number> = {
    E: 0,
    I: 0,
    S: 0,
    N: 0,
    T: 0,
    F: 0,
    J: 0,
    P: 0
  };

  CAREER_QUESTIONS.forEach((q) => {
    const selectedKey = answers[q.id];
    const opt = q.options.find((o) => o.key === selectedKey);
    if (opt?.dimension && counts[opt.dimension] !== undefined) {
      counts[opt.dimension] += 1;
    }
  });

  const letter1 = counts.E >= counts.I ? "E" : "I";
  const letter2 = counts.S >= counts.N ? "S" : "N";
  const letter3 = counts.T >= counts.F ? "T" : "F";
  const letter4 = counts.J >= counts.P ? "J" : "P";

  const mbtiCode = `${letter1}${letter2}${letter3}${letter4}`;
  const profile = CAREER_MBTI_PROFILES[mbtiCode] || CAREER_MBTI_PROFILES.INTJ;

  const now = new Date();
  const submittedAt =
    now.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) +
    " • " +
    now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return {
    mbtiCode,
    talent: profile.talent,
    interest: profile.interest,
    formulaResult: profile.formulaResult,
    cognitiveType: `${mbtiCode} - ${profile.talent}`,
    careerPath: profile.interest,
    strategicRole: profile.role,
    description: profile.description,
    submittedAt,
    dimensionScores: counts as any,
    answers
  };
}
