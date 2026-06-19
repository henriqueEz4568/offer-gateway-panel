import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-zinc-950 text-white hover:bg-zinc-800 disabled:bg-zinc-400",
  secondary:
    "border border-zinc-300 bg-white text-zinc-950 hover:bg-zinc-100 disabled:text-zinc-400",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
  ghost: "text-zinc-700 hover:bg-zinc-100 disabled:text-zinc-400",
};

export function Button({
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      type={type}
      {...props}
    />
  );
}
