import Image from 'next/image';
import logo from '@/assets/oklogo.png';

interface ZapCruiseLogoProps {
  className?: string;
}

/** Same logo import pattern as zap-cruise-Client Navbar. */
export default function ZapCruiseLogo({ className }: ZapCruiseLogoProps) {
  return (
    <Image
      src={logo}
      alt="ZapCruise logo"
      height={100}
      className={className ?? 'h-10 w-auto object-contain'}
      priority
    />
  );
}
