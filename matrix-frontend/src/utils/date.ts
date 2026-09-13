/**
 * Common Date Utilities for Matrix ERP (Frontend)
 * Standardizes date parsing, formatting, and conversion across all pages and grids.
 */

export const DATE_FORMAT = "DD/MM/YYYY";
export const DATE_TIME_FORMAT = "DD/MM/YYYY hh:mm A";
export const ISO_DATE_FORMAT = "YYYY-MM-DD";

/**
 * Parses any date representation into a valid Date object or null.
 * Handles:
 * - Date instances
 * - Timestamps (number)
 * - ISO strings: "2026-09-13", "2026-09-13T10:00:00.000Z"
 * - Slash strings: "13/09/2026", "13/09/2026 10:00 AM"
 * - Dash strings: "13-09-2026"
 */
export function parseDate(val: any): Date | null {
  if (val == null || val === "") return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }

  if (typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // Match DD/MM/YYYY or DD-MM-YYYY with optional time
    const dmyMatch = trimmed.match(
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?)?$/,
    );
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      let hours = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
      const minutes = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
      const seconds = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
      const meridiem = dmyMatch[7]?.toUpperCase();

      if (meridiem === "PM" && hours < 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours = 0;

      const date = new Date(year, month, day, hours, minutes, seconds);
      return isNaN(date.getTime()) ? null : date;
    }

    // Match YYYY-MM-DD
    const ymdMatch = trimmed.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/,
    );
    if (
      ymdMatch &&
      !trimmed.includes("T") &&
      !trimmed.includes("Z") &&
      !trimmed.includes("+")
    ) {
      // Local YYYY-MM-DD without timezone offset shift
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      const date = new Date(year, month, day);
      return isNaN(date.getTime()) ? null : date;
    }

    // Standard ISO / JS string
    const date = new Date(trimmed);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/**
 * Format date to DD/MM/YYYY
 */
export function formatDate(val: any, fallback = ""): string {
  const d = parseDate(val);
  if (!d) return fallback;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date & time to DD/MM/YYYY hh:mm A
 */
export function formatDateTime(val: any, fallback = ""): string {
  const d = parseDate(val);
  if (!d) return fallback;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const strHours = String(hours).padStart(2, "0");

  return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm}`;
}

/**
 * Format Date to YYYY-MM-DD (local, safe for input[type="date"] and DatePicker value)
 */
export function toISODate(val: any, fallback = ""): string {
  const d = parseDate(val);
  if (!d) return fallback;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get current date as YYYY-MM-DD
 */
export function todayISO(): string {
  return toISODate(new Date());
}

/**
 * Comparator for sorting date columns in AG Grid
 */
export function dateComparator(date1: any, date2: any): number {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  if (!d1 && !d2) return 0;
  if (!d1) return -1;
  if (!d2) return 1;
  return d1.getTime() - d2.getTime();
}
