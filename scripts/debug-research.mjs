/**
 * Diagnostic for the research pass, using the REAL system prompt.
 *
 * A stripped-down version of this call returned eight sourced findings, while
 * the app returns none -- so the difference is in the prompt or the timing,
 * not the API. This runs the actual prompt, with the actual timeout, and
 * reports which.
 */
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY is not set in this shell.");
  process.exit(1);
}

const SYSTEM = fs.readFileSync(new URL("./research-system-prompt.txt", import.meta.url), "utf8");
console.log(`system prompt: ${SYSTEM.length} characters\n`);

const client = new Anthropic({ apiKey, timeout: 120_000, maxRetries: 0 });
const startedAt = Date.now();

let response;
try {
  response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 8000,
    system: SYSTEM,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
    messages: [
      {
        role: "user",
        content: `Research this article before it is written.

Topic: Aviation Research -- What the research actually says about training retention.
Working title: Why students who chair-fly perform better on checkrides
Angle: Examines whether mental rehearsal improves checkride performance.
The reader's question: does chair flying actually help?

Find what can be substantiated about it, and say plainly what cannot.`,
      },
    ],
  });
} catch (err) {
  console.error(`REQUEST FAILED after ${Math.round((Date.now() - startedAt) / 1000)}s`);
  console.error(err?.message ?? err);
  if (err?.status) console.error("HTTP status:", err.status);
  process.exit(1);
}

console.log(`completed in ${Math.round((Date.now() - startedAt) / 1000)}s`);
console.log("stop_reason:", response.stop_reason);
console.log("searches:", response.usage?.server_tool_use?.web_search_requests ?? 0);
console.log("input tokens:", response.usage?.input_tokens);

const textBlocks = response.content.filter((b) => b.type === "text");
console.log(`text blocks: ${textBlocks.length}`);

if (textBlocks.length === 0) {
  console.log("\nNO TEXT BLOCK -- the turn produced only tool activity.");
  console.log("stop_reason above says whether it paused mid-search.");
  process.exit(0);
}

const last = textBlocks[textBlocks.length - 1].text;
console.log("\n--- LAST TEXT BLOCK (first 900 chars) ---");
console.log(last.slice(0, 900));
console.log("--- END ---\n");

const fenced = last.match(/```(?:json)?\s*([\s\S]*?)```/);
const raw = fenced ? fenced[1].trim() : last.slice(last.indexOf("{"), last.lastIndexOf("}") + 1);
try {
  const parsed = JSON.parse(raw);
  console.log(`PARSED OK. findings: ${parsed.findings?.length ?? 0}, gaps: ${parsed.gaps?.length ?? 0}`);
  for (const f of parsed.findings ?? []) console.log(`  [${f.sourceType}] ${f.url}`);
} catch (err) {
  console.log("PARSE FAILED:", err.message);
}
