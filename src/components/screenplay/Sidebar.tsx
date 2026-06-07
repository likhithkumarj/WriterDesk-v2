import React from "react";
import { Film } from "lucide-react";

export function Sidebar({
  scenes,
  stats,
  pagesCount,
  scrollToBlock,
}: {
  scenes: { id: string; number: number; text: string }[];
  stats: any;
  pagesCount: number;
  scrollToBlock: (id: string) => void;
}) {
  return (
    <aside className="sp-sidebar sp-no-print" style={{ width: 260, borderRight: "1px solid var(--sp-border)", padding: 14, overflowY: "auto", flexShrink: 0 }}>
      <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sp-muted)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <Film size={12} /> Scenes
      </h3>
      {scenes.length === 0 && <p style={{ fontSize: 12, color: "var(--sp-muted)" }}>No scenes yet.</p>}
      {scenes.map((s) => (
        <button
          key={s.id}
          className="sp-scene-item"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => scrollToBlock(s.id)}
        >
          <span style={{ color: "var(--sp-accent)", fontWeight: 700, minWidth: 18 }}>{s.number}</span>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.text || "Untitled scene"}</span>
        </button>
      ))}
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--sp-border)" }}>
        <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sp-muted)", marginBottom: 10 }}>Stats</h3>
        <div style={{ fontSize: 12, lineHeight: 1.9, display: "grid", gridTemplateColumns: "1fr auto", rowGap: 2 }}>
          <span style={{ color: "var(--sp-muted)" }}>INT</span><span>{stats.intCount}</span>
          <span style={{ color: "var(--sp-muted)" }}>EXT</span><span>{stats.extCount}</span>
          <span style={{ color: "var(--sp-muted)" }}>I/E</span><span>{stats.ieCount}</span>
          <span style={{ color: "var(--sp-muted)" }}>Pages</span><span>~{pagesCount}</span>
          <span style={{ color: "var(--sp-muted)" }}>Words</span><span>{stats.wordCount}</span>
          <span style={{ color: "var(--sp-muted)" }}>Lines</span><span>{stats.lineCount}</span>
          <span style={{ color: "var(--sp-muted)" }}>Characters</span><span>{stats.characters.length}</span>
        </div>
      </div>
    </aside>
  );
}
