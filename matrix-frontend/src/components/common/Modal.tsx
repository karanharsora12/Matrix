import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "default" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width = "default",
  className,
}) => {
  const widthClasses = {
    sm: "sm:max-w-sm",
    default: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
    "3xl": "sm:max-w-3xl",
    "4xl": "sm:max-w-4xl",
    full: "sm:max-w-[95vw]",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${widthClasses[width]} max-h-[85vh] sm:max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden ${className || ""}`}
      >
        <DialogHeader className="px-6 py-4 shrink-0 sticky top-0 z-10 bg-background">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <Separator className="shrink-0" />

        <div className="px-6 py-5 flex-1 overflow-y-auto min-h-0 space-y-4">
          {children}
        </div>

        {footer && (
          <>
            <Separator className="shrink-0" />
            <DialogFooter className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/30 shrink-0 sticky bottom-0 z-10 flex justify-end gap-2">
              {footer}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
