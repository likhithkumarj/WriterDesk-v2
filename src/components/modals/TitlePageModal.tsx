import React, { useState } from "react";
import { TitlePage } from "../../types/screenplay";

export function TitlePageModal({
  initial,
  defaultTitle = "",
  defaultAuthor = "",
  defaultContact = "",
  onClose,
  onSave,
}: {
  initial?: TitlePage;
  defaultTitle?: string;
  defaultAuthor?: string;
  defaultContact?: string;
  onClose: () => void;
  onSave: (tp: TitlePage) => void;
}) {
  const getStoredUser = () => {
    try {
      const raw = localStorage.getItem("writerdesk_user");
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {}
    return null;
  };

  const storedUser = getStoredUser();

  const resolvedTitle = (initial?.title && initial.title.trim()) || defaultTitle.trim() || "UNTITLED SCREENPLAY";
  const resolvedAuthor = (initial?.author && initial.author.trim()) || defaultAuthor.trim() || storedUser?.name || (storedUser?.email ? storedUser.email.split("@")[0] : "Writer");
  const resolvedContact = (initial?.contact && initial.contact.trim()) || defaultContact.trim() || storedUser?.email || "";
  const resolvedCredit = (initial?.credit && initial.credit.trim()) || "Written by";
  const resolvedDraftDate = (initial?.draftDate && initial.draftDate.trim()) || `Draft 1 · ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const [tp, setTp] = useState<TitlePage>({
    title: resolvedTitle.toUpperCase(),
    credit: resolvedCredit,
    author: resolvedAuthor,
    source: initial?.source || "",
    draftDate: resolvedDraftDate,
    contact: resolvedContact,
  });

  const f = (k: keyof TitlePage) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setTp({ ...tp, [k]: e.target.value });

  return (
    <div className="sp-modal-backdrop" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Title Page</h2>
        <p style={{ fontSize: 12, color: "var(--sp-muted)", marginBottom: 14 }}>Industry-standard cover page shown before the screenplay.</p>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Title</label>
        <input className="sp-input" value={tp.title} onChange={f("title")} placeholder="THE RAIN HOURS" style={{ marginBottom: 10 }} autoFocus />
        <label style={{ fontSize: 12, fontWeight: 600 }}>Credit</label>
        <input className="sp-input" value={tp.credit} onChange={f("credit")} placeholder="Written by" style={{ marginBottom: 10 }} />
        <label style={{ fontSize: 12, fontWeight: 600 }}>Author</label>
        <input className="sp-input" value={tp.author} onChange={f("author")} placeholder="Jane Doe" style={{ marginBottom: 10 }} />
        <label style={{ fontSize: 12, fontWeight: 600 }}>Based on (optional)</label>
        <input className="sp-input" value={tp.source} onChange={f("source")} placeholder="Based on the novel by…" style={{ marginBottom: 10 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Contact</label>
            <textarea className="sp-input" value={tp.contact} onChange={f("contact")} rows={3} placeholder={"Name\nEmail\nPhone"} style={{ resize: "vertical" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Draft date</label>
            <input className="sp-input" value={tp.draftDate} onChange={f("draftDate")} placeholder="First Draft — Jan 2026" />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 16 }}>
          <button className="sp-btn" onClick={() => onSave({ title: "", credit: "", author: "", source: "", draftDate: "", contact: "" })}>Remove title page</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="sp-btn" onClick={onClose}>Cancel</button>
            <button className="sp-btn sp-btn-primary" disabled={!tp.title.trim()} onClick={() => onSave(tp)}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
