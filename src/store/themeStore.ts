import { create } from 'zustand';

export type Theme = 'light' | 'dark';

/** localStorage key — must match the inline no-flash script in the root layout. */
export const THEME_STORAGE_KEY = 'zc-admin-theme';

/** Apply a theme to <html> (class + native color-scheme). Client only. */
function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

/** Read the theme the no-flash script already resolved (localStorage → DOM class). */
function resolveInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* ignore */
  }
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

interface ThemeState {
  theme: Theme;
  /** Sync store with the theme already applied to the DOM (call once on mount). */
  hydrate: () => void;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  hydrate: () => set({ theme: resolveInitialTheme() }),
  setTheme: (theme) => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
    set({ theme });
  },
  toggle: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}));
