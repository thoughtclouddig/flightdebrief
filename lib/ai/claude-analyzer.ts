import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";
import { structuredDebriefSchema, type AnalyzeDebriefInput, type StructuredDebriefResult } from "./schema";

export async function analyzeWithClaude(
  input: AnalyzeDebriefInput,
  apiKey: string,
): Promise<StructuredDebriefResult> {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude response contained no text content");
  }

  const jsonText = extractJson(textBlock.text);
  const parsed = JSON.parse(jsonText);
  return structuredDebriefSchema.parse(parsed);
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return text;
  return text.slice(start, end + 1);
}
