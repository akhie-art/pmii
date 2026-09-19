"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  UserPlus, 
  Filter, 
  Eye, 
  BookOpen, 
  Award, 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  Shield, 
  Download, 
  CreditCard,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  Building,
  GraduationCap,
  Pencil,
  Trash2,
  FileSpreadsheet,
  X,
  Upload,
  Briefcase,
  Activity,
  Compass,
  Check,
  FileText,
  User,
  Heart,
  Camera,
  Plus,
  Trash
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { db } from "@/lib/db";
import type { CadreFollowUp } from "@/lib/db";
import { isRecordInTenant } from "@/lib/tenancy";
import * as XLSX from "xlsx";

// Helper functions for database integration and data synchronization
function mapCadreToMember(c: CadreFollowUp): Member {
  let komisariat = c.commissariat || "PK PMII Ki Ageng Getas Pendawa";

  return {
    id: c.id,
    name: c.name,
    level: c.level,
    komisariat,
    rayon: c.rayon || "",
    angkatan: c.angkatan || "2024",
    status: c.memberStatus || (c.status === "SELESAI" ? "Alumni" : "Aktif"),
    email: c.email || "",
    phone: c.phone || "",
    jabatan: c.jabatan || "Anggota",
    nipa: c.nipa || c.nta || "",
    gender: c.gender || "Laki-laki",
    history: c.history || [
      { level: c.level, date: c.startDate || "", location: c.commissariat || "", status: "Selesai" }
    ],
    provinsi: c.provinsi || "",
    kabupaten: c.kabupaten || "",
    kecamatan: c.kecamatan || "",
    nik: c.nik || "",
    ktpName: c.ktpName || "",
    tempatLahir: c.tempatLahir || "",
    tanggalLahir: c.tanggalLahir || "",
    alamatRumah: c.alamatRumah || c.address || "",
    alamatDomisili: c.alamatDomisili || "",
    pendidikanSD: c.pendidikanSD || "",
    pendidikanSMP: c.pendidikanSMP || "",
    pendidikanSMA: c.pendidikanSMA || "",
    perguruanTinggi: c.perguruanTinggi || "",
    fakultas: c.fakultas || "",
    jurusan: c.jurusan || "",
    ktmName: c.ktmName || "",
    instagram: c.instagram || "",
    twitter: c.twitter || "",
    facebook: c.facebook || "",
    pasFotoName: c.pasFotoName || "",
    riwayatPenyakit: c.riwayatPenyakit || "",
    golonganDarah: c.golonganDarah || "O",
    organisasiSD: c.organisasiSD || "",
    organisasiSMP: c.organisasiSMP || "",
    organisasiSMA: c.organisasiSMA || "",
    organisasiPT: c.organisasiPT || "",
    orientasiProfetik: c.orientasiProfetik || "",
    minatPassion: c.minatPassion || "",
    motivasiMapaba: c.motivasiMapaba || "",
  };
}

function mapMemberToCadre(m: Member): CadreFollowUp {
  let commissariat = m.komisariat || "PK PMII Ki Ageng Getas Pendawa";

  return {
    id: m.id,
    name: m.name,
    level: m.level,
    commissariat: commissariat,
    rayon: m.rayon || "",
    startDate: m.history && m.history[0] ? m.history[0].date : "",
    status: m.status === "Alumni" ? "SELESAI" : "AKTIF",
    submissions: [],
    phone: m.phone,
    email: m.email,
    address: m.alamatRumah,
    instagram: m.instagram,
    isGraduated: m.status === "Alumni",
    nta: m.nipa,
    registrationNumber: m.nipa,
    // Extra fields mapping
    angkatan: m.angkatan,
    memberStatus: m.status,
    jabatan: m.jabatan,
    nipa: m.nipa,
    gender: m.gender,
    history: m.history,
    provinsi: m.provinsi,
    kabupaten: m.kabupaten,
    kecamatan: m.kecamatan,
    nik: m.nik,
    ktpName: m.ktpName,
    tempatLahir: m.tempatLahir,
    tanggalLahir: m.tanggalLahir,
    alamatRumah: m.alamatRumah,
    alamatDomisili: m.alamatDomisili,
    pendidikanSD: m.pendidikanSD,
    pendidikanSMP: m.pendidikanSMP,
    pendidikanSMA: m.pendidikanSMA,
    perguruanTinggi: m.perguruanTinggi,
    fakultas: m.fakultas,
    jurusan: m.jurusan,
    ktmName: m.ktmName,
    twitter: m.twitter,
    facebook: m.facebook,
    pasFotoName: m.pasFotoName,
    riwayatPenyakit: m.riwayatPenyakit,
    golonganDarah: m.golonganDarah,
    organisasiSD: m.organisasiSD,
    organisasiSMP: m.organisasiSMP,
    organisasiSMA: m.organisasiSMA,
    organisasiPT: m.organisasiPT,
    orientasiProfetik: m.orientasiProfetik,
    minatPassion: m.minatPassion,
    motivasiMapaba: m.motivasiMapaba,
  };
}

// Premium 16-Digit NIK Input Component
interface NikInputProps {
  value: string;
  onChange: (value: string) => void;
}

function NikInput({ value, onChange }: NikInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  const handleBoxClick = () => {
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    onChange(rawVal.slice(0, 16));
  };

  return (
    <div className="relative w-full max-w-2xl">
      {/* Hidden input to handle focus, mobile keyboard and paste events */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={16}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      
      {/* 16 Visual Digits Boxes */}
      <div className="flex items-center gap-0.5 sm:gap-1 w-full justify-between select-none">
        {Array.from({ length: 16 }).map((_, index) => {
          const char = value[index] || "";
          const isActive = isFocused && (value.length === index || (index === 15 && value.length === 16));
          const isFilled = char !== "";
          const hasDividerAfter = index === 3 || index === 7 || index === 11;

          return (
            <React.Fragment key={index}>
              <div
                onClick={handleBoxClick}
                className={`flex-1 min-w-0 h-9 sm:h-10 md:h-11 flex items-center justify-center rounded-lg border text-xs md:text-sm font-extrabold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-pmii-gold/5 dark:bg-pmii-gold/5 border-pmii-gold text-pmii-gold ring-2 ring-pmii-gold/20 shadow-none scale-[1.05]"
                    : isFilled
                    ? "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    : "bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600"
                }`}
              >
                {char}
                {isActive && value.length === index && (
                  <span className="w-[1.5px] h-3.5 bg-pmii-gold animate-pulse" />
                )}
              </div>
              {hasDividerAfter && (
                <div className="w-[1px] sm:w-[2px] h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full self-center shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// Define Type interfaces for type safety
interface CadreHistory {
  level: string;
  date: string;
  location: string;
  status: string;
}

interface Member {
  id: string;
  name: string;
  level: "MAPABA" | "PKD" | "PKL";
  komisariat: string;
  rayon?: string;
  angkatan: string;
  status: "Aktif" | "Alumni" | "Pasif";
  email: string;
  phone: string;
  jabatan: string;
  nipa: string;
  gender: "Laki-laki" | "Perempuan";
  history: CadreHistory[];
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  
  // New rich profiles requested by user
  nik?: string;
  ktpName?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  alamatRumah?: string;
  alamatDomisili?: string;
  pendidikanSD?: string;
  pendidikanSMP?: string;
  pendidikanSMA?: string;
  perguruanTinggi?: string;
  fakultas?: string;
  jurusan?: string;
  ktmName?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  pasFotoName?: string;
  riwayatPenyakit?: string;
  golonganDarah?: string;
  organisasiSD?: string;
  organisasiSMP?: string;
  organisasiSMA?: string;
  organisasiPT?: string;
  orientasiProfetik?: string;
  minatPassion?: string;
  motivasiMapaba?: string;
}

export default function AnggotaPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [komisariatFilter, setKomisariatFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          setCurrentUser(user);
          
          // Autofill form based on tenant role
          if (user.role !== "ADMIN") {
            let userComm = user.commissariat || "PK PMII Ki Ageng Getas Pendawa";
            setNewKomisariat(userComm);
          }
        } catch (e) {
          console.error("Error parsing user session", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    const fetchCadres = async () => {
      const dbCadres = await db.getCadres();
      const mapped = dbCadres.map(c => mapCadreToMember(c));
      setMembers(mapped);
    };
    fetchCadres();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, levelFilter, komisariatFilter]);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // States for Adding New Member Form (Standard & New Inputs)
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLevel, setNewLevel] = useState<"MAPABA" | "PKD" | "PKL">("MAPABA");
  const [newKomisariat, setNewKomisariat] = useState("PK PMII Ki Ageng Getas Pendawa");
  const [newAngkatan, setNewAngkatan] = useState("2026");
  const [newGender, setNewGender] = useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newJabatan, setNewJabatan] = useState("Anggota");
  const [newProvinsi, setNewProvinsi] = useState("Jawa Tengah");
  const [newKabupaten, setNewKabupaten] = useState("Kota Semarang");
  const [newKecamatan, setNewKecamatan] = useState("Ngaliyan");

  // Expanded fields states (Add)
  const [newNik, setNewNik] = useState("");
  const [newKtpName, setNewKtpName] = useState("");
  const [newTempatLahir, setNewTempatLahir] = useState("");
  const [newTanggalLahir, setNewTanggalLahir] = useState("");
  const [newAlamatRumah, setNewAlamatRumah] = useState("");
  const [newAlamatDomisili, setNewAlamatDomisili] = useState("");
  const [newPendidikanSD, setNewPendidikanSD] = useState("");
  const [newPendidikanSMP, setNewPendidikanSMP] = useState("");
  const [newPendidikanSMA, setNewPendidikanSMA] = useState("");
  const [newPerguruanTinggi, setNewPerguruanTinggi] = useState("");
  const [newFakultas, setNewFakultas] = useState("");
  const [newJurusan, setNewJurusan] = useState("");
  const [newKtmName, setNewKtmName] = useState("");
  const [newInstagram, setNewInstagram] = useState("");
  const [newTwitter, setNewTwitter] = useState("");
  const [newFacebook, setNewFacebook] = useState("");
  const [newPasFotoName, setNewPasFotoName] = useState("");
  const [newRiwayatPenyakit, setNewRiwayatPenyakit] = useState("");
  const [newGolonganDarah, setNewGolonganDarah] = useState("O");
  const [newOrganisasiSD, setNewOrganisasiSD] = useState("");
  const [newOrganisasiSMP, setNewOrganisasiSMP] = useState("");
  const [newOrganisasiSMA, setNewOrganisasiSMA] = useState("");
  const [newOrganisasiPT, setNewOrganisasiPT] = useState("");
  const [newOrientasiProfetik, setNewOrientasiProfetik] = useState("");
  const [newMinatPassion, setNewMinatPassion] = useState("");
  const [newMotivasiMapaba, setNewMotivasiMapaba] = useState("");

  const [activeAddTab, setActiveAddTab] = useState("diri");

  // States for Editing Member Form & Delete Action
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLevel, setEditLevel] = useState<"MAPABA" | "PKD" | "PKL">("MAPABA");
  const [editKomisariat, setEditKomisariat] = useState("");
  const [editAngkatan, setEditAngkatan] = useState("");
  const [editGender, setEditGender] = useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editJabatan, setEditJabatan] = useState("");
  const [editStatus, setEditStatus] = useState<"Aktif" | "Alumni" | "Pasif">("Aktif");
  const [editProvinsi, setEditProvinsi] = useState("");
  const [editKabupaten, setEditKabupaten] = useState("");
  const [editKecamatan, setEditKecamatan] = useState("");

  // Expanded fields states (Edit)
  const [editNik, setEditNik] = useState("");
  const [editKtpName, setEditKtpName] = useState("");
  const [editTempatLahir, setEditTempatLahir] = useState("");
  const [editTanggalLahir, setEditTanggalLahir] = useState("");
  const [editAlamatRumah, setEditAlamatRumah] = useState("");
  const [editAlamatDomisili, setEditAlamatDomisili] = useState("");
  const [editPendidikanSD, setEditPendidikanSD] = useState("");
  const [editPendidikanSMP, setEditPendidikanSMP] = useState("");
  const [editPendidikanSMA, setEditPendidikanSMA] = useState("");
  const [editPerguruanTinggi, setEditPerguruanTinggi] = useState("");
  const [editFakultas, setEditFakultas] = useState("");
  const [editJurusan, setEditJurusan] = useState("");
  const [editKtmName, setEditKtmName] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editTwitter, setEditTwitter] = useState("");
  const [editFacebook, setEditFacebook] = useState("");
  const [editPasFotoName, setEditPasFotoName] = useState("");
  const [editRiwayatPenyakit, setEditRiwayatPenyakit] = useState("");
  const [editGolonganDarah, setEditGolonganDarah] = useState("O");
  const [editOrganisasiSD, setEditOrganisasiSD] = useState("");
  const [editOrganisasiSMP, setEditOrganisasiSMP] = useState("");
  const [editOrganisasiSMA, setEditOrganisasiSMA] = useState("");
  const [editOrganisasiPT, setEditOrganisasiPT] = useState("");
  const [editOrientasiProfetik, setEditOrientasiProfetik] = useState("");
  const [editMinatPassion, setEditMinatPassion] = useState("");
  const [editMotivasiMapaba, setEditMotivasiMapaba] = useState("");

  const [activeEditTab, setActiveEditTab] = useState("diri");

  // Active tab state for Details Dialog
  const [activeDetailTab, setActiveDetailTab] = useState("diri");

  // Simulated file upload status states for Add Form
  const [newKtpUploading, setNewKtpUploading] = useState(false);
  const [newKtpProgress, setNewKtpProgress] = useState(0);
  const [newKtmUploading, setNewKtmUploading] = useState(false);
  const [newKtmProgress, setNewKtmProgress] = useState(0);
  const [newPasFotoUploading, setNewPasFotoUploading] = useState(false);
  const [newPasFotoProgress, setNewPasFotoProgress] = useState(0);

  // Simulated file upload status states for Edit Form
  const [editKtpUploading, setEditKtpUploading] = useState(false);
  const [editKtpProgress, setEditKtpProgress] = useState(0);
  const [editKtmUploading, setEditKtmUploading] = useState(false);
  const [editKtmProgress, setEditKtmProgress] = useState(0);
  const [editPasFotoUploading, setEditPasFotoUploading] = useState(false);
  const [editPasFotoProgress, setEditPasFotoProgress] = useState(0);

  // Simulated uploading logic helper
  const simulateUpload = (type: "ktp" | "ktm" | "pasFoto", isEdit: boolean, filename: string) => {
    const setUploading = type === "ktp" 
      ? (isEdit ? setEditKtpUploading : setNewKtpUploading)
      : type === "ktm"
      ? (isEdit ? setEditKtmUploading : setNewKtmUploading)
      : (isEdit ? setEditPasFotoUploading : setNewPasFotoUploading);

    const setProgress = type === "ktp"
      ? (isEdit ? setEditKtpProgress : setNewKtpProgress)
      : type === "ktm"
      ? (isEdit ? setEditKtmProgress : setNewKtmProgress)
      : (isEdit ? setEditPasFotoProgress : setNewPasFotoProgress);

    const setName = type === "ktp"
      ? (isEdit ? setEditKtpName : setNewKtpName)
      : type === "ktm"
      ? (isEdit ? setEditKtmName : setNewKtmName)
      : (isEdit ? setEditPasFotoName : setNewPasFotoName);

    setUploading(true);
    setProgress(0);
    setName(filename);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 25) + 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploading(false);
      }
      setProgress(progress);
    }, 120);
  };


  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Premium Features: KTA Theme & Action Toast Notification
  const [ktaTheme, setKtaTheme] = useState<"gold" | "emerald" | "dark">("gold");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Helper to trigger actions notifications
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Helper to start the edit dialog
  const startEditMember = (member: Member) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditLevel(member.level);
    setEditKomisariat(member.komisariat);
    setEditAngkatan(member.angkatan);
    setEditGender(member.gender);
    setEditEmail(member.email);
    setEditPhone(member.phone);
    setEditJabatan(member.jabatan);
    setEditStatus(member.status);
    setEditProvinsi(member.provinsi);
    setEditKabupaten(member.kabupaten);
    setEditKecamatan(member.kecamatan);
    
    // Set expanded fields states (Edit)
    setEditNik(member.nik || "");
    setEditKtpName(member.ktpName || "");
    setEditTempatLahir(member.tempatLahir || "");
    setEditTanggalLahir(member.tanggalLahir || "");
    setEditAlamatRumah(member.alamatRumah || "");
    setEditAlamatDomisili(member.alamatDomisili || "");
    setEditPendidikanSD(member.pendidikanSD || "");
    setEditPendidikanSMP(member.pendidikanSMP || "");
    setEditPendidikanSMA(member.pendidikanSMA || "");
    setEditPerguruanTinggi(member.perguruanTinggi || "");
    setEditFakultas(member.fakultas || "");
    setEditJurusan(member.jurusan || "");
    setEditKtmName(member.ktmName || "");
    setEditInstagram(member.instagram || "");
    setEditTwitter(member.twitter || "");
    setEditFacebook(member.facebook || "");
    setEditPasFotoName(member.pasFotoName || "");
    setEditRiwayatPenyakit(member.riwayatPenyakit || "");
    setEditGolonganDarah(member.golonganDarah || "O");
    setEditOrganisasiSD(member.organisasiSD || "");
    setEditOrganisasiSMP(member.organisasiSMP || "");
    setEditOrganisasiSMA(member.organisasiSMA || "");
    setEditOrganisasiPT(member.organisasiPT || "");
    setEditOrientasiProfetik(member.orientasiProfetik || "");
    setEditMinatPassion(member.minatPassion || "");
    setEditMotivasiMapaba(member.motivasiMapaba || "");
    
    setActiveEditTab("diri");
    setIsEditOpen(true);
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.nipa.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === "ALL" || member.level === levelFilter;
    
    // Strict multi-tenancy filtering
    const matchesTenant = isRecordInTenant(currentUser, {
      commissariat: member.komisariat
    });

    const matchesKomisariat = komisariatFilter === "ALL" || member.komisariat === komisariatFilter;

    return matchesSearch && matchesLevel && matchesTenant && (currentUser?.role === "ADMIN" ? matchesKomisariat : true);
  });

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMembers = filteredMembers.slice(indexOfFirstItem, indexOfLastItem);

  // Handle Add Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const newNipa = `PMII.${newAngkatan}.11.${
      newKomisariat.includes("Walisongo") ? "05" : newKomisariat.includes("Diponegoro") ? "02" : "03"
    }.${String(members.length + 1).padStart(4, "0")}`;

    const newStartDate = `Mar ${newAngkatan}`;
    const newHistory: CadreHistory[] = [
      {
        level: newLevel,
        date: newStartDate,
        location: newKomisariat,
        status: "Selesai"
      }
    ];

    if (newLevel === "PKD") {
      newHistory.push({
        level: "PKD",
        date: `Jul ${newAngkatan}`,
        location: newKomisariat,
        status: "Selesai"
      });
    } else if (newLevel === "PKL") {
      newHistory.push({
        level: "PKD",
        date: `Jul ${newAngkatan}`,
        location: newKomisariat,
        status: "Selesai"
      });
      newHistory.push({
        level: "PKL",
        date: `Nov ${newAngkatan}`,
        location: "PKC Jawa Tengah",
        status: "Selesai"
      });
    }

    const createdMember: Member = {
      id: String(members.length + 1),
      name: newName,
      level: newLevel,
      komisariat: newKomisariat,
      angkatan: newAngkatan,
      status: "Aktif",
      email: newEmail,
      phone: newPhone || "+62 812-0000-0000",
      jabatan: newJabatan,
      nipa: newNipa,
      gender: newGender,
      history: newHistory,
      provinsi: newProvinsi,
      kabupaten: newKabupaten,
      kecamatan: newKecamatan,
      nik: newNik,
      ktpName: newKtpName,
      tempatLahir: newTempatLahir,
      tanggalLahir: newTanggalLahir,
      alamatRumah: newAlamatRumah,
      alamatDomisili: newAlamatDomisili,
      pendidikanSD: newPendidikanSD,
      pendidikanSMP: newPendidikanSMP,
      pendidikanSMA: newPendidikanSMA,
      perguruanTinggi: newPerguruanTinggi,
      fakultas: newFakultas,
      jurusan: newJurusan,
      ktmName: newKtmName,
      instagram: newInstagram,
      twitter: newTwitter,
      facebook: newFacebook,
      pasFotoName: newPasFotoName,
      riwayatPenyakit: newRiwayatPenyakit,
      golonganDarah: newGolonganDarah,
      organisasiSD: newOrganisasiSD,
      organisasiSMP: newOrganisasiSMP,
      organisasiSMA: newOrganisasiSMA,
      organisasiPT: newOrganisasiPT,
      orientasiProfetik: newOrientasiProfetik,
      minatPassion: newMinatPassion,
      motivasiMapaba: newMotivasiMapaba
    };

    const updatedList = [createdMember, ...members];
    setMembers(updatedList);
    db.saveCadres(updatedList.map(m => mapMemberToCadre(m)));
    showToast(`Sahabat ${newName} berhasil didaftarkan!`);
    
    // Reset Form
    setNewName("");
    setNewLevel("MAPABA");
    setNewEmail("");
    setNewPhone("");
    setNewJabatan("Anggota");
    setNewProvinsi("Jawa Tengah");
    setNewKabupaten("Kota Semarang");
    setNewKecamatan("Ngaliyan");
    setNewNik("");
    setNewKtpName("");
    setNewTempatLahir("");
    setNewTanggalLahir("");
    setNewAlamatRumah("");
    setNewAlamatDomisili("");
    setNewPendidikanSD("");
    setNewPendidikanSMP("");
    setNewPendidikanSMA("");
    setNewPerguruanTinggi("");
    setNewFakultas("");
    setNewJurusan("");
    setNewKtmName("");
    setNewInstagram("");
    setNewTwitter("");
    setNewFacebook("");
    setNewPasFotoName("");
    setNewRiwayatPenyakit("");
    setNewGolonganDarah("O");
    setNewOrganisasiSD("");
    setNewOrganisasiSMP("");
    setNewOrganisasiSMA("");
    setNewOrganisasiPT("");
    setNewOrientasiProfetik("");
    setNewMinatPassion("");
    setNewMotivasiMapaba("");
    setActiveAddTab("diri");
    setIsAddOpen(false);
  };

  // Handle Save Edit Member
  const handleSaveEditMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName.trim() || !editEmail.trim()) return;

    const updatedList = members.map((member) => {
      if (member.id === editingMember.id) {
        return {
          ...member,
          name: editName,
          level: editLevel,
          komisariat: editKomisariat,
          angkatan: editAngkatan,
          gender: editGender,
          email: editEmail,
          phone: editPhone,
          jabatan: editJabatan,
          status: editStatus,
          provinsi: editProvinsi,
          kabupaten: editKabupaten,
          kecamatan: editKecamatan,
          nik: editNik,
          ktpName: editKtpName,
          tempatLahir: editTempatLahir,
          tanggalLahir: editTanggalLahir,
          alamatRumah: editAlamatRumah,
          alamatDomisili: editAlamatDomisili,
          pendidikanSD: editPendidikanSD,
          pendidikanSMP: editPendidikanSMP,
          pendidikanSMA: editPendidikanSMA,
          perguruanTinggi: editPerguruanTinggi,
          fakultas: editFakultas,
          jurusan: editJurusan,
          ktmName: editKtmName,
          instagram: editInstagram,
          twitter: editTwitter,
          facebook: editFacebook,
          pasFotoName: editPasFotoName,
          riwayatPenyakit: editRiwayatPenyakit,
          golonganDarah: editGolonganDarah,
          organisasiSD: editOrganisasiSD,
          organisasiSMP: editOrganisasiSMP,
          organisasiSMA: editOrganisasiSMA,
          organisasiPT: editOrganisasiPT,
          orientasiProfetik: editOrientasiProfetik,
          minatPassion: editMinatPassion,
          motivasiMapaba: editMotivasiMapaba
        };
      }
      return member;
    });

    setMembers(updatedList);
    db.saveCadres(updatedList.map(m => mapMemberToCadre(m)));

    setIsEditOpen(false);
    showToast(`Profil ${editName} berhasil diperbarui!`);
    setEditingMember(null);
  };

  // Handle Delete Member
  const handleDeleteMember = (id: string) => {
    const memberName = deletingMember?.name || "Kader";
    const updatedList = members.filter((member) => member.id !== id);
    setMembers(updatedList);
    db.saveCadres(updatedList.map(m => mapMemberToCadre(m)));

    setIsDeleteOpen(false);
    showToast(`${memberName} berhasil dihapus dari database!`);
    setDeletingMember(null);
  };

  // Handle Export Excel
  const handleExportExcel = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        // Headers for the Excel sheet
        const headers = [
          "NIPA/NTA",
          "Nama Lengkap",
          "Gender",
          "Tingkat Kaderisasi",
          "Komisariat",
          "Angkatan",
          "Status",
          "Jabatan",
          "Email",
          "Phone",
          "NIK",
          "Tempat Lahir",
          "Tanggal Lahir",
          "Alamat Rumah",
          "Alamat Domisili",
          "Perguruan Tinggi",
          "Fakultas",
          "Jurusan",
          "Golongan Darah",
          "Riwayat Penyakit"
        ];

        // Map filteredMembers data to rows (respecting current filters & tenancy constraints)
        const rows = filteredMembers.map(m => ({
          "NIPA/NTA": m.nipa || "-",
          "Nama Lengkap": m.name || "-",
          "Gender": m.gender || "-",
          "Tingkat Kaderisasi": m.level || "-",
          "Komisariat": m.komisariat || "-",
          "Angkatan": m.angkatan || "-",
          "Status": m.status || "-",
          "Jabatan": m.jabatan || "-",
          "Email": m.email || "-",
          "Phone": m.phone || "-",
          "NIK": m.nik || "-",
          "Tempat Lahir": m.tempatLahir || "-",
          "Tanggal Lahir": m.tanggalLahir || "-",
          "Alamat Rumah": m.alamatRumah || "-",
          "Alamat Domisili": m.alamatDomisili || "-",
          "Perguruan Tinggi": m.perguruanTinggi || "-",
          "Fakultas": m.fakultas || "-",
          "Jurusan": m.jurusan || "-",
          "Golongan Darah": m.golonganDarah || "-",
          "Riwayat Penyakit": m.riwayatPenyakit || "-"
        }));

        // Create a worksheet
        const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });

        // Auto-fit column widths
        const objectWidths = headers.map(header => {
          let maxLen = header.length;
          rows.forEach(row => {
            const val = String((row as any)[header] || "");
            if (val.length > maxLen) {
              maxLen = val.length;
            }
          });
          return { wch: maxLen + 2 };
        });
        worksheet["!cols"] = objectWidths;

        // Create workbook and write data
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data Kader");

        // Write workbook file and trigger download
        XLSX.writeFile(workbook, `Data_Kader_PMII_${new Date().toISOString().split("T")[0]}.xlsx`);

        setIsExporting(false);
        showToast(`Berhasil mengekspor ${filteredMembers.length} data kader ke Excel (.xlsx)!`);
      } catch (error) {
        console.error("Export error:", error);
        setIsExporting(false);
        showToast("Gagal melakukan ekspor data ke Excel.");
      }
    }, 1000);
  };

  // Handle Download KTA as premium PNG Card
  const handleDownloadKTA = (member: Member) => {
    showToast(`Menyiapkan KTA Digital untuk ${member.name}...`);
    
    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = 1012; // High-res width
    canvas.height = 638; // High-res height
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Enable anti-aliasing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Define gradients based on theme
    let bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    let primaryColor = "#F7C738"; // Gold
    let secondaryColor = "#0A2A5C"; // Blue

    if (ktaTheme === "emerald") {
      bgGrad.addColorStop(0, "#022c22");
      bgGrad.addColorStop(0.5, "#064e3b");
      bgGrad.addColorStop(1, "#115e59");
      primaryColor = "#34d399"; // Emerald light
      secondaryColor = "#022c22";
    } else if (ktaTheme === "dark") {
      bgGrad.addColorStop(0, "#0f172a");
      bgGrad.addColorStop(0.5, "#1e293b");
      bgGrad.addColorStop(1, "#0f172a");
      primaryColor = "#cbd5e1"; // Silver/gray
      secondaryColor = "#0f172a";
    } else {
      // Default PMII Gold/Blue Theme
      bgGrad.addColorStop(0, "#061833");
      bgGrad.addColorStop(0.5, "#0b2447");
      bgGrad.addColorStop(1, "#1e3a8a");
      primaryColor = "#F7C738"; // PMII Gold
      secondaryColor = "#0A2A5C";
    }

    // Fill background
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw premium design patterns/grid in background
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    const gridSpacing = 30;
    for (let x = 0; x < canvas.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 100, canvas.height);
      ctx.stroke();
    }

    // Draw card borders with theme glow
    ctx.strokeStyle = primaryColor + "55"; // 33% opacity
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    // Inner gold thin border
    ctx.strokeStyle = primaryColor + "AA"; // 66% opacity
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

    // Decorative geometric shape (circle badge placeholder in background)
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 100, 200, 0, Math.PI * 2);
    ctx.fill();

    // Draw Card Header Label
    ctx.font = "bold 26px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.textAlign = "right";
    const headerTitle = (member.kabupaten || "PENGURUS CABANG").toUpperCase();
    ctx.fillText(headerTitle, canvas.width - 48, 68);

    // Draw PMII Brand Name & Logo Badge
    ctx.textAlign = "left";
    // Logo background square
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.roundRect(48, 44, 46, 46, 10);
    ctx.fill();

    // Logo letter "P"
    ctx.font = "900 32px sans-serif";
    ctx.fillStyle = secondaryColor;
    ctx.fillText("P", 60, 78);

    // Brand title text
    ctx.font = "900 30px sans-serif";
    ctx.fillStyle = primaryColor;
    ctx.fillText("KTA PMII DIGITAL", 110, 64);
    
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pergerakan Mahasiswa Islam Indonesia", 110, 84);

    // Header divider line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(48, 108);
    ctx.lineTo(canvas.width - 48, 108);
    ctx.stroke();

    // Draw User Avatar Frame & Image/Initials
    const avatarX = 140;
    const avatarY = 300;
    const avatarR = 80;

    // Avatar Ring glow shadow
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR + 6, 0, Math.PI * 2);
    ctx.fill();

    // Avatar center background
    let avatarGrad = ctx.createLinearGradient(avatarX - avatarR, avatarY - avatarR, avatarX + avatarR, avatarY + avatarR);
    avatarGrad.addColorStop(0, primaryColor);
    avatarGrad.addColorStop(1, primaryColor === "#cbd5e1" ? "#64748b" : "#c2410c"); // dark gold or slate
    ctx.fillStyle = avatarGrad;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.fill();

    // Avatar Initials Text
    ctx.font = "bold 64px sans-serif";
    ctx.fillStyle = secondaryColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const initials = member.name.split(" ").slice(-2).map(n => n[0]).join("").toUpperCase();
    ctx.fillText(initials, avatarX, avatarY);

    // Reset base alignment for card text details
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // Draw Member Details Grid
    const detailsX = 260;
    
    // Label details helper
    const drawDetailRow = (label: string, value: string, yPos: number, isTitle = false) => {
      ctx.font = "bold 16px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillText(label.toUpperCase(), detailsX, yPos);

      if (isTitle) {
        ctx.font = "bold 34px sans-serif";
        ctx.fillStyle = primaryColor;
      } else {
        ctx.font = "bold 22px sans-serif";
        ctx.fillStyle = "#ffffff";
      }
      ctx.fillText(value, detailsX, yPos + 28);
    };

    drawDetailRow("Nama Lengkap", member.name, 150, true);
    drawDetailRow("Nomor Induk Anggota (NIPA)", member.nipa, 240);
    drawDetailRow("Komisariat", member.komisariat, 320);

    // Two-column fields in detail
    // Column 1: Kaderisasi
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("KADERISASI UTAMA", detailsX, 400);

    ctx.font = "900 24px sans-serif";
    ctx.fillStyle = primaryColor;
    ctx.fillText(member.level, detailsX, 428);

    // Column 2: Angkatan
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("ANGKATAN", detailsX + 240, 400);

    ctx.font = "24px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(member.angkatan, detailsX + 240, 428);

    // Card footer brand
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillText("DIKELUARKAN SECARA DIGITAL OLEH PENGURUS CABANG PMII", 48, 570);

    // Draw Stamp Verification
    const stampX = canvas.width - 160;
    const stampY = canvas.height - 130;
    
    // Draw validation badge
    ctx.save();
    ctx.translate(stampX, stampY);
    ctx.rotate(-0.08); // Slight angle rotation
    
    // Stamp box
    ctx.strokeStyle = "rgba(16, 185, 129, 0.8)"; // Emerald green border
    ctx.lineWidth = 4;
    ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
    ctx.beginPath();
    ctx.roundRect(-70, -30, 140, 60, 10);
    ctx.fill();
    ctx.stroke();

    // Stamp text
    ctx.font = "900 20px sans-serif";
    ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("VALID", 0, -8);
    
    ctx.font = "bold 12px sans-serif";
    ctx.fillStyle = "rgba(16, 185, 129, 0.8)";
    ctx.fillText("PC PMII OFFICIAL", 0, 14);
    
    ctx.restore();

    // Trigger file download
    setTimeout(() => {
      try {
        const link = document.createElement("a");
        link.download = `KTA_PMII_${member.name.replace(/\s+/g, "_")}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        showToast(`KTA Digital untuk ${member.name} berhasil diunduh!`);
      } catch (err) {
        console.error(err);
        showToast("Gagal mengunduh KTA. Harap hubungi administrator.");
      }
    }, 1000);
  };

  // Helper Badge Colors for Cadre Level
  const getLevelBadge = (level: "MAPABA" | "PKD" | "PKL") => {
    switch (level) {
      case "PKL":
        return <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold px-2.5 py-0.5 rounded-lg border-none shadow-none">PKL (Mujtahid)</Badge>;
      case "PKD":
        return <Badge className="bg-gradient-to-r from-pmii-blue to-blue-700 text-white font-extrabold px-2.5 py-0.5 rounded-lg border-none shadow-none">PKD (Mujahid)</Badge>;
      default:
        return <Badge className="bg-gradient-to-r from-pmii-gold to-yellow-500 text-zinc-950 font-extrabold px-2.5 py-0.5 rounded-lg border-none shadow-none">MAPABA (Mu'takid)</Badge>;
    }
  };

  const getStatusBadge = (status: "Aktif" | "Alumni" | "Pasif") => {
    switch (status) {
      case "Aktif":
        return <Badge className="bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 font-bold border border-emerald-500/20 px-2 py-0.5 rounded-md">Aktif</Badge>;
      case "Alumni":
        return <Badge className="bg-sky-500/10 text-sky-500 dark:text-sky-400 font-bold border border-sky-500/20 px-2 py-0.5 rounded-md">Alumni</Badge>;
      default:
        return <Badge className="bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 font-bold border border-zinc-500/20 px-2 py-0.5 rounded-md">Pasif</Badge>;
    }
  };

  return (
    <div className="space-y-6 relative pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-pmii-blue to-[#2563eb] dark:from-white dark:to-zinc-300 bg-clip-text text-transparent flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-pmii-gold" /> Database Anggota & Kader PMII
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Kelola profil, tingkat kaderisasi, komisariat, dan histori organisasi kader PMII secara terpusat.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          {/* Ekspor XLSX Button */}
          <Button 
            onClick={handleExportExcel}
            disabled={isExporting}
            variant="outline"
            className="border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-bold px-3.5 py-2 text-xs rounded-lg flex items-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> 
            {isExporting ? "Mengekspor..." : "Ekspor Excel"}
          </Button>

          {/* Tambah Anggota Trigger Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={
              <Button className="bg-pmii-blue hover:bg-pmii-blue-light dark:bg-pmii-gold dark:text-[#090d16] dark:hover:bg-pmii-gold-light hover:scale-[1.01] active:scale-[0.99] transition-all font-bold px-4 py-2 text-xs rounded-lg shadow-none flex items-center gap-2 cursor-pointer border-none">
                <UserPlus className="w-4 h-4" /> Registrasi Anggota Baru
              </Button>
            } />
            
            <DialogContent className="w-screen h-screen max-w-none max-h-none sm:max-w-none rounded-none border-none top-0 left-0 translate-x-0 translate-y-0 p-0 gap-0 flex flex-col bg-white dark:bg-[#090d16]">
              {/* Premium Wizard Header */}
              <div className="p-6 bg-gradient-to-r from-pmii-blue to-blue-900 dark:from-[#051125] dark:to-[#08152c] text-white border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="max-w-4xl mx-auto w-full">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-pmii-gold/10 flex items-center justify-center text-pmii-gold border border-pmii-gold/25">
                        <UserPlus className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold flex items-center gap-2 text-white">
                          Registrasi Anggota Baru PMII
                        </h2>
                        <p className="text-[11px] text-zinc-300 dark:text-zinc-400">
                          Isi 15 data profil secara lengkap untuk pendaftaran database pusat kepengurusan.
                        </p>
                      </div>
                    </div>
                    <DialogClose render={
                      <button className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer border-none">
                        <X className="w-4.5 h-4.5" />
                      </button>
                    } />
                  </div>

                  {/* Horizontal Step Tracker */}
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {[
                      { id: "diri", label: "Data Diri", icon: User },
                      { id: "akademik", label: "Akademik & Kontak", icon: GraduationCap },
                      { id: "riwayat", label: "Pendidikan & Organisasi", icon: Briefcase },
                      { id: "motivasi", label: "Karakter & Motivasi", icon: Compass }
                    ].map((step, idx) => {
                      const isActive = activeAddTab === step.id;
                      const isCompleted = 
                        (step.id === "diri" && activeAddTab !== "diri") ||
                        (step.id === "akademik" && (activeAddTab === "riwayat" || activeAddTab === "motivasi")) ||
                        (step.id === "riwayat" && activeAddTab === "motivasi");
                      
                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => setActiveAddTab(step.id)}
                          className={`flex flex-col md:flex-row items-center gap-2 p-2 rounded-lg transition-all cursor-pointer border-none text-left ${
                            isActive 
                              ? "bg-white/10 ring-1 ring-pmii-gold/40 text-white" 
                              : isCompleted
                              ? "text-emerald-400 opacity-90"
                              : "text-white/55 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive 
                              ? "bg-pmii-gold text-zinc-950 font-bold" 
                              : isCompleted
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-white/10 text-white"
                          }`}>
                            {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                          </div>
                          <div className="hidden md:block min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider block leading-none">Step {idx + 1}</span>
                            <span className="text-xs font-bold truncate block mt-0.5">{step.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Form Container */}
              <form onSubmit={handleAddMember} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/20">
                  <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6 w-full">
                  
                  {/* STEP 1: DATA DIRI */}
                  {activeAddTab === "diri" && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <User className="w-4 h-4 text-pmii-gold" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">A. Identitas Diri Utama</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nama Lengkap */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Nama Lengkap *</label>
                          <Input
                            required
                            placeholder="Contoh: Sahabat M. Zulkifli"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-pmii-gold/30"
                          />
                        </div>

                        {/* Jenis Kelamin */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Jenis Kelamin</label>
                          <Select value={newGender} onValueChange={(val) => { if (val) setNewGender(val as any); }}>
                            <SelectTrigger className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                              <SelectValue placeholder="Gender" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800">
                              <SelectItem value="Laki-laki">Laki-laki (Sahabat)</SelectItem>
                              <SelectItem value="Perempuan">Perempuan (Sahabati)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* NIK Input (Full Width for 16 Digit Box) */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Nomor Induk Kependudukan (NIK) *</label>
                        <NikInput value={newNik} onChange={setNewNik} />
                      </div>

                      {/* KTP Upload (Full Width) */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Unggah KTP</label>
                        {newKtpName ? (
                          <div className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                {newKtpUploading ? (
                                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                ) : (
                                  <Check className="w-4.5 h-4.5" />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">{newKtpName}</span>
                                <span className="text-[9px] text-zinc-400 mt-0.5">
                                  {newKtpUploading ? `Mengunggah... ${newKtpProgress}%` : "Berkas Tersimpan (Simulasi)"}
                                </span>
                              </div>
                            </div>
                            {!newKtpUploading && (
                              <button 
                                type="button" 
                                onClick={() => setNewKtpName("")}
                                className="text-zinc-400 hover:text-rose-500 transition-colors p-1 cursor-pointer border-none bg-transparent"
                              >
                                <Trash className="w-4.5 h-4.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="relative group">
                            <input 
                              type="file" 
                              accept="image/*,application/pdf"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  simulateUpload("ktp", false, file.name);
                                }
                              }}
                            />
                            <div className="flex flex-col items-center justify-center py-2.5 px-4 border border-dashed border-zinc-200 dark:border-zinc-800 group-hover:border-pmii-gold/60 rounded-lg transition-all bg-white dark:bg-zinc-900/50">
                              <div className="flex items-center gap-2">
                                <Upload className="w-4 h-4 text-zinc-400 group-hover:text-pmii-gold transition-colors" />
                                <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">Pilih File KTP</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* TTL */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Tempat Lahir</label>
                          <Input
                            placeholder="Contoh: Semarang"
                            value={newTempatLahir}
                            onChange={(e) => setNewTempatLahir(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Tanggal Lahir</label>
                          <Input
                            type="date"
                            value={newTanggalLahir}
                            onChange={(e) => setNewTanggalLahir(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Alamat Rumah */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Alamat Rumah (Sesuai KTP)</label>
                          <Input
                            placeholder="Jl. Merdeka No. 12, RT 01/RW 02"
                            value={newAlamatRumah}
                            onChange={(e) => setNewAlamatRumah(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                          />
                        </div>

                        {/* Alamat Domisili */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Alamat Domisili Mahasiswa</label>
                          <Input
                            placeholder="Kos Barokah, Gang Kyai RT 03/RW 04, Ngaliyan"
                            value={newAlamatDomisili}
                            onChange={(e) => setNewAlamatDomisili(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Pas Foto Upload */}
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-150 dark:border-zinc-800/80">
                        <div className="flex flex-col md:flex-row items-center gap-5">
                          <div className="relative w-20 h-20 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 border border-zinc-300 dark:border-zinc-700 overflow-hidden shrink-0">
                            {newPasFotoName && !newPasFotoUploading ? (
                              <div className="w-full h-full bg-gradient-to-tr from-pmii-blue to-blue-700 dark:from-pmii-gold dark:to-yellow-500 flex items-center justify-center text-white dark:text-zinc-950 font-black text-2xl">
                                {newName.split(" ").slice(-2).map(n => n[0]).join("")}
                              </div>
                            ) : (
                              <Camera className="w-8 h-8" />
                            )}
                            {newPasFotoUploading && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <svg className="animate-spin w-6 h-6 text-pmii-gold" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-2 text-center md:text-left w-full">
                            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">K. Pas Foto 3x4 Resmi</span>
                            {newPasFotoName ? (
                              <div className="flex items-center justify-center md:justify-between p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-md">
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">{newPasFotoName}</span>
                                <button
                                  type="button"
                                  onClick={() => setNewPasFotoName("")}
                                  className="text-zinc-400 hover:text-rose-500 text-xs font-bold cursor-pointer border-none bg-transparent ml-2"
                                >
                                  Hapus
                                </button>
                              </div>
                            ) : (
                              <div className="relative inline-block">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) simulateUpload("pasFoto", false, file.name);
                                  }}
                                />
                                <Button type="button" variant="outline" className="text-xs rounded-lg flex items-center gap-1.5 font-bold">
                                  <Upload className="w-3.5 h-3.5" /> Pilih Pas Foto Resmi
                                </Button>
                              </div>
                            )}
                            <p className="text-[10px] text-zinc-400 mt-1">Latar belakang merah/biru, wajah terlihat jelas, maks. 2MB.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: AKADEMIK & KONTAK */}
                  {activeAddTab === "akademik" && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <GraduationCap className="w-4.5 h-4.5 text-pmii-gold" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">B. Data Akademik & Kontak Sosmed</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Perguruan Tinggi */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Perguruan Tinggi</label>
                          <Input
                            placeholder="Contoh: UIN Walisongo"
                            value={newPerguruanTinggi}
                            onChange={(e) => setNewPerguruanTinggi(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                          />
                        </div>

                        {/* Fakultas */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Fakultas</label>
                          <Input
                            placeholder="Contoh: Syariah & Hukum"
                            value={newFakultas}
                            onChange={(e) => setNewFakultas(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                          />
                        </div>

                        {/* Jurusan */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Jurusan / Program Studi</label>
                          <Input
                            placeholder="Contoh: Hukum Keluarga Islam"
                            value={newJurusan}
                            onChange={(e) => setNewJurusan(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                          />
                        </div>
                      </div>

                      {/* KTM Upload Zone */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Unggah Kartu Tanda Mahasiswa (KTM)</label>
                        {newKtmName ? (
                          <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                {newKtmUploading ? (
                                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                ) : (
                                  <Check className="w-4.5 h-4.5" />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">{newKtmName}</span>
                                <span className="text-[9px] text-zinc-400 mt-0.5">
                                  {newKtmUploading ? `Mengunggah... ${newKtmProgress}%` : "KTM berhasil diverifikasi (Simulasi)"}
                                </span>
                              </div>
                            </div>
                            {!newKtmUploading && (
                              <button 
                                type="button" 
                                onClick={() => setNewKtmName("")}
                                className="text-zinc-400 hover:text-rose-500 transition-colors p-1 cursor-pointer border-none bg-transparent"
                              >
                                <Trash className="w-4.5 h-4.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="relative group">
                            <input 
                              type="file" 
                              accept="image/*,application/pdf"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) simulateUpload("ktm", false, file.name);
                              }}
                            />
                            <div className="flex flex-col items-center justify-center py-4 px-4 border border-dashed border-zinc-200 dark:border-zinc-800 group-hover:border-pmii-gold/60 rounded-lg transition-all bg-white dark:bg-zinc-900/50">
                              <Upload className="w-5 h-5 text-zinc-400 group-hover:text-pmii-gold transition-colors mb-1.5" />
                              <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">Seret atau Pilih KTM</span>
                              <span className="text-[9px] text-zinc-400 mt-0.5">PNG, JPG, PDF maks 5MB</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* WhatsApp / HP */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Nomor HP / WhatsApp *</label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                              required
                              placeholder="Contoh: +62 812-3456-7890"
                              value={newPhone}
                              onChange={(e) => setNewPhone(e.target.value)}
                              className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                            />
                          </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Alamat Email *</label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                              required
                              type="email"
                              placeholder="contoh@gmail.com"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sosial Media */}
                      <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-150 dark:border-zinc-800/80 space-y-3">
                        <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">J. Akun Media Sosial</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Instagram */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Instagram</label>
                            <div className="relative">
                              <Instagram className="w-4 h-4 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2" />
                              <Input
                                placeholder="@username"
                                value={newInstagram}
                                onChange={(e) => setNewInstagram(e.target.value)}
                                className="w-full text-xs pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                              />
                            </div>
                          </div>

                          {/* Twitter */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Twitter / X</label>
                            <div className="relative">
                              <Twitter className="w-4 h-4 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2" />
                              <Input
                                placeholder="@username"
                                value={newTwitter}
                                onChange={(e) => setNewTwitter(e.target.value)}
                                className="w-full text-xs pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                              />
                            </div>
                          </div>

                          {/* Facebook */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Facebook</label>
                            <div className="relative">
                              <Facebook className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                              <Input
                                placeholder="Nama Facebook"
                                value={newFacebook}
                                onChange={(e) => setNewFacebook(e.target.value)}
                                className="w-full text-xs pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Organisasi details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Kaderisasi</label>
                          <Select value={newLevel} onValueChange={(val) => { if (val) setNewLevel(val as any); }}>
                            <SelectTrigger className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                              <SelectValue placeholder="Tingkat" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800">
                              <SelectItem value="MAPABA">MAPABA (Mu'takid)</SelectItem>
                              <SelectItem value="PKD">PKD (Mujahid)</SelectItem>
                              <SelectItem value="PKL">PKL (Mujtahid)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Komisariat Asal</label>
                          <Select 
                            value={newKomisariat} 
                            disabled={currentUser?.role !== "ADMIN"}
                            onValueChange={(val) => { 
                              if (val) {
                                setNewKomisariat(val);
                                if (val === "Komisariat Walisongo") {
                                  setNewProvinsi("Jawa Tengah");
                                  setNewKabupaten("Kota Semarang");
                                  setNewKecamatan("Ngaliyan");
                                } else if (val === "Komisariat Diponegoro") {
                                  setNewProvinsi("Jawa Tengah");
                                  setNewKabupaten("Kota Semarang");
                                  setNewKecamatan("Tembalang");
                                } else if (val === "Komisariat Sunan Kalijaga") {
                                  setNewProvinsi("D.I. Yogyakarta");
                                  setNewKabupaten("Sleman");
                                  setNewKecamatan("Depok");
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg disabled:opacity-80">
                              <SelectValue placeholder="Pilih Komisariat" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800">
                              <SelectItem value="Komisariat Walisongo">Komisariat Walisongo</SelectItem>
                              <SelectItem value="Komisariat Diponegoro">Komisariat Diponegoro</SelectItem>
                              <SelectItem value="Komisariat Sunan Kalijaga">Komisariat Sunan Kalijaga</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: RIWAYAT & ORGANISASI */}
                  {activeAddTab === "riwayat" && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <Briefcase className="w-4.5 h-4.5 text-pmii-gold" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">C. Riwayat Pendidikan & Pengalaman Organisasi</h3>
                      </div>

                      {/* Riwayat Pendidikan */}
                      <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800/80">
                        <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">G. Riwayat Pendidikan Formal</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* SD */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sekolah Dasar (SD / MI)</label>
                            <Input
                              placeholder="Nama SD / MI & Tahun Lulus"
                              value={newPendidikanSD}
                              onChange={(e) => setNewPendidikanSD(e.target.value)}
                              className="w-full text-xs px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                            />
                          </div>

                          {/* SMP */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">SMP / MTs</label>
                            <Input
                              placeholder="Nama SMP / MTs & Tahun Lulus"
                              value={newPendidikanSMP}
                              onChange={(e) => setNewPendidikanSMP(e.target.value)}
                              className="w-full text-xs px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                            />
                          </div>

                          {/* SMA */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">SMA / MA / SMK</label>
                            <Input
                              placeholder="Nama SMA / SMK & Tahun Lulus"
                              value={newPendidikanSMA}
                              onChange={(e) => setNewPendidikanSMA(e.target.value)}
                              className="w-full text-xs px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Pengalaman Organisasi */}
                      <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800/80">
                        <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">M. Pengalaman Organisasi (SD s/d Perguruan Tinggi)</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* SD */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tingkat SD (Pramuka, UKS, PMR dll)</label>
                            <Input
                              placeholder="Contoh: Pramuka - Anggota"
                              value={newOrganisasiSD}
                              onChange={(e) => setNewOrganisasiSD(e.target.value)}
                              className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                            />
                          </div>

                          {/* SMP */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tingkat SMP (OSIS, Dewan Galang dll)</label>
                            <Input
                              placeholder="Contoh: OSIS - Sekretaris I"
                              value={newOrganisasiSMP}
                              onChange={(e) => setNewOrganisasiSMP(e.target.value)}
                              className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          {/* SMA */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tingkat SMA (Pramuka, IPNU/IPPNU, OSIS dll)</label>
                            <Input
                              placeholder="Contoh: Ketua OSIS SMA, IPPNU"
                              value={newOrganisasiSMA}
                              onChange={(e) => setNewOrganisasiSMA(e.target.value)}
                              className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                            />
                          </div>

                          {/* PT */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tingkat Kampus (BEM, HIMA, UKM dll)</label>
                            <Input
                              placeholder="Contoh: BEM - Staf Humas, Kopma"
                              value={newOrganisasiPT}
                              onChange={(e) => setNewOrganisasiPT(e.target.value)}
                              className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Tahun Angkatan</label>
                          <Input
                            type="number"
                            value={newAngkatan}
                            onChange={(e) => setNewAngkatan(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Jabatan Pengurus Awal</label>
                          <Input
                            placeholder="Contoh: Anggota / Pengurus"
                            value={newJabatan}
                            onChange={(e) => setNewJabatan(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: KARAKTER & MOTIVASI */}
                  {activeAddTab === "motivasi" && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <Compass className="w-4.5 h-4.5 text-pmii-gold" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">D. Karakter, Profil Kesehatan, & Motivasi MAPABA</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Golongan Darah */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Golongan Darah</label>
                          <Select value={newGolonganDarah} onValueChange={(val) => { if (val) setNewGolonganDarah(val); }}>
                            <SelectTrigger className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                              <SelectValue placeholder="Gol. Darah" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800">
                              <SelectItem value="A">Golongan A</SelectItem>
                              <SelectItem value="B">Golongan B</SelectItem>
                              <SelectItem value="AB">Golongan AB</SelectItem>
                              <SelectItem value="O">Golongan O</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Riwayat Penyakit */}
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Riwayat Penyakit (Alergi, Asma, Maag, dll)</label>
                          <div className="relative">
                            <Heart className="w-4 h-4 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                              placeholder="Isi 'Tidak Ada' jika sehat wal'afiat"
                              value={newRiwayatPenyakit}
                              onChange={(e) => setNewRiwayatPenyakit(e.target.value)}
                              className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Orientasi Profetik, Minat Passion */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Orientasi Profetik */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Orientasi Profetik (Pandangan Hidup / Keislaman)</label>
                          <Input
                            placeholder="Contoh: Keadilan sosial, dakwah islam rahmatan lil alamin"
                            value={newOrientasiProfetik}
                            onChange={(e) => setNewOrientasiProfetik(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                          />
                        </div>

                        {/* Minat atau Passion */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Minat / Bakat / Passion</label>
                          <Input
                            placeholder="Contoh: Orasi, Kepenulisan Kreatif, Desain Grafis, IT"
                            value={newMinatPassion}
                            onChange={(e) => setNewMinatPassion(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Motivasi MAPABA */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">O. Motivasi Mengikuti MAPABA PMII</label>
                        <Input
                          placeholder="Ceritakan singkat motivasi Anda mendaftar MAPABA PMII..."
                          value={newMotivasiMapaba}
                          onChange={(e) => setNewMotivasiMapaba(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>

                      {/* Region info hidden inputs */}
                      <input type="hidden" value={newProvinsi} />
                      <input type="hidden" value={newKabupaten} />
                      <input type="hidden" value={newKecamatan} />
                    </div>
                  )}

                  </div>
                </div>

                {/* Wizard Footer Controls */}
                <div className="p-4 md:p-6 border-t border-zinc-150 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40">
                  <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                    <DialogClose render={
                      <Button type="button" variant="outline" className="text-xs rounded-lg font-bold px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                        Batal
                      </Button>
                    } />

                    <div className="flex items-center gap-2">
                      {/* Back button */}
                      {activeAddTab !== "diri" && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (activeAddTab === "motivasi") setActiveAddTab("riwayat");
                            else if (activeAddTab === "riwayat") setActiveAddTab("akademik");
                            else if (activeAddTab === "akademik") setActiveAddTab("diri");
                          }}
                          className="text-xs rounded-lg font-bold px-4 py-2 flex items-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" /> Kembali
                        </Button>
                      )}

                      {/* Next or Submit Button */}
                      {activeAddTab !== "motivasi" ? (
                        <Button
                          type="button"
                          onClick={() => {
                            if (activeAddTab === "diri") {
                              if (!newName.trim()) { showToast("Nama Lengkap wajib diisi!"); return; }
                              setActiveAddTab("akademik");
                            }
                            else if (activeAddTab === "akademik") {
                              if (!newPhone.trim() || !newEmail.trim()) { showToast("Nomor HP dan Email wajib diisi!"); return; }
                              setActiveAddTab("riwayat");
                            }
                            else if (activeAddTab === "riwayat") {
                              setActiveAddTab("motivasi");
                            }
                          }}
                          className="bg-pmii-blue hover:bg-pmii-blue-light text-white dark:bg-pmii-gold dark:text-[#090d16] dark:hover:bg-pmii-gold-light text-xs font-bold rounded-lg px-4.5 py-2 flex items-center gap-1 cursor-pointer border-none shadow-none"
                        >
                          Selanjutnya <ChevronRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg px-5 py-2 cursor-pointer border-none shadow-none flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" /> Simpan & Daftarkan
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <UsersIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Kader</p>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">{members.length}</h3>
            </div>
          </div>
        </div>

        {/* Card 2: MAPABA */}
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">MAPABA (Mu'takid)</p>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
                {members.filter(m => m.level === "MAPABA").length}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 3: PKD */}
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">PKD (Mujahid)</p>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
                {members.filter(m => m.level === "PKD").length}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 4: PKL */}
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">PKL (Mujtahid)</p>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
                {members.filter(m => m.level === "PKL").length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER PANEL */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none rounded-lg overflow-visible">
        <CardContent className="p-4 md:p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Left: Search Bar */}
          <div className="relative w-full md:max-w-sm flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari nama kader, NIPA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs bg-zinc-50 hover:bg-zinc-100 focus:bg-white dark:bg-zinc-900 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-lg"
            />
          </div>

          {/* Right: Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold mr-1">
              <Filter className="w-3.5 h-3.5 text-pmii-gold" /> Filter :
            </div>

            {/* Level Filter */}
            <Select value={levelFilter} onValueChange={(val) => setLevelFilter(val ?? "ALL")}>
              <SelectTrigger className="w-[140px] text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <SelectValue placeholder="Kaderisasi" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800">
                <SelectItem value="ALL">Semua Kaderisasi</SelectItem>
                <SelectItem value="MAPABA">MAPABA</SelectItem>
                <SelectItem value="PKD">PKD</SelectItem>
                <SelectItem value="PKL">PKL</SelectItem>
              </SelectContent>
            </Select>

            {/* Komisariat Filter (Only visible to CABANG roles) */}
            {currentUser?.role === "ADMIN" && (
              <Select value={komisariatFilter} onValueChange={(val) => setKomisariatFilter(val ?? "ALL")}>
                <SelectTrigger className="w-[180px] text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <SelectValue placeholder="Komisariat" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800">
                  <SelectItem value="ALL">Semua Komisariat</SelectItem>
                  <SelectItem value="Komisariat Walisongo">Komisariat Walisongo</SelectItem>
                  <SelectItem value="Komisariat Diponegoro">Komisariat Diponegoro</SelectItem>
                  <SelectItem value="Komisariat Sunan Kalijaga">Komisariat Sunan Kalijaga</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Reset Filters */}
            {(levelFilter !== "ALL" || komisariatFilter !== "ALL" || searchTerm !== "") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLevelFilter("ALL");
                  setKomisariatFilter("ALL");
                  setSearchTerm("");
                }}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MEMBER LIST TABLE */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none rounded-lg overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-black/10 border-b border-zinc-200 dark:border-zinc-800/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-zinc-500 pl-6 py-4">Nama & NIPA</TableHead>
                <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-zinc-500 py-4">Komisariat</TableHead>
                <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-zinc-500 py-4">Tingkat Kaderisasi</TableHead>
                <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-zinc-500 py-4">Jabatan</TableHead>
                <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-zinc-500 py-4">Angkatan</TableHead>
                <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-zinc-500 py-4">Status</TableHead>
                <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-zinc-500 text-center pr-6 py-4">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UsersIcon className="w-8 h-8 text-zinc-400" />
                      <span className="text-xs font-semibold">Kader tidak ditemukan</span>
                      <span className="text-[10px] text-zinc-400">Silakan sesuaikan filter atau pencarian Anda.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentMembers.map((member) => (
                  <TableRow 
                    key={member.id} 
                    className="group border-b border-zinc-100 dark:border-zinc-800/40 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors duration-150"
                  >
                    {/* Nama & Avatar */}
                    <TableCell className="pl-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 border border-zinc-200 dark:border-zinc-800 shadow-none">
                          <AvatarFallback className="bg-gradient-to-tr from-pmii-blue to-pmii-blue-light text-white font-extrabold text-xs">
                            {member.name.split(" ").slice(-2).map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 group-hover:text-pmii-blue dark:group-hover:text-pmii-gold transition-colors truncate">
                            {member.name}
                          </span>
                          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono font-medium mt-0.5">
                            {member.nipa}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Komisariat */}
                    <TableCell className="py-3.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-zinc-400" /> {member.komisariat}
                        </span>
                      </div>
                    </TableCell>

                    {/* Kaderisasi */}
                    <TableCell className="py-3.5">
                      {getLevelBadge(member.level)}
                    </TableCell>

                    {/* Jabatan */}
                    <TableCell className="py-3.5">
                      <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        {member.jabatan}
                      </span>
                    </TableCell>

                    {/* Angkatan */}
                    <TableCell className="py-3.5 font-mono text-xs font-bold text-zinc-500">
                      {member.angkatan}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3.5">
                      {getStatusBadge(member.status)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center pr-6 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        {/* View Action (Dialog trigger nested) */}
                        <Dialog>
                          <DialogTrigger render={
                            <Button 
                              variant="ghost" 
                              size="icon-sm" 
                              onClick={() => { setSelectedMember(member); setKtaTheme("gold"); }}
                              className="rounded-lg hover:bg-pmii-blue/5 hover:text-pmii-blue dark:hover:bg-pmii-gold/5 dark:hover:text-pmii-gold cursor-pointer"
                              title="Detail Profil & KTA"
                            >
                              <Eye className="w-4.5 h-4.5" />
                            </Button>
                          } />
                          
                          {/* Selected Member Detail Dialog */}
                          <DialogContent className="w-screen h-screen max-w-none max-h-none sm:max-w-none rounded-none border-none top-0 left-0 translate-x-0 translate-y-0 p-0 gap-0 flex flex-col bg-white dark:bg-[#080d16]">
                            {selectedMember && (
                              <div className="flex flex-col h-full overflow-hidden">
                                
                                {/* Dialog Upper Panel (Premium Banner) */}
                                <div className="bg-gradient-to-r from-pmii-blue via-pmii-blue-light to-blue-900 dark:from-[#051125] dark:via-[#0c2246] dark:to-[#08152c] relative p-6 pb-3 border-b border-zinc-200 dark:border-zinc-800/80 shrink-0">
                                  {/* Watermark PMII styling */}
                                  <div className="absolute right-4 top-2 text-white/5 dark:text-white/[0.02] font-black text-6xl select-none">
                                    PMII
                                  </div>
                                  <div className="absolute top-4 left-6 flex items-center gap-2">
                                    <Badge className="bg-pmii-gold text-zinc-950 font-black text-[9px] uppercase tracking-wider rounded-md border-none px-2 py-0.5">
                                      Profil Lengkap Kader
                                    </Badge>
                                  </div>

                                  {/* Floating Avatar & Basic Info */}
                                  <div className="mt-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
                                    <div className="flex items-end gap-4">
                                      <Avatar className="w-18 h-18 ring-4 ring-white dark:ring-[#080d16] shadow-xl border border-zinc-200/50 dark:border-zinc-800 rounded-2xl shrink-0">
                                        <AvatarFallback className="bg-gradient-to-tr from-pmii-blue to-pmii-blue-light text-white font-extrabold text-2xl">
                                          {selectedMember.name.split(" ").slice(-2).map(n => n[0]).join("")}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="mb-1 min-w-0">
                                        <h2 className="text-base md:text-lg font-extrabold text-white leading-none truncate">
                                          {selectedMember.name}
                                        </h2>
                                        <span className="text-[10px] md:text-xs text-zinc-300 dark:text-zinc-400 font-mono mt-1.5 block">
                                          NIPA: {selectedMember.nipa}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {/* Quick stats badges */}
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <Badge className="bg-white/10 text-white border-none rounded-lg py-1 px-2.5 text-[9px] font-black uppercase tracking-wider">
                                        {selectedMember.level}
                                      </Badge>
                                      <Badge className="bg-pmii-gold text-zinc-950 border-none rounded-lg py-1 px-2.5 text-[9px] font-black uppercase tracking-wider">
                                        {selectedMember.status}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Horizontal Tabs inside Detail dialog */}
                                  <div className="flex gap-1.5 mt-5 border-t border-white/10 pt-4 overflow-x-auto no-scrollbar">
                                    {[
                                      { id: "diri", label: "Profil Diri & Medis", icon: User },
                                      { id: "akademik", label: "Akademik & Kontak", icon: GraduationCap },
                                      { id: "riwayat", label: "Pendidikan & Organisasi", icon: Briefcase },
                                      { id: "kta", label: "KTA Digital & Keanggotaan", icon: CreditCard }
                                    ].map((tab) => {
                                      const isActive = activeDetailTab === tab.id;
                                      const Icon = tab.icon;
                                      return (
                                        <button
                                          key={tab.id}
                                          type="button"
                                          onClick={() => setActiveDetailTab(tab.id)}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none whitespace-nowrap ${
                                            isActive 
                                              ? "bg-white text-zinc-900 dark:bg-pmii-gold dark:text-zinc-950 shadow-md scale-[1.02]"
                                              : "text-white/70 hover:text-white hover:bg-white/5"
                                          }`}
                                        >
                                          <Icon className="w-3.5 h-3.5 shrink-0" />
                                          {tab.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Dialog Lower Content Panel (Dynamic based on selected tab) */}
                                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-zinc-50/50 dark:bg-[#080d16]/30">
                                  
                                  {/* TAB 1: PROFIL DIRI & MEDIS */}
                                  {activeDetailTab === "diri" && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        
                                        {/* A. Identitas Utama */}
                                        <div className="space-y-3 bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs">
                                          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                            <User className="w-4 h-4 text-pmii-gold" /> Identitas Diri
                                          </h3>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col">
                                              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Nama Lengkap</span>
                                              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{selectedMember.name}</span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Jenis Kelamin</span>
                                              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{selectedMember.gender}</span>
                                            </div>
                                            <div className="flex flex-col col-span-2">
                                              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Nomor Induk Kependudukan (NIK)</span>
                                              <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{selectedMember.nik || "Belum diisi"}</span>
                                            </div>
                                            <div className="flex flex-col col-span-2">
                                              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Tempat, Tanggal Lahir</span>
                                              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                                                {selectedMember.tempatLahir || "-"}, {selectedMember.tanggalLahir ? new Date(selectedMember.tanggalLahir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* L. Profil Kesehatan */}
                                        <div className="space-y-3 bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs">
                                          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                            <Heart className="w-4 h-4 text-rose-500" /> Profil Medis & Kesehatan
                                          </h3>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col">
                                              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Golongan Darah</span>
                                              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                                                <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20 rounded-md font-black text-xs px-2 py-0.5 uppercase">
                                                  Golongan {selectedMember.golonganDarah || "O"}
                                                </Badge>
                                              </span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Riwayat Penyakit</span>
                                              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{selectedMember.riwayatPenyakit || "Tidak Ada"}</span>
                                            </div>
                                            <div className="flex flex-col col-span-2">
                                              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Pas Foto Resmi 3x4</span>
                                              <div className="mt-2 flex items-center gap-3 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                                                <div className="w-10 h-10 rounded-lg bg-pmii-blue/10 dark:bg-pmii-gold/10 flex items-center justify-center text-pmii-blue dark:text-pmii-gold border border-pmii-blue/20 dark:border-pmii-gold/20 shrink-0">
                                                  <Camera className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">{selectedMember.pasFotoName || "pasfoto_default.png"}</span>
                                                  <span className="text-[9px] text-emerald-500 font-bold mt-0.5 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Berkas Terunggah
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* E & F. Alamat Rumah & Domisili */}
                                      <div className="space-y-3 bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                          <MapPin className="w-4 h-4 text-pmii-gold" /> Informasi Alamat
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                          <div className="flex flex-col">
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Alamat Rumah (Sesuai KTP)</span>
                                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-100 dark:border-zinc-905">
                                              {selectedMember.alamatRumah || "Belum diisi"}
                                            </span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Alamat Domisili Mahasiswa</span>
                                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-100 dark:border-zinc-905">
                                              {selectedMember.alamatDomisili || "Belum diisi"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* B. Berkas KTP */}
                                      <div className="space-y-3 bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                          <FileText className="w-4 h-4 text-pmii-gold" /> Lampiran Berkas KTP
                                        </h3>
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                                          <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shrink-0">
                                              <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{selectedMember.ktpName || "ktp_kader_terpilih.png"}</span>
                                              <span className="text-[9px] text-zinc-400 mt-0.5">Ukuran: 1.4 MB | Format: Gambar/PDF</span>
                                            </div>
                                          </div>
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => showToast(`Mengunduh berkas KTP: ${selectedMember.ktpName || "ktp_kader_terpilih.png"}`)}
                                            className="text-xs rounded-lg flex items-center gap-1 font-bold border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                                          >
                                            <Download className="w-3.5 h-3.5" /> Unduh KTP
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* TAB 2: AKADEMIK & KONTAK */}
                                  {activeDetailTab === "akademik" && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        
                                        {/* H. Perguruan Tinggi */}
                                        <div className="space-y-3 bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs">
                                          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                            <GraduationCap className="w-4 h-4 text-pmii-gold" /> Status Akademik Mahasiswa
                                          </h3>
                                          <div className="grid grid-cols-1 gap-3.5">
                                            <div className="flex flex-col">
                                              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Perguruan Tinggi</span>
                                              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{selectedMember.perguruanTinggi || "Belum diisi"}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Fakultas</span>
                                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{selectedMember.fakultas || "Belum diisi"}</span>
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Jurusan / Program Studi</span>
                                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{selectedMember.jurusan || "Belum diisi"}</span>
                                              </div>
                                            </div>
                                            <div className="flex flex-col pt-1">
                                              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Kartu Tanda Mahasiswa (KTM)</span>
                                              <div className="mt-2 flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                                                <div className="flex items-center gap-2 min-w-0">
                                                  <FileText className="w-4.5 h-4.5 text-zinc-400 shrink-0" />
                                                  <span className="text-xs font-bold text-zinc-650 dark:text-zinc-400 truncate">{selectedMember.ktmName || "ktm_kader.png"}</span>
                                                </div>
                                                <Button 
                                                  variant="ghost" 
                                                  size="icon-xs" 
                                                  onClick={() => showToast(`Mengunduh berkas KTM: ${selectedMember.ktmName || "ktm_kader.png"}`)}
                                                  className="hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg cursor-pointer text-zinc-500"
                                                  title="Unduh KTM"
                                                >
                                                  <Download className="w-3.5 h-3.5" />
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* I & J. Kontak & Sosial Media */}
                                        <div className="space-y-4 bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs">
                                          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                            <Mail className="w-4 h-4 text-pmii-gold" /> Kontak & Sosial Media
                                          </h3>
                                          <div className="space-y-3.5">
                                            <div className="flex items-center gap-3 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-500/20">
                                                <Phone className="w-4 h-4" />
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="text-[9px] text-zinc-400 uppercase font-black">WhatsApp / No. HP</span>
                                                <span className="mt-0.5">{selectedMember.phone}</span>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 border border-blue-500/20">
                                                <Mail className="w-4 h-4" />
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="text-[9px] text-zinc-400 uppercase font-black">Email Resmi</span>
                                                <span className="mt-0.5">{selectedMember.email}</span>
                                              </div>
                                            </div>

                                            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                                              <span className="text-[9px] text-zinc-400 font-black uppercase tracking-wider block">Sosial Media</span>
                                              <div className="grid grid-cols-3 gap-2">
                                                <div className="flex flex-col p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg text-center items-center justify-center">
                                                  <Instagram className="w-4 h-4 text-rose-500" />
                                                  <span className="text-[9px] font-bold text-zinc-700 dark:text-zinc-300 mt-1 truncate w-full">{selectedMember.instagram || "-"}</span>
                                                </div>
                                                <div className="flex flex-col p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg text-center items-center justify-center">
                                                  <Twitter className="w-4 h-4 text-sky-500" />
                                                  <span className="text-[9px] font-bold text-zinc-700 dark:text-zinc-300 mt-1 truncate w-full">{selectedMember.twitter || "-"}</span>
                                                </div>
                                                <div className="flex flex-col p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg text-center items-center justify-center">
                                                  <Facebook className="w-4 h-4 text-blue-650" />
                                                  <span className="text-[9px] font-bold text-zinc-700 dark:text-zinc-300 mt-1 truncate w-full">{selectedMember.facebook || "-"}</span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* TAB 3: PENDIDIKAN & ORGANISASI */}
                                  {activeDetailTab === "riwayat" && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                      
                                      {/* G. Riwayat Pendidikan */}
                                      <div className="space-y-3 bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                          <GraduationCap className="w-4.5 h-4.5 text-pmii-gold" /> Riwayat Pendidikan Formal
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <div className="flex flex-col p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Sekolah Dasar (SD/MI)</span>
                                            <span className="text-xs font-bold text-zinc-705 dark:text-zinc-300 mt-1 leading-snug">{selectedMember.pendidikanSD || "Belum diisi"}</span>
                                          </div>
                                          <div className="flex flex-col p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">SMP / MTs</span>
                                            <span className="text-xs font-bold text-zinc-705 dark:text-zinc-300 mt-1 leading-snug">{selectedMember.pendidikanSMP || "Belum diisi"}</span>
                                          </div>
                                          <div className="flex flex-col p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">SMA / MA / SMK</span>
                                            <span className="text-xs font-bold text-zinc-705 dark:text-zinc-300 mt-1 leading-snug">{selectedMember.pendidikanSMA || "Belum diisi"}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* M. Pengalaman Organisasi */}
                                      <div className="space-y-3 bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                          <Briefcase className="w-4 h-4 text-pmii-gold" /> Pengalaman Organisasi
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="flex flex-col p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-lg">
                                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Organisasi Tingkat SD</span>
                                            <span className="text-xs font-semibold text-zinc-705 dark:text-zinc-300 mt-1">{selectedMember.organisasiSD || "Tidak ada / Belum diisi"}</span>
                                          </div>
                                          <div className="flex flex-col p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-lg">
                                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Organisasi Tingkat SMP</span>
                                            <span className="text-xs font-semibold text-zinc-750 dark:text-zinc-300 mt-1">{selectedMember.organisasiSMP || "Tidak ada / Belum diisi"}</span>
                                          </div>
                                          <div className="flex flex-col p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-lg">
                                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Organisasi Tingkat SMA</span>
                                            <span className="text-xs font-semibold text-zinc-750 dark:text-zinc-300 mt-1">{selectedMember.organisasiSMA || "Tidak ada / Belum diisi"}</span>
                                          </div>
                                          <div className="flex flex-col p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-lg">
                                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Organisasi Tingkat Perguruan Tinggi</span>
                                            <span className="text-xs font-semibold text-zinc-750 dark:text-zinc-300 mt-1">{selectedMember.organisasiPT || "Tidak ada / Belum diisi"}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* N & O. Visi, Misi & Karakter */}
                                      <div className="space-y-3 bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                          <Compass className="w-4 h-4 text-pmii-gold" /> Karakter, Minat & Motivasi MAPABA
                                        </h3>
                                        <div className="space-y-4">
                                          <div className="flex flex-col">
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Orientasi Profetik (Pandangan Islam & Gerakan)</span>
                                            <span className="text-xs font-semibold text-zinc-705 dark:text-zinc-300 mt-1 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-100 dark:border-zinc-900 leading-relaxed">
                                              {selectedMember.orientasiProfetik || "Belum diisi"}
                                            </span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Minat, Bakat, atau Passion</span>
                                            <span className="text-xs font-semibold text-zinc-705 dark:text-zinc-300 mt-1 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-100 dark:border-zinc-900 leading-relaxed">
                                              {selectedMember.minatPassion || "Belum diisi"}
                                            </span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Motivasi Bergabung di MAPABA PMII</span>
                                            <span className="text-xs font-semibold text-zinc-705 dark:text-zinc-300 mt-1 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-100 dark:border-zinc-900 leading-relaxed">
                                              {selectedMember.motivasiMapaba || "Belum diisi"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* TAB 4: KTA DIGITAL & KEANGGOTAAN */}
                                  {activeDetailTab === "kta" && (
                                    <div className="space-y-6 animate-in fade-in duration-300 flex flex-col items-center">
                                      
                                      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                        
                                        {/* Left Side: Membership Info */}
                                        <div className="md:col-span-6 space-y-4">
                                          <div className="space-y-3 bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs">
                                            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                              <Shield className="w-4 h-4 text-pmii-gold" /> Informasi Keorganisasian
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Status Pengurus</span>
                                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">{selectedMember.jabatan}</span>
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Tahun Angkatan</span>
                                                <span className="text-xs font-bold font-mono text-zinc-700 dark:text-zinc-300 mt-0.5">{selectedMember.angkatan}</span>
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Komisariat</span>
                                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">{selectedMember.komisariat}</span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Timeline Kaderisasi */}
                                          <div className="space-y-3 bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs">
                                            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                              <GraduationCap className="w-4 h-4 text-pmii-gold" /> Riwayat Kaderisasi Formal
                                            </h3>
                                            <div className="relative border-l border-zinc-250 dark:border-zinc-800 pl-4 space-y-4 ml-2">
                                              {selectedMember.history.map((hist, idx) => (
                                                <div key={idx} className="relative">
                                                  <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-pmii-gold border-2 border-white dark:border-[#080d16]" />
                                                  <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">{hist.level}</span>
                                                      <span className="text-[9px] bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded border border-emerald-500/20">{hist.status}</span>
                                                    </div>
                                                    <span className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
                                                      <Calendar className="w-3 h-3" /> {hist.date} | <MapPin className="w-3 h-3" /> {hist.location}
                                                    </span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Right Side: Visual KTA Card Preview */}
                                        <div className="md:col-span-6 flex flex-col items-center justify-start bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs space-y-5">
                                          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 w-full flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                            <CreditCard className="w-3.5 h-3.5 text-pmii-gold" /> Kartu Tanda Anggota (KTA) Digital
                                          </h3>
                                          
                                          {/* Dynamic Visual KTA Card */}
                                          <div className={`w-full aspect-[1.58/1] rounded-lg text-white p-4 shadow-sm relative overflow-hidden flex flex-col justify-between group/kta transition-colors max-w-[340px] ${
                                            ktaTheme === "emerald" 
                                              ? "bg-[#064e3b] border border-emerald-500/40" 
                                              : ktaTheme === "dark"
                                              ? "bg-zinc-900 border border-zinc-700"
                                              : "bg-blue-900 border border-blue-700"
                                          }`}>
                                            
                                            {/* Card Header */}
                                            <div className="flex justify-between items-center z-10 border-b border-white/10 pb-1.5">
                                              <div className="flex items-center gap-1.5">
                                                <div className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center ${
                                                  ktaTheme === "emerald" ? "bg-emerald-400 text-zinc-950" : ktaTheme === "dark" ? "bg-zinc-400 text-zinc-950" : "bg-pmii-gold text-[#090d16]"
                                                }`}>
                                                  <span className="text-[10px] font-black">P</span>
                                                </div>
                                                <span className={`text-[10px] font-black tracking-wider uppercase ${
                                                  ktaTheme === "emerald" ? "text-emerald-400" : ktaTheme === "dark" ? "text-zinc-300" : "text-pmii-gold"
                                                }`}>KTA PMII</span>
                                              </div>
                                              <span className="text-[8px] font-black text-white/50 tracking-widest uppercase">PENGURUS CABANG</span>
                                            </div>

                                            {/* Card Info Center */}
                                            <div className="flex items-center gap-3.5 z-10 my-3">
                                              <Avatar className={`w-14 h-14 border shadow-lg rounded-lg ${
                                                ktaTheme === "emerald" ? "border-emerald-400/40" : ktaTheme === "dark" ? "border-zinc-400/30" : "border-pmii-gold/40"
                                              }`}>
                                                <AvatarFallback className={`text-zinc-950 font-black text-base ${
                                                  ktaTheme === "emerald" ? "bg-gradient-to-tr from-emerald-400 to-emerald-600 text-white" : ktaTheme === "dark" ? "bg-gradient-to-tr from-zinc-400 to-zinc-600 text-white" : "bg-gradient-to-tr from-pmii-gold to-pmii-gold-dark"
                                                }`}>
                                                  {selectedMember.name.split(" ").slice(-2).map(n => n[0]).join("")}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="flex flex-col min-w-0">
                                                <span className={`text-xs font-black truncate ${
                                                  ktaTheme === "emerald" ? "text-emerald-400" : ktaTheme === "dark" ? "text-white" : "text-pmii-gold"
                                                }`}>{selectedMember.name}</span>
                                                <span className="text-[9px] text-zinc-300 font-mono tracking-tighter mt-0.5 truncate">{selectedMember.nipa}</span>
                                                <span className="text-[8px] text-zinc-400 mt-0.5 italic">{selectedMember.komisariat}</span>
                                              </div>
                                            </div>

                                            {/* Card Footer */}
                                            <div className="flex justify-between items-end z-10 border-t border-white/5 pt-2">
                                              <div className="flex flex-col">
                                                <span className="text-[6px] text-zinc-450 uppercase tracking-widest font-bold">Kaderisasi Utama</span>
                                                <span className={`text-[9px] font-black leading-none mt-0.5 ${
                                                  ktaTheme === "emerald" ? "text-emerald-400" : ktaTheme === "dark" ? "text-zinc-300" : "text-pmii-gold"
                                                }`}>{selectedMember.level}</span>
                                              </div>
                                              
                                              {/* Mini stamp sign visual */}
                                              <div className="flex flex-col items-center">
                                                <div className="w-7 h-3.5 border border-emerald-500/35 bg-emerald-500/5 rounded flex items-center justify-center relative rotate-[-3deg]">
                                                  <span className="text-[5px] text-emerald-400 font-black uppercase scale-75">VALID</span>
                                                </div>
                                                <span className="text-[5px] text-white/40 mt-0.5">PC PMII</span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Theme Selector */}
                                          <div className="flex items-center gap-2 mt-1 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-150 dark:border-zinc-900 w-full max-w-[340px] justify-between">
                                            <span className="text-[9px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-wider pl-1">Tema KTA:</span>
                                            <div className="flex gap-2">
                                              <button 
                                                type="button"
                                                onClick={() => setKtaTheme("gold")}
                                                className={`w-4.5 h-4.5 rounded-full bg-gradient-to-r from-pmii-gold to-yellow-500 border-2 cursor-pointer transition-transform ${ktaTheme === "gold" ? "border-white dark:border-[#080d16] scale-110" : "border-transparent opacity-60"}`}
                                                title="Gold Premium"
                                              />
                                              <button 
                                                type="button"
                                                onClick={() => setKtaTheme("emerald")}
                                                className={`w-4.5 h-4.5 rounded-full bg-gradient-to-r from-emerald-450 to-teal-500 border-2 cursor-pointer transition-transform ${ktaTheme === "emerald" ? "border-white dark:border-[#080d16] scale-110" : "border-transparent opacity-60"}`}
                                                title="Emerald Green"
                                              />
                                              <button 
                                                type="button"
                                                onClick={() => setKtaTheme("dark")}
                                                className={`w-4.5 h-4.5 rounded-full bg-gradient-to-r from-zinc-500 to-zinc-400 border-2 cursor-pointer transition-transform ${ktaTheme === "dark" ? "border-white dark:border-[#080d16] scale-110" : "border-transparent opacity-60"}`}
                                                title="Midnight Carbon"
                                              />
                                            </div>
                                          </div>

                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleDownloadKTA(selectedMember)}
                                            className="w-full max-w-[340px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950 cursor-pointer transition-colors duration-200"
                                          >
                                            <Download className={`w-4 h-4 ${
                                              ktaTheme === "emerald" ? "text-emerald-400" : ktaTheme === "dark" ? "text-zinc-300" : "text-pmii-gold"
                                            }`} /> Unduh KTA (.PNG)
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                </div>

                                {/* Dialog Footer close trigger */}
                                <div className="p-4 md:p-6 border-t border-zinc-150 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 flex items-center justify-end shrink-0">
                                  <DialogClose render={
                                    <Button type="button" variant="outline" className="text-xs rounded-lg font-bold px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-850 cursor-pointer">
                                      Tutup Detail
                                    </Button>
                                  } />
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {/* Edit Action (Triggers global Edit Dialog) */}
                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          onClick={() => startEditMember(member)}
                          className="rounded-lg hover:bg-amber-500/5 hover:text-amber-500 dark:hover:bg-amber-400/5 dark:hover:text-amber-400 cursor-pointer"
                          title="Edit Profil"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>

                        {/* Delete Action (Triggers global Delete Confirm Dialog) */}
                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          onClick={() => { setDeletingMember(member); setIsDeleteOpen(true); }}
                          className="rounded-lg hover:bg-rose-500/5 hover:text-rose-500 dark:hover:bg-rose-400/5 dark:hover:text-rose-400 cursor-pointer"
                          title="Hapus Kader"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Premium flat pagination bar */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/20 dark:bg-black/5">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Menampilkan <span className="text-zinc-800 dark:text-zinc-200 font-extrabold">{indexOfFirstItem + 1}</span> - <span className="text-zinc-800 dark:text-zinc-200 font-extrabold">{Math.min(indexOfLastItem, filteredMembers.length)}</span> dari <span className="text-zinc-800 dark:text-zinc-200 font-extrabold">{filteredMembers.length}</span> Kader
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="text-xs rounded-lg px-3 py-1.5 font-extrabold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer disabled:opacity-40 shadow-none"
                >
                  <ChevronLeft className="w-4 h-4 mr-1 inline-block" /> Sebelumnya
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isActive = currentPage === pageNum;
                    return (
                      <Button
                        key={pageNum}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`text-xs rounded-lg w-8 h-8 font-extrabold flex items-center justify-center border cursor-pointer transition-all ${
                          isActive
                            ? "bg-pmii-blue text-white dark:bg-pmii-gold dark:text-[#090d16] border-none shadow-none"
                            : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-none"
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="text-xs rounded-lg px-3 py-1.5 font-extrabold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer disabled:opacity-40 shadow-none"
                >
                  Selanjutnya <ChevronRight className="w-4 h-4 ml-1 inline-block" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EDIT PROFILE DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-screen h-screen max-w-none max-h-none sm:max-w-none rounded-none border-none top-0 left-0 translate-x-0 translate-y-0 p-0 gap-0 flex flex-col bg-white dark:bg-[#090d16]">
          {/* Premium Wizard Header */}
          <div className="p-6 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 dark:from-[#201505] dark:to-[#352508] text-white border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="max-w-4xl mx-auto w-full">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-pmii-gold/15 flex items-center justify-center text-pmii-gold border border-pmii-gold/30">
                    <Pencil className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold flex items-center gap-2 text-white">
                      Edit Profil Kader PMII
                    </h2>
                    <p className="text-[11px] text-zinc-200 dark:text-zinc-400">
                      Perbarui 15 data profil secara lengkap dan simpan perubahan ke database pusat.
                    </p>
                  </div>
                </div>
                <DialogClose render={
                  <button className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer border-none">
                    <X className="w-4.5 h-4.5" />
                  </button>
                } />
              </div>

              {/* Horizontal Step Tracker */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {[
                  { id: "diri", label: "Data Diri", icon: User },
                  { id: "akademik", label: "Akademik & Kontak", icon: GraduationCap },
                  { id: "riwayat", label: "Pendidikan & Organisasi", icon: Briefcase },
                  { id: "motivasi", label: "Karakter & Wilayah", icon: Compass }
                ].map((step, idx) => {
                  const isActive = activeEditTab === step.id;
                  const isCompleted = 
                    (step.id === "diri" && activeEditTab !== "diri") ||
                    (step.id === "akademik" && (activeEditTab === "riwayat" || activeEditTab === "motivasi")) ||
                    (step.id === "riwayat" && activeEditTab === "motivasi");
                  
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setActiveEditTab(step.id)}
                      className={`flex flex-col md:flex-row items-center gap-2 p-2 rounded-lg transition-all cursor-pointer border-none text-left ${
                        isActive 
                          ? "bg-white/10 ring-1 ring-pmii-gold/40 text-white" 
                          : isCompleted
                          ? "text-emerald-400 opacity-90"
                          : "text-white/55 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive 
                          ? "bg-pmii-gold text-zinc-950 font-bold" 
                          : isCompleted
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-white/10 text-white"
                      }`}>
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <div className="hidden md:block min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider block leading-none">Step {idx + 1}</span>
                        <span className="text-xs font-bold truncate block mt-0.5">{step.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Container */}
          <form onSubmit={handleSaveEditMember} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/20">
              <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6 w-full">
              
              {/* STEP 1: DATA DIRI */}
              {activeEditTab === "diri" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <User className="w-4 h-4 text-pmii-gold" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">A. Identitas Diri Utama</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nama Lengkap */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Nama Lengkap *</label>
                      <Input
                        required
                        placeholder="Contoh: Sahabat Ahmad Fauzi"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-pmii-gold/30"
                      />
                    </div>

                    {/* Jenis Kelamin */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Jenis Kelamin</label>
                      <Select value={editGender} onValueChange={(val) => { if (val) setEditGender(val as any); }}>
                        <SelectTrigger className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                          <SelectValue placeholder="Gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800">
                          <SelectItem value="Laki-laki">Laki-laki (Sahabat)</SelectItem>
                          <SelectItem value="Perempuan">Perempuan (Sahabati)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* NIK Input (Full Width for 16 Digit Box) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Nomor Induk Kependudukan (NIK) *</label>
                    <NikInput value={editNik} onChange={setEditNik} />
                  </div>

                  {/* KTP Upload (Full Width) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Unggah KTP</label>
                    {editKtpName ? (
                      <div className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                            {editKtpUploading ? (
                              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            ) : (
                              <Check className="w-4.5 h-4.5" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">{editKtpName}</span>
                            <span className="text-[9px] text-zinc-400 mt-0.5">
                              {editKtpUploading ? `Mengunggah... ${editKtpProgress}%` : "Berkas Tersimpan (Simulasi)"}
                            </span>
                          </div>
                        </div>
                        {!editKtpUploading && (
                          <button 
                            type="button" 
                            onClick={() => setEditKtpName("")}
                            className="text-zinc-400 hover:text-rose-500 transition-colors p-1 cursor-pointer border-none bg-transparent"
                          >
                            <Trash className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="relative group">
                        <input 
                          type="file" 
                          accept="image/*,application/pdf"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              simulateUpload("ktp", true, file.name);
                            }
                          }}
                        />
                        <div className="flex flex-col items-center justify-center py-2.5 px-4 border border-dashed border-zinc-200 dark:border-zinc-800 group-hover:border-pmii-gold/60 rounded-lg transition-all bg-white dark:bg-zinc-900/50">
                          <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4 text-zinc-400 group-hover:text-pmii-gold transition-colors" />
                            <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">Pilih File KTP</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* TTL */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Tempat Lahir</label>
                      <Input
                        placeholder="Contoh: Semarang"
                        value={editTempatLahir}
                        onChange={(e) => setEditTempatLahir(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Tanggal Lahir</label>
                      <Input
                        type="date"
                        value={editTanggalLahir}
                        onChange={(e) => setEditTanggalLahir(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Alamat Rumah */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Alamat Rumah (Sesuai KTP)</label>
                      <Input
                        placeholder="Jl. Merdeka No. 12, RT 01/RW 02"
                        value={editAlamatRumah}
                        onChange={(e) => setEditAlamatRumah(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>

                    {/* Alamat Domisili */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Alamat Domisili Mahasiswa</label>
                      <Input
                        placeholder="Kos Barokah, Gang Kyai RT 03/RW 04, Ngaliyan"
                        value={editAlamatDomisili}
                        onChange={(e) => setEditAlamatDomisili(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Pas Foto Upload */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-150 dark:border-zinc-800/80">
                    <div className="flex flex-col md:flex-row items-center gap-5">
                      <div className="relative w-20 h-20 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 border border-zinc-300 dark:border-zinc-700 overflow-hidden shrink-0">
                        {editPasFotoName && !editPasFotoUploading ? (
                          <div className="w-full h-full bg-gradient-to-tr from-amber-500 to-amber-700 dark:from-pmii-gold dark:to-yellow-600 flex items-center justify-center text-white dark:text-zinc-950 font-black text-2xl">
                            {editName ? editName.split(" ").slice(-2).map(n => n[0]).join("") : "KB"}
                          </div>
                        ) : (
                          <Camera className="w-8 h-8" />
                        )}
                        {editPasFotoUploading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <svg className="animate-spin w-6 h-6 text-pmii-gold" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 text-center md:text-left w-full">
                        <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">K. Pas Foto 3x4 Resmi</span>
                        {editPasFotoName ? (
                          <div className="flex items-center justify-center md:justify-between p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-md">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">{editPasFotoName}</span>
                            <button
                              type="button"
                              onClick={() => setEditPasFotoName("")}
                              className="text-zinc-400 hover:text-rose-500 text-xs font-bold cursor-pointer border-none bg-transparent ml-2"
                            >
                              Hapus
                            </button>
                          </div>
                        ) : (
                          <div className="relative inline-block">
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) simulateUpload("pasFoto", true, file.name);
                              }}
                            />
                            <Button type="button" variant="outline" className="text-xs rounded-lg flex items-center gap-1.5 font-bold">
                              <Upload className="w-3.5 h-3.5" /> Ganti Pas Foto Resmi
                            </Button>
                          </div>
                        )}
                        <p className="text-[10px] text-zinc-400 mt-1">Latar belakang merah/biru, wajah terlihat jelas, maks. 2MB.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: AKADEMIK & KONTAK */}
              {activeEditTab === "akademik" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <GraduationCap className="w-4.5 h-4.5 text-pmii-gold" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">B. Data Akademik & Kontak Sosmed</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Perguruan Tinggi */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Perguruan Tinggi</label>
                      <Input
                        placeholder="Contoh: UIN Walisongo"
                        value={editPerguruanTinggi}
                        onChange={(e) => setEditPerguruanTinggi(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>

                    {/* Fakultas */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Fakultas</label>
                      <Input
                        placeholder="Contoh: Syariah & Hukum"
                        value={editFakultas}
                        onChange={(e) => setEditFakultas(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>

                    {/* Jurusan */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Jurusan / Program Studi</label>
                      <Input
                        placeholder="Contoh: Hukum Keluarga Islam"
                        value={editJurusan}
                        onChange={(e) => setEditJurusan(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* KTM Upload Zone */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Unggah Kartu Tanda Mahasiswa (KTM)</label>
                    {editKtmName ? (
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                            {editKtmUploading ? (
                              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            ) : (
                              <Check className="w-4.5 h-4.5" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">{editKtmName}</span>
                            <span className="text-[9px] text-zinc-400 mt-0.5">
                              {editKtmUploading ? `Mengunggah... ${editKtmProgress}%` : "KTM berhasil diverifikasi (Simulasi)"}
                            </span>
                          </div>
                        </div>
                        {!editKtmUploading && (
                          <button 
                            type="button" 
                            onClick={() => setEditKtmName("")}
                            className="text-zinc-400 hover:text-rose-500 transition-colors p-1 cursor-pointer border-none bg-transparent"
                          >
                            <Trash className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="relative group">
                        <input 
                          type="file" 
                          accept="image/*,application/pdf"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) simulateUpload("ktm", true, file.name);
                          }}
                        />
                        <div className="flex flex-col items-center justify-center py-4 px-4 border border-dashed border-zinc-200 dark:border-zinc-800 group-hover:border-pmii-gold/60 rounded-lg transition-all bg-white dark:bg-zinc-900/50">
                          <Upload className="w-5 h-5 text-zinc-400 group-hover:text-pmii-gold transition-colors mb-1.5" />
                          <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">Seret atau Pilih KTM Baru</span>
                          <span className="text-[9px] text-zinc-400 mt-0.5">PNG, JPG, PDF maks 5MB</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* WhatsApp / HP */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Nomor HP / WhatsApp *</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          required
                          placeholder="Contoh: +62 812-3456-7890"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Alamat Email *</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          required
                          type="email"
                          placeholder="contoh@gmail.com"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sosial Media */}
                  <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-150 dark:border-zinc-800/80 space-y-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">J. Akun Media Sosial</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Instagram */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Instagram</label>
                        <div className="relative">
                          <Instagram className="w-4 h-4 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <Input
                            placeholder="@username"
                            value={editInstagram}
                            onChange={(e) => setEditInstagram(e.target.value)}
                            className="w-full text-xs pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Twitter */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Twitter / X</label>
                        <div className="relative">
                          <Twitter className="w-4 h-4 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <Input
                            placeholder="@username"
                            value={editTwitter}
                            onChange={(e) => setEditTwitter(e.target.value)}
                            className="w-full text-xs pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Facebook */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Facebook</label>
                        <div className="relative">
                          <Facebook className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                          <Input
                            placeholder="Nama Facebook"
                            value={editFacebook}
                            onChange={(e) => setEditFacebook(e.target.value)}
                            className="w-full text-xs pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Organisasi details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Kaderisasi</label>
                      <Select value={editLevel} onValueChange={(val) => { if (val) setEditLevel(val as any); }}>
                        <SelectTrigger className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                          <SelectValue placeholder="Tingkat" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800">
                          <SelectItem value="MAPABA">MAPABA (Mu'takid)</SelectItem>
                          <SelectItem value="PKD">PKD (Mujahid)</SelectItem>
                          <SelectItem value="PKL">PKL (Mujtahid)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Komisariat</label>
                      <Select 
                        value={editKomisariat} 
                        disabled={currentUser?.role !== "ADMIN"}
                        onValueChange={(val) => { 
                          if (val) {
                            setEditKomisariat(val);
                            if (val === "Komisariat Walisongo") {
                              setEditProvinsi("Jawa Tengah");
                              setEditKabupaten("Kota Semarang");
                              setEditKecamatan("Ngaliyan");
                            } else if (val === "Komisariat Diponegoro") {
                              setEditProvinsi("Jawa Tengah");
                              setEditKabupaten("Kota Semarang");
                              setEditKecamatan("Tembalang");
                            } else if (val === "Komisariat Sunan Kalijaga") {
                              setEditProvinsi("D.I. Yogyakarta");
                              setEditKabupaten("Sleman");
                              setEditKecamatan("Depok");
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg disabled:opacity-80">
                          <SelectValue placeholder="Komisariat" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800">
                          <SelectItem value="Komisariat Walisongo">Komisariat Walisongo</SelectItem>
                          <SelectItem value="Komisariat Diponegoro">Komisariat Diponegoro</SelectItem>
                          <SelectItem value="Komisariat Sunan Kalijaga">Komisariat Sunan Kalijaga</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: RIWAYAT & ORGANISASI */}
              {activeEditTab === "riwayat" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <Briefcase className="w-4.5 h-4.5 text-pmii-gold" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">C. Riwayat Pendidikan & Pengalaman Organisasi</h3>
                  </div>

                  {/* Riwayat Pendidikan */}
                  <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800/80">
                    <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">G. Riwayat Pendidikan Formal</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* SD */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sekolah Dasar (SD / MI)</label>
                        <Input
                          placeholder="Nama SD / MI & Tahun Lulus"
                          value={editPendidikanSD}
                          onChange={(e) => setEditPendidikanSD(e.target.value)}
                          className="w-full text-xs px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>

                      {/* SMP */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">SMP / MTs</label>
                        <Input
                          placeholder="Nama SMP / MTs & Tahun Lulus"
                          value={editPendidikanSMP}
                          onChange={(e) => setEditPendidikanSMP(e.target.value)}
                          className="w-full text-xs px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>

                      {/* SMA */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">SMA / MA / SMK</label>
                        <Input
                          placeholder="Nama SMA / SMK & Tahun Lulus"
                          value={editPendidikanSMA}
                          onChange={(e) => setEditPendidikanSMA(e.target.value)}
                          className="w-full text-xs px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pengalaman Organisasi */}
                  <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800/80">
                    <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">M. Pengalaman Organisasi (SD s/d Perguruan Tinggi)</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* SD */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tingkat SD (Pramuka, UKS, PMR dll)</label>
                        <Input
                          placeholder="Contoh: Pramuka - Anggota"
                          value={editOrganisasiSD}
                          onChange={(e) => setEditOrganisasiSD(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>

                      {/* SMP */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tingkat SMP (OSIS, Dewan Galang dll)</label>
                        <Input
                          placeholder="Contoh: OSIS - Sekretaris I"
                          value={editOrganisasiSMP}
                          onChange={(e) => setEditOrganisasiSMP(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* SMA */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tingkat SMA (Pramuka, IPNU/IPPNU, OSIS dll)</label>
                        <Input
                          placeholder="Contoh: Ketua OSIS SMA, IPPNU"
                          value={editOrganisasiSMA}
                          onChange={(e) => setEditOrganisasiSMA(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>

                      {/* PT */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tingkat Kampus (BEM, HIMA, UKM dll)</label>
                        <Input
                          placeholder="Contoh: BEM - Staf Humas, Kopma"
                          value={editOrganisasiPT}
                          onChange={(e) => setEditOrganisasiPT(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Tahun Angkatan</label>
                      <Input
                        type="number"
                        value={editAngkatan}
                        onChange={(e) => setEditAngkatan(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Jabatan Pengurus</label>
                      <Input
                        placeholder="Contoh: Ketua Bidang Kaderisasi"
                        value={editJabatan}
                        onChange={(e) => setEditJabatan(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: KARAKTER & MOTIVASI */}
              {activeEditTab === "motivasi" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <Compass className="w-4.5 h-4.5 text-pmii-gold" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">D. Karakter, Profil Kesehatan, Status & Wilayah</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Golongan Darah */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Golongan Darah</label>
                      <Select value={editGolonganDarah} onValueChange={(val) => { if (val) setEditGolonganDarah(val); }}>
                        <SelectTrigger className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                          <SelectValue placeholder="Gol. Darah" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800">
                          <SelectItem value="A">Golongan A</SelectItem>
                          <SelectItem value="B">Golongan B</SelectItem>
                          <SelectItem value="AB">Golongan AB</SelectItem>
                          <SelectItem value="O">Golongan O</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Riwayat Penyakit */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Riwayat Penyakit (Alergi, Asma, Maag, dll)</label>
                      <div className="relative">
                        <Heart className="w-4 h-4 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          placeholder="Isi 'Tidak Ada' jika sehat wal'afiat"
                          value={editRiwayatPenyakit}
                          onChange={(e) => setEditRiwayatPenyakit(e.target.value)}
                          className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Orientasi & Passion */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Orientasi Profetik */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Orientasi Profetik (Pandangan Hidup / Keislaman)</label>
                      <Input
                        placeholder="Contoh: Keadilan sosial, dakwah islam rahmatan lil alamin"
                        value={editOrientasiProfetik}
                        onChange={(e) => setEditOrientasiProfetik(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>

                    {/* Minat atau Passion */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Minat / Bakat / Passion</label>
                      <Input
                        placeholder="Contoh: Orasi, Kepenulisan Kreatif, Desain Grafis, IT"
                        value={editMinatPassion}
                        onChange={(e) => setEditMinatPassion(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Motivasi MAPABA */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">O. Motivasi Mengikuti MAPABA PMII</label>
                    <Input
                      placeholder="Ceritakan singkat motivasi Anda mendaftar MAPABA PMII..."
                      value={editMotivasiMapaba}
                      onChange={(e) => setEditMotivasiMapaba(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                    />
                  </div>

                  {/* Status & Wilayah Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-zinc-150 dark:border-zinc-800/80">
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Status Kader</label>
                      <Select value={editStatus} onValueChange={(val) => { if (val) setEditStatus(val as any); }}>
                        <SelectTrigger className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800">
                          <SelectItem value="Aktif">Aktif</SelectItem>
                          <SelectItem value="Alumni">Alumni</SelectItem>
                          <SelectItem value="Pasif">Pasif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Provinsi Cabang</label>
                      <Input
                        value={editProvinsi}
                        onChange={(e) => setEditProvinsi(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Kabupaten/Kota</label>
                      <Input
                        value={editKabupaten}
                        onChange={(e) => setEditKabupaten(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Kecamatan</label>
                      <Input
                        value={editKecamatan}
                        onChange={(e) => setEditKecamatan(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              </div>
            </div>

            {/* Wizard Footer Controls */}
            <div className="p-4 md:p-6 border-t border-zinc-150 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40">
              <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                <DialogClose render={
                  <Button type="button" variant="outline" className="text-xs rounded-lg font-bold px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                    Batal
                  </Button>
                } />

                <div className="flex items-center gap-2">
                  {/* Back button */}
                  {activeEditTab !== "diri" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (activeEditTab === "motivasi") setActiveEditTab("riwayat");
                        else if (activeEditTab === "riwayat") setActiveEditTab("akademik");
                        else if (activeEditTab === "akademik") setActiveEditTab("diri");
                      }}
                      className="text-xs rounded-lg font-bold px-4 py-2 flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> Kembali
                    </Button>
                  )}

                  {/* Next or Submit Button */}
                  {activeEditTab !== "motivasi" ? (
                    <Button
                      type="button"
                      onClick={() => {
                        if (activeEditTab === "diri") {
                          if (!editName.trim()) { showToast("Nama Lengkap wajib diisi!"); return; }
                          setActiveEditTab("akademik");
                        }
                        else if (activeEditTab === "akademik") {
                          if (!editPhone.trim() || !editEmail.trim()) { showToast("Nomor HP dan Email wajib diisi!"); return; }
                          setActiveEditTab("riwayat");
                        }
                        else if (activeEditTab === "riwayat") {
                          setActiveEditTab("motivasi");
                        }
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg px-4.5 py-2 flex items-center gap-1 cursor-pointer border-none shadow-md"
                    >
                      Selanjutnya <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg px-5 py-2 cursor-pointer border-none shadow-md shadow-emerald-600/10 flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Simpan Perubahan
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-none p-5 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" /> Hapus Data Kader
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Apakah Anda yakin ingin menghapus data kader ini? Tindakan ini permanen dan tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          {deletingMember && (
            <div className="my-4 p-3 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-rose-200 dark:border-rose-800/40 shadow-xs">
                <AvatarFallback className="bg-rose-500 text-white font-bold text-xs">
                  {deletingMember.name.split(" ").slice(-2).map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{deletingMember.name}</span>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5">{deletingMember.nipa}</span>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <DialogClose render={<Button type="button" variant="outline" className="text-xs rounded-lg" />}>
              Batal
            </DialogClose>
            <Button 
              type="button" 
              onClick={() => deletingMember && handleDeleteMember(deletingMember.id)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg border-none"
            >
              Ya, Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3 bg-zinc-900 text-white border border-zinc-800 px-4 py-3 rounded-lg shadow-xl max-w-sm">
            <div className="w-6 h-6 rounded-full bg-[#F7C738] flex items-center justify-center text-[#0A2A5C] shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-tight">{toastMessage}</p>
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
}

// Simple fallback icon to avoid import errors
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function Instagram({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function Twitter({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function Facebook({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

