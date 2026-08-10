'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

/**
 * Light / Dark theme toggle. The actual theme is applied to <html> before paint
 * by the inline no-flash script in the root layout; this button keeps the store
 * in sync and flips it. Renders a stable placeholder until mounted to avoid a
 * hydration mismatch on the icon.
 */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, hydrate, toggle } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrate();
    setMounted(true);
  }, [hydrate]);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-brand-blue hover:bg-muted transition-colors duration-150 ${className}`}
    >
      {mounted && isDark ? (
        <Sun className="w-[18px] h-[18px]" />
      ) : (
        <Moon className="w-[18px] h-[18px]" />
      )}
    </button>
  );
}
