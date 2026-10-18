/**
 * Color Presets and Utilities for Matrix ERP Global Theme System
 */

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedThemeMode = "light" | "dark";

export type PresetAccent =
  | "matrix-blue"
  | "royal-purple"
  | "emerald"
  | "teal"
  | "amber"
  | "rose"
  | "slate"
  | "custom";

export interface AccentThemeConfig {
  id: PresetAccent;
  name: string;
  light: string; // Hex for light mode
  dark: string;  // Hex for dark mode
  description: string;
}

export const PRESET_ACCENTS: AccentThemeConfig[] = [
  {
    id: "matrix-blue",
    name: "Matrix Blue",
    light: "#2563EB", // Rich professional blue
    dark: "#60A5FA",  // Vibrant accessible blue on dark slate
    description: "Professional and classic enterprise blue",
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    light: "#7C3AED", // Royal violet
    dark: "#A78BFA",  // Soft purple for dark mode
    description: "Elegant, distinctive, and creative purple",
  },
  {
    id: "emerald",
    name: "Emerald Green",
    light: "#059669", // Crisp emerald
    dark: "#34D399",  // Fresh mint emerald
    description: "Business-oriented, balanced, and fresh green",
  },
  {
    id: "teal",
    name: "Teal",
    light: "#0D9488", // Deep cyan teal
    dark: "#2DD4BF",  // Bright modern teal
    description: "Modern, calm, and sophisticated teal",
  },
  {
    id: "amber",
    name: "Amber",
    light: "#D97706", // Warm amber gold
    dark: "#FBBF24",  // Radiant amber
    description: "Warm, energetic, and premium gold",
  },
  {
    id: "rose",
    name: "Rose",
    light: "#E11D48", // Vibrant rose ruby
    dark: "#FB7185",  // Gentle rose
    description: "Subtle, refined, and modern rose",
  },
  {
    id: "slate",
    name: "Slate",
    light: "#475569", // Neutral slate gray
    dark: "#94A3B8",  // Clean light slate
    description: "Minimalist, neutral, and restrained gray",
  },
];

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Parses a hex color string into RGB numbers
 */
export function hexToRgb(hex: string): RGB {
  let cleaned = hex.replace("#", "").trim();
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(cleaned, 16);
  if (isNaN(num) || cleaned.length !== 6) {
    return { r: 37, g: 99, b: 235 }; // fallback to matrix blue
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Converts RGB values into HSL
 */
export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h = Math.round(h * 60);
  }

  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Converts Hex string to Tailwind/Shadcn HSL variable format: "221 83% 53%"
 */
export function hexToHslString(hex: string): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
}

/**
 * Determines whether text on top of this color should be white or dark for accessible contrast
 */
export function getContrastTextColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  // Calculate relative luminance (W3C standard formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65 ? "#0F172A" : "#FFFFFF";
}

/**
 * Determines contrast HSL string for Shadcn --primary-foreground
 */
export function getContrastHslString(hex: string): string {
  const textColor = getContrastTextColor(hex);
  return textColor === "#FFFFFF" ? "0 0% 100%" : "222.2 84% 4.9%";
}

/**
 * Generates an adjusted dark-mode hex for custom accent colors so they don't blend into dark surfaces
 */
export function adjustColorForDark(hex: string): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);

  // If lightness is too dark (< 55%), boost lightness for legibility on dark background
  if (hsl.l < 55) {
    const targetL = Math.min(75, Math.max(58, hsl.l + 25));
    return hslToHex(hsl.h, Math.min(hsl.s, 90), targetL);
  }
  return hex;
}

/**
 * Converts HSL back to Hex string
 */
export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (0 <= h && h < 60) {
    rPrime = c;
    gPrime = x;
    bPrime = 0;
  } else if (60 <= h && h < 120) {
    rPrime = x;
    gPrime = c;
    bPrime = 0;
  } else if (120 <= h && h < 180) {
    rPrime = 0;
    gPrime = c;
    bPrime = x;
  } else if (180 <= h && h < 240) {
    rPrime = 0;
    gPrime = x;
    bPrime = c;
  } else if (240 <= h && h < 300) {
    rPrime = x;
    gPrime = 0;
    bPrime = c;
  } else if (300 <= h && h < 360) {
    rPrime = c;
    gPrime = 0;
    bPrime = x;
  }

  const r = Math.round((rPrime + m) * 255);
  const g = Math.round((gPrime + m) * 255);
  const b = Math.round((bPrime + m) * 255);

  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
