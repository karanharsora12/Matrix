import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

dayjs.extend(customParseFormat);

export const DATE_FORMAT = "DD/MM/YYYY";
export const DATE_TIME_FORMAT = "DD/MM/YYYY hh:mm A";

/**
 * Formats a single Date, dayjs object, or date string into DD/MM/YYYY
 * Runs in O(1) time without nested object traversal.
 */
export function formatDate(val: any): string {
  if (val == null || val === "") return "";
  const parsed = dayjs(val);
  return parsed.isValid() ? parsed.format(DATE_FORMAT) : String(val);
}

export function formatDateTime(val: any): string {
  if (val == null || val === "") return "";
  const parsed = dayjs(val);
  return parsed.isValid() ? parsed.format(DATE_TIME_FORMAT) : String(val);
}

export function parseDate(val: any): Date | null {
  if (val == null || val === "") return null;
  if (val instanceof Date) return val;

  if (typeof val === "string") {
    const trimmed = val.trim();
    if (
      /^\d{2}\/\d{2}\/\d{4}\s+\d{1,2}:\d{2}\s+(?:AM|PM|am|pm)$/i.test(trimmed)
    ) {
      const parsed = dayjs(trimmed, DATE_TIME_FORMAT);
      return parsed.isValid() ? parsed.toDate() : null;
    }
    // Try DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const parsed = dayjs(trimmed, DATE_FORMAT);
      return parsed.isValid() ? parsed.toDate() : null;
    }
    // Try standard ISO or string date
    const parsed = dayjs(trimmed);
    return parsed.isValid() ? parsed.toDate() : null;
  }

  return null;
}

export { dayjs };
