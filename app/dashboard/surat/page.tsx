"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/db";
import type { UserAccount } from "@/lib/db";
import { isRecordInTenant, enforceTenantWrite } from "@/lib/tenancy";
import {
  Mail,
  Plus,
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Send,
  UploadCloud,
  FileSignature,
  Trash2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

// Impor komponen terpisah yang baru saja kita buat
import LetterGeneratorDialog from "./component/letter-generator-dialog";

interface MailItem {
  id: string;
  nomor: string;
  type?: "MASUK" | "KELUAR";
  senderOrRecipient: string;
  subject: string;
  date: string;
  classification: "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi";
  status: "Selesai" | "Diproses" | "Menunggu Tindak Lanjut" | "Terkirim";
  content: string;
  senderTitle: string;
  senderLocation: string;
  dateIndo: string;
  commissariat?: string;
  rayon?: string;
}

export default function SuratPage() {
  const [incoming, setIncoming] = useState<MailItem[]>([]);
  const [outgoing, setOutgoing] = useState<MailItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Pagination states
  const [currentIncomingPage, setCurrentIncomingPage] = useState(1);
  const [currentOutgoingPage, setCurrentOutgoingPage] = useState(1);
  const itemsPerPage = 5;

  // States for Recording New Mail Form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newMailType, setNewMailType] = useState<"MASUK" | "KELUAR">("MASUK");
  const [newNomor, setNewNomor] = useState("");
  const [newSenderRecipient, setNewSenderRecipient] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newClassification, setNewClassification] = useState<"Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi">("Instruksi");
  const [newContent, setNewContent] = useState("");
  const [newSenderTitle, setNewSenderTitle] = useState("");
  const [newSenderLocation, setNewSenderLocation] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing user session:", e);
        }
      }
    }

    const fetchSurat = async () => {
      const data = await db.getSurat();
      if (data && Array.isArray(data)) {
        setIncoming(data.filter((item: any) => item.type === "MASUK"));
        setOutgoing(data.filter((item: any) => item.type === "KELUAR"));
      }
    };
    fetchSurat();
  }, []);

  useEffect(() => {
    setCurrentIncomingPage(1);
    setCurrentOutgoingPage(1);
  }, [searchTerm, classFilter]);

  const filterList = (list: MailItem[]) => {
    return list.filter((item) => {
      const matchesSearch = item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nomor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.senderOrRecipient.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = classFilter === "ALL" || item.classification === classFilter;
      
      const matchesTenant = !item.commissariat || isRecordInTenant(currentUser, {
        commissariat: item.commissariat,
        rayon: item.rayon
      });

      return matchesSearch && matchesClass && matchesTenant;
    });
  };

  const filteredIncoming = filterList(incoming);
  const filteredOutgoing = filterList(outgoing);

  const incomingTotalPages = Math.ceil(filteredIncoming.length / itemsPerPage);
  const currentIncoming = filteredIncoming.slice((currentIncomingPage - 1) * itemsPerPage, currentIncomingPage * itemsPerPage);

  const outgoingTotalPages = Math.ceil(filteredOutgoing.length / itemsPerPage);
  const currentOutgoing = filteredOutgoing.slice((currentOutgoingPage - 1) * itemsPerPage, currentOutgoingPage * itemsPerPage);

  const handleRegisterMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNomor.trim() || !newSubject.trim() || !newSenderRecipient.trim()) return;

    const today = new Date().toISOString().split("T")[0];
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const dateStr = `${new Date().getDate()} ${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

    const newMail: MailItem = enforceTenantWrite<MailItem>(currentUser, {
      id: `${newMailType === "MASUK" ? "in" : "out"}-${Date.now()}`,
      nomor: newNomor,
      type: newMailType,
      senderOrRecipient: newSenderRecipient,
      subject: newSubject,
      date: today,
      classification: newClassification,
      status: newMailType === "MASUK" ? "Menunggu Tindak Lanjut" : "Terkirim",
      content: newContent || "Isi surat terlampir.",
      senderTitle: newSenderTitle || (newMailType === "MASUK" ? "Pengirim" : "PC PMII"),
      senderLocation: newSenderLocation || "Semarang",
      dateIndo: dateStr
    });

    const updatedInc = newMailType === "MASUK" ? [newMail, ...incoming] : incoming;
    const updatedOut = newMailType === "KELUAR" ? [newMail, ...outgoing] : outgoing;

    if (newMailType === "MASUK") setIncoming(updatedInc);
    else setOutgoing(updatedOut);

    await db.saveSurat([...updatedInc, ...updatedOut]);

    // Reset Form fields
    setNewNomor(""); setNewSenderRecipient(""); setNewSubject(""); setNewContent("");
    setIsAddOpen(false);
  };

  // Handler callback saat komponen LetterGeneratorDialog melakukan cetak / simpan surat custom
  const handlePublishCustomLetter = async (data: any) => {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const dateStr = `${new Date().getDate()} ${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

    const newMail: MailItem = enforceTenantWrite<MailItem>(currentUser, {
      id: `out-gen-${Date.now()}`,
      nomor: data.nomor,
      type: "KELUAR",
      senderOrRecipient: data.recipient,
      subject: data.subject,
      date: new Date().toISOString().split("T")[0],
      classification: data.classification,
      status: "Terkirim",
      content: data.content,
      senderTitle: data.senderTitle,
      senderLocation: data.senderLocation,
      dateIndo: dateStr
    });

    const updatedOut = [newMail, ...outgoing];
    setOutgoing(updatedOut);
    await db.saveSurat([...incoming, ...updatedOut]);
  };

  const getClassificationBadge = (cls: MailItem["classification"]) => {
    const variants = {
      Instruksi: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      Permohonan: "bg-sky-500/10 text-sky-500 border-sky-500/20",
      Undangan: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      Rekomendasi: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      Keputusan: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    };
    return <Badge className={`${variants[cls] || variants.Keputusan} font-extrabold rounded-md text-[10px] px-2 py-0.5 border`}>{cls}</Badge>;
  };

  const getStatusBadge = (status: MailItem["status"]) => {
    if (status === "Selesai") return <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-500"><CheckCircle className="w-3.5 h-3.5" /> Selesai</span>;
    if (status === "Diproses") return <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-500"><Clock className="w-3.5 h-3.5" /> Diproses</span>;
    if (status === "Terkirim") return <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-sky-500"><Send className="w-3 h-3" /> Terkirim</span>;
    return <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-500 animate-pulse"><AlertCircle className="w-3.5 h-3.5" /> Belum Dibaca</span>;
  };

  return (
    <div className="space-y-6 relative pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-pmii-blue to-[#2563eb] bg-clip-text text-transparent flex items-center gap-2.5">
            <Mail className="w-7 h-7 text-pmii-gold" /> Administrasi Surat Menyurat (Mail)
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Catat arsip surat masuk dan terbitkan lembaran surat keluar digital.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Form Pencatatan Manual */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={
              <Button className="bg-pmii-blue text-white dark:bg-pmii-gold dark:text-[#090d16] font-bold px-4 py-2 text-xs rounded-xl shadow-none flex items-center gap-2 border-none cursor-pointer">
                <Plus className="w-4 h-4" /> Catat &amp; Unggah Surat
              </Button>
            } />
            <DialogContent className="max-w-lg bg-white rounded-2xl p-5">
              <DialogHeader>
                <DialogTitle className="text-base font-extrabold flex items-center gap-2"><Bookmark className="w-5 h-5 text-pmii-gold" /> Registrasi Surat Baru</DialogTitle>
                <DialogDescription className="text-xs">Lengkapi meta data persuratan di bawah untuk pengarsipan digital organisasi PMII.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleRegisterMail} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-2 rounded-xl">
                  <Button type="button" onClick={() => setNewMailType("MASUK")} className={`text-xs font-bold py-1.5 h-8 rounded-lg cursor-pointer border-none ${newMailType === "MASUK" ? "bg-pmii-blue text-white" : "text-zinc-500"}`} variant="ghost">Surat Masuk</Button>
                  <Button type="button" onClick={() => setNewMailType("KELUAR")} className={`text-xs font-bold py-1.5 h-8 rounded-lg cursor-pointer border-none ${newMailType === "KELUAR" ? "bg-pmii-blue text-white" : "text-zinc-500"}`} variant="ghost">Surat Keluar</Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input required placeholder="Nomor Surat" value={newNomor} onChange={(e) => setNewNomor(e.target.value)} className="text-xs" />
                  <Select value={newClassification} onValueChange={(val: any) => setNewClassification(val)}>
                    <SelectTrigger className="text-xs rounded-xl"><SelectValue placeholder="Klasifikasi" /></SelectTrigger>
                    <SelectContent><SelectItem value="Instruksi">Instruksi</SelectItem><SelectItem value="Permohonan">Permohonan</SelectItem><SelectItem value="Undangan">Undangan</SelectItem><SelectItem value="Keputusan">Keputusan</SelectItem><SelectItem value="Rekomendasi">Rekomendasi</SelectItem></SelectContent>
                  </Select>
                </div>

                <Input required placeholder={newMailType === "MASUK" ? "Pengirim" : "Penerima"} value={newSenderRecipient} onChange={(e) => setNewSenderRecipient(e.target.value)} className="text-xs" />
                <Input required placeholder="Perihal" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} className="text-xs" />
                
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Penulis / TTD" value={newSenderTitle} onChange={(e) => setNewSenderTitle(e.target.value)} className="text-xs" />
                  <Input placeholder="Kota" value={newSenderLocation} onChange={(e) => setNewSenderLocation(e.target.value)} className="text-xs" />
                </div>

                <textarea placeholder="Isi Ringkas" value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={3} className="w-full text-xs p-3 border rounded-xl" />
                
                <div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 bg-zinc-50">
                  <UploadCloud className="w-6 h-6 text-zinc-400" />
                  <span className="text-[10px] font-bold">Tarik berkas kemari atau cari dari lokal komputer</span>
                </div>

                <DialogFooter>
                  <DialogClose render={<Button type="button" variant="outline" className="text-xs rounded-xl" />}>Batal</DialogClose>
                  <Button type="submit" className="bg-pmii-blue text-white font-bold text-xs rounded-xl border-none">Registrasikan Surat</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* MEMANGGIL MODUL SEPARASI YANG BARU SAJA DIPISAHKAN */}
          <LetterGeneratorDialog onPublish={handlePublishCustomLetter} />
        </div>
      </div>

      {/* FILTER PANEL */}
      <Card className="border border-zinc-200 shadow-none rounded-2xl">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-sm flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input type="text" placeholder="Cari perihal, nomor, instansi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 text-xs rounded-xl" />
          </div>

          <Select value={classFilter} onValueChange={(val) => setClassFilter(val ?? "ALL")}>
            <SelectTrigger className="w-[180px] text-xs rounded-xl"><SelectValue placeholder="Klasifikasi" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Klasifikasi</SelectItem>
              <SelectItem value="Instruksi">Instruksi</SelectItem>
              <SelectItem value="Permohonan">Permohonan</SelectItem>
              <SelectItem value="Undangan">Undangan</SelectItem>
              <SelectItem value="Keputusan">Keputusan</SelectItem>
              <SelectItem value="Rekomendasi">Rekomendasi</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* DATA LOG TABLES */}
      <Tabs defaultValue="masuk" className="w-full">
        <TabsList className="bg-zinc-100 p-1 rounded-xl">
          <TabsTrigger value="masuk" className="px-5 py-1.5 text-xs font-bold rounded-lg cursor-pointer">Surat Masuk ({filteredIncoming.length})</TabsTrigger>
          <TabsTrigger value="keluar" className="px-5 py-1.5 text-xs font-bold rounded-lg cursor-pointer">Surat Keluar ({filteredOutgoing.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="masuk" className="mt-4">
          <Card className="rounded-2xl border overflow-hidden shadow-none">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-zinc-50/50 border-b">
                  <TableRow>
                    <TableHead className="font-extrabold text-[11px] pl-6 py-4">Nomor &amp; Tanggal</TableHead>
                    <TableHead className="font-extrabold text-[11px] py-4">Instansi Pengirim</TableHead>
                    <TableHead className="font-extrabold text-[11px] py-4">Perihal / Hal</TableHead>
                    <TableHead className="font-extrabold text-[11px] py-4">Klasifikasi</TableHead>
                    <TableHead className="font-extrabold text-[11px] py-4">Status</TableHead>
                    <TableHead className="font-extrabold text-[11px] text-center pr-6 py-4">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentIncoming.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-xs text-zinc-500">Tidak ada data arsip surat masuk ditemukan.</TableCell></TableRow>
                  ) : (
                    currentIncoming.map((mail) => (
                      <TableRow key={mail.id} className="border-b">
                        <TableCell className="pl-6 py-3.5"><div className="flex flex-col"><span className="text-xs font-bold font-mono">{mail.nomor}</span><span className="text-[9.5px] text-zinc-400 mt-1 flex items-center gap-1 font-semibold"><Calendar className="w-3 h-3" /> {mail.dateIndo}</span></div></TableCell>
                        <TableCell className="py-3.5 text-xs font-semibold">{mail.senderOrRecipient}</TableCell>
                        <TableCell className="py-3.5 text-xs font-bold max-w-xs truncate">{mail.subject}</TableCell>
                        <TableCell className="py-3.5">{getClassificationBadge(mail.classification)}</TableCell>
                        <TableCell className="py-3.5">{getStatusBadge(mail.status)}</TableCell>
                        <TableCell className="text-center pr-6 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button variant="ghost" size="icon-sm" onClick={() => setSelectedMail(mail)} className="rounded-lg hover:bg-pmii-blue/5 text-zinc-600"><Eye className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon-sm" onClick={async () => { if(confirm("Hapus surat?")) { const res = incoming.filter(i => i.id !== mail.id); setIncoming(res); await db.saveSurat([...res, ...outgoing]); } }} className="rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keluar" className="mt-4">
          <Card className="rounded-2xl border overflow-hidden shadow-none">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-zinc-50/50 border-b">
                  <TableRow>
                    <TableHead className="font-extrabold text-[11px] pl-6 py-4">Nomor &amp; Tanggal</TableHead>
                    <TableHead className="font-extrabold text-[11px] py-4">Instansi Tujuan</TableHead>
                    <TableHead className="font-extrabold text-[11px] py-4">Perihal / Hal</TableHead>
                    <TableHead className="font-extrabold text-[11px] py-4">Klasifikasi</TableHead>
                    <TableHead className="font-extrabold text-[11px] py-4">Status</TableHead>
                    <TableHead className="font-extrabold text-[11px] text-center pr-6 py-4">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentOutgoing.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-xs text-zinc-500">Tidak ada data arsip surat keluar ditemukan.</TableCell></TableRow>
                  ) : (
                    currentOutgoing.map((mail) => (
                      <TableRow key={mail.id} className="border-b">
                        <TableCell className="pl-6 py-3.5"><div className="flex flex-col"><span className="text-xs font-bold font-mono">{mail.nomor}</span><span className="text-[9.5px] text-zinc-400 mt-1 flex items-center gap-1 font-semibold"><Calendar className="w-3 h-3" /> {mail.dateIndo}</span></div></TableCell>
                        <TableCell className="py-3.5 text-xs font-semibold">{mail.senderOrRecipient}</TableCell>
                        <TableCell className="py-3.5 text-xs font-bold max-w-xs truncate">{mail.subject}</TableCell>
                        <TableCell className="py-3.5">{getClassificationBadge(mail.classification)}</TableCell>
                        <TableCell className="py-3.5">{getStatusBadge(mail.status)}</TableCell>
                        <TableCell className="text-center pr-6 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button variant="ghost" size="icon-sm" onClick={() => setSelectedMail(mail)} className="rounded-lg hover:bg-pmii-blue/5 text-zinc-600"><Eye className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon-sm" onClick={async () => { if(confirm("Hapus surat?")) { const res = outgoing.filter(i => i.id !== mail.id); setOutgoing(res); await db.saveSurat([...incoming, ...res]); } }} className="rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}