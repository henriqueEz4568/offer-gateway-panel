"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

export function Pagination({ className, ...props }: ComponentProps<"nav">) {
  const { t } = useI18n();

  return (
    <nav
      aria-label={t.common.pagination}
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
  const { t } = useI18n();

  return (
    <PaginationButton aria-label={t.common.previousPage} {...props}>
      <ChevronLeft aria-hidden />
      <span className="hidden sm:inline">{t.common.previous}</span>
    </PaginationButton>
  );
}

export function PaginationNext(props: PaginationButtonProps) {
  const { t } = useI18n();

  return (
    <PaginationButton aria-label={t.common.nextPage} {...props}>
      <span className="hidden sm:inline">{t.common.next}</span>
      <ChevronRight aria-hidden />
    </PaginationButton>
  );
}
