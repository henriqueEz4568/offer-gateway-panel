import type { ComponentPropsWithoutRef } from "react";

export function Table({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"table">) {
  return (
    <table
      className={`w-full min-w-[720px] border-collapse text-left text-sm ${className}`}
      {...props}
    />
  );
}

export function TableHeader({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"thead">) {
  return (
    <thead
      className={`bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 ${className}`}
      {...props}
    />
  );
}

export function TableBody({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"tbody">) {
  return <tbody className={`divide-y divide-zinc-200 ${className}`} {...props} />;
}

export function TableRow({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"tr">) {
  return <tr className={`align-middle text-zinc-700 ${className}`} {...props} />;
}

export function TableHead({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"th">) {
  return (
    <th className={`px-4 py-3 font-semibold ${className}`} {...props} />
  );
}

export function TableCell({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"td">) {
  return <td className={`px-4 py-3 align-middle ${className}`} {...props} />;
}
