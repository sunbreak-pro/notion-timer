import { createContext } from "react";
import type { ReactNode } from "react";
import { useRoutines } from "../hooks/useRoutines";

export type RoutineContextValue = ReturnType<typeof useRoutines>;

export const RoutineContext = createContext<RoutineContextValue | null>(null);

export function RoutineProvider({ children }: { children: ReactNode }) {
  const routineState = useRoutines();
  return (
    <RoutineContext.Provider value={routineState}>
      {children}
    </RoutineContext.Provider>
  );
}
