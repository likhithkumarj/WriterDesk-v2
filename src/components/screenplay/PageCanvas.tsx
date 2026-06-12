import React from "react";
import { Block, BlockType, FileDoc, Suggestion } from "../../types/screenplay";
import { BlockView } from "./BlockView";
import { TitlePageView } from "./TitlePageView";
import { normalizeText } from "../../utils/formatting";

export function PageCanvas({
  pages,
  file,
  focusedId,
  sceneNumbersOn,
  sceneNumberFor,
  suggestionsFor,
  setFocusedId,
  updateBlock,
  insertAfter,
  nextTypeOnEnter,
  deleteBlock,
  cycleType,
  showBlockBars,
}: {
  pages: Block[][];
  file: FileDoc;
  focusedId: string | null;
  sceneNumbersOn: boolean;
  sceneNumberFor: (id: string) => number | undefined;
  suggestionsFor: (b: Block) => Suggestion[];
  setFocusedId: (id: string) => void;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  insertAfter: (id: string, type: BlockType) => void;
  nextTypeOnEnter: (t: BlockType, text: string) => BlockType;
  deleteBlock: (id: string) => void;
  cycleType: (id: string) => void;
  showBlockBars: boolean;
}) {
  const hasTitlePage = !!(file.titlePage && file.titlePage.title.trim());

  return (
    <>
      {hasTitlePage && file.titlePage && (
        <div className="sp-page-wrapper">
          <div className="sp-page" aria-label="Title page">
            <TitlePageView tp={file.titlePage} />
          </div>
        </div>
      )}
      {pages.map((pageBlocks, pi) => (
        <div key={pi} className="sp-page-wrapper">
          <div className="sp-page">
            {pi > 0 && <div className="sp-page-number">{pi + 1}.</div>}
            <div className="sp-page-inner">
              {pageBlocks.map((b) => (
                <BlockView
                  key={b.id}
                  block={b}
                  focused={focusedId === b.id}
                  sceneNumber={b.type === "scene" && sceneNumbersOn ? sceneNumberFor(b.id) : undefined}
                  suggestions={suggestionsFor(b)}
                  onFocus={() => setFocusedId(b.id)}
                  onChange={(text) => updateBlock(b.id, { text })}
                  onBlur={(text) => updateBlock(b.id, { text: normalizeText(b.type, text) })}
                  onAcceptSuggestion={(text) => updateBlock(b.id, { text: normalizeText(b.type, text) })}
                  onEnter={() => insertAfter(b.id, nextTypeOnEnter(b.type, b.text))}
                  onBackspaceEmpty={() => deleteBlock(b.id)}
                  onTab={() => cycleType(b.id)}
                  showBlockBars={showBlockBars}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
