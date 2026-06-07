import React, { useState } from "react";

export function NewProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (t: string, d: string) => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  return (
    <div className="sp-modal-backdrop" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>New Project</h2>
        <input className="sp-input" placeholder="Project title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus style={{ marginBottom: 12 }} />
        <textarea className="sp-input" placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} style={{ marginBottom: 16, resize: "vertical" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="sp-btn" onClick={onClose}>Cancel</button>
          <button className="sp-btn sp-btn-primary" disabled={!title.trim()} onClick={() => onCreate(title.trim(), desc.trim())}>Create</button>
        </div>
      </div>
    </div>
  );
}
