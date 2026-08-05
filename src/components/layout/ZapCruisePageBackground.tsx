import Image from 'next/image';

export default function ZapCruisePageBackground() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Image
        src="/images/ship1.jpg"
        alt=""
        fill
        priority
        className="object-cover"
        sizes="50vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/80 via-brand-navy/85 to-brand-navy/90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.16),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(14,165,164,0.22),transparent_55%)]" />
    </div>
  );
}
