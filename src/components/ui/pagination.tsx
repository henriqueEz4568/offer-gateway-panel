import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

export function Pagination({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      aria-label="Paginação"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

export function PaginationContent({ className, ...props }: ComponentProps<"ul">) {
  return <ul className={cn("flex flex-row items-center gap-1", className)} {...props} />;
}

export function PaginationItem(props: ComponentProps<"li">) {
  return <li {...props} />;
}

type PaginationButtonProps = ComponentProps<"button"> & { isActive?: boolean };

export function PaginationButton({
  className,
  isActive = false,
  ...props
}: PaginationButtonProps) {
  return (
    <button
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({ variant: isActive ? "outline" : "ghost", size: "sm" }),
        "min-w-9",
        className,
      )}
      type="button"
      {...props}
    />
  );
}

export function PaginationPrevious(props: PaginationButtonProps) {
  return (
    <PaginationButton aria-label="Página anterior" {...props}>
      <ChevronLeft aria-hidden />
      <span className="hidden sm:inline">Anterior</span>
    </PaginationButton>
  );
}

export function PaginationNext(props: PaginationButtonProps) {
  return (
    <PaginationButton aria-label="Próxima página" {...props}>
      <span className="hidden sm:inline">Próxima</span>
      <ChevronRight aria-hidden />
    </PaginationButton>
  );
}
