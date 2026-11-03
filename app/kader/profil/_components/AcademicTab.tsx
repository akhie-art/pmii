"use client";

import React, { useMemo } from "react";
import { Building, BookOpen, GraduationCap, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UNIVERSITY_NAMES,
  findUniversity,
  getFacultiesForUniversity,
  getMajorsForFaculty,
} from "@/lib/academic-data";
import { DocumentAttachment } from "@/components/ui/document-attachment";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { AcademicTabProps } from "./types";
import { ProfileField } from "./ProfileField";

function InstagramIcon({ className }: { className?: string }) {
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

function TwitterIcon({ className }: { className?: string }) {
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
      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
      <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
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

export function AcademicTab({
  isEditing,
  perguruanTinggi,
  setPerguruanTinggi,
  fakultas,
  setFakultas,
  jurusan,
  setJurusan,
  phone,
  setPhone,
  email,
  setEmail,
  instagram,
  setInstagram,
  twitter,
  setTwitter,
  facebook,
  setFacebook,
  ktmName,
  ktmFileUrl,
  onKtmUpload,
  onRemoveKtm
}: AcademicTabProps) {
  const matchedUniv = useMemo(() => findUniversity(perguruanTinggi), [perguruanTinggi]);
  const availableFaculties = useMemo(
    () => getFacultiesForUniversity(matchedUniv?.name || perguruanTinggi),
    [matchedUniv, perguruanTinggi]
  );
  const availableMajors = useMemo(
    () => getMajorsForFaculty(matchedUniv?.name || perguruanTinggi, fakultas),
    [matchedUniv, perguruanTinggi, fakultas]
  );

  const handleUniversityChange = (val: string | null) => {
    if (!val) return;
    setPerguruanTinggi(val);
    const u = findUniversity(val);
    if (u && u.faculties.length === 1 && u.faculties[0].name === "-") {
      setFakultas("-");
    } else {
      setFakultas("");
    }
    setJurusan("");
  };

  const handleFacultyChange = (val: string | null) => {
    if (!val) return;
    setFakultas(val);
    setJurusan("");
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. INFORMASI AKADEMIK (Kampus, Fakultas, Jurusan) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Perguruan Tinggi */}
        <ProfileField
          label="Perguruan Tinggi"
          isEditing={isEditing}
          value={matchedUniv?.name || perguruanTinggi}
          emptyPlaceholder="Kampus belum dipilih"
        >
          <Select
            value={matchedUniv?.name || perguruanTinggi || ""}
            onValueChange={handleUniversityChange}
          >
            <SelectTrigger
              title={matchedUniv?.name || perguruanTinggi || undefined}
              className="w-full h-9.5 text-xs sm:text-sm bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
            >
              <SelectValue placeholder="Pilih Perguruan Tinggi" className="truncate text-left" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 max-h-60">
              {UNIVERSITY_NAMES.map((u) => (
                <SelectItem key={u} value={u} className="text-xs">
                  {u}
                </SelectItem>
              ))}
              {perguruanTinggi &&
                !UNIVERSITY_NAMES.includes(perguruanTinggi) &&
                !matchedUniv && (
                  <SelectItem value={perguruanTinggi} className="text-xs">
                    {perguruanTinggi}
                  </SelectItem>
                )}
            </SelectContent>
          </Select>
        </ProfileField>

        {/* Fakultas */}
        <ProfileField
          label="Fakultas"
          isEditing={isEditing}
          value={fakultas === "-" ? "- (Tanpa Fakultas)" : fakultas}
          emptyPlaceholder="Fakultas belum dipilih"
        >
          {availableFaculties.length > 0 ? (
            <Select
              value={fakultas || ""}
              onValueChange={handleFacultyChange}
            >
              <SelectTrigger
                title={fakultas || undefined}
                className="w-full h-9.5 text-xs sm:text-sm bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
              >
                <SelectValue placeholder="Pilih Fakultas" className="truncate text-left" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 max-h-60">
                {availableFaculties.map((f) => (
                  <SelectItem key={f} value={f} className="text-xs">
                    {f}
                  </SelectItem>
                ))}
                {fakultas && !availableFaculties.includes(fakultas) && fakultas !== "-" && (
                  <SelectItem value={fakultas} className="text-xs">
                    {fakultas}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          ) : (
            <Input
              disabled
              value={
                matchedUniv?.name.includes("Sekolah Tinggi") || (perguruanTinggi || "").toLowerCase().includes("stai")
                  ? "- (Tanpa Fakultas)"
                  : perguruanTinggi
                  ? "-"
                  : "Pilih Kampus terlebih dahulu"
              }
              className="w-full h-9.5 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-xl cursor-not-allowed truncate"
            />
          )}
        </ProfileField>

        {/* Jurusan / Prodi */}
        <ProfileField
          label="Jurusan / Program Studi"
          isEditing={isEditing}
          value={jurusan}
          emptyPlaceholder="Program studi belum dipilih"
        >
          {availableMajors.length > 0 ? (
            <Select
              disabled={availableFaculties.length > 0 && !fakultas}
              value={jurusan || ""}
              onValueChange={(val) => {
                if (val) setJurusan(val);
              }}
            >
              <SelectTrigger
                title={jurusan || undefined}
                className="w-full h-9.5 text-xs sm:text-sm bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
              >
                <SelectValue
                  placeholder={
                    availableFaculties.length > 0 && !fakultas
                      ? "Pilih Fakultas terlebih dahulu"
                      : "Pilih Jurusan / Prodi"
                  }
                  className="truncate text-left"
                />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 max-h-60">
                {availableMajors.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">
                    {m}
                  </SelectItem>
                ))}
                {jurusan && !availableMajors.includes(jurusan) && (
                  <SelectItem value={jurusan} className="text-xs">
                    {jurusan}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          ) : (
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <BookOpen className="size-4 text-zinc-400" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder={
                  !perguruanTinggi
                    ? "Pilih Kampus terlebih dahulu"
                    : "Masukkan nama Jurusan / Prodi"
                }
                value={jurusan}
                onChange={(e) => setJurusan(e.target.value)}
              />
            </InputGroup>
          )}
        </ProfileField>
      </div>

      {/* 2. KONTAK UTAMA (WhatsApp & Email) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        <ProfileField
          label="Nomor WhatsApp / HP"
          required
          isEditing={isEditing}
          value={phone}
          emptyPlaceholder="Nomor WA belum dicantumkan"
          displayValue={
            phone ? (
              <a
                href={`https://wa.me/${phone.replace(/^0/, "62").replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-mono font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{phone}</span>
              </a>
            ) : undefined
          }
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Phone className="size-4 text-emerald-500" />
            </InputGroupAddon>
            <InputGroupInput
              required
              placeholder="Contoh: 08123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="font-mono"
            />
          </InputGroup>
        </ProfileField>

        <ProfileField
          label="Alamat Surel (E-mail)"
          required
          isEditing={isEditing}
          value={email}
          emptyPlaceholder="Email belum dicantumkan"
          displayValue={
            email ? (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400 hover:underline truncate"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{email}</span>
              </a>
            ) : undefined
          }
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Mail className="size-4 text-blue-500" />
            </InputGroupAddon>
            <InputGroupInput
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </InputGroup>
        </ProfileField>
      </div>

      {/* 3. MEDIA SOSIAL (Instagram, Twitter, Facebook) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        <ProfileField
          label="Instagram"
          isEditing={isEditing}
          value={instagram ? `@${instagram.replace(/^@+/, "")}` : ""}
          emptyPlaceholder="Belum dicantumkan"
          displayValue={
            instagram ? (
              <a
                href={`https://instagram.com/${instagram.replace(/^@+/, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 hover:text-pink-600 font-medium truncate"
              >
                <InstagramIcon className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                <span className="truncate">@{instagram.replace(/^@+/, "")}</span>
              </a>
            ) : undefined
          }
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <InstagramIcon className="size-4 text-pink-500" />
              <InputGroupText>@</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              placeholder="username"
              value={instagram.replace(/^@+/, "")}
              onChange={(e) => setInstagram(e.target.value ? `@${e.target.value.replace(/^@+/, "")}` : "")}
            />
          </InputGroup>
        </ProfileField>

        <ProfileField
          label="X (Twitter)"
          isEditing={isEditing}
          value={twitter}
          emptyPlaceholder="Belum dicantumkan"
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <TwitterIcon className="size-4 text-sky-500" />
              <InputGroupText>@</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              placeholder="username"
              value={twitter.replace(/^@+/, "")}
              onChange={(e) => setTwitter(e.target.value)}
            />
          </InputGroup>
        </ProfileField>

        <ProfileField
          label="Facebook"
          isEditing={isEditing}
          value={facebook}
          emptyPlaceholder="Belum dicantumkan"
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <FacebookIcon className="size-4 text-blue-600" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Nama Akun FB"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
            />
          </InputGroup>
        </ProfileField>
      </div>

      {/* 4. BERKAS IDENTITAS KAMPUS (KTM) */}
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        <DocumentAttachment
          label="Unggah Kartu Tanda Mahasiswa (KTM Asli / Scan)"
          badgeLabel="Identitas Mahasiswa Aktif"
          fileName={ktmName}
          fileUrl={ktmFileUrl}
          isEditing={isEditing}
          onUpload={onKtmUpload}
          onRemove={onRemoveKtm}
          accentColor="amber"
        />
      </div>
    </div>
  );
}
