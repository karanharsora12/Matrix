import React, { useEffect, useState, useMemo } from "react";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { parseNumber } from "@/lib/utils";
import { toISODate } from "@/utils/date";
import {
  Search,
  FileText,
  Clock,
  User,
  CheckCircle2,
  Wrench,
  Loader2,
  AlertCircle,
  Layers,
} from "lucide-react";

export interface DaybookReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  daybookGroupId?: number | string;
  daybookGroupShortName?: string;
  daybookId?: number | string;
  daybookShortName?: string;
  accountId?: number;
  title?: string;
  onSelectVoucher: (voucher: any, selectedItems: any[]) => void;
}

export const DaybookReferenceModal: React.FC<DaybookReferenceModalProps> = ({
  isOpen,
  onClose,
  daybookGroupId,
  daybookGroupShortName,
  daybookId,
  daybookShortName,
  accountId,
  title = "Select Reference Voucher",
  onSelectVoucher,
}) => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"pending" | "all">("pending");
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Record<string | number, boolean>>({});

  // Fetch reference vouchers for the given Day Book Group
  const fetchReferences = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post(API_ENDPOINTS.DAYBOOKS.REFERENCES, {
        daybookGroupId,
        daybookGroupShortName,
        daybookId,
        daybookShortName,
        accountId,
        search: search.trim() || undefined,
        status: statusFilter,
      });

      const list = response.data?.data || response.data || [];
      const arrayList = Array.isArray(list) ? list : [];
      setVouchers(arrayList);

      if (arrayList.length > 0) {
        // Automatically select first voucher if none selected or previous no longer in list
        const exists = arrayList.find((v: any) => v.id === selectedVoucherId);
        const activeVoucher = exists || arrayList[0];
        setSelectedVoucherId(activeVoucher.id);

        // Pre-select all items of that voucher
        const itemMap: Record<string | number, boolean> = {};
        (activeVoucher.itemLines || []).forEach((item: any) => {
          itemMap[item.id] = true;
        });
        setSelectedItemIds(itemMap);
      } else {
        setSelectedVoucherId(null);
        setSelectedItemIds({});
      }
    } catch (error) {
      console.error("Failed to fetch daybook references:", error);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReferences();
    }
  }, [isOpen, daybookGroupId, daybookGroupShortName, daybookId, daybookShortName, statusFilter]);

  const activeVoucher = useMemo(() => {
    return vouchers.find((v) => v.id === selectedVoucherId) || null;
  }, [vouchers, selectedVoucherId]);

  const handleSelectVoucherCard = (v: any) => {
    setSelectedVoucherId(v.id);
    const itemMap: Record<string | number, boolean> = {};
    (v.itemLines || []).forEach((item: any) => {
      itemMap[item.id] = true;
    });
    setSelectedItemIds(itemMap);
  };

  const toggleItemSelection = (itemId: string | number) => {
    setSelectedItemIds((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const toggleSelectAllItems = () => {
    if (!activeVoucher) return;
    const allSelected = (activeVoucher.itemLines || []).every(
      (item: any) => selectedItemIds[item.id],
    );
    const itemMap: Record<string | number, boolean> = {};
    (activeVoucher.itemLines || []).forEach((item: any) => {
      itemMap[item.id] = !allSelected;
    });
    setSelectedItemIds(itemMap);
  };

  const handleInstantSelectVoucher = (v: any) => {
    const items = v.itemLines || [];
    if (items.length === 0) {
      alert("No items found in this reference voucher.");
      return;
    }
    onSelectVoucher(v, items);
    onClose();
  };

  const handleConfirm = () => {
    if (!activeVoucher) return;
    const selectedItems = (activeVoucher.itemLines || []).filter(
      (item: any) => selectedItemIds[item.id],
    );
    if (selectedItems.length === 0) {
      alert("Please select at least one item from the reference voucher.");
      return;
    }
    onSelectVoucher(activeVoucher, selectedItems);
    onClose();
  };

  const filteredVouchers = useMemo(() => {
    if (!search.trim()) return vouchers;
    const s = search.toLowerCase();
    return vouchers.filter(
      (v) =>
        v.voucherNo?.toLowerCase().includes(s) ||
        v.accountName?.toLowerCase().includes(s) ||
        v.customerPhone?.toLowerCase().includes(s) ||
        v.reference?.toLowerCase().includes(s),
    );
  }, [vouchers, search]);

  const selectedItemsCount = useMemo(() => {
    if (!activeVoucher) return 0;
    return (activeVoucher.itemLines || []).filter(
      (item: any) => selectedItemIds[item.id],
    ).length;
  }, [activeVoucher, selectedItemIds]);

  const selectedLabourTotal = useMemo(() => {
    if (!activeVoucher) return 0;
    return (activeVoucher.itemLines || [])
      .filter((item: any) => selectedItemIds[item.id])
      .reduce((sum: number, it: any) => sum + Number(it.labourAmount || 0), 0);
  }, [activeVoucher, selectedItemIds]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl border-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-gradient-to-r from-slate-50 to-white dark:from-zinc-900 dark:to-zinc-850 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-action/10 text-primary-action">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  {title}
                </DialogTitle>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Select a reference voucher to import items and labour charges
                  directly into the bill
                </p>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  statusFilter === "pending"
                    ? "bg-white dark:bg-zinc-900 text-primary-action shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                Pending (Unbilled)
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  statusFilter === "all"
                    ? "bg-white dark:bg-zinc-900 text-primary-action shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                All Vouchers
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Voucher No, Customer Name, Mobile or Reference..."
              className="h-8 pl-9 text-xs bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
            />
          </div>
        </DialogHeader>

        {/* Multiple Sections Body: Left (Vouchers List) | Right (Line Items & Labour Preview) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
          {/* Section 1: Vouchers List (5 cols) */}
          <div className="md:col-span-5 border-r border-slate-200 dark:border-zinc-800 flex flex-col min-h-0 bg-slate-50/50 dark:bg-zinc-900/40">
            <div className="px-4 py-2 border-b border-slate-200 dark:border-zinc-800 bg-slate-100/60 dark:bg-zinc-850 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                Vouchers ({filteredVouchers.length})
              </span>
              {loading && <Loader2 className="h-3 w-3 animate-spin text-primary-action" />}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {loading && filteredVouchers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs">
                  <Loader2 className="h-6 w-6 animate-spin mb-2 text-primary-action" />
                  <span>Loading reference vouchers...</span>
                </div>
              ) : filteredVouchers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs text-center px-4">
                  <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                  <span className="font-semibold text-slate-600 dark:text-zinc-300">
                    No reference vouchers found
                  </span>
                  <span className="text-[11px] mt-0.5">
                    {statusFilter === "pending"
                      ? "All receipts may have already been billed."
                      : "No vouchers exist for this Day Book Group."}
                  </span>
                </div>
              ) : (
                filteredVouchers.map((v) => {
                  const isSelected = v.id === selectedVoucherId;
                  return (
                    <div
                      key={v.id}
                      onClick={() => handleSelectVoucherCard(v)}
                      onDoubleClick={() => handleInstantSelectVoucher(v)}
                      title="Click to preview items, double-click to immediately import into bill"
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-white dark:bg-zinc-850 border-primary-action shadow-sm ring-1 ring-primary-action"
                          : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                              {v.voucherNo}
                            </span>
                            {v.isReferenced ? (
                              <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300 bg-amber-50">
                                Billed ({v.referencedInVoucherNo})
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-300 bg-emerald-50">
                                Ready
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <Clock className="h-3 w-3" />
                            <span>{toISODate(v.voucherDate)}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-primary-action">
                            {parseNumber(v.grandTotal)}
                          </span>
                          {v.totalLabour > 0 && (
                            <div className="text-[10px] text-amber-600 font-medium">
                              Labour: {parseNumber(v.totalLabour)}
                            </div>
                          )}
                          {v.advanceAmount > 0 && (
                            <div className="text-[10px] text-emerald-600 font-medium">
                              Advance: {parseNumber(v.advanceAmount)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1 text-slate-700 dark:text-zinc-300 truncate max-w-[170px]">
                          <User className="h-3 w-3 shrink-0 text-slate-400" />
                          <span className="truncate">{v.accountName || "Cash Customer"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">
                            {v.itemCount || v.itemLines?.length || 0} items
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant={isSelected ? "default" : "secondary"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInstantSelectVoucher(v);
                            }}
                            className="h-6 text-[10px] px-2 py-0 font-semibold gap-1 bg-primary-action hover:bg-primary-action/90 text-primary-action-foreground"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Select</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 2: Selected Voucher Item Lines Preview (7 cols) */}
          <div className="md:col-span-7 flex flex-col min-h-0 bg-white dark:bg-zinc-900">
            {activeVoucher ? (
              <>
                <div className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-850 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>Receipt Items for {activeVoucher.voucherNo}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {activeVoucher.accountName || "Customer"}
                      </Badge>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Select items to import into repairing invoice
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAllItems}
                    className="h-7 text-xs text-primary-action"
                  >
                    Select All
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-0">
                  {(activeVoucher.itemLines || []).length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No items found in this receipt voucher.
                    </div>
                  ) : (
                    (activeVoucher.itemLines || []).map((item: any, idx: number) => {
                      const isChecked = !!selectedItemIds[item.id];
                      return (
                        <div
                          key={item.id || idx}
                          onClick={() => toggleItemSelection(item.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isChecked
                              ? "border-primary-action/40 bg-primary-action/5"
                              : "border-slate-200 dark:border-zinc-800 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Checkbox
                              checked={isChecked}
                              onChange={() => toggleItemSelection(item.id)}
                              className="shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                                  {item.itemName || "Item"}
                                </span>
                                {item.tagNo && (
                                  <Badge variant="outline" className="text-[9px] font-mono">
                                    {item.tagNo}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                <span>Qty: {item.pcs || 1}</span>
                                <span>&bull;</span>
                                <span>GW: {Number(item.grossWt || 0).toFixed(3)}g</span>
                                <span>&bull;</span>
                                <span>NW: {Number(item.netWt || 0).toFixed(3)}g</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {Number(item.labourAmount || 0) > 0 && (
                              <div className="flex items-center justify-end gap-1 text-[11px] font-semibold text-amber-600">
                                <Wrench className="h-3 w-3" />
                                <span>Labour: {parseNumber(item.labourAmount)}</span>
                              </div>
                            )}
                            <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                              {parseNumber(item.amount)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Voucher Summary Bar */}
                <div className="p-3 bg-slate-50 dark:bg-zinc-850 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div className="space-x-3 text-slate-600 dark:text-zinc-400">
                    <span>
                      Selected: <b>{selectedItemsCount}</b> items
                    </span>
                    <span>&bull;</span>
                    <span>
                      Total Labour: <b>{parseNumber(selectedLabourTotal)}</b>
                    </span>
                  </div>
                  <div className="text-slate-900 dark:text-zinc-100 font-bold">
                    Receipt Total: {parseNumber(activeVoucher.grandTotal)}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-xs text-center">
                <FileText className="h-8 w-8 mb-2 opacity-40" />
                <span>Select a voucher from the list to preview items & labour</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-3 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 flex items-center justify-between">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={!activeVoucher || selectedItemsCount === 0}
            className="gap-2 bg-primary-action hover:bg-primary-action/90 text-primary-action-foreground"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Add {selectedItemsCount} Item{selectedItemsCount === 1 ? "" : "s"} to Bill
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
