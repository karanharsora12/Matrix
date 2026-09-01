import React from "react";
import { createRoot } from "react-dom/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}) => {
  const Icon = {
    danger: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[variant];

  const iconColor = {
    danger: "text-red-600 bg-red-100 dark:bg-red-900/30",
    warning: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
    info: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  }[variant];

  const buttonVariant = {
    danger: "destructive" as const,
    warning: "default" as const,
    info: "default" as const,
  }[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className={cn("p-4 rounded-full", iconColor)}>
              <Icon className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <DialogDescription className="text-base text-zinc-500 dark:text-zinc-400">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="flex sm:justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto min-w-[100px]"
          >
            {cancelText}
          </Button>
          <Button
            variant={buttonVariant}
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto min-w-[100px]"
          >
            {isLoading ? "Please wait..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export type ConfirmOptions = Omit<
  AlertModalProps,
  "open" | "onOpenChange" | "onConfirm"
>;

/**
 * Imperative API for the AlertModal, similar to SweetAlert (Swal).
 * Returns a Promise that resolves to true if confirmed, false if cancelled.
 */
export const confirmAlert = (options: ConfirmOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    let isOpen = true;

    const cleanup = () => {
      setTimeout(() => {
        root.unmount();
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 300);
    };

    const handleConfirm = () => {
      isOpen = false;
      resolve(true);
      render();
      cleanup();
    };

    const handleCancel = (open: boolean) => {
      if (!open) {
        isOpen = false;
        resolve(false);
        render();
        cleanup();
      }
    };

    const render = () => {
      root.render(
        <AlertModal
          {...options}
          open={isOpen}
          onOpenChange={handleCancel}
          onConfirm={handleConfirm}
        />,
      );
    };

    render();
  });
};
