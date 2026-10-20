import { CommissariatList, KomisariatStructure } from "@/lib/services/types";

export type { CommissariatList, KomisariatStructure };

export interface KomisariatFormData {
  id?: string;
  name: string;
  university: string;
  logo?: string;
  logoInitial?: string;
  establishedDate: string;
  establishedYear?: number;
  contactEmail: string;
  structure: {
    chairman: string;
    chairman_id?: string | null;
    secretary: string;
    secretary_id?: string | null;
    treasurer: string;
    treasurer_id?: string | null;
    period: string;
  };
}

export const DEFAULT_FORM_DATA: KomisariatFormData = {
  name: "",
  university: "",
  logo: "",
  logoInitial: "",
  establishedDate: "",
  contactEmail: "",
  structure: {
    chairman: "",
    chairman_id: null,
    secretary: "",
    secretary_id: null,
    treasurer: "",
    treasurer_id: null,
    period: "2026 - 2027",
  },
};

