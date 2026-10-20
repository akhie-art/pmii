import { ParticipantEvaluation, SessionScore, ParticipantRegistration, EventActivity, CadreFollowUp } from "./types";
import { KEYS, DEFAULT_EVALUATIONS } from "./defaults";
import { getTableData, saveTableData } from "./core";
import { supabase, isSupabaseConfigured } from "../supabase";
import { isValidUUID, generateUUID } from "../utils";

export function calculateEvaluationScore(
  kognitif: number,
  afektif: number,
  psikomotorik: number
): { finalScore: number; grade: "A" | "B" | "C" | "D" | "E"; status: "LULUS" | "LULUS_BERSYARAT" | "TIDAK_LULUS" } {
  const weightedScore = (kognitif * 0.30) + (afektif * 0.35) + (psikomotorik * 0.35);
  const finalScore = Math.round(weightedScore * 10) / 10;

  let grade: "A" | "B" | "C" | "D" | "E" = "C";
  let status: "LULUS" | "LULUS_BERSYARAT" | "TIDAK_LULUS" = "LULUS";

  if (finalScore >= 85) {
    grade = "A";
    status = "LULUS";
  } else if (finalScore >= 75) {
    grade = "B";
    status = "LULUS";
  } else if (finalScore >= 65) {
    grade = "C";
    status = "LULUS_BERSYARAT";
  } else if (finalScore >= 50) {
    grade = "D";
    status = "LULUS_BERSYARAT";
  } else {
    grade = "E";
    status = "TIDAK_LULUS";
  }

  return { finalScore, grade, status };
}

export function recalculateParticipantCumulative(
  sessionScores: Record<string, SessionScore> = {}
): {
  kognitif: number;
  afektif: number;
  psikomotorik: number;
  finalScore: number;
  grade: "A" | "B" | "C" | "D" | "E";
  status: "LULUS" | "LULUS_BERSYARAT" | "TIDAK_LULUS" | "BELUM_DINILAI";
} {
  const sessions = Object.entries(sessionScores)
    .filter(([k, s]) => !k.startsWith("__") && typeof s?.kognitif === "number" && !isNaN(Number(s.kognitif)))
    .map(([, s]) => s);

  if (sessions.length === 0) {
    return {
      kognitif: 0,
      afektif: 0,
      psikomotorik: 0,
      finalScore: 0,
      grade: "E",
      status: "BELUM_DINILAI"
    };
  }

  const avgKognitif = Math.round((sessions.reduce((acc, s) => acc + (Number(s.kognitif) || 0), 0) / sessions.length) * 10) / 10;
  const avgAfektif = Math.round((sessions.reduce((acc, s) => acc + (Number(s.afektif) || 0), 0) / sessions.length) * 10) / 10;
  const avgPsikomotorik = Math.round((sessions.reduce((acc, s) => acc + (Number(s.psikomotorik) || 0), 0) / sessions.length) * 10) / 10;

  const safeKog = isNaN(avgKognitif) ? 0 : avgKognitif;
  const safeAfk = isNaN(avgAfektif) ? 0 : avgAfektif;
  const safePsi = isNaN(avgPsikomotorik) ? 0 : avgPsikomotorik;

  const calc = calculateEvaluationScore(safeKog, safeAfk, safePsi);

  return {
    kognitif: safeKog,
    afektif: safeAfk,
    psikomotorik: safePsi,
    finalScore: isNaN(calc.finalScore) ? 0 : calc.finalScore,
    grade: calc.grade,
    status: calc.status
  };
}

export function deduplicateEvaluations(evalList: ParticipantEvaluation[]): ParticipantEvaluation[] {
  if (!Array.isArray(evalList) || evalList.length === 0) return [];

  const byActivity = new Map<string, ParticipantEvaluation[]>();
  for (const item of evalList) {
    if (!item) continue;
    const actId = String(item.activityId || "").trim();
    if (!actId) continue;
    const list = byActivity.get(actId) || [];
    list.push(item);
    byActivity.set(actId, list);
  }

  const result: ParticipantEvaluation[] = [];

  for (const [, items] of byActivity.entries()) {
    const activityResult: ParticipantEvaluation[] = [];

    for (const item of items) {
      const cadreIdClean = (item.cadreId || "").trim().toLowerCase();
      const nameClean = (item.participantName || "").trim().toLowerCase();

      const existingIndex = activityResult.findIndex((ex) => {
        const exCadreId = (ex.cadreId || "").trim().toLowerCase();
        const exName = (ex.participantName || "").trim().toLowerCase();

        if (cadreIdClean && exCadreId && cadreIdClean === exCadreId) {
          return true;
        }
        if (nameClean && exName && nameClean === exName) {
          return true;
        }
        return false;
      });

      if (existingIndex === -1) {
        activityResult.push({
          ...item,
          id: isValidUUID(String(item.id)) ? String(item.id) : generateUUID(),
          ...(item as any)
        });
      } else {
        const existing = activityResult[existingIndex];
        const existingScoreCount = Object.keys(existing.sessionScores || {}).length;
        const newScoreCount = Object.keys(item.sessionScores || {}).length;

        let chosenId = existing.id;
        if (!isValidUUID(chosenId) && isValidUUID(String(item.id))) {
          chosenId = String(item.id);
        } else if (!isValidUUID(chosenId)) {
          chosenId = generateUUID();
        }

        const mergedScores = {
          ...(existing.sessionScores || {}),
          ...(item.sessionScores || {})
        };
        const mergedQuiz = {
          ...(existing.quizResults || {}),
          ...(item.quizResults || {})
        };

        const shouldUseNewScores =
          newScoreCount > existingScoreCount ||
          (newScoreCount === existingScoreCount && ((item as any).updatedAt || "") > ((existing as any).updatedAt || ""));

        const merged: ParticipantEvaluation = {
          ...(shouldUseNewScores ? item : existing),
          id: chosenId,
          activityId: item.activityId || existing.activityId,
          cadreId: (item.cadreId && isValidUUID(item.cadreId) ? item.cadreId : existing.cadreId) || item.cadreId || existing.cadreId || "",
          participantName: item.participantName || existing.participantName,
          avatar: item.avatar || existing.avatar || "",
          commissariat: item.commissariat || existing.commissariat || "",
          sessionScores: mergedScores,
          quizResults: mergedQuiz,
          preTestAverage: item.preTestAverage ?? existing.preTestAverage,
          postTestAverage: item.postTestAverage ?? existing.postTestAverage,
          kognitif: shouldUseNewScores ? item.kognitif : (existing.kognitif || item.kognitif || 0),
          afektif: shouldUseNewScores ? item.afektif : (existing.afektif || item.afektif || 0),
          psikomotorik: shouldUseNewScores ? item.psikomotorik : (existing.psikomotorik || item.psikomotorik || 0),
          finalScore: shouldUseNewScores ? item.finalScore : (existing.finalScore || item.finalScore || 0),
          status: shouldUseNewScores ? item.status : (existing.status || item.status || "PENDING")
        };

        activityResult[existingIndex] = merged;
      }
    }

    result.push(...activityResult);
  }

  return result;
}

export async function getEvaluations(
  defaultData: ParticipantEvaluation[] = DEFAULT_EVALUATIONS
): Promise<ParticipantEvaluation[]> {
  const data = await getTableData<ParticipantEvaluation>("evaluations", KEYS.EVALUATIONS, defaultData);
  const withoutDummies = data.filter(item =>
    !["eval-1", "eval-2", "eval-3", "eval-4", "eval-5"].includes(item.id) &&
    !["reg-101", "reg-102", "reg-103", "reg-104", "reg-105", "reg-106"].includes(item.cadreId || "")
  );

  const cleaned = deduplicateEvaluations(withoutDummies);

  if (cleaned.length !== data.length && typeof window !== "undefined") {
    try {
      localStorage.setItem(KEYS.EVALUATIONS, JSON.stringify(cleaned));
    } catch (e) {
      console.warn("Failed to sync cleaned evaluations to localStorage", e);
    }
  }

  const mapped = cleaned.map(item => {
    const sessionScores = { ...(item.sessionScores || {}) };
    const quizMeta = (sessionScores as any).__quizMeta;
    delete (sessionScores as any).__quizMeta;
    const quizResults = item.quizResults || quizMeta?.quizResults || {};
    
    let preAvg = item.preTestAverage ?? quizMeta?.preTestAverage;
    let postAvg = item.postTestAverage ?? quizMeta?.postTestAverage;
    
    if (preAvg === undefined || postAvg === undefined) {
      const preVals: number[] = [];
      const postVals: number[] = [];
      
      Object.entries(sessionScores).forEach(([k, v]: [string, any]) => {
        if (k === "__quizMeta") return;
        if (typeof v?.preTestScore === "number" && !isNaN(v.preTestScore)) preVals.push(v.preTestScore);
        if (typeof v?.postTestScore === "number" && !isNaN(v.postTestScore)) postVals.push(v.postTestScore);
      });
      
      Object.values(quizResults).forEach((v: any) => {
        if (typeof v?.preTest === "number" && !isNaN(v.preTest)) preVals.push(v.preTest);
        if (typeof v?.postTest === "number" && !isNaN(v.postTest)) postVals.push(v.postTest);
      });
      
      if (preAvg === undefined && preVals.length > 0) {
        preAvg = Math.round(preVals.reduce((a, b) => a + b, 0) / preVals.length);
      }
      if (postAvg === undefined && postVals.length > 0) {
        postAvg = Math.round(postVals.reduce((a, b) => a + b, 0) / postVals.length);
      }
    }

    let kognitif = Number(item.kognitif);
    let afektif = Number(item.afektif);
    let psikomotorik = Number(item.psikomotorik);
    let finalScore = Number(item.finalScore);

    if (isNaN(kognitif) || isNaN(afektif) || isNaN(psikomotorik) || isNaN(finalScore)) {
      const recalculated = recalculateParticipantCumulative(sessionScores);
      kognitif = recalculated.kognitif;
      afektif = recalculated.afektif;
      psikomotorik = recalculated.psikomotorik;
      finalScore = recalculated.finalScore;
    }
    
    return {
      ...item,
      sessionScores,
      kognitif: isNaN(kognitif) ? 0 : kognitif,
      afektif: isNaN(afektif) ? 0 : afektif,
      psikomotorik: isNaN(psikomotorik) ? 0 : psikomotorik,
      finalScore: isNaN(finalScore) ? 0 : finalScore,
      quizResults,
      preTestAverage: preAvg !== undefined && !isNaN(preAvg) ? preAvg : undefined,
      postTestAverage: postAvg !== undefined && !isNaN(postAvg) ? postAvg : undefined
    };
  });

  return mapped;
}

export async function saveEvaluations(evalList: ParticipantEvaluation[]): Promise<boolean> {
  let normalized = deduplicateEvaluations(evalList);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: dbRecords, error } = await supabase
        .from("evaluations")
        .select("id, activityId, cadreId, participantName");

      if (!error && dbRecords && dbRecords.length > 0) {
        normalized = normalized.map((item) => {
          const cadreIdClean = (item.cadreId || "").trim().toLowerCase();
          const nameClean = (item.participantName || "").trim().toLowerCase();

          const dbMatch = dbRecords.find((r: any) => {
            if (r.activityId !== item.activityId) return false;
            const rCadreId = (r.cadreId || "").trim().toLowerCase();
            const rName = (r.participantName || "").trim().toLowerCase();

            if (cadreIdClean && rCadreId && cadreIdClean === rCadreId) return true;
            if (nameClean && rName && nameClean === rName) return true;
            return false;
          });

          if (dbMatch && dbMatch.id) {
            return { ...item, id: dbMatch.id };
          }
          return item;
        });

        normalized = deduplicateEvaluations(normalized);
      }
    } catch (e) {
      console.warn("Could not pre-sync evaluation IDs with Supabase:", e);
    }
  }

  const cleaned = normalized.map((item) => {
    const copy = { ...item };
    delete (copy as any).created_at;
    delete (copy as any).createdAt;
    return copy;
  });

  return saveTableData<ParticipantEvaluation>("evaluations", KEYS.EVALUATIONS, cleaned);
}

/**
 * Sinkronisasi pendaftaran kegiatan (registrations) dengan daftar evaluasi (evaluations).
 * Memastikan setiap peserta yang terdaftar otomatis terdaftar di halaman Penilaian dan Rekap Nilai.
 */
export function syncEvaluationsWithRegistrations(
  currentEvals: ParticipantEvaluation[],
  regs: ParticipantRegistration[],
  events: EventActivity[],
  cadres: CadreFollowUp[] = []
): { synced: ParticipantEvaluation[]; hasChanges: boolean } {
  let hasChanges = false;
  const syncedList = [...(currentEvals || [])];

  // 1. Lengkapi evaluasi yang sudah ada jika profilnya (avatar/commissariat/university/gender) masih kosong
  for (let i = 0; i < syncedList.length; i++) {
    const item = syncedList[i];
    const matchedCadre = cadres.find(
      (c) =>
        (c.id && item.cadreId && c.id === item.cadreId) ||
        (c.name && item.participantName && c.name.trim().toLowerCase() === item.participantName.trim().toLowerCase())
    );

    if (matchedCadre) {
      let itemChanged = false;
      if (!item.avatar && matchedCadre.avatar) {
        item.avatar = matchedCadre.avatar;
        itemChanged = true;
      }
      if (!item.commissariat && matchedCadre.commissariat) {
        item.commissariat = matchedCadre.commissariat;
        itemChanged = true;
      }
      if (!item.university && matchedCadre.perguruanTinggi) {
        item.university = matchedCadre.perguruanTinggi;
        itemChanged = true;
      }
      if (!item.gender && matchedCadre.gender) {
        item.gender = matchedCadre.gender;
        itemChanged = true;
      }
      if (itemChanged) {
        hasChanges = true;
      }
    }
  }

  // 2. Petakan seluruh pendaftaran aktif ke dalam evaluasi per kegiatan
  for (const reg of regs || []) {
    // Lewati jika pendaftaran berstatus REJECTED
    if (reg.status === "REJECTED") continue;
    if (!reg.eventId) continue;

    const event = events.find((e) => e.id === reg.eventId);
    const matchedCadre = cadres.find(
      (c) =>
        (c.id && reg.cadreId && c.id === reg.cadreId) ||
        (c.name && reg.cadreName && c.name.trim().toLowerCase() === reg.cadreName.trim().toLowerCase()) ||
        (c.email && reg.cadreEmail && c.email.trim().toLowerCase() === reg.cadreEmail.trim().toLowerCase())
    );

    const regCadreId = matchedCadre?.id || reg.cadreId || reg.id;
    const regCleanName = (reg.cadreName || reg.name || matchedCadre?.name || "").trim();
    if (!regCleanName) continue;

    const alreadyInEval = syncedList.some((e) => {
      if (e.activityId !== reg.eventId) return false;
      const evalCleanName = (e.participantName || "").trim().toLowerCase();
      const evalCadreId = (e.cadreId || "").trim().toLowerCase();
      return (
        (regCadreId && evalCadreId && (evalCadreId === regCadreId.toLowerCase() || (matchedCadre?.id && evalCadreId === matchedCadre.id.toLowerCase()))) ||
        (regCleanName && evalCleanName && evalCleanName === regCleanName.toLowerCase())
      );
    });

    if (!alreadyInEval) {
      hasChanges = true;
      const resolvedComm =
        matchedCadre?.commissariat ||
        reg.commissariat ||
        (reg.answers?.commissariat as string) ||
        (reg.answers?.komisariat as string) ||
        (event as any)?.commissariat ||
        "";

      const resolvedUniv =
        matchedCadre?.perguruanTinggi ||
        reg.university ||
        (reg.answers?.university as string) ||
        (reg.answers?.kampus as string) ||
        "";

      const resolvedGender =
        (matchedCadre?.gender as any) ||
        reg.gender ||
        (reg.answers?.gender as string) ||
        "";

      syncedList.push({
        id: generateUUID(),
        activityId: reg.eventId,
        activityName: event?.name || event?.title || "Kegiatan Kaderisasi",
        cadreId: regCadreId,
        participantName: regCleanName,
        avatar: matchedCadre?.avatar || reg.avatar || "",
        gender: resolvedGender,
        commissariat: resolvedComm,
        university: resolvedUniv,
        level: event?.level || "MAPABA",
        sessionScores: {},
        kognitif: 0,
        afektif: 0,
        psikomotorik: 0,
        finalScore: 0,
        grade: "E",
        status: "BELUM_DINILAI",
        evaluatorId: "",
        evaluatorName: "",
        notes: "",
        updatedAt: new Date().toISOString()
      });
    }
  }

  const deduped = deduplicateEvaluations(syncedList);
  return { synced: deduped, hasChanges: hasChanges || deduped.length !== (currentEvals || []).length };
}

/**
 * Memastikan satu pendaftaran langsung memiliki entri di evaluations.
 * Berguna saat kader mendaftar atau admin menyetujui pendaftaran kegiatan.
 */
export async function ensureEvaluationForRegistration(
  reg: ParticipantRegistration,
  event?: EventActivity | null,
  cadre?: CadreFollowUp | null
): Promise<ParticipantEvaluation | null> {
  if (!reg || !reg.eventId || reg.status === "REJECTED") return null;

  try {
    const evals = await getEvaluations([]);
    const regCadreId = cadre?.id || reg.cadreId || reg.id;
    const regCleanName = (reg.cadreName || reg.name || cadre?.name || "").trim();
    if (!regCleanName) return null;

    const existing = evals.find((e) => {
      if (e.activityId !== reg.eventId) return false;
      const evalCleanName = (e.participantName || "").trim().toLowerCase();
      const evalCadreId = (e.cadreId || "").trim().toLowerCase();
      return (
        (regCadreId && evalCadreId && (evalCadreId === regCadreId.toLowerCase() || (cadre?.id && evalCadreId === cadre.id.toLowerCase()))) ||
        (evalCleanName === regCleanName.toLowerCase())
      );
    });

    if (existing) {
      return existing;
    }

    const resolvedComm =
      cadre?.commissariat ||
      reg.commissariat ||
      (reg.answers?.commissariat as string) ||
      (reg.answers?.komisariat as string) ||
      (event as any)?.commissariat ||
      "";

    const resolvedUniv =
      cadre?.perguruanTinggi ||
      reg.university ||
      (reg.answers?.university as string) ||
      (reg.answers?.kampus as string) ||
      "";

    const resolvedGender =
      (cadre?.gender as any) ||
      reg.gender ||
      (reg.answers?.gender as string) ||
      "";

    const newEval: ParticipantEvaluation = {
      id: generateUUID(),
      activityId: reg.eventId,
      activityName: event?.name || event?.title || "Kegiatan Kaderisasi",
      cadreId: regCadreId,
      participantName: regCleanName,
      avatar: cadre?.avatar || reg.avatar || "",
      gender: resolvedGender,
      commissariat: resolvedComm,
      komisariat_id: cadre?.komisariat_id || reg.komisariat_id || (event as any)?.komisariat_id || null,
      university: resolvedUniv,
      level: event?.level || "MAPABA",
      sessionScores: {},
      kognitif: 0,
      afektif: 0,
      psikomotorik: 0,
      finalScore: 0,
      grade: "E",
      status: "BELUM_DINILAI",
      evaluatorId: "",
      evaluatorName: "",
      notes: "",
      updatedAt: new Date().toISOString()
    };

    const updatedList = [newEval, ...evals];
    await saveEvaluations(updatedList);
    return newEval;
  } catch (err) {
    console.error("Gagal auto-create evaluation for registration:", err);
    return null;
  }
}

