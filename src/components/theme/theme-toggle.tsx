"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";
import type { ThemeModePreference } from "./theme-mode";

const options: { value: ThemeModePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useTheme();

  return (
    <div
      aria-label="Tema"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5",
        className,
      )}
      role="radiogroup"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const checked = mode === value;

        return (
          <button
            aria-checked={checked}
            aria-label={label}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
              checked && "bg-accent text-foreground",
            )}
            key={value}
            onClick={() => setMode(value)}
            role="radio"
            title={label}
            type="button"
          >
            <Icon aria-hidden className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
