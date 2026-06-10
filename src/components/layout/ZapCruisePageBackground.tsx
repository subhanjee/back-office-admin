import Image from 'next/image';

/** Same hero background as zap-cruise-Client home page (ship1.jpg + blue overlays). */
export default function ZapCruisePageBackground() {
  return (
    <div className="fixed inset-0 -z-10" aria-hidden="true">
      <Image
        src="/images/ship1.jpg"
        alt=""
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/70 via-blue-900/55 to-blue-950/80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(0,153,255,0.22),transparent_55%)]" />
    </div>
  );
}
