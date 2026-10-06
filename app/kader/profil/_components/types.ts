import type { CadreFollowUp } from "@/lib/db";

export interface ProfileHeaderProps {
  currentCadre: CadreFollowUp;
  avatar: string;
  isUploadingPhoto: boolean;
  hasMapabaRegistration: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
}

export interface DigitalKtaCardProps {
  currentCadre: CadreFollowUp;
  rolePrefix: string;
  memberNTA: string;
  memberStartDate: string;
  qrCodeDataUrl: string;
  isDownloading: boolean;
  onDownloadCard: () => void;
}

export interface BiodataTabProps {
  isEditing: boolean;
  name: string;
  setName: (val: string) => void;
  gender: "Laki-laki" | "Perempuan";
  setGender: (val: "Laki-laki" | "Perempuan") => void;
  nik: string;
  setNik: (val: string) => void;
  tempatLahir: string;
  setTempatLahir: (val: string) => void;
  tanggalLahir: string;
  setTanggalLahir: (val: string) => void;
  alamatRumah: string;
  setAlamatRumah: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  golonganDarah: string;
  setGolonganDarah: (val: string) => void;
  riwayatPenyakit: string;
  setRiwayatPenyakit: (val: string) => void;
  ktpName: string;
  ktpFileUrl?: string;
  onKtpUpload: (file: File) => void;
  onRemoveKtp: () => void;
}

export interface AcademicTabProps {
  isEditing: boolean;
  perguruanTinggi: string;
  setPerguruanTinggi: (val: string) => void;
  fakultas: string;
  setFakultas: (val: string) => void;
  jurusan: string;
  setJurusan: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  instagram: string;
  setInstagram: (val: string) => void;
  twitter: string;
  setTwitter: (val: string) => void;
  facebook: string;
  setFacebook: (val: string) => void;
  ktmName: string;
  ktmFileUrl?: string;
  onKtmUpload: (file: File) => void;
  onRemoveKtm: () => void;
}

export interface HistoryTabProps {
  isEditing: boolean;
  pendidikanSD: string;
  setPendidikanSD: (val: string) => void;
  pendidikanSMP: string;
  setPendidikanSMP: (val: string) => void;
  pendidikanSMA: string;
  setPendidikanSMA: (val: string) => void;
  organisasiSMP: string;
  setOrganisasiSMP: (val: string) => void;
  organisasiSMA: string;
  setOrganisasiSMA: (val: string) => void;
  organisasiPT: string;
  setOrganisasiPT: (val: string) => void;
}

export interface CharacterTabProps {
  isEditing: boolean;
  setIsEditing?: (val: boolean) => void;
  isGraduated: boolean;
  angkatan: string;
  setAngkatan: (val: string) => void;
  jabatan: string;
  orientasiProfetik: string;
  setOrientasiProfetik: (val: string) => void;
  minatPassion: string;
  setMinatPassion: (val: string) => void;
  motivasiMapaba: string;
  setMotivasiMapaba: (val: string) => void;
  careerProfile?: {
    mbtiCode: string;
    talent: string;
    interest: string;
    formulaResult: string;
    strategicRole?: string;
    description?: string;
    submittedAt?: string;
  };
  onSaveCareerProfile?: (result: any) => Promise<void>;
}

export interface SecurityTabProps {
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  isSavingPassword: boolean;
  onSavePassword: (e: React.FormEvent) => void;
}

export interface SuccessDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
