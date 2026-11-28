"use client";

import React, { useState, useMemo } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  BookOpen,
  Sparkles,
  Brain
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TablePagination, paginateItems } from "@/components/ui/table-pagination";
import type { ParticipantEvaluation, EventActivity } from "@/lib/db";
import { getParticipantAllSessions } from "./rekapExportHelpers";

interface YudisiumTableProps {
  filteredList: ParticipantEvaluation[];
  currentActivity: EventActivity | null;
  getParticipantAvatar: (item: ParticipantEvaluation) => string | undefined;
  onOpenDetail: (item: ParticipantEvaluation) => void;
}

export const YudisiumTable: React.FC<YudisiumTableProps> = ({
  filteredList,
  currentActivity,
  getParticipantAvatar,
  onOpenDetail
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset ke halaman 1 saat daftar peserta berubah karena filter/pencarian/kegiatan
  const listSignature = useMemo(
    () => filteredList.map((item) => item.id).join(","),
    [filteredList]
  );
  const [prevSignature, setPrevSignature] = useState(listSignature);
  if (listSignature !== prevSignature) {
    setPrevSignature(listSignature);
    if (currentPage !== 1) setCurrentPage(1);
  }

  const {
    paginatedItems: paginatedList,
    safePage,
    startIndex,
  } = paginateItems(filteredList, currentPage, pageSize);

  return (
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
      {filteredList.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Belum ada data nilai peserta
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Nilai peserta yang diinput melalui lembar penilaian materi akan otomatis terakumulasi di sini.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 font-semibold">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[220px]">Nama Peserta</th>
                <th className="py-3 px-3 min-w-[150px]">Materi / Sesi</th>
                <th className="py-3 px-3 text-center">Pre-Test (1-100)</th>
                <th className="py-3 px-3 text-center">Post-Test (1-100)</th>
                <th className="py-3 px-3 text-center">Kognitif (30%)</th>
                <th className="py-3 px-3 text-center">Afektif (35%)</th>
                <th className="py-3 px-3 text-center">Motorik (35%)</th>
                <th className="py-3 px-3 text-center">Skor (1-100)</th>
                <th className="py-3 px-3 text-center">Predikat</th>
                <th className="py-3 px-4 text-center">Status Kelulusan</th>
                <th className="py-3 px-3 text-center">Detail</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map((item, index) => {
                const rowNumber = startIndex + index + 1;
                const isEvaluated = item.status !== "BELUM_DINILAI";
                const sessions = getParticipantAllSessions(item, currentActivity?.sessions);
                const hasSessions = sessions.length > 0;
                const totalRows = hasSessions ? sessions.length + 1 : 1;
                const gradedSessionsCount = sessions.filter((s) => s.isGraded).length;
                const totalSessions = currentActivity?.sessions ? currentActivity.sessions.length : sessions.length;

                return (
                  <React.Fragment key={item.id}>
                    {hasSessions ? (
                      <>
                        {/* Sub-baris per materi */}
                        {sessions.map((session, sIdx) => {
                          const isFirst = sIdx === 0;

                          return (
                            <tr
                              key={`${item.id}-session-${sIdx}`}
                              className={`hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors ${
                                !isFirst ? "border-t border-zinc-100 dark:border-zinc-800/60" : ""
                              }`}
                            >
                              {/* Kolom Kiri: Spanning participant info */}
                              {isFirst && (
                                <>
                                  <td
                                    rowSpan={totalRows}
                                    className="py-3 px-3 text-center text-zinc-400 font-mono font-medium align-top border-r border-zinc-100 dark:border-zinc-800/60"
                                  >
                                    <span className="sticky top-12 block pt-1">{rowNumber}</span>
                                  </td>

                                  <td
                                    rowSpan={totalRows}
                                    className="py-3 px-4 align-top border-r border-zinc-100 dark:border-zinc-800/60"
                                  >
                                    <div className="flex items-start gap-2.5 sticky top-12 pt-0.5">
                                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center justify-center shrink-0 border border-zinc-200/80 dark:border-zinc-700/80 overflow-hidden relative shadow-2xs mt-0.5">
                                        <span className="select-none font-bold text-xs">
                                          {item.participantName.substring(0, 2).toUpperCase()}
                                        </span>
                                        {getParticipantAvatar(item) && (
                                          <SmartImage
                                            src={getParticipantAvatar(item)}
                                            alt={item.participantName}
                                            width={40}
                                            height={40}
                                            unoptimized
                                            className="absolute inset-0 w-full h-full object-cover rounded-full"
                                          />
                                        )}
                                      </div>
                                      <div className="space-y-1 min-w-0">
                                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs truncate max-w-[160px]" title={item.participantName}>
                                          {item.participantName}
                                        </div>
                                        <div className="text-[10px] text-zinc-400 truncate max-w-[160px]">
                                          {item.gender || "Laki-laki"} • {item.commissariat || "Ki Ageng Getas Pendawa"}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[160px]">
                                          {item.university || "-"}
                                        </div>
                                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                          <Badge
                                            variant="outline"
                                            className="text-[9px] px-1.5 py-0.2 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-semibold"
                                          >
                                            {totalSessions > 0 ? `${gradedSessionsCount}/${totalSessions} Materi Dinilai` : `${gradedSessionsCount} Materi`}
                                          </Badge>
                                          {item.careerAssessment && (
                                            <span
                                              className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60"
                                              title={`${item.careerAssessment.mbtiCode}: Bakat ${item.careerAssessment.talent}, Minat: ${item.careerAssessment.interest}`}
                                            >
                                              <Brain className="w-2.5 h-2.5 shrink-0" />
                                              {item.careerAssessment.mbtiCode}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </>
                              )}

                              {/* Kolom Materi / Sesi */}
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5">
                                  <BookOpen className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs truncate max-w-[160px]" title={session.title}>
                                    {session.title}
                                  </span>
                                </div>
                              </td>

                              {/* Pre-Test Materi */}
                              <td className="py-2.5 px-3 text-center font-mono">
                                {session.preTest !== undefined ? (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                                    {session.preTest}
                                  </span>
                                ) : (
                                  <span className="text-zinc-400 text-[10px]">-</span>
                                )}
                              </td>

                              {/* Post-Test Materi */}
                              <td className="py-2.5 px-3 text-center font-mono">
                                {session.postTest !== undefined ? (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                                    {session.postTest}
                                  </span>
                                ) : (
                                  <span className="text-zinc-400 text-[10px]">-</span>
                                )}
                              </td>

                              {/* Kognitif Sesi */}
                              <td className="py-2.5 px-3 text-center font-mono text-zinc-700 dark:text-zinc-300 font-medium">
                                {session.kognitif !== undefined ? session.kognitif : "-"}
                              </td>

                              {/* Afektif Sesi */}
                              <td className="py-2.5 px-3 text-center font-mono text-zinc-700 dark:text-zinc-300 font-medium">
                                {session.afektif !== undefined ? session.afektif : "-"}
                              </td>

                              {/* Motorik Sesi */}
                              <td className="py-2.5 px-3 text-center font-mono text-zinc-700 dark:text-zinc-300 font-medium">
                                {session.psikomotorik !== undefined ? session.psikomotorik : "-"}
                              </td>

                              {/* Skor Sesi */}
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-800 dark:text-zinc-200">
                                {session.score !== undefined ? session.score : "-"}
                              </td>

                              {/* Kolom Kanan: Spanning Predikat, Status, Detail */}
                              {isFirst && (
                                <>
                                  <td
                                    rowSpan={totalRows}
                                    className="py-3 px-3 text-center align-middle border-l border-zinc-100 dark:border-zinc-800/60"
                                  >
                                    {isEvaluated ? (
                                      <span
                                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black shadow-2xs ${
                                          item.grade === "A"
                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                                            : item.grade === "B"
                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300"
                                            : item.grade === "C"
                                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                                            : item.grade === "D"
                                            ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-300"
                                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300"
                                        }`}
                                      >
                                        {item.grade}
                                      </span>
                                    ) : (
                                      <span className="text-zinc-400 font-mono">-</span>
                                    )}
                                  </td>

                                  <td
                                    rowSpan={totalRows}
                                    className="py-3 px-4 text-center align-middle"
                                  >
                                    {item.status === "LULUS" && (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                        <CheckCircle2 className="w-3 h-3" /> Lulus
                                      </span>
                                    )}
                                    {item.status === "LULUS_BERSYARAT" && (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                        <AlertTriangle className="w-3 h-3" /> Bersyarat
                                      </span>
                                    )}
                                    {item.status === "TIDAK_LULUS" && (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                                        <XCircle className="w-3 h-3" /> Tidak Lulus
                                      </span>
                                    )}
                                    {item.status === "BELUM_DINILAI" && (
                                      <span className="text-[11px] text-zinc-400 font-medium">
                                        Belum Dinilai
                                      </span>
                                    )}
                                  </td>

                                  <td
                                    rowSpan={totalRows}
                                    className="py-3 px-3 text-center align-middle"
                                  >
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => onOpenDetail(item)}
                                      className="h-7 w-7 rounded-lg text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                                      title="Lihat rincian lengkap per materi"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </Button>
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}

                        {/* Baris Ringkasan Rata-rata / Akumulasi Akhir */}
                        <tr className="bg-blue-50/40 dark:bg-blue-950/25 border-t border-blue-200/60 dark:border-blue-900/60 border-b-2 border-zinc-200 dark:border-zinc-800">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-blue-700 dark:text-blue-300 text-xs flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                              Rata-rata Akumulasi
                            </span>
                          </td>

                          {/* Rata-rata Pre-Test */}
                          <td className="py-2.5 px-3 text-center font-mono">
                            {item.preTestAverage !== undefined ? (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800" title="Rata-rata Pre-Test Seluruh Materi">
                                {item.preTestAverage}
                              </span>
                            ) : (
                              <span className="text-zinc-400 text-[10px]">-</span>
                            )}
                          </td>

                          {/* Rata-rata Post-Test */}
                          <td className="py-2.5 px-3 text-center font-mono">
                            {item.postTestAverage !== undefined ? (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800" title="Rata-rata Post-Test Seluruh Materi">
                                {item.postTestAverage}
                              </span>
                            ) : (
                              <span className="text-zinc-400 text-[10px]">-</span>
                            )}
                          </td>

                          {/* Rata Kognitif */}
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                            {isEvaluated ? item.kognitif : "-"}
                          </td>

                          {/* Rata Afektif */}
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                            {isEvaluated ? item.afektif : "-"}
                          </td>

                          {/* Rata Motorik */}
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                            {isEvaluated ? item.psikomotorik : "-"}
                          </td>

                          {/* Skor Akhir */}
                          <td className="py-2.5 px-3 text-center font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                            {isEvaluated ? item.finalScore : "-"}
                          </td>
                        </tr>
                      </>
                    ) : (
                      /* Fallback row jika kegiatan belum memiliki materi */
                      <tr className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors border-b-2 border-zinc-200 dark:border-zinc-800">
                        <td className="py-3 px-3 text-center text-zinc-400 font-mono font-medium">
                          {rowNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center justify-center shrink-0 border border-zinc-200/80 dark:border-zinc-700/80 overflow-hidden relative shadow-2xs">
                              <span className="select-none font-bold text-xs">
                                {item.participantName.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                                {item.participantName}
                              </div>
                              <div className="text-[10px] text-zinc-400">
                                {item.gender || "Laki-laki"} • {item.commissariat || "Ki Ageng Getas Pendawa"}
                              </div>
                              {item.careerAssessment && (
                                <div className="pt-0.5">
                                  <span
                                    className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60"
                                    title={`${item.careerAssessment.mbtiCode}: Bakat ${item.careerAssessment.talent}`}
                                  >
                                    <Brain className="w-2.5 h-2.5 shrink-0" />
                                    {item.careerAssessment.mbtiCode}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-zinc-400 italic text-[11px]">
                          Belum ada materi
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-zinc-400">-</td>
                        <td className="py-3 px-3 text-center font-mono text-zinc-400">-</td>
                        <td className="py-3 px-3 text-center font-mono text-zinc-400">-</td>
                        <td className="py-3 px-3 text-center font-mono text-zinc-400">-</td>
                        <td className="py-3 px-3 text-center font-mono text-zinc-400">-</td>
                        <td className="py-3 px-3 text-center font-mono text-zinc-400">-</td>
                        <td className="py-3 px-3 text-center font-mono text-zinc-400">-</td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[11px] text-zinc-400 font-medium">
                            Belum Dinilai
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onOpenDetail(item)}
                            className="h-7 w-7 rounded-md text-zinc-400"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer (referensi halaman Pengguna) */}
      <TablePagination
        totalItems={filteredList.length}
        currentPage={safePage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        itemLabel="peserta"
        variant="embedded"
        className="print:hidden"
      />
    </Card>
  );
};
