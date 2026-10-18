import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  type ThemeMode,
  type ResolvedThemeMode,
  type PresetAccent,
  type AccentThemeConfig,
  PRESET_ACCENTS,
  hexToRgb,
  hexToHslString,
  getContrastTextColor,
  getContrastHslString,
  adjustColorForDark,
} from "@/utils/themeColors";

const STORAGE_KEY = "matrix_theme_preferences";

export interface ThemePreferences {
  mode: ThemeMode;
  accent: PresetAccent;
  customColor: string;
}

const DEFAULT_PREFERENCES: ThemePreferences = {
  mode: "system",
  accent: "matrix-blue",
  customColor: "#3B82A0",
};

export interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  accent: PresetAccent;
  customColor: string;
  activeHex: string;
  currentAccentConfig: AccentThemeConfig;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setAccent: (accent: PresetAccent) => void;
  setCustomColor: (hex: string) => void;
  resetDefaults: () => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function loadSavedPreferences(): ThemePreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      mode: ["light", "dark", "system"].includes(parsed.mode)
        ? parsed.mode
        : DEFAULT_PREFERENCES.mode,
      accent: PRESET_ACCENTS.some((p) => p.id === parsed.accent) ||
      parsed.accent === "custom"
        ? parsed.accent
        : DEFAULT_PREFERENCES.accent,
      customColor:
        typeof parsed.customColor === "string" && parsed.customColor.startsWith("#")
          ? parsed.customColor
          : DEFAULT_PREFERENCES.customColor,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function getSystemTheme(): ResolvedThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [preferences, setPreferences] =
    useState<ThemePreferences>(loadSavedPreferences);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Compute resolved mode based on mode setting + system preference
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    return typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const resolvedMode: ResolvedThemeMode = useMemo(() => {
    if (preferences.mode === "system") {
      return systemIsDark ? "dark" : "light";
    }
    return preferences.mode;
  }, [preferences.mode, systemIsDark]);

  // Compute active accent config and color
  const currentAccentConfig: AccentThemeConfig = useMemo(() => {
    if (preferences.accent === "custom") {
      return {
        id: "custom",
        name: "Custom Accent",
        light: preferences.customColor,
        dark: adjustColorForDark(preferences.customColor),
        description: "User defined custom accent color",
      };
    }
    const found = PRESET_ACCENTS.find((a) => a.id === preferences.accent);
    return found || PRESET_ACCENTS[0];
  }, [preferences.accent, preferences.customColor]);

  const activeHex = useMemo(() => {
    return resolvedMode === "dark"
      ? currentAccentConfig.dark
      : currentAccentConfig.light;
  }, [resolvedMode, currentAccentConfig]);

  // Apply theme to DOM and CSS custom properties
  useEffect(() => {
    const root = document.documentElement;

    // 1. Light/Dark classes
    if (resolvedMode === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }

    // 2. Data attributes for declarative styling
    root.setAttribute("data-theme", resolvedMode);
    root.setAttribute("data-accent", preferences.accent);

    // 3. Dynamic Accent Design Tokens
    const rgb = hexToRgb(activeHex);
    const hslStr = hexToHslString(activeHex);
    const contrastText = getContrastTextColor(activeHex);
    const contrastHsl = getContrastHslString(activeHex);

    root.style.setProperty("--primary-action", activeHex);
    root.style.setProperty("--primary-action-foreground", contrastText);
    root.style.setProperty("--primary", hslStr);
    root.style.setProperty("--primary-foreground", contrastHsl);
    root.style.setProperty("--ring", hslStr);
    root.style.setProperty("--active", activeHex);
    root.style.setProperty("--active-foreground", contrastText);
    root.style.setProperty("--accent-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);

    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.warn("Unable to persist theme preferences to localStorage", e);
    }
  }, [resolvedMode, activeHex, preferences]);

  // Update handlers
  const setMode = useCallback((mode: ThemeMode) => {
    setPreferences((prev) => ({ ...prev, mode }));
  }, []);

  const toggleMode = useCallback(() => {
    setPreferences((prev) => {
      let nextMode: ThemeMode;
      if (prev.mode === "light") nextMode = "dark";
      else if (prev.mode === "dark") nextMode = "system";
      else nextMode = "light";
      return { ...prev, mode: nextMode };
    });
  }, []);

  const setAccent = useCallback((accent: PresetAccent) => {
    setPreferences((prev) => ({ ...prev, accent }));
  }, []);

  const setCustomColor = useCallback((customColor: string) => {
    setPreferences((prev) => ({
      ...prev,
      accent: "custom",
      customColor,
    }));
  }, []);

  const resetDefaults = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  const value = useMemo<ThemeContextValue>(() => {
    return {
      mode: preferences.mode,
      resolvedMode,
      accent: preferences.accent,
      customColor: preferences.customColor,
      activeHex,
      currentAccentConfig,
      setMode,
      toggleMode,
      setAccent,
      setCustomColor,
      resetDefaults,
      isSettingsOpen,
      setIsSettingsOpen,
      openSettings,
      closeSettings,
    };
  }, [
    preferences.mode,
    resolvedMode,
    preferences.accent,
    preferences.customColor,
    activeHex,
    currentAccentConfig,
    setMode,
    toggleMode,
    setAccent,
    setCustomColor,
    resetDefaults,
    isSettingsOpen,
    openSettings,
    closeSettings,
  ]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
