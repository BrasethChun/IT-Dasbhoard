import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';
export type ThemePresetId = 'indigo' | 'clinical' | 'oceanic' | 'emerald';
export type GridDensity = 'comfortable' | 'compact';

export interface ThemePresetMeta {
  id: ThemePresetId;
  name: string;
  subtitle: string;
  accentHex: string;
  darkAccentHex: string;
  softHex: string;
  swatches: [string, string, string];
}

export const THEME_PRESETS: ThemePresetMeta[] = [
  {
    id: 'indigo',
    name: 'Executive Indigo',
    subtitle: 'Crisp slate & royal indigo',
    accentHex: '#4f46e5',
    darkAccentHex: '#6366f1',
    softHex: '#eef2ff',
    swatches: ['#f8fafc', '#4f46e5', '#0f172a'],
  },
  {
    id: 'clinical',
    name: 'Clinical Slate',
    subtitle: 'Calm healthcare teal',
    accentHex: '#0f766e',
    darkAccentHex: '#14b8a6',
    softHex: '#f0fdfa',
    swatches: ['#f8fafc', '#0f766e', '#134e4a'],
  },
  {
    id: 'oceanic',
    name: 'Oceanic Sky',
    subtitle: 'Clear azure & cool neutral',
    accentHex: '#0284c7',
    darkAccentHex: '#38bdf8',
    softHex: '#f0f9ff',
    swatches: ['#f8fafc', '#0284c7', '#0c4a6e'],
  },
  {
    id: 'emerald',
    name: 'Emerald Care',
    subtitle: 'Balanced operational green',
    accentHex: '#059669',
    darkAccentHex: '#10b981',
    softHex: '#ecfdf5',
    swatches: ['#f8fafc', '#059669', '#064e3b'],
  },
];

const STORAGE_KEY = 'app_theme_prefs_v1';

interface StoredPrefs {
  mode: ThemeMode;
  preset: ThemePresetId;
  density: GridDensity;
}

const DEFAULT_PREFS: StoredPrefs = {
  mode: 'light',
  preset: 'indigo',
  density: 'comfortable',
};

function readStoredPrefs(): StoredPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      mode: parsed.mode === 'dark' ? 'dark' : 'light',
      preset: THEME_PRESETS.some((p) => p.id === parsed.preset) ? parsed.preset : 'indigo',
      density: parsed.density === 'compact' ? 'compact' : 'comfortable',
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

interface ThemeContextValue {
  mode: ThemeMode;
  preset: ThemePresetId;
  density: GridDensity;
  activePresetMeta: ThemePresetMeta;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setPreset: (preset: ThemePresetId) => void;
  setDensity: (density: GridDensity) => void;
  toggleDensity: () => void;
  chartTheme: {
    gridStroke: string;
    axisTickColor: string;
    tooltipBg: string;
    tooltipBorder: string;
    tooltipText: string;
    accentColor: string;
  };
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prefs, setPrefs] = useState<StoredPrefs>(readStoredPrefs);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', prefs.mode === 'dark');
    root.setAttribute('data-theme-mode', prefs.mode);
    root.setAttribute('data-theme-preset', prefs.preset);
    root.setAttribute('data-density', prefs.density);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore storage quota errors
    }
  }, [prefs]);

  const activePresetMeta = useMemo(
    () => THEME_PRESETS.find((p) => p.id === prefs.preset) || THEME_PRESETS[0],
    [prefs.preset]
  );

  const chartTheme = useMemo(
    () => ({
      gridStroke: prefs.mode === 'dark' ? '#1e293b' : '#e2e8f0',
      axisTickColor: prefs.mode === 'dark' ? '#94a3b8' : '#64748b',
      tooltipBg: prefs.mode === 'dark' ? '#0f172a' : '#ffffff',
      tooltipBorder: prefs.mode === 'dark' ? '#334155' : '#e2e8f0',
      tooltipText: prefs.mode === 'dark' ? '#f1f5f9' : '#0f172a',
      accentColor: prefs.mode === 'dark' ? activePresetMeta.darkAccentHex : activePresetMeta.accentHex,
    }),
    [prefs.mode, activePresetMeta]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode: prefs.mode,
      preset: prefs.preset,
      density: prefs.density,
      activePresetMeta,
      setMode: (mode) => setPrefs((prev) => ({ ...prev, mode })),
      toggleMode: () => setPrefs((prev) => ({ ...prev, mode: prev.mode === 'dark' ? 'light' : 'dark' })),
      setPreset: (preset) => setPrefs((prev) => ({ ...prev, preset })),
      setDensity: (density) => setPrefs((prev) => ({ ...prev, density })),
      toggleDensity: () =>
        setPrefs((prev) => ({ ...prev, density: prev.density === 'compact' ? 'comfortable' : 'compact' })),
      chartTheme,
    }),
    [prefs, activePresetMeta, chartTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      mode: 'light',
      preset: 'indigo',
      density: 'comfortable',
      activePresetMeta: THEME_PRESETS[0],
      setMode: () => {},
      toggleMode: () => {},
      setPreset: () => {},
      setDensity: () => {},
      toggleDensity: () => {},
      chartTheme: {
        gridStroke: '#e2e8f0',
        axisTickColor: '#64748b',
        tooltipBg: '#ffffff',
        tooltipBorder: '#e2e8f0',
        tooltipText: '#0f172a',
        accentColor: '#4f46e5',
      },
    };
  }
  return ctx;
}
