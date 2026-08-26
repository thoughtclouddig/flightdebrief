/**
 * Placeholder for Bing Webmaster Tools' AI Performance data (AI citations,
 * cited AfterFlight URLs, citation trends, grounding queries). No Bing
 * Webmaster Tools API credentials exist in this environment, so this module
 * does not make a live call and never fabricates values -- it exists so a
 * future integration has a typed shape to fill in, and so callers can render
 * an honest "not connected yet" state instead of omitting the section.
 */
export interface BingAiPerformance {
  citations: number;
  citedUrls: { url: string; citations: number }[];
  trends: { date: string; citations: number }[];
  groundingQueries: string[];
}

export async function getBingAiPerformance(): Promise<BingAiPerformance | null> {
  return null;
}
