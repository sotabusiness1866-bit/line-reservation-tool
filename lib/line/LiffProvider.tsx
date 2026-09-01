"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { initLiff, liff } from "@/lib/line/liff";

interface LiffState {
  status: "loading" | "ready" | "error";
  userId: string | null;
  displayName: string | null;
  errorMessage: string | null;
}

const LiffContext = createContext<LiffState>({
  status: "loading",
  userId: null,
  displayName: null,
  errorMessage: null,
});

export function LiffProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LiffState>({
    status: "loading",
    userId: null,
    displayName: null,
    errorMessage: null,
  });

  useEffect(() => {
    let cancelled = false;

    initLiff()
      .then(async () => {
        const profile = await liff.getProfile();
        if (cancelled) return;
        setState({
          status: "ready",
          userId: profile.userId,
          displayName: profile.displayName,
          errorMessage: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[LiffProvider] LIFF初期化に失敗しました:", err);
        setState({
          status: "error",
          userId: null,
          displayName: null,
          errorMessage: "LINEアプリ内で開いてください。",
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <LiffContext.Provider value={state}>{children}</LiffContext.Provider>;
}

export function useLiff() {
  return useContext(LiffContext);
}
