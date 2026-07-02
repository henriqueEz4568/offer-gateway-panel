import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { Button } from "./button";

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
  return (
    <DialogPrimitive.Root onOpenChange={onOpenChange} open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-zinc-950/60" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-white p-5 shadow-xl outline-none">
          <div className="grid gap-2">
            <DialogPrimitive.Title className="text-lg font-semibold text-zinc-950">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="text-sm text-zinc-600">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          {children ? <div className="mt-5">{children}</div> : null}
          {footer ? <div className="mt-5 flex justify-end gap-2">{footer}</div> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

type ConfirmationModalProps = {
  confirmLabel?: string;
  description: ReactNode;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
};

export function ConfirmationModal({
  confirmLabel = "Confirmar",
  description,
  loading = false,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmationModalProps) {
  return (
    <Modal
      description={description}
      footer={
        <>
          <Button disabled={loading} onClick={onCancel} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button
            disabled={loading}
            onClick={onConfirm}
            type="button"
            variant="destructive"
          >
            {loading ? "Excluindo..." : confirmLabel}
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
