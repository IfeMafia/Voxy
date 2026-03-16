"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 h-9 w-9 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="w-4 h-4" />
      </button>
    );
  }

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  const getIcon = () => {
    if (theme === "system") return <Monitor className="w-4 h-4 text-zinc-500" />;
    if (theme === "light") return <Sun className="w-4 h-4 text-amber-500" />;
    return <Moon className="w-4 h-4 text-blue-400" />;
  };

  const getLabel = () => {
    if (theme === "system") return "System Theme";
    if (theme === "light") return "Light Theme";
    return "Dark Theme";
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 h-9 w-9 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all group relative"
      title={getLabel()}
    >
      <div className="transition-transform duration-300 group-active:scale-90">
        {getIcon()}
      </div>
      
      {/* Tooltip hint on hover (optional) */}
      <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/5 font-medium">
        {getLabel()}
      </span>
    </button>
  );
}
