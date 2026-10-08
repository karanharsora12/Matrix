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
  addText = "Add",
  onRefresh,
  onExportExcel,
  onExportPdf,
  onPrint,
  onImport,
  extraButtons,
}) => {
  return (
    <div className="shrink-0 mb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="min-w-0 pr-4">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {searchProps && (
          <div
            className={cn(
              "relative transition-all duration-200 w-[240px] mr-1",
            )}
          >
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <Input
              placeholder={searchProps.placeholder || "Search here..."}
              value={searchProps.value}
              onChange={searchProps.onChange}
              className="pl-8 pr-8 h-8 bg-white dark:bg-zinc-900 shadow-sm border-zinc-200 dark:border-zinc-800 rounded-md text-xs focus-visible:ring-1 focus-visible:ring-zinc-300"
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
          <div className="flex items-center gap-2">{extraButtons}</div>
        )}

        {onAdd && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onAdd}
                variant="default"
                size="icon"
                className="h-8 w-8 rounded shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{addText}</TooltipContent>
          </Tooltip>
        )}

        {onExportPdf && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded shadow-sm"
                onClick={onExportPdf}
              >
                <FileText className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export to PDF</TooltipContent>
          </Tooltip>
        )}

        {onExportExcel && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded shadow-sm"
                onClick={onExportExcel}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export to Excel</TooltipContent>
          </Tooltip>
        )}

        {onPrint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded shadow-sm"
                onClick={onPrint}
              >
                <Printer className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Print</TooltipContent>
          </Tooltip>
        )}

        {onRefresh && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded shadow-sm"
                onClick={onRefresh}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh data</TooltipContent>
          </Tooltip>
        )}

        {onImport && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded shadow-sm"
                onClick={onImport}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Import Data</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
