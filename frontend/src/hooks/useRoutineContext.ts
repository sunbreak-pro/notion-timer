import { useContext } from "react";
import { RoutineContext } from "../context/RoutineContext";

export function useRoutineContext() {
  const context = useContext(RoutineContext);
  if (!context) {
    throw new Error("useRoutineContext must be used within a RoutineProvider");
  }
  return context;
}
