import Image from 'next/image';
import logo from '@/assets/zapcruise-logo.png';

interface ZapCruiseLogoProps {
  className?: string;
  /** 'full' renders the full logo lockup (mark + wordmark). 'mark' crops to just the ship icon, for tight/collapsed spaces. */
  variant?: 'full' | 'mark';
}

// The logo artwork uses a dark navy wordmark, which disappears on dark surfaces.
// In dark mode we render it as a clean white silhouette so it stays legible on
// cards, the sidebar/header and the login form. Callers on an always-dark panel
// can add `brightness-0 invert` themselves for unconditional white.
const DARK_TREATMENT = 'dark:brightness-0 dark:invert';

export default function ZapCruiseLogo({ className, variant = 'full' }: ZapCruiseLogoProps) {
  if (variant === 'mark') {
    const cls = `${className ?? 'relative block h-9 w-9 overflow-hidden shrink-0'} ${DARK_TREATMENT}`;
    return (
      <span className={cls}>
        <Image
          src={logo}
          alt="ZapCruise"
          fill
          className="object-cover object-left"
          priority
        />
      </span>
    );
  }

  return (
    <Image
      src={logo}
      alt="ZapCruise logo"
      height={100}
      className={`${className ?? 'zc-logo w-auto object-contain'} ${DARK_TREATMENT}`}
      priority
    />
  );
}
