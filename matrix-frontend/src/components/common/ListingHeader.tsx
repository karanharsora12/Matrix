import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Plus,
  Printer,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

export interface FilterChip {
  label: string;
  value: string;
  active?: boolean;
  onClick: () => void;
}

export interface ListingHeaderProps {
  title: string;
  subtitle?: string;
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
                className="pl-8 pr-8 h-9 bg-white dark:bg-zinc-900 shadow-none"
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

          {onAdd && (
            <Button
              onClick={onAdd}
              variant="default"
              size="sm"
              className="gap-1.5 font-semibold shadow-sm"
            >
              <Plus className="h-4 w-4" />
              {addText}
            </Button>
          )}

          {onExportExcel && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onExportExcel}>
                  <FileSpreadsheet className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export to Excel</TooltipContent>
            </Tooltip>
          )}
          {onExportPdf && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onExportPdf}>
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export to PDF</TooltipContent>
            </Tooltip>
          )}
          {onPrint && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onPrint}>
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print</TooltipContent>
            </Tooltip>
          )}
          {onImport && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onImport}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Import Data</TooltipContent>
            </Tooltip>
          )}
          {onRefresh && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh data</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};
