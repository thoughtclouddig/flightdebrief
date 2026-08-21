import type { ReactNode } from "react";
import Image from "next/image";

/** Every product-proof card's visual area is the same shape, whether it holds a photo or a mocked app screen, so every card across the marketing site reads as one system. */
export function Visual({ children }: { children: ReactNode }) {
  return <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#f4f5f6]">{children}</div>;
}

export function PhotoVisual({ src, alt }: { src: string; alt: string }) {
  return (
    <Visual>
      <Image src={src} alt={alt} fill className="object-cover" sizes="(min-width: 1024px) 420px, (min-width: 640px) 320px, 100vw" />
    </Visual>
  );
}

/** The shared "app screen" shell -- header bar + content area -- every mocked product-UI card across the marketing site uses this frame so they all read as the same real application. */
export function AppScreen({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <Visual>
      <div className="flex h-full w-full flex-col rounded-xl border border-black/[0.06] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-3.5">{header}</div>
        <div className="flex flex-1 flex-col justify-center px-5">{children}</div>
      </div>
    </Visual>
  );
}

/** A small status/count pill, like the "Complete" badge on the Flight Summary header -- reused so every mocked screen's header reads consistently. */
export function Pill({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span
      className="shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wide"
      style={{ backgroundColor: `${tone}1a`, color: tone }}
    >
      {children}
    </span>
  );
}

/** A single row on an app screen -- icon chip + label -- the same visual language reused across every mocked screen so it reads as a genuine app, not a plain list. */
export function SummaryRow({
  icon: Icon,
  tone,
  label,
  sub,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>;
  tone: string;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3.5 py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${tone}1a` }}>
        <Icon className="size-5" style={{ color: tone }} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-balance text-xs font-bold uppercase tracking-wide text-[#8c97a2]">{label}</p>
        <p className="truncate text-base font-semibold text-[#101727]">{sub}</p>
      </div>
    </div>
  );
}
