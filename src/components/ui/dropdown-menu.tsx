import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({
  align = "end",
  className,
  sideOffset = 4,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        className={cn(
          "z-50 min-w-40 overflow-hidden rounded-md border border-zinc-200 bg-white p-1 shadow-lg",
          className,
        )}
        sideOffset={sideOffset}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex h-9 cursor-pointer select-none items-center gap-2 rounded-sm px-3 text-sm text-zinc-800 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-zinc-100 data-[highlighted]:text-zinc-950",
        className,
      )}
      {...props}
    />
  );
}
