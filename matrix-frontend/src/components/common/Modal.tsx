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
  width?: "sm" | "default" | "lg" | "xl" | "full";
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width = "default",
}) => {
  const widthClasses = {
    sm: "sm:max-w-sm",
    default: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    full: "sm:max-w-[95vw]",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${widthClasses[width]} p-0 gap-0 overflow-hidden`}>
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        <Separator />
        
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto space-y-4">
          {children}
        </div>
        
        {footer && (
          <>
            <Separator />
            <DialogFooter className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/30 flex justify-end gap-2">
              {footer}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
