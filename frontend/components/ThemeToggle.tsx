"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <nav className="absolute top-6 right-6 z-50 flex items-center gap-4">
      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="p-3 rounded-full bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-700/50 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 group"
        aria-label="Toggle Theme"
      >
        {resolvedTheme === "dark" ? (
          <Sun className="w-5 h-5 text-amber-300 group-hover:rotate-90 transition-transform duration-500" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" />
        )}
      </button>
    </nav>
  );
}
