import { Plane } from "lucide-react";
import { BrandDeviceFrame } from "@/components/marketing/brand-device-frame";

/** Server-rendered, reduced-motion-safe content shown until the animated island is near the viewport. */
export function BrandDeviceStatic() {
  return (
    <BrandDeviceFrame
      action={<span className="inline-block shrink-0 whitespace-nowrap text-brand">Improve.</span>}
      plane={
        <Plane className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rotate-45 text-brand" />
      }
    />
  );
}