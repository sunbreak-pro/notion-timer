import type { RoutineNode } from "../../types/routine";
import type { RoutineContextValue } from "../../context/RoutineContext";
import { RoutineItem } from "./RoutineItem";

interface RoutineListProps {
  routines: RoutineNode[];
  routineContext: RoutineContextValue;
  todayKey: string;
  onEdit: (routine: RoutineNode) => void;
}

function isDayApplicable(routine: RoutineNode, date: Date): boolean {
  if (routine.frequencyType === "daily") return true;
  return routine.frequencyDays.includes(date.getDay());
}

export function RoutineList({
  routines,
  routineContext,
  todayKey,
  onEdit,
}: RoutineListProps) {
  const today = new Date(todayKey + "T00:00:00");

  return (
    <div>
      {routines.map((routine) => {
        const stats = routineContext.getStatsForRoutine(routine);
        const logSet = routineContext.logs
          .filter((l) => l.routineId === routine.id)
          .map((l) => l.date);
        const todayCompleted = logSet.includes(todayKey);
        const todayApplicable = isDayApplicable(routine, today);

        return (
          <RoutineItem
            key={routine.id}
            routine={routine}
            stats={stats}
            todayCompleted={todayCompleted}
            todayApplicable={todayApplicable}
            onToggleToday={() => routineContext.toggleLog(routine.id, todayKey)}
            onEdit={() => onEdit(routine)}
            onDelete={() => routineContext.deleteRoutine(routine.id)}
          />
        );
      })}
    </div>
  );
}
