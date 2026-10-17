"use client";

import { Check, ChevronDown } from "lucide-react";
import { Label as LabelPrimitive, Select as SelectPrimitive } from "radix-ui";
import { useId, type ComponentProps, type ReactNode } from "react";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  error?: string | null;
  hint?: string;
  containerClassName?: string;
};

const controlClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/25";

function Field({
  children,
  className,
  error,
  errorId,
  hint,
  hintId,
  id,
  label,
}: {
  children: ReactNode;
  className?: string;
  error?: string | null;
  errorId: string;
  hint?: string;
  hintId: string;
  id: string;
  label: string;
}) {
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <LabelPrimitive.Root className="text-sm font-medium" htmlFor={id}>
        {label}
      </LabelPrimitive.Root>
      {children}
      {hint && !error ? (
        <p className="text-xs text-muted-foreground" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs font-medium text-destructive" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function useFieldIds(error?: string | null, hint?: string) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return { id, errorId, hintId, describedBy };
}

export function Input({
  className,
  containerClassName,
  endAdornment,
  error,
  hint,
  id: idProp,
  label,
  ...props
}: FieldProps &
  ComponentProps<"input"> & { endAdornment?: ReactNode }) {
  const ids = useFieldIds(error, hint);
  const id = idProp ?? ids.id;

  return (
    <Field
      className={containerClassName}
      error={error}
      errorId={ids.errorId}
      hint={hint}
      hintId={ids.hintId}
      id={id}
      label={label}
    >
      <div className="relative">
        <input
          aria-describedby={ids.describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(controlClassName, endAdornment && "pr-10", className)}
          id={id}
          {...props}
        />
        {endAdornment ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">
            {endAdornment}
          </div>
        ) : null}
      </div>
    </Field>
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
  className,
  containerClassName,
  disabled = false,
  error,
  hint,
  label,
  onValueChange,
  options,
  placeholder,
  value,
}: SelectProps) {
  const { t } = useI18n();
  const { id, errorId, hintId, describedBy } = useFieldIds(error, hint);

  return (
    <Field
      className={containerClassName}
      error={error}
      errorId={errorId}
      hint={hint}
      hintId={hintId}
      id={id}
      label={label}
    >
      <SelectPrimitive.Root
        disabled={disabled}
        onValueChange={onValueChange}
        value={value}
      >
        <SelectPrimitive.Trigger
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(
            controlClassName,
            "inline-flex items-center justify-between gap-2 text-left data-placeholder:text-muted-foreground",
            className,
          )}
          id={id}
        >
          <span className="truncate">
            <SelectPrimitive.Value placeholder={placeholder ?? t.common.select} />
          </span>
          <SelectPrimitive.Icon asChild>
            <ChevronDown aria-hidden className="size-4 shrink-0 opacity-60" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  className="relative flex h-9 cursor-pointer select-none items-center rounded-sm pl-8 pr-3 text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                  key={option.value}
                  value={option.value}
                >
                  <span className="absolute left-2 flex size-4 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check aria-hidden className="size-4" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </Field>
  );
}
