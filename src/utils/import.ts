import { Block, BlockType } from "../types/screenplay";
import { uid } from "./uid";

const SCENE_RE = /^(INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s]/i;
const TITLE_PAGE_KEYS = /^(title|author|authors|source|credit|draft date|contact|notes):\s/i;

export function parseFountain(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  if (lines[0] && TITLE_PAGE_KEYS.test(lines[0])) {
    while (i < lines.length && lines[i].trim() !== "") i++;
    while (i < lines.length && lines[i].trim() === "") i++;
  }
  const out: Block[] = [];
  let prevBlank = true;
  let lastType: BlockType | null = null;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { prevBlank = true; lastType = null; i++; continue; }
    if (line.startsWith("!")) { out.push({ id: uid(), type: "action", text: line.slice(1).trim() }); lastType = "action"; prevBlank = false; i++; continue; }
    if (line.startsWith(".") && !line.startsWith("..")) { out.push({ id: uid(), type: "scene", text: line.slice(1).trim().toUpperCase() }); lastType = "scene"; prevBlank = false; i++; continue; }
    if (line.startsWith("@")) { out.push({ id: uid(), type: "character", text: line.slice(1).trim().toUpperCase() }); lastType = "character"; prevBlank = false; i++; continue; }
    if (SCENE_RE.test(line)) {
      out.push({ id: uid(), type: "scene", text: line.toUpperCase() });
      lastType = "scene"; prevBlank = false; i++; continue;
    }
    
    // Parse character name and dialogue format (e.g. Likhith: Hello)
    const colonMatch = line.match(/^([A-Za-z][A-Za-z0-9\s()]*):\s*(.*)$/);
    if (colonMatch) {
      const charName = colonMatch[1].trim().toUpperCase();
      const dialogueText = colonMatch[2].trim();
      out.push({ id: uid(), type: "character", text: charName });
      out.push({ id: uid(), type: "dialogue", text: dialogueText });
      lastType = "dialogue";
      prevBlank = false;
      i++;
      continue;
    }

    if ((lastType === "character" || lastType === "dialogue") && line.startsWith("(") && line.endsWith(")")) {
      out.push({ id: uid(), type: "parenthetical", text: line });
      lastType = "parenthetical"; prevBlank = false; i++; continue;
    }
    const next = lines[i + 1];
    const stripped = line.replace(/\([^)]*\)/g, "").trim();
    const isUpper = stripped.length > 0 && stripped === stripped.toUpperCase() && /[A-Z]/.test(stripped);
    if (isUpper && next && next.trim() !== "") {
      out.push({ id: uid(), type: "character", text: line.toUpperCase() });
      lastType = "character"; prevBlank = false; i++; continue;
    }
    if (lastType === "character" || lastType === "parenthetical" || lastType === "dialogue") {
      if (lastType === "dialogue") out[out.length - 1].text += " " + line;
      else { out.push({ id: uid(), type: "dialogue", text: line }); lastType = "dialogue"; }
      prevBlank = false; i++; continue;
    }
    if (lastType === "action") out[out.length - 1].text += " " + line;
    else { out.push({ id: uid(), type: "action", text: line }); lastType = "action"; }
    prevBlank = false; i++;
  }
  return out.length ? out : [{ id: uid(), type: "scene", text: "INT. NEW LOCATION - DAY" }];
}
