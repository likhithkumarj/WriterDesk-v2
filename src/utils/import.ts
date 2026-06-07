import { Block, BlockType } from "../types/screenplay";
import { uid } from "./uid";

const SCENE_RE = /^(INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s]/i;
export function parseFountain(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  if (lines[0] && /^[A-Za-z][A-Za-z ]*:\s/.test(lines[0])) {
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
    if (prevBlank && SCENE_RE.test(line)) {
      out.push({ id: uid(), type: "scene", text: line.toUpperCase() });
      lastType = "scene"; prevBlank = false; i++; continue;
    }
    if ((lastType === "character" || lastType === "dialogue") && line.startsWith("(") && line.endsWith(")")) {
      out.push({ id: uid(), type: "parenthetical", text: line });
      lastType = "parenthetical"; prevBlank = false; i++; continue;
    }
    const next = lines[i + 1];
    const stripped = line.replace(/\([^)]*\)/g, "").trim();
    const isUpper = stripped.length > 0 && stripped === stripped.toUpperCase() && /[A-Z]/.test(stripped);
    if (prevBlank && isUpper && next && next.trim() !== "") {
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
