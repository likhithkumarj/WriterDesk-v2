import { Block } from "../types/screenplay";

export function computeStats(blocks: Block[]) {
  let intC = 0, extC = 0, ieC = 0, words = 0, lines = 0;
  const chars = new Set<string>();
  for (const b of blocks) {
    lines++;
    words += (b.text.match(/\S+/g) || []).length;
    if (b.type === "scene") {
      if (/^INT\./i.test(b.text)) intC++;
      else if (/^EXT\./i.test(b.text)) extC++;
      else if (/^I\/E\./i.test(b.text)) ieC++;
    }
    if (b.type === "character") {
      chars.add(b.text.replace(/\(.*\)/g, "").trim());
    }
  }
  return {
    sceneCount: intC + extC + ieC,
    intCount: intC, extCount: extC, ieCount: ieC,
    wordCount: words, lineCount: lines,
    characters: Array.from(chars).filter(Boolean),
  };
}
