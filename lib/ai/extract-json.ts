/**
 * Pulls a JSON object out of a model response. Shared by the article and
 * ideas generators, which both ask for bare JSON and both occasionally get it
 * wrapped in a markdown fence or trailing commentary anyway.
 */
export function extractJson(text: string): string {
  return repairJson(rawJson(text));
}

function rawJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return text;
  return text.slice(start, end + 1);
}

/**
 * Escapes stray double quotes inside string values.
 *
 * Models are asked for verbatim passages, and a passage that itself contains
 * a quotation mark produces `"support": "he said "hold short" and left"` --
 * valid English, invalid JSON, and the whole reply is lost over one
 * character. Prompting against it helps and does not eliminate it.
 *
 * Walks the text tracking whether it is inside a string. A quote inside one
 * is a terminator only when the next meaningful character is one that can
 * legally follow a string (a comma, a closing brace or bracket, or a colon);
 * anything else means it was part of the text and gets escaped.
 */
export function repairJson(text: string): string {
  let out = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escaped) {
      out += char;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      out += char;
      escaped = true;
      continue;
    }
    if (char !== '"') {
      out += char;
      continue;
    }

    if (!inString) {
      inString = true;
      out += char;
      continue;
    }

    // Closing quote, or a quote inside the text? Look at what follows.
    let j = i + 1;
    while (j < text.length && /\s/.test(text[j])) j++;
    const next = text[j];
    if (next === undefined || next === "," || next === "}" || next === "]" || next === ":") {
      inString = false;
      out += char;
    } else {
      out += '\\"';
    }
  }

  return out;
}
