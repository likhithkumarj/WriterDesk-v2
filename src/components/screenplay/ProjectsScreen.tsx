import React, { useState } from "react";
import { Project, Store } from "../../types/screenplay";
import { uid } from "../../utils/uid";
import { NewProjectModal } from "../modals/NewProjectModal";

export function ProjectsScreen({
  store, persist, openProject,
}: { store: Store; persist: (s: Store) => void; openProject: (id: string) => void }) {
  const [showNew, setShowNew] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const createProject = (title: string, description: string) => {
    const p: Project = {
      id: uid(), title, description,
      dateCreated: Date.now(), dateModified: Date.now(), files: [],
    };
    persist({ ...store, projects: [p, ...store.projects] });
  };
  const renameProject = (id: string) => {
    const p = store.projects.find((x) => x.id === id);
    if (!p) return;
    const t = window.prompt("Rename project", p.title);
    if (!t) return;
    persist({ ...store, projects: store.projects.map((x) => x.id === id ? { ...x, title: t, dateModified: Date.now() } : x) });
  };
  const duplicateProject = (id: string) => {
    const p = store.projects.find((x) => x.id === id);
    if (!p) return;
    const np: Project = { ...p, id: uid(), title: p.title + " (copy)", dateCreated: Date.now(), dateModified: Date.now(), files: p.files.map(f => ({ ...f, id: uid(), blocks: f.blocks.map(b => ({...b, id: uid()})) })) };
    persist({ ...store, projects: [np, ...store.projects] });
  };
  const deleteProject = (id: string) => {
    if (!window.confirm("Delete this project?")) return;
    persist({ ...store, projects: store.projects.filter((x) => x.id !== id) });
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", marginBottom: 32, gap: 16 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em" }}>Screenplay</h1>
        <button className="sp-btn sp-btn-primary" onClick={() => setShowNew(true)}>+ New Project</button>
      </div>

      {store.projects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <svg width="120" height="120" viewBox="0 0 120 120" style={{ margin: "0 auto 24px", display: "block" }}>
            <rect x="20" y="15" width="80" height="100" rx="4" fill="none" stroke="#E8B84B" strokeWidth="2"/>
            <line x1="35" y1="40" x2="85" y2="40" stroke="#E8B84B" strokeWidth="2"/>
            <line x1="35" y1="55" x2="75" y2="55" stroke="#E8B84B" strokeWidth="2" opacity="0.5"/>
            <line x1="35" y1="70" x2="80" y2="70" stroke="#E8B84B" strokeWidth="2" opacity="0.5"/>
            <line x1="35" y1="85" x2="70" y2="85" stroke="#E8B84B" strokeWidth="2" opacity="0.5"/>
          </svg>
          <p style={{ marginBottom: 16, color: "var(--sp-muted)" }}>No projects yet. Start your first screenplay.</p>
          <button className="sp-btn sp-btn-primary" onClick={() => setShowNew(true)}>Create your first project</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
          {store.projects.map((p) => (
            <div key={p.id} className="sp-card" style={{ position: "relative" }} onClick={() => openProject(p.id)}>
              <div style={{ position: "absolute", top: 8, right: 8 }} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === p.id ? null : p.id); }}>
                <button className="sp-btn" style={{ padding: "2px 8px" }}>⋯</button>
                {openMenu === p.id && (
                  <div className="sp-menu" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { renameProject(p.id); setOpenMenu(null); }}>Rename</button>
                    <button onClick={() => { duplicateProject(p.id); setOpenMenu(null); }}>Duplicate</button>
                    <button onClick={() => { deleteProject(p.id); setOpenMenu(null); }}>Delete</button>
                  </div>
                )}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, paddingRight: 32 }}>{p.title}</h3>
              {p.description && <p style={{ fontSize: 13, color: "var(--sp-muted)", marginBottom: 12 }}>{p.description}</p>}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--sp-muted)" }}>
                <span>{p.files.length} file{p.files.length === 1 ? "" : "s"}</span>
                <span>{new Date(p.dateModified).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onCreate={(t, d) => { createProject(t, d); setShowNew(false); }} />}
    </div>
  );
}
