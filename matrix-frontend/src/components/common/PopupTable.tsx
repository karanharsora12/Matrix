import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { X, Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/client";
import { DataGrid } from "@/components/common/DataGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  RowDoubleClickedEvent,
} from "ag-grid-community";

export interface PopupTableProps<T = any> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: string;
  apiEndpoint?: string;
  apiPayload?: Record<string, any>;
  tableData?: T[];
  columns?: ColDef[];
  onSelect: (item: T) => void;
  searchPlaceholder?: string;
  className?: string;
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  width?: number;
  height?: number;
  value?: string | number;
  selectedValue?: string | number;
  displayValue?: React.ReactNode;
}

export function PopupTable<T extends Record<string, any>>({
  open,
  onOpenChange,
  trigger,
  apiEndpoint,
  apiPayload,
  tableData,
  columns,
  onSelect,
  searchPlaceholder = "Search...",
  className,
  placement = "bottom-start",
  width,
  height,
  value,
  selectedValue,
  displayValue,
}: PopupTableProps<T>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen;

  const initialValue = useMemo(() => {
    const val = selectedValue ?? value;
    if (val !== undefined && val !== null && val !== "") {
      return String(val).trim();
    }
    return "";
  }, [selectedValue, value]);

  const [searchText, setSearchText] = useState(initialValue);
  const gridApiRef = useRef<GridApi | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const { data: fetchedData, isLoading } = useQuery({
    queryKey: ["popupTable", apiEndpoint, apiPayload],
    queryFn: async () => {
      if (!apiEndpoint) return [];
      const res = await apiClient.post(apiEndpoint, apiPayload || {});
      if (Array.isArray(res.data?.data)) return res.data.data;
      if (Array.isArray(res.data)) return res.data;
      return [];
    },
    enabled: !!apiEndpoint,
  });

  const rowData = useMemo(() => {
    if (Array.isArray(tableData) && tableData.length > 0) return tableData;
    if (fetchedData && Array.isArray(fetchedData)) return fetchedData;
    return [];
  }, [tableData, fetchedData]);

  const updatePosition = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const initialWidth = width || 720;
    const initialHeight = height || 360;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const popupWidth = Math.min(initialWidth, vw - 24);
    const popupHeight = Math.min(initialHeight, vh - 24);

    // Vertical positioning
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    let top = rect.bottom + 4;

    if (
      placement.startsWith("top") ||
      (spaceBelow < popupHeight + 10 && spaceAbove > spaceBelow)
    ) {
      top = Math.max(10, rect.top - popupHeight - 4);
    } else {
      top = Math.min(vh - popupHeight - 10, rect.bottom + 4);
    }

    // Horizontal positioning
    let left = rect.left;
    if (placement.endsWith("end")) {
      left = rect.right - popupWidth;
    }
    if (left + popupWidth > vw - 16) {
      left = vw - popupWidth - 16;
    }
    if (left < 16) {
      left = 16;
    }

    setCoords((prev) => {
      const currentWidth = panelRef.current
        ? panelRef.current.offsetWidth
        : prev?.width || popupWidth;
      const currentHeight = panelRef.current
        ? panelRef.current.offsetHeight
        : prev?.height || popupHeight;

      return {
        top: Math.round(top),
        left: Math.round(left),
        width: currentWidth,
        height: currentHeight,
      };
    });
  }, [width, height, placement]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setCoords(null);
      setSearchText("");
      return;
    }

    setSearchText(initialValue);
    updatePosition();
  }, [isOpen, initialValue, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const ro = new ResizeObserver(() => {
      if (gridApiRef.current) {
        gridApiRef.current.sizeColumnsToFit();
      }
    });
    ro.observe(panelRef.current);
    return () => ro.disconnect();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  const selectMatchingOrFirstRow = useCallback(
    (api: GridApi, targetText?: string) => {
      if (!api || api.getDisplayedRowCount() === 0) return;

      const query = (targetText ?? searchText ?? initialValue ?? "")
        .toString()
        .trim()
        .toLowerCase();

      let matchedNode: any = null;

      if (query) {
        // 1. Exact match on any field
        api.forEachNodeAfterFilterAndSort((node) => {
          if (matchedNode) return;
          const data = node.data;
          if (!data) return;
          for (const key of Object.keys(data)) {
            const cellVal = String(data[key] ?? "").trim().toLowerCase();
            if (cellVal === query) {
              matchedNode = node;
              return;
            }
          }
        });

        // 2. StartsWith or contains match
        if (!matchedNode) {
          api.forEachNodeAfterFilterAndSort((node) => {
            if (matchedNode) return;
            const data = node.data;
            if (!data) return;
            for (const key of Object.keys(data)) {
              const cellVal = String(data[key] ?? "").trim().toLowerCase();
              if (cellVal.includes(query)) {
                matchedNode = node;
                return;
              }
            }
          });
        }
      }

      const nodeToSelect = matchedNode || api.getDisplayedRowAtIndex(0);
      if (nodeToSelect) {
        nodeToSelect.setSelected(true, true);
        api.ensureNodeVisible(nodeToSelect, "middle");
      }
    },
    [initialValue, searchText],
  );

  const handleGridReady = (params: GridReadyEvent) => {
    gridApiRef.current = params.api;
    const activeSearch = (searchText || initialValue || "").toString().trim();
    if (activeSearch) {
      params.api.setGridOption("quickFilterText", activeSearch);
    }
    setTimeout(() => {
      params.api.sizeColumnsToFit();
      selectMatchingOrFirstRow(params.api, activeSearch);
    }, 50);
  };

  // Re-fit columns and select matching or first row when rowData changes
  useEffect(() => {
    if (gridApiRef.current && rowData.length > 0) {
      const activeSearch = (searchText || initialValue || "").toString().trim();
      setTimeout(() => {
        gridApiRef.current?.sizeColumnsToFit();
        selectMatchingOrFirstRow(gridApiRef.current!, activeSearch);
      }, 50);
    }
  }, [rowData, selectMatchingOrFirstRow, searchText, initialValue]);

  const handleSearchChange = (val: string) => {
    setSearchText(val);
    if (gridApiRef.current) {
      gridApiRef.current.setGridOption("quickFilterText", val);
      setTimeout(() => {
        if (gridApiRef.current) {
          selectMatchingOrFirstRow(gridApiRef.current, val);
        }
      }, 30);
    }
  };

  const handleRowDoubleClick = (event: RowDoubleClickedEvent) => {
    if (event.data) {
      onSelect(event.data as T);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const api = gridApiRef.current;
      if (!api) return;
      const count = api.getDisplayedRowCount();
      if (count === 0) return;
      const selectedNodes = api.getSelectedNodes();
      let nextIndex = 0;
      if (selectedNodes.length > 0) {
        const currentIdx = selectedNodes[0].rowIndex ?? 0;
        nextIndex = Math.min(count - 1, currentIdx + 1);
      }
      api.forEachNode((node) => node.setSelected(node.rowIndex === nextIndex));
      api.ensureIndexVisible(nextIndex);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const api = gridApiRef.current;
      if (!api) return;
      const count = api.getDisplayedRowCount();
      if (count === 0) return;
      const selectedNodes = api.getSelectedNodes();
      let prevIndex = 0;
      if (selectedNodes.length > 0) {
        const currentIdx = selectedNodes[0].rowIndex ?? 0;
        prevIndex = Math.max(0, currentIdx - 1);
      }
      api.forEachNode((node) => node.setSelected(node.rowIndex === prevIndex));
      api.ensureIndexVisible(prevIndex);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      const api = gridApiRef.current;
      if (api) {
        const selectedNodes = api.getSelectedNodes();
        if (selectedNodes.length > 0 && selectedNodes[0]?.data) {
          onSelect(selectedNodes[0].data as T);
          setIsOpen(false);
          return;
        }
        const firstNode = api.getDisplayedRowAtIndex(0);
        if (firstNode && firstNode.data) {
          onSelect(firstNode.data as T);
          setIsOpen(false);
          return;
        }
      }
    }
  };

  const panelContent = coords ? (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`,
        height: `${coords.height}px`,
        minWidth: "360px",
        maxWidth: "96vw",
        minHeight: "220px",
        maxHeight: "90vh",
        resize: "both",
        overflow: "hidden",
        zIndex: 99999,
      }}
      className={cn(
        "flex flex-col bg-popover text-popover-foreground rounded-lg border select-none animate-in fade-in-0 zoom-in-95 duration-100",
        className,
      )}
      onKeyDown={handleKeyDown}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            {isLoading ? (
              <Loader2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : (
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            )}
            <Input
              ref={searchInputRef}
              type="text"
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-7 pl-8 pr-7 text-xs shadow-none border-border"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 text-muted-foreground">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            title="Close (Esc)"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>

      {/* DataGrid Container */}
      <div className="w-full no-radius bg-background flex-1 flex flex-col min-h-0 relative">
        <DataGrid
          rowData={rowData}
          columnDefs={columns || []}
          onGridReady={handleGridReady}
          className="no-radius"
          gridOptions={{
            onRowDoubleClicked: handleRowDoubleClick,
            rowSelection: "single",
            animateRows: false,
            pagination: false,
          }}
        />
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Anchor Element */}
      {trigger ? (
        <div
          ref={anchorRef}
          onClick={() => setIsOpen(!isOpen)}
          className="cursor-pointer inline-flex items-center w-full h-full"
        >
          {trigger}
        </div>
      ) : (
        <div
          ref={anchorRef}
          className="w-full h-full flex items-center px-3 text-xs text-foreground font-normal truncate select-none pointer-events-none"
        >
          {displayValue ??
            (typeof value === "string" || typeof value === "number"
              ? value
              : selectedValue ?? null)}
        </div>
      )}

      {/* Floating Dropdown Table Panel Portaled to Document Body with Fixed Positioning */}
      {isOpen &&
        coords &&
        panelContent &&
        createPortal(panelContent, document.body)}
    </>
  );
}

export default PopupTable;
