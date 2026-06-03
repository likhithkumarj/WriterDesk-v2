import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft, Plus, Upload, Download, Undo2, Redo2, PanelLeft,
  HelpCircle, Hash, MoreHorizontal, GripVertical, Film, Type as TypeIcon,
  User, Quote, MessageSquare, FolderPlus, FileText, Save, BookOpen,
} from "lucide-react";

const TYPE_ICONS = {
  scene: Film,
  action: TypeIcon,
  character: User,
  parenthetical: Quote,
  dialogue: MessageSquare,
} as const;

/* ============================================================
   Screenplay — single-file app
   ============================================================ */

type BlockType =
  | "scene"
  | "action"
  | "character"
  | "parenthetical"
  | "dialogue";

interface Block {
  id: string;
  type: BlockType;
  text: string;
}
interface TitlePage {
  title: string;
  credit: string;     // e.g. "Written by"
  author: string;
  source: string;     // e.g. "Based on..."
  draftDate: string;
  contact: string;
}
interface FileDoc {
  id: string;
  title: string;
  dateModified: number;
  blocks: Block[];
  titlePage?: TitlePage;
}
interface Project {
  id: string;
  title: string;
  description: string;
  dateCreated: number;
  dateModified: number;
  files: FileDoc[];
}
interface Store {
  projects: Project[];
}

const STORAGE_KEY = "screenplay_store_v1";
const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------- styles injected once ---------- */
const GLOBAL_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap');

.sp-page, .sp-page * {
  font-family: 'Courier Prime', 'Courier New', Courier, monospace !important;
  font-size: 16px;
  line-height: 1.5;
  color: #000000;
}
.sp-page-wrapper {
  width: calc(794px * var(--page-scale, 1));
  height: calc(1123px * var(--page-scale, 1));
  flex: 0 0 auto;
}
.sp-page {
  position: relative;
  width: 794px;
  height: 1123px;
  background: #FFFFFF;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
  flex: 0 0 auto;
  transform: scale(var(--page-scale, 1));
  transform-origin: top left;
}
.sp-page-inner {
  position: absolute;
  top: 72px;
  left: 108px;
  right: 72px;
  bottom: 72px;
  overflow: visible;
}
.sp-page-number {
  position: absolute;
  top: 36px;
  right: 72px;
  color: #000;
}
.sp-block {
  white-space: pre-wrap;
  word-break: break-word;
  outline: none;
  padding: 0 4px;
  border-left: 3px solid transparent;
  margin-left: -7px;
  min-height: 1.5em;
}
.sp-block[data-type="scene"]        { border-left-color: #E8B84B; font-weight: 700; text-transform: uppercase; margin-top: 1.5em; }
.sp-block[data-type="action"]       { border-left-color: #9CA3AF; margin-left: calc(4ch - 7px); margin-top: 0.75em; }
.sp-block[data-type="character"]    { border-left-color: #60A5FA; margin-left: calc(24ch - 7px); text-transform: uppercase; margin-top: 1em; }
.sp-block[data-type="parenthetical"]{ border-left-color: #34D399; margin-left: calc(18ch - 7px); }
.sp-block[data-type="dialogue"]     { border-left-color: #E5E7EB; margin-left: calc(10ch - 7px); max-width: 35ch; }
.sp-block:empty::before { content: attr(data-placeholder); color: #bbb; }

.sp-more { margin-left: 20ch; }

.sp-type-pill {
  position: absolute;
  transform: translateY(-100%);
  margin-top: -4px;
  background: #E8B84B;
  color: #1a1a1a;
  font-family: system-ui, sans-serif !important;
  font-size: 11px !important;
  line-height: 1 !important;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  pointer-events: none;
}

/* Theme */
:root {
  --sp-bg: #F0EDE8;
  --sp-toolbar: #FFFFFF;
  --sp-sidebar: #F7F4F0;
  --sp-text: #1a1a1a;
  --sp-border: #e2ddd5;
  --sp-accent: #E8B84B;
  --sp-muted: #6b6b6b;
}
@media (prefers-color-scheme: dark) {
  :root:not(.sp-light) {
    --sp-bg: #1C1C1E;
    --sp-toolbar: #2C2C2E;
    --sp-sidebar: #252525;
    --sp-text: #F5F5F5;
    --sp-border: #3a3a3c;
    --sp-muted: #9a9a9a;
  }
}

.sp-app { background: var(--sp-bg); color: var(--sp-text); min-height: 100vh; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.sp-toolbar { background: var(--sp-toolbar); border-color: var(--sp-border); backdrop-filter: blur(8px); }
.sp-sidebar {
  background: var(--sp-sidebar);
  border-color: var(--sp-border);
  width: 260px;
  border-right: 1px solid var(--sp-border);
  padding: 14px;
  overflow-y: auto;
  flex-shrink: 0;
}
@media (max-width: 794px) {
  .sp-sidebar {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 40;
    height: 100%;
    box-shadow: 4px 0 16px rgba(0,0,0,0.15);
  }
}
.sp-btn {
  background: transparent; border: 1px solid var(--sp-border); color: var(--sp-text);
  padding: 6px 10px; border-radius: 8px; font-size: 13px; cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
  transition: all 0.12s ease; font-weight: 500;
}
.sp-btn:hover { background: rgba(232,184,75,0.12); border-color: var(--sp-accent); transform: translateY(-1px); }
.sp-btn:active { transform: translateY(0); }
.sp-btn-primary { background: var(--sp-accent); color: #1a1a1a; border-color: var(--sp-accent); font-weight: 600; }
.sp-btn-primary:hover { filter: brightness(0.95); }
.sp-btn-ghost { border-color: transparent; }
.sp-btn-ghost:hover { border-color: var(--sp-border); }
.sp-btn-icon { padding: 6px; }
.sp-btn-active { background: rgba(232,184,75,0.18); border-color: var(--sp-accent); color: var(--sp-text); }
.sp-kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px; padding: 1px 5px; border-radius: 4px;
  background: rgba(0,0,0,0.08); border: 1px solid var(--sp-border);
  color: var(--sp-muted); margin-left: 2px;
}
.sp-input {
  background: var(--sp-bg); color: var(--sp-text); border: 1px solid var(--sp-border);
  border-radius: 8px; padding: 8px 10px; font-size: 14px; width: 100%;
}
.sp-card {
  background: var(--sp-toolbar); border: 1px solid var(--sp-border);
  border-radius: 12px; padding: 18px; cursor: pointer; transition: all 0.18s;
}
.sp-card:hover { border-color: var(--sp-accent); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
.sp-badge {
  background: rgba(232,184,75,0.12); color: var(--sp-text);
  border: 1px solid var(--sp-border); padding: 3px 9px; border-radius: 999px;
  font-size: 11px; display: inline-flex; align-items: center; gap: 4px; font-weight: 500;
}
.sp-modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50;
  display: flex; align-items: center; justify-content: center; padding: 16px;
  backdrop-filter: blur(4px);
}
.sp-modal {
  background: var(--sp-toolbar); color: var(--sp-text); border-radius: 14px; padding: 24px;
  max-width: 520px; width: 100%; max-height: 90vh; overflow: auto;
  border: 1px solid var(--sp-border); box-shadow: 0 24px 60px rgba(0,0,0,0.35);
}
.sp-canvas {
  overflow: auto;
  padding: 40px;
  display: flex; flex-direction: column; align-items: center; gap: 32px;
  background: var(--sp-bg);
  height: 100%;
}
@media (max-width: 794px) {
  .sp-canvas {
    padding: 16px;
    gap: 16px;
  }
  .sp-kbd {
    display: none !important;
  }
}
.sp-scene-item {
  display: flex; align-items: flex-start; gap: 8px; width: 100%; text-align: left;
  padding: 8px 10px; margin-bottom: 2px; border-radius: 8px; background: transparent;
  border: 1px solid transparent; color: var(--sp-text); cursor: pointer; font-size: 12px;
  transition: all 0.12s;
}
.sp-scene-item:hover { background: rgba(232,184,75,0.10); border-color: var(--sp-border); }
.sp-menu {
  position: absolute; right: 8px; top: 36px;
  background: var(--sp-toolbar); border: 1px solid var(--sp-border);
  border-radius: 8px; padding: 4px; z-index: 10; min-width: 140px;
}
.sp-menu button {
  display: block; width: 100%; text-align: left; padding: 6px 10px;
  background: transparent; border: none; color: var(--sp-text);
  font-size: 13px; cursor: pointer; border-radius: 4px;
}
.sp-menu button:hover { background: rgba(232,184,75,0.15); }
.sp-toast {
  position: fixed; bottom: 16px; right: 16px;
  background: var(--sp-accent); color: #1a1a1a; padding: 8px 14px;
  border-radius: 8px; font-size: 13px; font-weight: 600; z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.sp-file-row {
  background: var(--sp-toolbar); border: 1px solid var(--sp-border);
  border-radius: 8px; padding: 12px 14px; display: flex; align-items: center;
  gap: 12px; cursor: pointer; margin-bottom: 8px;
}
.sp-file-row:hover { border-color: var(--sp-accent); }
.sp-file-row.drag-over { border-color: var(--sp-accent); border-style: dashed; }

.sp-suggest {
  position: absolute; top: 100%; left: 0; margin-top: 2px;
  background: #fff; color: #1a1a1a;
  border: 1px solid #d9d4cc; border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  min-width: 200px; max-width: 360px; max-height: 220px; overflow: auto;
  z-index: 20; padding: 4px;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif !important;
  font-size: 13px !important; line-height: 1.3 !important;
}
.sp-suggest-item {
  padding: 6px 10px; border-radius: 5px; cursor: pointer;
  display: flex; align-items: center; gap: 8px;
}
.sp-suggest-item[data-active="true"] { background: rgba(232,184,75,0.22); }
.sp-suggest-item:hover { background: rgba(232,184,75,0.15); }
.sp-suggest-hint { font-size: 10px; color: #999; margin-left: auto; }

.sp-title-page-inner {
  position: absolute; inset: 0; padding: 72px 108px;
  display: flex; flex-direction: column; align-items: center;
  text-align: center;
}
.sp-tp-spacer { flex: 1; }
.sp-tp-title { font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2em; }
.sp-tp-credit { margin-bottom: 0.75em; }
.sp-tp-author { margin-bottom: 0.75em; }
.sp-tp-source { margin-top: 2em; font-style: italic; }
.sp-tp-footer {
  width: 100%; display: flex; justify-content: space-between;
  align-items: flex-end; text-align: left; white-space: pre-wrap;
}
.sp-tp-footer > div:last-child { text-align: right; }

@media print {
  body { background: #fff !important; }
  .sp-no-print { display: none !important; }
  .sp-canvas { padding: 0; gap: 0; background: #fff; }
  .sp-page-wrapper {
    width: 794px !important;
    height: 1123px !important;
  }
  .sp-page {
    box-shadow: none !important; border: none !important;
    page-break-after: always; margin: 0 !important;
    transform: none !important;
  }
  @page { size: A4; margin: 0; }
}
`;

/* ---------- sample data ---------- */
function makeSample(): Project {
  const blocks: Block[] = [
    { id: uid(), type: "scene", text: "INT. COFFEE SHOP - DAY" },
    {
      id: uid(),
      type: "action",
      text: "Rain streaks the front window. MAYA (28), a tired barista with ink-stained fingers, wipes the counter for the third time this hour. The shop is empty.",
    },
    { id: uid(), type: "character", text: "MAYA" },
    { id: uid(), type: "parenthetical", text: "(to herself)" },
    { id: uid(), type: "dialogue", text: "Just one customer. That's all I ask." },
    { id: uid(), type: "action", text: "The bell above the door CHIMES. SONG - a soft jazz number begins to play from the overhead speakers." },
    { id: uid(), type: "character", text: "DANIEL (V.O.)" },
    { id: uid(), type: "dialogue", text: "I had been walking for hours when I found her shop." },
    { id: uid(), type: "scene", text: "EXT. CITY STREET - NIGHT" },
    { id: uid(), type: "action", text: "DANIEL (35), collar up against the rain, hurries past glowing storefronts." },
    { id: uid(), type: "character", text: "WOMAN (O.S.)" },
    { id: uid(), type: "dialogue", text: "¡Cuidado! Watch where you're going!" },
    { id: uid(), type: "scene", text: "I/E. TAXI/CITY STREET - NIGHT" },
    { id: uid(), type: "action", text: "Daniel ducks into a yellow cab. Through the window, neon signs blur into watercolor." },
    { id: uid(), type: "character", text: "DANIEL" },
    { id: uid(), type: "dialogue", text: "Take me anywhere that's still open." },
  ];
  const file: FileDoc = {
    id: uid(),
    title: "Pilot — Episode 1",
    dateModified: Date.now(),
    blocks,
  };
  return {
    id: uid(),
    title: "The Rain Hours",
    description: "A pilot episode about strangers in a city of weather.",
    dateCreated: Date.now(),
    dateModified: Date.now(),
    files: [file],
  };
}

/* ---------- store ---------- */
function loadStore(): Store {
  if (typeof window === "undefined") return { projects: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const s: Store = { projects: [makeSample()] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  return s;
}

/* ---------- editor reducer with undo/redo ---------- */
type EditorState = { past: Block[][]; present: Block[]; future: Block[][] };
type EditorAction =
  | { type: "set"; blocks: Block[] }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; blocks: Block[] };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "set":
      if (JSON.stringify(state.present) === JSON.stringify(action.blocks)) return state;
      return {
        past: [...state.past, state.present].slice(-100),
        present: action.blocks,
        future: [],
      };
    case "undo": {
      if (!state.past.length) return state;
      const prev = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: prev,
        future: [state.present, ...state.future],
      };
    }
    case "redo": {
      if (!state.future.length) return state;
      const next = state.future[0];
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
      };
    }
    case "reset":
      return { past: [], present: action.blocks, future: [] };
  }
}

/* ---------- formatting helpers ---------- */
const TYPE_ORDER: BlockType[] = ["action", "scene", "character", "parenthetical", "dialogue"];
const TYPE_LABEL: Record<BlockType, string> = {
  scene: "Scene",
  action: "Action",
  character: "Character",
  parenthetical: "Paren",
  dialogue: "Dialogue",
};

function nextTypeOnEnter(t: BlockType, text: string): BlockType {
  if (t === "scene") return "action";
  if (t === "action") return "action";
  if (t === "character") return text.trim().startsWith("(") ? "parenthetical" : "dialogue";
  if (t === "parenthetical") return "dialogue";
  if (t === "dialogue") return "action";
  return "action";
}

function normalizeText(type: BlockType, text: string): string {
  if (type === "scene" || type === "character") return text.toUpperCase();
  if (type === "parenthetical") {
    let t = text.trim();
    if (!t) return "";
    if (!t.startsWith("(")) t = "(" + t;
    if (!t.endsWith(")")) t = t + ")";
    return t;
  }
  return text;
}

/* ---------- autocomplete suggestions ---------- */
const SCENE_PREFIXES = ["INT.", "EXT.", "INT./EXT.", "I/E.", "EST."];
const SCENE_TIMES = ["DAY", "NIGHT", "MORNING", "EVENING", "CONTINUOUS", "LATER", "MOMENTS LATER", "DUSK", "DAWN"];

export interface Suggestion { label: string; insert: string; hint?: string }

function sceneSuggestions(rawText: string): Suggestion[] {
  const text = rawText.toUpperCase();
  const trimmed = text.trim();
  // empty or typing the prefix
  if (!trimmed) {
    return SCENE_PREFIXES.map((p) => ({ label: p, insert: p + " ", hint: "prefix" }));
  }
  const prefixMatches = SCENE_PREFIXES.filter((p) => p.startsWith(trimmed) && p !== trimmed);
  if (prefixMatches.length) {
    return prefixMatches.map((p) => ({ label: p, insert: p + " ", hint: "prefix" }));
  }
  const usedPrefix = SCENE_PREFIXES.find((p) => trimmed.startsWith(p));
  if (!usedPrefix) return [];
  // suggest time-of-day after " - "
  const dashIdx = text.lastIndexOf(" - ");
  if (dashIdx === -1) {
    // user typing location — if ends with " " offer adding " - "
    if (text.endsWith(" ") && text.length > usedPrefix.length + 2) {
      return SCENE_TIMES.map((t) => ({ label: `- ${t}`, insert: text.replace(/\s+$/, "") + " - " + t, hint: "time" }));
    }
    return [];
  }
  const after = text.substring(dashIdx + 3).trim();
  const matches = SCENE_TIMES.filter((t) => t.startsWith(after) && t !== after);
  const base = text.substring(0, dashIdx + 3);
  return matches.slice(0, 8).map((t) => ({ label: `- ${t}`, insert: base + t, hint: "time" }));
}

function characterSuggestions(rawText: string, known: string[]): Suggestion[] {
  const t = rawText.toUpperCase().trim();
  const list = known.filter(Boolean);
  if (!t) return list.slice(0, 6).map((n) => ({ label: n, insert: n, hint: "recent" }));
  return list
    .filter((n) => n.startsWith(t) && n !== t)
    .slice(0, 6)
    .map((n) => ({ label: n, insert: n, hint: "recent" }));
}


function paginate(blocks: Block[]): Block[][] {
  // approximate 55 lines per page
  const pages: Block[][] = [[]];
  let lines = 0;
  const widthForType: Record<BlockType, number> = {
    scene: 60, action: 60, character: 35, parenthetical: 30, dialogue: 35,
  };
  for (const b of blocks) {
    const w = widthForType[b.type];
    const txtLines = Math.max(1, Math.ceil((b.text || " ").length / w));
    const spacing = b.type === "scene" ? 2 : b.type === "character" ? 1 : 1;
    if (lines + txtLines + spacing > 55 && pages[pages.length - 1].length) {
      pages.push([]);
      lines = 0;
    }
    pages[pages.length - 1].push(b);
    lines += txtLines + spacing;
  }
  return pages;
}

function blocksToTxt(blocks: Block[]): string {
  const pad = (n: number) => " ".repeat(n);
  return blocks
    .map((b) => {
      switch (b.type) {
        case "scene": return "\n" + b.text.toUpperCase() + "\n";
        case "action": return pad(0) + b.text + "\n";
        case "character": return pad(20) + b.text.toUpperCase();
        case "parenthetical": return pad(15) + normalizeText("parenthetical", b.text);
        case "dialogue": return pad(10) + b.text + "\n";
      }
    })
    .join("\n");
}

function blocksToFountain(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "scene": return "\n" + b.text.toUpperCase();
        case "action": return b.text;
        case "character": return "\n" + b.text.toUpperCase();
        case "parenthetical": return normalizeText("parenthetical", b.text);
        case "dialogue": return b.text;
      }
    })
    .join("\n");
}

/* ---------- Fountain / TXT importer ---------- */
const SCENE_RE = /^(INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s]/i;
function parseFountain(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  // strip simple title page (key: value at top until blank)
  if (lines[0] && /^[A-Za-z][A-Za-z ]*:\s/.test(lines[0])) {
    while (i < lines.length && lines[i].trim() !== "") i++;
    while (i < lines.length && lines[i].trim() === "") i++;
  }
  const out: Block[] = [];
  let prevBlank = true;
  let lastType: BlockType | null = null;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { prevBlank = true; lastType = null; i++; continue; }
    if (line.startsWith("!")) { out.push({ id: uid(), type: "action", text: line.slice(1).trim() }); lastType = "action"; prevBlank = false; i++; continue; }
    if (line.startsWith(".") && !line.startsWith("..")) { out.push({ id: uid(), type: "scene", text: line.slice(1).trim().toUpperCase() }); lastType = "scene"; prevBlank = false; i++; continue; }
    if (line.startsWith("@")) { out.push({ id: uid(), type: "character", text: line.slice(1).trim().toUpperCase() }); lastType = "character"; prevBlank = false; i++; continue; }
    if (prevBlank && SCENE_RE.test(line)) {
      out.push({ id: uid(), type: "scene", text: line.toUpperCase() });
      lastType = "scene"; prevBlank = false; i++; continue;
    }
    if ((lastType === "character" || lastType === "dialogue") && line.startsWith("(") && line.endsWith(")")) {
      out.push({ id: uid(), type: "parenthetical", text: line });
      lastType = "parenthetical"; prevBlank = false; i++; continue;
    }
    const next = lines[i + 1];
    const stripped = line.replace(/\([^)]*\)/g, "").trim();
    const isUpper = stripped.length > 0 && stripped === stripped.toUpperCase() && /[A-Z]/.test(stripped);
    if (prevBlank && isUpper && next && next.trim() !== "") {
      out.push({ id: uid(), type: "character", text: line.toUpperCase() });
      lastType = "character"; prevBlank = false; i++; continue;
    }
    if (lastType === "character" || lastType === "parenthetical" || lastType === "dialogue") {
      if (lastType === "dialogue") out[out.length - 1].text += " " + line;
      else { out.push({ id: uid(), type: "dialogue", text: line }); lastType = "dialogue"; }
      prevBlank = false; i++; continue;
    }
    if (lastType === "action") out[out.length - 1].text += " " + line;
    else { out.push({ id: uid(), type: "action", text: line }); lastType = "action"; }
    prevBlank = false; i++;
  }
  return out.length ? out : [{ id: uid(), type: "scene", text: "INT. NEW LOCATION - DAY" }];
}

function download(name: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ============================================================
   Main component
   ============================================================ */

export default function ScreenplayApp() {
  const [store, setStore] = useState<Store>(() =>
    typeof window === "undefined" ? { projects: [] } : loadStore()
  );
  const [screen, setScreen] = useState<"projects" | "files" | "editor">("projects");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // load store after mount (SSR safety)
  useEffect(() => {
    setStore(loadStore());
  }, []);

  // debounced save
  const saveTimer = useRef<number | null>(null);
  const persist = useCallback((next: Store) => {
    setStore(next);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setToast("Saved");
      window.setTimeout(() => setToast(null), 2000);
    }, 800);
  }, []);

  const activeProject = useMemo(
    () => store.projects.find((p) => p.id === activeProjectId) || null,
    [store, activeProjectId]
  );
  const activeFile = useMemo(
    () => activeProject?.files.find((f) => f.id === activeFileId) || null,
    [activeProject, activeFileId]
  );

  return (
    <div className="sp-app">
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLE }} />
      {screen === "projects" && (
        <ProjectsScreen
          store={store}
          persist={persist}
          openProject={(id) => {
            setActiveProjectId(id);
            setScreen("files");
          }}
        />
      )}
      {screen === "files" && activeProject && (
        <FilesScreen
          project={activeProject}
          back={() => setScreen("projects")}
          persist={(p) =>
            persist({
              ...store,
              projects: store.projects.map((x) => (x.id === p.id ? p : x)),
            })
          }
          openFile={(id) => {
            setActiveFileId(id);
            setScreen("editor");
          }}
        />
      )}
      {screen === "editor" && activeProject && activeFile && (
        <EditorScreen
          project={activeProject}
          file={activeFile}
          back={() => setScreen("files")}
          persistFile={(file) => {
            const np: Project = {
              ...activeProject,
              dateModified: Date.now(),
              files: activeProject.files.map((f) => (f.id === file.id ? file : f)),
            };
            persist({
              ...store,
              projects: store.projects.map((x) => (x.id === np.id ? np : x)),
            });
          }}
          addFiles={(newFiles, openId) => {
            const np: Project = {
              ...activeProject,
              dateModified: Date.now(),
              files: [...activeProject.files, ...newFiles],
            };
            persist({
              ...store,
              projects: store.projects.map((x) => (x.id === np.id ? np : x)),
            });
            if (openId) setActiveFileId(openId);
          }}
        />
      )}

      {toast && <div className="sp-toast">{toast}</div>}
    </div>
  );
}

/* ============================================================
   Projects Screen
   ============================================================ */
function ProjectsScreen({
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

function NewProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (t: string, d: string) => void }) {
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

/* ============================================================
   Files Screen
   ============================================================ */
function FilesScreen({
  project, back, persist, openFile,
}: { project: Project; back: () => void; persist: (p: Project) => void; openFile: (id: string) => void }) {
  const [showExport, setShowExport] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const addFile = () => {
    const t = window.prompt("File title", "Untitled");
    if (!t) return;
    persist({
      ...project, dateModified: Date.now(),
      files: [...project.files, { id: uid(), title: t, dateModified: Date.now(), blocks: [{ id: uid(), type: "scene", text: "INT. NEW LOCATION - DAY" }] }],
    });
  };
  const renameFile = (id: string) => {
    const f = project.files.find((x) => x.id === id); if (!f) return;
    const t = window.prompt("Rename file", f.title); if (!t) return;
    persist({ ...project, files: project.files.map((x) => x.id === id ? { ...x, title: t, dateModified: Date.now() } : x) });
  };
  const duplicateFile = (id: string) => {
    const f = project.files.find((x) => x.id === id); if (!f) return;
    persist({ ...project, files: [...project.files, { ...f, id: uid(), title: f.title + " (copy)", dateModified: Date.now(), blocks: f.blocks.map(b => ({...b, id: uid()})) }] });
  };
  const deleteFile = (id: string) => {
    if (!window.confirm("Delete this file?")) return;
    persist({ ...project, files: project.files.filter((x) => x.id !== id) });
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (overId: string) => {
    if (!dragId || dragId === overId) return;
    const files = [...project.files];
    const fromIdx = files.findIndex((f) => f.id === dragId);
    const toIdx = files.findIndex((f) => f.id === overId);
    const [moved] = files.splice(fromIdx, 1);
    files.splice(toIdx, 0, moved);
    persist({ ...project, files });
    setDragId(null);
  };

  const importFiles = (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return;
    const readers = Array.from(fileList).map(
      (f) =>
        new Promise<FileDoc>((resolve) => {
          const r = new FileReader();
          r.onload = () => {
            const text = String(r.result || "");
            const title = f.name.replace(/\.(fountain|txt|md)$/i, "");
            resolve({ id: uid(), title, dateModified: Date.now(), blocks: parseFountain(text) });
          };
          r.readAsText(f);
        })
    );
    Promise.all(readers).then((newFiles) => {
      persist({ ...project, dateModified: Date.now(), files: [...project.files, ...newFiles] });
    });
  };

  return (
    <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button className="sp-btn" onClick={back}>← Back</button>
        <h1 style={{ fontSize: 24, fontWeight: 700, flex: 1, minWidth: "150px" }}>{project.title}</h1>
        <button className="sp-btn" onClick={() => setShowExport(true)}>Export Project</button>
        <label className="sp-btn" style={{ cursor: "pointer" }}>
          ↑ Import
          <input type="file" accept=".fountain,.txt,.md,text/plain" multiple style={{ display: "none" }} onChange={(e) => { importFiles(e.target.files); e.target.value = ""; }} />
        </label>
        <button className="sp-btn sp-btn-primary" onClick={addFile}>+ New File</button>
      </div>


      {project.files.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--sp-muted)", padding: 48 }}>No files yet. Add your first file.</p>
      ) : (
        <div>
          {project.files.map((f) => {
            const pageCount = Math.max(1, paginate(f.blocks).length);
            return (
              <div
                key={f.id}
                className="sp-file-row"
                draggable
                onDragStart={() => setDragId(f.id)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(f.id)}
                onClick={() => openFile(f.id)}
              >
                <span style={{ cursor: "grab", color: "var(--sp-muted)" }}>⋮⋮</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "var(--sp-muted)" }}>
                    {pageCount} page{pageCount === 1 ? "" : "s"} · {new Date(f.dateModified).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ position: "relative" }} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === f.id ? null : f.id); }}>
                  <button className="sp-btn" style={{ padding: "2px 8px" }}>⋯</button>
                  {openMenu === f.id && (
                    <div className="sp-menu" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { renameFile(f.id); setOpenMenu(null); }}>Rename</button>
                      <button onClick={() => { duplicateFile(f.id); setOpenMenu(null); }}>Duplicate</button>
                      <button onClick={() => { deleteFile(f.id); setOpenMenu(null); }}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showExport && <ExportModal project={project} defaultFileId={null} onClose={() => setShowExport(false)} />}
    </div>
  );
}

/* ============================================================
   Editor Screen
   ============================================================ */
function EditorScreen({
  project, file, back, persistFile, addFiles,
}: { project: Project; file: FileDoc; back: () => void; persistFile: (f: FileDoc) => void; addFiles: (newFiles: FileDoc[], openId?: string) => void }) {

  const [state, dispatch] = useReducer(editorReducer, { past: [], present: file.blocks, future: [] });
  const blocks = state.present;
  const [focusedId, setFocusedId] = useState<string | null>(blocks[0]?.id ?? null);
  const [showScenes, setShowScenes] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [sceneNumbersOn, setSceneNumbersOn] = useState(true);
  const [zoomHint, setZoomHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 794) {
      setShowScenes(false);
      if (!localStorage.getItem("sp_zoom_hint_seen")) {
        setZoomHint(true);
        localStorage.setItem("sp_zoom_hint_seen", "1");
        setTimeout(() => setZoomHint(false), 4000);
      }
    }
  }, []);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [pageScale, setPageScale] = useState(1);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const padding = window.innerWidth < 794 ? 32 : 80;
        const targetWidth = 794;
        const newScale = Math.min(1, (width - padding) / targetWidth);
        setPageScale(newScale > 0 ? newScale : 1);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // sync blocks -> file save (debounced via parent persist)
  useEffect(() => {
    if (blocks === file.blocks) return;
    persistFile({ ...file, blocks, dateModified: Date.now() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  const setBlocks = useCallback((next: Block[]) => dispatch({ type: "set", blocks: next }), []);

  const updateBlock = (id: string, patch: Partial<Block>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const insertAfter = (id: string, type: BlockType) => {
    const idx = blocks.findIndex((b) => b.id === id);
    const nb: Block = { id: uid(), type, text: "" };
    const next = [...blocks.slice(0, idx + 1), nb, ...blocks.slice(idx + 1)];
    setBlocks(next);
    setFocusedId(nb.id);
  };

  const deleteBlock = (id: string) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx <= 0) return;
    const next = blocks.filter((b) => b.id !== id);
    setBlocks(next);
    setFocusedId(blocks[idx - 1].id);
  };

  const cycleType = (id: string) => {
    const b = blocks.find((x) => x.id === id); if (!b) return;
    const i = TYPE_ORDER.indexOf(b.type);
    const nextType = TYPE_ORDER[(i + 1) % TYPE_ORDER.length];
    updateBlock(id, { type: nextType, text: normalizeText(nextType, b.text) });
  };

  const setType = (id: string, type: BlockType) => {
    const b = blocks.find((x) => x.id === id); if (!b) return;
    updateBlock(id, { type, text: normalizeText(type, b.text) });
  };

  // global keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault(); dispatch({ type: "undo" });
      } else if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault(); dispatch({ type: "redo" });
      } else if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        persistFile({ ...file, blocks, dateModified: Date.now() });
      } else if (mod && e.key === "/") {
        e.preventDefault(); setShowHelp((v) => !v);
      } else if (mod && /^[1-5]$/.test(e.key) && focusedId) {
        e.preventDefault();
        const map: BlockType[] = ["scene", "action", "character", "parenthetical", "dialogue"];
        setType(focusedId, map[parseInt(e.key, 10) - 1]);
      } else if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault(); setShowScenes((v) => !v);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, file, persistFile, focusedId]);

  const pages = useMemo(() => paginate(blocks), [blocks]);
  const stats = useMemo(() => computeStats(blocks), [blocks]);

  // scene list with numbering
  const scenes = useMemo(() => {
    const list: { id: string; number: number; text: string }[] = [];
    let n = 0;
    for (const b of blocks) {
      if (b.type === "scene") { n++; list.push({ id: b.id, number: n, text: b.text }); }
    }
    return list;
  }, [blocks]);

  const sceneNumberFor = (id: string) => scenes.find((s) => s.id === id)?.number;

  // Known character names (most-recent-first, deduped)
  const characterNames = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      if (b.type !== "character") continue;
      const n = b.text.replace(/\(.*?\)/g, "").trim().toUpperCase();
      if (!n || seen.has(n)) continue;
      seen.add(n); list.push(n);
    }
    return list;
  }, [blocks]);

  const suggestionsFor = useCallback((b: Block): Suggestion[] => {
    if (b.type === "scene") return sceneSuggestions(b.text);
    if (b.type === "character") return characterSuggestions(b.text, characterNames.filter((n) => n !== b.text.toUpperCase().trim()));
    return [];
  }, [characterNames]);

  const [showTitlePage, setShowTitlePage] = useState(false);
  const hasTitlePage = !!(file.titlePage && file.titlePage.title.trim());


  const scrollToBlock = (id: string) => {
    const el = document.querySelector(`[data-block-id="${id}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setFocusedId(id);
      if (window.innerWidth < 794) {
        setShowScenes(false);
      }
    }
  };

  // shortcut keys per element type (Ctrl+1..5)
  const typeShortcut: Record<BlockType, string> = {
    scene: "1", action: "2", character: "3", parenthetical: "4", dialogue: "5",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* title bar */}
      <div className="sp-toolbar sp-no-print" style={{ borderBottom: "1px solid var(--sp-border)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <button className="sp-btn sp-btn-ghost" onClick={back} title="Back to files">
          <ChevronLeft size={16} /> {project.title}
        </button>
        <div style={{ width: 1, height: 20, background: "var(--sp-border)" }} />
        <FileText size={14} style={{ color: "var(--sp-muted)" }} />
        <h2 style={{ fontSize: 15, fontWeight: 600, flex: 1, margin: 0 }}>{file.title}</h2>
      </div>

      {/* toolbar */}
      <div className="sp-toolbar sp-no-print" style={{ borderBottom: "1px solid var(--sp-border)", padding: "8px 16px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
          {TYPE_ORDER.map((t) => {
            const Icon = TYPE_ICONS[t];
            const active = focusedId ? blocks.find((b) => b.id === focusedId)?.type === t : false;
            return (
              <button
                key={t}
                className={`sp-btn ${active ? "sp-btn-active" : ""}`}
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
          className={`sp-btn ${sceneNumbersOn ? "sp-btn-active" : ""}`}
          onClick={() => setSceneNumbersOn((v) => !v)}
          title="Toggle scene numbers"
        >
          <Hash size={14} /> Scene #
        </button>
        <button
          className={`sp-btn ${showScenes ? "sp-btn-active" : ""}`}
          onClick={() => setShowScenes((v) => !v)}
          title="Toggle sidebar (Ctrl+B)"
        >
          <PanelLeft size={14} /> Scenes
        </button>
        <div style={{ flex: 1 }} />
        <span className="sp-badge"><Film size={11} /> {stats.sceneCount}</span>
        <span className="sp-badge"><FileText size={11} /> ~{pages.length}p</span>
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
                const title = f.name.replace(/\.(fountain|txt|md)$/i, "");
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

      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}>
        {/* sidebar — sticks in place; canvas scrolls independently */}
        {showScenes && (
          <aside className="sp-sidebar sp-no-print" style={{ width: 260, borderRight: "1px solid var(--sp-border)", padding: 14, overflowY: "auto", flexShrink: 0 }}>
            <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sp-muted)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <Film size={12} /> Scenes
            </h3>
            {scenes.length === 0 && <p style={{ fontSize: 12, color: "var(--sp-muted)" }}>No scenes yet.</p>}
            {scenes.map((s) => (
              <button
                key={s.id}
                className="sp-scene-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => scrollToBlock(s.id)}
              >
                <span style={{ color: "var(--sp-accent)", fontWeight: 700, minWidth: 18 }}>{s.number}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.text || "Untitled scene"}</span>
              </button>
            ))}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--sp-border)" }}>
              <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sp-muted)", marginBottom: 10 }}>Stats</h3>
              <div style={{ fontSize: 12, lineHeight: 1.9, display: "grid", gridTemplateColumns: "1fr auto", rowGap: 2 }}>
                <span style={{ color: "var(--sp-muted)" }}>INT</span><span>{stats.intCount}</span>
                <span style={{ color: "var(--sp-muted)" }}>EXT</span><span>{stats.extCount}</span>
                <span style={{ color: "var(--sp-muted)" }}>I/E</span><span>{stats.ieCount}</span>
                <span style={{ color: "var(--sp-muted)" }}>Pages</span><span>~{pages.length}</span>
                <span style={{ color: "var(--sp-muted)" }}>Words</span><span>{stats.wordCount}</span>
                <span style={{ color: "var(--sp-muted)" }}>Lines</span><span>{stats.lineCount}</span>
                <span style={{ color: "var(--sp-muted)" }}>Characters</span><span>{stats.characters.length}</span>
              </div>
            </div>
          </aside>
        )}

        {/* canvas */}
        <div ref={canvasRef} className="sp-canvas" style={{ flex: 1, ...({ "--page-scale": pageScale } as React.CSSProperties) }}>
          {hasTitlePage && file.titlePage && (
            <div className="sp-page-wrapper">
              <div className="sp-page" aria-label="Title page">
                <TitlePageView tp={file.titlePage} />
              </div>
            </div>
          )}
          {pages.map((pageBlocks, pi) => (
            <div key={pi} className="sp-page-wrapper">
              <div className="sp-page">
                {pi > 0 && <div className="sp-page-number">{pi + 1}.</div>}
                <div className="sp-page-inner">
                  {pageBlocks.map((b) => (
                    <BlockView
                      key={b.id}
                      block={b}
                      focused={focusedId === b.id}
                      sceneNumber={b.type === "scene" && sceneNumbersOn ? sceneNumberFor(b.id) : undefined}
                      suggestions={suggestionsFor(b)}
                      onFocus={() => setFocusedId(b.id)}
                      onChange={(text) => updateBlock(b.id, { text: normalizeText(b.type, text) })}
                      onAcceptSuggestion={(text) => updateBlock(b.id, { text: normalizeText(b.type, text) })}
                      onEnter={() => insertAfter(b.id, nextTypeOnEnter(b.type, b.text))}
                      onBackspaceEmpty={() => deleteBlock(b.id)}
                      onTab={() => cycleType(b.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>





      {zoomHint && (
        <div style={{ position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.8)", color: "#fff", padding: "10px 16px", borderRadius: 8, fontSize: 13, zIndex: 50 }}>
          Pinch to zoom or scroll sideways to see the full page
        </div>
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showExport && <ExportModal project={project} defaultFileId={file.id} onClose={() => setShowExport(false)} />}
      {showTitlePage && (
        <TitlePageModal
          initial={file.titlePage}
          onClose={() => setShowTitlePage(false)}
          onSave={(tp) => { persistFile({ ...file, titlePage: tp, dateModified: Date.now() }); setShowTitlePage(false); }}
        />
      )}
    </div>
  );
}

/* ---------- block view ---------- */
function BlockView({
  block, focused, sceneNumber, suggestions, onFocus, onChange, onEnter, onBackspaceEmpty, onTab, onAcceptSuggestion,
}: {
  block: Block; focused: boolean; sceneNumber?: number;
  suggestions: Suggestion[];
  onFocus: () => void; onChange: (t: string) => void;
  onEnter: () => void; onBackspaceEmpty: () => void; onTab: () => void;
  onAcceptSuggestion: (insert: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [sugIdx, setSugIdx] = useState(0);
  const [sugOpen, setSugOpen] = useState(true);

  // Sync external text changes into the DOM ONLY when not focused, so typing
  // never has its caret reset by a re-render.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.innerText !== block.text) el.innerText = block.text;
  }, [block.text]);

  useEffect(() => {
    if (focused && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
      const r = document.createRange();
      r.selectNodeContents(ref.current);
      r.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges(); sel?.addRange(r);
    }
  }, [focused]);

  // reset selection when suggestion list changes
  useEffect(() => { setSugIdx(0); setSugOpen(true); }, [block.text, block.type]);

  const showSug = focused && sugOpen && suggestions.length > 0;

  const accept = (i: number) => {
    const s = suggestions[i];
    if (!s) return;
    if (ref.current) ref.current.innerText = s.insert;
    onAcceptSuggestion(s.insert);
    setSugOpen(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (showSug) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSugIdx((i) => (i + 1) % suggestions.length); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSugIdx((i) => (i - 1 + suggestions.length) % suggestions.length); return; }
      if (e.key === "Tab")       { e.preventDefault(); accept(sugIdx); return; }
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); accept(sugIdx); return; }
      if (e.key === "Escape")    { e.preventDefault(); setSugOpen(false); return; }
    }
    if (e.key === "Enter") { e.preventDefault(); onEnter(); }
    else if (e.key === "Tab") { e.preventDefault(); onTab(); }
    else if (e.key === "Backspace" && !ref.current?.innerText) { e.preventDefault(); onBackspaceEmpty(); }
  };

  return (
    <div style={{ position: "relative" }}>
      {focused && <span className="sp-type-pill sp-no-print">{TYPE_LABEL[block.type]}</span>}
      {block.type === "scene" && sceneNumber !== undefined && (
        <>
          <span aria-hidden style={{ position: "absolute", left: "-3.5ch", top: 0, fontWeight: 700 }}>{sceneNumber}.</span>
          <span aria-hidden style={{ position: "absolute", right: "-3.5ch", top: 0, fontWeight: 700 }}>{sceneNumber}.</span>
        </>
      )}
      <div
        ref={ref}
        className="sp-block"
        data-block-id={block.id}
        data-type={block.type}
        data-placeholder={block.type === "scene" ? "INT. LOCATION - DAY" : ""}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => { onFocus(); setSugOpen(true); }}
        onInput={(e) => { setSugOpen(true); onChange((e.target as HTMLDivElement).innerText); }}
        onKeyDown={handleKey}
      />
      {showSug && (
        <div className="sp-suggest sp-no-print" onMouseDown={(e) => e.preventDefault()}>
          {suggestions.map((s, i) => (
            <div
              key={s.label + i}
              className="sp-suggest-item"
              data-active={i === sugIdx}
              onMouseEnter={() => setSugIdx(i)}
              onClick={() => accept(i)}
            >
              <span>{s.label}</span>
              {s.hint && <span className="sp-suggest-hint">{s.hint}</span>}
            </div>
          ))}
          <div style={{ padding: "4px 10px", fontSize: 10, color: "#999", borderTop: "1px solid #eee", marginTop: 2 }}>
            ↑↓ navigate · Tab/Enter accept · Esc dismiss
          </div>
        </div>
      )}
    </div>
  );
}



/* ---------- stats ---------- */
function computeStats(blocks: Block[]) {
  let intC = 0, extC = 0, ieC = 0, words = 0, lines = 0;
  const chars = new Set<string>();
  for (const b of blocks) {
    lines++;
    words += (b.text.match(/\S+/g) || []).length;
    if (b.type === "scene") {
      if (/^INT\./i.test(b.text)) intC++;
      else if (/^EXT\./i.test(b.text)) extC++;
      else if (/^I\/E\./i.test(b.text)) ieC++;
    }
    if (b.type === "character") {
      chars.add(b.text.replace(/\(.*\)/g, "").trim());
    }
  }
  return {
    sceneCount: intC + extC + ieC,
    intCount: intC, extCount: extC, ieCount: ieC,
    wordCount: words, lineCount: lines,
    characters: Array.from(chars).filter(Boolean),
  };
}

/* ---------- help modal ---------- */
function HelpModal({ onClose }: { onClose: () => void }) {
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

/* ---------- export modal ---------- */
function ExportModal({ project, defaultFileId, onClose }: { project: Project; defaultFileId: string | null; onClose: () => void }) {
  const [mode, setMode] = useState<"individual" | "combined">(defaultFileId ? "individual" : "combined");
  const [format, setFormat] = useState<"pdf" | "txt" | "fountain">("pdf");
  const [order, setOrder] = useState<string[]>(project.files.map((f) => f.id));
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultFileId ? [defaultFileId] : project.files.map((f) => f.id)));
  const [dragId, setDragId] = useState<string | null>(null);

  const filesInOrder = order.map((id) => project.files.find((f) => f.id === id)!).filter(Boolean);

  const doExport = () => {
    const targets = filesInOrder.filter((f) => selected.has(f.id));
    if (!targets.length) return;

    if (format === "pdf") {
      // for PDF, use print on a temporary window with the combined or single content
      printPDF(project, targets, mode === "combined");
      onClose();
      return;
    }

    if (mode === "combined") {
      const content = targets.map((f) =>
        (format === "txt" ? blocksToTxt(f.blocks) : blocksToFountain(f.blocks))
      ).join("\n\n=== PAGE BREAK ===\n\n");
      download(`${project.title}.${format === "txt" ? "txt" : "fountain"}`, content);
    } else {
      targets.forEach((f) => {
        const content = format === "txt" ? blocksToTxt(f.blocks) : blocksToFountain(f.blocks);
        download(`${f.title}.${format === "txt" ? "txt" : "fountain"}`, content);
      });
    }
    onClose();
  };

  const onDrop = (overId: string) => {
    if (!dragId || dragId === overId) return;
    const next = [...order];
    const from = next.indexOf(dragId);
    const to = next.indexOf(overId);
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setOrder(next);
    setDragId(null);
  };

  return (
    <div className="sp-modal-backdrop" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Export</h2>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Mode</div>
          <label style={{ display: "block", marginBottom: 4 }}>
            <input type="radio" checked={mode === "individual"} onChange={() => setMode("individual")} /> Individual files
          </label>
          <label style={{ display: "block" }}>
            <input type="radio" checked={mode === "combined"} onChange={() => setMode("combined")} /> Combined into one document
          </label>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Format</div>
          {(["pdf", "txt", "fountain"] as const).map((f) => (
            <label key={f} style={{ marginRight: 12 }}>
              <input type="radio" checked={format === f} onChange={() => setFormat(f)} /> {f.toUpperCase()}
            </label>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Files (drag to reorder)</div>
          {filesInOrder.map((f) => (
            <div
              key={f.id}
              draggable
              onDragStart={() => setDragId(f.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(f.id)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", border: "1px solid #ddd", borderRadius: 6, marginBottom: 4, background: "#fafafa" }}
            >
              <span style={{ cursor: "grab" }}>⋮⋮</span>
              <input type="checkbox" checked={selected.has(f.id)} onChange={(e) => {
                const s = new Set(selected);
                if (e.target.checked) s.add(f.id); else s.delete(f.id);
                setSelected(s);
              }} />
              <span style={{ flex: 1, fontSize: 13 }}>{f.title}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="sp-btn" onClick={onClose}>Cancel</button>
          <button className="sp-btn sp-btn-primary" onClick={doExport}>Export</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- PDF via print window ---------- */
function renderTitlePageHtml(tp: TitlePage) {
  const e = escapeHtml;
  return `<div class="sp-page"><div class="sp-title-page-inner">
    <div class="sp-tp-spacer"></div>
    <div class="sp-tp-title">${e(tp.title)}</div>
    ${tp.credit ? `<div class="sp-tp-credit">${e(tp.credit)}</div>` : ""}
    ${tp.author ? `<div class="sp-tp-author">${e(tp.author)}</div>` : ""}
    ${tp.source ? `<div class="sp-tp-source">${e(tp.source)}</div>` : ""}
    <div class="sp-tp-spacer"></div>
    <div class="sp-tp-footer">
      <div>${e(tp.contact || "")}</div>
      <div>${e(tp.draftDate || "")}</div>
    </div>
  </div></div>`;
}

function printPDF(project: Project, files: FileDoc[], combined: boolean) {
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) return;
  const renderPages = (blocks: Block[]) => paginate(blocks).map((pageBlocks, pi) => `
    <div class="sp-page">
      ${pi > 0 ? `<div class="sp-page-number">${pi + 1}.</div>` : ""}
      <div class="sp-page-inner">
        ${pageBlocks.map((b) => `<div class="sp-block" data-type="${b.type}">${escapeHtml(b.text)}</div>`).join("")}
      </div>
    </div>
  `).join("");

  let body = "";
  if (combined) {
    // use the first file's title page if present
    const first = files[0];
    if (first?.titlePage?.title.trim()) body += renderTitlePageHtml(first.titlePage);
    const blocks = files.flatMap((f, i) => i === 0 ? f.blocks : [{ id: uid(), type: "action" as BlockType, text: "" }, ...f.blocks]);
    body += renderPages(blocks);
  } else {
    body = files.map((f) => {
      const tp = f.titlePage?.title.trim() ? renderTitlePageHtml(f.titlePage) : "";
      return tp + renderPages(f.blocks);
    }).join('<div style="page-break-after:always"></div>');
  }

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(project.title)}</title>
    <style>${GLOBAL_STYLE} body{margin:0;background:#fff;} .sp-canvas{padding:0;gap:0;background:#fff;}</style>
  </head><body><div class="sp-canvas">${body}</div>
  <script>setTimeout(()=>{window.print();},300);</script>
  </body></html>`);
  w.document.close();
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

/* ---------- Title page view + modal ---------- */
function TitlePageView({ tp }: { tp: TitlePage }) {
  return (
    <div className="sp-title-page-inner">
      <div className="sp-tp-spacer" />
      <div className="sp-tp-title">{tp.title}</div>
      {tp.credit && <div className="sp-tp-credit">{tp.credit}</div>}
      {tp.author && <div className="sp-tp-author">{tp.author}</div>}
      {tp.source && <div className="sp-tp-source">{tp.source}</div>}
      <div className="sp-tp-spacer" />
      <div className="sp-tp-footer">
        <div>{tp.contact}</div>
        <div>{tp.draftDate}</div>
      </div>
    </div>
  );
}

function TitlePageModal({
  initial, onClose, onSave,
}: { initial?: TitlePage; onClose: () => void; onSave: (tp: TitlePage) => void }) {
  const [tp, setTp] = useState<TitlePage>({
    title: initial?.title || "",
    credit: initial?.credit || "Written by",
    author: initial?.author || "",
    source: initial?.source || "",
    draftDate: initial?.draftDate || new Date().toLocaleDateString(),
    contact: initial?.contact || "",
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

