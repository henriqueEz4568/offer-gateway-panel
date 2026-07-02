import type { AnchorHTMLAttributes, HTMLAttributes } from "react";

type PaginationLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  isActive?: boolean;
};

export function Pagination({
  className = "",
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <nav
      aria-label="pagination"
      className={`mx-auto flex w-full justify-center ${className}`}
      {...props}
    />
  );
}

export function PaginationContent({
  className = "",
  ...props
}: HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={`flex flex-row items-center gap-1 ${className}`} {...props} />
  );
}

export function PaginationItem({
  className = "",
  ...props
}: HTMLAttributes<HTMLLIElement>) {
  return <li className={className} {...props} />;
}

export function PaginationLink({
  className = "",
  isActive = false,
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      className={`inline-flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors ${
        isActive
          ? "border border-zinc-300 bg-white text-zinc-950"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
      } ${className}`}
      {...props}
    />
  );
}

export function PaginationPrevious({
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <PaginationLink className={`gap-1 ${className}`} {...props}>
      Anterior
    </PaginationLink>
  );
}

export function PaginationNext({
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <PaginationLink className={`gap-1 ${className}`} {...props}>
      Proxima
    </PaginationLink>
  );
}

export function PaginationEllipsis({
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden
      className={`flex h-10 w-10 items-center justify-center text-sm text-zinc-500 ${className}`}
      {...props}
    >
      ...
    </span>
  );
}
