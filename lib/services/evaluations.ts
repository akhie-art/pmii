import { ParticipantEvaluation, SessionScore } from "./types";
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

  return saveTableData<ParticipantEvaluation>("evaluations", KEYS.EVALUATIONS, normalized);
}
