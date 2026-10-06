import React, { useRef } from "react";
import {
  Building,
  Phone,
  Mail,
  Globe,
  Image as ImageIcon,
  Trash2
} from "lucide-react";

function Instagram({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { OrganizationSettings, SystemSettings } from "./types";

interface OrganizationTabProps {
  settings: SystemSettings;
  currentUser: any;
  updateOrgField: (key: keyof OrganizationSettings, value: string) => void;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
}

export const OrganizationTab: React.FC<OrganizationTabProps> = ({
  settings,
  currentUser,
  updateOrgField,
  onLogoChange,
  onRemoveLogo
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const isKomisariat = currentUser?.role === "KOMISARIAT";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Settings Form */}
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none lg:col-span-2">
        <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="text-sm font-bold tracking-wide flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{isKomisariat ? "Identitas Organisasi Komisariat" : "Identitas Organisasi Cabang"}</span>
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            {isKomisariat
              ? "Informasi resmi kepengurusan PMII tingkat komisariat yang tertera pada dokumen dan arsip administrasi."
              : "Informasi resmi kepengurusan PMII tingkat cabang yang tertera pada dokumen dan arsip administrasi."}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Nama Komisariat
              </label>
              <Input
                value={settings.organization.cabangName}
                onChange={(e) => updateOrgField("cabangName", e.target.value)}
                className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Masa Khidmat / Periode
              </label>
              <Input
                value={settings.organization.period}
                onChange={(e) => updateOrgField("period", e.target.value)}
                className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Alamat Sekretariat
            </label>
            <textarea
              value={settings.organization.address}
              onChange={(e) => updateOrgField("address", e.target.value)}
              rows={3}
              className="w-full p-2.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Nomor WhatsApp Resmi
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={settings.organization.phone}
                  onChange={(e) => updateOrgField("phone", e.target.value)}
                  className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Surel Resmi (E-mail)
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  type="email"
                  value={settings.organization.email}
                  onChange={(e) => updateOrgField("email", e.target.value)}
                  className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Situs Web Resmi
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={settings.organization.website}
                  onChange={(e) => updateOrgField("website", e.target.value)}
                  className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Instagram Resmi
              </label>
              <div className="relative">
                <Instagram className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={settings.organization.instagram}
                  onChange={(e) => updateOrgField("instagram", e.target.value)}
                  className="text-xs pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg h-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sidebar Card: Logo Only */}
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none lg:col-span-1 p-5 sm:p-6 flex flex-col justify-center">
        <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-3.5">
          <input
            type="file"
            ref={logoInputRef}
            onChange={onLogoChange}
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
          />

          <div className="w-24 h-24 rounded-full bg-blue-600 dark:bg-blue-700 border-2 border-amber-400/40 flex items-center justify-center text-white font-bold text-lg shadow-sm relative overflow-hidden group">
            {settings.organization.logo ? (
              <img
                src={settings.organization.logo}
                alt="Logo Organisasi"
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <span>PMII</span>
            )}
            <div
              onClick={() => logoInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-semibold text-white transition-opacity duration-200 cursor-pointer"
            >
              Ganti Logo
            </div>
          </div>

          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {isKomisariat ? "Lambang PK PMII" : "Lambang PC PMII"}
            </h4>
            <p className="text-[10px] text-zinc-400">PNG, JPG, SVG, atau WebP (Maks. 2MB)</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => logoInputRef.current?.click()}
              className="text-xs font-medium h-8 border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer flex items-center gap-1.5"
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{settings.organization.logo ? "Ganti Logo" : "Unggah Logo"}</span>
            </Button>

            {settings.organization.logo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemoveLogo}
                className="text-xs font-medium h-8 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
