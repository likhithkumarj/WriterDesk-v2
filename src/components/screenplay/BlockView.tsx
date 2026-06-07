import React, { useEffect, useRef, useState } from "react";
import { Block, Suggestion } from "../../types/screenplay";
import { TYPE_LABEL } from "../../utils/formatting";

export function BlockView({
  block, focused, sceneNumber, suggestions, onFocus, onChange, onEnter, onBackspaceEmpty, onTab, onAcceptSuggestion,
}: {
  block: Block; focused: boolean; sceneNumber?: number;
  suggestions: Suggestion[];
  onFocus: () => void; onChange: (t: string) => void;
  onEnter: () => void; onBackspaceEmpty: () => void; onTab: () => void;
  onAcceptSuggestion: (insert: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [sugIdx, setSugIdx] = useState(0);
  const [sugOpen, setSugOpen] = useState(true);

  // Sync external text changes into the DOM ONLY when not focused, so typing
  // never has its caret reset by a re-render.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.innerText !== block.text) el.innerText = block.text;
  }, [block.text]);

  useEffect(() => {
    if (focused && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
      const r = document.createRange();
      r.selectNodeContents(ref.current);
      r.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges(); sel?.addRange(r);
    }
  }, [focused]);

  // reset selection when suggestion list changes
  useEffect(() => { setSugIdx(0); setSugOpen(true); }, [block.text, block.type]);

  const showSug = focused && sugOpen && suggestions.length > 0;

  const accept = (i: number) => {
    const s = suggestions[i];
    if (!s) return;
    if (ref.current) ref.current.innerText = s.insert;
    onAcceptSuggestion(s.insert);
    setSugOpen(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (showSug) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSugIdx((i) => (i + 1) % suggestions.length); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSugIdx((i) => (i - 1 + suggestions.length) % suggestions.length); return; }
      if (e.key === "Tab")       { e.preventDefault(); accept(sugIdx); return; }
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); accept(sugIdx); return; }
      if (e.key === "Escape")    { e.preventDefault(); setSugOpen(false); return; }
    }
    if (e.key === "Enter") { e.preventDefault(); onEnter(); }
    else if (e.key === "Tab") { e.preventDefault(); onTab(); }
    else if (e.key === "Backspace" && !ref.current?.innerText) { e.preventDefault(); onBackspaceEmpty(); }
  };

  return (
    <div style={{ position: "relative" }}>
      {focused && <span className="sp-type-pill sp-no-print">{TYPE_LABEL[block.type]}</span>}
      {block.type === "scene" && sceneNumber !== undefined && (
        <>
          <span aria-hidden style={{ position: "absolute", left: "-3.5ch", top: 0, fontWeight: 700 }}>{sceneNumber}.</span>
          <span aria-hidden style={{ position: "absolute", right: "-3.5ch", top: 0, fontWeight: 700 }}>{sceneNumber}.</span>
        </>
      )}
      <div
        ref={ref}
        className="sp-block"
        data-block-id={block.id}
        data-type={block.type}
        data-placeholder={block.type === "scene" ? "INT. LOCATION - DAY" : ""}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => { onFocus(); setSugOpen(true); }}
        onInput={(e) => { setSugOpen(true); onChange((e.target as HTMLDivElement).innerText); }}
        onKeyDown={handleKey}
      />
      {showSug && (
        <div className="sp-suggest sp-no-print" onMouseDown={(e) => e.preventDefault()}>
          {suggestions.map((s, i) => (
            <div
              key={s.label + i}
              className="sp-suggest-item"
              data-active={i === sugIdx}
              onMouseEnter={() => setSugIdx(i)}
              onClick={() => accept(i)}
            >
              <span>{s.label}</span>
              {s.hint && <span className="sp-suggest-hint">{s.hint}</span>}
            </div>
          ))}
          <div style={{ padding: "4px 10px", fontSize: 10, color: "#999", borderTop: "1px solid #eee", marginTop: 2 }}>
            ↑↓ navigate · Tab/Enter accept · Esc dismiss
          </div>
        </div>
      )}
    </div>
  );
}
