"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  iconOnly?: boolean;
  className?: string;
}

export function ThemeToggle({ iconOnly = false, className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className={cn(iconOnly ? "w-9 px-0" : "", className)}>
        {iconOnly ? <Moon className="h-4 w-4" /> : "Theme"}
      </Button>
    );
  }

  const dark = theme !== "light";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(iconOnly ? "w-9 px-0" : "gap-2", className)}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {iconOnly ? null : dark ? "Light" : "Dark"}
    </Button>
  );
}
