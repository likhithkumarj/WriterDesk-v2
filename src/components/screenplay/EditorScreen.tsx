import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Block, BlockType, FileDoc, Project } from "../../types/screenplay";
import { uid } from "../../utils/uid";
import { normalizeText, nextTypeOnEnter, TYPE_ORDER } from "../../utils/formatting";
import { sceneSuggestions, characterSuggestions } from "../../utils/suggestions";
import { paginate, calculateScriptPages } from "../../utils/pagination";
import { computeStats } from "../../utils/stats";
import { editorReducer } from "../../hooks/useEditorReducer";
import { parseFountain } from "../../utils/import";
import { HelpModal } from "../modals/HelpModal";
import { ExportModal } from "../modals/ExportModal";
import { TitlePageModal } from "../modals/TitlePageModal";
import { ShareModal } from "../modals/ShareModal";
import { supabase } from "../../utils/supabaseClient";
import { supabaseService } from "../../utils/supabaseService";
import {
  ChevronLeft, Undo2, Redo2, Search, Maximize2, Minimize2, Eye, EyeOff,
  Film, FileText, User, MessageSquare, AlertCircle, Trash2, Mail, CheckCircle, Clock,
  Share2, Download, MoreHorizontal, Save, Check, Loader2, Bold, Italic, Underline, MessageCircle, Users, Menu, Settings, List, X, Send, Lightbulb, Pencil
} from "lucide-react";
import { Avatar } from "./Avatar";

const getFileIcon = (type: string) => {
  switch (type) {
    case "script":
      return <FileText size={14} style={{ color: "#38bdf8" }} />; // blue/sky
    case "idea":
      return <Lightbulb size={14} style={{ color: "#f59e0b" }} />; // amber/orange
    case "character":
      return <User size={14} style={{ color: "#ec4899" }} />; // pink
    case "outline":
      return <List size={14} style={{ color: "#10b981" }} />; // green
    case "shotlist":
      return <Film size={14} style={{ color: "#a855f7" }} />; // violet/purple
    default:
      return <FileText size={14} />;
  }
};

const stripHtml = (text: string) => {
  if (!text) return "";
  return text.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
};

const getCleanSceneTitle = (text: string) => {
  const clean = stripHtml(text);
  if (!clean) return "Untitled Scene";
  return clean.replace(/^(INT\.|EXT\.|I\/E\.)/i, "").trim() || "Untitled Scene";
};

interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
  sceneLabel?: string;
}

export function EditorScreen({
  project, initialFileId, user, back, persistFile, addFiles, readOnly = false,
}: {
  project: Project;
  initialFileId: string;
  user: { name: string; email: string; avatar: string };
  back: () => void;
  persistFile: (f: FileDoc) => void;
  addFiles: (newFiles: FileDoc[], openId?: string) => void;
  readOnly?: boolean;
}) {

  const navigate = useNavigate();

  // ─── Active File Management (in-place switching, no remount) ───────────────
  const [activeFileId, setActiveFileId] = useState(initialFileId);
  const activeFile = project.files.find(f => f.id === activeFileId) ?? project.files[0];

  const [state, dispatch] = useReducer(editorReducer, { past: [], present: activeFile.blocks, future: [] });
  const blocks = state.present;
  const [focusedId, setFocusedId] = useState<string | null>(activeFile.blocks[0]?.id ?? null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const [showScenes, setShowScenes] = useState(typeof window !== "undefined" ? window.innerWidth >= 768 : true);
  const [activeMobileTab, setActiveMobileTab] = useState<"comments" | "characters" | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [sceneNumbersOn, setSceneNumbersOn] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [showBlockBars, setShowBlockBars] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState<"comments" | "characters">("comments");
  const [userZoom, setUserZoom] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setShowScenes(false);
      } else {
        setShowScenes(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [projectCollaborators, setProjectCollaborators] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!supabaseService.isConfigured()) {
      // Offline fallback: simulate self being online
      setOnlineUsers([{
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        online_at: new Date().toISOString()
      }]);
      return;
    }

    // 1. Load initial collaborators
    supabaseService.fetchCollaborators(project.id).then(({ data }) => {
      if (data) setProjectCollaborators(data);
    });

    // 2. Realtime Collaborators Changes
    const collabChannel = supabase
      .channel(`realtime:collab-db:${project.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "collaborators", filter: `project_id=eq.${project.id}` },
        () => {
          supabaseService.fetchCollaborators(project.id).then(({ data }) => {
            if (data) setProjectCollaborators(data);
          });
        }
      )
      .subscribe();

    // 3. Realtime Presence for active status tracking
    const presenceChannel = supabase.channel(`presence:project:${project.id}`);

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const activeUsers: any[] = [];
        Object.keys(state).forEach((key) => {
          const presences = state[key];
          if (presences) {
            presences.forEach((p: any) => {
              if (p.email && !activeUsers.some(u => u.email.toLowerCase() === p.email.toLowerCase())) {
                activeUsers.push(p);
              }
            });
          }
        });
        setOnlineUsers(activeUsers);
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(collabChannel);
      supabaseService.unsubscribe(presenceChannel);
    };
  }, [project.id, user]);

  const uniqueMembers = useMemo(() => {
    const members: { email: string; name: string; avatar: string; isOnline: boolean; role: string }[] = [];

    // Add current user
    const curEmail = user.email || "";
    const curName = user.name || "You";
    const curAvatar = user.avatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${curName}`;

    members.push({
      email: curEmail,
      name: `${curName} (You)`,
      avatar: curAvatar,
      isOnline: true,
      role: "owner"
    });

    // Add accepted collaborators
    projectCollaborators.forEach((c) => {
      if (c.status === "accepted" && c.invited_email.toLowerCase() !== curEmail.toLowerCase()) {
        const isOnline = onlineUsers.some(u => u.email?.toLowerCase() === c.invited_email.toLowerCase());
        const namePart = c.invited_email.split("@")[0];
        const dispName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        members.push({
          email: c.invited_email,
          name: dispName,
          avatar: `https://api.dicebear.com/9.x/adventurer/svg?seed=${namePart}`,
          isOnline,
          role: "collaborator"
        });
      }
    });

    // Add any other online users that might not be in collaborators table
    onlineUsers.forEach((u) => {
      if (u.email && !members.some(m => m.email.toLowerCase() === u.email.toLowerCase())) {
        members.push({
          email: u.email,
          name: u.name || u.email.split("@")[0],
          avatar: u.avatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${u.email}`,
          isOnline: true,
          role: "member"
        });
      }
    });

    return members;
  }, [user, projectCollaborators, onlineUsers]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const [baseScale, setBaseScale] = useState(1);
  const pageScale = baseScale * userZoom;

  const ZOOM_STEP = 0.1;
  const ZOOM_MIN = 0.3;
  const ZOOM_MAX = 2.0;

  const zoomIn = () => setUserZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 10) / 10));
  const zoomOut = () => setUserZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 10) / 10));
  const zoomReset = () => setUserZoom(1);

  // Auto scale base page size to fit screen width
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const padding = window.innerWidth < 794 ? 20 : 60;
        const targetWidth = 794;
        const newScale = Math.min(1, (width - padding) / targetWidth);
        setBaseScale(newScale > 0 ? newScale : 1);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("writerdesk_autosave");
    return saved !== "false"; // default to true
  });

  const toggleAutoSave = () => {
    setAutoSaveEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("writerdesk_autosave", String(next));
      return next;
    });
  };

  const activeFileRef = useRef(activeFile);
  useEffect(() => { activeFileRef.current = activeFile; }, [activeFile]);

  const blocksRef = useRef(blocks);
  useEffect(() => { blocksRef.current = blocks; }, [blocks]);

  const lastSavedBlocksRef = useRef<string>(JSON.stringify(activeFile.blocks));
  const lastTypingTimeRef = useRef<number>(0);

  // Reset lastSavedBlocksRef when file switches
  useEffect(() => {
    lastSavedBlocksRef.current = JSON.stringify(activeFile.blocks);
  }, [activeFile.id, activeFile.blocks]);

  const saveManually = useCallback(() => {
    setSaveState("saving");
    lastSavedBlocksRef.current = JSON.stringify(blocks);
    persistFile({ ...activeFile, blocks, dateModified: Date.now() });
    setSaveState("saved");
    const t = setTimeout(() => setSaveState("idle"), 2000);
    return () => clearTimeout(t);
  }, [blocks, activeFile, persistFile]);

  // Auto-save on block changes
  useEffect(() => {
    if (!autoSaveEnabled) return;
    if (blocks === activeFile.blocks) return;
    setSaveState("saving");
    const timer = setTimeout(() => {
      lastSavedBlocksRef.current = JSON.stringify(blocks);
      persistFile({ ...activeFile, blocks, dateModified: Date.now() });
      setSaveState("saved");
      const clearTimer = setTimeout(() => setSaveState("idle"), 2000);
      return () => clearTimeout(clearTimer);
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, autoSaveEnabled]);

  // Real-time listener for file updates by other collaborators
  useEffect(() => {
    if (!supabaseService.isConfigured()) return;
    const channel = supabaseService.subscribeToFileChanges(activeFile.id, (newBlocks) => {
      const incomingStr = JSON.stringify(newBlocks);

      // 1. If the incoming blocks match what we just saved, it's our own echoed update -> IGNORE
      if (incomingStr === lastSavedBlocksRef.current) {
        return;
      }

      // Ignore updates if the user typed in the last 5 seconds to prevent caret jump and cursor glitches
      if (Date.now() - lastTypingTimeRef.current < 5000) {
        return;
      }

      // 2. If it's different from our current local state, update it (remote collaborator update)
      if (incomingStr !== JSON.stringify(blocksRef.current)) {
        dispatch({ type: "set", blocks: newBlocks });
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      }
    });
    return () => { if (channel) supabaseService.unsubscribe(channel); };
  }, [activeFile.id]);

  const setBlocks = useCallback((next: Block[]) => dispatch({ type: "set", blocks: next }), [dispatch]);

  const switchFile = useCallback((fileId: string) => {
    if (fileId === activeFileId) return;
    // 1. Flush pending edits for current file
    handleContentInput(true);
    const cur = activeFileRef.current;
    persistFile({ ...cur, blocks: blocksRef.current, dateModified: Date.now() });
    // 2. Find target file
    const target = project.files.find(f => f.id === fileId);
    if (!target) return;
    // 3. Re-initialise editor state (new blocks, reset undo history, move focus)
    dispatch({ type: "set", blocks: target.blocks });
    setFocusedId(target.blocks[0]?.id ?? null);
    setActiveFileId(fileId);
    // 4. Update the URL without remounting (replace so back-button stays clean)
    navigate(`/project/${project.id}/file/${fileId}`, { replace: true });
  }, [activeFileId, project, persistFile, navigate]);

  // Sync when URL changes externally (browser back/forward)
  const { fileId: urlFileId } = useParams<{ fileId: string }>();
  useEffect(() => {
    if (urlFileId && urlFileId !== activeFileId) {
      switchFile(urlFileId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlFileId]);

  const updateBlock = (id: string, patch: Partial<Block>) => {
    if (readOnly) return;
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const handleRenameCharacter = async (oldName: string, newName: string | null) => {
    if (readOnly || !newName) return;
    const cleanOld = oldName.trim().toUpperCase();
    const cleanNew = newName.trim().toUpperCase();
    if (!cleanNew || cleanOld === cleanNew) return;

    let confirmed = false;
    const msg = `Are you sure you want to rename character "${cleanOld}" to "${cleanNew}" across the entire script?`;
    if ((window as any).customConfirm) {
      confirmed = await (window as any).customConfirm(msg, "Rename Character");
    } else {
      confirmed = window.confirm(msg);
    }
    if (!confirmed) return;

    const updatedBlocks = blocks.map((b) => {
      if (b.type === "character") {
        const text = b.text || "";
        const match = text.match(/^([^(]+)(\(.*\))?$/);
        if (match) {
          const cleanName = match[1].trim().toUpperCase();
          const paren = match[2] || "";
          if (cleanName === cleanOld) {
            const separator = paren ? " " : "";
            return { ...b, text: `${cleanNew}${separator}${paren}`.trim() };
          }
        }
      }
      return b;
    });

    const children = Array.from(editorRef.current?.children || []);
    children.forEach((child) => {
      const el = child as HTMLElement;
      if (el.getAttribute("data-type") === "character") {
        const text = el.innerText || "";
        const match = text.match(/^([^(]+)(\(.*\))?$/);
        if (match) {
          const cleanName = match[1].trim().toUpperCase();
          const paren = match[2] || "";
          if (cleanName === cleanOld) {
            const separator = paren ? " " : "";
            el.innerText = `${cleanNew}${separator}${paren}`.trim();
          }
        }
      }
    });

    setBlocks(updatedBlocks);
    handleContentInput(true);
  };

  const applyFormat = (command: "bold" | "italic" | "underline") => {
    if (readOnly) return;
    document.execCommand(command);
    if (focusedId) {
      const el = (document.querySelector(`[data-id="${focusedId}"]`) ||
        document.querySelector(`[data-block-id="${focusedId}"]`)) as HTMLDivElement | null;
      if (el) {
        updateBlock(focusedId, { text: el.innerHTML });
      }
    }
  };

  const insertAfter = (id: string, type: BlockType) => {
    if (readOnly) return;
    const idx = blocks.findIndex((b) => b.id === id);
    const nb: Block = { id: uid(), type, text: "" };
    const next = [...blocks.slice(0, idx + 1), nb, ...blocks.slice(idx + 1)];
    setBlocks(next);
    setFocusedId(nb.id);
  };

  const deleteBlock = (id: string) => {
    if (readOnly) return;
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx <= 0) return;
    const next = blocks.filter((b) => b.id !== id);
    setBlocks(next);
    setFocusedId(blocks[idx - 1].id);
  };

  const cycleType = (id: string) => {
    if (readOnly) return;
    const b = blocks.find((x) => x.id === id); if (!b) return;
    const i = TYPE_ORDER.indexOf(b.type);
    const nextType = TYPE_ORDER[(i + 1) % TYPE_ORDER.length];
    updateBlock(id, { type: nextType, text: normalizeText(nextType, b.text) });
  };

  const setType = (id: string, type: BlockType) => {
    if (readOnly) return;
    const b = blocks.find((x) => x.id === id); if (!b) return;

    // Snappy DOM attribute update
    const el = document.querySelector(`[data-id="${id}"]`) as HTMLElement | null;
    if (el) {
      el.setAttribute("data-type", type);
    }

    updateBlock(id, { type, text: normalizeText(type, b.text) });
  };

  // Helper to find the current active block element containing the text selection/caret
  const getSelectionBlock = (): HTMLElement | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    let node = range.startContainer;
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).classList.contains("sp-block")) {
        return node as HTMLElement;
      }
      node = node.parentNode!;
    }
    return null;
  };

  const isUndoRedoRef = useRef(false);

  const handleUndo = () => {
    if (debouncedInputSync.current) {
      clearTimeout(debouncedInputSync.current);
      debouncedInputSync.current = null;
    }
    isUndoRedoRef.current = true;
    dispatch({ type: "undo" });
  };

  const handleRedo = () => {
    if (debouncedInputSync.current) {
      clearTimeout(debouncedInputSync.current);
      debouncedInputSync.current = null;
    }
    isUndoRedoRef.current = true;
    dispatch({ type: "redo" });
  };

  const handleSelectionUpdate = () => {
    const el = getSelectionBlock();
    if (el) {
      const id = el.getAttribute("data-id");
      if (id && id !== focusedId) {
        handleContentInput(true);
        setFocusedId(id);
      }
    }
  };

  const debouncedInputSync = useRef<NodeJS.Timeout | null>(null);

  // DOM to Blocks parser: runs on native user text inputs
  const handleContentInput = (immediate: boolean | React.FormEvent<HTMLDivElement> = false) => {
    if (!editorRef.current) return;

    lastTypingTimeRef.current = Date.now();

    const isImmediate = immediate === true;

    const sync = () => {
      if (!editorRef.current) return;
      const nextBlocks: Block[] = [];
      const children = Array.from(editorRef.current.children);
      const seenIds = new Set<string>();

      children.forEach((child) => {
        const el = child as HTMLElement;

        // Enforce correct block className
        if (!el.classList.contains("sp-block")) {
          el.classList.add("sp-block");
        }

        let id = el.getAttribute("data-id");
        if (!id || seenIds.has(id)) {
          id = uid();
          el.setAttribute("data-id", id);
          el.setAttribute("data-block-id", id);
        }
        seenIds.add(id);

        let type = el.getAttribute("data-type") as BlockType || "action";
        let text = el.innerHTML || "";

        // Cleanup browser placeholder line breaks
        if (text === "<br>" || text === "\n") text = "";

        // Auto-detect Scene Heading type based on Fountain formatting
        const cleanText = el.innerText?.trim() || "";
        const SCENE_RE = /^(INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s]/i;

        if (cleanText.startsWith(".") && !cleanText.startsWith("..")) {
          type = "scene";
          text = cleanText.slice(1).trim();
          el.setAttribute("data-type", "scene");
        } else if (SCENE_RE.test(cleanText)) {
          type = "scene";
          el.setAttribute("data-type", "scene");
        }

        nextBlocks.push({
          id,
          type,
          text,
        });
      });

      const finalBlocks = nextBlocks.length > 0 ? nextBlocks : [{ id: uid(), type: "action" as BlockType, text: "" }];

      // Save stringify comparison CPU time
      if (JSON.stringify(blocksRef.current) !== JSON.stringify(finalBlocks)) {
        blocksRef.current = finalBlocks;
        setBlocks(finalBlocks);
      }
      debouncedInputSync.current = null;
    };

    if (debouncedInputSync.current) {
      clearTimeout(debouncedInputSync.current);
    }

    if (isImmediate) {
      sync();
    } else {
      debouncedInputSync.current = setTimeout(sync, 400); // 400ms debounce
    }
  };

  // Keyboard handlers for Enter (next-type prediction) and Tab (indent cycling)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) {
      e.preventDefault();
      return;
    }

    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
      return;
    }
    if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
      e.preventDefault();
      handleRedo();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const el = getSelectionBlock();
      if (el) {
        const currentType = el.getAttribute("data-type") as BlockType || "action";
        const TYPE_ORDER: BlockType[] = ["scene", "action", "character", "parenthetical", "dialogue"];
        const idx = TYPE_ORDER.indexOf(currentType);
        const nextType = TYPE_ORDER[(idx + 1) % TYPE_ORDER.length];
        el.setAttribute("data-type", nextType);
        handleContentInput(true); // Immediate sync on Tab
      }
      return;
    }

    if (e.key === "Enter") {
      const el = getSelectionBlock();
      if (el) {
        const currentType = el.getAttribute("data-type") as BlockType || "action";
        const text = el.innerText || "";
        const nextType = nextTypeOnEnter(currentType, text);

        // Let the browser perform Enter key splits natively to preserve caretaker placement.
        // Update the formatting rules on the newly created line right after in the event loop tick.
        setTimeout(() => {
          const newEl = getSelectionBlock();
          if (newEl && newEl !== el) {
            newEl.setAttribute("data-type", nextType);
            const id = uid();
            newEl.setAttribute("data-id", id);
            newEl.setAttribute("data-block-id", id);
            handleContentInput(true); // Immediate sync on Enter
          }
        }, 0);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;

    // If it's a single-line paste (no newlines), let the browser handle it natively inline!
    if (!text.includes("\n") && !text.includes("\r")) {
      // Do not prevent default, let browser insert it at the cursor caret
      return;
    }

    // Otherwise, it's a multi-line paste (Fountain or multi-line text).
    // Prevent default so we can parse and split into screenplay blocks.
    e.preventDefault();

    const parsedBlocks = parseFountain(text);
    if (parsedBlocks.length === 0) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    // If editor is completely empty
    const isEmptyEditor = !editorRef.current || editorRef.current.children.length === 0;
    if (isEmptyEditor && editorRef.current) {
      const fragment = document.createDocumentFragment();
      const pastedElements: HTMLElement[] = [];

      parsedBlocks.forEach((b) => {
        const div = document.createElement("div");
        div.className = "sp-block";
        div.setAttribute("data-id", b.id);
        div.setAttribute("data-block-id", b.id);
        div.setAttribute("data-type", b.type);
        div.innerHTML = b.text || "<br>";
        fragment.appendChild(div);
        pastedElements.push(div);
      });

      editorRef.current.appendChild(fragment);

      // Move selection caret to the end of the pasted content
      const lastPastedEl = pastedElements[pastedElements.length - 1];
      try {
        lastPastedEl.focus();
        const newRange = document.createRange();
        newRange.selectNodeContents(lastPastedEl);
        newRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch (err) {
        console.error("Error setting caret after paste:", err);
      }

      handleContentInput(true); // Immediate sync
      return;
    }

    // Find the current block element containing the caret
    const currentBlock = getSelectionBlock();
    if (!currentBlock || !editorRef.current) return;

    const isCurrentEmpty = currentBlock.innerText.trim() === "";

    if (isCurrentEmpty) {
      // Replace the current block with the first pasted block
      const firstBlock = parsedBlocks[0];
      currentBlock.setAttribute("data-type", firstBlock.type);
      currentBlock.innerHTML = firstBlock.text || "<br>";

      // Create DOM elements for the rest of the pasted blocks
      const fragment = document.createDocumentFragment();
      const pastedElements: HTMLElement[] = [currentBlock];

      parsedBlocks.slice(1).forEach((b) => {
        const div = document.createElement("div");
        div.className = "sp-block";
        div.setAttribute("data-id", b.id);
        div.setAttribute("data-block-id", b.id);
        div.setAttribute("data-type", b.type);
        div.innerHTML = b.text || "<br>";
        fragment.appendChild(div);
        pastedElements.push(div);
      });

      if (parsedBlocks.length > 1) {
        if (currentBlock.nextSibling) {
          editorRef.current.insertBefore(fragment, currentBlock.nextSibling);
        } else {
          editorRef.current.appendChild(fragment);
        }
      }

      // Move selection caret to the end of the pasted content
      const lastPastedEl = pastedElements[pastedElements.length - 1];
      try {
        lastPastedEl.focus();
        const newRange = document.createRange();
        newRange.selectNodeContents(lastPastedEl);
        newRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch (err) {
        console.error("Error setting caret after paste:", err);
      }
    } else {
      // Split the current block's content at the cursor
      let beforeText = "";
      let afterText = "";

      try {
        const preRange = range.cloneRange();
        preRange.selectNodeContents(currentBlock);
        preRange.setEnd(range.startContainer, range.startOffset);
        const preHtml = document.createElement("div");
        preHtml.appendChild(preRange.cloneContents());
        beforeText = preHtml.innerHTML;

        const postRange = range.cloneRange();
        postRange.selectNodeContents(currentBlock);
        postRange.setStart(range.endContainer, range.endOffset);
        const postHtml = document.createElement("div");
        postHtml.appendChild(postRange.cloneContents());
        afterText = postHtml.innerHTML;
      } catch (err) {
        // Fallback if range selection splitting fails
        console.error("Range split error, using fallback paste", err);
        beforeText = currentBlock.innerHTML;
        afterText = "";
      }

      // Update the current block with the first part of the text
      currentBlock.innerHTML = beforeText || "<br>";

      // Create DOM elements for the pasted blocks
      const fragment = document.createDocumentFragment();
      const pastedElements: HTMLElement[] = [];

      parsedBlocks.forEach((b) => {
        const div = document.createElement("div");
        div.className = "sp-block";
        div.setAttribute("data-id", b.id);
        div.setAttribute("data-block-id", b.id);
        div.setAttribute("data-type", b.type);
        div.innerHTML = b.text || "<br>";
        fragment.appendChild(div);
        pastedElements.push(div);
      });

      // Append the remaining text of the split block to the last pasted element
      if (afterText && afterText !== "<br>") {
        const lastEl = pastedElements[pastedElements.length - 1];
        if (lastEl.innerHTML === "<br>") {
          lastEl.innerHTML = afterText;
        } else {
          lastEl.innerHTML += afterText;
        }
      }

      // Insert the pasted blocks as siblings right after the current block
      if (currentBlock.nextSibling) {
        editorRef.current.insertBefore(fragment, currentBlock.nextSibling);
      } else {
        editorRef.current.appendChild(fragment);
      }

      // Move selection caret to the end of the pasted content
      const lastPastedEl = pastedElements[pastedElements.length - 1];
      try {
        lastPastedEl.focus();
        const newRange = document.createRange();
        newRange.selectNodeContents(lastPastedEl);
        newRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch (err) {
        console.error("Error setting caret after paste:", err);
      }
    }

    // Sync to state immediately
    handleContentInput(true);
  };

  const scrollToBlock = (id: string) => {
    const el = document.querySelector(`[data-block-id="${id}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setFocusedId(id);

      // Place caret natively at the beginning of the block
      try {
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(true);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      } catch (err) {
        console.error("Caret placement error:", err);
      }
    }
  };

  const recalculatePageBreaks = () => {
    if (!editorRef.current) return;
    const children = Array.from(editorRef.current.children) as HTMLElement[];
    if (children.length === 0) return;

    // Reset all visual page break and split attributes
    children.forEach((el) => {
      el.removeAttribute("data-page-start");
      el.removeAttribute("data-split-more");
      el.removeAttribute("data-split-contd");
      el.style.marginTop = "";
    });

    // Assign Page 1 indicator
    if (children[0]) {
      children[0].setAttribute("data-page-start", "1");
    }

    const maxHeight = 978; // A4 height content area (~54 lines matching PDF export)
    let currentHeight = 0;
    let pageCount = 1;

    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      const type = el.getAttribute("data-type") || "action";
      const isPageStart = i === 0 || el.hasAttribute("data-page-start");

      let marginTop = 0;
      if (!isPageStart) {
        if (type === "scene") marginTop = 18;
        else if (type === "action") marginTop = 9;
        else if (type === "character") marginTop = 13;
      }

      const h = el.offsetHeight + marginTop;
      let neededHeight = h;

      // Protection Rule 1: Never break a character node from the dialogue/parenthetical node that follows it
      if (type === "character") {
        const nextEl = children[i + 1];
        const afterNextEl = children[i + 2];
        if (nextEl) {
          const nextType = nextEl.getAttribute("data-type") || "action";
          let nextMargin = 0;
          if (nextType === "scene") nextMargin = 18;
          else if (nextType === "action") nextMargin = 9;
          else if (nextType === "character") nextMargin = 13;

          if (nextType === "parenthetical" && afterNextEl) {
            const afterNextType = afterNextEl.getAttribute("data-type") || "action";
            let afterNextMargin = 0;
            if (afterNextType === "scene") afterNextMargin = 18;
            else if (afterNextType === "action") afterNextMargin = 9;
            else if (afterNextType === "character") afterNextMargin = 13;

            neededHeight += (nextEl.offsetHeight + nextMargin) + (afterNextEl.offsetHeight + afterNextMargin);
          } else {
            neededHeight += (nextEl.offsetHeight + nextMargin);
          }
        }
      }

      // Protection Rule 2: Never break a parenthetical from the dialogue immediately following it
      if (type === "parenthetical") {
        const nextEl = children[i + 1];
        if (nextEl) {
          const nextType = nextEl.getAttribute("data-type") || "action";
          let nextMargin = 0;
          if (nextType === "scene") nextMargin = 18;
          else if (nextType === "action") nextMargin = 9;
          else if (nextType === "character") nextMargin = 13;
          neededHeight += (nextEl.offsetHeight + nextMargin);
        }
      }

      // Protection Rule 3: Never break a scene heading from the block immediately following it
      if (type === "scene") {
        const nextEl = children[i + 1];
        if (nextEl) {
          const nextType = nextEl.getAttribute("data-type") || "action";
          let nextMargin = 0;
          if (nextType === "scene") nextMargin = 18;
          else if (nextType === "action") nextMargin = 9;
          else if (nextType === "character") nextMargin = 13;
          neededHeight += (nextEl.offsetHeight + nextMargin);
        }
      }

      // Compute breaks
      if (currentHeight + neededHeight > maxHeight) {
        if (type === "dialogue" && currentHeight + 36 < maxHeight) {
          // Dialogue splitting: append (MORE) at bottom, (CONT'D) at top of next page
          el.setAttribute("data-split-more", "true");

          let charName = "CHARACTER";
          for (let j = i - 1; j >= 0; j--) {
            if (children[j].getAttribute("data-type") === "character") {
              charName = children[j].textContent?.trim().replace(/\s*\(.*\)/g, "") || "CHARACTER";
              break;
            }
          }

          pageCount++;
          const nextEl = children[i + 1];
          if (nextEl) {
            nextEl.setAttribute("data-page-start", pageCount.toString());
            // Align next element with top of next page in repeating background grid
            const marginOffset = 1143 - (currentHeight + h);
            nextEl.style.marginTop = `${marginOffset}px`;
            if (nextEl.getAttribute("data-type") === "dialogue") {
              nextEl.setAttribute("data-split-contd", charName);
            }
          }
          currentHeight = 0; // Dialogue split, nextEl is page start, resets height track
        } else {
          pageCount++;
          el.setAttribute("data-page-start", pageCount.toString());
          // Align this element with top of next page in repeating background grid
          const marginOffset = 1143 - currentHeight;
          el.style.marginTop = `${marginOffset}px`;
          currentHeight = h;
        }
      } else {
        currentHeight += h;
      }
    }
  };

  // Sync state blocks to DOM safely without resetting cursor caretaker
  useEffect(() => {
    if (!editorRef.current) return;

    const children = Array.from(editorRef.current.children);

    // 1. Rebuild editor DOM on file switch, initial render, or explicit undo/redo
    if (children.length === 0 ||
      activeFile.id !== editorRef.current.getAttribute("data-active-file-id") ||
      isUndoRedoRef.current) {

      editorRef.current.setAttribute("data-active-file-id", activeFile.id);

      // Save caret position if it was focused before rebuild
      const activeEl = getSelectionBlock();
      const activeId = activeEl?.getAttribute("data-id");
      const cursorOffset = window.getSelection()?.rangeCount
        ? window.getSelection()?.getRangeAt(0).startOffset
        : 0;

      editorRef.current.innerHTML = blocks.map(b =>
        `<div class="sp-block" data-id="${b.id}" data-block-id="${b.id}" data-type="${b.type || "action"}">${b.text || "<br>"}</div>`
      ).join("");

      // Calculate breaks immediately after DOM rebuild
      recalculatePageBreaks();

      isUndoRedoRef.current = false;

      // Restore focus/caret if possible
      if (activeId) {
        const target = editorRef.current.querySelector(`[data-id="${activeId}"]`) as HTMLElement | null;
        if (target) {
          try {
            target.focus();
            const range = document.createRange();

            // Try to set caret precisely in the text node
            let textNode = target.firstChild;
            while (textNode && textNode.nodeType !== Node.TEXT_NODE) {
              textNode = textNode.firstChild;
            }
            if (textNode) {
              const pos = Math.min(cursorOffset || 0, textNode.textContent?.length || 0);
              range.setStart(textNode, pos);
              range.setEnd(textNode, pos);
            } else {
              range.selectNodeContents(target);
              range.collapse(false);
            }
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
          } catch (err) {
            console.error("Caret restore error:", err);
          }
        }
      }
      return;
    }

    // 2. Sync incoming edits/local formatting changes for lines the user is NOT currently focusing/editing
    if (debouncedInputSync.current !== null) {
      return;
    }

    const activeBlockEl = getSelectionBlock();
    const stateIds = new Set(blocks.map((b) => b.id));
    const domMap = new Map<string, HTMLElement>();

    // Clean up DOM elements that were deleted in state, and index the rest
    const currentChildren = Array.from(editorRef.current.children);
    currentChildren.forEach((child) => {
      const el = child as HTMLElement;
      const id = el.getAttribute("data-id");
      if (id) {
        if (!stateIds.has(id)) {
          el.remove();
        } else {
          domMap.set(id, el);
        }
      }
    });

    blocks.forEach((b) => {
      const el = domMap.get(b.id);
      if (el) {
        const isActive = activeBlockEl === el;
        if (!isActive) {
          if (el.innerHTML !== (b.text || "<br>")) {
            el.innerHTML = b.text || "<br>";
          }
          if (el.getAttribute("data-type") !== b.type) {
            el.setAttribute("data-type", b.type || "action");
          }
        }
      } else {
        // Safe full rebuild if blocks were added/deleted externally by a collaborator
        const isEditing = activeBlockEl !== null;
        if (!isEditing && editorRef.current) {
          editorRef.current.innerHTML = blocks.map(b =>
            `<div class="sp-block" data-id="${b.id}" data-block-id="${b.id}" data-type="${b.type || "action"}">${b.text || "<br>"}</div>`
          ).join("");
        }
      }
    });

    // Run real measurement-based A4 page breaks calculation on dynamic sync updates
    recalculatePageBreaks();
  }, [blocks, activeFile.id]);

  // Global key bindings for shortcuts
  useEffect(() => {
    if (readOnly) return;
    const h = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault(); handleUndo();
      } else if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault(); handleRedo();
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
  }, [focusedId, readOnly, saveManually]);

  const pages = useMemo(() => paginate(blocks), [blocks]);
  const stats = useMemo(() => computeStats(blocks), [blocks]);

  const scenes = useMemo(() => {
    const list: { id: string; number: number; text: string }[] = [];
    let n = 0;
    for (const b of blocks) {
      if (b.type === "scene") { n++; list.push({ id: b.id, number: n, text: b.text }); }
    }
    return list;
  }, [blocks]);

  const sceneNumberFor = (id: string) => scenes.find((s) => s.id === id)?.number;

  const characterNames = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      if (b.type !== "character") continue;
      const plain = stripHtml(b.text);
      const n = plain.replace(/\(.*?\)|\(.*?\)/g, "").trim().toUpperCase();
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



  // Find active metrics page/scene number based on cursor focus
  const activePageNum = useMemo(() => {
    if (!focusedId) return 1;
    const idx = pages.findIndex(p => p.some(b => b.id === focusedId));
    return idx !== -1 ? idx + 1 : 1;
  }, [pages, focusedId]);

  const activeSceneNum = useMemo(() => {
    if (!focusedId) return 1;
    let currentSceneNum = 1;
    for (const b of blocks) {
      if (b.type === "scene") {
        if (b.id === focusedId) return currentSceneNum;
        const sceneNum = sceneNumberFor(b.id);
        if (sceneNum !== undefined) currentSceneNum = sceneNum;
      }
      if (b.id === focusedId) break;
    }
    return currentSceneNum;
  }, [blocks, focusedId]);

  // Comments state loading and syncing (Supabase with localStorage fallback)
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");

  useEffect(() => {
    if (activeRightTab === "comments") {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments.length, activeRightTab]);

  useEffect(() => {
    let active = true;

    const loadComments = async () => {
      if (!supabaseService.isConfigured()) {
        const saved = localStorage.getItem(`comments:${activeFileId}`);
        if (saved && active) {
          setComments(JSON.parse(saved));
        } else if (active) {
          // Default mock fallback comments
          setComments([
            {
              id: "c1",
              author: "Sarah K.",
              avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=sarah",
              text: "Love the opening line - 'closes its eyes and pretends' is poetry",
              timestamp: "2h ago",
              sceneLabel: "Scene 1 • Cole V.O."
            },
            {
              id: "c2",
              author: "James R.",
              avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=james",
              text: "Should we clarify Vera's motivation earlier? Her entrance feels slightly abrupt.",
              timestamp: "45m ago",
              sceneLabel: "Scene 1 • Vera entrance"
            }
          ]);
        }
        return;
      }

      const { data, error } = await supabaseService.fetchComments(activeFileId);
      if (error) {
        console.error("Error fetching comments:", error);
      } else if (data && active) {
        const mapped: Comment[] = data.map((c: any) => ({
          id: c.id,
          author: c.author,
          avatar: c.avatar,
          text: c.text,
          timestamp: c.timestamp,
          sceneLabel: c.scene_label || undefined
        }));
        setComments(mapped);
      }
    };

    loadComments();

    const channel = supabaseService.subscribeToComments(
      activeFileId,
      (newComment) => {
        if (!active) return;
        setComments((prev) => {
          if (prev.some((c) => c.id === newComment.id)) return prev;
          return [
            ...prev,
            {
              id: newComment.id,
              author: newComment.author,
              avatar: newComment.avatar,
              text: newComment.text,
              timestamp: newComment.timestamp,
              sceneLabel: newComment.scene_label || undefined
            }
          ];
        });
      },
      (deletedId) => {
        if (!active) return;
        setComments((prev) => prev.filter((c) => c.id !== deletedId));
      }
    );

    return () => {
      active = false;
      if (channel) supabaseService.unsubscribe(channel);
    };
  }, [activeFileId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    let sceneLabel = "";
    if (focusedId) {
      let activeSceneNum = 1;
      let activeSceneText = "";
      for (const b of blocks) {
        if (b.type === "scene") {
          activeSceneText = stripHtml(b.text);
          const sceneNum = sceneNumberFor(b.id);
          if (sceneNum !== undefined) activeSceneNum = sceneNum;
        }
        if (b.id === focusedId) break;
      }
      sceneLabel = `Scene ${activeSceneNum} • ${activeSceneText || "Untitled Scene"}`;
    }

    const ncId = uid();
    const cleanAuthor = user?.name || "Anonymous";
    const cleanAvatar = user?.avatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${cleanAuthor}`;
    const cleanTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " today";

    const localComment: Comment = {
      id: ncId,
      author: cleanAuthor,
      avatar: cleanAvatar,
      text: newCommentText.trim(),
      timestamp: cleanTimestamp,
      sceneLabel: sceneLabel || undefined
    };

    setComments((prev) => [...prev, localComment]);
    setNewCommentText("");

    if (supabaseService.isConfigured()) {
      const { error } = await supabaseService.insertComment({
        id: ncId,
        file_id: activeFileId,
        author: cleanAuthor,
        avatar: cleanAvatar,
        text: newCommentText.trim(),
        timestamp: cleanTimestamp,
        scene_label: sceneLabel || undefined
      });
      if (error) {
        console.error("Failed to save comment:", error);
      }
    } else {
      const updated = [...comments, localComment];
      localStorage.setItem(`comments:${activeFileId}`, JSON.stringify(updated));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    if (supabaseService.isConfigured()) {
      const { error } = await supabaseService.deleteComment(commentId);
      if (error) {
        console.error("Failed to delete comment:", error);
      }
    } else {
      const updated = comments.filter((c) => c.id !== commentId);
      localStorage.setItem(`comments:${activeFileId}`, JSON.stringify(updated));
    }
  };

  // Add scene helper
  const handleAddSceneBlock = () => {
    if (readOnly) return;
    const newScene: Block = { id: uid(), type: "scene", text: "INT. NEW LOCATION - DAY" };
    setBlocks([...blocks, newScene]);
    setTimeout(() => scrollToBlock(newScene.id), 50);
  };

  const activeBlockType = focusedId ? blocks.find(b => b.id === focusedId)?.type : "scene";

  return (
    <div className="sp-app" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "var(--sp-bg)" }}>

      {/* 1. Redesigned Premium Main Header */}
      {!isMobile && (
        <header className="sp-desktop-only sp-no-print" style={{
          height: 64,
          background: "var(--sp-toolbar)",
          borderBottom: "1px solid var(--sp-border)",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          justifyContent: "space-between",
          zIndex: 30
        }}>

          {/* Left Area: Brand & Document Meta */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ color: "var(--sp-accent)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>WriterDute</span>

            <button
              onClick={back}
              style={{
                background: "#1e1e24",
                border: "1px solid var(--sp-border)",
                borderRadius: 8,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--sp-text)",
                cursor: "pointer"
              }}
              title="Back to projects"
            >
              <ChevronLeft size={16} />
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{activeFile.title}</span>
              <span style={{ fontSize: 11, color: "var(--sp-muted)", fontWeight: 500 }}>{project.title} • Feature Film</span>
            </div>
          </div>

          {/* Right Area: Save indicators, users list, and controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Save Status indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              {!autoSaveEnabled && saveState === "idle" ? (
                <>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#71717a" }} />
                  <span style={{ color: "var(--sp-muted)" }}>Manual Save Mode</span>
                </>
              ) : saveState === "saving" ? (
                <>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
                  <span style={{ color: "var(--sp-muted)" }}>Saving...</span>
                </>
              ) : (
                <>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                  <span style={{ color: "var(--sp-muted)" }}>Saved</span>
                </>
              )}
            </div>

            {/* Active Collaborator Avatars */}
            <div style={{ display: "flex", alignItems: "center" }}>
              {onlineUsers.map((u, idx) => (
                <Avatar
                  key={u.email || idx}
                  src={u.avatar}
                  name={u.name || u.email || "User"}
                  size={28}
                  style={{
                    border: "1px solid #ffffff5b",
                    marginRight: idx < onlineUsers.length - 1 ? -8 : 0,
                    zIndex: onlineUsers.length - idx,
                  }}
                />
              ))}
            </div>

            {/* Collaborators Count Badge */}
            <div style={{
              fontSize: 11,
              color: "#10b981",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              padding: "4px 10px",
              borderRadius: 20,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 5
            }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#10b981" }} />
              {Math.max(1, onlineUsers.length)} live
            </div>

            {/* Share button */}
            <button
              className="sp-btn sp-btn-ghost sp-btn-icon"
              onClick={() => setShowShare(true)}
              title="Invite & Share"
              style={{ padding: 8, color: "var(--sp-muted)" }}
            >
              <Share2 size={16} />
            </button>

            {/* Save Draft primary button */}
            <button
              className="sp-btn sp-btn-ghost sp-btn-icon"
              onClick={saveManually}
              style={{ padding: 8, color: "var(--sp-muted)" }}
            >
              <Save size={14} />
            </button>

            {/* Title Page button */}
            <button
              className="sp-btn sp-btn-ghost"
              onClick={() => setShowTitlePage(true)}
              title="Edit Title Page details"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", border: "1px solid var(--sp-border)", color: "var(--sp-text)" }}
            >
              <FileText size={14} /> Title Page
            </button>

            {/* Download button */}
            <button
              className="sp-btn sp-btn-primary "
              onClick={() => setShowExport(true)}
              title="Download screenplay"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px" }}
            >
              <Download size={16} /> Export
            </button>

            {/* More options menu */}
            <div style={{ position: "relative" }}>
              <button
                className="sp-btn sp-btn-ghost sp-btn-icon"
                onClick={() => setShowMenu(!showMenu)}
                title="More options"
                style={{ padding: 8, color: "var(--sp-muted)" }}
              >
                <MoreHorizontal size={16} />
              </button>
              {showMenu && (
                <div className="sp-menu" style={{ right: 0, top: 40 }}>
                  <button onClick={() => { setShowTitlePage(true); setShowMenu(false); }}>
                    <FileText size={14} /> Title Page Settings
                  </button>
                  <button onClick={() => { setShowHelp(true); setShowMenu(false); }}>
                    <AlertCircle size={14} /> Help & Shortcuts
                  </button>
                  <button onClick={() => { setShowExport(true); setShowMenu(false); }}>
                    <Download size={14} /> Export Screenplay
                  </button>
                  <div style={{ height: 1, background: "var(--sp-border)", margin: "4px 0" }} />
                  <button
                    onClick={toggleAutoSave}
                    style={{ justifyContent: "space-between" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        display: "inline-block",
                        width: 3,
                        height: 14,
                        borderRadius: 2,
                        background: autoSaveEnabled ? "var(--sp-accent)" : "var(--sp-border)",
                        flexShrink: 0
                      }} />
                      Auto-Save Changes
                    </span>
                    <span style={{
                      width: 16,
                      height: 16,
                      border: `2px solid ${autoSaveEnabled ? "var(--sp-accent)" : "var(--sp-muted)"}`,
                      borderRadius: 4,
                      background: autoSaveEnabled ? "var(--sp-accent)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      {autoSaveEnabled && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#0f0f11" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  </button>
                  <div style={{ height: 1, background: "var(--sp-border)", margin: "4px 0" }} />
                  <button
                    onClick={() => setShowBlockBars(v => !v)}
                    style={{ justifyContent: "space-between" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        display: "inline-block",
                        width: 3,
                        height: 14,
                        borderRadius: 2,
                        background: showBlockBars ? "var(--sp-accent)" : "var(--sp-border)",
                        flexShrink: 0
                      }} />
                      Block Type Bars
                    </span>
                    <span style={{
                      width: 16,
                      height: 16,
                      border: `2px solid ${showBlockBars ? "var(--sp-accent)" : "var(--sp-muted)"}`,
                      borderRadius: 4,
                      background: showBlockBars ? "var(--sp-accent)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      {showBlockBars && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#0f0f11" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Mobile-only Header */}
      {isMobile && (
        <header className="sp-mobile-only sp-header sp-no-print">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={back}
              className="sp-mobile-bar-icon-btn"
              style={{ width: 32, height: 32, borderRadius: 8, background: "#1e1e24", border: "1px solid var(--sp-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}
              title="Back"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={() => setShowScenes(v => !v)}
              className="sp-mobile-bar-icon-btn"
              style={{ width: 32, height: 32, borderRadius: 8, background: "#1e1e24", border: "1px solid var(--sp-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}
            >
              <Menu size={16} />
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{activeFile.title}</span>
              <span style={{ fontSize: 10, color: "var(--sp-muted)", fontWeight: 500 }}>{project.title} • Feature Film</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Active Collaborator Avatars */}
            <div style={{ display: "flex", alignItems: "center" }}>
              {onlineUsers.slice(0, 3).map((u, idx) => (
                <Avatar
                  key={u.email || idx}
                  src={u.avatar}
                  name={u.name || u.email || "User"}
                  size={22}
                  style={{
                    border: "1px solid #ffffff5b",
                    marginRight: idx < Math.min(3, onlineUsers.length) - 1 ? -6 : 0,
                    zIndex: onlineUsers.length - idx,
                  }}
                />
              ))}
            </div>

            {/* Yellow Saved Button Status */}
            {saveState === "saving" ? (
              <button className="sp-mobile-save-btn saving">
                <span className="dot" /> Saving
              </button>
            ) : !autoSaveEnabled && saveState === "idle" ? (
              <button className="sp-mobile-save-btn" onClick={saveManually} style={{ background: "#2e2e38", color: "#fff" }}>
                <span className="dot" style={{ background: "#71717a" }} /> Manual Save
              </button>
            ) : (
              <button className="sp-mobile-save-btn saved" onClick={saveManually}>
                <span className="dot" /> Saved
              </button>
            )}

            {/* Options menu vertical three dots */}
            <div style={{ position: "relative" }}>
              <button
                className="sp-mobile-bar-icon-btn"
                onClick={() => setShowMenu(!showMenu)}
                title="More options"
                style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "#1e1e24" }}
              >
                <MoreHorizontal size={14} />
              </button>
              {showMenu && (
                <div className="sp-menu" style={{ right: 0, top: 36, zIndex: 210 }}>
                  <button onClick={() => { setShowTitlePage(true); setShowMenu(false); }}>
                    <FileText size={14} /> Title Page Settings
                  </button>
                  <button onClick={() => { setShowHelp(true); setShowMenu(false); }}>
                    <AlertCircle size={14} /> Help & Shortcuts
                  </button>
                  <button onClick={() => { setShowExport(true); setShowMenu(false); }}>
                    <Download size={14} /> Export Screenplay
                  </button>
                  <div style={{ height: 1, background: "var(--sp-border)", margin: "4px 0" }} />
                  <button
                    onClick={() => { toggleAutoSave(); setShowMenu(false); }}
                    style={{ justifyContent: "space-between" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        display: "inline-block",
                        width: 3,
                        height: 14,
                        borderRadius: 2,
                        background: autoSaveEnabled ? "var(--sp-accent)" : "var(--sp-border)",
                        flexShrink: 0
                      }} />
                      Auto-Save Changes
                    </span>
                    <span style={{
                      width: 16,
                      height: 16,
                      border: `2px solid ${autoSaveEnabled ? "var(--sp-accent)" : "var(--sp-muted)"}`,
                      borderRadius: 4,
                      background: autoSaveEnabled ? "var(--sp-accent)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      {autoSaveEnabled && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#0f0f11" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Workspace Frame split into left-sidebar, center-canvas, and right-sidebar */}
      <div
        className="sp-workspace-frame"
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          position: isMobile ? undefined : "relative"
        }}
      >

        {/* Mobile Left Sidebar Backdrop */}
        {isMobile && showScenes && (
          <div
            className="sp-sidebar-backdrop"
            onClick={() => setShowScenes(false)}
          />
        )}

        {/* 2. Redesigned Left Sidebar: Files, Scenes & Collaborators list */}
        {!focusMode && showScenes && (
          <aside className="sp-sidebar sp-sidebar-left sp-no-print" style={{
            width: 250,
            borderRight: "1px solid var(--sp-border)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "16px 14px",
            background: "var(--sp-sidebar)"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24, overflowY: "auto", flex: 1 }}>

              {isMobile && (
                <div style={{ borderBottom: "1px solid var(--sp-border)", paddingBottom: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>WriterDesk</span>
                    <button
                      onClick={() => setShowScenes(false)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "#1e1e24",
                        border: "1px solid var(--sp-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        cursor: "pointer"
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button onClick={back} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: "var(--sp-text)", fontSize: 13, cursor: "pointer", padding: "6px 0", textAlign: "left" }}>
                      <ChevronLeft size={14} /> Back to Files
                    </button>
                    <button onClick={() => navigate("/projects")} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: "var(--sp-text)", fontSize: 13, cursor: "pointer", padding: "6px 0", textAlign: "left" }}>
                      <span style={{ fontSize: 14, marginRight: 2 }}>⌂</span> Projects Dashboard
                    </button>
                  </div>
                </div>
              )}

              {/* FILES Section */}
              <div>
                <div className="sp-sidebar-header">FILES</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {project.files.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => switchFile(f.id)}
                      className={`sp-file-item ${f.id === activeFileId ? "active" : ""}`}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {getFileIcon(f.type || "script")}
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{f.title}</span>
                      </div>
                      <span className="sp-file-page-badge">{calculateScriptPages(f.blocks || [], !!(f.titlePage?.title && f.titlePage.title.trim()))} pp</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SCENES Outline Section */}
              <div>
                <div className="sp-sidebar-header">SCENES</div>
                {scenes.length === 0 ? (
                  <p style={{ fontSize: 12, color: "var(--sp-muted)", fontStyle: "italic", padding: "0 8px" }}>No scenes added yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {scenes.map((s) => {
                      const active = focusedId === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => scrollToBlock(s.id)}
                          className={`sp-scene-item ${active ? "active" : ""}`}
                        >
                          <span className="sp-scene-num-box">{s.number}</span>
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {getCleanSceneTitle(s.text)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <button
                  onClick={handleAddSceneBlock}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "transparent",
                    border: "none",
                    color: "var(--sp-accent)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "8px 10px",
                    marginTop: 8
                  }}
                >
                  + Add Scene
                </button>
              </div>

            </div>

            {/* Bottom Section: Collaborators active statuses */}
            <div style={{ borderTop: "1px solid var(--sp-border)", paddingTop: 16, marginTop: 12 }}>
              <div className="sp-sidebar-header">Collaborators</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {uniqueMembers.map((m) => (
                  <div key={m.email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar src={m.avatar} name={m.name} size={24} style={{ background: "#2e2e34" }} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: m.isOnline ? "var(--sp-text)" : "var(--sp-muted)" }}>{m.name}</span>
                    </div>
                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: m.isOnline ? "#10b981" : "transparent",
                      border: m.isOnline ? "none" : "1px solid var(--sp-border)",
                      marginLeft: "auto"
                    }} />
                  </div>
                ))}
              </div>
            </div>

          </aside>
        )}

        {/* 3. Center Screenplay Editor Workspace */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--sp-bg)", position: "relative" }}>

          {/* A. Floating formatting and text toolbar */}
          {!isMobile && (
            <div className="sp-desktop-only sp-no-print" style={{
              height: 52,
              borderBottom: "1px solid var(--sp-border)",
              background: "var(--sp-toolbar)",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              justifyContent: "space-between",
              zIndex: 10
            }}>

              {/* Element blocks selector tabs */}
              <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
                {(["scene", "action", "character", "dialogue", "parenthetical"] as BlockType[]).map((t) => {
                  const active = activeBlockType === t;

                  const elementLabels: Record<BlockType, string> = {
                    scene: "Scene Heading",
                    action: "Action",
                    character: "Character",
                    dialogue: "Dialogue",
                    parenthetical: "Parenthetical"
                  };

                  return (
                    <button
                      key={t}
                      onMouseDown={(e) => { e.preventDefault(); if (focusedId) setType(focusedId, t); }}
                      className={`sp-btn ${active ? "sp-btn-active" : ""}`}
                      style={{ padding: "6px 12px", fontSize: 12, height: 32, display: "flex", alignItems: "center", gap: 6 }}
                    >
                      {t === "scene" && <Film size={12} />}
                      {t === "action" && <FileText size={12} />}
                      {t === "character" && <User size={12} />}
                      {t === "dialogue" && <MessageSquare size={12} />}
                      {elementLabels[t]}
                    </button>
                  );
                })}
              </div>

              {/* Formatting tools divider & buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 1, height: 20, background: "var(--sp-border)", margin: "0 8px" }} />

                <button
                  className="sp-btn sp-btn-ghost sp-btn-icon"
                  onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }}
                  style={{ width: 32, height: 32, padding: 6, color: "var(--sp-text)" }}
                  title="Bold"
                >
                  <Bold size={13} />
                </button>
                <button
                  className="sp-btn sp-btn-ghost sp-btn-icon"
                  onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }}
                  style={{ width: 32, height: 32, padding: 6, color: "var(--sp-text)" }}
                  title="Italic"
                >
                  <Italic size={13} />
                </button>
                <button
                  className="sp-btn sp-btn-ghost sp-btn-icon"
                  onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }}
                  style={{ width: 32, height: 32, padding: 6, color: "var(--sp-text)" }}
                  title="Underline"
                >
                  <Underline size={13} />
                </button>

                <div style={{ width: 1, height: 20, background: "var(--sp-border)", margin: "0 8px" }} />

                <button
                  className="sp-btn sp-btn-ghost sp-btn-icon"
                  disabled={state.past.length === 0}
                  onMouseDown={(e) => { e.preventDefault(); if (state.past.length > 0) handleUndo(); }}
                  style={{ width: 32, height: 32, padding: 6, opacity: state.past.length === 0 ? 0.4 : 1, cursor: state.past.length === 0 ? "not-allowed" : "pointer" }}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 size={13} />
                </button>
                <button
                  className="sp-btn sp-btn-ghost sp-btn-icon"
                  disabled={state.future.length === 0}
                  onMouseDown={(e) => { e.preventDefault(); if (state.future.length > 0) handleRedo(); }}
                  style={{ width: 32, height: 32, padding: 6, opacity: state.future.length === 0 ? 0.4 : 1, cursor: state.future.length === 0 ? "not-allowed" : "pointer" }}
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 size={13} />
                </button>

                <div style={{ width: 1, height: 20, background: "var(--sp-border)", margin: "0 8px" }} />

                <button className="sp-btn sp-btn-ghost sp-btn-icon" style={{ width: 32, height: 32, padding: 6 }} title="Search / Find"><Search size={13} /></button>
                <button className="sp-btn sp-btn-ghost sp-btn-icon" onClick={() => setShowScenes(v => !v)} style={{ width: 32, height: 32, padding: 6 }} title="Toggle outline layout"><Maximize2 size={13} /></button>
              </div>
            </div>
          )}

          {isMobile && (
            <div className="sp-mobile-only sp-no-print sp-mobile-format-bar" style={{
              height: 48,
              borderBottom: "1px solid var(--sp-border)",
              background: "var(--sp-toolbar)",
              display: "none", /* overridden by CSS */
              alignItems: "center",
              padding: "0 10px",
              overflowX: "auto",
              scrollbarWidth: "none"
            }}>
              <div style={{ display: "flex", gap: 6 }}>
                {(["scene", "action", "character", "dialogue", "parenthetical"] as BlockType[]).map((t) => {
                  const active = activeBlockType === t;
                  const elementLabelsMobile: Record<BlockType, string> = {
                    scene: "Scene",
                    action: "Action",
                    character: "Character",
                    dialogue: "Dialogue",
                    parenthetical: "Paren."
                  };
                  return (
                    <button
                      key={t}
                      onMouseDown={(e) => { e.preventDefault(); if (focusedId) setType(focusedId, t); }}
                      className={`sp-btn ${active ? "sp-btn-active" : ""}`}
                      style={{ padding: "4px 10px", fontSize: 12, height: 30, flexShrink: 0 }}
                    >
                      {elementLabelsMobile[t]}
                    </button>
                  );
                })}

                {/* Divider */}
                <div style={{ width: 1, height: 20, background: "var(--sp-border)", alignSelf: "center", margin: "0 4px", flexShrink: 0 }} />

                {/* B I U */}
                <button
                  onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }}
                  className="sp-mobile-bar-icon-btn"
                  style={{ width: 30, height: 30, padding: 0, flexShrink: 0 }}
                >
                  <Bold size={12} />
                </button>
                <button
                  onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }}
                  className="sp-mobile-bar-icon-btn"
                  style={{ width: 30, height: 30, padding: 0, flexShrink: 0 }}
                >
                  <Italic size={12} />
                </button>
                <button
                  onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }}
                  className="sp-mobile-bar-icon-btn"
                  style={{ width: 30, height: 30, padding: 0, flexShrink: 0 }}
                >
                  <Underline size={12} />
                </button>

                {/* Divider */}
                <div style={{ width: 1, height: 20, background: "var(--sp-border)", alignSelf: "center", margin: "0 4px", flexShrink: 0 }} />

                {/* Undo / Redo */}
                <button
                  disabled={state.past.length === 0}
                  onMouseDown={(e) => { e.preventDefault(); if (state.past.length > 0) handleUndo(); }}
                  className="sp-mobile-bar-icon-btn"
                  style={{ width: 30, height: 30, padding: 0, flexShrink: 0, opacity: state.past.length === 0 ? 0.4 : 1, cursor: state.past.length === 0 ? "not-allowed" : "pointer" }}
                >
                  <Undo2 size={12} />
                </button>
                <button
                  disabled={state.future.length === 0}
                  onMouseDown={(e) => { e.preventDefault(); if (state.future.length > 0) handleRedo(); }}
                  className="sp-mobile-bar-icon-btn"
                  style={{ width: 30, height: 30, padding: 0, flexShrink: 0, opacity: state.future.length === 0 ? 0.4 : 1, cursor: state.future.length === 0 ? "not-allowed" : "pointer" }}
                >
                  <Redo2 size={12} />
                </button>

                {/* Divider */}
                <div style={{ width: 1, height: 20, background: "var(--sp-border)", alignSelf: "center", margin: "0 4px", flexShrink: 0 }} />

                {/* Search */}
                <button
                  className="sp-mobile-bar-icon-btn"
                  style={{ width: 30, height: 30, padding: 0, flexShrink: 0 }}
                >
                  <Search size={12} />
                </button>
              </div>
            </div>
          )}

          {/* B. Metrics and page selectors subbar */}
          {!isMobile && (
            <div className="sp-desktop-only sp-no-print" style={{
              height: 40,
              borderBottom: "1px solid var(--sp-border)",
              background: "rgba(24, 24, 28, 0.4)",
              display: "flex",
              alignItems: "center",
              padding: "0 20px",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--sp-muted)",
              zIndex: 10
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span>Page {activePageNum}/{pages.length}</span>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--sp-border)" }} />
                <span>Scene {activeSceneNum} of {Math.max(1, scenes.length)}</span>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--sp-border)" }} />
                <span>~{Math.max(1, Math.round(pages.length * 1.2))} min read</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* Focus mode switch toggle */}
                <button
                  onClick={() => setFocusMode(!focusMode)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: focusMode ? "var(--sp-accent)" : "var(--sp-muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 600
                  }}
                >
                  {focusMode ? <EyeOff size={13} /> : <Eye size={13} />}
                  Focus Mode
                </button>

                <span style={{ width: 1, height: 16, background: "var(--sp-border)" }} />

                {/* Zoom controls inline */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button className="sp-btn sp-btn-ghost sp-btn-icon" onClick={zoomOut} style={{ padding: 2, height: 20, width: 20 }} disabled={userZoom <= ZOOM_MIN}>-</button>
                  <span style={{ minWidth: 40, textAlign: "center", fontSize: 11, fontWeight: 700 }}>{Math.round(userZoom * 100)}%</span>
                  <button className="sp-btn sp-btn-ghost sp-btn-icon" onClick={zoomIn} style={{ padding: 2, height: 20, width: 20 }} disabled={userZoom >= ZOOM_MAX}>+</button>
                </div>
              </div>
            </div>
          )}

          {isMobile && (
            <div className="sp-mobile-only sp-no-print sp-mobile-metrics-bar" style={{
              display: "none", /* overridden by CSS */
              height: 36,
              borderBottom: "1px solid var(--sp-border)",
              background: "rgba(24, 24, 28, 0.4)",
              alignItems: "center",
              padding: "0 10px",
              justifyContent: "space-between",
              fontSize: 11,
              color: "var(--sp-muted)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ background: "#1e1e24", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                  Pg {activePageNum} / {pages.length}
                </span>
                <span>•</span>
                <span>Scene {activeSceneNum} of {Math.max(1, scenes.length)}</span>
                <span>•</span>
                <span>~{Math.max(1, Math.round(pages.length * 1.2))} min read</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#10b981", fontWeight: 500 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />
                Auto-saved
              </div>
            </div>
          )}

          {/* C. Physical sheet pagination canvas */}
          <div ref={canvasRef} className="sp-canvas" style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px 6px 100px 6px" : "24px 0", ...({ "--page-scale": pageScale } as React.CSSProperties) }}>
            <div className="sp-page-wrapper" style={{ margin: isMobile ? "8px auto 20px auto" : "0 auto 40px auto", width: isMobile ? "100%" : "794px", height: "auto" }}>
              <div
                ref={editorRef}
                className="sp-page sp-script-editor-canvas"
                contentEditable={!readOnly}
                suppressContentEditableWarning
                spellCheck={false}
                {...{
                  autocomplete: "off",
                  autocorrect: "off",
                  autocapitalize: "off"
                }}
                onInput={handleContentInput}
                onBlur={() => handleContentInput(true)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onKeyUp={handleSelectionUpdate}
                onMouseUp={handleSelectionUpdate}
                onFocus={handleSelectionUpdate}
                style={{
                  outline: "none",
                  height: "auto",
                  minHeight: isMobile ? "100vh" : "1123px",
                  padding: isMobile ? "36px 18px 120px 18px" : "96px 96px 96px 144px",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

        </div>

        {/* 4. Redesigned Right Sidebar: Comments & Revision History */}
        {!focusMode && !isMobile && (
          <aside className="sp-sidebar sp-desktop-only sp-no-print" style={{
            width: 280,
            borderLeft: "1px solid var(--sp-border)",
            borderRight: "none",
            display: "flex",
            flexDirection: "column",
            background: "var(--sp-sidebar)",
            padding: 0
          }}>

            {/* Header Tabs switcher */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--sp-border)", background: "#16161a" }}>
              <button
                onClick={() => setActiveRightTab("comments")}
                style={{
                  flex: 1,
                  padding: "14px 0",
                  background: "transparent",
                  border: "none",
                  color: activeRightTab === "comments" ? "var(--sp-accent)" : "var(--sp-muted)",
                  borderBottom: activeRightTab === "comments" ? "2px solid var(--sp-accent)" : "2px solid transparent",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Comments
              </button>
              <button
                onClick={() => setActiveRightTab("characters")}
                style={{
                  flex: 1,
                  padding: "14px 0",
                  background: "transparent",
                  border: "none",
                  color: activeRightTab === "characters" ? "var(--sp-accent)" : "var(--sp-muted)",
                  borderBottom: activeRightTab === "characters" ? "2px solid var(--sp-accent)" : "2px solid transparent",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Characters
              </button>
            </div>

            {/* Content pane depending on active tab selection */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, minHeight: 0 }}>

              {activeRightTab === "comments" ? (
                /* Tab content: Comments List */
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, minHeight: 0 }}>
                  <div style={{ padding: "16px 14px", overflowY: "auto", flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--sp-muted)", letterSpacing: "0.08em", marginBottom: 12 }}>
                      {comments.length} COMMENTS
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {comments.map((c) => (
                        <div key={c.id} className="sp-comment-card">
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <Avatar src={c.avatar} name={c.author} size={22} style={{ background: "#2e2e34" }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{c.author}</span>
                            <span style={{ fontSize: 10, color: "var(--sp-muted)", marginLeft: "auto" }}>{c.timestamp}</span>
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--sp-muted)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "2px 4px",
                                borderRadius: 4,
                                transition: "all 0.15s ease"
                              }}
                              className="sp-comment-delete-btn"
                              title="Delete comment"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <p style={{ fontSize: 12, color: "var(--sp-text)", lineHeight: 1.4, margin: 0 }}>
                            {c.text}
                          </p>
                          {c.sceneLabel && (
                            <span className="sp-comment-linked-scene">{c.sceneLabel}</span>
                          )}
                        </div>
                      ))}
                      <div ref={commentsEndRef} />
                    </div>
                  </div>

                  {/* Add comment input form */}
                  <form onSubmit={handlePostComment} style={{ padding: 14, borderTop: "1px solid var(--sp-border)", background: "#16161a" }}>
                    <textarea
                      required
                      rows={2}
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      style={{
                        width: "100%",
                        background: "#0f0f11",
                        border: "1px solid var(--sp-border)",
                        borderRadius: 10,
                        padding: "8px 10px",
                        fontSize: 12,
                        color: "#fff",
                        outline: "none",
                        resize: "none",
                        marginBottom: 10
                      }}
                    />
                    <button type="submit" className="sp-btn sp-btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: 12, padding: "8px 0" }}>
                      Post Comment
                    </button>
                  </form>
                </div>
              ) : (
                /* Tab content: Characters detected list */
                <div style={{ padding: "16px 14px", overflowY: "auto", flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--sp-muted)", letterSpacing: "0.08em", marginBottom: 12 }}>
                    CHARACTERS IN SCRIPT
                  </div>
                  {characterNames.length === 0 ? (
                    <p style={{ fontSize: 12, color: "var(--sp-muted)", fontStyle: "italic" }}>No characters detected yet.</p>
                  ) : (
                    <div>
                      {characterNames.map((name) => (
                        <div key={name} style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          border: "1px solid var(--sp-border)",
                          borderRadius: 8,
                          background: "#16161a",
                          marginBottom: 6
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#60A5FA" }} />
                            <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "#fff" }}>{name}</span>
                          </div>
                          {!readOnly && (
                            <button
                              onClick={() => {
                                const newName = window.prompt(`Rename character "${name}" to:`, name);
                                if (newName) {
                                  handleRenameCharacter(name, newName);
                                }
                              }}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--sp-muted)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "4px",
                                borderRadius: 4,
                                transition: "all 0.15s ease",
                              }}
                              className="sp-char-edit-btn"
                              title="Rename character across script"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

          </aside>
        )}

      </div>

      {/* Renders all Modals */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showExport && <ExportModal project={{ ...project, files: project.files.map((f) => f.id === activeFile.id ? activeFile : f) }} defaultFileId={activeFileId} onClose={() => setShowExport(false)} />}
      {showShare && <ShareModal projectId={project.id} projectTitle={project.title} onClose={() => setShowShare(false)} />}
      {showTitlePage && (
        <TitlePageModal
          initial={activeFile.titlePage || {
            title: (project.title || activeFile.title || "UNTITLED PROJECT").toUpperCase(),
            credit: "written by",
            author: user?.name || "Writer",
            source: "",
            draftDate: `Draft 1 · ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
            contact: user?.email || "",
          }}
          onClose={() => setShowTitlePage(false)}
          onSave={(tp) => { persistFile({ ...activeFile, titlePage: tp, dateModified: Date.now() }); setShowTitlePage(false); }}
        />
      )}

      {/* Mobile-only Bottom Navigation Bar */}
      {isMobile && (
        <div className="sp-mobile-bottom-bar sp-no-print">
          <div className="sp-mobile-bottom-left-icons">
            {/* Save Icon (disk) */}
            <button
              onClick={saveManually}
              className="sp-mobile-bar-icon-btn"
              title="Save screenplay"
            >
              <Save size={18} />
            </button>
            {/* Share Icon */}
            <button
              onClick={() => setShowShare(true)}
              className="sp-mobile-bar-icon-btn"
              title="Share project"
            >
              <Share2 size={18} />
            </button>
            {/* Collaborators / Sidebar Toggle Icon */}
            <button
              onClick={() => setShowScenes(v => !v)}
              className="sp-mobile-bar-icon-btn"
              title="Outline & files"
            >
              <Users size={18} />
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Export Button */}
            <button
              onClick={() => setShowExport(true)}
              className="sp-mobile-export-btn"
            >
              <Download size={14} /> Export
            </button>
            {/* Comments trigger Button */}
            <button
              onClick={() => setActiveMobileTab("comments")}
              className="sp-mobile-comments-trigger-btn"
            >
              Comments
              {comments.length > 0 && (
                <span className="sp-mobile-comments-badge">
                  {comments.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Mobile-only Bottom Sheet Drawer */}
      {isMobile && activeMobileTab && (
        <>
          {/* Backdrop */}
          <div
            className="sp-sidebar-backdrop"
            onClick={() => setActiveMobileTab(null)}
          />

          {/* Bottom Sheet container */}
          <div className="sp-mobile-bottom-sheet">
            {/* Grab handle */}
            <div className="sp-mobile-sheet-handle" />

            {/* Sheet Tabs Header */}
            <div className="sp-mobile-sheet-header">
              <div className="sp-mobile-sheet-tabs">
                <button
                  onClick={() => setActiveMobileTab("comments")}
                  className={`sp-mobile-sheet-tab ${activeMobileTab === "comments" ? "active" : ""}`}
                >
                  Comments <span className="sp-tab-badge">{comments.length}</span>
                </button>
                <button
                  onClick={() => setActiveMobileTab("characters")}
                  className={`sp-mobile-sheet-tab ${activeMobileTab === "characters" ? "active" : ""}`}
                >
                  Characters
                </button>
              </div>

              <button
                onClick={() => setActiveMobileTab(null)}
                className="sp-mobile-sheet-close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sheet Content Pane */}
            <div className="sp-mobile-sheet-content">
              {activeMobileTab === "comments" && (
                <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
                  <div style={{ overflowY: "auto", flex: 1, padding: "12px 0" }}>
                    {comments.length === 0 ? (
                      <p style={{ fontSize: 12, color: "var(--sp-muted)", fontStyle: "italic", textAlign: "center", marginTop: 20 }}>No comments yet.</p>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} className="sp-comment-card">
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <Avatar src={c.avatar} name={c.author} size={22} style={{ background: "#2e2e34" }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{c.author}</span>
                            <span style={{ fontSize: 10, color: "var(--sp-muted)", marginLeft: "auto" }}>{c.timestamp}</span>
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="sp-comment-delete-btn"
                              title="Delete comment"
                              style={{ background: "transparent", border: "none", color: "var(--sp-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <p style={{ fontSize: 12, color: "var(--sp-text)", lineHeight: 1.4, margin: 0 }}>
                            {c.text}
                          </p>
                          {c.sceneLabel && (
                            <span className="sp-comment-linked-scene">{c.sceneLabel}</span>
                          )}
                        </div>
                      ))
                    )}
                    <div ref={commentsEndRef} />
                  </div>

                  {/* Post comment form */}
                  <form onSubmit={handlePostComment} className="sp-mobile-comment-form">
                    <textarea
                      required
                      rows={1}
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="sp-mobile-comment-input"
                    />
                    <button type="submit" className="sp-mobile-comment-send">
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              )}

              {activeMobileTab === "characters" && (
                <div style={{ overflowY: "auto", height: "100%", padding: "12px 0" }}>
                  {characterNames.length === 0 ? (
                    <p style={{ fontSize: 12, color: "var(--sp-muted)", fontStyle: "italic" }}>No characters detected yet.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {characterNames.map((name) => (
                        <div key={name} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 12px",
                          border: "1px solid var(--sp-border)",
                          borderRadius: 8,
                          background: "#16161a"
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#60A5FA" }} />
                          <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "#fff" }}>{name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
