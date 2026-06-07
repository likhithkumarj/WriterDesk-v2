import React from "react";

export function HelpModal({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ["Enter", "New block (smart type)"],
    ["Tab", "Cycle element type"],
    ["Backspace", "Delete empty block"],
    ["Ctrl/Cmd + 1", "Set Scene Heading"],
    ["Ctrl/Cmd + 2", "Set Action"],
    ["Ctrl/Cmd + 3", "Set Character"],
    ["Ctrl/Cmd + 4", "Set Parenthetical"],
    ["Ctrl/Cmd + 5", "Set Dialogue"],
    ["Ctrl/Cmd + B", "Toggle Scenes sidebar"],
    ["Ctrl/Cmd + Z", "Undo"],
    ["Ctrl/Cmd + Shift + Z", "Redo"],
    ["Ctrl/Cmd + S", "Save"],
    ["Ctrl/Cmd + /", "Shortcuts"],
  ];
  return (
    <div className="sp-modal-backdrop" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Keyboard Shortcuts</h2>
        <table style={{ width: "100%", fontSize: 14 }}>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k}>
                <td style={{ padding: "6px 0", fontFamily: "monospace", color: "#666" }}>{k}</td>
                <td style={{ padding: "6px 0", textAlign: "right" }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button className="sp-btn sp-btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
