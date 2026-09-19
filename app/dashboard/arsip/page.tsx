// app/drive/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FolderOpen, Search, Grid, List, Info, Star, ChevronLeft, MoreVertical, Share2, Trash2, FileText, FileSpreadsheet, FileImage, File, ShieldCheck, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DocumentItem, FolderItem, DriveTab } from "@/types/drive";
import { db } from "@/lib/db";

// Import komponen hasil pecahan
import DriveSidebar from "./components/DriveSidebar";
import FileDetailPanel, { ExcelCsvPreview } from "./components/FileDetailPanel";
import { CategoryIcon, CategoryBadge, AccessBadge } from "./components/DriveBadges";

// Circular Avatar with PMII official color scheme & layout
const PmiiAvatar = () => (
  <div className="w-5 h-5 rounded-full bg-white border border-zinc-200/80 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
    <svg viewBox="0 0 60 60" className="w-full h-full">
      {/* Yellow top */}
      <rect x="0" y="0" width="60" height="25" fill="#FBBF24" />
      {/* Blue bottom */}
      <rect x="0" y="25" width="60" height="35" fill="#1E3A8A" />
      {/* Stars */}
      <circle cx="30" cy="12" r="3" fill="white" />
      <circle cx="18" cy="15" r="2.5" fill="white" />
      <circle cx="42" cy="15" r="2.5" fill="white" />
      {/* PMII Text */}
      <text x="30" y="44" fill="#FBBF24" fontSize="12" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">PMII</text>
    </svg>
  </div>
);

// Helper to render color-coded rectangular Google Drive header icons
const renderFileHeaderIcon = (type: string) => {
  switch (type) {
    case "PDF":
      return (
        <div className="w-6 h-6 rounded-md bg-[#ea4335] flex items-center justify-center text-white shrink-0 shadow-xs">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 6c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v1h-4V9zm0 3.5h3c.55 0 1 .45 1 1v1c0 .55-.45 1-1 1h-3v-3zm0 5h1.5v-1.5H11v1.5zm6-5c0-.55-.45-1-1-1h-2v4h2c.55 0 1-.45 1-1v-2zm-6-3.5H9.5V11H11v-1.5z" />
          </svg>
        </div>
      );
    case "EXCEL":
      return (
        <div className="w-6 h-6 rounded-md bg-[#0f9d58] flex items-center justify-center text-white shrink-0 shadow-xs">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-2h2v2zm0-4H7v-2h2v2zm0-4H7V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z" />
          </svg>
        </div>
      );
    case "WORD":
      return (
        <div className="w-6 h-6 rounded-md bg-[#4285f4] flex items-center justify-center text-white shrink-0 shadow-xs">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
          </svg>
        </div>
      );
    case "FORM":
      return (
        <div className="w-6 h-6 rounded-md bg-[#7248b9] flex items-center justify-center text-white shrink-0 shadow-xs">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2zm0 8H7v-2h10v2z" />
          </svg>
        </div>
      );
    case "IMAGE":
      return (
        <div className="w-6 h-6 rounded-md bg-[#ff7d27] flex items-center justify-center text-white shrink-0 shadow-xs">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1zm-4.5-6.5l-2.75 3.54-1.96-2.36L6.5 17h11l-3.5-4.5z" />
          </svg>
        </div>
      );
    case "JSON":
      return (
        <div className="w-6 h-6 rounded-md bg-[#607d8b] flex items-center justify-center text-white shrink-0 shadow-xs">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-6 h-6 rounded-md bg-zinc-500 flex items-center justify-center text-white shrink-0 shadow-xs">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z" />
          </svg>
        </div>
      );
  }
};

// Highly-fidelity realistic file preview blocks (custom simulated layouts based on Google Drive visual designs)
const renderFilePreview = (fileMeta: { type: string; url: string }, doc: DocumentItem) => {
  const titleLower = doc.title.toLowerCase();

  // If a real public file URL is present, ALWAYS render the actual file content inside the card thumbnail
  if (fileMeta.url && (fileMeta.url.startsWith("http://") || fileMeta.url.startsWith("https://"))) {
    const getCleanExtension = (url: string) => {
      try {
        const cleanUrl = url.split(/[?#]/)[0].toLowerCase();
        return cleanUrl.substring(cleanUrl.lastIndexOf('.')) || "";
      } catch (e) {
        return "";
      }
    };
    const ext = getCleanExtension(fileMeta.url);
    const isImage = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ext);
    const isPdf = ext === ".pdf";
    const isExcel = ext === ".xlsx" || ext === ".xls" || ext === ".csv";
    const isWord = ext === ".docx" || ext === ".doc";

    if (isImage) {
      return (
        <div 
          className="w-full h-full flex items-center justify-center relative overflow-hidden bg-white dark:bg-[#0c1222]"
          style={{
            backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 12 12\"><rect width=\"6\" height=\"6\" fill=\"%23f4f4f5\"/><rect x=\"6\" y=\"6\" width=\"6\" height=\"6\" fill=\"%23f4f4f5\"/><rect x=\"6\" width=\"6\" height=\"6\" fill=\"%23ffffff\"/><rect y=\"6\" width=\"6\" height=\"6\" fill=\"%23ffffff\"/></svg>')",
            backgroundSize: "12px 12px"
          }}
        >
          <img 
            src={fileMeta.url} 
            alt={doc.title} 
            className="max-w-full max-h-full object-contain p-2" 
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <iframe 
          src={`${fileMeta.url}#toolbar=0&navpanes=0&scrollbar=0`}
          className="w-full h-full border-none pointer-events-none scale-90 origin-top bg-white select-none"
          title={doc.title}
          scrolling="no"
        />
      );
    }

    if (isExcel || isWord) {
      return (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileMeta.url)}`}
          className="w-full h-full border-none pointer-events-none scale-75 origin-top bg-white select-none"
          title={doc.title}
          scrolling="no"
        />
      );
    }
  }

  // Fallback to gorgeous high-fidelity PMII mockups if fileMeta.url is not present (e.g. sample local files)
  // 1. IMAGE TYPE
  if (fileMeta.type === "IMAGE") {
    const isPmiiLogo = titleLower.includes("logopmii") || titleLower.includes("logo");
    return (
      <div 
        className="w-full h-full flex items-center justify-center relative overflow-hidden bg-white dark:bg-[#0c1222]"
        style={{
          backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 12 12\"><rect width=\"6\" height=\"6\" fill=\"%23f4f4f5\"/><rect x=\"6\" y=\"6\" width=\"6\" height=\"6\" fill=\"%23f4f4f5\"/><rect x=\"6\" width=\"6\" height=\"6\" fill=\"%23ffffff\"/><rect y=\"6\" width=\"6\" height=\"6\" fill=\"%23ffffff\"/></svg>')",
          backgroundSize: "12px 12px"
        }}
      >
        {fileMeta.url ? (
          <img 
            src={fileMeta.url} 
            alt={doc.title} 
            className="max-w-full max-h-full object-contain p-2" 
          />
        ) : isPmiiLogo ? (
          <svg width="60" height="70" viewBox="0 0 60 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md select-none">
            <path d="M5 20C15 20 20 5 30 5C40 5 45 20 55 20C55 20 55 28 50 32C45 36 30 38 30 38C30 38 15 36 10 32C5 28 5 20 5 20Z" fill="#FBBF24" />
            <circle cx="15" cy="18" r="1.5" fill="white" />
            <circle cx="22.5" cy="15" r="1.5" fill="white" />
            <circle cx="30" cy="13" r="1.8" fill="white" />
            <circle cx="37.5" cy="15" r="1.5" fill="white" />
            <circle cx="45" cy="18" r="1.5" fill="white" />
            <path d="M10 32C30 32 30 38 30 38C30 38 30 32 50 32C50 32 52 50 30 65C8 50 10 32 10 32Z" fill="#1E3A8A" />
            <text x="30" y="50" fill="#FBBF24" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.5">PMII</text>
          </svg>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-1 text-amber-500">
            <svg className="w-8 h-8 opacity-80" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1zm-4.5-6.5l-2.75 3.54-1.96-2.36L6.5 17h11l-3.5-4.5z" />
            </svg>
          </div>
        )}
      </div>
    );
  }

  // 2. FORM TYPE (Analisis Preferensi Kogniti... / Google Forms mockup)
  if (fileMeta.type === "FORM" || titleLower.includes("kogniti") || titleLower.includes("kuesioner")) {
    return (
      <div className="w-full h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 p-2 select-none text-left relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#7248b9]" />
        
        <div className="w-full h-full bg-white dark:bg-[#0c1222] border border-zinc-200 dark:border-zinc-800 rounded-md p-2 mt-1 shadow-2xs flex flex-col space-y-2.5 overflow-hidden">
          <div className="border-b border-purple-100 dark:border-purple-950 pb-1.5 space-y-0.5">
            <div className="text-[6.5px] font-black text-zinc-800 dark:text-zinc-200 truncate leading-tight">
              Analisis Preferensi Kognitif & Arah Karier Mahasiswa
            </div>
            <div className="text-[4px] text-red-500 font-bold">* Menunjukkan pertanyaan wajib</div>
          </div>
          
          <div className="space-y-2 flex-1">
            <div className="space-y-1">
              <div className="text-[5px] font-bold text-zinc-700 dark:text-zinc-300">Nama Lengkap *</div>
              <div className="h-0.5 border-b border-dotted border-zinc-300 dark:border-zinc-700 w-11/12" />
            </div>
            
            <div className="space-y-1">
              <div className="text-[5px] font-bold text-zinc-700 dark:text-zinc-300">Kampus *</div>
              <div className="h-0.5 border-b border-dotted border-zinc-300 dark:border-zinc-700 w-11/12" />
            </div>

            <div className="space-y-1">
              <div className="text-[5px] font-bold text-zinc-700 dark:text-zinc-300">Program Studi *</div>
              <div className="h-0.5 border-b border-dotted border-zinc-300 dark:border-zinc-700 w-11/12" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. EXCEL TYPE
  if (fileMeta.type === "EXCEL") {
    const isSiakad = titleLower.includes("siakad") || titleLower.includes("kaderisasi") || titleLower.includes("anggota");
    
    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-[#0c1222] select-none border-b border-zinc-100 dark:border-zinc-900 rounded-md p-1.5 overflow-hidden">
        {isSiakad ? (
          <div className="flex-1 flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-sm overflow-hidden bg-white dark:bg-[#0b1329]">
            <div className="bg-[#0a2a5c] h-3 px-1 text-[4px] font-bold text-white flex items-center justify-between border-b border-zinc-300 dark:border-zinc-800 select-none">
              <div className="w-[12%] text-center border-r border-white/20">No</div>
              <div className="w-[28%] pl-0.5 border-r border-white/20 truncate">Nama Lengkap</div>
              <div className="w-[20%] text-center border-r border-white/20 truncate">PKD/PKL</div>
              <div className="w-[20%] text-center border-r border-white/20 truncate">Cabang</div>
              <div className="w-[20%] text-center truncate">Status</div>
            </div>
            
            <div className="flex-1 flex flex-col justify-between py-0.5">
              {[
                { no: "1", nama: "Achmad Shodiq", level: "PKD", cabang: "Ciputat", status: "Kader" },
                { no: "2", nama: "Farida Hanim", level: "PKL", cabang: "Malang", status: "Pengurus" },
                { no: "3", nama: "Zainal Abidin", level: "PKD", cabang: "Surabaya", status: "Kader" },
                { no: "4", nama: "Ririn Astuti", level: "MAPABA", cabang: "Semarang", status: "Anggota" },
                { no: "5", nama: "Luqman Hakim", level: "PKL", cabang: "Yogyakarta", status: "Kader" }
              ].map((row, idx) => (
                <div 
                  key={idx} 
                  className={`h-2.5 px-1 text-[3.8px] font-medium flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900/60 ${
                    idx % 2 === 0 ? "bg-[#e8f0fe]/40 dark:bg-blue-950/20" : "bg-white dark:bg-zinc-950"
                  }`}
                >
                  <div className="w-[12%] text-center text-zinc-500 font-mono border-r border-zinc-100 dark:border-zinc-900">{row.no}</div>
                  <div className="w-[28%] pl-0.5 font-bold text-zinc-800 dark:text-zinc-200 border-r border-zinc-100 dark:border-zinc-900 truncate">{row.nama}</div>
                  <div className="w-[20%] text-center text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-900">{row.level}</div>
                  <div className="w-[20%] text-center text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-900 truncate">{row.cabang}</div>
                  <div className="w-[20%] text-center text-emerald-600 font-bold">{row.status}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-sm overflow-hidden bg-white dark:bg-[#0b1329]">
            <div className="grid grid-cols-5 gap-0.5 border-b border-zinc-200 dark:border-zinc-800 text-[4px] font-bold text-zinc-400 dark:text-zinc-500 text-center pb-0.5 bg-zinc-50 dark:bg-zinc-900">
              <div className="py-0.5 border-r border-zinc-200 dark:border-zinc-800">A</div>
              <div className="py-0.5 border-r border-zinc-200 dark:border-zinc-800">B</div>
              <div className="py-0.5 border-r border-zinc-200 dark:border-zinc-800">C</div>
              <div className="py-0.5 border-r border-zinc-200 dark:border-zinc-800">D</div>
              <div className="py-0.5">E</div>
            </div>
            
            <div className="flex-1 grid grid-cols-5 gap-px bg-zinc-100 dark:bg-zinc-800/80 p-0.5">
              {Array.from({ length: 15 }).map((_, idx) => (
                <div 
                  key={idx} 
                  className={`bg-white dark:bg-zinc-950 flex items-center justify-center text-[4px] font-semibold text-zinc-700 dark:text-zinc-300 truncate px-0.5 h-2.5 border border-zinc-50 dark:border-zinc-900/40 ${
                    idx < 5 ? "bg-zinc-50 dark:bg-zinc-900 font-black text-zinc-500 text-[3.8px]" : ""
                  }`}
                >
                  {idx === 0 ? "id" : idx === 1 ? "username" : idx === 2 ? "amount" : idx === 3 ? "date" : idx === 4 ? "status" :
                   idx === 5 ? "101" : idx === 6 ? "najhan" : idx === 7 ? "450K" : idx === 8 ? "25/05" : idx === 9 ? "PAID" :
                   idx === 10 ? "102" : idx === 11 ? "atifa" : idx === 12 ? "300K" : idx === 13 ? "24/05" : idx === 14 ? "PAID" : ""}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. PDF TYPE (CV Akhie Najhan Atifa.pdf or high fidelity mock CV)
  if (fileMeta.type === "PDF") {
    const isCv = titleLower.includes("cv") || titleLower.includes("akhir") || titleLower.includes("najhan") || titleLower.includes("atifa");
    
    if (fileMeta.url) {
      return (
        <iframe 
          src={`${fileMeta.url}#toolbar=0&navpanes=0&scrollbar=0`}
          className="w-full h-full border-none pointer-events-none scale-90 origin-top bg-white"
          title={doc.title}
          scrolling="no"
        />
      );
    }

    return (
      <div className="w-full h-full flex bg-zinc-50 dark:bg-zinc-950 p-1.5 select-none overflow-hidden">
        {isCv ? (
          <div className="flex-1 bg-white dark:bg-[#0b1329] border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-2xs p-2 flex flex-col justify-between text-left overflow-hidden">
            <div className="border-b border-zinc-150 dark:border-zinc-800 pb-1 flex justify-between items-start">
              <div>
                <div className="text-[6.5px] font-black text-zinc-900 dark:text-white leading-tight">CV Akhie Najhan Atifa.pdf</div>
                <div className="text-[4px] text-zinc-400 font-semibold mt-0.5">S1 Ilmu Komputer | Universitas An Nuur</div>
              </div>
              <div className="text-[4.5px] bg-red-100 text-red-700 px-1 py-0.2 rounded-xs font-black">PDF</div>
            </div>

            <div className="space-y-0.5 mt-1 border-b border-zinc-100 dark:border-zinc-900 pb-1">
              <div className="text-[4px] font-black text-pmii-blue dark:text-pmii-gold">PROFIL</div>
              <p className="text-[3px] text-zinc-500 leading-normal line-clamp-2">
                Saya adalah seorang mahasiswa semester 7 Program Studi Ilmu Komputer di Universitas An Nuur. Memiliki ketertarikan dan pengalaman lebih dari 3 tahun sebagai Fullstack Developer...
              </p>
            </div>

            <div className="space-y-0.5 mt-1 border-b border-zinc-100 dark:border-zinc-900 pb-1">
              <div className="text-[4px] font-black text-pmii-blue dark:text-pmii-gold">PENDIDIKAN</div>
              <div className="flex justify-between items-center text-[3.2px]">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">• Universitas An Nuur Purwodadi</span>
                <span className="text-zinc-400 font-mono">2021 - Sekarang</span>
              </div>
              <p className="text-[2.8px] text-zinc-500 pl-1.5 leading-tight">
                D1 Ilmu Komputer • IPK 3.85 • Rekayasa Perangkat Lunak, Basis Data, Struktur Data, Pemrograman Berorientasi Objek.
              </p>
            </div>

            <div className="space-y-0.5 mt-1">
              <div className="text-[4px] font-black text-pmii-blue dark:text-pmii-gold">PENGALAMAN PROYEK DAN ORGANISASI</div>
              <div className="flex justify-between items-center text-[3.2px]">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">• Fullstack Developer - Website Manajemen Nasabah</span>
                <span className="text-zinc-400 font-mono">2024</span>
              </div>
              <p className="text-[2.8px] text-zinc-500 pl-1.5 leading-tight">
                Membangun sistem informasi menggunakan React, Next.js, and Supabase dengan otentikasi peran dan enkripsi data nasabah.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white dark:bg-[#0b1329] border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-2xs p-2 flex flex-col justify-between text-left overflow-hidden">
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-1 text-center font-bold text-[5px] text-rose-500 tracking-wider">
              SURAT RESMI CABANG PMII
            </div>
            <div className="space-y-1 pt-1.5 flex-1">
              <div className="h-0.5 bg-zinc-300 dark:bg-zinc-800 rounded-full w-2/3" />
              <div className="h-0.5 bg-zinc-200 dark:bg-zinc-900 rounded-full w-full" />
              <div className="h-0.5 bg-zinc-200 dark:bg-zinc-900 rounded-full w-11/12" />
              <div className="h-0.5 bg-zinc-200 dark:bg-zinc-900 rounded-full w-3/4" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // 5. WORD TYPE (Docs mock)
  if (fileMeta.type === "WORD") {
    return (
      <div className="w-full h-full flex bg-zinc-50 dark:bg-zinc-950 p-1.5 select-none overflow-hidden">
        <div className="flex-1 bg-white dark:bg-[#0b1329] border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-2xs p-2 flex flex-col justify-between text-left overflow-hidden">
          <div className="border-b border-zinc-150 dark:border-zinc-800 pb-1 text-left font-bold text-[6px] text-blue-500 tracking-wide truncate">
            {doc.title}
          </div>
          <div className="space-y-1.5 pt-1.5 flex-1">
            <div className="h-0.5 bg-zinc-300 dark:bg-zinc-800 rounded-full w-1/3" />
            <div className="h-0.5 bg-zinc-200 dark:bg-zinc-900 rounded-full w-full" />
            <div className="h-0.5 bg-zinc-200 dark:bg-zinc-900 rounded-full w-11/12" />
            <div className="h-0.5 bg-zinc-200 dark:bg-zinc-900 rounded-full w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  // 6. JSON TYPE (Code block view)
  if (fileMeta.type === "JSON") {
    return (
      <div className="w-full h-full flex bg-zinc-50 dark:bg-zinc-950 p-1.5 select-none overflow-hidden">
        <div className="flex-1 bg-white dark:bg-[#0b1329] border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-2xs p-1.5 flex flex-col justify-between text-left overflow-hidden">
          <div className="font-mono text-[3.8px] leading-normal text-zinc-500 flex-1 overflow-hidden space-y-0.5">
            <div><span className="text-purple-600 font-bold">{"{"}</span></div>
            <div className="pl-1.5"><span className="text-blue-600">"applet_id"</span>: <span className="text-green-600">"8cb113f"</span>,</div>
            <div className="pl-1.5"><span className="text-blue-600">"access"</span>: <span className="text-green-600">"granted"</span>,</div>
            <div className="pl-1.5"><span className="text-blue-600">"timestamp"</span>: <span className="text-amber-600">1779695</span>,</div>
            <div className="pl-1.5"><span className="text-blue-600">"target"</span>: <span className="text-green-600">"arsip_digital"</span>,</div>
            <div className="pl-1.5"><span className="text-blue-600">"status"</span>: <span className="text-green-600">"ok"</span></div>
            <div><span className="text-purple-600 font-bold">{"}"}</span></div>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT FALLBACK
  return (
    <div className="w-full h-full p-2.5 flex flex-col bg-white dark:bg-zinc-950 space-y-1 select-none text-left border border-zinc-200 dark:border-zinc-800 rounded-md scale-95 shadow-xs">
      <div className="space-y-1.5 pt-1.5 flex-1">
        <div className="h-0.5 bg-zinc-300 dark:bg-zinc-800 rounded-full w-1/3" />
        <div className="h-0.5 bg-zinc-200 dark:bg-zinc-900 rounded-full w-full" />
        <div className="h-0.5 bg-zinc-200 dark:bg-zinc-900 rounded-full w-11/12" />
      </div>
    </div>
  );
};

export default function DrivePage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<DriveTab>("MY_DRIVE");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("LIST");
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const getFileMeta = (doc: DocumentItem) => {
    let fileUrl = "";
    const description = doc.description || "";
    if (description.startsWith("{")) {
      try {
        const parsed = JSON.parse(description);
        fileUrl = parsed.fileUrl || "";
      } catch (e) {}
    } else if (description.startsWith("http://") || description.startsWith("https://")) {
      fileUrl = description;
    }
    
    const titleLower = doc.title.toLowerCase();
    const urlLower = fileUrl.toLowerCase();
    
    const isImage = urlLower.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || titleLower.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || titleLower.includes("logo") || titleLower.includes("gambar") || titleLower.includes("foto") || titleLower.includes("logopmii");
    const isPdf = urlLower.endsWith(".pdf") || urlLower.includes("materials") || titleLower.endsWith(".pdf") || titleLower.includes("kuesioner") || titleLower.includes("dokumen") || titleLower.includes("sdgs") || titleLower.includes("kaderisasi") || titleLower.includes("aktif") || titleLower.includes("cv");
    const isExcel = urlLower.endsWith(".xlsx") || urlLower.endsWith(".xls") || urlLower.endsWith(".csv") || titleLower.endsWith(".xlsx") || titleLower.endsWith(".xls") || titleLower.endsWith(".csv") || titleLower.includes("bayar") || titleLower.includes("data") || titleLower.includes("rekap") || titleLower.includes("nilai") || titleLower.includes("siakad") || titleLower.includes("database") || titleLower.includes("bquxjob") || titleLower.includes("looker");
    const isWord = urlLower.endsWith(".docx") || urlLower.endsWith(".doc") || titleLower.endsWith(".docx") || titleLower.endsWith(".doc") || titleLower.includes("surat") || titleLower.includes("project") || titleLower.includes("berjudul");
    const isJson = titleLower.endsWith(".json") || titleLower.includes("json") || titleLower.includes("history") || titleLower.includes("config");
    const isForm = titleLower.includes("kogniti") || titleLower.includes("kuesioner") || titleLower.includes("analisis") || titleLower.includes("form");
    
    if (isImage) return { type: "IMAGE", url: fileUrl || "" };
    if (isForm) return { type: "FORM", url: fileUrl };
    if (isPdf) return { type: "PDF", url: fileUrl };
    if (isExcel) return { type: "EXCEL", url: fileUrl };
    if (isWord) return { type: "WORD", url: fileUrl };
    if (isJson) return { type: "JSON", url: fileUrl };
    
    return { type: "OTHER", url: fileUrl };
  };

  const updateDocuments = async (newDocs: DocumentItem[]) => {
    setDocuments(newDocs);
    await db.saveArsip(newDocs);
  };

  const updateFolders = (newFolders: FolderItem[]) => {
    setFolders(newFolders);
    if (typeof window !== "undefined") {
      localStorage.setItem("pmii_drive_folders", JSON.stringify(newFolders));
    }
  };

  const handleDeleteDoc = (docId: string) => {
    if (confirm("Apakah Sahabat yakin ingin menghapus berkas ini dari arsip digital?")) {
      const updated = documents.filter(d => d.id !== docId);
      updateDocuments(updated);
      if (selectedDoc?.id === docId) {
        setSelectedDoc(updated[0] || null);
      }
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const loadData = async () => {
      try {
        const docs = await db.getArsip();
        setDocuments(docs);
        if (docs.length > 0) {
          setSelectedDoc(docs[0]);
        }
      } catch (err) {
        console.error("Failed to load documents from Supabase:", err);
      }

      const DUMMY_FOLDER_NAMES = [
        "SK Kepengurusan",
        "Modul Kaderisasi",
        "Ketetapan Rapat",
        "Sertifikat",
        "Publikasi"
      ];

      const storedFolders = localStorage.getItem("pmii_drive_folders");
      if (storedFolders) {
        try {
          const parsed: FolderItem[] = JSON.parse(storedFolders);
          const cleaned = parsed.filter((f) => !DUMMY_FOLDER_NAMES.includes(f.name));
          setFolders(cleaned);
          localStorage.setItem("pmii_drive_folders", JSON.stringify(cleaned));
        } catch (e) {
          setFolders([]);
          localStorage.setItem("pmii_drive_folders", JSON.stringify([]));
        }
      } else {
        setFolders([]);
        localStorage.setItem("pmii_drive_folders", JSON.stringify([]));
      }
    };
    loadData();
  }, []);

  const currentFolders = folders.filter((f) => f.parent === (selectedFolder || null));

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.code.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === "MY_DRIVE" && selectedFolder && doc.category !== selectedFolder) return false;
    if (activeTab !== "MY_DRIVE" && selectedFolder && doc.category !== selectedFolder) return false;

    switch (activeTab) {
      case "PUBLIC": return doc.access === "Public";
      case "STARRED": return doc.isStarred;
      case "RECENT": return doc.year === new Date().getFullYear().toString();
      case "INTERNAL": return doc.access === "Internal" || doc.access === "Confidential";
      default: return true;
    }
  });

  const handleToggleStar = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = documents.map(d => d.id === docId ? { ...d, isStarred: !d.isStarred } : d);
    updateDocuments(updated);
  };

  const handleDownload = (docId: string) => {
    const updated = documents.map(d => d.id === docId ? { ...d, downloads: d.downloads + 1 } : d);
    updateDocuments(updated);
    alert("Mengunduh berkas PDF resmi...");
  };

  const handleDeleteFolder = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Apakah Sahabat yakin ingin menghapus folder "${folderName}" beserta seluruh sub-folder di dalamnya? Berkas di dalamnya akan dikembalikan ke halaman luar.`)) {
      const folderNamesToDelete = [folderName, ...folders.filter(f => f.parent === folderName).map(f => f.name)];
      
      const updatedFolders = folders.filter(f => !folderNamesToDelete.includes(f.name));
      updateFolders(updatedFolders);
      
      const updatedDocs = documents.map(doc => folderNamesToDelete.includes(doc.category) ? { ...doc, category: "" } : doc);
      updateDocuments(updatedDocs);
      
      if (selectedFolder && folderNamesToDelete.includes(selectedFolder)) {
        setSelectedFolder(null);
      }
    }
  };

  const handleShareLink = (type: "folder" | "file", idOrName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/drive/${type}?id=${encodeURIComponent(idOrName)}`;
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert(`Link ${type === "folder" ? "Folder" : "Berkas"} berhasil disalin:\n${shareUrl}`))
        .catch(() => alert("Gagal menyalin link otomatis."));
    }
  };

  const handleGoBack = () => {
    if (!selectedFolder) return;
    const currentMob = folders.find(f => f.name === selectedFolder);
    setSelectedFolder(currentMob?.parent || null);
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6 pb-12 overflow-hidden h-full flex flex-col font-sans">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#080d16]/75 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pmii-blue to-blue-600 flex items-center justify-center text-white">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-zinc-800 dark:text-white">PMII Drive</h1>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Sistem manajemen digital arsip organisasi.</p>
          </div>
        </div>
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input placeholder="Cari file..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 text-xs bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        <DriveSidebar 
          activeTab={activeTab} setActiveTab={setActiveTab} 
          selectedFolder={selectedFolder} 
          documents={documents} setDocuments={updateDocuments} 
          folders={folders} setFolders={updateFolders} 
          setSelectedDoc={setSelectedDoc} 
        />

        <div className={showRightPanel ? "lg:col-span-7 space-y-6" : "lg:col-span-10 space-y-6"}>
          
          {/* FOLDERS GRID (Tetap menggunakan CategoryIcon agar wujudnya Folder) */}
          {currentFolders.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
               {currentFolders.map(folder => (
                  <div
                    key={folder.name}
                    onClick={() => setSelectedFolder(folder.name)}
                    className="group flex items-center justify-between p-3 rounded-xl border text-left bg-white dark:bg-[#080d16]/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer relative"
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      <CategoryIcon category={folder.name} />
                      <span className="text-[10.5px] font-bold truncate text-zinc-700 dark:text-zinc-200">{folder.name}</span>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger 
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 rounded-lg flex items-center justify-center outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-3.5 h-3.5 text-zinc-400" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-md">
                        <DropdownMenuItem onClick={(e) => handleShareLink("folder", folder.name, e)} className="cursor-pointer text-xs font-bold gap-2 text-zinc-700 dark:text-zinc-200 focus:bg-zinc-50 dark:focus:bg-zinc-900">
                          <Share2 className="w-3.5 h-3.5 text-pmii-blue" /> Bagikan Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleDeleteFolder(folder.name, e)} className="cursor-pointer text-xs font-bold gap-2 text-rose-500 focus:bg-rose-50 dark:focus:bg-rose-950/20 focus:text-rose-500">
                          <Trash2 className="w-3.5 h-3.5" /> Hapus Folder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
               ))}
            </div>
          )}

          <div className="flex justify-between items-center bg-white dark:bg-[#080d16]/60 p-2 border border-zinc-200 dark:border-zinc-800/80 rounded-xl">
              <div className="flex items-center gap-2 pl-2">
                {selectedFolder ? (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleGoBack}
                      className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 h-8 px-2 -ml-2 font-bold text-xs"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Kembali
                    </Button>
                    <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-1"></div>
                    <span className="text-xs font-bold text-pmii-blue dark:text-pmii-gold">{selectedFolder}</span>
                  </>
                ) : (
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Semua File</span>
                )}
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/60 px-1.5 py-0.5 rounded-md ml-1">{filteredDocs.length}</span>
              </div>

              <div className="flex gap-1.5 pr-1">
                 <Button variant={viewMode === "GRID" ? "default" : "ghost"} size="sm" className="h-8 px-2" onClick={() => setViewMode("GRID")}><Grid className="w-4 h-4"/></Button>
                 <Button variant={viewMode === "LIST" ? "default" : "ghost"} size="sm" className="h-8 px-2" onClick={() => setViewMode("LIST")}><List className="w-4 h-4"/></Button>
                 <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 mx-0.5 my-auto"></div>
                 <Button variant={showRightPanel ? "default" : "ghost"} size="sm" className="h-8 px-2" onClick={() => setShowRightPanel(!showRightPanel)}><Info className="w-4 h-4"/></Button>
              </div>
          </div>

          {filteredDocs.length === 0 ? (
            <Card className="border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#080d16]/60 rounded-2xl p-12 text-center shadow-none">
              <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500">Tidak ada berkas di direktori ini.</p>
            </Card>
                    ) : viewMode === "GRID" ? (
             <div className={`grid grid-cols-1 sm:grid-cols-2 ${showRightPanel ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-3 lg:grid-cols-4"} gap-4`}>
                {filteredDocs.map((doc) => {
                  const fileMeta = getFileMeta(doc);
                  const isCv = doc.title.toLowerCase().includes("cv");
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      onDoubleClick={() => { setSelectedDoc(doc); setIsPreviewOpen(true); }}
                      className={`flex flex-col rounded-[16px] bg-[#f0f4f9] hover:bg-[#e3e8ef] dark:bg-[#1a2333]/50 dark:hover:bg-[#1f2c41]/70 border border-zinc-200/50 dark:border-zinc-800/60 p-3 select-none transition-all cursor-pointer relative shadow-2xs group/card ${
                        selectedDoc?.id === doc.id 
                          ? "ring-2 ring-pmii-blue dark:ring-pmii-gold bg-[#e3e8ef] dark:bg-[#1f2c41]" 
                          : ""
                      }`}
                    >
                      {/* CARD HEADER (Google Drive Style) */}
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2 truncate flex-1">
                          {/* Color-Coded Google Drive File Icon */}
                          {renderFileHeaderIcon(fileMeta.type)}
                          <h4 className="text-[11.5px] font-bold truncate text-zinc-800 dark:text-zinc-200 flex-1 text-left" title={doc.title}>
                            {doc.title}
                          </h4>
                        </div>

                        {/* Options Ellipsis Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-6 w-6 rounded-full flex items-center justify-center outline-none hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all cursor-pointer border-none shrink-0" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-3.5 h-3.5 text-zinc-500" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-md">
                            <DropdownMenuItem onClick={(e) => handleShareLink("file", doc.id, e)} className="cursor-pointer text-xs font-bold gap-2 text-zinc-700 dark:text-zinc-200 focus:bg-zinc-50 dark:focus:bg-zinc-900">
                              <Share2 className="w-3.5 h-3.5 text-pmii-blue" /> Bagikan Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleToggleStar(doc.id, e)} className="cursor-pointer text-xs font-bold gap-2 text-zinc-700 dark:text-zinc-200 focus:bg-zinc-50 dark:focus:bg-zinc-900">
                              <Star className={`w-3.5 h-3.5 ${doc.isStarred ? "text-pmii-gold fill-pmii-gold" : "text-zinc-400"}`} /> Beri Bintang
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); setShowRightPanel(true); }} className="cursor-pointer text-xs font-bold gap-2 text-zinc-700 dark:text-zinc-200 focus:bg-zinc-50 dark:focus:bg-zinc-900">
                              <Info className="w-3.5 h-3.5 text-sky-500" /> Detail Info
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800/60" />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id); }} className="cursor-pointer text-xs font-bold gap-2 text-rose-500 focus:bg-rose-50 dark:focus:bg-rose-950/20 focus:text-rose-500">
                              <Trash2 className="w-3.5 h-3.5" /> Hapus Berkas
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* CARD BODY (Checkerboard preview/thumbnail header area) */}
                      <div className="h-36 w-full rounded-xl bg-white dark:bg-[#0c1222] flex items-center justify-center overflow-hidden border border-zinc-200/60 dark:border-zinc-800/80 relative shadow-inner mt-2.5 mb-2">
                        {renderFilePreview(fileMeta, doc)}
                      </div>

                      {/* CARD FOOTER */}
                      <div className="flex items-center gap-2 pt-2 border-t border-zinc-200/40 dark:border-zinc-800/40">
                        {/* Circular PMII Avatar Badge */}
                        <PmiiAvatar />
                        
                        {/* Status Message exactly matching User's Image */}
                        <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-medium truncate flex-1 text-left">
                          {isCv ? "Anda membukanya" : "Anda mengeditnya"} • {doc.uploadedDate}
                        </span>
                        
                        <div className="shrink-0 scale-90">
                          <AccessBadge access={doc.access} />
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>
          ) : (
            <Card className="border-zinc-200 dark:border-zinc-800/80 shadow-none bg-white dark:bg-[#080d16]/60 overflow-hidden">
              <Table>
                  <TableHeader>
                      <TableRow className="border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-black/20">
                          <TableHead className="text-xs">Nama Berkas</TableHead>
                          <TableHead className="text-xs">Kategori</TableHead>
                          <TableHead className="text-xs">Akses</TableHead>
                          <TableHead></TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredDocs.map(doc => (
                          <TableRow 
                            key={doc.id} 
                            onClick={() => setSelectedDoc(doc)} 
                            onDoubleClick={() => { setSelectedDoc(doc); setIsPreviewOpen(true); }}
                            className={`cursor-pointer border-zinc-100 dark:border-zinc-800/40 ${selectedDoc?.id === doc.id ? "bg-zinc-50 dark:bg-zinc-900/50" : ""}`}
                          >
                              <TableCell className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                                <div className="flex items-center gap-3">
                                  {/* UX FIX: Ikon File untuk list item */}
                                  <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg text-zinc-500 dark:text-zinc-400 shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="truncate max-w-[200px]">{doc.title}</span>
                                    <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">{doc.code}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell><CategoryBadge category={doc.category} /></TableCell>
                              <TableCell><AccessBadge access={doc.access} /></TableCell>
                              <TableCell className="text-right">
                                  <div className="flex justify-end gap-0.5">
                                    <Button variant="ghost" size="sm" onClick={(e) => handleShareLink("file", doc.id, e)} className="h-8 w-8 p-0 text-zinc-400 hover:text-pmii-blue dark:hover:text-pmii-gold rounded-lg shadow-none border-none">
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={(e) => handleToggleStar(doc.id, e)} className="h-8 w-8 p-0 rounded-lg shadow-none border-none">
                                        <Star className={`w-4 h-4 ${doc.isStarred ? "text-pmii-gold fill-pmii-gold" : "text-zinc-400 dark:text-zinc-500"}`} />
                                    </Button>
                                  </div>
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
            </Card>
          )}
        </div>

        {showRightPanel && (
          <div className="lg:col-span-3">
             <FileDetailPanel 
               selectedDoc={selectedDoc} 
               setShowRightPanel={setShowRightPanel} 
               handleDownload={handleDownload} 
               documents={documents}
               setDocuments={updateDocuments} 
               setSelectedDoc={setSelectedDoc}
               onPreviewClick={() => setIsPreviewOpen(true)}
             />
          </div>
        )}
      </div>

      {/* PREVIEW DIALOG MODAL (LIFTED STATE) */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl w-11/12 bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 h-[80vh] flex flex-col shadow-xl">
          {selectedDoc && (() => {
            // Get clean file URL
            let fileUrl = "";
            let textDescription = selectedDoc.description || "";
            if (textDescription.startsWith("{")) {
              try {
                const parsed = JSON.parse(textDescription);
                fileUrl = parsed.fileUrl || "";
                textDescription = parsed.text || "";
              } catch (e) {}
            } else if (textDescription.startsWith("http://") || textDescription.startsWith("https://")) {
              fileUrl = textDescription;
              textDescription = "Dokumen eksternal yang diarsip secara digital.";
            }

            return (
              <>
                <DialogHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <DialogTitle className="text-sm font-bold text-zinc-800 dark:text-white truncate">
                    Pratinjau: {selectedDoc.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex-1 w-full overflow-hidden rounded-xl bg-zinc-50 dark:bg-zinc-950 mt-4 relative flex items-center justify-center">
                  {fileUrl ? (() => {
                    const getCleanExtension = (url: string) => {
                      try {
                        const cleanUrl = url.split(/[?#]/)[0].toLowerCase();
                        return cleanUrl.substring(cleanUrl.lastIndexOf('.')) || "";
                      } catch (e) {
                        return "";
                      }
                    };
                    const ext = getCleanExtension(fileUrl);
                    const titleLower = selectedDoc.title.toLowerCase();
                    const isExcel = ext === ".xlsx" || ext === ".xls" || ext === ".csv" || titleLower.endsWith(".xlsx") || titleLower.endsWith(".xls") || titleLower.endsWith(".csv");
                    const isPdf = ext === ".pdf" || titleLower.endsWith(".pdf");
                    const isImage = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ext) || fileUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || titleLower.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
                    const isWord = ext === ".docx" || ext === ".doc" || titleLower.endsWith(".docx") || titleLower.endsWith(".doc");

                    if (isExcel) {
                      return <ExcelCsvPreview fileUrl={fileUrl} title={selectedDoc.title} />;
                    }
                    if (isPdf) {
                      return (
                        <iframe 
                          src={`${fileUrl}#toolbar=0`} 
                          className="w-full h-full border-none rounded-xl bg-white"
                          title={selectedDoc.title}
                        />
                      );
                    }
                    if (isImage) {
                      return (
                        <img 
                          src={fileUrl} 
                          alt={selectedDoc.title} 
                          className="max-w-full max-h-full object-contain rounded-xl" 
                        />
                      );
                    }
                    if (isWord) {
                      return (
                        <iframe 
                          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
                          className="w-full h-full border-none rounded-xl bg-white"
                          title={selectedDoc.title}
                        />
                      );
                    }

                    return (
                      <div className="text-center space-y-4 p-8">
                        <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
                        <h2 className="text-lg font-bold text-zinc-800 dark:text-white">{selectedDoc.title}</h2>
                        <p className="text-xs text-zinc-500">Pratinjau format ini tidak didukung langsung oleh browser.</p>
                        <a href={fileUrl} target="_blank" rel="noreferrer">
                          <Button className="bg-pmii-blue text-white dark:bg-pmii-gold dark:text-[#090d16] font-bold text-xs rounded-xl border-none">
                            Buka di Tab Baru
                          </Button>
                        </a>
                      </div>
                    );
                  })() : (
                    <div className="w-full h-full p-8 flex flex-col justify-between bg-white dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 font-serif border border-zinc-200 dark:border-zinc-800/80 rounded-xl max-w-2xl mx-auto shadow-lg overflow-y-auto">
                      {/* Mock Official Letter PMII */}
                      <div className="text-center space-y-2 border-b-2 border-double border-zinc-800 dark:border-zinc-200 pb-4">
                        <h1 className="text-sm font-black tracking-widest font-sans text-pmii-blue dark:text-pmii-gold">PENGURUS CABANG</h1>
                        <h2 className="text-base font-black tracking-widest font-sans text-pmii-blue dark:text-pmii-gold">PERGERAKAN MAHASISWA ISLAM INDONESIA</h2>
                        <p className="text-[9px] font-sans text-zinc-500">Sekretariat: Jl. Pergerakan No. 19 | Email: pc@pmii.or.id</p>
                      </div>
                      
                      <div className="my-6 space-y-4 text-xs leading-relaxed text-justify px-4">
                        <div className="flex justify-between font-sans text-[10px] text-zinc-500">
                          <span>Nomor : {selectedDoc.code}</span>
                          <span>Tanggal : {selectedDoc.uploadedDate}</span>
                        </div>
                        <div className="font-sans text-[10px] text-zinc-500">
                          <span>Hal : Arsip Dokumen Resmi</span>
                        </div>
                        <p className="indent-8 font-serif">
                          Menimbang bahwa tertib administrasi merupakan pilar utama dari roda pergerakan organisasi, dengan ini menyatakan bahwa berkas dengan judul <strong>"{selectedDoc.title}"</strong> telah terdaftar secara sah di dalam database PMII Portal.
                        </p>
                        <p className="indent-8 font-serif">
                          Dokumen ini diarsipkan secara digital pada tahun {selectedDoc.year} oleh {selectedDoc.uploader} dengan hak akses tingkat {selectedDoc.access}. Dokumen fisik tersimpan di sekretariat organisasi dan salinan digital dapat diunduh secara resmi menggunakan tombol unduh pada panel rincian.
                        </p>
                        <p className="indent-8 font-serif">
                          Demikian surat keterangan arsip digital ini dibuat untuk dapat dipergunakan sebagaimana mestinya. Tangan Terkepal dan Maju Kemuka!
                        </p>
                      </div>

                      <div className="flex justify-end pr-12 pt-8 font-sans text-[10px] text-center">
                        <div className="space-y-12">
                          <span>PENGURUS CABANG</span>
                          <div className="flex flex-col font-bold">
                            <span className="underline">Ahmad Fudholi</span>
                            <span className="text-[8px] text-zinc-500">Ketua Cabang</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}