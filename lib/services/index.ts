import { getCadres, saveCadres, getAnggota, saveAnggota, deleteCadre, deleteAnggota } from "./cadres";
import { getEvents, saveEvents, deleteEvent, getDefaultEventTimeline } from "./events";
import { getRegistrations, saveRegistrations, deleteRegistration } from "./registrations";
import { getRequirements, saveRequirements } from "./requirements";
import { getBoards, saveBoards } from "./boards";
import { getCommissariats, saveCommissariats, upsertCommissariat, deleteCommissariat } from "./commissariats";
import { getUsers, saveUsers } from "./users";
import { getKaderisasi, saveKaderisasi } from "./kaderisasi";
import { getKurikulum, saveKurikulum } from "./kurikulum";
import { getSurat, saveSurat, deleteSurat, getSuratTemplates, saveSuratTemplates, deleteSuratTemplate } from "./letters";
import { getArsip, saveArsip } from "./archive";
import {
  getEvaluations,
  saveEvaluations,
  deduplicateEvaluations,
  calculateEvaluationScore,
  recalculateParticipantCumulative,
  syncEvaluationsWithRegistrations,
  ensureEvaluationForRegistration
} from "./evaluations";
import { getArticles, saveArticles, deleteArticle, likeArticle, formatArticleDate } from "./articles";
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
import { getRoles, getRoleByCode, getRoleById, upsertRole, deleteRole, DEFAULT_ROLES } from "./roles";
import { normalizeKomisariat, normalizeDateString, deleteTableRow, upsertTableRow } from "./core";

// Unified db facade for 100% backward compatibility
export const db = {
  // Cadres / Anggota
  getCadres,
  saveCadres,
  getAnggota,
  saveAnggota,
  deleteCadre,
  deleteAnggota,
  deleteTableRow,
  upsertTableRow,

  // Events / Kegiatan
  getEvents,
  saveEvents,
  deleteEvent,

  // Registrations / Pendaftaran
  getRegistrations,
  saveRegistrations,
  deleteRegistration,

  // Requirements / Persyaratan RTL
  getRequirements,
  saveRequirements,

  // Boards / Pengurus
  getBoards,
  saveBoards,

  // Commissariats / Komisariat
  getCommissariats,
  saveCommissariats,
  upsertCommissariat,
  deleteCommissariat,

  // Users & Auth
  getUsers,
  saveUsers,

  // Kaderisasi
  getKaderisasi,
  saveKaderisasi,

  // Surat & Template
  getSurat,
  saveSurat,
  deleteSurat,
  getSuratTemplates,
  saveSuratTemplates,
  deleteSuratTemplate,

  // Arsip
  getArsip,
  saveArsip,

  // Evaluations / Penilaian Instruktur
  deduplicateEvaluations,
  getEvaluations,
  saveEvaluations,
  syncEvaluationsWithRegistrations,
  ensureEvaluationForRegistration,

  // Kurikulum
  getKurikulum,
  saveKurikulum,

  // Articles
  getArticles,
  saveArticles,
  deleteArticle,
  likeArticle,

  // Roles & Multi-Tenancy Roles
  getRoles,
  getRoleByCode,
  getRoleById,
  upsertRole,
  deleteRole,

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
  syncEvaluationsWithRegistrations,
  ensureEvaluationForRegistration,
  formatArticleDate,
  normalizeKomisariat,
  normalizeDateString,
  deleteTableRow,
  upsertTableRow,
  deleteCadre,
  deleteAnggota,
  deleteEvent,
  deleteRegistration,
  getUserCredentials,
  setUserPassword,
  getUserPassword,
  migrateUserEmail,
  deleteUserFromAuth,
  deleteUsersFromAuth,
  createAuthUser,
  updateAuthUser,
  getRoles,
  getRoleByCode,
  getRoleById,
  upsertRole,
  deleteRole,
  DEFAULT_ROLES
};

export { generateUUID, isValidUUID } from "../utils";
