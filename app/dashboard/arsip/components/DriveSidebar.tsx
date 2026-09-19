// components/DriveSidebar.tsx
import React, { useState, useEffect, useRef } from "react";
import { Plus, Folder, FilePlus, Globe, Star, Clock, Lock, HardDrive, UploadCloud, X, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DriveTab, DocumentItem, FolderItem } from "@/types/drive";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface Props {
  activeTab: DriveTab;
  setActiveTab: (tab: DriveTab) => void;
  selectedFolder: string | null;
  documents: DocumentItem[];
  setDocuments: (docs: DocumentItem[]) => void;
  folders: FolderItem[];
  setFolders: (folders: FolderItem[]) => void;
  setSelectedDoc: (doc: DocumentItem | null) => void;
}

export default function DriveSidebar({ activeTab, setActiveTab, selectedFolder, documents, setDocuments, folders, setFolders, setSelectedDoc }: Props) {
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  // UX State untuk File Input Sungguhan
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState("0 MB");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isUploadOpen) {
      setNewCategory(selectedFolder || "");
      // Reset form saat modal dibuka
      setSelectedFile(null);
      setNewTitle("");
      setFileSizeStr("0 MB");
    }
  }, [isUploadOpen, selectedFolder]);

  const calculateTotalMB = () => {
    let total = 0;
    documents.forEach(doc => {
      const match = doc.size.match(/([\d.]+)/);
      if (match) total += parseFloat(match[1]);
    });
    return total;
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    if (folders.some(f => f.name.toLowerCase() === newFolderName.trim().toLowerCase())) {
      alert("Nama folder sudah digunakan!");
      return;
    }
    
    setFolders([...folders, { 
      name: newFolderName.trim(), 
      color: "bg-zinc-500/[0.02]", 
      borderColor: "border-zinc-500/20", 
      iconColor: "text-zinc-500",
      parent: selectedFolder 
    }]);
    setNewFolderName("");
    setIsFolderDialogOpen(false);
  };

  // Fungsi untuk menangani saat pengguna memilih file di komputernya
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Otomatis mengisi judul dengan nama file asli (tanpa ekstensi .pdf, .docx, dll)
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setNewTitle(nameWithoutExt);

      // Hitung ukuran file sungguhan dan ubah menjadi format MB
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setFileSizeStr(`${sizeInMB} MB`);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = selectedFolder || (newCategory === "ROOT" ? "" : newCategory);

    if (!selectedFile) {
      alert("Silakan pilih file terlebih dahulu!");
      return;
    }

    if (!newTitle.trim()) return;

    setIsUploading(true);

    try {
      let fileUrl = "";
      if (isSupabaseConfigured && supabase) {
        const fileExt = selectedFile.name.split(".").pop();
        const filePath = `drive/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(filePath, selectedFile, { cacheControl: "3600", upsert: true });

        if (uploadError) {
          console.error("Supabase storage upload error:", uploadError.message);
        } else {
          const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
          fileUrl = data.publicUrl;
        }
      }

      const docDescObj = {
        fileUrl: fileUrl,
        text: `Dokumen ${selectedFile.name} yang diarsip secara digital.`
      };

      const newDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        code: `DOC-${Math.floor(Math.random() * 1000)}`,
        title: newTitle, // Menggunakan judul yang sudah disesuaikan pengguna atau otomatis
        category: finalCategory,
        year: new Date().getFullYear().toString(),
        size: fileSizeStr, // Menyimpan ukuran asli file yang dipilih pengguna
        access: "Internal",
        uploadedDate: new Date().toLocaleDateString('id-ID'),
        uploader: "Admin",
        downloads: 0,
        description: JSON.stringify(docDescObj),
        isStarred: false,
        created_at: new Date().toISOString()
      };

      const updated = [newDoc, ...documents];
      await setDocuments(updated);
      setSelectedDoc(newDoc);
      setIsUploadOpen(false);
    } catch (err) {
      console.error("Failed to upload document:", err);
      alert("Gagal mengunggah dokumen.");
    } finally {
      setIsUploading(false);
    }
  };

  const tabs = [
    { id: "MY_DRIVE", label: "Arsip Utama", icon: Folder },
    { id: "PUBLIC", label: "Dokumen Publik", icon: Globe },
    { id: "STARRED", label: "Berbintang", icon: Star },
    { id: "RECENT", label: "Baru Diunggah", icon: Clock },
    { id: "INTERNAL", label: "Dokumen Internal", icon: Lock }
  ] as const;

  return (
    <div className="lg:col-span-2 space-y-4">
      <DropdownMenu>
        <DropdownMenuTrigger className="w-full bg-white dark:bg-[#090d16] hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-800 dark:text-white font-extrabold text-xs py-5 rounded-2xl shadow-md border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-center gap-2 outline-none transition-all hover:scale-[1.01] cursor-pointer">
          <Plus className="w-4.5 h-4.5 text-pmii-gold mr-2" /> Baru
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 bg-white dark:bg-[#090d16] border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg">
          <DropdownMenuItem onClick={() => setIsFolderDialogOpen(true)} className="cursor-pointer font-bold text-xs p-3 text-zinc-800 dark:text-zinc-200 focus:bg-zinc-50 dark:focus:bg-zinc-900">
            <Folder className="w-4 h-4 text-pmii-gold mr-2" /> Folder Baru
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800/60" />
          <DropdownMenuItem onClick={() => setIsUploadOpen(true)} className="cursor-pointer font-bold text-xs p-3 text-zinc-800 dark:text-zinc-200 focus:bg-zinc-50 dark:focus:bg-zinc-900">
            <FilePlus className="w-4 h-4 text-pmii-blue dark:text-sky-400 mr-2" /> Unggah File
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg p-1.5 shadow-none">
        <div className="space-y-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full justify-start text-xs font-semibold px-3 py-2 rounded-md transition-colors ${
                  isActive 
                    ? "bg-blue-600 text-white dark:bg-blue-600 dark:text-white" 
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                <Icon className="w-4 h-4 mr-2.5" /> {tab.label}
              </Button>
            );
          })}
        </div>
      </Card>

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg p-3.5 shadow-none space-y-2">
        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold text-[10px] uppercase tracking-wider">
          <HardDrive className="w-3.5 h-3.5 text-blue-600" /> Penyimpanan
        </div>
        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min((calculateTotalMB() / 1024) * 100, 100)}%` }} />
        </div>
        <div className="text-[10px] text-zinc-400 font-medium">
          <span className="text-zinc-700 dark:text-zinc-200 font-bold">{calculateTotalMB().toFixed(2)} MB</span> dari 1 GB terpakai
        </div>
      </Card>

      {/* MODAL UPLOAD DIALOG - DIPERBARUI DENGAN FILE INPUT UI */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl">
            <DialogHeader>
                <DialogTitle className="text-zinc-900 dark:text-white font-extrabold flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-pmii-gold" /> Unggah File Baru
                </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUploadDocument} className="space-y-5 pt-2">
                
                {/* Area Drag & Drop / Pilih File */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pilih Berkas</label>
                  
                  {/* Input file disembunyikan secara visual, tapi diaktifkan lewat klik area div */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                  />

                  {selectedFile ? (
                    <div className="flex items-center justify-between p-3 border border-pmii-blue/30 dark:border-pmii-gold/30 bg-pmii-blue/5 dark:bg-pmii-gold/5 rounded-xl">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-pmii-blue/10 dark:bg-pmii-gold/10 rounded-lg text-pmii-blue dark:text-pmii-gold shrink-0">
                          <FileIcon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{selectedFile.name}</span>
                          <span className="text-[10px] font-mono text-zinc-500">{fileSizeStr}</span>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:bg-rose-50 shrink-0 cursor-pointer" onClick={() => setSelectedFile(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()} 
                      className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-pmii-blue dark:hover:border-pmii-gold hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                        <UploadCloud className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Klik untuk memilih file</span>
                        <span className="text-[10px] text-zinc-400">PDF, DOCX, XLSX, atau Gambar (Maks 20MB)</span>
                      </div>
                    </div>
                  )}
                </div>

                {selectedFolder ? (
                  <div className="bg-zinc-50 dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    Lokasi Upload: <span className="text-pmii-blue dark:text-pmii-gold">{selectedFolder}</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pilih Folder Tujuan</label>
                    <Select value={newCategory} onValueChange={(val) => setNewCategory(val || "")}>
                        <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl">
                          <SelectValue placeholder="Pilih Folder Tujuan" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                            <SelectItem value="ROOT">Tanpa Folder (Root Arsip)</SelectItem>
                            {folders.map(f => <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Nama Dokumen</label>
                  <Input 
                    required 
                    placeholder="Nama file akan otomatis terisi..." 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl"
                  />
                  <p className="text-[9px] text-zinc-400">Anda dapat mengubah nama dokumen sebelum disimpan.</p>
                </div>

                <Button type="submit" disabled={!selectedFile || isUploading} className="w-full bg-pmii-blue text-white dark:bg-pmii-gold dark:text-[#090d16] font-bold rounded-xl h-10 mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    "Unggah Berkas"
                  )}
                </Button>
            </form>
        </DialogContent>
      </Dialog>

      {/* Folder Dialog (Tidak ada perubahan) */}
      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        {/* ... Kode dialog folder baru ... */}
        <DialogContent className="max-w-sm bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-white font-extrabold flex items-center gap-2">
                <Folder className="w-5 h-5 text-pmii-gold" /> Buat Folder Baru
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateFolder} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Nama Folder</label>
                  <Input 
                    required 
                    placeholder="Masukkan nama folder..." 
                    value={newFolderName} 
                    onChange={e => setNewFolderName(e.target.value)} 
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl"
                  />
                </div>
                {selectedFolder && (
                  <p className="text-[10px] text-zinc-400 -mt-2">
                    Akan dibuat sebagai sub-folder di dalam <span className="font-bold text-zinc-600 dark:text-zinc-300">{selectedFolder}</span>
                  </p>
                )}
                <Button type="submit" className="w-full bg-pmii-blue text-white dark:bg-pmii-gold dark:text-[#090d16] font-bold rounded-xl h-10 mt-2">
                  Buat Folder
                </Button>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}