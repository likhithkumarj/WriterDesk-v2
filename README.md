# ✍️ WriterDesk (v2.0)

A professional, feature-rich web-based screenplay workspace designed for screenwriters, novelists, and storytellers. It allows creators to write scripts, manage multi-file projects, customize page styling, back up local workspaces, and engage with a community of writers—all within a beautiful, modern user interface.

---

## 🚀 Key Features

* **Single-Text Screenplay Editor (Updated: July 2, 2026):**
  * Replaced the slow block-by-block editor with a single continuous text canvas.
  * Supported **native copy-pasting, highlighting, selection, and line deletions** across multiple pages.
  * Incorporated a **smart paste interceptor** that parses Fountain screenplay text on-the-fly and splits them into flat sibling lines (no nested formatting staircase).
  * Butter-smooth **60fps typing performance** via debounced state syncing (400ms delay), with instant syncing on explicit format changes.
  * Reliable **Undo/Redo with Caret Memory** that restores the cursor precisely to the relative line index, with disabled toolbar button states.
* **Interactive Document Planners:**
  * *Shot List Editor (Added: July 1, 2026):* Spreadsheet-style table planner supporting Scene #, Shot #, Description, Camera Type, Angle, Movement, Lens, and Status. Responsive bi-directional scroll (frozen columns on mobile), automatic script scene generation, and CSV/PDF export.
  * *Idea Editor:* Notion-style rich-text note editor supporting headings, lists, checklists, links, and tags.
  * *Character Worksheet:* Structured profile card forms and a tabular side-by-side comparison grid.
  * *Outline Tree:* Hierarchical tree planner (Acts ➔ Sequences ➔ Beats ➔ Notes) with collapsing nodes and sibling reordering.
* **Redesigned Multi-File Workspace:** Organize acts, treatments, outlines, and character bibles in a single interface with live project word counts.
* **Import & Export Systems:** Import from `.fountain`, `.txt`, or `.md` drafts; export to industry-standard PDFs, CSVs, `.fountain` files, or `.json` backups.
* **Writers Lounge Feed:** Social community feed to post updates, share Courier-formatted script snippets, and discuss screenplay structures.
* **Script Explorer:** Browse, search, and read public screenplays written by community authors.
* **Collaborator Custom Avatars:** Displays actual uploaded user profiles in the authors/collaborators listing rather than random seeded icons.
* **Custom Themes & Zoom:** Midnight Gold, Cyberpunk Purple, Forest Green, and Classic Dark layouts with scalable editor zoom.

---

## 🛠️ Technology Stack

* **Frontend:** React 19, TypeScript, TailwindCSS 4
* **Build System:** Vite 7
* **Database & Auth:** Supabase (real-time sync layer)
* **Icons:** Lucide React

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
