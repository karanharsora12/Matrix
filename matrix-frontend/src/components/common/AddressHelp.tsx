/**
 * AddressHelp — reusable address block with popup-based City, Area, and
 * Pincode selectors.
 *
 *  - Address line (plain text input)
 *  - City (popup from /geo/cities)
 *  - Area / Locality (popup from /geo/areas, filtered by selected cityId)
 *  - Pincode (popup from /geo/pincodes, filtered by cityId+areaId)
 *
 * All state is lifted out via onChange() so the parent owns the data.
 */
import React, { useCallback, useEffect, useState } from "react";
import { Building2, Hash, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PopupTable } from "./PopupTable";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import apiClient from "@/api/client";
import type { ColDef } from "ag-grid-community";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface AddressValue {
  address1?: string;
  cityId?: number;
  cityName?: string;
  areaId?: number;
  areaName?: string;
  pincode?: string;
  pincodeId?: number;
}

export interface AddressHelpProps {
  value: AddressValue;
  onChange: (updated: AddressValue) => void;
  /** Show the plain "Address Line 1" text input */
  showAddress?: boolean;
  addressPlaceholder?: string;
  labelSize?: "xs" | "sm";
  className?: string;
  disabled?: boolean;
}

// ─── Column definitions ─────────────────────────────────────────────────────

const CITY_COLS: ColDef[] = [
  { headerName: "City", field: "name", minWidth: 180, flex: 1 },
  { headerName: "State", field: "stateName", width: 150 },
  { headerName: "ID", field: "id", width: 60, type: "numericColumn" },
];

const AREA_COLS: ColDef[] = [
  { headerName: "Area", field: "name", minWidth: 180, flex: 1 },
  { headerName: "City", field: "cityName", width: 130 },
  { headerName: "ID", field: "id", width: 60, type: "numericColumn" },
];

const PINCODE_COLS: ColDef[] = [
  { headerName: "Pincode", field: "pincode", width: 90 },
  {
    headerName: "Office / Locality",
    field: "officeName",
    minWidth: 160,
    flex: 1,
  },
  { headerName: "Area", field: "areaName", width: 120 },
];

// ─── Internal PopupField ────────────────────────────────────────────────────

interface PopupFieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  columns: ColDef[];
  apiEndpoint?: string;
  tableData?: any[];
  onSelect: (item: any) => void;
  searchPlaceholder?: string;
  popupWidth?: number;
  popupHeight?: number;
  disabled?: boolean;
  labelCls: string;
  icon: React.ReactNode;
}

function PopupField({
  label,
  value,
  placeholder,
  columns,
  apiEndpoint,
  tableData,
  onSelect,
  searchPlaceholder,
  popupWidth = 560,
  popupHeight = 300,
  disabled,
  labelCls,
  icon,
}: PopupFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1">
      <Label className={labelCls}>{label}</Label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(true)}
          className="relative w-full h-8 pl-7 pr-2 text-left text-xs rounded-md border border-input focus:outline-none focus:ring-1 focus:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed truncate"
          title={value || placeholder}
        >
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </span>
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {value || placeholder}
          </span>
        </button>

        <PopupTable
          open={open}
          onOpenChange={setOpen}
          apiEndpoint={apiEndpoint}
          tableData={tableData}
          columns={columns}
          onSelect={(item) => {
            onSelect(item);
            setOpen(false);
          }}
          searchPlaceholder={searchPlaceholder}
          width={popupWidth}
          height={popupHeight}
        />
      </div>
    </div>
  );
}

// ─── AddressHelp ─────────────────────────────────────────────────────────────

export function AddressHelp({
  value,
  onChange,
  showAddress = true,
  addressPlaceholder = "Address Line 1",
  labelSize = "xs",
  className = "",
  disabled = false,
}: AddressHelpProps) {
  const [areaList, setAreaList] = useState<any[]>([]);
  const [pincodeList, setPincodeList] = useState<any[]>([]);

  // Fetch areas when city changes
  useEffect(() => {
    if (!value.cityId) {
      setAreaList([]);
      setPincodeList([]);
      return;
    }
    apiClient
      .post(API_ENDPOINTS.GEO.AREAS, { cityId: value.cityId, fetchAll: true })
      .then((res) => {
        const data = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];
        setAreaList(data);
      })
      .catch(() => setAreaList([]));
  }, [value.cityId]);

  // Fetch pincodes when city or area changes
  useEffect(() => {
    if (!value.cityId) {
      setPincodeList([]);
      return;
    }
    const body: Record<string, any> = { cityId: value.cityId, fetchAll: true };
    if (value.areaId) body.areaId = value.areaId;
    apiClient
      .post(API_ENDPOINTS.GEO.PINCODES, body)
      .then((res) => {
        const data = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];
        setPincodeList(data);
      })
      .catch(() => setPincodeList([]));
  }, [value.cityId, value.areaId]);

  const handleCitySelect = useCallback(
    (item: any) => {
      onChange({
        ...value,
        cityId: item.id,
        cityName: item.name,
        areaId: undefined,
        areaName: undefined,
        pincode: undefined,
        pincodeId: undefined,
      });
    },
    [value, onChange],
  );

  const handleAreaSelect = useCallback(
    (item: any) => {
      onChange({
        ...value,
        areaId: item.id,
        areaName: item.name,
        pincode: undefined,
        pincodeId: undefined,
      });
    },
    [value, onChange],
  );

  const handlePincodeSelect = useCallback(
    (item: any) => {
      onChange({
        ...value,
        pincodeId: item.id,
        pincode: item.pincode,
        ...(item.areaId && !value.areaId
          ? { areaId: item.areaId, areaName: item.areaName }
          : {}),
        ...(item.cityId && !value.cityId
          ? { cityId: item.cityId, cityName: item.cityName }
          : {}),
      });
    },
    [value, onChange],
  );

  const labelCls =
    labelSize === "sm"
      ? "text-xs font-medium text-slate-600 dark:text-zinc-400"
      : "text-[11px] font-medium text-slate-600 dark:text-zinc-400";

  const iconSize = "h-3.5 w-3.5";

  return (
    <div className={`space-y-2 ${className}`}>
      {showAddress && (
        <div className="space-y-1">
          <Label className={labelCls}>Address</Label>
          <Input
            value={value.address1 || ""}
            onChange={(e) => onChange({ ...value, address1: e.target.value })}
            placeholder={addressPlaceholder}
            className="h-8 text-xs"
            disabled={disabled}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <PopupField
          label="City"
          value={value.cityName}
          placeholder="Select city..."
          columns={CITY_COLS}
          apiEndpoint={API_ENDPOINTS.GEO.CITIES}
          onSelect={handleCitySelect}
          searchPlaceholder="Search city or state..."
          popupWidth={560}
          popupHeight={320}
          disabled={disabled}
          labelCls={labelCls}
          icon={<Building2 className={iconSize} />}
        />

        <PopupField
          label="Area / Locality"
          value={value.areaName}
          placeholder={value.cityId ? "Select area..." : "City first"}
          columns={AREA_COLS}
          tableData={areaList}
          onSelect={handleAreaSelect}
          searchPlaceholder="Search area..."
          popupWidth={500}
          popupHeight={300}
          disabled={disabled || !value.cityId}
          labelCls={labelCls}
          icon={<MapPin className={iconSize} />}
        />
      </div>

      <PopupField
        label="Pincode"
        value={value.pincode}
        placeholder={value.cityId ? "Select pincode..." : "City first"}
        columns={PINCODE_COLS}
        tableData={pincodeList}
        onSelect={handlePincodeSelect}
        searchPlaceholder="Search pincode or office name..."
        popupWidth={560}
        popupHeight={300}
        disabled={disabled || !value.cityId}
        labelCls={labelCls}
        icon={<Hash className={iconSize} />}
      />
    </div>
  );
}

export default AddressHelp;
