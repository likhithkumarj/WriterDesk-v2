import { Block, BlockType } from "../types/screenplay";

export function paginate(blocks: Block[]): Block[][] {
  // approximate 55 lines per page
  const pages: Block[][] = [[]];
  let lines = 0;
  const widthForType: Record<BlockType, number> = {
    scene: 60, action: 60, character: 35, parenthetical: 30, dialogue: 35,
  };
  for (const b of blocks) {
    const w = widthForType[b.type];
    const txtLines = Math.max(1, Math.ceil((b.text || " ").length / w));
    const spacing = b.type === "scene" ? 2 : b.type === "character" ? 1 : 1;
    if (lines + txtLines + spacing > 55 && pages[pages.length - 1].length) {
      pages.push([]);
      lines = 0;
    }
    pages[pages.length - 1].push(b);
    lines += txtLines + spacing;
  }
  return pages;
}
