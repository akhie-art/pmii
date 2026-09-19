"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/db";
import {
  ShieldCheck,
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Check,
  X,
  BarChart3,
  GitFork,
  UserCheck,
  UserPlus,
  Info,
  ChevronDown,
  LayoutGrid,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity,
  Award
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from "recharts";

interface BoardMember {
  id: string;
  name: string;
  position: string;
  department: "BPH" | "Kaderisasi" | "Keagamaan & Dakwah" | "Advokasi & Humas" | "Minat, Bakat & Seni";
  gender: "Sahabat" | "Sahabati";
  email: string;
  phone: string;
  status: "AKTIF" | "DEMISIONER";
  period: string;
}

const DEPARTMENTS = [
  "BPH",
  "Kaderisasi",
  "Keagamaan & Dakwah",
  "Advokasi & Humas",
  "Minat, Bakat & Seni"
] as const;

export default function KomisariatPengurusPage() {
  const [mounted, setMounted] = useState(false);
  const [activeCampus, setActiveCampus] = useState("UIN Walisongo");
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [activeTab, setActiveTab] = useState<"daftar" | "struktur" | "statistik">("daftar");

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<BoardMember | null>(null);

  // Form inputs state
  const [formName, setFormName] = useState("");
  const [formGender, setFormGender] = useState<"Sahabat" | "Sahabati">("Sahabat");
  const [formPosition, setFormPosition] = useState("");
  const [formDept, setFormDept] = useState<BoardMember["department"]>("Kaderisasi");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formStatus, setFormStatus] = useState<"AKTIF" | "DEMISIONER">("AKTIF");
  const [formPeriod, setFormPeriod] = useState("2026 - 2027");

  // Toast state
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const campus = typeof window !== "undefined" ? (localStorage.getItem("PMII_ACTIVE_COMMISSARIAT") || "UIN Walisongo") : "UIN Walisongo";
    setActiveCampus(campus);

    db.getBoards().then((data) => {
      setBoardMembers(data as any);
      setMounted(true);
    });
  }, []);

  const saveBoardMembers = async (members: BoardMember[]) => {
    setBoardMembers(members);
    await db.saveBoards(members as any);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  // Reset form inputs
  const resetForm = () => {
    setFormName("");
    setFormGender("Sahabat");
    setFormPosition("");
    setFormDept("Kaderisasi");
    setFormEmail("");
    setFormPhone("");
    setFormStatus("AKTIF");
    setFormPeriod("2026 - 2027");
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (member: BoardMember) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormGender(member.gender);
    setFormPosition(member.position);
    setFormDept(member.department);
    setFormEmail(member.email);
    setFormPhone(member.phone);
    setFormStatus(member.status);
    setFormPeriod(member.period);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPosition) return;

    const newMember: BoardMember = {
      id: `board-${Date.now()}`,
      name: formName,
      gender: formGender,
      position: formPosition,
      department: formDept,
      email: formEmail || "-",
      phone: formPhone || "-",
      status: formStatus,
      period: formPeriod
    };

    const updated = [newMember, ...boardMembers];
    saveBoardMembers(updated);
    setShowAddModal(false);
    showToast(`Berhasil menambahkan ${formName} sebagai pengurus!`);
    resetForm();
  };

  const handleEditMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !formName || !formPosition) return;

    const updated = boardMembers.map((m) =>
      m.id === editingMember.id
        ? {
            ...m,
            name: formName,
            gender: formGender,
            position: formPosition,
            department: formDept,
            email: formEmail,
            phone: formPhone,
            status: formStatus,
            period: formPeriod
          }
        : m
    );

    saveBoardMembers(updated);
    setEditingMember(null);
    showToast(`Data ${formName} berhasil diperbarui!`);
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data pengurus "${name}"?`)) {
      const updated = boardMembers.filter((m) => m.id !== id);
      saveBoardMembers(updated);
      showToast(`Data pengurus "${name}" berhasil dihapus!`);
    }
  };

  // Filtering logic
  const filteredMembers = boardMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === "ALL" || m.department === selectedDept;
    const matchesStatus = selectedStatus === "ALL" || m.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Calculate quick stats
  const totalCount = boardMembers.length;
  const activeCount = boardMembers.filter((m) => m.status === "AKTIF").length;
  const demisionerCount = totalCount - activeCount;
  const sahabatCount = boardMembers.filter((m) => m.gender === "Sahabat").length;
  const sahabatiCount = totalCount - sahabatCount;

  // Chart data
  const deptChartData = DEPARTMENTS.map((dept) => ({
    name: dept === "BPH" ? "BPH" : dept.split(" ")[0],
    fullName: dept,
    Jumlah: boardMembers.filter((m) => m.department === dept).length
  }));

  const genderChartData = [
    { name: "Sahabat", value: sahabatCount, color: "#f59e0b" },
    { name: "Sahabati", value: sahabatiCount, color: "#3b82f6" }
  ];

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  // Find structure elements
  const ketua = boardMembers.find((m) => m.position.toLowerCase().includes("ketua") && m.department === "BPH");
  const sekretaris = boardMembers.find((m) => m.position.toLowerCase().includes("sekretaris") && m.department === "BPH");
  const bendahara = boardMembers.find((m) => m.position.toLowerCase().includes("bendahara") && m.department === "BPH");
  const otherBph = boardMembers.filter(
    (m) =>
      m.department === "BPH" &&
      m.id !== ketua?.id &&
      m.id !== sekretaris?.id &&
      m.id !== bendahara?.id
  );

  return (
    <div className="space-y-6 relative z-10">
      
      {/* TOAST ALERTS */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 right-6 z-50 bg-zinc-900 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER HERO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 md:p-6 rounded-lg relative overflow-hidden shadow-none">
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-11 h-11 rounded-lg bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white shadow-sm relative overflow-hidden">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold tracking-tight">Data Pengurus</h1>
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-none text-[9px] font-semibold uppercase py-0.5 tracking-wider px-2">
                Struktur PK
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-xl">
              Kelola struktur kepengurusan Komisariat {activeCampus}, delegasikan tugas per divisi, serta visualisasikan diagram organisasi kepengurusan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 flex-wrap">
          <Button
            onClick={handleOpenAddModal}
            className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-extrabold py-2.5 px-4.5 rounded-xl border border-amber-400/20 shadow-md shadow-amber-500/10 cursor-pointer flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Pengurus
          </Button>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Total Pengurus",
            value: totalCount,
            desc: "Terdaftar musim ini",
            icon: Users,
            color: "from-blue-500 to-indigo-600",
            iconColor: "text-blue-500 dark:text-blue-400"
          },
          {
            title: "Pengurus Aktif",
            value: activeCount,
            desc: "Menjalankan amanah",
            icon: UserCheck,
            color: "from-emerald-500 to-teal-600",
            iconColor: "text-emerald-500 dark:text-emerald-400"
          },
          {
            title: "Kader Putra (Sahabat)",
            value: sahabatCount,
            desc: `${((sahabatCount / (totalCount || 1)) * 100).toFixed(0)}% dari total`,
            icon: ShieldCheck,
            color: "from-amber-500 to-orange-600",
            iconColor: "text-amber-500 dark:text-amber-400"
          },
          {
            title: "Kader Putri (Sahabati)",
            value: sahabatiCount,
            desc: `${((sahabatiCount / (totalCount || 1)) * 100).toFixed(0)}% dari total`,
            icon: Award,
            color: "from-pink-500 to-rose-600",
            iconColor: "text-pink-500 dark:text-pink-400"
          }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                {stat.title}
              </span>
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold tracking-tight">{stat.value}</div>
              <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">{stat.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* TABS SELECTOR */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg w-fit max-w-full overflow-x-auto">
        {[
          { id: "daftar", label: "Daftar Pengurus", icon: LayoutGrid },
          { id: "struktur", label: "Struktur Organisasi", icon: GitFork },
          { id: "statistik", label: "Statistik Pengurus", icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-blue-600 text-white shadow-none"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* MAIN CONTAINER */}
      <div className="min-h-[400px]">
        {/* TAB 1: LIST VIEW */}
        {activeTab === "daftar" && (
          <div className="space-y-4">
            {/* Search and Filters Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-lg shadow-none">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-450 dark:text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Cari nama atau jabatan pengurus..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 rounded-xl w-full"
                />
              </div>

              <div className="flex items-center gap-3.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Divisi:</span>
                </div>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 text-zinc-700 dark:text-zinc-300 font-medium focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="ALL">Semua Divisi</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 text-zinc-700 dark:text-zinc-300 font-medium focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="AKTIF">Aktif</option>
                  <option value="DEMISIONER">Demisioner</option>
                </select>
              </div>
            </div>

            {/* Members Grid */}
            {filteredMembers.length === 0 ? (
              <Card className="p-12 text-center bg-white/20 dark:bg-[#080d16]/20 border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-3">
                <Users className="w-10 h-10 text-zinc-400 dark:text-zinc-600 stroke-[1.5]" />
                <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-300">Tidak ada pengurus ditemukan</h4>
                <p className="text-xs text-zinc-500 max-w-xs">
                  Coba sesuaikan kata pencarian atau filter divisi/status kepengurusan Anda.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full bg-white/50 dark:bg-[#080d16]/50 border border-zinc-200/60 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700/80 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between group transition-all duration-300 relative">
                      
                      {/* Department Accent Ribbon */}
                      <div
                        className={`h-1.5 w-full bg-gradient-to-r ${
                          member.department === "BPH"
                            ? "from-amber-500 to-amber-600"
                            : member.department === "Kaderisasi"
                            ? "from-blue-500 to-indigo-600"
                            : member.department === "Keagamaan & Dakwah"
                            ? "from-emerald-500 to-teal-600"
                            : member.department === "Advokasi & Humas"
                            ? "from-purple-500 to-fuchsia-600"
                            : "from-pink-500 to-rose-600"
                        }`}
                      />

                      {/* Card Header & Content */}
                      <div className="p-4.5 space-y-4 flex-1">
                        <div className="flex items-start justify-between">
                          {/* Avatar Initials */}
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-sm relative overflow-hidden select-none bg-gradient-to-br ${
                              member.gender === "Sahabat"
                                ? "from-amber-500 to-orange-500 shadow-amber-500/10"
                                : "from-blue-500 to-indigo-600 shadow-blue-500/10"
                            }`}
                          >
                            {member.name
                              .split(" ")
                              .filter((w) => w.toLowerCase() !== "sahabat" && w.toLowerCase() !== "sahabati")
                              .slice(0, 2)
                              .map((n) => n[0])
                              .join("")}
                          </div>

                          {/* Quick Badges */}
                          <div className="flex flex-col items-end gap-1.5">
                            <Badge
                              className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                                member.status === "AKTIF"
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                  : "bg-zinc-500/10 border-zinc-500/20 text-zinc-500"
                              }`}
                            >
                              {member.status}
                            </Badge>
                            <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">
                              {member.period}
                            </span>
                          </div>
                        </div>

                        {/* Name & Position */}
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-250 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {member.name}
                          </h4>
                          <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                            {member.position}
                          </p>
                        </div>

                        {/* Division / Department Details */}
                        <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800/80 space-y-2">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-zinc-400 dark:text-zinc-500">Divisi</span>
                            <Badge className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 font-bold px-1.5 py-0.5">
                              {member.department}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-[10.5px] text-zinc-500 dark:text-zinc-400">
                            <Mail className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </div>

                          <div className="flex items-center gap-2 text-[10.5px] text-zinc-500 dark:text-zinc-400">
                            <Phone className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                            <span>{member.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="px-4.5 py-3.5 bg-zinc-50/50 dark:bg-zinc-950/30 border-t border-zinc-200/50 dark:border-zinc-800/60 flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon-xs"
                          onClick={() => handleOpenEditModal(member)}
                          className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-555 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-xs"
                          onClick={() => handleDeleteMember(member.id, member.name)}
                          className="border-zinc-200 dark:border-zinc-800 hover:bg-red-500/10 hover:border-red-500/30 text-zinc-555 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORGANIZATIONAL STRUCTURE TREE */}
        {activeTab === "struktur" && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 md:p-6 overflow-x-auto custom-scrollbar shadow-none">
            <div className="min-w-[850px] flex flex-col items-center py-6">
              
              {/* TOP LEVEL: KETUA */}
              <div className="flex flex-col items-center">
                {ketua ? (
                  <div className="relative group p-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/15 transition-transform hover:-translate-y-1 duration-300">
                    <div className="bg-white dark:bg-[#090f19] px-6 py-4.5 rounded-[14px] text-center w-64 space-y-2">
                      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] font-extrabold uppercase py-0.5 tracking-wider px-2 block mx-auto w-fit">
                        {ketua.position}
                      </Badge>
                      <h4 className="text-xs font-black text-zinc-800 dark:text-white truncate">{ketua.name}</h4>
                      <p className="text-[9.5px] font-mono text-zinc-450 dark:text-zinc-500">{ketua.period} • BPH</p>
                      
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(ketua)}
                          className="text-[9px] font-bold text-amber-600 hover:text-amber-500 dark:text-amber-400 cursor-pointer flex items-center gap-1"
                        >
                          <Edit2 className="w-2.5 h-2.5" /> Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-100 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl px-6 py-4.5 text-center w-64 text-zinc-400 text-xs font-bold">
                    Ketua Belum Ditetapkan
                  </div>
                )}
                
                {/* Connector Line down from Ketua */}
                <div className="w-0.5 h-8 bg-zinc-200 dark:bg-zinc-800" />
              </div>

              {/* LEVEL 2: SEKRETARIS & BENDAHARA */}
              <div className="relative w-full max-w-2xl flex items-center justify-between before:absolute before:top-0 before:left-1/4 before:right-1/4 before:h-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                {/* Vertical lines connecting from the horizontal line */}
                <div className="absolute top-0 left-1/4 w-0.5 h-6 bg-zinc-200 dark:bg-zinc-800" />
                <div className="absolute top-0 right-1/4 w-0.5 h-6 bg-zinc-200 dark:bg-zinc-800" />

                {/* Sekretaris Card (Left) */}
                <div className="flex flex-col items-center w-1/2 pt-6">
                  {sekretaris ? (
                    <div className="relative group p-0.5 bg-gradient-to-r from-zinc-300 to-zinc-400 dark:from-zinc-700 dark:to-zinc-800 rounded-2xl shadow-md transition-transform hover:-translate-y-1 duration-300">
                      <div className="bg-white dark:bg-[#090f19] px-5 py-4 rounded-[14px] text-center w-56 space-y-1.5">
                        <Badge className="bg-zinc-100 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-[8.5px] font-extrabold uppercase py-0.5 tracking-wider px-2 mx-auto w-fit">
                          Sekretaris
                        </Badge>
                        <h4 className="text-xs font-black text-zinc-800 dark:text-white truncate">{sekretaris.name}</h4>
                        <p className="text-[9px] text-zinc-450 dark:text-zinc-500">{sekretaris.period}</p>
                        
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(sekretaris)}
                            className="text-[9px] font-bold text-zinc-650 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 className="w-2.5 h-2.5" /> Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-zinc-100 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl px-5 py-4 text-center w-56 text-zinc-400 text-xs font-bold">
                      Sekretaris Belum Ditetapkan
                    </div>
                  )}
                </div>

                {/* Bendahara Card (Right) */}
                <div className="flex flex-col items-center w-1/2 pt-6">
                  {bendahara ? (
                    <div className="relative group p-0.5 bg-gradient-to-r from-zinc-300 to-zinc-400 dark:from-zinc-700 dark:to-zinc-800 rounded-2xl shadow-md transition-transform hover:-translate-y-1 duration-300">
                      <div className="bg-white dark:bg-[#090f19] px-5 py-4 rounded-[14px] text-center w-56 space-y-1.5">
                        <Badge className="bg-zinc-100 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-[8.5px] font-extrabold uppercase py-0.5 tracking-wider px-2 mx-auto w-fit">
                          Bendahara
                        </Badge>
                        <h4 className="text-xs font-black text-zinc-800 dark:text-white truncate">{bendahara.name}</h4>
                        <p className="text-[9px] text-zinc-450 dark:text-zinc-500">{bendahara.period}</p>
                        
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(bendahara)}
                            className="text-[9px] font-bold text-zinc-650 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 className="w-2.5 h-2.5" /> Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-zinc-100 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl px-5 py-4 text-center w-56 text-zinc-400 text-xs font-bold">
                      Bendahara Belum Ditetapkan
                    </div>
                  )}
                </div>
              </div>

              {/* Main vertical connector to divisions line */}
              <div className="w-0.5 h-10 bg-zinc-200 dark:bg-zinc-800 mt-6" />

              {/* LEVEL 3: DEPARTMENTS / BIDANG */}
              <div className="relative w-full border-t border-zinc-200 dark:border-zinc-800 pt-6">
                
                {/* Horizontal line across divisions */}
                <div className="absolute top-0 left-[10%] right-[10%] h-0.5 bg-zinc-200 dark:bg-zinc-800" />

                <div className="grid grid-cols-4 gap-6 w-full px-4">
                  {DEPARTMENTS.filter((d) => d !== "BPH").map((dept, deptIdx) => {
                    const divisionMembers = boardMembers.filter((m) => m.department === dept);
                    const headOfDiv = divisionMembers.find((m) => m.position.toLowerCase().includes("kepala") || m.position.toLowerCase().includes("kabid"));
                    const staffOfDiv = divisionMembers.filter((m) => m.id !== headOfDiv?.id);

                    return (
                      <div key={dept} className="flex flex-col items-center relative">
                        {/* Connecting Line down into each division head */}
                        <div className="absolute -top-6 w-0.5 h-6 bg-zinc-200 dark:bg-zinc-800" />

                        {/* Division Header Title */}
                        <div className="text-center space-y-4 w-full">
                          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/80 rounded-xl">
                            <span className="text-[10px] font-black text-zinc-800 dark:text-zinc-350 block uppercase tracking-wider truncate">
                              Bidang {dept.split(" ")[0]}
                            </span>
                          </div>

                          {/* Head Card */}
                          <div className="space-y-4">
                            {headOfDiv ? (
                              <div className="bg-white/60 dark:bg-[#090f19]/60 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl text-center space-y-1.5 shadow-xs transition-colors hover:border-amber-500/30">
                                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[8px] font-extrabold uppercase py-0.5 tracking-wider px-2 mx-auto w-fit block truncate">
                                  Kabid
                                </Badge>
                                <h5 className="text-[11px] font-extrabold text-zinc-800 dark:text-zinc-250 truncate">
                                  {headOfDiv.name}
                                </h5>
                                <button
                                  onClick={() => handleOpenEditModal(headOfDiv)}
                                  className="text-[8px] font-bold text-zinc-555 hover:text-zinc-700 dark:text-zinc-400 hover:underline cursor-pointer"
                                >
                                  Edit Detail
                                </button>
                              </div>
                            ) : (
                              <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-center text-[10px] font-bold text-zinc-400">
                                Kabid Kosong
                              </div>
                            )}

                            {/* Staff Members List */}
                            <div className="space-y-2">
                              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block text-left px-1">
                                Anggota Divisi ({staffOfDiv.length})
                              </span>
                              {staffOfDiv.length > 0 ? (
                                <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                                  {staffOfDiv.map((staff) => (
                                    <div
                                      key={staff.id}
                                      className="bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-800/60 p-2 rounded-lg flex items-center justify-between text-left group/staff"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <h6 className="text-[10px] font-black text-zinc-700 dark:text-zinc-300 truncate">
                                          {staff.name.replace(/Sahabat|Sahabati/g, "").trim()}
                                        </h6>
                                        <p className="text-[8.5px] text-zinc-450 dark:text-zinc-500 truncate uppercase">
                                          {staff.position}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => handleOpenEditModal(staff)}
                                        className="w-5 h-5 rounded-md hover:bg-zinc-250 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 opacity-0 group-hover/staff:opacity-100 transition-opacity cursor-pointer flex-shrink-0 ml-1.5"
                                      >
                                        <Edit2 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="bg-zinc-50/30 dark:bg-zinc-950/10 border border-zinc-150 dark:border-zinc-850 rounded-lg p-2.5 text-center text-[9px] text-zinc-450 dark:text-zinc-500 italic">
                                  Belum ada staff
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: STATISTICS */}
        {activeTab === "statistik" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Chart 1: Members Count per Department */}
              <Card className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                      Distribusi Pengurus per Divisi
                    </h3>
                    <p className="text-[9.5px] font-medium text-zinc-400 uppercase mt-0.5">
                      Jumlah fungsionaris aktif berdasarkan departemen kerja
                    </p>
                  </div>
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={9}
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={9}
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#080d16",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "12px",
                          fontSize: "10px",
                          color: "#fff"
                        }}
                        cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      />
                      <Bar dataKey="Jumlah" radius={[6, 6, 0, 0]}>
                        {deptChartData.map((entry, index) => {
                          const colors = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Chart 2: Gender Breakdown */}
              <Card className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-black text-zinc-800 dark:text-white">
                      Rasio Gender Pengurus
                    </h3>
                    <p className="text-[9.5px] font-bold text-zinc-450 dark:text-zinc-550 uppercase mt-0.5">
                      Perbandingan Sahabat dan Sahabati dalam fungsionaris
                    </p>
                  </div>
                  <Activity className="w-5 h-5 text-amber-500" />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-8 h-64">
                  <div className="w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {genderChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#080d16",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "12px",
                            fontSize: "10px",
                            color: "#fff"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3.5">
                    {genderChartData.map((g) => (
                      <div key={g.name} className="flex items-center gap-3.5">
                        <div className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: g.color }} />
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-black text-zinc-850 dark:text-zinc-200">{g.name}</span>
                            <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500">
                              ({g.value} Orang)
                            </span>
                          </div>
                          <p className="text-[10px] font-semibold text-zinc-500">
                            {((g.value / (totalCount || 1)) * 100).toFixed(1)}% Dari Fungsionaris
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

            </div>

            {/* Quick Insights List */}
            <Card className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none space-y-4">
              <div>
                <h3 className="text-xs font-black text-zinc-800 dark:text-white">Informasi & Kinerja Struktur</h3>
                <p className="text-[9.5px] font-bold text-zinc-450 dark:text-zinc-550 uppercase mt-0.5">
                  Analisis data fungsionaris aktif yang bertugas
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
                {[
                  {
                    title: "BPH Utama",
                    value: `${boardMembers.filter((m) => m.department === "BPH" && m.status === "AKTIF").length} Orang`,
                    desc: "Ketua, Sekretaris, Bendahara, dan pendamping harian."
                  },
                  {
                    title: "Kader Terdistribusi",
                    value: `${boardMembers.filter((m) => m.department !== "BPH" && m.status === "AKTIF").length} Orang`,
                    desc: "Fungsionaris yang tersebar pada 4 bidang pelaksana kegiatan."
                  },
                  {
                    title: "Akurasi Jabatan",
                    value: "100%",
                    desc: "Seluruh pengurus memiliki penugasan divisi yang terdefinisi."
                  }
                ].map((insight, idx) => (
                  <div key={idx} className="p-4 bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-1.5">
                    <span className="text-[9px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-wide">
                      {insight.title}
                    </span>
                    <h5 className="text-sm font-black text-zinc-800 dark:text-white">{insight.value}</h5>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                      {insight.desc}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODALS */}
      {/* 1. ADD MEMBER MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg"
            >
              <Card className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative">
                <div className="h-1.5 bg-gradient-to-r from-amber-500 to-pmii-blue w-full" />
                
                <form onSubmit={handleAddMember} className="space-y-4">
                  {/* Header */}
                  <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center border border-white/10 shadow-md">
                        <UserPlus className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                          Tambah Pengurus Baru
                        </h3>
                        <p className="text-[10px] text-zinc-555 uppercase font-bold tracking-wider mt-0.5">
                          Formulir registrasi keanggotaan fungsionaris baru
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-850 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-500 cursor-pointer"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                    
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                        Nama Pengurus
                      </label>
                      <Input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Contoh: Sahabat Muhammad Ali"
                        className="h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-850 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Gender */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                          Panggilan (Gender)
                        </label>
                        <select
                          value={formGender}
                          onChange={(e) => setFormGender(e.target.value as any)}
                          className="w-full h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 text-zinc-700 dark:text-zinc-300 font-medium focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                        >
                          <option value="Sahabat">Sahabat (Putra)</option>
                          <option value="Sahabati">Sahabati (Putri)</option>
                        </select>
                      </div>

                      {/* Period */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                          Periode Kepengurusan
                        </label>
                        <Input
                          type="text"
                          required
                          value={formPeriod}
                          onChange={(e) => setFormPeriod(e.target.value)}
                          placeholder="Contoh: 2026 - 2027"
                          className="h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-850 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Division */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                          Departemen / Divisi
                        </label>
                        <select
                          value={formDept}
                          onChange={(e) => setFormDept(e.target.value as any)}
                          className="w-full h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 text-zinc-700 dark:text-zinc-300 font-medium focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                        >
                          {DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                          Status Keanggotaan
                        </label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as any)}
                          className="w-full h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 text-zinc-700 dark:text-zinc-300 font-medium focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                        >
                          <option value="AKTIF">Aktif</option>
                          <option value="DEMISIONER">Demisioner</option>
                        </select>
                      </div>
                    </div>

                    {/* Position */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                        Jabatan Spesifik
                      </label>
                      <Input
                        type="text"
                        required
                        value={formPosition}
                        onChange={(e) => setFormPosition(e.target.value)}
                        placeholder="Contoh: Kepala Bidang Kaderisasi / Anggota Bidang Advokasi"
                        className="h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-855 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Email */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          placeholder="Contoh: name@pmii.org"
                          className="h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-850 rounded-xl"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                          No. Telepon / WhatsApp
                        </label>
                        <Input
                          type="text"
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          placeholder="Contoh: 081234567xxx"
                          className="h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-850 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-end gap-3 bg-zinc-50/50 dark:bg-zinc-950/20">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddModal(false)}
                      className="border-zinc-200 dark:border-zinc-800 text-xs font-semibold py-2 px-4 rounded-xl cursor-pointer"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold py-2 px-4 rounded-xl cursor-pointer"
                    >
                      Simpan Data
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. EDIT MEMBER MODAL */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg"
            >
              <Card className="bg-white dark:bg-[#090d16] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative">
                <div className="h-1.5 bg-gradient-to-r from-amber-500 to-pmii-blue w-full" />
                
                <form onSubmit={handleEditMember} className="space-y-4">
                  {/* Header */}
                  <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center border border-white/10 shadow-md">
                        <Edit2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                          Edit Data Pengurus
                        </h3>
                        <p className="text-[10px] text-zinc-555 uppercase font-bold tracking-wider mt-0.5">
                          Perbarui rekam data kepengurusan terpilih
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingMember(null)}
                      className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-850 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-500 cursor-pointer"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                    
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                        Nama Pengurus
                      </label>
                      <Input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Contoh: Sahabat Muhammad Ali"
                        className="h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-850 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Gender */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                          Panggilan (Gender)
                        </label>
                        <select
                          value={formGender}
                          onChange={(e) => setFormGender(e.target.value as any)}
                          className="w-full h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 text-zinc-700 dark:text-zinc-300 font-medium focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                        >
                          <option value="Sahabat">Sahabat (Putra)</option>
                          <option value="Sahabati">Sahabati (Putri)</option>
                        </select>
                      </div>

                      {/* Period */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                          Periode Kepengurusan
                        </label>
                        <Input
                          type="text"
                          required
                          value={formPeriod}
                          onChange={(e) => setFormPeriod(e.target.value)}
                          placeholder="Contoh: 2026 - 2027"
                          className="h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-850 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Division */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                          Departemen / Divisi
                        </label>
                        <select
                          value={formDept}
                          onChange={(e) => setFormDept(e.target.value as any)}
                          className="w-full h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 text-zinc-700 dark:text-zinc-300 font-medium focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                        >
                          {DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                          Status Keanggotaan
                        </label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as any)}
                          className="w-full h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 text-zinc-700 dark:text-zinc-300 font-medium focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                        >
                          <option value="AKTIF">Aktif</option>
                          <option value="DEMISIONER">Demisioner</option>
                        </select>
                      </div>
                    </div>

                    {/* Position */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                        Jabatan Spesifik
                      </label>
                      <Input
                        type="text"
                        required
                        value={formPosition}
                        onChange={(e) => setFormPosition(e.target.value)}
                        placeholder="Contoh: Kepala Bidang Kaderisasi / Anggota Bidang Advokasi"
                        className="h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-855 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Email */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          placeholder="Contoh: name@pmii.org"
                          className="h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-850 rounded-xl"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                          No. Telepon / WhatsApp
                        </label>
                        <Input
                          type="text"
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          placeholder="Contoh: 081234567xxx"
                          className="h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-850 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-end gap-3 bg-zinc-50/50 dark:bg-zinc-950/20">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingMember(null)}
                      className="border-zinc-200 dark:border-zinc-800 text-xs font-semibold py-2 px-4 rounded-xl cursor-pointer"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold py-2 px-4 rounded-xl cursor-pointer"
                    >
                      Perbarui Data
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
