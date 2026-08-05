import Image from 'next/image';
import logo from '@/assets/zapcruise-logo.png';

interface ZapCruiseLogoProps {
  className?: string;
  /** 'full' renders the full logo lockup (mark + wordmark). 'mark' crops to just the ship icon, for tight/collapsed spaces. */
  variant?: 'full' | 'mark';
}

export default function ZapCruiseLogo({ className, variant = 'full' }: ZapCruiseLogoProps) {
  if (variant === 'mark') {
    return (
      <span className={className ?? 'relative block h-9 w-9 overflow-hidden shrink-0'}>
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
      className={className ?? 'zc-logo w-auto object-contain'}
      priority
    />
  );
}
