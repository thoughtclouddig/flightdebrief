/**
 * Pulls a JSON object out of a model response. Shared by the article and
 * ideas generators, which both ask for bare JSON and both occasionally get it
 * wrapped in a markdown fence or trailing commentary anyway.
 */
export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return text;
  return text.slice(start, end + 1);
}
