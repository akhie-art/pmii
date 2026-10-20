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

export interface AdministrationSettings {
  letterCode: string;
  regionCode: string;
  autoNumbering: boolean;
  headOfBranch: string;
  secretaryGeneral: string;
  digitalSignature: boolean;
}

export interface SystemSettings {
  organization: OrganizationSettings;
  administration: AdministrationSettings;
  theme: "dark" | "light" | "system";
}

export const DEFAULT_SETTINGS: SystemSettings = {
  organization: {
    cabangName: "Pengurus Cabang PMII Grobogan",
    period: "2026 - 2027",
    address: "Jl. Raya Purwodadi - Solo Km. 2, Grobogan, Jawa Tengah",
    email: "cabang@pmiigrobogan.or.id",
    phone: "+62 812-3456-7890",
    website: "https://pmiigrobogan.or.id",
    instagram: "@pcpmii_grobogan",
    logo: ""
  },
  administration: {
    letterCode: "PC-XX",
    regionCode: "V-02",
    autoNumbering: true,
    headOfBranch: "Ketua Cabang PMII Grobogan",
    secretaryGeneral: "Sahabat Ahmad Fauzi",
    digitalSignature: false
  },
  theme: "system"
};
