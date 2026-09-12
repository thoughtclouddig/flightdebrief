import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isDevelopment } from "@/lib/env";
import "./design-tokens.css";

/**
 * /design/train -- a standalone visual mockup for browser-reviewing Train's
 * proposed card system BEFORE it touches production. Development-only, not
 * staging-gated-but-reachable like /v2: this is pre-review design work, not
 * a reviewed fixture reference, so it 404s everywhere except a real local
 * dev server. No getViewer(), no getRepository() anywhere under this tree --
 * every case on the page is a hardcoded fixture from lib/design/train-fixtures.ts.
 */
export default function DesignTrainLayout({ children }: { children: ReactNode }) {
  if (!isDevelopment()) notFound();
  return children;
}
