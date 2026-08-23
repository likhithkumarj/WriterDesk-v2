import { Block, BlockType } from "../types/screenplay";

export function paginate(blocks: Block[]): Block[][] {
  if (!blocks || blocks.length === 0) return [[]];

  const pages: Block[][] = [[]];
  let lines = 0;
  const maxLinesPerPage = 54;
  const widthForType: Record<BlockType, number> = {
    scene: 60,
    action: 60,
    character: 35,
    parenthetical: 30,
    dialogue: 35,
  };

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const text = b.text ? b.text.replace(/<[^>]*>/g, "").trim() : "";
    const w = widthForType[b.type] || 60;
    const txtLines = Math.max(1, Math.ceil((text || " ").length / w));
    const spacing = i === 0 ? 0 : b.type === "scene" ? 1.5 : b.type === "character" ? 1 : 0.75;

    if (lines + txtLines + spacing > maxLinesPerPage && pages[pages.length - 1].length) {
      pages.push([]);
      lines = 0;
    }
    pages[pages.length - 1].push(b);
    lines += txtLines + spacing;
  }
  return pages;
}

export function calculateScriptPages(blocks: Block[], hasTitlePage: boolean = false): number {
  if (!blocks || blocks.length === 0) {
    return hasTitlePage ? 2 : 1;
  }

  let endIdx = blocks.length - 1;
  while (endIdx >= 0 && (!blocks[endIdx].text || !blocks[endIdx].text.trim())) {
    endIdx--;
  }
  if (endIdx < 0) return hasTitlePage ? 2 : 1;

  const activeBlocks = blocks.slice(0, endIdx + 1);
  let totalLines = 0;
  let pageCount = 1;
  const maxLinesPerPage = 54;

  const widthForType: Record<string, number> = {
    scene: 60,
    action: 60,
    character: 35,
    parenthetical: 30,
    dialogue: 35,
  };

  for (let i = 0; i < activeBlocks.length; i++) {
    const b = activeBlocks[i];
    const text = b.text ? b.text.replace(/<[^>]*>/g, "").trim() : "";
    if (!text) continue;

    const type = b.type || "action";
    const width = widthForType[type] || 60;
    const spacing = i === 0 ? 0 : type === "scene" ? 1.5 : type === "character" ? 1 : 0.75;
    const textLines = Math.max(1, Math.ceil(text.length / width));
    const blockLines = textLines + spacing;

    if (totalLines + blockLines > maxLinesPerPage && totalLines > 0) {
      pageCount++;
      totalLines = textLines;
    } else {
      totalLines += blockLines;
    }
  }

  return pageCount + (hasTitlePage ? 1 : 0);
}
