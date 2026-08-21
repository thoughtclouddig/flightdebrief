import { BrandDeviceFrame } from "@/components/marketing/brand-device-frame";

/** Server-rendered, reduced-motion-safe content shown until the animated island is near the viewport. */
export function BrandDeviceStatic() {
  return <BrandDeviceFrame action={<span className="inline-block shrink-0 whitespace-nowrap text-brand">Improve.</span>} />;
}