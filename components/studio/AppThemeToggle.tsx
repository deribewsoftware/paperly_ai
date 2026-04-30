"use client";

import { FiMoon, FiSun } from "react-icons/fi";

type AppThemeToggleProps = {
  theme: "light" | "dark";
  onToggle: () => void;
};

export function AppThemeToggle({ theme, onToggle }: AppThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      aria-label="Toggle app theme"
    >
      {theme === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
