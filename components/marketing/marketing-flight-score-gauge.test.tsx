import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarketingFlightScoreGauge } from "./marketing-flight-score-gauge";

describe("MarketingFlightScoreGauge", () => {
  it("renders the score-derived dash offset before CSS animation is available", () => {
    const markup = renderToStaticMarkup(
      <MarketingFlightScoreGauge score={82} label="Progressing" tone="good" caption="Last 8 flights" />,
    );

    expect(markup).toContain('stroke-dashoffset="0.18000000000000005"');
    expect(markup).toContain("--marketing-gauge-offset:0.18000000000000005");
  });
});