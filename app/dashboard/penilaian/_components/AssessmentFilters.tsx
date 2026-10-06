import React from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { EventActivity } from "@/lib/db";

interface AssessmentFiltersProps {
  events: EventActivity[];
  selectedActivityId: string;
  onActivityChange: (actId: string) => void;
  currentActivity: EventActivity | null;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
}

export const AssessmentFilters: React.FC<AssessmentFiltersProps> = ({
  events,
  selectedActivityId,
  onActivityChange,
  currentActivity,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter
}) => {
  return (
    <Card className="p-3 sm:p-3.5 bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Kegiatan Selector */}
        <div className="flex items-center gap-2 w-full md:w-80">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider shrink-0 hidden sm:inline">
            Kegiatan:
          </span>
          <Select
            value={selectedActivityId}
            onValueChange={(val) => {
              if (val) onActivityChange(val);
            }}
          >
            <SelectTrigger className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg font-medium flex-1">
              <SelectValue placeholder="Pilih Kegiatan">
                {currentActivity ? (
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate">{currentActivity.name}</span>
                    {currentActivity.level && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-4 shrink-0 font-semibold"
                      >
                        {currentActivity.level}
                      </Badge>
                    )}
                  </div>
                ) : (
                  "Pilih Kegiatan"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {events.length === 0 ? (
                <SelectItem value="NONE" disabled className="text-xs">
                  Belum ada kegiatan kaderisasi
                </SelectItem>
              ) : (
                events.map((act) => (
                  <SelectItem key={act.id} value={act.id} className="text-xs font-medium">
                    {act.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2 flex-1 md:max-w-md justify-end">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Cari nama peserta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 pl-8 pr-7 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => {
              if (val) setStatusFilter(val);
            }}
          >
            <SelectTrigger className="h-8.5 w-32 sm:w-36 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SEMUA" className="text-xs">
                Semua Status
              </SelectItem>
              <SelectItem value="BELUM_DINILAI" className="text-xs">
                Belum Dinilai
              </SelectItem>
              <SelectItem value="LULUS" className="text-xs">
                Lulus
              </SelectItem>
              <SelectItem value="LULUS_BERSYARAT" className="text-xs">
                Lulus Bersyarat
              </SelectItem>
              <SelectItem value="TIDAK_LULUS" className="text-xs">
                Tidak Lulus
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};
