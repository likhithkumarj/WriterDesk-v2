import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, Plus, Trash2, ChevronDown, ChevronRight, ArrowUp, ArrowDown,
  Save, Check, Layers, Film, Zap, FileText, LayoutList, FolderKanban, PlusCircle 
} from "lucide-react";
import { Project, FileDoc, OutlineNode } from "../../types/screenplay";

interface OutlineEditorProps {
  project: Project;
  file: FileDoc;
  user: { name: string; email: string; avatar: string };
  back: () => void;
  persistFile: (f: FileDoc) => void;
}

// Default template structure if empty
const defaultOutline: OutlineNode[] = [
  {
    id: "act_1",
    title: "Act I: Setup",
    type: "act",
    content: "Establish the protagonist's ordinary world, status quo, the inciting incident, and the crossing of the first threshold.",
    collapsed: false,
    children: [
      {
        id: "seq_1_1",
        title: "Ordinary World & Inciting Incident",
        type: "sequence",
        content: "Show the protagonist in their typical environment. Introduce a catalyst event that disrupts this status quo.",
        collapsed: false,
        children: [
          {
            id: "beat_1_1_1",
            title: "Introduce Hero & World",
            type: "beat",
            content: "Establish the protagonist's life, desires, flaws, and the world they inhabit.",
          },
          {
            id: "beat_1_1_2",
            title: "The Catalyst",
            type: "beat",
            content: "An event disrupts the protagonist's life, presenting a clear goal or challenge.",
          }
        ]
      }
    ]
  },
  {
    id: "act_2",
    title: "Act II: Confrontation",
    type: "act",
    content: "The protagonist encounters rising obstacles, allies, and enemies as they pursue their goal, leading to the lowest point.",
    collapsed: false,
    children: [
      {
        id: "seq_2_1",
        title: "Rising Action & Obstacles",
        type: "sequence",
        content: "The protagonist tries to achieve their goal but runs into escalating complications.",
        collapsed: false,
        children: [
          {
            id: "beat_2_1_1",
            title: "First Complications",
            type: "beat",
            content: "Obstacles grow harder; the stakes are raised.",
          }
        ]
      }
    ]
  },
  {
    id: "act_3",
    title: "Act III: Resolution",
    type: "act",
    content: "The climax of the story and its aftermath, where the conflict is resolved and a new status quo is established.",
    collapsed: false,
    children: []
  }
];

export function OutlineEditor({
  project,
  file,
  user,
  back,
  persistFile,
}: OutlineEditorProps) {
  const [tree, setTree] = useState<OutlineNode[]>(file.outlineTree || defaultOutline);
  const [selectedId, setSelectedId] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceTimer = useRef<any>(null);

  // Initialize and select first act by default
  useEffect(() => {
    const fileTree = file.outlineTree && file.outlineTree.length > 0 ? file.outlineTree : defaultOutline;
    setTree(fileTree);
    if (fileTree.length > 0 && !selectedId) {
      setSelectedId(fileTree[0].id);
    }
  }, [file.id]);

  // Debounced auto-save handler
  const triggerSave = (updatedTree: OutlineNode[]) => {
    setSaveStatus("saving");
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      // Calculate word count
      const calculateWordCount = (nodes: OutlineNode[]): number => {
        let count = 0;
        nodes.forEach((n) => {
          const text = (n.title || "") + " " + (n.content || "");
          count += text.split(/\s+/).filter(Boolean).length;
          if (n.children) count += calculateWordCount(n.children);
        });
        return count;
      };

      const updatedFile: FileDoc = {
        ...file,
        outlineTree: updatedTree,
        dateModified: Date.now(),
        wordCount: calculateWordCount(updatedTree),
      };

      persistFile(updatedFile);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 1000);
  };

  // Node Helpers
  const addNodeToTree = (list: OutlineNode[], parentId: string | null, newNode: OutlineNode): OutlineNode[] => {
    if (parentId === null) {
      return [...list, newNode];
    }
    return list.map((node) => {
      if (node.id === parentId) {
        return {
          ...node,
          collapsed: false,
          children: [...(node.children || []), newNode],
        };
      }
      if (node.children) {
        return {
          ...node,
          children: addNodeToTree(node.children, parentId, newNode),
        };
      }
      return node;
    });
  };

  const handleAddRootAct = () => {
    const newAct: OutlineNode = {
      id: "node_" + Date.now() + Math.random().toString(36).substring(2, 5),
      title: "New Act",
      type: "act",
      content: "",
      collapsed: false,
      children: [],
    };
    const updated = [...tree, newAct];
    setTree(updated);
    setSelectedId(newAct.id);
    triggerSave(updated);
  };

  const handleAddChildNode = (parentId: string, type: "act" | "sequence" | "beat" | "note") => {
    const newNode: OutlineNode = {
      id: "node_" + Date.now() + Math.random().toString(36).substring(2, 5),
      title: `New ${type.toUpperCase()}`,
      type: type,
      content: "",
      children: [],
    };
    const updated = addNodeToTree(tree, parentId, newNode);
    setTree(updated);
    setSelectedId(newNode.id);
    triggerSave(updated);
  };

  const deleteNodeFromTree = (list: OutlineNode[], id: string): OutlineNode[] => {
    return list
      .filter((node) => node.id !== id)
      .map((node) => {
        if (node.children) {
          return {
            ...node,
            children: deleteNodeFromTree(node.children, id),
          };
        }
        return node;
      });
  };

  const handleDeleteNode = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this element and all its nested sub-elements?")) return;

    const updated = deleteNodeFromTree(tree, id);
    setTree(updated);
    if (selectedId === id) {
      setSelectedId(updated.length > 0 ? updated[0].id : "");
    }
    triggerSave(updated);
  };

  const updateNodeInTree = (list: OutlineNode[], id: string, updates: Partial<OutlineNode>): OutlineNode[] => {
    return list.map((node) => {
      if (node.id === id) {
        return { ...node, ...updates };
      }
      if (node.children) {
        return {
          ...node,
          children: updateNodeInTree(node.children, id, updates),
        };
      }
      return node;
    });
  };

  const handleUpdateNode = (id: string, updates: Partial<OutlineNode>) => {
    const updated = updateNodeInTree(tree, id, updates);
    setTree(updated);
    triggerSave(updated);
  };

  const moveNodeInTree = (list: OutlineNode[], id: string, direction: "up" | "down"): { updatedList: OutlineNode[]; moved: boolean } => {
    const idx = list.findIndex((n) => n.id === id);
    if (idx !== -1) {
      const newList = [...list];
      if (direction === "up" && idx > 0) {
        const temp = newList[idx];
        newList[idx] = newList[idx - 1];
        newList[idx - 1] = temp;
        return { updatedList: newList, moved: true };
      } else if (direction === "down" && idx < list.length - 1) {
        const temp = newList[idx];
        newList[idx] = newList[idx + 1];
        newList[idx + 1] = temp;
        return { updatedList: newList, moved: true };
      }
      return { updatedList: list, moved: false };
    }

    let movedAny = false;
    const updatedList = list.map((node) => {
      if (node.children && node.children.length > 0) {
        const res = moveNodeInTree(node.children, id, direction);
        if (res.moved) {
          movedAny = true;
          return { ...node, children: res.updatedList };
        }
      }
      return node;
    });

    return { updatedList, moved: movedAny };
  };

  const handleMoveNode = (id: string, direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    const res = moveNodeInTree(tree, id, direction);
    if (res.moved) {
      setTree(res.updatedList);
      triggerSave(res.updatedList);
    }
  };

  // Collapse/Expand helpers
  const setCollapseAll = (list: OutlineNode[], collapsed: boolean): OutlineNode[] => {
    return list.map((node) => {
      const updated: OutlineNode = { ...node, collapsed };
      if (node.children) {
        updated.children = setCollapseAll(node.children, collapsed);
      }
      return updated;
    });
  };

  const handleCollapseAll = () => {
    const updated = setCollapseAll(tree, true);
    setTree(updated);
    triggerSave(updated);
  };

  const handleExpandAll = () => {
    const updated = setCollapseAll(tree, false);
    setTree(updated);
    triggerSave(updated);
  };

  // Recursively search for selected node
  const findNode = (list: OutlineNode[], id: string): OutlineNode | null => {
    for (const node of list) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedNode = findNode(tree, selectedId);

  // Statistics counters
  const getStats = () => {
    const counts = { acts: 0, sequences: 0, beats: 0, notes: 0 };
    const recurse = (nodes: OutlineNode[]) => {
      nodes.forEach((n) => {
        if (n.type === "act") counts.acts++;
        else if (n.type === "sequence") counts.sequences++;
        else if (n.type === "beat") counts.beats++;
        else if (n.type === "note") counts.notes++;
        if (n.children) recurse(n.children);
      });
    };
    recurse(tree);
    return counts;
  };

  const stats = getStats();

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "act": return <Layers size={14} style={{ color: "#E8B84B" }} />;
      case "sequence": return <Film size={14} style={{ color: "#38bdf8" }} />;
      case "beat": return <Zap size={14} style={{ color: "#a855f7" }} />;
      default: return <FileText size={14} style={{ color: "#9ca3af" }} />;
    }
  };

  // Tree Render Block (Recursive Component)
  const renderTreeNode = (node: OutlineNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = !!node.collapsed;
    const isSelected = selectedId === node.id;

    return (
      <div key={node.id} className="sp-outline-node-wrapper" style={{ marginLeft: depth > 0 ? "24px" : "0px" }}>
        <div 
          className={`sp-outline-node-row ${isSelected ? "selected" : ""} sp-depth-${depth}`}
          onClick={() => setSelectedId(node.id)}
        >
          {/* Chevron expand/collapse toggle */}
          <div className="sp-outline-chevron-container">
            {hasChildren ? (
              <button 
                className="sp-outline-chevron-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateNode(node.id, { collapsed: !isCollapsed });
                }}
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </button>
            ) : (
              <div style={{ width: 16 }} />
            )}
          </div>

          {/* Node Icon */}
          <div className="sp-outline-icon-container">
            {getNodeIcon(node.type)}
          </div>

          {/* Node Title display */}
          <span className={`sp-outline-title ${node.type}`}>
            {node.title || `Unnamed ${node.type.toUpperCase()}`}
          </span>

          {/* Quick Actions overlay on hover */}
          <div className="sp-outline-actions-overlay">
            {/* Move Up/Down */}
            <button className="sp-outline-mini-btn" onClick={(e) => handleMoveNode(node.id, "up", e)} title="Move Up">
              <ArrowUp size={11} />
            </button>
            <button className="sp-outline-mini-btn" onClick={(e) => handleMoveNode(node.id, "down", e)} title="Move Down">
              <ArrowDown size={11} />
            </button>
            <div style={{ width: 1, height: 12, background: "#282830" }} />
            
            {/* Add Child Node triggers */}
            {node.type === "act" && (
              <button className="sp-outline-mini-btn add" onClick={(e) => { e.stopPropagation(); handleAddChildNode(node.id, "sequence"); }} title="Add Sequence">
                <Film size={11} />+
              </button>
            )}
            {node.type === "sequence" && (
              <button className="sp-outline-mini-btn add" onClick={(e) => { e.stopPropagation(); handleAddChildNode(node.id, "beat"); }} title="Add Beat">
                <Zap size={11} />+
              </button>
            )}
            {node.type === "beat" && (
              <button className="sp-outline-mini-btn add" onClick={(e) => { e.stopPropagation(); handleAddChildNode(node.id, "note"); }} title="Add Note">
                <FileText size={11} />+
              </button>
            )}
            <div style={{ width: 1, height: 12, background: "#282830" }} />
            
            {/* Delete */}
            <button className="sp-outline-mini-btn delete" onClick={(e) => handleDeleteNode(node.id, e)} title="Delete Node">
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {/* Children render */}
        {hasChildren && !isCollapsed && (
          <div className="sp-outline-node-children-container">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="sp-outline-container">
      <style dangerouslySetInnerHTML={{
        __html: `
        .sp-outline-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background-color: #08080a;
          color: #efeff1;
          font-family: 'Outfit', sans-serif;
        }

        .sp-outline-navbar {
          height: 56px;
          background-color: #0f0f11;
          border-bottom: 1px solid #18181c;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          flex-shrink: 0;
        }

        .sp-outline-navbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .sp-outline-navbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Metrics bar */
        .sp-outline-metrics-row {
          background-color: #121214;
          border-bottom: 1px solid #1c1c20;
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 10px 20px;
          flex-shrink: 0;
          overflow-x: auto;
        }

        .sp-outline-metric-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }

        .sp-outline-metric-label {
          color: #8e8e93;
        }

        .sp-outline-metric-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 4px;
        }

        .sp-outline-metric-badge.act { background: rgba(232, 184, 75, 0.08); border: 1px solid rgba(232, 184, 75, 0.15); color: #E8B84B; }
        .sp-outline-metric-badge.sequence { background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.15); color: #38bdf8; }
        .sp-outline-metric-badge.beat { background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.15); color: #a855f7; }
        .sp-outline-metric-badge.note { background: rgba(156, 163, 175, 0.08); border: 1px solid rgba(156, 163, 175, 0.15); color: #9ca3af; }

        /* Workspace Grid */
        .sp-outline-workspace {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        /* Tree Panel on Left */
        .sp-outline-tree-panel {
          flex: 1.2;
          border-right: 1px solid #18181c;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #09090b;
        }

        .sp-outline-tree-toolbar {
          padding: 16px 20px;
          border-bottom: 1px solid #18181c;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .sp-outline-tree-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        /* Outline Tree Structure */
        .sp-outline-node-wrapper {
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* vertical indicator line for nesting */
        .sp-outline-node-children-container {
          position: relative;
        }

        .sp-outline-node-children-container::before {
          content: '';
          position: absolute;
          left: 12px;
          top: 0;
          bottom: 24px;
          width: 1px;
          background: #1c1c20;
        }

        .sp-outline-node-row {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
          background: transparent;
          border: 1px solid transparent;
          position: relative;
        }

        .sp-outline-node-row:hover {
          background: rgba(255, 255, 255, 0.02);
          border-color: #18181c;
        }

        .sp-outline-node-row.selected {
          background: rgba(232, 184, 75, 0.04);
          border-color: rgba(232, 184, 75, 0.2);
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
        }

        /* Different styling for depth items */
        .sp-outline-node-row.sp-depth-0 {
          background: #0f0f12;
          border: 1px solid #18181c;
          margin-top: 8px;
          padding: 10px 14px;
        }
        .sp-outline-node-row.sp-depth-0.selected {
          border-color: rgba(232, 184, 75, 0.25);
          background: rgba(232, 184, 75, 0.05);
        }

        .sp-outline-chevron-container {
          width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sp-outline-chevron-btn {
          background: transparent;
          border: none;
          color: #8e8e93;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          border-radius: 4px;
        }

        .sp-outline-chevron-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
        }

        .sp-outline-icon-container {
          margin: 0 8px;
          display: flex;
          align-items: center;
        }

        .sp-outline-title {
          font-size: 13px;
          color: #efeff1;
          font-weight: 500;
        }

        .sp-outline-title.act {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
        }

        .sp-outline-title.sequence {
          font-size: 13.5px;
          font-weight: 600;
        }

        .sp-outline-title.beat {
          font-weight: 500;
          color: #e5e5e7;
        }

        .sp-outline-title.note {
          color: #8e8e93;
          font-style: italic;
        }

        /* Actions overlay on hover */
        .sp-outline-actions-overlay {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: auto;
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .sp-outline-node-row:hover .sp-outline-actions-overlay {
          opacity: 1;
        }

        .sp-outline-mini-btn {
          background: transparent;
          border: none;
          color: #5e5e65;
          cursor: pointer;
          width: 20px;
          height: 20px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          transition: all 0.15s ease;
        }

        .sp-outline-mini-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .sp-outline-mini-btn.add:hover {
          color: #E8B84B;
          background: rgba(232, 184, 75, 0.08);
        }

        .sp-outline-mini-btn.delete:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
        }

        /* Details Sidebar on Right */
        .sp-outline-details-sidebar {
          flex: 0.8;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #0c0c0e;
        }

        .sp-outline-details-header {
          padding: 16px 20px;
          border-bottom: 1px solid #18181c;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          color: #E8B84B;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }

        .sp-outline-details-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sp-outline-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sp-outline-group label {
          font-size: 11px;
          font-weight: 700;
          color: #8e8e93;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .sp-outline-group input, 
        .sp-outline-group select {
          background: #141418;
          border: 1px solid #232329;
          border-radius: 8px;
          color: #fff;
          padding: 10px 12px;
          font-size: 13px;
          outline: none;
          box-sizing: border-box;
          width: 100%;
          font-family: inherit;
        }

        .sp-outline-group select {
          cursor: pointer;
        }

        .sp-outline-group select option {
          background: #18181c;
          color: #fff;
        }

        .sp-outline-group input:focus, 
        .sp-outline-group select:focus {
          border-color: #E8B84B;
        }

        .sp-outline-group textarea {
          background: #141418;
          border: 1px solid #232329;
          border-radius: 8px;
          color: #efeff1;
          padding: 12px;
          font-size: 13px;
          line-height: 1.5;
          min-height: 260px;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
          width: 100%;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .sp-outline-group textarea:focus {
          border-color: #E8B84B;
        }

        /* Empty state details */
        .sp-outline-details-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #5e5e65;
          gap: 12px;
          padding: 24px;
          text-align: center;
        }

        /* Responsive Mobile Styles overrides */
        @media (max-width: 768px) {
          .sp-outline-workspace {
            flex-direction: column;
            overflow-y: auto;
          }
          .sp-outline-tree-panel {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid #18181c;
          }
          .sp-outline-details-sidebar {
            width: 100%;
            border-left: none;
            max-height: 420px;
          }
          .sp-outline-tree-toolbar {
            padding: 12px;
          }
        }
        ` }} />

      {/* Main Navbar */}
      <nav className="sp-outline-navbar">
        <div className="sp-outline-navbar-left">
          <button className="sp-btn sp-btn-ghost" onClick={back} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ChevronLeft size={16} /> Back to Files
          </button>
          <div style={{ width: 1, height: 16, background: "#282830" }} />
          <span style={{ fontSize: 13, color: "#8e8e93", fontWeight: 600 }}>{project.title} / {file.title}</span>
        </div>

        <div className="sp-outline-navbar-right">
          {saveStatus === "saving" && (
            <span style={{ fontSize: 12, color: "#8e8e93", display: "flex", alignItems: "center", gap: 4 }}>
              <span className="animate-pulse" style={{ width: 6, height: 6, background: "#E8B84B", borderRadius: "50%" }} /> Saving changes...
            </span>
          )}
          {saveStatus === "saved" && (
            <span style={{ fontSize: 12, color: "#E8B84B", display: "flex", alignItems: "center", gap: 4 }}>
              <Check size={12} /> Changes Saved
            </span>
          )}
          <button className="sp-ws-btn-share" onClick={() => triggerSave(tree)} style={{ height: 32, display: "flex", alignItems: "center", padding: "0 12px" }}>
            <Save size={13} /> Save Now
          </button>
        </div>
      </nav>

      {/* Metrics Bar */}
      <div className="sp-outline-metrics-row">
        <div className="sp-outline-metric-item">
          <span className="sp-outline-metric-label">Structure Tallies:</span>
        </div>
        <div className="sp-outline-metric-item">
          <span className="sp-outline-metric-badge act">Acts: {stats.acts}</span>
        </div>
        <div className="sp-outline-metric-item">
          <span className="sp-outline-metric-badge sequence">Sequences: {stats.sequences}</span>
        </div>
        <div className="sp-outline-metric-item">
          <span className="sp-outline-metric-badge beat">Beats: {stats.beats}</span>
        </div>
        <div className="sp-outline-metric-item">
          <span className="sp-outline-metric-badge note">Notes: {stats.notes}</span>
        </div>
      </div>

      {/* Workspace */}
      <div className="sp-outline-workspace">
        {/* Left Tree Panel */}
        <section className="sp-outline-tree-panel">
          <div className="sp-outline-tree-toolbar">
            <button className="sp-btn sp-btn-primary" onClick={handleAddRootAct} style={{ height: 32, padding: "0 12px" }}>
              <Plus size={13} /> Add Act
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="sp-btn sp-btn-ghost" onClick={handleCollapseAll} style={{ fontSize: 11, height: 28, padding: "0 8px" }}>
                Collapse All
              </button>
              <button className="sp-btn sp-btn-ghost" onClick={handleExpandAll} style={{ fontSize: 11, height: 28, padding: "0 8px" }}>
                Expand All
              </button>
            </div>
          </div>

          <div className="sp-outline-tree-scroll">
            {tree.map((node) => renderTreeNode(node, 0))}
            {tree.length === 0 && (
              <div style={{ textAlign: "center", color: "#8e8e93", padding: "40px 0" }}>
                No Acts added yet. Click 'Add Act' to start framing your outline structure.
              </div>
            )}
          </div>
        </section>

        {/* Right Details Panel */}
        <aside className="sp-outline-details-sidebar">
          <div className="sp-outline-details-header">
            <FolderKanban size={15} style={{ color: "#E8B84B" }} /> Element Details
          </div>

          {selectedNode ? (
            <div className="sp-outline-details-scroll">
              {/* Type selector */}
              <div className="sp-outline-group">
                <label>Element Type</label>
                <select 
                  value={selectedNode.type}
                  onChange={(e) => handleUpdateNode(selectedNode.id, { type: e.target.value as any })}
                >
                  <option value="act">Act (Highest Hierarchy)</option>
                  <option value="sequence">Sequence (Mid Hierarchy)</option>
                  <option value="beat">Beat (Story Climax/Scene Action)</option>
                  <option value="note">Note (Basic text annotation)</option>
                </select>
              </div>

              {/* Title Input */}
              <div className="sp-outline-group">
                <label>Title</label>
                <input 
                  type="text" 
                  value={selectedNode.title}
                  placeholder={`Unnamed ${selectedNode.type}`}
                  onChange={(e) => handleUpdateNode(selectedNode.id, { title: e.target.value })}
                />
              </div>

              {/* Content Textarea */}
              <div className="sp-outline-group">
                <label>Summary / Beat Story Details</label>
                <textarea 
                  value={selectedNode.content || ""}
                  placeholder="Outline the story points, action sequence, characters present, dialogue hooks, or scene beats here..."
                  onChange={(e) => handleUpdateNode(selectedNode.id, { content: e.target.value })}
                />
              </div>

              {/* Help tip block */}
              <div style={{ background: "rgba(232, 184, 75, 0.03)", border: "1px dashed rgba(232, 184, 75, 0.1)", borderRadius: 8, padding: 12, fontSize: 11, color: "#8e8e93", lineHeight: 1.4 }}>
                💡 <strong>Outline Tips:</strong> Use Acts for main structural pillars, Sequences for narrative segments (e.g. Inciting Incident, Rising Action), Beats for individual plot points/actions, and Notes for drafting reference pointers. Sibling elements can be reordered using the arrow markers.
              </div>
            </div>
          ) : (
            <div className="sp-outline-details-empty">
              <LayoutList size={32} style={{ color: "#232329" }} />
              <div>No Element Selected</div>
              <p style={{ fontSize: 11, color: "#5e5e65", margin: 0 }}>Select an act, sequence, or beat from the tree structure on the left to edit its summary descriptions here.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default OutlineEditor;
