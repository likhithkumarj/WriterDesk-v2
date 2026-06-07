import React, { useState } from "react";
import { Project, FileDoc } from "../../types/screenplay";
import { uid } from "../../utils/uid";
import { parseFountain } from "../../utils/import";
import { paginate } from "../../utils/pagination";
import { ExportModal } from "../modals/ExportModal";

export function FilesScreen({
  project, back, persist, openFile,
}: { project: Project; back: () => void; persist: (p: Project) => void; openFile: (id: string) => void }) {
  const [showExport, setShowExport] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const addFile = () => {
    const t = window.prompt("File title", "Untitled");
    if (!t) return;
    persist({
      ...project, dateModified: Date.now(),
      files: [...project.files, { id: uid(), title: t, dateModified: Date.now(), blocks: [{ id: uid(), type: "scene", text: "INT. NEW LOCATION - DAY" }] }],
    });
  };
  const renameFile = (id: string) => {
    const f = project.files.find((x) => x.id === id); if (!f) return;
    const t = window.prompt("Rename file", f.title); if (!t) return;
    persist({ ...project, files: project.files.map((x) => x.id === id ? { ...x, title: t, dateModified: Date.now() } : x) });
  };
  const duplicateFile = (id: string) => {
    const f = project.files.find((x) => x.id === id); if (!f) return;
    persist({ ...project, files: [...project.files, { ...f, id: uid(), title: f.title + " (copy)", dateModified: Date.now(), blocks: f.blocks.map(b => ({...b, id: uid()})) }] });
  };
  const deleteFile = (id: string) => {
    if (!window.confirm("Delete this file?")) return;
    persist({ ...project, files: project.files.filter((x) => x.id !== id) });
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (overId: string) => {
    if (!dragId || dragId === overId) return;
    const files = [...project.files];
    const fromIdx = files.findIndex((f) => f.id === dragId);
    const toIdx = files.findIndex((f) => f.id === overId);
    const [moved] = files.splice(fromIdx, 1);
    files.splice(toIdx, 0, moved);
    persist({ ...project, files });
    setDragId(null);
  };

  const importFiles = (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return;
    const readers = Array.from(fileList).map(
      (f) =>
        new Promise<FileDoc>((resolve) => {
          const r = new FileReader();
          r.onload = () => {
            const text = String(r.result || "");
            const title = f.name.replace(/\\.(fountain|txt|md)$/i, "");
            resolve({ id: uid(), title, dateModified: Date.now(), blocks: parseFountain(text) });
          };
          r.readAsText(f);
        })
    );
    Promise.all(readers).then((newFiles) => {
      persist({ ...project, dateModified: Date.now(), files: [...project.files, ...newFiles] });
    });
  };

  return (
    <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button className="sp-btn" onClick={back}>← Back</button>
        <h1 style={{ fontSize: 24, fontWeight: 700, flex: 1, minWidth: "150px" }}>{project.title}</h1>
        <button className="sp-btn" onClick={() => setShowExport(true)}>Export Project</button>
        <label className="sp-btn" style={{ cursor: "pointer" }}>
          ↑ Import
          <input type="file" accept=".fountain,.txt,.md,text/plain" multiple style={{ display: "none" }} onChange={(e) => { importFiles(e.target.files); e.target.value = ""; }} />
        </label>
        <button className="sp-btn sp-btn-primary" onClick={addFile}>+ New File</button>
      </div>


      {project.files.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--sp-muted)", padding: 48 }}>No files yet. Add your first file.</p>
      ) : (
        <div>
          {project.files.map((f) => {
            const pageCount = Math.max(1, paginate(f.blocks).length);
            return (
              <div
                key={f.id}
                className="sp-file-row"
                draggable
                onDragStart={() => setDragId(f.id)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(f.id)}
                onClick={() => openFile(f.id)}
              >
                <span style={{ cursor: "grab", color: "var(--sp-muted)" }}>⋮⋮</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "var(--sp-muted)" }}>
                    {pageCount} page{pageCount === 1 ? "" : "s"} · {new Date(f.dateModified).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ position: "relative" }} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === f.id ? null : f.id); }}>
                  <button className="sp-btn" style={{ padding: "2px 8px" }}>⋯</button>
                  {openMenu === f.id && (
                    <div className="sp-menu" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { renameFile(f.id); setOpenMenu(null); }}>Rename</button>
                      <button onClick={() => { duplicateFile(f.id); setOpenMenu(null); }}>Duplicate</button>
                      <button onClick={() => { deleteFile(f.id); setOpenMenu(null); }}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showExport && <ExportModal project={project} defaultFileId={null} onClose={() => setShowExport(false)} />}
    </div>
  );
}
