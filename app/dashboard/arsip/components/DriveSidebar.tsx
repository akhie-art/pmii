// components/DriveSidebar.tsx
import React, { useState, useEffect, useRef } from "react";
import { Plus, Folder, FilePlus, Globe, Star, Clock, Lock, UploadCloud, X, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DriveTab, DocumentItem, FolderItem } from "@/types/drive";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { generateUUID } from "@/lib/utils";

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
  const [newAccess, setNewAccess] = useState<"Public" | "Internal">("Internal");
  
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
      setNewAccess("Internal");
    }
  }, [isUploadOpen, selectedFolder]);



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

      let uploaderName = "Admin PK PMII";
      let uploaderAvatar = "";
      if (typeof window !== "undefined") {
        try {
          const storedUser = localStorage.getItem("PMII_LOGGED_IN_USER");
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed?.name) uploaderName = parsed.name;
            if (parsed?.avatar) uploaderAvatar = parsed.avatar;
          }
        } catch (e) {}
      }

      const docDescObj = {
        fileUrl: fileUrl,
        text: `Dokumen ${selectedFile.name} yang diarsip secara digital.`,
        uploaderAvatar: uploaderAvatar,
        uploaderName: uploaderName
      };

      const newDoc: DocumentItem = {
        id: generateUUID(),
        code: `DOC-${Math.floor(Math.random() * 1000)}`,
        title: newTitle, // Menggunakan judul yang sudah disesuaikan pengguna atau otomatis
        category: finalCategory,
        year: new Date().getFullYear().toString(),
        size: fileSizeStr, // Menyimpan ukuran asli file yang dipilih pengguna
        access: newAccess,
        uploadedDate: new Date().toLocaleDateString('id-ID'),
        uploader: uploaderName,
        uploaderAvatar: uploaderAvatar,
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
        <DropdownMenuTrigger className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-10 rounded-xl shadow-xs flex items-center justify-center gap-2 outline-none transition-all cursor-pointer">
          <Plus className="w-4 h-4" /> Tambah Baru
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg">
          <DropdownMenuItem onClick={() => setIsFolderDialogOpen(true)} className="cursor-pointer font-semibold text-xs p-2.5 text-zinc-800 dark:text-zinc-200 focus:bg-zinc-100 dark:focus:bg-zinc-800">
            <Folder className="w-4 h-4 text-amber-500 mr-2" /> Folder Baru
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
          <DropdownMenuItem onClick={() => setIsUploadOpen(true)} className="cursor-pointer font-semibold text-xs p-2.5 text-zinc-800 dark:text-zinc-200 focus:bg-zinc-100 dark:focus:bg-zinc-800">
            <FilePlus className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" /> Unggah Berkas
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-1.5 shadow-none">
        <div className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full justify-start text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  isActive 
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60" 
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className={`w-4 h-4 mr-2.5 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-400"}`} /> {tab.label}
              </Button>
            );
          })}
        </div>
      </Card>




      {/* MODAL UPLOAD DIALOG */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl">
            <DialogHeader>
                <DialogTitle className="text-zinc-900 dark:text-white font-bold flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Unggah Berkas Baru
                </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUploadDocument} className="space-y-4 pt-2">
                
                {/* Area Drag & Drop / Pilih File */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pilih Berkas</label>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                  />

                  {selectedFile ? (
                    <div className="flex items-center justify-between p-3 border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                          <FileIcon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{selectedFile.name}</span>
                          <span className="text-[10px] font-mono text-zinc-500">{fileSizeStr}</span>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 shrink-0 cursor-pointer" onClick={() => setSelectedFile(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()} 
                      className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                        <UploadCloud className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">Klik untuk memilih file</span>
                        <span className="text-[10px] text-zinc-400">PDF, DOCX, XLSX, atau Gambar (Maks 20MB)</span>
                      </div>
                    </div>
                  )}
                </div>

                {selectedFolder ? (
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Lokasi Unggah: <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedFolder}</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pilih Folder Tujuan</label>
                    <Select value={newCategory} onValueChange={(val) => setNewCategory(val || "")}>
                        <SelectTrigger className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl">
                          <SelectValue placeholder="Pilih Folder Tujuan" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
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
                    className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl"
                  />
                  <p className="text-[9px] text-zinc-400">Anda dapat mengubah nama dokumen sebelum disimpan.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Hak Akses</label>
                  <Select value={newAccess} onValueChange={(val) => setNewAccess(val as "Public" | "Internal")}>
                    <SelectTrigger className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                      <SelectItem value="Public">🌐 Publik — Siapa saja dapat membuka berkas</SelectItem>
                      <SelectItem value="Internal">🔒 Internal — Harus meminta izin pemilik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={!selectedFile || isUploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl h-10 mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-xs">
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    "Unggah Berkas"
                  )}
                </Button>
            </form>
        </DialogContent>
      </Dialog>

      {/* Folder Dialog */}
      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent className="max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-white font-bold flex items-center gap-2">
                <Folder className="w-5 h-5 text-amber-500" /> Buat Folder Baru
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
                    className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl"
                  />
                </div>
                {selectedFolder && (
                  <p className="text-[10px] text-zinc-400 -mt-2">
                    Akan dibuat sebagai sub-folder di dalam <span className="font-semibold text-zinc-700 dark:text-zinc-300">{selectedFolder}</span>
                  </p>
                )}
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl h-10 mt-2 cursor-pointer shadow-xs">
                  Buat Folder
                </Button>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}