// components/DriveSidebar.tsx
"use client";

import React, { useState, useRef } from "react";
import { Plus, Folder, FilePlus, Globe, Star, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DriveTab, DocumentItem, FolderItem } from "@/types/drive";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { generateUUID } from "@/lib/utils";
import { toast } from "sonner";

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

export default function DriveSidebar({
  activeTab,
  setActiveTab,
  selectedFolder,
  documents,
  setDocuments,
  folders,
  setFolders,
  setSelectedDoc
}: Props) {
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    if (folders.some(f => f.name.toLowerCase() === newFolderName.trim().toLowerCase())) {
      toast.error("Nama folder sudah digunakan!");
      return;
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
      } catch {}
    }
    
    setFolders([...folders, { 
      name: newFolderName.trim(), 
      color: "bg-zinc-500/[0.02]", 
      borderColor: "border-zinc-500/20", 
      iconColor: "text-zinc-500",
      parent: selectedFolder,
      uploader: uploaderName,
      uploaderAvatar: uploaderAvatar,
      access: activeTab === "PUBLIC" ? "Public" : "Internal"
    }]);
    toast.success(`Folder "${newFolderName.trim()}" berhasil dibuat.`);
    setNewFolderName("");
    setIsFolderDialogOpen(false);
  };

  // Langsung unggah berkas layaknya Google Drive saat file dipilih dari file picker sistem
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const targetFolderDesc = selectedFolder ? `folder "${selectedFolder}"` : "Arsip Utama";
    const toastId = toast.loading(
      fileList.length === 1 ? "Mengunggah 1 berkas..." : `Mengunggah ${fileList.length} berkas...`,
      {
        description: fileList.length === 1 ? fileList[0].name : `Lokasi: ${targetFolderDesc}`
      }
    );

    try {
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
        } catch {}
      }

      const newDocs: DocumentItem[] = [];

      for (const file of fileList) {
        let fileUrl = "";
        if (isSupabaseConfigured && supabase) {
          const fileExt = file.name.split(".").pop();
          const filePath = `drive/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("materials")
            .upload(filePath, file, { cacheControl: "3600", upsert: true });

          if (!uploadError) {
            const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
            fileUrl = data.publicUrl;
          } else {
            console.error("Supabase storage upload error:", uploadError.message);
          }
        }

        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

        const docDescObj = {
          fileUrl: fileUrl,
          text: `Dokumen ${file.name} yang diarsip secara digital.`,
          uploaderAvatar: uploaderAvatar,
          uploaderName: uploaderName
        };

        const newDoc: DocumentItem = {
          id: generateUUID(),
          code: `DOC-${Math.floor(Math.random() * 1000)}`,
          title: nameWithoutExt,
          category: selectedFolder || "",
          year: new Date().getFullYear().toString(),
          size: `${sizeInMB} MB`,
          access: activeTab === "PUBLIC" ? "Public" : "Internal",
          uploadedDate: new Date().toLocaleDateString('id-ID'),
          uploader: uploaderName,
          uploaderAvatar: uploaderAvatar,
          downloads: 0,
          description: JSON.stringify(docDescObj),
          isStarred: false,
          created_at: new Date().toISOString()
        };

        newDocs.push(newDoc);
      }

      const updated = [...newDocs, ...documents];
      await setDocuments(updated);
      if (newDocs.length > 0) {
        setSelectedDoc(newDocs[0]);
      }

      toast.success(
        fileList.length === 1 ? "1 berkas berhasil diunggah" : `${fileList.length} berkas berhasil diunggah`,
        {
          id: toastId,
          description: fileList.length === 1 ? newDocs[0].title : `Tersimpan di ${targetFolderDesc}`
        }
      );
    } catch (err) {
      console.error("Gagal mengunggah berkas:", err);
      toast.error("Gagal mengunggah berkas", {
        id: toastId,
        description: "Terjadi kesalahan saat mengunggah ke penyimpanan cloud."
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
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
      {/* Hidden native file input like Google Drive */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      <DropdownMenu>
        <DropdownMenuTrigger className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-10 rounded-xl shadow-xs flex items-center justify-center gap-2 outline-none transition-all cursor-pointer">
          <Plus className="w-4 h-4" /> Tambah Baru
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg">
          <DropdownMenuItem
            onClick={() => setIsFolderDialogOpen(true)}
            className="cursor-pointer font-semibold text-xs p-2.5 text-zinc-800 dark:text-zinc-200 focus:bg-zinc-100 dark:focus:bg-zinc-800"
          >
            <Folder className="w-4 h-4 text-amber-500 mr-2" /> Folder Baru
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
          <DropdownMenuItem
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer font-semibold text-xs p-2.5 text-zinc-800 dark:text-zinc-200 focus:bg-zinc-100 dark:focus:bg-zinc-800"
          >
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
