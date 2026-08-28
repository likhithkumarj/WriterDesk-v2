# WriterDesk (v2.0)

A professional, feature-rich web-based screenplay workspace designed for screenwriters, novelists, and storytellers. It allows creators to write scripts, manage multi-file projects, customize page styling, back up local workspaces, and collaborate in real-time—all within a beautiful, modern user interface.

---

## 🚀 Key Features

### 🎬 Screenplay Editor
* **Continuous Visual Pagination (MS Word / Final Draft Style):** Repeating A4 sheet boundaries (`794px × 1123px`) with drop shadows, page gaps, and accurate pagination.
* **Physical Screenplay Margins:** Conforms to industry-standard physical screenplay formatting:
  * Left binding margin: `38.1mm` (1.5 inches)
  * Right, top, and bottom margins: `25.4mm` (1.0 inch)
* **Real-Time Autocomplete Dropdowns:**
  * **Scene Headings:** Instant suggestions for prefixes (`INT.`, `EXT.`, `INT./EXT.`, `I/E.`, `EST.`) and times of day (`- DAY`, `- NIGHT`, `- MORNING`, `- EVENING`, `- CONTINUOUS`, `- LATER`, `- MOMENTS LATER`, `- DUSK`, `- DAWN`).
  * **Character Names:** Suggests known characters from the script as you type for 1-key insertion.
  * **Keyboard & Click Navigation:** Use <kbd>↓</kbd>/<kbd>↑</kbd> to cycle, <kbd>Tab</kbd> or <kbd>Enter</kbd> to insert, and <kbd>Esc</kbd> to dismiss.
* **Smart Tab & Enter Transitions:** Pressing <kbd>Tab</kbd> cycles element types (`Scene` ➔ `Action` ➔ `Character` ➔ `Parenthetical` ➔ `Dialogue`). Pressing <kbd>Enter</kbd> predicts the logical next element (e.g. `Character` ➔ `Dialogue`, `Parenthetical` ➔ `Dialogue`).
* **Page 1 Numbering & Badges:** Displays `1.` on Page 1 and subsequent page numbers on later pages, with synchronized page badges in the file tree and status bar.
* **Mobile-Responsive Editor:** Responsive layout with auto-scaling and touch-friendly controls.

---

### 📄 Industry-Standard Title Page & Export Engine
* **Automatic Title Page by Default:** Every project exports with an industry-standard cover page automatically pre-populated with:
  * **Project Title** (bold & uppercase, vertically centered)
  * **Credit** (`"Written by"`)
  * **Author** (resolved from user profile or custom author)
  * **Draft & Date** (`Draft 1 · <Date>`)
  * **Contact Info** (email / phone)
* **Title Page Customizer Modal:** One-click access from the top navbar to edit or update title page details at any time.
* **Dual-Engine Exporting:**
  * **Vector PDF (jsPDF Engine):** High-precision vector text output formatted in Courier Prime 12pt with exact margins.
  * **Browser Print Preview (`window.print()`):** Clean, isolated print dialog for physical printing.
  * **Fountain & Plain Text Export:** Export to standard `.fountain` or `.txt` formats.

---

### ⚡ Glitch-Free Auto-Save & Cloud Sync
* **Immediate Local Saves (0ms Delay):** Changes persist instantly in browser storage (`localStorage`).
* **Single-Flight Background Sync Queue:** State changes are collapsed and dispatched sequentially to Supabase, eliminating race conditions.
* **Typing Protection Lock:** Real-time incoming database updates are locked while typing, preventing cursor jumps and caret resets.
* **Full Undo / Redo:** Full history tracking with caret memory.

---

### 🗂️ Interactive Document Planners
* **Shot List Editor:** Spreadsheet-style camera planner supporting Scene #, Shot #, Description, Camera Type, Angle, Movement, Lens, and Status with CSV & PDF export.
* **Idea Editor:** Notion-style note editor supporting headings, checklists, links, and tags.
* **Character Worksheet:** Structured character profiles and comparison grids.

---

## ⌨️ Screenplay Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Tab</kbd> | Cycle element type (Scene ➔ Action ➔ Character ➔ Parenthetical ➔ Dialogue) |
| <kbd>Enter</kbd> | Create next predicted block |
| <kbd>Ctrl</kbd> + <kbd>1</kbd>–<kbd>5</kbd> | Change block type directly (1: Scene, 2: Action, 3: Character, 4: Parenthetical, 5: Dialogue) |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> / <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | Redo |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | Save draft manually |
| <kbd>Ctrl</kbd> + <kbd>B</kbd> | Toggle Scene Navigator sidebar |
| <kbd>Ctrl</kbd> + <kbd>/</kbd> | Open Help & Shortcuts modal |

---

## 🛠️ Technology Stack

* **Frontend:** React 19, TypeScript, TailwindCSS 4
* **Build Tool:** Vite 7
* **PDF & Printing:** jsPDF, html2canvas, CSS Paged Media
* **Icons:** Lucide React
* **Backend & Auth:** Supabase (Real-time database, auth, and storage)

---

## 🏁 Getting Started

### Prerequisites
* **Node.js** (v18 or higher)
* **npm** or **pnpm** / **yarn**

### Installation

```bash
# Clone repository
git clone https://github.com/likhithkumarj/WriterDesk-v2.git

# Navigate into project directory
cd WriterDesk-v2

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Building for Production

```bash
# Type check and build bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📄 Screenplay Layout Guide

```text
                             [ SCENE HEADING ]
        
        This is an action block. It stretches across the full width
        of the page margins.
        
                                 CHARACTER
                           (parenthetical note)
                      This is dialogue. It is centered
                      with margins on both sides.
```

---

## 📜 License

This project is licensed under the MIT License.
