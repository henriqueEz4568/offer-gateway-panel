"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/components/theme/theme-provider";

export function Toaster() {
  const { resolvedMode } = useTheme();

  return (
    <Sonner
      closeButton
      position="top-right"
      richColors={false}
      theme={resolvedMode ?? "system"}
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg! border! border-border! bg-popover! text-popover-foreground! shadow-lg!",
          description: "text-muted-foreground!",
          success: "[&_[data-icon]]:text-success!",
          error: "[&_[data-icon]]:text-destructive!",
          info: "[&_[data-icon]]:text-info!",
          warning: "[&_[data-icon]]:text-warning!",
          closeButton: "border-border! bg-popover! text-muted-foreground!",
        },
      }}
    />
  );
}

export { toast } from "sonner";
