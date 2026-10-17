"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { Button } from "./button";

const overlayClassName =
  "fixed inset-0 z-50 bg-overlay/60 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0";

type ModalProps = {
  children?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

export function Modal({
  children,
  description,
  footer,
  onOpenChange,
  open,
  title,
}: ModalProps) {
  const { t } = useI18n();

  return (
    <DialogPrimitive.Root onOpenChange={onOpenChange} open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlayClassName} />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-lg border border-border bg-popover p-5 text-popover-foreground shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <div className="grid gap-1.5 pr-8">
            <DialogPrimitive.Title className="text-lg font-semibold">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <DialogPrimitive.Close asChild>
            <Button
              aria-label={t.common.close}
              className="absolute right-3 top-3"
              size="icon-sm"
              variant="ghost"
            >
              <X />
            </Button>
          </DialogPrimitive.Close>
          {children ? <div className="mt-5">{children}</div> : null}
          {footer ? (
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {footer}
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

type SheetProps = {
  children: ReactNode;
  className?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

/** Side drawer used for the navigation on small screens. */
export function Sheet({ children, className, onOpenChange, open, title }: SheetProps) {
  const { t } = useI18n();

  return (
    <DialogPrimitive.Root onOpenChange={onOpenChange} open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlayClassName} />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left",
            className,
          )}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          {children}
          <DialogPrimitive.Close asChild>
            <Button
              aria-label={t.shell.closeMenu}
              className="absolute right-3 top-3"
              size="icon-sm"
              variant="ghost"
            >
              <X />
            </Button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

type ConfirmationModalProps = {
  confirmLabel?: string;
  description: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
};

export function ConfirmationModal({
  confirmLabel,
  description,
  loading = false,
  loadingLabel,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmationModalProps) {
  const { t } = useI18n();

  return (
    <Modal
      description={description}
      footer={
        <>
          <Button disabled={loading} onClick={onCancel} type="button" variant="secondary">
            {t.common.cancel}
          </Button>
          <Button
            disabled={loading}
            onClick={onConfirm}
            type="button"
            variant="destructive"
          >
            {loading ? (loadingLabel ?? t.common.deleting) : (confirmLabel ?? t.common.confirm)}
          </Button>
        </>
      }
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !loading) {
          onCancel();
        }
      }}
      open={open}
      title={title}
    />
  );
}
