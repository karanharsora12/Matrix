import React from "react";
import { cn } from "@/lib/utils";

export interface ListingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col flex-1 p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 w-full overflow-hidden",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
