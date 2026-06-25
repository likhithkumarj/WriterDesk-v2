# ✍️ WriterDesk (v2.0)

A professional, feature-rich web-based screenplay workspace designed for screenwriters, novelists, and storytellers. It allows creators to write scripts, manage multi-file projects, customize page styling, back up local workspaces, and engage with a community of writers—all within a beautiful, modern user interface.

---

## 🚀 Key Features

* **Automatic Screenplay Editor:** Industry-standard formatting (Scene Headings, Action, Characters, Dialogue) with outline navigation sidebar and live script statistics.
* **Redesigned Multi-File Workspace:** Organize acts, treatments, outlines, and character bibles in a single interface with live project word counts.
* **Import & Export Systems:** Import from `.fountain`, `.txt`, or `.md` drafts; export to industry-standard PDFs, `.fountain` files, or `.json` backups.
* **Writers Lounge Feed:** Social community feed to post updates, share Courier-formatted script snippets, and discuss screenplay structures.
* **Script Explorer:** Browse, search, and read public screenplays written by community authors.
* **Custom Themes & Zoom:** Midnight Gold, Cyberpunk Purple, Forest Green, and Classic Dark layouts with scalable editor zoom.
* **Interactive Document Planners (Added: June 22, 2026):**
  * *Idea Editor:* Notion-style rich-text note editor supporting headings, lists, checklists, links, and tags.
  * *Character Worksheet:* Structured profile card forms and a tabular side-by-side comparison grid.
  * *Outline Tree:* Hierarchical tree planner (Acts ➔ Sequences ➔ Beats ➔ Notes) with collapsing nodes and sibling reordering.

---

## 🛠️ Technology Stack

* **Frontend:** React 19, TypeScript, TailwindCSS 4
* **Build System:** Vite 7
* **Database & Auth:** Supabase (real-time sync layer)
* **Icons:** Lucide React

---

## 🏁 Quick Start

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Build production bundle
npm run build
```

---

## 📝 Screenplay Layout Guide

Standard screenplay formatting relies on specific indents. Pressing **Tab** or **Enter** cycles through elements naturally.

```text
                                 [ SCENE HEADING ]
            
            This is an action block. It stretches across the full width
            of the page margins.
            
                                     CHARACTER
                               (Parenthetical note)
                          This is dialogue. It is centered
                          with margins on both sides.
```
