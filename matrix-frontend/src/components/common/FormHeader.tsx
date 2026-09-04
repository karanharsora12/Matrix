import React from "react";
import { cn } from "@/lib/utils";

interface FormHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export const FormHeader: React.FC<FormHeaderProps> = ({
  title,
  subtitle,
  icon,
  className,
  actions,
}) => {
  return (
    <div
      className={cn(
        "border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};
