import React from "react";
import { ChevronLeft, Undo2, Redo2, Hash, PanelLeft, Film, FileText, FolderPlus, Upload, BookOpen, Download, HelpCircle } from "lucide-react";
import { Block, BlockType, FileDoc, Project } from "../../types/screenplay";
import { TYPE_ORDER, TYPE_LABEL } from "../../utils/formatting";
import { TYPE_ICONS } from "./constants";
import { uid } from "../../utils/uid";
import { parseFountain } from "../../utils/import";

export function Toolbar({
  project,
  file,
  blocks,
  focusedId,
  sceneNumbersOn,
  showScenes,
  stats,
  pagesCount,
  back,
  setType,
  dispatch,
  setSceneNumbersOn,
  setShowScenes,
  addFiles,
  setShowTitlePage,
  setShowExport,
  setShowHelp,
}: {
  project: Project;
  file: FileDoc;
  blocks: Block[];
  focusedId: string | null;
  sceneNumbersOn: boolean;
  showScenes: boolean;
  stats: any;
  pagesCount: number;
  back: () => void;
  setType: (id: string, t: BlockType) => void;
  dispatch: any;
  setSceneNumbersOn: any;
  setShowScenes: any;
  addFiles: (files: FileDoc[], openId?: string) => void;
  setShowTitlePage: (v: boolean) => void;
  setShowExport: (v: boolean) => void;
  setShowHelp: (v: boolean) => void;
}) {
  const typeShortcut: Record<BlockType, string> = {
    scene: "1", action: "2", character: "3", parenthetical: "4", dialogue: "5",
  };

  return (
    <>
      <div className="sp-toolbar sp-no-print" style={{ borderBottom: "1px solid var(--sp-border)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <button className="sp-btn sp-btn-ghost" onClick={back} title="Back to files">
          <ChevronLeft size={16} /> {project.title}
        </button>
        <div style={{ width: 1, height: 20, background: "var(--sp-border)" }} />
        <FileText size={14} style={{ color: "var(--sp-muted)" }} />
        <h2 style={{ fontSize: 15, fontWeight: 600, flex: 1, margin: 0 }}>{file.title}</h2>
      </div>

      <div className="sp-toolbar sp-no-print" style={{ borderBottom: "1px solid var(--sp-border)", padding: "8px 16px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
          {TYPE_ORDER.map((t) => {
            const Icon = TYPE_ICONS[t];
            const active = focusedId ? blocks.find((b) => b.id === focusedId)?.type === t : false;
            return (
              <button
                key={t}
                className={`sp-btn \${active ? "sp-btn-active" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => focusedId && setType(focusedId, t)}
                title={`${TYPE_LABEL[t]} (Ctrl+${typeShortcut[t]})`}
              >
                <Icon size={14} /> {TYPE_LABEL[t]} <span className="sp-kbd">⌘{typeShortcut[t]}</span>
              </button>
            );
          })}
        </div>
        <div style={{ width: 1, height: 24, background: "var(--sp-border)", margin: "0 4px" }} />
        <button className="sp-btn sp-btn-ghost" onClick={() => dispatch({ type: "undo" })} title="Undo (Ctrl+Z)"><Undo2 size={14} /></button>
        <button className="sp-btn sp-btn-ghost" onClick={() => dispatch({ type: "redo" })} title="Redo (Ctrl+Shift+Z)"><Redo2 size={14} /></button>
        <button
          className={`sp-btn \${sceneNumbersOn ? "sp-btn-active" : ""}`}
          onClick={() => setSceneNumbersOn((v: boolean) => !v)}
          title="Toggle scene numbers"
        >
          <Hash size={14} /> Scene #
        </button>
        <button
          className={`sp-btn \${showScenes ? "sp-btn-active" : ""}`}
          onClick={() => setShowScenes((v: boolean) => !v)}
          title="Toggle sidebar (Ctrl+B)"
        >
          <PanelLeft size={14} /> Scenes
        </button>
        <div style={{ flex: 1 }} />
        <span className="sp-badge"><Film size={11} /> {stats.sceneCount}</span>
        <span className="sp-badge"><FileText size={11} /> ~{pagesCount}p</span>
        <span className="sp-badge">{stats.wordCount}w</span>
        <button className="sp-btn" onClick={() => {
          const t = window.prompt("File title", "Untitled");
          if (!t) return;
          const nf: FileDoc = { id: uid(), title: t, dateModified: Date.now(), blocks: [{ id: uid(), type: "scene", text: "INT. NEW LOCATION - DAY" }] };
          addFiles([nf], nf.id);
        }} title="New file"><FolderPlus size={14} /> New</button>
        <label className="sp-btn" style={{ cursor: "pointer" }} title="Import Fountain / TXT">
          <Upload size={14} /> Import
          <input type="file" accept=".fountain,.txt,.md,text/plain" multiple style={{ display: "none" }} onChange={(e) => {
            const fl = e.target.files;
            if (!fl || !fl.length) return;
            const readers = Array.from(fl).map((f) => new Promise<FileDoc>((resolve) => {
              const r = new FileReader();
              r.onload = () => {
                const text = String(r.result || "");
                const title = f.name.replace(/\\.(fountain|txt|md)$/i, "");
                resolve({ id: uid(), title, dateModified: Date.now(), blocks: parseFountain(text) });
              };
              r.readAsText(f);
            }));
            Promise.all(readers).then((nf) => addFiles(nf, nf[0]?.id));
            e.target.value = "";
          }} />
        </label>
        <button className="sp-btn" onClick={() => setShowTitlePage(true)} title="Title Page">
          <BookOpen size={14} /> Title Page
        </button>
        <button className="sp-btn sp-btn-primary" onClick={() => setShowExport(true)} title="Export"><Download size={14} /> Export</button>
        <button className="sp-btn sp-btn-ghost sp-btn-icon" onClick={() => setShowHelp(true)} title="Shortcuts (Ctrl+/)"><HelpCircle size={16} /></button>
      </div>
    </>
  );
}
