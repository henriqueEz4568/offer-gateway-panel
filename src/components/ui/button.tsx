import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-zinc-950 text-white hover:bg-zinc-800",
        primary: "bg-zinc-950 text-white hover:bg-zinc-800",
        secondary:
          "border border-zinc-300 bg-white text-zinc-950 hover:bg-zinc-100",
        outline:
          "border border-zinc-300 bg-white text-zinc-950 hover:bg-zinc-100",
        ghost: "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        danger: "bg-red-600 text-white hover:bg-red-700",
        link: "h-auto p-0 text-zinc-950 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-4 py-2",
        sm: "h-9 gap-1.5 px-3",
        lg: "h-11 gap-2 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  asChild = false,
  className,
  size,
  variant,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      data-slot="button"
      {...props}
    />
  );
}

export { Button, buttonVariants };
