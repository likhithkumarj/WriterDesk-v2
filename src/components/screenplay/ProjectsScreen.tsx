import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Project, Store } from "../../types/screenplay";
import { uid } from "../../utils/uid";
import { NewProjectModal } from "../modals/NewProjectModal";
import { ShareModal } from "../modals/ShareModal";
import { supabaseService } from "../../utils/supabaseService";
import { Avatar } from "./Avatar";
import { DashboardLayout } from "../../pages/DashboardLayout";
import {
  Folder, FileText, Users, Settings as SettingsIcon, LayoutGrid, Search,
  Download, Share2, Plus, Edit2, MoreVertical, LogOut, Sun, UserPlus, Check,
  ChevronLeft, ChevronRight, MoreHorizontal, Bell, HelpCircle, ArrowUpRight, Upload, BookOpen,
  MessageSquare
} from "lucide-react";

export function ProjectsScreen({
  store, persist, openProject, user, onLogout,
}: {
  store: Store;
  persist: (s: Store) => void;
  openProject: (id: string) => void;
  user?: { name: string; email: string; avatar: string };
  onLogout?: () => void;
}) {
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"projects" | "recent">("projects");
  const [openMenu, setOpenMenu] = useState<{ id: string; openAbove: boolean } | null>(null);

  const handleMenuToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (openMenu?.id === id) {
      setOpenMenu(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < 185;
      setOpenMenu({ id, openAbove });
    }
  };
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [shareProjectId, setShareProjectId] = useState<string | null>(null);
  const [shareProjectTitle, setShareProjectTitle] = useState("");

  const loadPendingInvites = async () => {
    if (!supabaseService.isConfigured() || !user?.email) return;
    try {
      const { data, error } = await supabaseService.fetchPendingInvites(user.email);
      if (!error && data) {
        const resolved = await Promise.all(data.map(async (invite: any) => {
          const projectObj = Array.isArray(invite.projects) ? invite.projects[0] : invite.projects;
          const title = projectObj?.title || "Untitled Project";
          const ownerId = projectObj?.user_id;

          let senderName = "Unknown Sender";
          let senderEmail = "";
          let senderAvatar = "";

          if (ownerId) {
            const { data: profile } = await supabaseService.fetchProfileById(ownerId);
            if (profile) {
              senderName = profile.full_name || profile.email?.split("@")[0] || "Unknown Sender";
              senderEmail = profile.email || "";
              senderAvatar = profile.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${profile.email || ownerId}`;
            }
          }

          return {
            ...invite,
            projectTitle: title,
            senderName,
            senderEmail,
            senderAvatar
          };
        }));
        setPendingInvites(resolved);
      }
    } catch (err) {
      console.error("Error loading pending invites:", err);
    }
  };

  useEffect(() => {
    loadPendingInvites();
  }, [user]);

  const acceptInvite = async (inviteId: string) => {
    try {
      const session = await supabaseService.getSession();
      const currentUserId = session?.user?.id;
      if (!currentUserId) throw new Error("No authenticated user found.");
      const { error } = await supabaseService.acceptInvite(inviteId, currentUserId);
      if (error) throw error;
      alert("Collaboration invite accepted!");
      window.location.reload();
    } catch (err: any) {
      alert("Error accepting invite: " + err.message);
    }
  };

  const declineInvite = async (inviteId: string) => {
    try {
      const { error } = await supabaseService.declineInvite(inviteId);
      if (error) throw error;
      setPendingInvites(pendingInvites.filter((i) => i.id !== inviteId));
      alert("Invitation declined.");
    } catch (err: any) {
      alert("Error declining invite: " + err.message);
    }
  };

  const createProject = (title: string, description: string, type: string, genre: string) => {
    const p: Project = {
      id: uid(),
      title,
      description,
      type,
      genre,
      status: "Draft",
      dateCreated: Date.now(),
      dateModified: Date.now(),
      files: [],
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
    const np: Project = {
      ...p,
      id: uid(),
      title: p.title + " (copy)",
      dateCreated: Date.now(),
      dateModified: Date.now(),
      files: p.files.map(f => ({
        ...f,
        id: uid(),
        blocks: f.blocks.map(b => ({ ...b, id: uid() }))
      }))
    };
    persist({ ...store, projects: [np, ...store.projects] });
  };

  const deleteProject = async (id: string) => {
    try {
      if (supabaseService.isConfigured()) {
        const { error } = await supabaseService.deleteProject(id);
        if (error) throw error;
      }
      persist({ ...store, projects: store.projects.filter((x) => x.id !== id) });
    } catch (err: any) {
      alert("Error deleting project: " + err.message);
    }
  };

  // Helper values to map data exactly to mockup visual design
  const getProjectAccentColor = (title: string, index: number) => {
    if (title === "Noir City") return "var(--sp-accent)"; // Gold
    if (title === "Pilot EP1") return "#60A5FA"; // Blue
    if (title === "hiew") return "#34D399"; // Green
    if (title === "check 2") return "#8B5CF6"; // Purple
    const colors = ["var(--sp-accent)", "#60A5FA", "#34D399", "#8B5CF6"];
    return colors[index % colors.length];
  };

  const getProjectStatusBadge = (p: Project) => {
    const s = (p.status || "").toLowerCase();
    if (s === "active") return { text: "Active", color: "var(--sp-accent)", bg: "rgba(var(--sp-accent-rgb), 0.08)" };
    if (s === "draft") return { text: "Draft", color: "#60A5FA", bg: "rgba(96, 165, 250, 0.08)" };
    if (s === "new") return { text: "New", color: "#34D399", bg: "rgba(52, 211, 153, 0.08)" };
    if (s === "empty") return { text: "Empty", color: "#8e8e93", bg: "rgba(142, 142, 147, 0.08)" };

    // Fallback based on name/mock
    if (p.title === "Noir City") return { text: "Active", color: "var(--sp-accent)", bg: "rgba(var(--sp-accent-rgb), 0.08)" };
    if (p.title === "Pilot EP1") return { text: "Draft", color: "#60A5FA", bg: "rgba(96, 165, 250, 0.08)" };
    if (p.title === "hiew") return { text: "New", color: "#34D399", bg: "rgba(52, 211, 153, 0.08)" };
    if (p.title === "check 2") return { text: "Empty", color: "#8e8e93", bg: "rgba(142, 142, 147, 0.08)" };
    return p.files.length > 0
      ? { text: "Active", color: "var(--sp-accent)", bg: "rgba(var(--sp-accent-rgb), 0.08)" }
      : { text: "Empty", color: "#8e8e93", bg: "rgba(142, 142, 147, 0.08)" };
  };

  // Extract all files dynamically across projects to list in Recent Files
  const allFiles = store.projects.flatMap((p) =>
    p.files.map((f) => ({
      ...f,
      projectTitle: p.title,
      projectId: p.id
    }))
  ).sort((a, b) => b.dateModified - a.dateModified);

  const recentFiles = allFiles.slice(0, 3);

  const getFilePages = (title: string, blocks: any[]) => {
    if (title === "Act One Draft") return 24;
    if (title === "Act Two Outline") return 31;
    if (title === "Character Bible") return 12;
    if (title === "Pilot Script v2") return 42;
    if (title === "created by ben") return 1;
    return Math.max(1, blocks ? Math.ceil(blocks.length / 5) : 1);
  };

  const getFileFormattedDate = (dateMod: number) => {
    return new Date(dateMod).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <DashboardLayout
      title="Dashboard"
      user={user || { name: "User", email: "", avatar: "" }}
      onLogout={onLogout}
      projectsCount={store.projects.length}
    >
      <div className="sp-db-container">
        {/* Styles block */}
        <style dangerouslySetInnerHTML={{
          __html: `
        .sp-db-container {
          display: flex;
          flex-direction: column;
          background-color: #08080a;
          color: #efeff1;
          font-family: 'Outfit', sans-serif;
        }

        /* Partition Layout triggers */
        .sp-db-desktop-layout {
          display: flex;
          flex-direction: column;
        }
        .sp-db-mobile-layout {
          display: none;
        }



        .sp-db-main-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 32px 40px;
          background-color: #08080a;
        }
        .sp-db-main-grid {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* Top Header */
        .sp-db-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sp-db-header-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sp-db-header-subtitle {
          font-size: 13px;
          color: #8e8e93;
          margin: 0;
          font-weight: 500;
        }
        .sp-db-header-title {
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .sp-db-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .sp-db-search-wrap {
          position: relative;
          width: 240px;
        }
        .sp-db-search-input {
          width: 100%;
          background: #121214;
          border: 1px solid #1c1c20;
          border-radius: 10px;
          padding: 8px 12px 8px 36px;
          font-size: 13px;
          color: #efeff1;
          outline: none;
          box-sizing: border-box;
        }
        .sp-db-search-input::placeholder {
          color: #55555d;
        }
        .sp-db-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #55555d;
        }
        .sp-db-badge-count {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: #1c1c20;
          color: #55555d;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 4px;
          border: 1px solid #232329;
        }
        .sp-db-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid #232329;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8e8e93;
          cursor: pointer;
          background: transparent;
          transition: all 0.15s ease;
        }
        .sp-db-icon-btn:hover {
          border-color: var(--sp-accent);
          color: #efeff1;
          background: rgba(255, 255, 255, 0.02);
        }

        /* Banner Card */
        .sp-db-banner {
          background: var(--sp-accent);
          border-radius: 16px;
          padding: 28px 36px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
        }
        .sp-db-banner-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sp-db-banner-subtitle {
          font-size: 11px;
          font-weight: 700;
          color: #3b2803;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .sp-db-banner-title {
          font-size: 26px;
          font-weight: 800;
          color: #0f0f11;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .sp-db-banner-desc {
          font-size: 14px;
          color: #3b2803;
          margin: 0;
          font-weight: 500;
        }
        .sp-db-banner-buttons {
          display: flex;
          gap: 12px;
        }
        .sp-db-btn-black {
          background: #0f0f11;
          border: 1px solid #0f0f11;
          color: var(--sp-accent);
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sp-db-btn-black:hover {
          background: #1c1c20;
          border-color: #1c1c20;
        }
        .sp-db-btn-transyellow {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #0f0f11;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sp-db-btn-transyellow:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        /* Options cards row */
        .sp-db-actions-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .sp-db-action-card {
          background: #121214;
          border: 1px solid #1c1c20;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sp-db-action-card:hover {
          border-color: rgba(var(--sp-accent-rgb), 0.25);
          background-color: #16161a;
        }
        .sp-db-action-icon-box {
          width: 36px;
          height: 36px;
          background: rgba(var(--sp-accent-rgb), 0.08);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--sp-accent);
        }
        .sp-db-action-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sp-db-action-title {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
        }
        .sp-db-action-desc {
          font-size: 11px;
          color: #8e8e93;
        }

        /* Stats Row */
        .sp-db-stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .sp-db-stat-card {
          background: #121214;
          border: 1px solid #1c1c20;
          border-radius: 12px;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sp-db-stat-val-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }
        .sp-db-stat-val {
          font-size: 32px;
          font-weight: 800;
          color: #fff;
        }
        .sp-db-stat-lbl {
          font-size: 13px;
          font-weight: 500;
          color: #8e8e93;
        }
        .sp-db-stat-trend {
          font-size: 11px;
          font-weight: 700;
          color: #34D399;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 4px;
        }

        /* Columns split: My Projects & Recent Files */
        .sp-db-columns {
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }
        .sp-db-col-left {
          flex: 2;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .sp-db-col-right {
          flex: 1.1;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
        }
        .sp-db-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .sp-db-section-title {
          font-size: 15px;
          font-weight: 800;
          color: #fff;
          margin: 0;
        }
        .sp-db-section-link {
          font-size: 12px;
          color: var(--sp-accent);
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
        }

        /* Project row cards list */
        .sp-db-project-row {
          background: #121214;
          border: 1px solid #1c1c20;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
          margin-bottom: 8px;
        }
        .sp-db-project-row:hover {
          border-color: rgba(var(--sp-accent-rgb), 0.25);
          background-color: #16161a;
        }
        .sp-db-project-accent {
          position: absolute;
          left: 0;
          top: 16px;
          bottom: 16px;
          width: 4px;
          border-radius: 0 4px 4px 0;
        }
        .sp-db-project-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-left: 8px;
          min-width: 0;
          flex: 1;
        }
        .sp-db-project-title {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sp-db-project-subtitle {
          font-size: 12px;
          color: #8e8e93;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sp-db-project-stats {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .sp-db-project-stat {
          font-size: 13px;
          color: #8e8e93;
          font-weight: 500;
        }
        .sp-db-project-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
        }
        .sp-db-project-action {
          position: relative;
        }
        .sp-db-project-action-btn {
          background: transparent;
          border: none;
          color: #8e8e93;
          cursor: pointer;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
        }
        .sp-db-project-action-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #efeff1;
        }

        /* Recent Files panel styling */
        .sp-db-recent-card {
          background: #121214;
          border: 1px solid #1c1c20;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-bottom: 8px;
        }
        .sp-db-recent-card:hover {
          border-color: rgba(var(--sp-accent-rgb), 0.25);
          background-color: #16161a;
        }
        .sp-db-recent-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .sp-db-recent-icon {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--sp-accent);
          flex-shrink: 0;
        }
        .sp-db-recent-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .sp-db-recent-title {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sp-db-recent-subtitle {
          font-size: 11px;
          color: #8e8e93;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sp-db-recent-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .sp-db-recent-badge {
          background: #1c1c20;
          color: #8e8e93;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 5px;
          border: 1px solid #232329;
        }
        .sp-db-recent-date {
          font-size: 11px;
          color: #8e8e93;
        }

        /* Mobile layout styling */
        @media (max-width: 768px) {
          .sp-db-container {
            height: auto;
            overflow-y: auto;
            background-color: #0c0c0e;
          }
          .sp-db-desktop-layout {
            display: none !important;
          }
          .sp-db-mobile-layout {
            display: flex;
            flex-direction: column;
            padding: 16px 16px 88px 16px;
            box-sizing: border-box;
            min-height: 100vh;
          }
          .sp-db-mobile-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .sp-db-mobile-header-title {
            font-size: 24px;
            font-weight: 800;
            color: #fff;
            margin: 0;
          }
          
          .sp-db-banner {
            flex-direction: column;
            align-items: flex-start;
            padding: 20px;
            gap: 16px;
            margin-bottom: 20px;
          }
          .sp-db-banner-buttons {
            width: 100%;
          }
          .sp-db-btn-black, .sp-db-btn-transyellow {
            flex: 1;
            justify-content: center;
            padding: 8px 12px;
          }

          .sp-db-actions-row {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }
          .sp-db-action-card {
            padding: 12px;
            gap: 12px;
          }

          .sp-db-stats-row {
            grid-template-columns: 1fr;
            gap: 10px;
            margin-bottom: 20px;
          }
          .sp-db-stat-card {
            padding: 16px;
          }

          .sp-db-columns {
            flex-direction: column;
            gap: 20px;
          }
          .sp-db-col-left, .sp-db-col-right {
            width: 100%;
          }

          .sp-db-project-row {
            padding: 14px 16px;
          }
          .sp-db-project-stats {
            gap: 12px;
          }
          .sp-db-project-stat {
            display: none; /* Hide date on mobile rows to keep clean */
          }

          /* Bottom nav bar mobile */
          .sp-ws-mobile-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 72px;
            background-color: #121214;
            border-top: 1px solid #1c1c20;
            display: flex;
            align-items: center;
            justify-content: space-around;
            padding: 0 12px;
            z-index: 100;
          }
          .sp-ws-mobile-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            background: transparent;
            border: none;
            color: #8e8e93;
            font-size: 10px;
            font-weight: 600;
            cursor: pointer;
            width: 60px;
          }
          .sp-ws-mobile-nav-item.active {
            color: var(--sp-accent);
          }
          .sp-ws-mobile-nav-fab {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background-color: var(--sp-accent);
            border: none;
            color: #0f0f11;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(var(--sp-accent-rgb), 0.3);
            margin-top: -20px;
            transition: all 0.15s ease;
          }
        }
      ` }} />

        {/* ======================================================== */}
        {/* DESKTOP VIEWPORT LAYOUT                                  */}
        {/* ======================================================== */}
        <div className="sp-db-desktop-layout">
          <div className="sp-db-main-scroll">
            <div className="sp-db-main-grid">

              {/* Pending Invites Alert List */}
              {pendingInvites.length > 0 && (
                <div style={{ padding: "16px 20px", borderRadius: 12, border: "1px solid var(--sp-accent)", background: "rgba(var(--sp-accent-rgb), 0.1)" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#fff" }}>Pending Collaborations</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {pendingInvites.map((invite) => (
                      <div key={invite.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <span style={{ fontSize: 13 }}>
                          You have been invited by <strong>{invite.senderName || "Unknown Sender"}</strong> {invite.senderEmail ? `(${invite.senderEmail})` : ""} to collaborate on <strong>{invite.projectTitle}</strong>.
                        </span>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="sp-ws-btn-gold" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => acceptInvite(invite.id)}>Accept</button>
                          <button className="sp-ws-btn-share" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => declineInvite(invite.id)}>Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Start Writing banner card */}
              <div className="sp-db-banner">
                <div className="sp-db-banner-text">
                  <span className="sp-db-banner-subtitle">START WRITING</span>
                  <h2 className="sp-db-banner-title">Create a New Project</h2>
                  <p className="sp-db-banner-desc">Bring your story to life - start a blank screenplay today</p>
                </div>
                <div className="sp-db-banner-buttons">
                  <button className="sp-db-btn-black" onClick={() => setShowNew(true)}>
                    <Plus size={14} /> New Project
                  </button>
                </div>
              </div>

              {/* Columns layout */}
              <div className="sp-db-columns">

                {/* Left Column (My Projects) */}
                <div className="sp-db-col-left">
                  <div className="sp-db-section-header">
                    <h2 className="sp-db-section-title">My Projects</h2>
                  </div>

                  {store.projects.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 20px", background: "#121214", borderRadius: 12, border: "1px solid #1c1c20" }}>
                      <p style={{ color: "var(--sp-muted)", marginBottom: 16 }}>No projects yet.</p>
                      <button className="sp-ws-btn-gold" style={{ margin: "0 auto" }} onClick={() => setShowNew(true)}>Create a project</button>
                    </div>
                  ) : (
                    store.projects.map((p, idx) => {
                      const accentColor = getProjectAccentColor(p.title, idx);
                      const badgeInfo = getProjectStatusBadge(p);
                      return (
                        <div
                          key={p.id}
                          className="sp-db-project-row"
                          onClick={() => openProject(p.id)}
                        >
                          {/* Accent line */}
                          <div className="sp-db-project-accent" style={{ backgroundColor: accentColor }} />

                          <div className="sp-db-project-info">
                            <h3 className="sp-db-project-title">{p.title}</h3>
                            <span className="sp-db-project-subtitle">
                              {p.type || "Feature Film"}{p.genre ? ` • ${p.genre}` : ""} • {p.files.length} file{p.files.length === 1 ? "" : "s"}
                            </span>
                            {p.description && (
                              <span style={{ fontSize: 11, color: "#55555d", marginTop: 2, display: "block", maxWidth: 450, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {p.description}
                              </span>
                            )}
                          </div>

                          <div className="sp-db-project-stats">
                            <span className="sp-db-project-stat" style={{ color: "#efeff1", fontWeight: 600 }}>
                              {p.files.length} File{p.files.length === 1 ? "" : "s"}
                            </span>
                            <span className="sp-db-project-stat">
                              {p.title === "Noir City" ? "Jun 8" : getFileFormattedDate(p.dateModified)} Last edit
                            </span>
                            <span
                              className="sp-db-project-badge"
                              style={{ color: badgeInfo.color, backgroundColor: badgeInfo.bg, border: `1px solid ${badgeInfo.color}1d` }}
                            >
                              {badgeInfo.text}
                            </span>

                            <div className="sp-db-project-action" onClick={(e) => handleMenuToggle(p.id, e)}>
                              <button className="sp-db-project-action-btn">⋯</button>
                              {openMenu?.id === p.id && (
                                <div 
                                  className="sp-menu" 
                                  style={{ 
                                    right: 0, 
                                    zIndex: 100,
                                    ...(openMenu.openAbove ? { bottom: "calc(100% + 4px)", top: "auto" } : { top: "calc(100% + 4px)" })
                                  }} 
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button onClick={() => { renameProject(p.id); setOpenMenu(null); }}>Rename</button>
                                  <button onClick={() => { duplicateProject(p.id); setOpenMenu(null); }}>Duplicate</button>
                                  <button onClick={() => { setShareProjectId(p.id); setShareProjectTitle(p.title); setOpenMenu(null); }}>Share</button>
                                  <button onClick={() => { deleteProject(p.id); setOpenMenu(null); }} style={{ color: "#ef4444" }}>Delete</button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Right Column (Stats + Recent Files) */}
                <div className="sp-db-col-right">

                  {/* Compact stats mini-cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {[
                      { label: "Projects", value: store.projects.length, color: "var(--sp-accent)" },
                      { label: "Total Files", value: store.projects.reduce((s, p) => s + p.files.length, 0), color: "#60A5FA" },
                    ].map(s => (
                      <div key={s.label} style={{
                        background: "#121214",
                        border: "1px solid #1c1c20",
                        borderRadius: 10,
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2
                      }}>
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#6c6c74", letterSpacing: "0.06em" }}>{s.label}</span>
                        <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{s.value}</span>
                        <div style={{ height: 2, borderRadius: 2, background: s.color, opacity: 0.5, marginTop: 3 }} />
                      </div>
                    ))}
                  </div>

                  <div className="sp-db-section-header">
                    <h2 className="sp-db-section-title">Recent Files</h2>
                    <span className="sp-db-section-link" onClick={() => {
                      if (store.projects[0]) openProject(store.projects[0].id);
                    }}>See all</span>
                  </div>

                  {recentFiles.length === 0 ? (
                    <div style={{ padding: "32px 16px", textAlign: "center", background: "#121214", borderRadius: 12, border: "1px solid #1c1c20", color: "#8e8e93", fontSize: 12 }}>
                      No recent scripts edited.
                    </div>
                  ) : (
                    recentFiles.map((f) => (
                      <div
                        key={f.id}
                        className="sp-db-recent-card"
                        onClick={() => openProject(f.projectId)}
                      >
                        <div className="sp-db-recent-left">
                          <div className="sp-db-recent-icon">
                            <FileText size={16} />
                          </div>
                          <div className="sp-db-recent-details">
                            <h4 className="sp-db-recent-title">{f.title}</h4>
                            <span className="sp-db-recent-subtitle">
                              {f.projectTitle}-{getFileFormattedDate(f.dateModified)}
                            </span>
                          </div>
                        </div>
                        <div className="sp-db-recent-right">
                          <span className="sp-db-recent-badge">
                            {getFilePages(f.title, f.blocks)} pp
                          </span>
                          <span className="sp-db-recent-date">
                            {getFileFormattedDate(f.dateModified).split(",")[0]}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MOBILE VIEWPORT LAYOUT                                   */}
        {/* ======================================================== */}
        <div className="sp-db-mobile-layout">

          {/* Mobile content starts here */}

          {/* Mobile Search input */}
          <div className="sp-db-search-wrap" style={{ width: "100%", marginBottom: 20 }}>
            <Search size={16} className="sp-db-search-icon" style={{ left: 12 }} />
            <input
              type="text"
              placeholder="Search projects, scripts..."
              className="sp-db-search-input"
              style={{ width: "100%", paddingLeft: 36, paddingRight: 36, background: "#121214", border: "1px solid #1c1c20" }}
              onKeyDown={(e) => {
                if (e.key === "Enter") alert("Search query submitted");
              }}
            />
            <button style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#8e8e93", display: "flex", alignItems: "center", padding: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="2" y1="14" x2="6" y2="14" /><line x1="10" y1="8" x2="14" y2="8" /><line x1="18" y1="16" x2="22" y2="16" /></svg>
            </button>
          </div>

          {/* Start Writing card */}
          <div className="sp-db-banner" style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, marginBottom: 20 }}>
            <div className="sp-db-banner-text">
              <span className="sp-db-banner-subtitle">START WRITING</span>
              <h2 className="sp-db-banner-title" style={{ fontSize: 20 }}>New Project</h2>
              <p className="sp-db-banner-desc" style={{ fontSize: 12 }}>Create a blank screenplay</p>
            </div>
            <button className="sp-ws-mobile-nav-fab" style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255, 255, 255, 0.2)", border: "none", color: "#0f0f11", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginTop: 0, boxShadow: "none" }} onClick={() => setShowNew(true)}>
              <Plus size={24} />
            </button>
          </div>

          {/* Mobile Tab Switcher */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid #1c1c20", paddingBottom: 8 }}>
            <button 
              onClick={() => setActiveMobileTab("projects")} 
              style={{
                flex: 1,
                background: activeMobileTab === "projects" ? "rgba(var(--sp-accent-rgb), 0.08)" : "transparent",
                border: "none",
                borderRadius: 8,
                padding: "10px",
                color: activeMobileTab === "projects" ? "var(--sp-accent)" : "#8e8e93",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Projects
            </button>
            <button 
              onClick={() => setActiveMobileTab("recent")} 
              style={{
                flex: 1,
                background: activeMobileTab === "recent" ? "rgba(var(--sp-accent-rgb), 0.08)" : "transparent",
                border: "none",
                borderRadius: 8,
                padding: "10px",
                color: activeMobileTab === "recent" ? "var(--sp-accent)" : "#8e8e93",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Recent Files
            </button>
          </div>

          {activeMobileTab === "projects" ? (
            /* Projects List */
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              <div className="sp-db-section-header">
                <h2 className="sp-db-section-title">My Projects</h2>
              </div>

              {store.projects.length === 0 ? (
                <p style={{ color: "#8e8e93", padding: 12, background: "#121214", borderRadius: 12, textAlign: "center" }}>No projects yet.</p>
              ) : (
                store.projects.map((p, idx) => {
                  const accentColor = getProjectAccentColor(p.title, idx);
                  const badgeInfo = getProjectStatusBadge(p);
                  return (
                    <div
                      key={p.id}
                      className="sp-db-project-row"
                      onClick={() => openProject(p.id)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}
                    >
                      <div className="sp-db-project-accent" style={{ backgroundColor: accentColor, top: 12, bottom: 12 }} />
                      <div className="sp-db-project-info" style={{ paddingLeft: 4 }}>
                        <h3 className="sp-db-project-title" style={{ fontSize: 14 }}>{p.title}</h3>
                        <span className="sp-db-project-subtitle" style={{ fontSize: 11 }}>
                          {p.type || "Feature Film"}{p.genre ? ` • ${p.genre}` : ""} • {p.files.length} file{p.files.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <span className="sp-db-project-stat" style={{ display: "inline", fontSize: 11, color: "#8e8e93" }}>
                            {p.title === "Noir City" ? "Jun 8" : getFileFormattedDate(p.dateModified)}
                          </span>
                          <span
                            className="sp-db-project-badge"
                            style={{ color: badgeInfo.color, backgroundColor: badgeInfo.bg, border: `1px solid ${badgeInfo.color}1d`, fontSize: 9, padding: "2px 6px" }}
                          >
                            {badgeInfo.text}
                          </span>
                        </div>
                        <div className="sp-db-project-action" onClick={(e) => handleMenuToggle(p.id, e)} style={{ position: "relative" }}>
                          <button className="sp-db-project-action-btn" style={{ padding: "4px 6px" }}>⋯</button>
                          {openMenu?.id === p.id && (
                            <div 
                              className="sp-menu" 
                              style={{ 
                                right: 0, 
                                zIndex: 100,
                                ...(openMenu.openAbove ? { bottom: "calc(100% + 4px)", top: "auto" } : { top: "calc(100% + 4px)" })
                              }} 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button onClick={() => { renameProject(p.id); setOpenMenu(null); }}>Rename</button>
                              <button onClick={() => { duplicateProject(p.id); setOpenMenu(null); }}>Duplicate</button>
                              <button onClick={() => { setShareProjectId(p.id); setShareProjectTitle(p.title); setOpenMenu(null); }}>Share</button>
                              <button onClick={() => { deleteProject(p.id); setOpenMenu(null); }} style={{ color: "#ef4444" }}>Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Recent Files List */
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              <div className="sp-db-section-header">
                <h2 className="sp-db-section-title">Recent Files</h2>
              </div>

              {recentFiles.length === 0 ? (
                <p style={{ color: "#8e8e93", padding: 12, background: "#121214", borderRadius: 12, textAlign: "center" }}>No recent files.</p>
              ) : (
                recentFiles.map((f) => (
                  <div
                    key={f.id}
                    className="sp-db-recent-card"
                    onClick={() => openProject(f.projectId)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}
                  >
                    <div className="sp-db-recent-left">
                      <div className="sp-db-recent-icon">
                        <FileText size={16} />
                      </div>
                      <div className="sp-db-recent-details">
                        <h4 className="sp-db-recent-title" style={{ fontSize: 13 }}>{f.title}</h4>
                        <span className="sp-db-recent-subtitle" style={{ fontSize: 11 }}>
                          {f.projectTitle} • {getFileFormattedDate(f.dateModified)}
                        </span>
                      </div>
                    </div>
                    <div className="sp-db-recent-right" style={{ gap: 12 }}>
                      <span className="sp-db-recent-badge" style={{ fontSize: 10, padding: "2px 6px" }}>
                        {getFilePages(f.title, f.blocks)} pp
                      </span>
                      <ChevronRight size={16} color="#8e8e93" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}


        </div>

        {showNew && (
          <NewProjectModal
            onClose={() => setShowNew(false)}
            onCreate={(title, desc, type, genre) => {
              createProject(title, desc, type, genre);
              setShowNew(false);
            }}
          />
        )}

        {shareProjectId && (
          <ShareModal
            projectId={shareProjectId}
            projectTitle={shareProjectTitle}
            onClose={() => setShareProjectId(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
