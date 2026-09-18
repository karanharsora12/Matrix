import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const URL_SECRET_KEY =
  import.meta.env.VITE_URL_SECRET_KEY || "matrix-default-secret-key-2026";

export function encodeURL<T = any>(data: T): string {
  if (data === undefined || data === null) return "";
  try {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(jsonString);
    const keyArray = encoder.encode(URL_SECRET_KEY);

    for (let i = 0; i < uint8Array.length; i++) {
      uint8Array[i] = uint8Array[i] ^ keyArray[i % keyArray.length];
    }

    let binary = "";
    uint8Array.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    const base64 = btoa(binary);
    return encodeURIComponent(base64);
  } catch (error) {
    console.error("Error encoding URL data:", error);
    return "";
  }
}

export function decodeURL<T = any>(
  encodedData: string | null | undefined,
): T | null {
  if (!encodedData) return null;
  try {
    const decodedUri = decodeURIComponent(encodedData);
    const binary = atob(decodedUri);

    const uint8Array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      uint8Array[i] = binary.charCodeAt(i);
    }

    const encoder = new TextEncoder();
    const keyArray = encoder.encode(URL_SECRET_KEY);
    for (let i = 0; i < uint8Array.length; i++) {
      uint8Array[i] = uint8Array[i] ^ keyArray[i % keyArray.length];
    }

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(uint8Array);

    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("Error decoding URL data:", error);
    return null;
  }
}

/**
 * Builds a route string by replacing dynamic parameters (e.g., `:id`) with actual values.
 * Optionally appends query parameters.
 *
 * @example
 * buildRoute("/transactions/sales/:id", { id: 123 }) // "/transactions/sales/123"
 * buildRoute("/users/:id", { id: 1 }, { edit: true }) // "/users/1?edit=true"
 */
export function buildRoute(
  path: string,
  params: Record<string, string | number> = {},
  searchParams: Record<string, any> = {},
): string {
  let finalPath = path;

  Object.entries(params).forEach(([key, value]) => {
    finalPath = finalPath.replace(`:${key}`, encodeURIComponent(String(value)));
  });

  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === "object") {
        query.append(key, JSON.stringify(value));
      } else {
        query.append(key, String(value));
      }
    }
  });

  const queryString = query.toString();
  return queryString ? `${finalPath}?${queryString}` : finalPath;
}

type FmtOptions = {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  compact?: boolean;
  /** if true, keeps currency even when amount is 0/NaN */
  trimCurrencyOnZero?: boolean;
};

const CURRENCY_MAP: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AED: "AED ",
  SAR: "SAR ",
};

export function parseNumber(
  amount: number | string | null | undefined,
  currencyOrOptions?: string | FmtOptions,
  maybeOptions?: FmtOptions,
): string {
  let currency: string | undefined;
  let options: FmtOptions = {};

  if (
    typeof currencyOrOptions === "object" &&
    currencyOrOptions !== null &&
    !Array.isArray(currencyOrOptions)
  ) {
    options = currencyOrOptions;
    currency = undefined;
  } else {
    currency = currencyOrOptions as string | undefined;
    options = maybeOptions ?? {};
  }

  if (currency) {
    const upper = currency.trim().toUpperCase();
    currency = CURRENCY_MAP[upper] ?? currency;
    if (currency.trim() === "") currency = undefined;
  } else {
    currency = undefined;
  }

  const {
    locale = "en-IN",
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    useGrouping = true,
    compact = false,
  } = options;

  let numericValue: number;
  if (typeof amount === "string") {
    const cleaned = amount.replace(/[,₹$€£¥\s]/g, "").trim();
    numericValue = parseFloat(cleaned);
  } else if (typeof amount === "number") {
    numericValue = amount;
  } else {
    numericValue = NaN;
  }

  const formatOpts: Intl.NumberFormatOptions = {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
    ...(compact ? { notation: "compact" as const } : {}),
  };

  if (isNaN(numericValue) || !isFinite(numericValue)) {
    const zero = (0).toLocaleString(locale, formatOpts);
    return currency ? `${currency}${zero}` : zero;
  }

  const formatted = numericValue.toLocaleString(locale, formatOpts);
  return currency ? `${currency}${formatted}` : formatted;
}
