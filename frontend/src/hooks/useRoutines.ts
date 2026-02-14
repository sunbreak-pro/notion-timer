import { useState, useCallback, useEffect, useMemo } from "react";
import type { RoutineNode, RoutineLog, RoutineStats } from "../types/routine";
import { getDataService } from "../services";
import { logServiceError } from "../utils/logError";

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isDayApplicable(routine: RoutineNode, date: Date): boolean {
  if (routine.frequencyType === "daily") return true;
  return routine.frequencyDays.includes(date.getDay());
}

export function useRoutines() {
  const [routines, setRoutines] = useState<RoutineNode[]>([]);
  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Build a fast lookup: Map<routineId, Set<date>>
  const logsByRoutineId = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const log of logs) {
      let set = map.get(log.routineId);
      if (!set) {
        set = new Set();
        map.set(log.routineId, set);
      }
      set.add(log.date);
    }
    return map;
  }, [logs]);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [routineData, logData] = await Promise.all([
          getDataService().fetchAllRoutines(),
          // Fetch 6 months of logs
          (() => {
            const end = new Date();
            const start = new Date();
            start.setMonth(start.getMonth() - 6);
            return getDataService().fetchRoutineLogsByDateRange(
              formatDateKey(start),
              formatDateKey(end),
            );
          })(),
        ]);
        if (!cancelled) {
          setRoutines(routineData);
          setLogs(logData);
          setIsLoading(false);
        }
      } catch (e) {
        logServiceError("Routines", "fetch", e);
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const createRoutine = useCallback(
    (
      title: string,
      frequencyType: "daily" | "custom",
      frequencyDays: number[],
    ) => {
      const id = `routine-${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      const optimistic: RoutineNode = {
        id,
        title,
        frequencyType,
        frequencyDays,
        isArchived: false,
        order: routines.length,
        createdAt: now,
        updatedAt: now,
      };
      setRoutines((prev) => [...prev, optimistic]);
      getDataService()
        .createRoutine(id, title, frequencyType, frequencyDays)
        .catch((e) => logServiceError("Routines", "create", e));
      return id;
    },
    [routines.length],
  );

  const updateRoutine = useCallback(
    (
      id: string,
      updates: Partial<
        Pick<
          RoutineNode,
          "title" | "frequencyType" | "frequencyDays" | "isArchived" | "order"
        >
      >,
    ) => {
      setRoutines((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, ...updates, updatedAt: new Date().toISOString() }
            : r,
        ),
      );
      getDataService()
        .updateRoutine(id, updates)
        .catch((e) => logServiceError("Routines", "update", e));
    },
    [],
  );

  const deleteRoutine = useCallback((id: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    setLogs((prev) => prev.filter((l) => l.routineId !== id));
    getDataService()
      .deleteRoutine(id)
      .catch((e) => logServiceError("Routines", "delete", e));
  }, []);

  const toggleLog = useCallback(
    (routineId: string, date: string) => {
      // Optimistic update
      const existing = logsByRoutineId.get(routineId)?.has(date);
      if (existing) {
        setLogs((prev) =>
          prev.filter((l) => !(l.routineId === routineId && l.date === date)),
        );
      } else {
        const newLog: RoutineLog = {
          id: -1, // temporary
          routineId,
          date,
          completed: true,
          createdAt: new Date().toISOString(),
        };
        setLogs((prev) => [...prev, newLog]);
      }
      getDataService()
        .toggleRoutineLog(routineId, date)
        .catch((e) => logServiceError("Routines", "toggleLog", e));
    },
    [logsByRoutineId],
  );

  const getStatsForRoutine = useCallback(
    (routine: RoutineNode): RoutineStats => {
      const dateSet = logsByRoutineId.get(routine.id) ?? new Set<string>();

      // Last 7 days
      const last7Days: RoutineStats["last7Days"] = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = formatDateKey(d);
        const applicable = isDayApplicable(routine, d);
        last7Days.push({ date: key, completed: dateSet.has(key), applicable });
      }

      // Current streak
      let currentStreak = 0;
      const checkDate = new Date(today);
      // If today is not applicable, start from yesterday
      if (!isDayApplicable(routine, checkDate)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      while (true) {
        if (!isDayApplicable(routine, checkDate)) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        const key = formatDateKey(checkDate);
        if (dateSet.has(key)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
        if (currentStreak > 365) break; // safety
      }

      // Monthly summaries (last 3 months)
      const monthlySummaries: RoutineStats["monthlySummaries"] = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const daysInMonth = new Date(
          d.getFullYear(),
          d.getMonth() + 1,
          0,
        ).getDate();
        let completed = 0;
        let total = 0;
        for (let day = 1; day <= daysInMonth; day++) {
          const dd = new Date(d.getFullYear(), d.getMonth(), day);
          if (dd > today) break;
          if (!isDayApplicable(routine, dd)) continue;
          total++;
          if (dateSet.has(formatDateKey(dd))) completed++;
        }
        monthlySummaries.push({ month: monthKey, completed, total });
      }

      return { currentStreak, last7Days, monthlySummaries };
    },
    [logsByRoutineId],
  );

  const getRoutineCompletionForDate = useCallback(
    (date: string): { completed: number; total: number } => {
      let completed = 0;
      let total = 0;
      const d = new Date(date + "T00:00:00");
      for (const routine of routines) {
        if (!isDayApplicable(routine, d)) continue;
        total++;
        if (logsByRoutineId.get(routine.id)?.has(date)) completed++;
      }
      return { completed, total };
    },
    [routines, logsByRoutineId],
  );

  return useMemo(
    () => ({
      routines,
      logs,
      isLoading,
      createRoutine,
      updateRoutine,
      deleteRoutine,
      toggleLog,
      getStatsForRoutine,
      getRoutineCompletionForDate,
    }),
    [
      routines,
      logs,
      isLoading,
      createRoutine,
      updateRoutine,
      deleteRoutine,
      toggleLog,
      getStatsForRoutine,
      getRoutineCompletionForDate,
    ],
  );
}
