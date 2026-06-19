import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

type FieldProps = {
  label: string;
  error?: string | null;
};

export function Input({
  label,
  error,
  className = "",
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
      {label}
      <input
        className={`h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-950 ${className}`}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function Select({
  label,
  error,
  className = "",
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
      {label}
      <select
        className={`h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-950 ${className}`}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
