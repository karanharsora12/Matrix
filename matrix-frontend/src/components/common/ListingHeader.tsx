import { useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronRight,
  SlidersHorizontal,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface FilterChip {
  label: string;
  value: string;
  active?: boolean;
  onClick: () => void;
}

export interface StatItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

export interface ListingHeaderProps {
  title: string;
  subtitle?: string;
  stats?: StatItem[];
  searchProps?: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
  };
  onAdd?: () => void;
  addText?: string;
  onRefresh?: () => void;
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  onPrint?: () => void;
  onImport?: () => void;
  extraButtons?: React.ReactNode;
}

export const ListingHeader: React.FC<ListingHeaderProps> = ({
  title,
  subtitle,
  stats,
  searchProps,
  onAdd,
  addText = "Add New",
  onRefresh,
  onExportExcel,
  onExportPdf,
  onPrint,
  onImport,
  extraButtons,
}) => {
  return (
    <div className="shrink-0 space-y-4">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0 pr-4">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {searchProps && (
            <div
              className={cn("relative transition-all duration-200 w-[200px]")}
            >
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder={searchProps.placeholder || "Search..."}
                value={searchProps.value}
                onChange={searchProps.onChange}
                className="pl-8 pr-8 h-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              />
              {searchProps.value && (
                <button
                  onClick={() =>
                    searchProps.onChange({
                      target: { value: "" },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {extraButtons && (
            <div className="flex items-center gap-1.5">{extraButtons}</div>
          )}

          {/* Separator between filters/search and standard actions */}
          {(searchProps || extraButtons) && (
            <Separator
              orientation="vertical"
              className="h-5 mx-1 hidden sm:block"
            />
          )}
          {onExportExcel && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onExportExcel}
                  className="h-9 w-9 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export to Excel</TooltipContent>
            </Tooltip>
          )}
          {onExportPdf && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onExportPdf}
                  className="h-9 w-9 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export to PDF</TooltipContent>
            </Tooltip>
          )}
          {onPrint && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPrint}
                  className="h-9 w-9 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print</TooltipContent>
            </Tooltip>
          )}
          {onImport && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onImport}
                  className="h-9 w-9 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Import Data</TooltipContent>
            </Tooltip>
          )}
          {onRefresh && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRefresh}
                  className="h-9 w-9 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh data</TooltipContent>
            </Tooltip>
          )}
          {onAdd && (
            <Button
              onClick={onAdd}
              className="h-9 gap-1.5 font-semibold shadow-sm"
            >
              <Plus className="h-4 w-4" />
              {addText}
            </Button>
          )}
        </div>
      </div>

      {stats && stats.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm"
            >
              {stat.icon && (
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-md",
                    stat.color || "bg-zinc-100 dark:bg-zinc-800",
                  )}
                >
                  {stat.icon}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
