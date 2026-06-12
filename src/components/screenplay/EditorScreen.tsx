import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Block, BlockType, FileDoc, Project } from "../../types/screenplay";
import { uid } from "../../utils/uid";
import { normalizeText, nextTypeOnEnter, TYPE_ORDER } from "../../utils/formatting";
import { sceneSuggestions, characterSuggestions } from "../../utils/suggestions";
import { paginate } from "../../utils/pagination";
import { computeStats } from "../../utils/stats";
import { editorReducer } from "../../hooks/useEditorReducer";
import { PageCanvas } from "./PageCanvas";
import { HelpModal } from "../modals/HelpModal";
import { ExportModal } from "../modals/ExportModal";
import { TitlePageModal } from "../modals/TitlePageModal";
import { ShareModal } from "../modals/ShareModal";
import { supabase } from "../../utils/supabaseClient";
import { supabaseService } from "../../utils/supabaseService";
import { 
  ChevronLeft, Undo2, Redo2, Search, Maximize2, Minimize2, Eye, EyeOff, 
  Film, FileText, User, MessageSquare, AlertCircle, Trash2, Mail, CheckCircle, Clock, 
  Share2, Download, MoreHorizontal, Save, Check, Loader2, Bold, Italic, Underline, MessageCircle, Users
} from "lucide-react";
import { Avatar } from "./Avatar";

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
  project, initialFileId, user, back, persistFile, addFiles,
}: { 
  project: Project; 
  initialFileId: string;
  user: { name: string; email: string; avatar: string }; 
  back: () => void; 
  persistFile: (f: FileDoc) => void; 
  addFiles: (newFiles: FileDoc[], openId?: string) => void 
}) {

  const navigate = useNavigate();

  // ─── Active File Management (in-place switching, no remount) ───────────────
  const [activeFileId, setActiveFileId] = useState(initialFileId);
  const activeFile = project.files.find(f => f.id === activeFileId) ?? project.files[0];

  const [state, dispatch] = useReducer(editorReducer, { past: [], present: activeFile.blocks, future: [] });
  const blocks = state.present;
  const [focusedId, setFocusedId] = useState<string | null>(activeFile.blocks[0]?.id ?? null);
  const [showScenes, setShowScenes] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [sceneNumbersOn, setSceneNumbersOn] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [showBlockBars, setShowBlockBars] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState<"comments" | "characters">("comments");
  const [userZoom, setUserZoom] = useState(1);
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

  const zoomIn  = () => setUserZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 10) / 10));
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

  const saveManually = useCallback(() => {
    setSaveState("saving");
    persistFile({ ...activeFile, blocks, dateModified: Date.now() });
    setSaveState("saved");
    const t = setTimeout(() => setSaveState("idle"), 2000);
    return () => clearTimeout(t);
  }, [blocks, activeFile, persistFile]);

  // Auto-save on block changes
  useEffect(() => {
    if (blocks === activeFile.blocks) return;
    setSaveState("saving");
    const timer = setTimeout(() => {
      persistFile({ ...activeFile, blocks, dateModified: Date.now() });
      setSaveState("saved");
      const clearTimer = setTimeout(() => setSaveState("idle"), 2000);
      return () => clearTimeout(clearTimer);
    }, 2000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  // Real-time listener for file updates by other collaborators
  useEffect(() => {
    if (!supabaseService.isConfigured()) return;
    const channel = supabaseService.subscribeToFileChanges(activeFile.id, (newBlocks) => {
      if (JSON.stringify(newBlocks) !== JSON.stringify(blocksRef.current)) {
        dispatch({ type: "set", blocks: newBlocks });
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      }
    });
    return () => { if (channel) supabaseService.unsubscribe(channel); };
  }, [activeFile.id]);

  const setBlocks = useCallback((next: Block[]) => dispatch({ type: "set", blocks: next }), [dispatch]);

  // ─── Flush current file to storage & switch in-place ───────────────────────
  const activeFileRef = useRef(activeFile);
  useEffect(() => { activeFileRef.current = activeFile; }, [activeFile]);

  const blocksRef = useRef(blocks);
  useEffect(() => { blocksRef.current = blocks; }, [blocks]);

  const switchFile = useCallback((fileId: string) => {
    if (fileId === activeFileId) return;
    // 1. Flush pending edits for current file
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
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const applyFormat = (command: "bold" | "italic" | "underline") => {
    document.execCommand(command);
    if (focusedId) {
      const el = document.querySelector(`[data-block-id="${focusedId}"]`) as HTMLDivElement | null;
      if (el) {
        updateBlock(focusedId, { text: el.innerHTML });
      }
    }
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

  // Global key bindings
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      // Handle delete/backspace/typing when selection spans multiple blocks
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        
        // Find all blocks that are partially or fully inside the selection
        const ids: string[] = [];
        blocksRef.current.forEach((b) => {
          const el = document.querySelector(`[data-block-id="${b.id}"]`);
          if (el && sel.containsNode(el, true)) {
            ids.push(b.id);
          }
        });
        
        if (ids.length > 1) {
          const isDelete = e.key === "Backspace" || e.key === "Delete";
          const isPrintable = e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey;
          
          if (isDelete || isPrintable) {
            e.preventDefault();
            
            const firstBlockId = ids[0];
            const lastBlockId = ids[ids.length - 1];
            
            const firstEl = document.querySelector(`[data-block-id="${firstBlockId}"]`) as HTMLElement | null;
            const lastEl = document.querySelector(`[data-block-id="${lastBlockId}"]`) as HTMLElement | null;
            
            if (firstEl && lastEl) {
              // Helper to find caret offset in plain text
              const getCaretOffset = (element: HTMLElement, isStart: boolean) => {
                try {
                  const preCaretRange = range.cloneRange();
                  preCaretRange.selectNodeContents(element);
                  if (isStart) {
                    preCaretRange.setEnd(range.startContainer, range.startOffset);
                  } else {
                    preCaretRange.setEnd(range.endContainer, range.endOffset);
                  }
                  return preCaretRange.toString().length;
                } catch (err) {
                  return isStart ? 0 : element.textContent?.length || 0;
                }
              };
              
              const startOffset = getCaretOffset(firstEl, true);
              const endOffset = getCaretOffset(lastEl, false);
              
              const firstText = firstEl.textContent || "";
              const lastText = lastEl.textContent || "";
              
              const beforeText = firstText.substring(0, startOffset);
              const afterText = lastText.substring(endOffset);
              
              const typed = isPrintable ? e.key : "";
              const mergedText = beforeText + typed + afterText;
              
              // Construct next blocks
              const nextBlocks: Block[] = [];
              blocksRef.current.forEach((b) => {
                if (b.id === firstBlockId) {
                  nextBlocks.push({ ...b, text: mergedText });
                } else if (!ids.includes(b.id)) {
                  nextBlocks.push(b);
                }
              });
              
              if (nextBlocks.length === 0) {
                nextBlocks.push({ id: uid(), type: "action", text: "" });
              }
              
              setBlocks(nextBlocks);
              setFocusedId(firstBlockId);
              
              // Place cursor at the merge point in the next event loop tick
              setTimeout(() => {
                const el = document.querySelector(`[data-block-id="${firstBlockId}"]`) as HTMLElement | null;
                if (el) {
                  el.focus();
                  const targetSel = window.getSelection();
                  if (targetSel) {
                    const newRange = document.createRange();
                    // Try to find the text node to place the cursor precisely
                    let textNode = el.firstChild;
                    while (textNode && textNode.nodeType !== Node.TEXT_NODE) {
                      textNode = textNode.firstChild;
                    }
                    if (textNode) {
                      const caretPos = Math.min(beforeText.length + typed.length, textNode.textContent?.length || 0);
                      newRange.setStart(textNode, caretPos);
                      newRange.setEnd(textNode, caretPos);
                    } else {
                      newRange.selectNodeContents(el);
                      newRange.collapse(false);
                    }
                    targetSel.removeAllRanges();
                    targetSel.addRange(newRange);
                  }
                }
              }, 10);
            }
            return;
          }
        }
      }

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
  }, [blocks, activeFile, saveManually, focusedId]);

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

  const scrollToBlock = (id: string) => {
    const el = document.querySelector(`[data-block-id="${id}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setFocusedId(id);
    }
  };

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
    const newScene: Block = { id: uid(), type: "scene", text: "INT. NEW LOCATION - DAY" };
    setBlocks([...blocks, newScene]);
    setTimeout(() => scrollToBlock(newScene.id), 50);
  };

  const activeBlockType = focusedId ? blocks.find(b => b.id === focusedId)?.type : "scene";

  return (
    <div className="sp-app" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "var(--sp-bg)" }}>
      
      {/* 1. Redesigned Premium Main Header */}
      <header className="sp-no-print" style={{ 
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
            {saveState === "saving" ? (
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

          {/* Download button */}
          <button 
            className="sp-btn sp-btn-primary " 
            onClick={() => setShowExport(true)} 
            title="Download screenplay"
            style={{display: "flex", alignItems: "center", gap: 6, padding: "8px 16px"  }}
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
                        <path d="M1 4L3.5 6.5L9 1" stroke="#0f0f11" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Frame split into left-sidebar, center-canvas, and right-sidebar */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}>
        
        {/* 2. Redesigned Left Sidebar: Files, Scenes & Collaborators list */}
        {!focusMode && showScenes && (
          <aside className="sp-sidebar sp-no-print" style={{ 
            width: 250, 
            borderRight: "1px solid var(--sp-border)", 
            display: "flex", 
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "16px 14px",
            background: "var(--sp-sidebar)"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24, overflowY: "auto", flex: 1 }}>
              
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
                        <FileText size={14} style={{ opacity: f.id === activeFileId ? 1 : 0.6 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{f.title}</span>
                      </div>
                      <span className="sp-file-page-badge">{f.blocks ? Math.max(1, Math.ceil(f.blocks.length / 22)) : 1} pp</span>
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
          <div className="sp-no-print" style={{
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

              <button className="sp-btn sp-btn-ghost sp-btn-icon" onMouseDown={(e) => { e.preventDefault(); dispatch({ type: "undo" }); }} style={{ width: 32, height: 32, padding: 6 }} title="Undo (Ctrl+Z)"><Undo2 size={13} /></button>
              <button className="sp-btn sp-btn-ghost sp-btn-icon" onMouseDown={(e) => { e.preventDefault(); dispatch({ type: "redo" }); }} style={{ width: 32, height: 32, padding: 6 }} title="Redo (Ctrl+Y)"><Redo2 size={13} /></button>

              <div style={{ width: 1, height: 20, background: "var(--sp-border)", margin: "0 8px" }} />

              <button className="sp-btn sp-btn-ghost sp-btn-icon" style={{ width: 32, height: 32, padding: 6 }} title="Search / Find"><Search size={13} /></button>
              <button className="sp-btn sp-btn-ghost sp-btn-icon" onClick={() => setShowScenes(v => !v)} style={{ width: 32, height: 32, padding: 6 }} title="Toggle outline layout"><Maximize2 size={13} /></button>
            </div>
          </div>

          {/* B. Metrics and page selectors subbar */}
          <div className="sp-no-print" style={{
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

          {/* C. Physical sheet pagination canvas */}
          <div ref={canvasRef} className="sp-canvas" style={{ flex: 1, ...({ "--page-scale": pageScale } as React.CSSProperties) }}>
            <PageCanvas
              pages={pages}
              file={activeFile}
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
              showBlockBars={showBlockBars}
            />
          </div>

        </div>

        {/* 4. Redesigned Right Sidebar: Comments & Revision History */}
        {!focusMode && (
          <aside className="sp-sidebar sp-no-print" style={{
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
                          gap: 8, 
                          padding: "8px 12px", 
                          border: "1px solid var(--sp-border)", 
                          borderRadius: 8, 
                          background: "#16161a", 
                          marginBottom: 6 
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

          </aside>
        )}

      </div>

      {/* Renders all Modals */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showExport && <ExportModal project={project} defaultFileId={activeFileId} onClose={() => setShowExport(false)} />}
      {showShare && <ShareModal projectId={project.id} projectTitle={project.title} onClose={() => setShowShare(false)} />}
      {showTitlePage && (
        <TitlePageModal
          initial={activeFile.titlePage}
          onClose={() => setShowTitlePage(false)}
          onSave={(tp) => { persistFile({ ...activeFile, titlePage: tp, dateModified: Date.now() }); setShowTitlePage(false); }}
        />
      )}
    </div>
  );
}
