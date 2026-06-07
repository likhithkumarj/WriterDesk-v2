import { BlockType } from "../types/screenplay";

export const TYPE_ORDER: BlockType[] = ["action", "scene", "character", "parenthetical", "dialogue"];

export const TYPE_LABEL: Record<BlockType, string> = {
  scene: "Scene",
  action: "Action",
  character: "Character",
  parenthetical: "Paren",
  dialogue: "Dialogue",
};

export function nextTypeOnEnter(t: BlockType, text: string): BlockType {
  if (t === "scene") return "action";
  if (t === "action") return "action";
  if (t === "character") return text.trim().startsWith("(") ? "parenthetical" : "dialogue";
  if (t === "parenthetical") return "dialogue";
  if (t === "dialogue") return "action";
  return "action";
}

export function normalizeText(type: BlockType, text: string): string {
  if (type === "scene" || type === "character") return text.toUpperCase();
  if (type === "parenthetical") {
    let t = text.trim();
    if (!t) return "";
    if (!t.startsWith("(")) t = "(" + t;
    if (!t.endsWith(")")) t = t + ")";
    return t;
  }
  return text;
}
