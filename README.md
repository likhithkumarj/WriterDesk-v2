# WriterDesk (v2.0)

A professional, feature-rich web-based screenplay workspace designed for screenwriters, novelists, and storytellers. It allows creators to write scripts, manage multi-file projects, customize page styling, back up local workspaces, and engage with a community of writers—all within a beautiful, clean modern user interface.

---

## 🚀 Key Features

* **Single-Text Screenplay Editor (Updated: July 2026):**
  * **Visual Page Breaks (MS Word Style):** Renders repeating A4 pages (`794px x 1123px`) with drop-shadows and page spacing. Pages dynamically recalculate margins so elements push clean layout shifts.
  * **Physical Screenplay Margins:** Conformed the editor and print styles to standard screenplay layouts using physical measurements: `25.4mm` (1 inch) top, bottom, and right margins; and `38.1mm` (1.5 inch) left binding margins.
  * **Native Copy-Pasting & Auto-Formatting:** Features smooth inline text pasting. Clipboard parser automatically detects standard colon dialog formatting (e.g. `CharacterName: Dialog Text`) and formats them into Character and Dialogue blocks.
  * **Reliable Pagination:** Fixed page-cutting algorithms to account for element heights *plus* their CSS margin-top offsets (e.g., scene headings margins), resolving overlaps and page bleed.
  * **Undo/Redo with Caret Memory:** Focuses precisely on editing blocks upon state undo.
* **Glitch-Free Auto-Save Pipeline:**
  * **Immediate Local Saves (0ms Delay):** Changes write to memory and `localStorage` instantly.
  * **Sequential Background Sync Queue:** State changes are pushed to a single-flight background sync queue (`syncQueueRef`). Intermediate updates are collapsed, preventing parallel database sync requests and data race conditions.
  * **Active Typing Protection Lock:** Implements a keystroke lock (`lastTypingTimeRef`). Real-time incoming database updates are ignored for 5 seconds after typing, preventing cursor jumps, state echo loops, and caret reverts.
* **Interactive Document Planners:**
  * *Shot List Editor:* Spreadsheet-style camera planner supporting Scene #, Shot #, Description, Camera Type, Angle, Movement, Lens, and Status. Supports responsive columns, automatic script scene generation, and CSV/PDF export.
  * *Idea Editor:* Notion-style note editor supporting headings, lists, checklists, links, and tags.
  * *Character Worksheet:* Structured profile cards and a comparison grid.
  * *Outline Tree:* Collapsible hierarchical outline trees (Acts ➔ Sequences ➔ Beats ➔ Notes).
* **Multi-File Workspace & Database Security:**
  * **Case-Insensitive Collaborations:** SQL database policy checks use case-insensitive matching (`LOWER(invited_email)`), resolving login access issues for collaborators with casing discrepancies.
  * **Ownership Protection Sync:** Enforces strict owner IDs so collaborator sync operations cannot overwrite project ownership metadata.
  * **Smart Auto-Incrementing Titles:** Suggests next available default file titles (e.g., `Draft 1` ➔ `Draft 2`, `shotList` ➔ `shotList 2`) based on existing files in the project.
* **High-Performance PDF Export:**
  * Switched from heavy, blocking `html2pdf.js` libraries to the browser's native vector print engine (`window.print()`) in an isolated print window. Exports are instant, producing searchable vector PDFs without blocking the editor UI thread.

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
