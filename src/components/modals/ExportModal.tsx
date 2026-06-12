import React, { useState } from "react";
import { Project } from "../../types/screenplay";
import { blocksToTxt, blocksToFountain, download, printPDF } from "../../utils/export";

export function ExportModal({ project, defaultFileId, onClose }: { project: Project; defaultFileId: string | null; onClose: () => void }) {
  const [mode, setMode] = useState<"individual" | "combined">(defaultFileId ? "individual" : "combined");
  const [format, setFormat] = useState<"pdf" | "txt" | "fountain">("pdf");
  const [order, setOrder] = useState<string[]>(project.files.map((f) => f.id));
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultFileId ? [defaultFileId] : project.files.map((f) => f.id)));
  const [dragId, setDragId] = useState<string | null>(null);

  const filesInOrder = order.map((id) => project.files.find((f) => f.id === id)!).filter(Boolean);

  const doExport = () => {
    const targets = filesInOrder.filter((f) => selected.has(f.id));
    if (!targets.length) return;

    if (format === "pdf") {
      // for PDF, use print on a temporary window with the combined or single content
      printPDF(project, targets, mode === "combined");
      onClose();
      return;
    }

    if (mode === "combined") {
      const content = targets.map((f) =>
        (format === "txt" ? blocksToTxt(f.blocks) : blocksToFountain(f.blocks))
      ).join("\\n\\n=== PAGE BREAK ===\\n\\n");
      download(`${project.title}.${format === "txt" ? "txt" : "fountain"}`, content);
    } else {
      targets.forEach((f) => {
        const content = format === "txt" ? blocksToTxt(f.blocks) : blocksToFountain(f.blocks);
        download(`${f.title}.${format === "txt" ? "txt" : "fountain"}`, content);
      });
    }
    onClose();
  };

  const onDrop = (overId: string) => {
    if (!dragId || dragId === overId) return;
    const next = [...order];
    const from = next.indexOf(dragId);
    const to = next.indexOf(overId);
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setOrder(next);
    setDragId(null);
  };

  return (
    <div className="sp-modal-backdrop" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Export</h2>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Mode</div>
          <label style={{ display: "block", marginBottom: 4 }}>
            <input type="radio" checked={mode === "individual"} onChange={() => setMode("individual")} /> Individual files
          </label>
          <label style={{ display: "block" }}>
            <input type="radio" checked={mode === "combined"} onChange={() => setMode("combined")} /> Combined into one document
          </label>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Format</div>
          {(["pdf", "txt", "fountain"] as const).map((f) => (
            <label key={f} style={{ marginRight: 12 }}>
              <input type="radio" checked={format === f} onChange={() => setFormat(f)} /> {f.toUpperCase()}
            </label>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Files (drag to reorder)</div>
          {filesInOrder.map((f) => (
            <div
              key={f.id}
              draggable
              onDragStart={() => setDragId(f.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(f.id)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px solid var(--sp-border)", borderRadius: 10, marginBottom: 6, background: "rgba(255, 255, 255, 0.02)" }}
            >
              <span style={{ cursor: "grab", color: "var(--sp-muted)" }}>⋮⋮</span>
              <input type="checkbox" checked={selected.has(f.id)} onChange={(e) => {
                const s = new Set(selected);
                if (e.target.checked) s.add(f.id); else s.delete(f.id);
                setSelected(s);
              }} />
              <span style={{ flex: 1, fontSize: 13 }}>{f.title}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="sp-btn" onClick={onClose}>Cancel</button>
          <button className="sp-btn sp-btn-primary" onClick={doExport}>Export</button>
        </div>
      </div>
    </div>
  );
}
