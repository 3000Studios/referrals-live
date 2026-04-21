import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

export type ViewerMode = "user" | "premium" | "admin";

const KEY = "rl_viewer_mode";

export function useViewerMode() {
  const user = useAppStore((s) => s.user);
  const isAdmin = Boolean(user?.isAdmin);
  const [mode, setMode] = useState<ViewerMode>("user");

  useEffect(() => {
    if (!isAdmin) {
      setMode("user");
      return;
    }
    const saved = (localStorage.getItem(KEY) as ViewerMode | null) ?? "user";
    setMode(saved === "admin" || saved === "premium" || saved === "user" ? saved : "user");
  }, [isAdmin]);

  const update = (next: ViewerMode) => {
    if (!isAdmin && next !== "user") return;
    setMode(next);
    if (isAdmin) localStorage.setItem(KEY, next);
  };

  const premiumView = mode === "premium" || mode === "admin" ? true : Boolean(user?.premium);
  return { mode, setMode: update, isAdmin, premiumView };
}

