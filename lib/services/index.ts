import { getCadres, saveCadres, getAnggota, saveAnggota } from "./cadres";
import { getEvents, saveEvents, getDefaultEventTimeline } from "./events";
import { getRegistrations, saveRegistrations } from "./registrations";
import { getRequirements, saveRequirements } from "./requirements";
import { getBoards, saveBoards } from "./boards";
import { getCommissariats, saveCommissariats } from "./commissariats";
import { getUsers, saveUsers } from "./users";
import { getKaderisasi, saveKaderisasi } from "./kaderisasi";
import { getKurikulum, saveKurikulum } from "./kurikulum";
import { getSurat, saveSurat, getSuratTemplates, saveSuratTemplates } from "./letters";
import { getArsip, saveArsip } from "./archive";
import {
  getEvaluations,
  saveEvaluations,
  deduplicateEvaluations,
  calculateEvaluationScore,
  recalculateParticipantCumulative
} from "./evaluations";
import { getArticles, saveArticles, likeArticle, formatArticleDate } from "./articles";
import {
  getUserCredentials,
  setUserPassword,
  getUserPassword,
  migrateUserEmail,
  deleteUserFromAuth,
  deleteUsersFromAuth,
  createAuthUser,
  updateAuthUser
} from "./credentials";
import { normalizeKomisariat, normalizeDateString } from "./core";

// Unified db facade for 100% backward compatibility
export const db = {
  // Cadres / Anggota
  getCadres,
  saveCadres,
  getAnggota,
  saveAnggota,

  // Events / Kegiatan
  getEvents,
  saveEvents,

  // Registrations / Pendaftaran
  getRegistrations,
  saveRegistrations,

  // Requirements / Persyaratan RTL
  getRequirements,
  saveRequirements,

  // Boards / Pengurus
  getBoards,
  saveBoards,

  // Commissariats / Komisariat
  getCommissariats,
  saveCommissariats,

  // Users & Auth
  getUsers,
  saveUsers,

  // Kaderisasi
  getKaderisasi,
  saveKaderisasi,

  // Surat & Template
  getSurat,
  saveSurat,
  getSuratTemplates,
  saveSuratTemplates,

  // Arsip
  getArsip,
  saveArsip,

  // Evaluations / Penilaian Instruktur
  deduplicateEvaluations,
  getEvaluations,
  saveEvaluations,

  // Kurikulum
  getKurikulum,
  saveKurikulum,

  // Articles
  getArticles,
  saveArticles,
  likeArticle,

  // Auth & Credentials helpers
  getUserCredentials,
  setUserPassword,
  getUserPassword,
  migrateUserEmail,
  deleteUserFromAuth,
  deleteUsersFromAuth,
};

// Export all types and models
export * from "./types";

// Export all default constants
export * from "./defaults";

// Export all standalone helpers
export {
  getDefaultEventTimeline,
  calculateEvaluationScore,
  recalculateParticipantCumulative,
  deduplicateEvaluations,
  formatArticleDate,
  normalizeKomisariat,
  normalizeDateString,
  getUserCredentials,
  setUserPassword,
  getUserPassword,
  migrateUserEmail,
  deleteUserFromAuth,
  deleteUsersFromAuth,
  createAuthUser,
  updateAuthUser
};

export { generateUUID, isValidUUID } from "../utils";
