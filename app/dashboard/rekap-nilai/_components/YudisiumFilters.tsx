import React from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { EventActivity } from "@/lib/db";

interface YudisiumFiltersProps {
  events: EventActivity[];
  selectedActivityId: string;
  setSelectedActivityId: (id: string) => void;
  currentActivityName?: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

export const YudisiumFilters: React.FC<YudisiumFiltersProps> = ({
  events,
  selectedActivityId,
  setSelectedActivityId,
  currentActivityName,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter
}) => {
  return (
    <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5">
        <div className="w-full sm:w-80">
          <Select
            value={selectedActivityId}
            onValueChange={(val) => {
              if (val) setSelectedActivityId(val);
            }}
          >
            <SelectTrigger className="h-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold">
              <SelectValue placeholder="Pilih Kegiatan">
                {currentActivityName || "Pilih Kegiatan"}
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

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Cari nama peserta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => {
              if (val) setStatusFilter(val);
            }}
          >
            <SelectTrigger className="h-9 w-36 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SEMUA" className="text-xs">
                Semua
              </SelectItem>
              <SelectItem value="LULUS" className="text-xs">
                Lulus
              </SelectItem>
              <SelectItem value="LULUS_BERSYARAT" className="text-xs">
                Bersyarat
              </SelectItem>
              <SelectItem value="TIDAK_LULUS" className="text-xs">
                Tidak Lulus
              </SelectItem>
              <SelectItem value="BELUM_DINILAI" className="text-xs">
                Belum Dinilai
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};
