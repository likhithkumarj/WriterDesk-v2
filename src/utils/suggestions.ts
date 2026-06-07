import { Suggestion } from "../types/screenplay";

const SCENE_PREFIXES = ["INT.", "EXT.", "INT./EXT.", "I/E.", "EST."];
const SCENE_TIMES = ["DAY", "NIGHT", "MORNING", "EVENING", "CONTINUOUS", "LATER", "MOMENTS LATER", "DUSK", "DAWN"];

export function sceneSuggestions(rawText: string): Suggestion[] {
  const text = rawText.toUpperCase();
  const trimmed = text.trim();
  if (!trimmed) {
    return SCENE_PREFIXES.map((p) => ({ label: p, insert: p + " ", hint: "prefix" }));
  }
  const prefixMatches = SCENE_PREFIXES.filter((p) => p.startsWith(trimmed) && p !== trimmed);
  if (prefixMatches.length) {
    return prefixMatches.map((p) => ({ label: p, insert: p + " ", hint: "prefix" }));
  }
  const usedPrefix = SCENE_PREFIXES.find((p) => trimmed.startsWith(p));
  if (!usedPrefix) return [];
  const dashIdx = text.lastIndexOf(" - ");
  if (dashIdx === -1) {
    if (text.endsWith(" ") && text.length > usedPrefix.length + 2) {
      return SCENE_TIMES.map((t) => ({ label: `- ${t}`, insert: text.replace(/\s+$/, "") + " - " + t, hint: "time" }));
    }
    return [];
  }
  const after = text.substring(dashIdx + 3).trim();
  const matches = SCENE_TIMES.filter((t) => t.startsWith(after) && t !== after);
  const base = text.substring(0, dashIdx + 3);
  return matches.slice(0, 8).map((t) => ({ label: `- ${t}`, insert: base + t, hint: "time" }));
}

export function characterSuggestions(rawText: string, known: string[]): Suggestion[] {
  const t = rawText.toUpperCase().trim();
  const list = known.filter(Boolean);
  if (!t) return list.slice(0, 6).map((n) => ({ label: n, insert: n, hint: "recent" }));
  return list
    .filter((n) => n.startsWith(t) && n !== t)
    .slice(0, 6)
    .map((n) => ({ label: n, insert: n, hint: "recent" }));
}
