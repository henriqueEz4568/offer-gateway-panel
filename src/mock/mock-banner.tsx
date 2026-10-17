"use client";

import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export function MockBanner({ className }: { className?: string }) {
  const { t } = useI18n();

  return (
    <>
      {/* Espaço para a faixa fixa não cobrir o fim da página. */}
      <div aria-hidden className="h-7" />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 bg-warning px-4 py-1 text-center text-sm font-medium text-warning-foreground",
          className,
        )}
        role="status"
      >
        {t.mock.banner}
      </div>
    </>
  );
}
