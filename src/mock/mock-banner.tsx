import { cn } from "@/lib/utils";

export function MockBanner({ className }: { className?: string }) {
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
        Modo release: dados fictícios
      </div>
    </>
  );
}
