export interface OrganizationSettings {
  cabangName: string;
  period: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  instagram: string;
  logo?: string;
}

export interface SystemSettings {
  organization: OrganizationSettings;
  theme: "dark" | "light" | "system";
}

export const DEFAULT_SETTINGS: SystemSettings = {
  organization: {
    cabangName: "PK PMII UIN Walisongo Semarang",
    period: "2026 - 2027",
    address: "Kampus UIN Walisongo, Ngaliyan, Kota Semarang, Jawa Tengah",
    email: "komisariat.walisongo@pmii.id",
    phone: "-",
    website: "https://pmii-walisongo.org",
    instagram: "@pmii_walisongo",
    logo: ""
  },
  theme: "dark"
};
