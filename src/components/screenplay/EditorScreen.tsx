import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Block, BlockType, FileDoc, Project } from "../../types/screenplay";
import { uid } from "../../utils/uid";
import { normalizeText, nextTypeOnEnter, TYPE_ORDER } from "../../utils/formatting";
import { sceneSuggestions, characterSuggestions } from "../../utils/suggestions";
import { paginate } from "../../utils/pagination";
import { computeStats } from "../../utils/stats";
import { editorReducer } from "../../hooks/useEditorReducer";
import { Toolbar } from "./Toolbar";
import { Sidebar } from "./Sidebar";
import { PageCanvas } from "./PageCanvas";
import { ZoomControls } from "./ZoomControls";
import { HelpModal } from "../modals/HelpModal";
import { ExportModal } from "../modals/ExportModal";
import { TitlePageModal } from "../modals/TitlePageModal";
import { supabase } from "../../utils/supabaseClient";

export function EditorScreen({
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
  const [baseScale, setBaseScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1);
  const pageScale = baseScale * userZoom;

  const ZOOM_STEP = 0.1;
  const ZOOM_MIN = 0.3;
  const ZOOM_MAX = 2.0;

  const zoomIn  = () => setUserZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 10) / 10));
  const zoomOut = () => setUserZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 10) / 10));
  const zoomReset = () => setUserZoom(1);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const padding = window.innerWidth < 794 ? 32 : 80;
        const targetWidth = 794;
        const newScale = Math.min(1, (width - padding) / targetWidth);
        setBaseScale(newScale > 0 ? newScale : 1);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const saveManually = useCallback(() => {
    setSaveState("saving");
    persistFile({ ...file, blocks, dateModified: Date.now() });
    setSaveState("saved");
    const t = setTimeout(() => setSaveState("idle"), 2000);
    return () => clearTimeout(t);
  }, [blocks, file, persistFile]);

  // sync blocks -> file save (debounced via parent persist)
  useEffect(() => {
    if (blocks === file.blocks) return;
    setSaveState("saving");
    const timer = setTimeout(() => {
      persistFile({ ...file, blocks, dateModified: Date.now() });
      setSaveState("saved");
      const clearTimer = setTimeout(() => setSaveState("idle"), 2000);
      return () => clearTimeout(clearTimer);
    }, 2000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  // Keep track of blocks in a ref so the subscription callback can compare them without stale closures
  const blocksRef = useRef(blocks);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  // Real-time listener for file updates by other collaborators
  useEffect(() => {
    const isConfigured = () => {
      const url = import.meta.env.VITE_SUPABASE_URL || "";
      return url && !url.includes("placeholder-project");
    };

    if (!isConfigured()) return;

    // Subscribe to Postgres changes on the specific file row
    const channel = supabase
      .channel(`realtime:files:${file.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "files",
          filter: `id=eq.${file.id}`,
        },
        (payload) => {
          if (payload.new && payload.new.blocks) {
            // Check if the incoming blocks are different from current blocks in memory
            if (JSON.stringify(payload.new.blocks) !== JSON.stringify(blocksRef.current)) {
              dispatch({ type: "set", blocks: payload.new.blocks });
              setSaveState("saved");
              setTimeout(() => setSaveState("idle"), 2000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [file.id]);

  const setBlocks = useCallback((next: Block[]) => dispatch({ type: "set", blocks: next }), [dispatch]);

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
        saveManually();
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
  }, [blocks, file, saveManually, focusedId]);

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

  // Known character names
  const characterNames = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      if (b.type !== "character") continue;
      const n = b.text.replace(/\\(.*?\\)/g, "").trim().toUpperCase();
      if (!n || seen.has(n)) continue;
      seen.add(n); list.push(n);
    }
    return list;
  }, [blocks]);

  const suggestionsFor = useCallback((b: Block) => {
    if (b.type === "scene") return sceneSuggestions(b.text);
    if (b.type === "character") return characterSuggestions(b.text, characterNames.filter((n) => n !== b.text.toUpperCase().trim()));
    return [];
  }, [characterNames]);

  const [showTitlePage, setShowTitlePage] = useState(false);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <Toolbar
        project={project}
        file={file}
        blocks={blocks}
        focusedId={focusedId}
        sceneNumbersOn={sceneNumbersOn}
        showScenes={showScenes}
        stats={stats}
        pagesCount={pages.length}
        back={back}
        setType={setType}
        dispatch={dispatch}
        setSceneNumbersOn={setSceneNumbersOn}
        setShowScenes={setShowScenes}
        addFiles={addFiles}
        setShowTitlePage={setShowTitlePage}
        setShowExport={setShowExport}
        setShowHelp={setShowHelp}
        saveState={saveState}
        onSave={saveManually}
      />

      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}>
        {showScenes && (
          <Sidebar
            scenes={scenes}
            stats={stats}
            pagesCount={pages.length}
            scrollToBlock={scrollToBlock}
          />
        )}

        {/* canvas */}
        <div ref={canvasRef} className="sp-canvas" style={{ flex: 1, ...({ "--page-scale": pageScale } as React.CSSProperties) }}>
          <PageCanvas
            pages={pages}
            file={file}
            focusedId={focusedId}
            sceneNumbersOn={sceneNumbersOn}
            sceneNumberFor={sceneNumberFor}
            suggestionsFor={suggestionsFor}
            setFocusedId={setFocusedId}
            updateBlock={updateBlock}
            insertAfter={insertAfter}
            nextTypeOnEnter={nextTypeOnEnter}
            deleteBlock={deleteBlock}
            cycleType={cycleType}
          />
        </div>
      </div>

      <ZoomControls
        pageScale={pageScale}
        userZoom={userZoom}
        zoomOut={zoomOut}
        zoomIn={zoomIn}
        zoomReset={zoomReset}
        ZOOM_MIN={ZOOM_MIN}
        ZOOM_MAX={ZOOM_MAX}
      />

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
