import React, { useEffect, useRef, useState } from 'react';
import { Check, Moon, Palette, Rows3, Sun, AlignJustify } from 'lucide-react';
import { THEME_PRESETS, useTheme } from '../../context/ThemeContext';

export const ThemeSwitcher: React.FC = () => {
  const { mode, setMode, preset, setPreset, density, setDensity, activePresetMeta } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    window.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      window.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Theme and display preferences"
        className="inline-flex items-center gap-2 h-9 px-3 rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 shadow-xs text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
      >
        {mode === 'dark' ? <Moon size={14} className="text-amber-300" /> : <Sun size={14} className="text-amber-500" />}
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/20"
          style={{ backgroundColor: mode === 'dark' ? activePresetMeta.darkAccentHex : activePresetMeta.accentHex }}
        />
        <span className="hidden sm:inline">{activePresetMeta.name.split(' ')[1] || activePresetMeta.name}</span>
      </button>

      {open && (
        <div className="smart-modal-enter absolute right-0 mt-2.5 w-80 z-50 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Palette size={15} className="theme-accent-text" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                App Theme & Layout
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Saved automatically</span>
          </div>

          {/* Light / Dark Mode Switch */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Appearance Mode
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMode('light')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'light'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Sun size={13} className={mode === 'light' ? 'text-amber-500' : ''} />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('dark')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'dark'
                    ? 'bg-slate-900 text-slate-100 shadow-xs ring-1 ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Moon size={13} className={mode === 'dark' ? 'text-amber-300' : ''} />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Curated Theme Presets */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Theme Style Preset
            </div>
            <div className="grid grid-cols-2 gap-2">
              {THEME_PRESETS.map((item) => {
                const isSelected = preset === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreset(item.id)}
                    className={`flex flex-col gap-1.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-slate-50 dark:bg-slate-800/90 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                    style={isSelected ? { borderColor: mode === 'dark' ? item.darkAccentHex : item.accentHex } : undefined}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1">
                        {item.swatches.map((hex, i) => (
                          <span
                            key={i}
                            className="w-3 h-3 rounded-full ring-1 ring-black/10 dark:ring-white/15"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                      {isSelected && (
                        <Check
                          size={13}
                          style={{ color: mode === 'dark' ? item.darkAccentHex : item.accentHex }}
                        />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smart Grid Density */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Smart Grid Row Density
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDensity('comfortable')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  density === 'comfortable'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Rows3 size={13} />
                <span>Comfortable</span>
              </button>
              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  density === 'compact'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <AlignJustify size={13} />
                <span>Compact</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
