import { useMemo } from "react";

export function useAuth() {
  // placeholder; integrate JWT later
  return useMemo(() => ({ isAuthenticated: false }), []);
}


