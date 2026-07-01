import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, Plus, Trash2, Sparkles, Check, Menu, X, Undo, Redo, FileText, Lightbulb, User, List, Film } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Project, FileDoc, Shot } from "../../types/screenplay";
import { uid } from "../../utils/uid";
import { exportShotListCSV, exportShotListPDF } from "../../utils/export";
import { Avatar } from "../screenplay/Avatar";
import { supabaseService } from "../../utils/supabaseService";
import { supabase } from "../../utils/supabaseClient";

interface ShotListEditorProps {
  project: Project;
  file: FileDoc;
  user: { id?: string; name: string; email: string; avatar: string };
  back: () => void;
  persistFile: (f: FileDoc) => void;
  readOnly?: boolean;
}

const SHOT_SIZES = ["EWS", "WS", "MWS", "MS", "MCU", "CU", "ECU", "Detail"];
const SHOT_TYPES = ["Deep Focus", "Shallow Focus", "Shoulder Level", "Eye Level", "Over-the-Shoulder", "POV", "Two-Shot", "Low Angle", "High Angle"];
const MOVEMENTS = ["Static", "Pan", "Tilt", "Dolly", "Zoom", "Tracking", "Handheld", "Boom / Jib"];
const EQUIPMENTS = ["Tripod", "Handheld", "Steadicam", "Gimbal", "Dolly", "Slider", "Jib", "Drone"];
const LENSES = ["Wide Angle", "Normal", "Telephoto", "Mobile", "18mm", "24mm", "35mm", "50mm", "85mm", "100mm"];
const INT_EXT_OPTIONS = ["INT", "EXT", "I/E"];

// Differentiated icons for sidebar files list
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

export function ShotListEditor({
  project,
  file,
  user,
  back,
  persistFile,
  readOnly = false,
}: ShotListEditorProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(file.title);
  const [shots, setShots] = useState<Shot[]>(file.shotList || []);
  const [creationMode, setCreationMode] = useState<"manual" | "generated" | "empty">(file.shotListCreationMode || "empty");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  
  // Custom dropdown positioning states
  const [openDropdown, setOpenDropdown] = useState<{ shotId: string; field: string; rect: DOMRect; options: string[]; openAbove: boolean; menuHeight: number } | null>(null);
  
  // Sidebar visibility states
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const [showSidebar, setShowSidebar] = useState(typeof window !== "undefined" ? window.innerWidth >= 768 : true);
  const [zoomScale, setZoomScale] = useState(1.0);
  
  // Highlights
  const [highlightedScene, setHighlightedScene] = useState<number | null>(null);
  const highlightTimeout = useRef<any>(null);

  // Hovered scene for bottom centered add/remove scene action buttons trigger
  const [hoveredSceneNumber, setHoveredSceneNumber] = useState<number | null>(null);

  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const debounceTimer = useRef<any>(null);

  // Undo / Redo History stack states
  const [history, setHistory] = useState<Shot[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize history stack
  useEffect(() => {
    if (shots.length > 0 && history.length === 0) {
      setHistory([shots]);
      setHistoryIndex(0);
    }
  }, [shots, history]);

  // Re-initialize state when active file changes externally
  useEffect(() => {
    setTitle(file.title);
    setShots(file.shotList || []);
    setCreationMode(file.shotListCreationMode || "empty");
    setHistory(file.shotList ? [file.shotList] : []);
    setHistoryIndex(file.shotList ? 0 : -1);
  }, [file.id]);

  // Handle Ctrl+Z and Ctrl+Y Undo/Redo keyboard triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, history]);

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const prevShots = history[prevIndex];
      setShots(prevShots);
      triggerSave(title, prevShots, creationMode);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const nextShots = history[nextIndex];
      setShots(nextShots);
      triggerSave(title, nextShots, creationMode);
    }
  };

  const updateShotsWithHistory = (newShots: Shot[]) => {
    setShots(newShots);
    
    // Clear redo history if we make a fresh action
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newShots);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);

    triggerSave(title, newShots, creationMode);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Presence channel logic
  useEffect(() => {
    if (!supabaseService.isConfigured()) {
      setOnlineUsers([{
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        online_at: new Date().toISOString()
      }]);
      return;
    }

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
      supabaseService.unsubscribe(presenceChannel);
    };
  }, [project.id, user]);

  const scriptScenes = useMemo(() => {
    const scriptFiles = project.files.filter(f => f.type === "script");
    if (scriptFiles.length === 0) return [];
    const mainScript = scriptFiles[0];
    return mainScript.blocks.filter(b => b.type === "scene").map(b => b.text.replace(/<[^>]*>/g, "").trim().toUpperCase());
  }, [project.files]);

  // Auto-save logic
  const triggerSave = (updatedTitle: string, updatedShots: Shot[], updatedMode: "manual" | "generated" | "empty") => {
    setSaveStatus("saving");
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const updatedFile: FileDoc = {
        ...file,
        title: updatedTitle,
        shotList: updatedShots,
        shotListCreationMode: updatedMode,
        dateModified: Date.now(),
      };
      persistFile(updatedFile);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 1000);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    triggerSave(newTitle, shots, creationMode);
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = shots.length;
    const scenesCovered = new Set(shots.map(s => s.sceneNumber)).size;
    const planned = shots.filter(s => s.status === "Planned").length;
    const completed = shots.filter(s => s.status === "Shot").length;

    return { total, scenesCovered, planned, completed };
  }, [shots]);

  // List of unique scenes inside the shot list for sidebar display
  const sidebarScenes = useMemo(() => {
    const sceneMap = new Map<number, string>();
    shots.forEach((s) => {
      if (!sceneMap.has(s.sceneNumber)) {
        sceneMap.set(s.sceneNumber, s.sceneHeading || "Untitled Scene");
      }
    });
    return Array.from(sceneMap.entries()).sort((a, b) => a[0] - b[0]);
  }, [shots]);

  // Sorted unique scene numbers list for scene differentiation calculation
  const uniqueScenesList = useMemo(() => {
    return Array.from(new Set(shots.map(s => s.sceneNumber))).sort((a, b) => a - b);
  }, [shots]);

  // Highlight rows of a scene and scroll to it
  const handleSceneClick = (sceneNumber: number) => {
    const firstShot = shots.find(s => s.sceneNumber === sceneNumber);
    if (firstShot) {
      const element = document.getElementById(`shot-row-${firstShot.id}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    setHighlightedScene(sceneNumber);
    if (highlightTimeout.current) clearTimeout(highlightTimeout.current);
    highlightTimeout.current = setTimeout(() => {
      setHighlightedScene(null);
    }, 2000);
  };

  // Update single field
  const updateShotField = (shotId: string, field: keyof Shot, value: any) => {
    if (readOnly) return;
    const updated = shots.map((s) => {
      if (s.id === shotId) {
        return { ...s, [field]: value };
      }
      return s;
    });
    updateShotsWithHistory(updated);
  };

  // Toggle status
  const toggleStatus = (shotId: string, currentStatus: string) => {
    if (readOnly) return;
    const nextStatus = currentStatus === "Shot" ? "Planned" : "Shot";
    updateShotField(shotId, "status", nextStatus);
  };

  // Append new shot after a specific index
  const addShotAfter = (index: number) => {
    if (readOnly) return;
    const currentShot = shots[index];
    
    let nextShotLabel = "1";
    const parsed = parseInt(currentShot.shotLabel);
    if (!isNaN(parsed)) {
      nextShotLabel = `${parsed + 1}`;
    }

    const newShot: Shot = {
      id: uid(),
      sceneNumber: currentShot.sceneNumber,
      shotLabel: nextShotLabel,
      sceneHeading: currentShot.sceneHeading,
      description: "",
      shotType: "WS",
      angle: "Deep Focus",
      movement: "Static",
      lens: "Wide Angle",
      status: "Planned",
      equipment: "Tripod",
      intExt: currentShot.intExt || "INT",
      note: ""
    };

    const updated = [...shots];
    updated.splice(index + 1, 0, newShot);
    
    const nextMode = creationMode === "empty" ? "manual" : creationMode;
    setCreationMode(nextMode);
    updateShotsWithHistory(updated);
  };

  // Add shot at the end
  const addShotAtEnd = () => {
    if (readOnly) return;
    if (shots.length === 0) {
      const newShot: Shot = {
        id: uid(),
        sceneNumber: 1,
        shotLabel: "1",
        sceneHeading: "",
        description: "",
        shotType: "WS",
        angle: "Deep Focus",
        movement: "Static",
        lens: "Wide Angle",
        status: "Planned",
        equipment: "Tripod",
        intExt: "INT",
        note: ""
      };
      setCreationMode("manual");
      updateShotsWithHistory([newShot]);
      return;
    }
    addShotAfter(shots.length - 1);
  };

  // Generate shots from screenplay
  const generateFromScript = () => {
    if (readOnly) return;
    if (scriptScenes.length === 0) {
      alert("No screenplay/script files found in this project to generate a shot list.");
      return;
    }

    let startingSceneNum = shots.reduce((max, s) => Math.max(max, s.sceneNumber), 0) + 1;
    const newShots: Shot[] = [];

    scriptScenes.forEach((headingText, idx) => {
      newShots.push({
        id: uid(),
        sceneNumber: startingSceneNum + idx,
        shotLabel: "1",
        sceneHeading: headingText || "UNTITLED SCENE",
        description: "",
        shotType: "WS",
        angle: "Deep Focus",
        movement: "Static",
        lens: "Wide Angle",
        status: "Planned",
        equipment: "Tripod",
        intExt: headingText.startsWith("EXT") ? "EXT" : "INT",
        note: ""
      });
    });

    const updated = [...shots, ...newShots];
    setCreationMode("generated");
    updateShotsWithHistory(updated);
  };

  // Delete shot without alert confirm popup distraction
  const deleteShot = (shotId: string) => {
    if (readOnly) return;
    const updated = shots.filter(s => s.id !== shotId);
    setCreationMode(updated.length === 0 ? "empty" : creationMode);
    updateShotsWithHistory(updated);
  };

  // Add scene after a specific scene number (shifts subsequent ones)
  const addSceneAfter = (sceneNum: number) => {
    if (readOnly) return;
    const newSceneNum = sceneNum + 1;
    
    // Shift subsequent scenes by 1
    const updated = shots.map((s) => {
      if (s.sceneNumber >= newSceneNum) {
        return { ...s, sceneNumber: s.sceneNumber + 1 };
      }
      return s;
    });

    const lastShotIndex = updated.map(s => s.sceneNumber).lastIndexOf(sceneNum);
    
    const newShot: Shot = {
      id: uid(),
      sceneNumber: newSceneNum,
      shotLabel: "1",
      sceneHeading: `SCENE ${newSceneNum}`,
      description: "",
      shotType: "WS",
      angle: "Deep Focus",
      movement: "Static",
      lens: "Wide Angle",
      status: "Planned",
      equipment: "Tripod",
      intExt: "INT",
      note: ""
    };

    updated.splice(lastShotIndex + 1, 0, newShot);
    updateShotsWithHistory(updated);
  };

  const addScene = () => {
    if (readOnly) return;
    const maxSceneNum = shots.reduce((max, s) => Math.max(max, s.sceneNumber), 0);
    addSceneAfter(maxSceneNum);
  };

  const removeLastScene = () => {
    if (readOnly) return;
    const maxSceneNum = shots.reduce((max, s) => Math.max(max, s.sceneNumber), 0);
    if (maxSceneNum > 0) {
      deleteScene(maxSceneNum);
    }
  };

  // Delete entire scene (and all its shots) without confirm alerts
  const deleteScene = (sceneNumber: number) => {
    if (readOnly) return;
    const updated = shots.filter((s) => s.sceneNumber !== sceneNumber);
    setCreationMode(updated.length === 0 ? "empty" : creationMode);
    updateShotsWithHistory(updated);
  };

  const handleExportCSV = () => {
    exportShotListCSV(shots, file.title);
  };

  const handleExportPDF = () => {
    exportShotListPDF(shots, file.title);
  };

  const handleDropdownTrigger = (shotId: string, field: string, options: string[], e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = Math.min(260, options.length * 35 + 8);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < menuHeight && rect.top > menuHeight;
    
    setOpenDropdown({
      shotId,
      field,
      rect,
      options,
      openAbove,
      menuHeight
    });
  };

  return (
    <div className="sp-shotlist-container">
      <style dangerouslySetInnerHTML={{
        __html: `
        .sp-shotlist-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #09090b;
          color: #e4e4e7;
          font-family: var(--sp-font-ui);
          overflow: hidden;
        }

        /* Script editor header styling */
        .sp-shotlist-navbar {
          height: 64px;
          background: #111115;
          border-bottom: 1px solid #1a1a22;
          display: flex;
          align-items: center;
          padding: 0 20px;
          justify-content: space-between;
          z-index: 30;
          flex-shrink: 0;
        }

        .sp-shotlist-nav-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .sp-brand-logo {
          color: var(--sp-accent);
          font-weight: 800;
          font-size: 18px;
          letter-spacing: -0.02em;
        }

        .sp-shotlist-back-btn {
          background: #1e1e24;
          border: 1px solid #272730;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--sp-text);
          cursor: pointer;
        }

        .sp-shotlist-title-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sp-shotlist-title-input {
          background: transparent;
          border: none;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          outline: none;
          width: 250px;
        }

        .sp-shotlist-subtitle {
          font-size: 11px;
          color: #71717a;
          font-weight: 500;
        }

        .sp-shotlist-navbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* Save status styles */
        .sp-save-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }

        .sp-save-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .sp-view-only-badge {
          font-size: 11px;
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.2);
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(248, 113, 113, 0.05);
          font-weight: 600;
        }

        .sp-live-badge {
          font-size: 11px;
          color: #10b981;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        /* Workspace main frame */
        .sp-shotlist-workspace {
          display: flex;
          flex: 1;
          min-height: 0;
          position: relative;
        }

        /* Sidebar styles matching Script Editor */
        .sp-sidebar-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 24px;
        }



        /* Scenes shortcut list */
        .sp-sidebar-scene-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          border-radius: 8px;
          transition: all 0.15s;
        }

        .sp-sidebar-scene-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .sp-sidebar-scene-delete-btn {
          background: transparent;
          border: none;
          color: #f87171;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.15s;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
        }

        .sp-sidebar-scene-row:hover .sp-sidebar-scene-delete-btn {
          opacity: 0.6;
        }

        .sp-sidebar-scene-row:hover .sp-sidebar-scene-delete-btn:hover {
          opacity: 1;
          background: rgba(248, 113, 113, 0.05);
        }

        .sp-sidebar-scene-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          background: transparent;
          border: none;
          color: #d4d4d8;
          font-size: 12.5px;
          font-weight: 500;
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
        }

        .sp-sidebar-scene-item:hover {
          background: rgba(255, 255, 255, 0.03);
          color: #fff;
        }

        .sp-sidebar-scene-num-badge {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid #272730;
          color: var(--sp-accent);
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          min-width: 24px;
          text-align: center;
        }

        .sp-sidebar-scene-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        /* Collaborators status */
        .sp-sidebar-collab-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 4px 8px;
        }

        .sp-sidebar-collab-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        /* Sidebar Toggle Burger Button */
        .sp-sidebar-toggle-btn {
          background: #1e1e24;
          border: 1px solid #272730;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          cursor: pointer;
        }

        /* Table Spreadsheet Styles */
        .sp-shotlist-editor-content {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
          background: #09090b;
        }

        .sp-shotlist-toolbar {
          height: 52px;
          background: #111115;
          border-bottom: 1px solid #1a1a22;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          flex-shrink: 0;
        }

        .sp-shotlist-tool-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          color: #e4e4e7;
          font-size: 12.5px;
          font-weight: 600;
          padding: 6px 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .sp-shotlist-tool-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        .sp-shotlist-tool-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .sp-shotlist-table-wrapper {
          flex: 1;
          overflow: auto;
          position: relative;
        }

        .sp-sheet-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 13px;
        }

        .sp-sheet-th {
          background-color: #111115;
          color: #71717a;
          font-weight: 600;
          text-align: left;
          padding: 12px 14px;
          border-bottom: 1px solid #1a1a22;
          position: sticky;
          top: 0;
          z-index: 10;
          text-transform: uppercase;
          font-size: 10.5px;
          letter-spacing: 0.06em;
        }

        .sp-sheet-th.sticky-col {
          z-index: 12;
        }

        .sp-sheet-td {
          border-bottom: 1px solid #14141a;
          padding: 10px 14px;
          vertical-align: middle;
          box-sizing: border-box;
          transition: background-color 0.2s;
        }

        /* Hover states */
        tr:hover .sp-sheet-td {
          background-color: #16161e !important;
        }

        /* Alternating Scene Background Colors (Airtable style) */
        tr.even-scene .sp-sheet-td {
          background-color: #09090b;
        }

        tr.odd-scene .sp-sheet-td {
          background-color: #111115;
        }

        /* Thicker horizontal scene divider lines */
        tr.last-in-scene .sp-sheet-td {
          border-bottom: 2px solid rgba(255, 255, 255, 0.12) !important;
        }

        .sticky-col {
          position: sticky;
          z-index: 2;
        }

        /* Overriding sticky background colors dynamically based on alternating scene class */
        tr.even-scene .sticky-col-1, tr.even-scene .sticky-col-2 {
          background-color: #09090b !important;
        }

        tr.odd-scene .sticky-col-1, tr.odd-scene .sticky-col-2 {
          background-color: #111115 !important;
        }

        .sticky-col-1 {
          left: 0;
          width: 60px;
        }

        .sticky-col-2 {
          left: 60px;
          width: 60px;
          border-right: 1px solid #1a1a22;
        }

        .sp-bold-num {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          text-align: center;
          width: 100%;
        }

        /* Contenteditable description placeholder */
        .sp-cell-input-clean-textarea:empty:before {
          content: attr(placeholder);
          color: #52525b;
          cursor: text;
        }

        /* Highlight Row Glow keyframe animation */
        @keyframes sp-row-glow {
          0% { background-color: rgba(99, 102, 241, 0.25); }
          100% { background-color: transparent; }
        }

        .sp-row-highlighted td {
          animation: sp-row-glow 2s ease-out forwards;
        }

        /* Circular checkbox status trigger */
        .sp-status-btn {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #3f3f46;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: transparent;
          transition: all 0.2s;
          color: transparent;
        }

        .sp-status-btn.status-Shot {
          border-color: #6366f1;
          background: #6366f1;
          color: #fff;
        }

        /* Custom dropdown style */
        .sp-cell-select-custom {
          cursor: pointer;
          color: #d4d4d8;
          font-size: 13px;
          padding: 6px 12px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.15s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sp-cell-select-custom:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        .sp-cell-select-custom::after {
          content: '▾';
          margin-left: 6px;
          color: #52525b;
          font-size: 10px;
        }

        .sp-cell-input-clean {
          background: transparent;
          border: none;
          color: #e4e4e7;
          width: 100%;
          outline: none;
          font-family: inherit;
          font-size: 13px;
          padding: 6px 0;
          text-align: inherit;
          border-bottom: 1px solid transparent;
          transition: border-bottom 0.15s;
        }

        .sp-cell-input-clean:focus {
          border-bottom-color: rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        .sp-cell-input-clean-textarea {
          background: transparent;
          border: none;
          color: #e4e4e7;
          width: 100%;
          outline: none;
          font-family: inherit;
          font-size: 13px;
          line-height: 1.5;
          min-height: 38px;
          box-sizing: border-box;
          word-break: break-word;
          white-space: pre-wrap;
          border-bottom: 1px solid transparent;
          transition: border-bottom 0.15s;
        }

        .sp-cell-input-clean-textarea:focus {
          border-bottom-color: rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        .sp-row-actions-box {
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: center;
          height: 100%;
        }

        .sp-action-btn-mini {
          background: transparent;
          border: none;
          color: #71717a;
          cursor: pointer;
          opacity: 0.4;
          transition: all 0.15s;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .sp-action-btn-mini:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.05);
        }

        .sp-action-btn-mini.add {
          color: var(--sp-accent);
        }

        .sp-action-btn-mini.delete {
          color: #f87171;
        }

        .sp-sidebar-overlay-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 40;
        }

        /* Hover scene overlay controls styling */
        .sp-scene-hover-bar {
          animation: sp-fade-in 0.1s ease-out;
        }

        @keyframes sp-fade-in {
          from { opacity: 0; transform: translate(-50%, 4px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        `
      }} />

      {/* 1. Desktop Navbar (Adapted from Script Editor) */}
      {!readOnly && (
        <header className="sp-desktop-only sp-no-print sp-shotlist-navbar">
          <div className="sp-shotlist-nav-left">
            <span className="sp-brand-logo">WriterDute</span>
            <button className="sp-shotlist-back-btn" onClick={back} title="Back to projects">
              <ChevronLeft size={16} />
            </button>
            <div className="sp-shotlist-title-box">
              <input
                type="text"
                className="sp-shotlist-title-input"
                value={title}
                onChange={handleTitleChange}
                disabled={readOnly}
                placeholder="Untitled Shot List"
              />
              <span className="sp-shotlist-subtitle">{project.title} &bull; Shot List</span>
            </div>
          </div>

          <div className="sp-shotlist-navbar-right">
            {/* Live Indicator / Saving indicator */}
            <div className="sp-save-status">
              {saveStatus === "saving" ? (
                <>
                  <span className="sp-save-dot" style={{ backgroundColor: "#f59e0b" }} />
                  <span style={{ color: "#71717a" }}>Saving...</span>
                </>
              ) : (
                <>
                  <span className="sp-save-dot" style={{ backgroundColor: "#10b981" }} />
                  <span style={{ color: "#71717a" }}>Saved</span>
                </>
              )}
            </div>

            {/* Active User Avatars */}
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

            {/* Live count badge */}
            <div className="sp-live-badge">
              <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#10b981" }} />
              {Math.max(1, onlineUsers.length)} live
            </div>

            {/* Export buttons */}
            <button className="sp-shotlist-tool-btn" onClick={handleExportCSV}>
              Export CSV
            </button>
            <button className="sp-shotlist-tool-btn" onClick={handleExportPDF} style={{ color: "var(--sp-accent)", borderColor: "rgba(232, 184, 75, 0.2)" }}>
              Export PDF
            </button>
          </div>
        </header>
      )}

      {/* 2. ReadOnly Header (Show "Only View") */}
      {readOnly && (
        <header className="sp-desktop-only sp-no-print sp-shotlist-navbar">
          <div className="sp-shotlist-nav-left">
            <span className="sp-brand-logo">WriterDute</span>
            <button className="sp-shotlist-back-btn" onClick={back} title="Back to projects">
              <ChevronLeft size={16} />
            </button>
            <div className="sp-shotlist-title-box">
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{title}</span>
              <span className="sp-shotlist-subtitle">{project.title} &bull; Shot List</span>
            </div>
          </div>
          <div className="sp-shotlist-navbar-right">
            <div className="sp-view-only-badge">🔒 Only View</div>
          </div>
        </header>
      )}

      {/* 3. Mobile Header */}
      <header className="sp-mobile-only sp-header sp-no-print" style={{ height: 56, background: "var(--sp-toolbar)", borderBottom: "1px solid var(--sp-border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={back} className="sp-shotlist-back-btn" style={{ width: 30, height: 30 }} title="Back">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setShowSidebar(!showSidebar)} className="sp-sidebar-toggle-btn" style={{ width: 30, height: 30 }}>
            <Menu size={14} />
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{title}</span>
            <span style={{ fontSize: 9, color: "var(--sp-muted)", fontWeight: 500 }}>{project.title} &bull; Shot List</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          {readOnly ? (
            <div className="sp-view-only-badge" style={{ padding: "2px 8px", fontSize: 10 }}>Only View</div>
          ) : (
            saveStatus === "saving" ? (
              <span style={{ fontSize: 11, color: "#f59e0b" }}>Saving...</span>
            ) : (
              <span style={{ fontSize: 11, color: "#10b981" }}>Saved</span>
            )
          )}
        </div>
      </header>

      {/* 4. WORKSPACE WRAPPER */}
      <div className="sp-shotlist-workspace">
        
        {/* Mobile Sidebar backdrop */}
        {isMobile && showSidebar && (
          <div className="sp-sidebar-overlay-backdrop" onClick={() => setShowSidebar(false)} />
        )}

        {/* 5. COLLAPSIBLE SIDEBAR (Matches Script Editor Sidebar Layout/Styling Exactly) */}
        {showSidebar && (
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
              
              {/* Mobile Sidebar Close */}
              {isMobile && (
                <div style={{ borderBottom: "1px solid var(--sp-border)", paddingBottom: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>WriterDesk</span>
                    <button 
                      onClick={() => setShowSidebar(false)}
                      style={{ width: 32, height: 32, borderRadius: 8, background: "#1e1e24", border: "1px solid var(--sp-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* FILES SECTION */}
              <div>
                <div className="sp-sidebar-header">FILES</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {project.files.map((f) => {
                    const isActive = f.id === file.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          if (isActive) return;
                          navigate(`/project/${project.id}/file/${f.id}`);
                        }}
                        className={`sp-file-item ${isActive ? "active" : ""}`}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {getFileIcon(f.type || "script")}
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>
                            {f.title}
                          </span>
                        </div>
                        <span className="sp-file-page-badge">{f.blocks ? Math.max(1, Math.ceil(f.blocks.length / 22)) : 1} pp</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SCENES SHORTCUTS LIST */}
              <div>
                <div className="sp-sidebar-header">Scenes</div>
                {sidebarScenes.length === 0 ? (
                  <p style={{ fontSize: 12, color: "#71717a", fontStyle: "italic", padding: "0 8px" }}>No scenes mapped yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {sidebarScenes.map(([num, heading]) => (
                      <div key={num} className="sp-sidebar-scene-row">
                        <button
                          onClick={() => {
                            handleSceneClick(num);
                            if (isMobile) setShowSidebar(false);
                          }}
                          className="sp-scene-item"
                          style={{ flex: 1, paddingRight: 4, border: "none", background: "transparent" }}
                        >
                          <span className="sp-sidebar-scene-num-badge">{num}</span>
                          <span className="sp-sidebar-scene-text" title={heading}>{heading}</span>
                        </button>
                        {!readOnly && creationMode !== "generated" && (
                          <button
                            className="sp-sidebar-scene-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteScene(num);
                            }}
                            title={`Delete Scene ${num} and all its shots`}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Bottom section: Collaborators active list */}
            <div style={{ borderTop: "1px solid var(--sp-border)", paddingTop: 16, marginTop: 12 }}>
              <div className="sp-sidebar-header">Collaborators</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {onlineUsers.map((m, idx) => (
                  <div key={m.email || idx} className="sp-sidebar-collab-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar src={m.avatar} name={m.name || m.email} size={24} style={{ background: "#2e2e34" }} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: "#fff" }}>{m.name || m.email.split("@")[0]}</span>
                    </div>
                    <span className="sp-sidebar-collab-dot" style={{ backgroundColor: "#10b981" }} />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* 6. MAIN CONTENT AREA */}
        <div className="sp-shotlist-editor-content">
          
          {/* Toolbar */}
          <div className="sp-shotlist-toolbar">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button 
                className="sp-shotlist-tool-btn" 
                onClick={() => setShowSidebar(!showSidebar)}
                title="Toggle sidebar outline"
              >
                <Menu size={14} />
              </button>

              <div style={{ width: 1, height: 16, backgroundColor: "#272730", margin: "0 4px" }} />

              <button 
                className="sp-shotlist-tool-btn" 
                onClick={undo} 
                disabled={historyIndex <= 0}
                title="Undo (Ctrl+Z)"
              >
                <Undo size={14} />
              </button>
              <button 
                className="sp-shotlist-tool-btn" 
                onClick={redo} 
                disabled={historyIndex >= history.length - 1}
                title="Redo (Ctrl+Y)"
              >
                <Redo size={14} />
              </button>

              {!readOnly && shots.length > 0 && (
                <>
                  <div style={{ width: 1, height: 16, backgroundColor: "#272730", margin: "0 4px" }} />
                  <button 
                    className="sp-shotlist-tool-btn" 
                    onClick={() => updateShotsWithHistory([])}
                    style={{ color: "#f87171", border: "1px solid rgba(248, 113, 113, 0.15)", background: "rgba(248, 113, 113, 0.02)" }}
                    title="Clear the entire list"
                  >
                    Clear List
                  </button>
                </>
              )}
            </div>

            {/* Metrics stats section in toolbar */}
            <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: "12px", color: "#71717a", fontWeight: 500 }}>
              <div>Shots: <strong style={{ color: "#fff" }}>{metrics.total}</strong></div>
              <div style={{ width: 1, height: 12, backgroundColor: "#1e1e24" }} />
              <div>Scenes: <strong style={{ color: "#fff" }}>{metrics.scenesCovered}</strong></div>
              <div style={{ width: 1, height: 12, backgroundColor: "#1e1e24" }} />
              <div>Completed: <strong style={{ color: "#10b981" }}>{metrics.completed}</strong></div>
              <div style={{ width: 1, height: 12, backgroundColor: "#1e1e24" }} />
              <div>Planned: <strong style={{ color: "#6366f1" }}>{metrics.planned}</strong></div>
            </div>
          </div>

          {/* Table Grid (Spreadsheet Scrollable) */}
          <div className="sp-shotlist-table-wrapper" onMouseLeave={() => setHoveredSceneNumber(null)}>
            {shots.length === 0 ? (
              <div className="sp-empty-state" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - 180px)", textAlign: "center", padding: "0 24px" }}>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#fff", marginBottom: "8px", letterSpacing: "-0.02em" }}>Shot List</div>
                <p style={{ fontSize: "14px", color: "var(--sp-muted)", maxWidth: "380px", lineHeight: "1.6", marginBottom: "28px" }}>
                  Plan camera setups, lens choices, and shoot order. Start fresh or generate from your screenplay.
                </p>
                <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
                  <button 
                    onClick={addShotAtEnd} 
                    disabled={readOnly}
                    style={{
                      background: "var(--sp-accent)",
                      border: "none",
                      borderRadius: "8px",
                      color: "#000",
                      fontWeight: 600,
                      fontSize: "13px",
                      padding: "10px 20px",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                  >
                    Start a Manual List
                  </button>
                  <button 
                    onClick={generateFromScript} 
                    disabled={readOnly}
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: "13px",
                      padding: "10px 20px",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"}
                  >
                    ⚡ Generate from Script
                  </button>
                </div>
              </div>
            ) : (
              <table className="sp-sheet-table" style={{ zoom: zoomScale }}>
                <colgroup>
                  <col style={{ width: "60px" }} />  {/* SCENE */}
                  <col style={{ width: "60px" }} />  {/* SHOT */}
                  <col style={{ width: "350px" }} /> {/* DESCRIPTION */}
                  <col style={{ width: "80px" }} />  {/* INT/EXT */}
                  <col style={{ width: "95px" }} />  {/* SHOT SIZE */}
                  <col style={{ width: "135px" }} /> {/* SHOT TYPE */}
                  <col style={{ width: "115px" }} /> {/* MOVEMENT */}
                  <col style={{ width: "115px" }} /> {/* LENS */}
                  <col style={{ width: "115px" }} /> {/* EQUIPMENT */}
                  <col style={{ width: "70px" }} />  {/* STATUS */}
                  <col style={{ width: "220px" }} /> {/* NOTE */}
                  {!readOnly && <col style={{ width: "80px" }} />}  {/* ACTIONS */}
                </colgroup>
                <thead>
                  <tr>
                    <th className="sp-sheet-th sticky-col sticky-col-1" style={{ textAlign: "center" }}>Scene</th>
                    <th className="sp-sheet-th sticky-col sticky-col-2" style={{ textAlign: "center" }}>Shot</th>
                    <th className="sp-sheet-th">Description</th>
                    <th className="sp-sheet-th" style={{ textAlign: "center" }}>Int/ext</th>
                    <th className="sp-sheet-th" style={{ textAlign: "center" }}>Shot Size</th>
                    <th className="sp-sheet-th">Shot Type</th>
                    <th className="sp-sheet-th">Movement</th>
                    <th className="sp-sheet-th">Lens</th>
                    <th className="sp-sheet-th">Equipment</th>
                    <th className="sp-sheet-th" style={{ textAlign: "center" }}>Status</th>
                    <th className="sp-sheet-th">Note</th>
                    {!readOnly && <th className="sp-sheet-th" style={{ textAlign: "center" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {shots.map((shot, index) => {
                    const isHighlighted = highlightedScene === shot.sceneNumber;
                    const sceneIndex = uniqueScenesList.indexOf(shot.sceneNumber);
                    const isOddScene = sceneIndex % 2 !== 0;
                    
                    // Check if this is the last shot of its scene to add divider border and centered hover bars
                    const isLastShotInScene = index === shots.length - 1 || shots[index + 1].sceneNumber !== shot.sceneNumber;

                    return (
                      <tr 
                        key={shot.id} 
                        id={`shot-row-${shot.id}`}
                        onMouseEnter={() => setHoveredSceneNumber(shot.sceneNumber)}
                        className={`
                          ${isOddScene ? "odd-scene" : "even-scene"}
                          ${isLastShotInScene ? "last-in-scene" : ""}
                          ${isHighlighted ? "sp-row-highlighted" : ""}
                        `}
                        style={{ position: "relative" }}
                      >
                        {/* 1. SCENE (Sticky) */}
                        <td className="sp-sheet-td sticky-col sticky-col-1">
                          <input
                            type="number"
                            className="sp-cell-input-clean"
                            style={{ textAlign: "center", fontWeight: "bold" }}
                            value={shot.sceneNumber}
                            onChange={(e) => updateShotField(shot.id, "sceneNumber", parseInt(e.target.value) || 1)}
                            disabled={readOnly || creationMode === "generated"}
                          />
                        </td>

                        {/* 2. SHOT (Sticky) */}
                        <td className="sp-sheet-td sticky-col sticky-col-2">
                          <input
                            type="text"
                            className="sp-cell-input-clean"
                            style={{ textAlign: "center", fontWeight: "bold", color: "#6366f1" }}
                            value={shot.shotLabel}
                            onChange={(e) => updateShotField(shot.id, "shotLabel", e.target.value)}
                            disabled={readOnly}
                          />
                        </td>

                        {/* 3. DESCRIPTION (Wrapped contenteditable with placeholder bypass) */}
                        <td className="sp-sheet-td">
                          <div
                            contentEditable={!readOnly}
                            suppressContentEditableWarning
                            className="sp-cell-input-clean-textarea"
                            {...{ placeholder: "Click to add description..." }}
                            onBlur={(e) => updateShotField(shot.id, "description", e.currentTarget.textContent || "")}
                            style={{
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              minHeight: "38px",
                              outline: "none",
                              padding: "6px 0",
                              color: "#e4e4e7"
                            }}
                          >
                            {shot.description}
                          </div>
                        </td>

                        {/* 4. INT/EXT (Custom Dropdown Menu) */}
                        <td className="sp-sheet-td" style={{ textAlign: "center" }}>
                          <div 
                            className="sp-cell-select-custom"
                            style={{ justifyContent: "center" }}
                            onClick={(e) => handleDropdownTrigger(shot.id, "intExt", INT_EXT_OPTIONS, e)}
                          >
                            {shot.intExt || "INT"}
                          </div>
                        </td>

                        {/* 5. SHOT SIZE (Custom Dropdown Menu) */}
                        <td className="sp-sheet-td" style={{ textAlign: "center" }}>
                          <div 
                            className="sp-cell-select-custom"
                            style={{ justifyContent: "center" }}
                            onClick={(e) => handleDropdownTrigger(shot.id, "shotType", SHOT_SIZES, e)}
                          >
                            {shot.shotType || "WS"}
                          </div>
                        </td>

                        {/* 6. SHOT TYPE (Custom Dropdown Menu) */}
                        <td className="sp-sheet-td">
                          <div 
                            className="sp-cell-select-custom"
                            onClick={(e) => handleDropdownTrigger(shot.id, "angle", SHOT_TYPES, e)}
                          >
                            {shot.angle || "Deep Focus"}
                          </div>
                        </td>

                        {/* 7. MOVEMENT (Custom Dropdown Menu) */}
                        <td className="sp-sheet-td">
                          <div 
                            className="sp-cell-select-custom"
                            onClick={(e) => handleDropdownTrigger(shot.id, "movement", MOVEMENTS, e)}
                          >
                            {shot.movement || "Static"}
                          </div>
                        </td>

                        {/* 8. LENS (Custom Dropdown Menu) */}
                        <td className="sp-sheet-td">
                          <div 
                            className="sp-cell-select-custom"
                            onClick={(e) => handleDropdownTrigger(shot.id, "lens", LENSES, e)}
                          >
                            {shot.lens || "Wide Angle"}
                          </div>
                        </td>

                        {/* 9. EQUIPMENT (Custom Dropdown Menu - defaults to Tripod) */}
                        <td className="sp-sheet-td">
                          <div 
                            className="sp-cell-select-custom"
                            onClick={(e) => handleDropdownTrigger(shot.id, "equipment", EQUIPMENTS, e)}
                          >
                            {shot.equipment || "Tripod"}
                          </div>
                        </td>

                        {/* 10. STATUS (Checkbox violet style if Shot) */}
                        <td className="sp-sheet-td" style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", justifyContent: "center" }}>
                            <button
                              className={`sp-status-btn status-${shot.status}`}
                              onClick={() => toggleStatus(shot.id, shot.status)}
                              disabled={readOnly}
                              title={`Click to toggle completion: ${shot.status}`}
                            >
                              <Check size={14} style={{ display: "block" }} />
                            </button>
                          </div>
                        </td>

                        {/* 11. NOTE */}
                        <td className="sp-sheet-td">
                          <input
                            type="text"
                            className="sp-cell-input-clean"
                            value={shot.note || ""}
                            onChange={(e) => updateShotField(shot.id, "note", e.target.value)}
                            disabled={readOnly}
                            placeholder="Add notes..."
                          />
                        </td>

                        {/* 12. ROW ACTIONS (+ and Delete bin) */}
                        {!readOnly && (
                          <td className="sp-sheet-td">
                            <div className="sp-row-actions-box">
                              <button
                                className="sp-action-btn-mini add"
                                onClick={() => addShotAfter(index)}
                                title="Add shot below"
                              >
                                <Plus size={14} />
                              </button>
                              <button
                                className="sp-action-btn-mini delete"
                                onClick={() => deleteShot(shot.id)}
                                title="Delete shot"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}

                        {/* Centered Scene Hover controls overlay at the bottom center of each scene group */}
                        {hoveredSceneNumber === shot.sceneNumber && isLastShotInScene && !readOnly && (
                          <div 
                            className="sp-scene-hover-bar sp-no-print"
                            style={{
                              position: "absolute",
                              bottom: "-14px",
                              left: "50%",
                              transform: "translateX(-50%)",
                              zIndex: 100,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              backgroundColor: "#18181c",
                              border: "1px solid #2e2e3a",
                              borderRadius: "20px",
                              padding: "4px 14px",
                              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
                            }}
                          >
                            <button 
                              onClick={() => addSceneAfter(shot.sceneNumber)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--sp-accent)",
                                fontSize: "11px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4
                              }}
                            >
                              <Plus size={12} /> Add Scene
                            </button>
                            <div style={{ width: 1, height: 12, backgroundColor: "#2e2e3a" }} />
                            <button 
                              onClick={() => deleteScene(shot.sceneNumber)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#f87171",
                                fontSize: "11px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4
                              }}
                            >
                              <Trash2 size={12} /> Remove Scene
                            </button>
                          </div>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* 7. Viewport Fixed Dropdown Overlay */}
      {openDropdown && (
        <div 
          className="sp-custom-dropdown-overlay" 
          onClick={() => setOpenDropdown(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            background: "transparent"
          }}
        >
          <div 
            className="sp-custom-dropdown-menu"
            style={{
              position: "fixed",
              top: openDropdown.openAbove 
                ? (openDropdown.rect.top - openDropdown.menuHeight - 4) 
                : (openDropdown.rect.bottom + 4),
              left: openDropdown.rect.left,
              minWidth: Math.max(120, openDropdown.rect.width),
              zIndex: 1001,
              backgroundColor: "#18181c",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
              maxHeight: `${openDropdown.menuHeight}px`,
              overflowY: "auto",
              padding: "4px 0",
              animation: "sp-fade-in 0.12s ease-out"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {openDropdown.options.map((opt) => (
              <div 
                key={opt} 
                className="sp-custom-dropdown-item"
                style={{
                  padding: "8px 14px",
                  color: "#e4e4e7",
                  cursor: "pointer",
                  fontSize: "12.5px",
                  transition: "all 0.15s",
                  backgroundColor: (shots.find(s => s.id === openDropdown.shotId)?.[openDropdown.field as keyof Shot] === opt) ? "rgba(255, 255, 255, 0.06)" : "transparent"
                }}
                onClick={() => {
                  updateShotField(openDropdown.shotId, openDropdown.field as any, opt);
                  setOpenDropdown(null);
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)"}
                onMouseLeave={(e) => {
                  const isSelected = shots.find(s => s.id === openDropdown.shotId)?.[openDropdown.field as keyof Shot] === opt;
                  e.currentTarget.style.backgroundColor = isSelected ? "rgba(255, 255, 255, 0.06)" : "transparent";
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
      )}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000, display: "flex", flexDirection: "column", gap: 8, background: "rgba(18, 18, 21, 0.9)", border: "1px solid var(--sp-border)", borderRadius: "20px", padding: "4px", backdropFilter: "blur(10px)", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)" }}>
          <button 
            onClick={() => setZoomScale(z => Math.min(2.0, z + 0.1))} 
            style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "transparent", color: "#fff", fontSize: 20, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            +
          </button>
          <div style={{ height: 1, background: "var(--sp-border)", margin: "0 4px" }} />
          <button 
            onClick={() => setZoomScale(z => Math.max(0.5, z - 0.1))} 
            style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "transparent", color: "#fff", fontSize: 20, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            −
          </button>
        </div>
      )}
    </div>
  );
}
