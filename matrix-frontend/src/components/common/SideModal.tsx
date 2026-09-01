import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export interface SideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "default" | "lg" | "xl" | "full";
}

export const SideModal: React.FC<SideModalProps> = ({
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
    full: "w-screen sm:max-w-full",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={`${widthClasses[width]} p-0 gap-0 overflow-hidden flex flex-col`}>
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        
        <Separator />
        
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {children}
        </div>
        
        {footer && (
          <>
            <Separator />
            <SheetFooter className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/30 sm:justify-end flex gap-2">
              {footer}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
