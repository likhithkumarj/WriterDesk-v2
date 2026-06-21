# ✍️ WriterDesk (v2.0)

A professional, feature-rich web-based screenplay workspace designed for screenwriters, novelists, and storytellers. It allows creators to write scripts, manage multi-file projects, customize page styling, back up local workspaces, and engage with a community of writers—all within a beautiful, modern user interface.

WriterDesk is a core part of the larger **Writer Desk** ecosystem, delivering pixel-perfect formatting and real-time synchronization out of the box.

---

## 🚀 Key Features

### 1. **Automatic Screenplay Formatting & Editor**
* **Industry Standard Formatting:** Instantly formats blocks to standard margins for **Scene Headings**, **Action lines**, **Character names**, **Parentheticals**, **Dialogues**, and **Transitions**.
* **Smart Hotkeys:** Toggle block types quickly with automated cursor placements or shortcut keys:
  * `Ctrl + 1`: Scene Heading
  * `Ctrl + 2`: Action
  * `Ctrl + 3`: Character
  * `Ctrl + 4`: Parenthetical
  * `Ctrl + 5`: Dialogue
* **Interactive Navigation Sidebar:** Toggle a sidebar outline of scenes to jump directly to any part of your script.
* **Live Script Statistics:** Real-time badge counts tracking your total scenes, estimated printed page counts, and total word count.
* **Undo & Redo:** Multi-step history management so you never lose edits.

### 2. **Structured Project & Document Management**
* **Multi-File Projects:** Organize screenplay resources under a single project directory. Maintain acts, revisions, treatment outlines, and character bibles in separate files.
* **Project Metadata:** Assign project categories (Feature Film, TV Pilot, Short Film, etc.), genres (Sci-Fi, Thriller, Drama, etc.), and descriptions.

### 3. **Title Page Creator**
* Dedicated title page manager with settings for Script Title, Subtitle, Author, Source Material (e.g., "Based on the novel by..."), and Contact Details.

### 4. **Import & Export Systems**
* **Seamless Import:** Upload existing drafts directly from standard screenplay format (`.fountain`), plain text (`.txt`), or markdown (`.md`) files.
* **Flexible Export:** Generate industry-standard print layout PDFs, or export your screenplay as `.fountain`, `.txt`, or `.json` backups.

### 5. **Writers Lounge Feed & Community**
* **Lounge Feed:** Post updates, request advice, and discuss script structures with other screenwriters in the community.
* **Script Snippets:** Insert code-like screenplay snippets that automatically render in professional Courier New formatting directly on the social feed.
* **Interactions:** Like posts, reply to threads with a complete comment drawer, and share links.

### 6. **Script Explorer**
* Browse, filter, and search public screenplays written by other community authors.
* Read screenplays directly within the application using a dedicated, distraction-free **Script Reader Modal** formatted with realistic script pages.

### 7. **Personalization & Settings**
* **Custom Themes:** Choose beautiful, curated dashboard palettes like *Midnight Gold*, *Cyberpunk Purple*, *Forest Green*, and *Classic Dark*.
* **Editor Zoom Control:** Customize readability scale from 90% (compact) to 120% (large).
* **Profile Customization:** Modify display name, email, bio, and choose from diverse avatar seed variations.
* **Workspace Backups:** Download your entire local store as a single `.json` file, or reset the app cache at any time.

---

## 🛠️ Technology Stack

WriterDesk v2 is built using modern web development frameworks and toolings:
* **Frontend Core:** [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
* **Build System:** [Vite 7](https://vite.dev/)
* **Styling & Components:** CSS Custom Properties (Vanilla variables) & [TailwindCSS 4](https://tailwindcss.com/)
* **Database & Auth:** [Supabase](https://supabase.com/) (real-time sync, auth events)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Hosting Integration:** Vercel Analytics

---

## 🏁 Quick Start

### 1. Installation
Clone the repository, navigate into the folder, and install all dependencies:
```bash
npm install
```

### 2. Development Server
Start the local hot-reloading development server:
```bash
npm run dev
```

### 3. Build & Preview
To build a production bundle and run the server locally:
```bash
# Build production bundle
npm run build

# Preview build locally
npm run preview
```

---

## 📝 Document Formatting Guide
WriterDesk follows standard screenplay rules. Standard screenplay formatting relies on specific indents. Pressing **Tab** or **Enter** cycles through elements naturally to speed up typing.
```
                                 [ SCENE HEADING ]
           
           This is an action block. It stretches across the full width
           of the page margins.
           
                                     CHARACTER
                               (Parenthetical note)
                         This is dialogue. It is centered
                         with margins on both sides.
```
