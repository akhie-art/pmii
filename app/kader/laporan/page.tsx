"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  FileText,
  Link as LinkIcon,
  Send,
  Sparkles,
  User
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogClose
} from "@/components/ui/dialog";

interface FollowUpRequirement {
  id: string;
  title: string;
  category: string;
  level: "MAPABA" | "PKD" | "PKL";
  description: string;
  minSubmissions: number;
}

interface CadreSubmission {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  fileLink: string;
  date: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  feedback: string;
}

interface CadreFollowUp {
  id: string;
  name: string;
  level: "MAPABA" | "PKD" | "PKL";
  commissariat: string;
  rayon?: string;
  startDate: string;
  status: "AKTIF" | "SELESAI" | "REVISI";
  submissions: CadreSubmission[];
}

export default function LaporanPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // State from LocalStorage
  const [cadres, setCadres] = useState<CadreFollowUp[]>([]);
  const [requirements, setRequirements] = useState<FollowUpRequirement[]>([]);
  const [currentCadre, setCurrentCadre] = useState<CadreFollowUp | null>(null);

  // Form Fields State
  const [selectedReqId, setSelectedReqId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileLink, setFileLink] = useState("");
  const [date, setDate] = useState("");

  // Dialog State
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const activeId = typeof window !== "undefined" ? (localStorage.getItem("PMII_ACTIVE_CADRE_ID") || "") : "";
      
      const allCadres = await db.getCadres([]);
      const mine = allCadres.find(c => c.id === activeId) || allCadres[0] || null;
      
      const allReqs = await db.getRequirements([]);

      setCadres(allCadres);
      if (mine) {
        setRequirements(allReqs.filter(r => r.level === mine.level) as any);
      }
      setCurrentCadre(mine);
      setDate(new Date().toISOString().split("T")[0]);
      setMounted(true);
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCadre || !selectedReqId || !title.trim()) return;

    // Create new submission
    const newSubmission: CadreSubmission = {
      id: `sub-${Date.now()}`,
      requirementId: selectedReqId,
      title: title.trim(),
      description: description.trim(),
      fileLink: fileLink.trim() || "Tidak ada berkas terlampir",
      date: date || new Date().toISOString().split("T")[0],
      status: "PENDING",
      feedback: ""
    };

    // Update cadre object
    const updatedCadre = {
      ...currentCadre,
      submissions: [newSubmission, ...currentCadre.submissions]
    };

    // Update entire list
    const updatedCadres = cadres.map(c => c.id === currentCadre.id ? updatedCadre : c);

    // Save to Database
    setCadres(updatedCadres);
    setCurrentCadre(updatedCadre);
    await db.saveCadres(updatedCadres);

    // Show success dialog
    setIsSuccessOpen(true);
  };

  const handleRedirect = () => {
    setIsSuccessOpen(false);
    router.push("/kader");
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-28 bg-zinc-200 dark:bg-zinc-800/40 rounded-3xl animate-pulse" />
        <div className="h-96 bg-zinc-200 dark:bg-zinc-800/40 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!currentCadre) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-white dark:bg-[#090d16]/80 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl max-w-md mx-auto shadow-lg space-y-6 font-sans text-zinc-900 dark:text-zinc-100">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-black text-zinc-800 dark:text-white">Profil Tidak Ditemukan</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed font-semibold">
            Data profil Anda tidak ditemukan di database. Silakan masuk kembali dengan akun Anda or daftarkan diri.
          </p>
        </div>
        <div className="flex gap-4 w-full justify-center">
          <Link href="/login" className="w-1/2">
            <Button className="w-full bg-pmii-blue hover:bg-pmii-blue-light text-white font-bold text-xs h-9 rounded-xl border-none cursor-pointer">
              Masuk (Login)
            </Button>
          </Link>
          <Link href="/register" className="w-1/2">
            <Button variant="outline" className="w-full border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs h-9 rounded-xl cursor-pointer">
              Daftar (Register)
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const selectedRequirement = requirements.find(r => r.id === selectedReqId);

  return (
    <div className="space-y-6 max-w-3xl mx-auto text-zinc-900 dark:text-zinc-100">
      
      {/* HEADER BAR */}
      <div className="flex items-center justify-between">
        <Link href="/kader">
          <Button variant="outline" size="sm" className="rounded-xl border-zinc-200 dark:border-zinc-800 h-9 font-semibold text-xs flex items-center gap-1.5 cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Progres
          </Button>
        </Link>
        <Badge className="bg-pmii-gold/10 hover:bg-pmii-gold/15 border border-pmii-gold/20 text-pmii-gold text-[10px] font-extrabold uppercase py-0.5 tracking-wider px-2">
          Format RKTL {currentCadre.level}
        </Badge>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
      >
        <Card className="bg-white dark:bg-[#090d16]/80 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm ring-1 ring-foreground/5">
          <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
            <CardTitle className="text-sm font-extrabold tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-pmii-gold animate-spin-slow" /> Form Penyerahan Laporan Progres RKTL
            </CardTitle>
            <CardDescription className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
              Isi parameter kajian wajib Anda. Laporan akan ditinjau langsung oleh Pengurus Cabang/Komisariat untuk verifikasi kelulusan.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* REQUIREMENT DROPDOWN */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                  Kategori Syarat RKTL
                </label>
                <Select value={selectedReqId} onValueChange={(val) => val && setSelectedReqId(val)}>
                  <SelectTrigger className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg h-9">
                    <SelectValue placeholder="Pilih persyaratan yang ingin dilaporkan..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#090d16] border-zinc-200 dark:border-zinc-800">
                    {requirements.map(req => (
                      <SelectItem key={req.id} value={req.id} className="text-xs focus:bg-zinc-100 dark:focus:bg-zinc-800/60">
                        {req.title} ({req.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRequirement && (
                  <p className="text-[9px] text-pmii-gold font-semibold bg-pmii-gold/5 border border-pmii-gold/10 p-2 rounded-lg mt-1.5">
                    💡 <strong>Keterangan Syarat:</strong> {selectedRequirement.description}
                  </p>
                )}
              </div>

              {/* JUDUL */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                  Judul Laporan / Resume Kajian
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450" />
                  <Input
                    placeholder="Contoh: Resume Buku Sejarah Pergerakan Islam"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                  />
                </div>
              </div>

              {/* TANGGAL & FILE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Tanggal Pelaporan / Kajian
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450" />
                    <Input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Tautan Berkas Pendukung (GDrive/PDF)
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450" />
                    <Input
                      placeholder="https://drive.google.com/file/... (opsional)"
                      value={fileLink}
                      onChange={(e) => setFileLink(e.target.value)}
                      className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                    />
                  </div>
                </div>
              </div>

              {/* DESKRIPSI */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                  Deskripsi / Resume Ringkas Kajian
                </label>
                <textarea
                  placeholder="Tuliskan intisari materi atau resume kritis kajian wajib yang Anda ikuti di sini..."
                  rows={6}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-pmii-blue dark:focus:border-pmii-gold outline-hidden transition-all text-zinc-900 dark:text-zinc-100"
                />
              </div>

              {/* BUTTON SUBMIT */}
              <Button
                type="submit"
                disabled={!selectedReqId || !title.trim() || !description.trim()}
                className="w-full bg-pmii-blue hover:bg-pmii-blue-light dark:bg-pmii-gold dark:hover:bg-pmii-gold-light text-white dark:text-[#090d16] font-bold text-xs h-9 rounded-xl border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md shadow-pmii-blue/10 dark:shadow-pmii-gold/10"
              >
                <Send className="w-4 h-4" /> Kirim Laporan ke Reviewer
              </Button>

            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* DIALOG SUCCESS */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl max-w-sm text-foreground w-full p-6">
          <DialogHeader className="flex flex-col items-center justify-center text-center space-y-1 pb-2">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
            <DialogTitle className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider">
              Laporan Terkirim
            </DialogTitle>
            <DialogDescription className="text-[10px] text-zinc-400 font-semibold text-center select-text">
              Laporan Anda berhasil dikirim ke antrean review pengurus cabang/komisariat. Silakan pantau status persetujuan secara berkala.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="justify-center sm:justify-center">
            <DialogClose render={<Button onClick={handleRedirect} variant="outline" className="text-xs border-zinc-200 dark:border-zinc-850 h-8 rounded-lg" />}>
              Tutup & Kembali
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
