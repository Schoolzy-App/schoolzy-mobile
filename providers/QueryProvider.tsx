import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import React, { useEffect, useRef } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";

import { ApiError } from "@/types/api";

/**
 * Shared client. Exported so imperative call sites (e.g. `AuthContext` on
 * logout) can clear the cache without going through a hook.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        // Never retry auth or client errors — only transient failures.
        if (error instanceof ApiError) {
          if (error.status === 401 || error.status === 403) return false;
          if (error.status >= 400 && error.status < 500) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
});

/**
 * react-query's focus tracking is web-oriented; on native it has to be driven
 * from AppState so queries refetch when the app returns to the foreground.
 * This complements `useUpdateCheck`, which handles OTA updates on the same event.
 */
function useAppStateFocus() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (next: AppStateStatus) => {
        if (Platform.OS !== "web") {
          focusManager.setFocused(next === "active");
        }
        appState.current = next;
      },
    );
    return () => subscription.remove();
  }, []);
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  useAppStateFocus();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
