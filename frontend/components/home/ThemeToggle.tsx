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
        className="p-3 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-primary/20 hover:scale-110 transition-all duration-300 group"
        aria-label="Toggle Theme"
      >
        {resolvedTheme === "dark" ? (
          <Sun className="w-5 h-5 text-amber-300 group-hover:rotate-180 transition-transform duration-700 ease-in-out" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-500 group-hover:-rotate-12 transition-transform duration-500 ease-in-out" />
        )}
      </button>
    </nav>
  );
}
