import type { ReferralSource } from "@/lib/types";

const HOST_SOURCE: Record<string, ReferralSource> = {
  "chatgpt.com": "chatgpt",
  "chat.openai.com": "chatgpt",
  "perplexity.ai": "perplexity",
  "www.perplexity.ai": "perplexity",
  "gemini.google.com": "gemini",
  "bard.google.com": "gemini",
  "copilot.microsoft.com": "copilot",
  "claude.ai": "claude",
};

/**
 * Classifies a pageview's `document.referrer` by hostname. Best-effort only:
 * `bing.com` can't be split into Bing Chat vs. plain Bing Search from the
 * referrer alone, and `google.com` can't distinguish an AI Overview click
 * from a normal search result -- both are reported at the coarser level
 * rather than a fabricated finer one.
 */
export function classifyReferrer(referrer: string | null | undefined): ReferralSource {
  if (!referrer) return "direct";

  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "other";
  }

  if (HOST_SOURCE[host]) return HOST_SOURCE[host];
  if (host === "www.bing.com" || host === "bing.com") return "bing";
  if (host === "google.com" || host.endsWith(".google.com")) return "search_google";
  return "other";
}
