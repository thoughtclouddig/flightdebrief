import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isDevelopment } from "@/lib/env";
import "../train/design-tokens.css";

/**
 * /design/train-vector -- a standalone visual mockup for the Vector session
 * detail page (/train/vector/[itemId]), the screen "Train with Vector"
 * hands off to. Same posture as /design/train: Development-only, no
 * getViewer()/getRepository() anywhere under this tree, hardcoded fixtures
 * only. Shares design-tokens.css with /design/train rather than duplicating
 * it -- same mockup design system, same route family.
 */
export default function DesignTrainVectorLayout({ children }: { children: ReactNode }) {
  if (!isDevelopment()) notFound();
  return children;
}
