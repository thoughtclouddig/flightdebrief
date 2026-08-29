/**
 * Diagnostic for the research pass. Makes the same call lib/ai/research.ts
 * makes and prints the response shape, so we can see which step fails:
 * whether the search runs, what block types come back and in what order,
 * whether the turn paused, and whether the final text block is the JSON the
 * parser expects.
 */
import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY is not set in this shell.");
  process.exit(1);
}

const client = new Anthropic({ apiKey });

const SYSTEM = `You are the researcher for AfterFlight's flight-training articles. Search the web and return findings, each with a URL you actually retrieved and a quoted supporting passage.

Return ONLY this JSON, no fences, no commentary:

{
  "findings": [{ "claim": "...", "label": "...", "url": "https://...", "sourceType": "faa_guidance", "support": "quoted passage" }],
  "gaps": ["what you could not substantiate"]
}`;

console.log("Calling claude-sonnet-5 with web_search_20260209 ...\n");

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
        content:
          "Research this: do student pilots retain skills better training twice a week or once a week with longer lessons? Find what the FAA handbooks and any real research say.",
      },
    ],
  });
} catch (err) {
  console.error("REQUEST THREW:");
  console.error(err?.message ?? err);
  if (err?.status) console.error("HTTP status:", err.status);
  process.exit(1);
}

console.log("stop_reason:", response.stop_reason);
console.log("block types in order:", response.content.map((b) => b.type).join(", "));
console.log(
  "usage:",
  JSON.stringify({
    input: response.usage?.input_tokens,
    output: response.usage?.output_tokens,
    server_tool_use: response.usage?.server_tool_use,
  }),
);

const textBlocks = response.content.filter((b) => b.type === "text");
console.log(`\ntext blocks: ${textBlocks.length}`);

if (textBlocks.length === 0) {
  console.log("\nNO TEXT BLOCK. The turn produced only tool activity.");
  console.log("If stop_reason is pause_turn, the search loop hit its cap and needs resuming.");
  process.exit(0);
}

const last = textBlocks[textBlocks.length - 1].text;
console.log("\n--- LAST TEXT BLOCK (first 1200 chars) ---");
console.log(last.slice(0, 1200));
console.log("--- END ---\n");

try {
  const start = last.indexOf("{");
  const end = last.lastIndexOf("}");
  const parsed = JSON.parse(last.slice(start, end + 1));
  console.log(`PARSED OK. findings: ${parsed.findings?.length ?? 0}, gaps: ${parsed.gaps?.length ?? 0}`);
  for (const f of parsed.findings ?? []) console.log(`  - ${f.url}`);
} catch (err) {
  console.log("PARSE FAILED:", err.message);
  console.log("That means the model answered in prose instead of the JSON contract.");
}
