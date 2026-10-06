"use client";

import React from "react";
import { Globe, Lock, Link2, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AccessLevel = "Public" | "Internal";

interface ChangeAccessModalProps {
  isOpen: boolean;
  currentAccess: AccessLevel;
  docTitle: string;
  fileUrl?: string;
  onClose: () => void;
  onConfirm: (access: AccessLevel) => void;
}

const ACCESS_OPTIONS: { value: AccessLevel; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    value: "Public",
    label: "Publik",
    desc: "Siapa saja dapat membuka berkas ini langsung",
    icon: <Globe className="w-4 h-4" />,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
  },
  {
    value: "Internal",
    label: "Internal",
    desc: "Harus meminta izin dari pemilik berkas",
    icon: <Lock className="w-4 h-4" />,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
  },
];

export default function ChangeAccessModal({
  isOpen,
  currentAccess,
  docTitle,
  fileUrl,
  onClose,
  onConfirm,
}: ChangeAccessModalProps) {
  const [selected, setSelected] = React.useState<AccessLevel>(currentAccess);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelected(currentAccess);
      setCopied(false);
    }
  }, [isOpen, currentAccess]);

  const handleCopyLink = async () => {
    const linkToCopy = fileUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = linkToCopy;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <Card className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden text-zinc-900 dark:text-zinc-100 text-left">
        <div className="p-4 space-y-1">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
            Ubah Hak Akses
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed truncate">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">&ldquo;{docTitle}&rdquo;</span>
          </p>
        </div>

        <div className="px-4 pb-4 space-y-2">
          {ACCESS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                selected === opt.value
                  ? opt.color + " ring-1 ring-current"
                  : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <div className={`shrink-0 ${selected === opt.value ? "" : "text-zinc-400 dark:text-zinc-500"}`}>
                {opt.icon}
              </div>
              <div>
                <div className="text-xs font-bold">{opt.label}</div>
                <div className="text-[10px] opacity-70">{opt.desc}</div>
              </div>
              {selected === opt.value && (
                <div className="ml-auto w-2 h-2 rounded-full bg-current shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Copy Link Bar — hanya tampil jika akses Publik */}
        {fileUrl && selected === "Public" && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <Link2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-[10px] text-zinc-500 truncate flex-1 font-mono">{fileUrl}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-all cursor-pointer ${
                  copied
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                    : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                }`}
              >
                {copied ? (
                  <><Check className="w-3 h-3" /> Tersalin!</>
                ) : (
                  "Salin"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Notice untuk Internal — tidak bisa disalin */}
        {selected === "Internal" && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                Berkas internal tidak memiliki tautan publik. Akses hanya melalui izin pemilik.
              </span>
            </div>
          </div>
        )}

        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-8 px-3 rounded-lg border-zinc-200 dark:border-zinc-800 cursor-pointer"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={() => { onConfirm(selected); onClose(); }}
            disabled={selected === currentAccess}
            className="text-xs font-medium h-8 px-3.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Simpan
          </Button>
        </div>
      </Card>
    </div>
  );
}
