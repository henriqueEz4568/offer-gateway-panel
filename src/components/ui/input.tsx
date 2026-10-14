import { Label as LabelPrimitive, Select as SelectPrimitive } from "radix-ui";
import type { InputHTMLAttributes } from "react";

type FieldProps = {
  label: string;
  error?: string | null;
  labelClassName?: string;
};

export function Input({
  label,
  error,
  className = "",
  labelClassName = "",
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="grid gap-1.5">
      <LabelPrimitive.Root
        className={`${labelClassName ? labelClassName : "text-sm font-medium text-zinc-800"}`}
      >
        {label}
      </LabelPrimitive.Root>
      <input
        className={`h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-950 ${className}`}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = FieldProps & {
  className?: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  value: string;
};

export function Select({
  label,
  error,
  className = "",
  disabled = false,
  onValueChange,
  options,
  placeholder = "Selecione",
  value,
}: SelectProps) {
  return (
    <div className="grid gap-1.5">
      <LabelPrimitive.Root className="text-sm font-medium text-zinc-800">
        {label}
      </LabelPrimitive.Root>
      <SelectPrimitive.Root
        disabled={disabled}
        onValueChange={onValueChange}
        value={value}
      >
        <SelectPrimitive.Trigger
          className={`inline-flex h-10 items-center justify-between gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-950 disabled:cursor-not-allowed disabled:text-zinc-400 ${className}`}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon className="text-zinc-500">
            v
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="z-50 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  className="relative flex h-9 cursor-pointer select-none items-center rounded-sm px-3 text-sm text-zinc-800 outline-none data-[highlighted]:bg-zinc-100 data-[highlighted]:text-zinc-950"
                  key={option.value}
                  value={option.value}
                >
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
