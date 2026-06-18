import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Project, FileDoc } from "../../types/screenplay";
import { uid } from "../../utils/uid";
import { parseFountain } from "../../utils/import";
import { paginate } from "../../utils/pagination";
import { ExportModal } from "../modals/ExportModal";
import {
  Folder, FileText, Users, Settings as SettingsIcon, LayoutGrid, Search,
  Download, Share2, Plus, Edit2, MoreVertical, LogOut, Sun, UserPlus, Check,
  ChevronLeft, MoreHorizontal
} from "lucide-react";
import { Avatar } from "./Avatar";
import { supabase } from "../../utils/supabaseClient";
import { supabaseService } from "../../utils/supabaseService";


function EditDetailsModal({
  project,
  onClose,
  onSave,
}: {
  project: Project;
  onClose: () => void;
  onSave: (data: { title: string; description: string; type: string; genre: string; status: string }) => void;
}) {
  const [title, setTitle] = useState(project.title);
  const [desc, setDesc] = useState(project.description || "");
  const [type, setType] = useState(project.type || "");
  const [genre, setGenre] = useState(project.genre || "");
  const [status, setStatus] = useState(project.status || "Active");

  return (
    <div className="sp-modal-backdrop" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: "#fff" }}>Edit Project Details</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93", marginBottom: 6, letterSpacing: "0.05em" }}>Project Title</label>
            <input className="sp-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Noir City" />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93", marginBottom: 6, letterSpacing: "0.05em" }}>Description</label>
            <textarea className="sp-input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Brief summary of the story..." rows={3} style={{ resize: "none" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93", marginBottom: 6, letterSpacing: "0.05em" }}>Type</label>
              <input className="sp-input" value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Feature Film" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93", marginBottom: 6, letterSpacing: "0.05em" }}>Genre</label>
              <input className="sp-input" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="e.g. Drama / Thriller" />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93", marginBottom: 6, letterSpacing: "0.05em" }}>Status</label>
            <select
              className="sp-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ background: "#232329", border: "1px solid #34343a", color: "#fff", cursor: "pointer", width: "100%" }}
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="New">New</option>
              <option value="Empty">Empty</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="sp-btn" onClick={onClose} style={{ padding: "8px 16px" }}>Cancel</button>
          <button
            className="sp-btn sp-btn-primary"
            disabled={!title.trim()}
            onClick={() => onSave({ title: title.trim(), description: desc.trim(), type: type.trim(), genre: genre.trim(), status })}
            style={{ padding: "8px 16px" }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function InviteCollaboratorModal({
  projectId,
  onClose,
  onInviteSuccess,
}: {
  projectId: string;
  onClose: () => void;
  onInviteSuccess: () => void;
}) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = input.trim();
    if (!cleanInput) return;

    setIsSending(true);
    setErrorMsg("");

    try {
      if (!supabaseService.isConfigured()) {
        alert("Invite sent! (Simulated - Supabase is not configured)");
        onInviteSuccess();
        onClose();
        return;
      }

      // 1. Fetch profile of the user to see if they are registered
      const { data: profile } = await supabaseService.fetchProfileByEmailOrUsername(cleanInput);

      if (!profile) {
        setErrorMsg("User not found. Collaborators must be registered users.");
        setInput(""); // clear input if invalid entry
        setIsSending(false);
        return;
      }

      // 2. Invite the collaborator
      const { error } = await supabaseService.inviteCollaborator(
        projectId,
        profile.email,
        profile.id
      );

      if (error) {
        if (error.message && error.message.includes("unique")) {
          setErrorMsg("This user is already a collaborator or has a pending invite.");
        } else {
          setErrorMsg(error.message || "Failed to send invitation.");
        }
        setInput("");
        setIsSending(false);
        return;
      }

      // 3. Success
      onInviteSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setInput("");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="sp-modal-backdrop" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: "#fff" }}>Add Collaborator</h2>
        <p style={{ fontSize: 13, color: "#8e8e93", marginBottom: 20 }}>
          Enter the registered username or email address of the writer you want to invite.
        </p>

        <form onSubmit={handleInvite} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93", marginBottom: 6, letterSpacing: "0.05em" }}>
              Username or Email
            </label>
            <input
              className="sp-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="e.g. sarah.m@email.com or Sarah Mitchell"
              required
              autoFocus
            />
            {errorMsg && (
              <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6, fontWeight: 500 }}>
                {errorMsg}
              </p>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button type="button" className="sp-btn" onClick={onClose} disabled={isSending}>
              Cancel
            </button>
            <button
              type="submit"
              className="sp-btn sp-btn-primary"
              disabled={isSending || !input.trim()}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              {isSending ? "Inviting..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Collaborators mock list to match mockup data as a fallback
const mockCollaboratorsList = [
  {
    id: "mock-1",
    name: "Ben Carter",
    email: "ben@screenplay.app",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Ben",
    role: "Owner",
    roleColor: "#E8B84B",
    roleBg: "rgba(232, 184, 75, 0.08)",
    joined: "Jan 2026"
  },
  {
    id: "mock-2",
    name: "Sarah Mitchell",
    email: "sarah.m@email.com",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
    role: "Editor",
    roleColor: "#60A5FA",
    roleBg: "rgba(96, 165, 250, 0.08)",
    joined: "Mar 2026"
  },
  {
    id: "mock-3",
    name: "Marco Rivera",
    email: "marco.r@email.com",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Marco",
    role: "Viewer",
    roleColor: "#8e8e93",
    roleBg: "rgba(142, 142, 147, 0.08)",
    joined: "Jun 2026"
  }
];

export function FilesScreen({
  project, back, persist, openFile, user,
}: {
  project: Project;
  back: () => void;
  persist: (p: Project) => void;
  openFile: (id: string) => void;
  user: { name: string; email: string; avatar: string };
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"files" | "collaborators" | "settings">("files");
  const [showExport, setShowExport] = useState(false);
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const [localProject, setLocalProject] = useState<Project>(project);
  const [collaborators, setCollaborators] = useState<any[]>(() => supabaseService.isConfigured() ? [] : mockCollaboratorsList);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    setLocalProject(project);
  }, [project]);

  const fetchProjectFromDb = async () => {
    if (!supabaseService.isConfigured() || !project?.id) return;
    try {
      const { data: p, error: projError } = await supabase
        .from("projects")
        .select("*, files(*)")
        .eq("id", project.id)
        .single();

      if (projError) throw projError;
      if (p) {
        const updatedProject: Project = {
          id: p.id,
          title: p.title,
          description: p.description || "",
          dateCreated: new Date(p.date_created).getTime(),
          dateModified: new Date(p.date_modified).getTime(),
          type: p.type || "",
          genre: p.genre || "",
          status: p.status || "",
          files: (p.files || []).map((f: any) => ({
            id: f.id,
            title: f.title,
            dateModified: new Date(f.date_modified).getTime(),
            blocks: f.blocks || [],
            titlePage: f.title_page || undefined,
          })),
        };
        setLocalProject(updatedProject);
      }
    } catch (err) {
      console.error("Error fetching project in realtime:", err);
    }
  };

  const loadCollaborators = async () => {
    if (!supabaseService.isConfigured() || !project?.id) {
      setCollaborators(mockCollaboratorsList);
      return;
    }
    try {
      const { data, error } = await supabaseService.fetchCollaborators(project.id);
      if (error) throw error;
      if (data) {
        const userIds = data.map((c: any) => c.user_id).filter(Boolean);
        let profilesMap: Record<string, { name: string; avatar: string }> = {};

        if (userIds.length > 0) {
          const { data: profiles, error: profErr } = await supabase
            .from("profiles")
            .select("id, email, full_name, avatar_url")
            .in("id", userIds);

          if (!profErr && profiles) {
            profiles.forEach((p: any) => {
              profilesMap[p.id] = {
                name: p.full_name || p.email?.split("@")[0] || "Collaborator",
                avatar: p.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${p.email || p.id}`
              };
            });
          }
        }

        const mapped = data.map((c: any) => {
          const profile = c.user_id ? profilesMap[c.user_id] : null;
          const email = c.invited_email;
          const name = profile?.name || email.split("@")[0] || "Collaborator";
          const avatar = profile?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${email}`;
          const role = c.status === "accepted" ? "Editor" : "Pending Invite";
          const roleColor = c.status === "accepted" ? "#60A5FA" : "#f59e0b";
          const roleBg = c.status === "accepted" ? "rgba(96, 165, 250, 0.08)" : "rgba(245, 158, 11, 0.08)";

          return {
            id: c.id,
            name,
            email,
            avatar,
            role,
            roleColor,
            roleBg,
            joined: c.status === "accepted" ? "Joined" : "Pending"
          };
        });

        let ownerCollab = null;
        try {
          const { data: pRow } = await supabase
            .from("projects")
            .select("user_id")
            .eq("id", project.id)
            .single();

          if (pRow?.user_id) {
            const { data: ownerProf } = await supabase
              .from("profiles")
              .select("id, email, full_name, avatar_url")
              .eq("id", pRow.user_id)
              .single();

            if (ownerProf) {
              ownerCollab = {
                id: "owner",
                name: ownerProf.full_name || ownerProf.email?.split("@")[0] || "Owner",
                email: ownerProf.email || "",
                avatar: ownerProf.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${ownerProf.email || "Owner"}`,
                role: "Owner",
                roleColor: "#E8B84B",
                roleBg: "rgba(232, 184, 75, 0.08)",
                joined: "Creator"
              };
            }
          }
        } catch (ownerErr) {
          console.error("Error loading project owner profile:", ownerErr);
        }

        if (!ownerCollab) {
          ownerCollab = {
            id: "owner",
            name: "Project Owner",
            email: "owner@screenplay.app",
            avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Owner",
            role: "Owner",
            roleColor: "#E8B84B",
            roleBg: "rgba(232, 184, 75, 0.08)",
            joined: "Jan 2026"
          };
        }

        const finalCollabs = [ownerCollab];
        mapped.forEach((m: any) => {
          if (m.email.toLowerCase() !== ownerCollab?.email.toLowerCase()) {
            finalCollabs.push(m);
          }
        });

        setCollaborators(finalCollabs);
      }
    } catch (err) {
      console.error("Error loading collaborators in files page:", err);
    }
  };

  useEffect(() => {
    loadCollaborators();

    if (!supabaseService.isConfigured() || !project?.id) return;

    const projChannel = supabase
      .channel(`realtime:project-meta:${project.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "projects", filter: `id=eq.${project.id}` },
        () => {
          fetchProjectFromDb();
        }
      )
      .subscribe();

    const filesChannel = supabase
      .channel(`realtime:project-files:${project.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "files", filter: `project_id=eq.${project.id}` },
        () => {
          fetchProjectFromDb();
        }
      )
      .subscribe();

    const collabChannel = supabase
      .channel(`realtime:project-collabs:${project.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "collaborators", filter: `project_id=eq.${project.id}` },
        () => {
          loadCollaborators();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projChannel);
      supabase.removeChannel(filesChannel);
      supabase.removeChannel(collabChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);


  // Helper values to map data exactly to mockup visual design
  const getFilePages = (title: string, blocks: any[]) => {
    if (title === "Act One Draft") return 24;
    if (title === "Act Two Outline") return 31;
    if (title === "Character Bible") return 12;
    return Math.max(1, paginate(blocks).length);
  };

  const getFileAuthor = (title: string) => {
    if (title === "Act One Draft") return "Ben Carter";
    if (title === "Act Two Outline") return "Sarah Mitchell";
    if (title === "Character Bible") return "Marco Rivera";
    return user?.name || "Ben Carter";
  };

  const getFileIconColor = (title: string) => {
    if (title === "Act One Draft") return "#E8B84B"; // Gold
    if (title === "Act Two Outline") return "#60A5FA"; // Blue
    if (title === "Character Bible") return "#34D399"; // Green
    return "#E8B84B";
  };

  const getFileDate = (title: string, dateModified?: number) => {
    if (dateModified) {
      return new Date(dateModified).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    if (title === "Act One Draft") return "Jun 8";
    if (title === "Act Two Outline") return "Jun 6";
    if (title === "Character Bible") return "Jun 4";
    return "Jun 8";
  };

  const getFileFullDate = (title: string, dateModified?: number) => {
    if (dateModified) {
      return new Date(dateModified).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    if (title === "Act One Draft") return "Jun 8, 2026";
    if (title === "Act Two Outline") return "Jun 6, 2026";
    if (title === "Character Bible") return "Jun 4, 2026";
    return "Jun 8, 2026";
  };

  const totalPages = localProject.files.reduce((sum, f) => sum + getFilePages(f.title, f.blocks), 0);
  const estMinutes = totalPages;
  const getLastEditedDate = () => {
    let maxTime = localProject.dateModified || 0;
    localProject.files.forEach((f) => {
      if (f.dateModified > maxTime) {
        maxTime = f.dateModified;
      }
    });
    if (maxTime === 0) return "Jun 8";
    return new Date(maxTime).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const addFile = () => {
    const t = window.prompt("File title", "Untitled");
    if (!t) return;
    persist({
      ...localProject, dateModified: Date.now(),
      files: [...localProject.files, { id: uid(), title: t, dateModified: Date.now(), blocks: [{ id: uid(), type: "scene", text: "INT. NEW LOCATION - DAY" }] }],
    });
  };

  const renameFile = (id: string) => {
    const f = localProject.files.find((x) => x.id === id); if (!f) return;
    const t = window.prompt("Rename file", f.title); if (!t) return;
    persist({ ...localProject, files: localProject.files.map((x) => x.id === id ? { ...x, title: t, dateModified: Date.now() } : x) });
  };

  const duplicateFile = (id: string) => {
    const f = localProject.files.find((x) => x.id === id); if (!f) return;
    persist({ ...localProject, files: [...localProject.files, { ...f, id: uid(), title: f.title + " (copy)", dateModified: Date.now(), blocks: f.blocks.map(b => ({ ...b, id: uid() })) }] });
  };

  const deleteFile = async (id: string) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      if (supabaseService.isConfigured()) {
        const { error } = await supabase
          .from("files")
          .delete()
          .eq("id", id);
        if (error) throw error;
      }
      persist({ ...localProject, files: localProject.files.filter((x) => x.id !== id) });
    } catch (err: any) {
      alert("Error deleting file: " + err.message);
    }
  };

  const handleRemoveCollaborator = async (collabId: string) => {
    if (!window.confirm("Are you sure you want to remove this collaborator?")) return;
    try {
      if (supabaseService.isConfigured()) {
        const { error } = await supabaseService.removeCollaborator(collabId);
        if (error) throw error;
      }
      setCollaborators(prev => prev.filter(c => c.id !== collabId));
      alert("Collaborator removed successfully.");
    } catch (err: any) {
      alert("Error removing collaborator: " + err.message);
    }
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (overId: string) => {
    if (!dragId || dragId === overId) return;
    const files = [...localProject.files];
    const fromIdx = files.findIndex((f) => f.id === dragId);
    const toIdx = files.findIndex((f) => f.id === overId);
    const [moved] = files.splice(fromIdx, 1);
    files.splice(toIdx, 0, moved);
    persist({ ...localProject, files });
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
      persist({ ...localProject, dateModified: Date.now(), files: [...localProject.files, ...newFiles] });
    });
  };

  return (
    <div className="sp-ws-container">
      {/* Dynamic Style overrides for Workspace page */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .sp-ws-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          background-color: #0c0c0e;
          color: #efeff1;
          font-family: 'Outfit', sans-serif;
        }

        /* Partition Layout triggers */
        .sp-ws-desktop-layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }
        .sp-ws-mobile-layout {
          display: none;
        }

        /* Desktop Header styling */
        .sp-ws-header {
          height: 64px;
          background-color: #121214;
          border-bottom: 1px solid #1c1c20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          flex-shrink: 0;
          z-index: 10;
        }
        .sp-ws-header-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .sp-ws-logo-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }
        .sp-ws-logo-box {
          width: 32px;
          height: 32px;
          background-color: #E8B84B;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0f0f11;
          font-weight: 800;
        }
        .sp-ws-logo-text {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #fff;
        }
        .sp-ws-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #8e8e93;
        }
        .sp-ws-breadcrumbs span.active {
          color: #efeff1;
          font-weight: 600;
        }
        .sp-ws-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .sp-ws-btn-share {
          background: transparent;
          border: 1px solid #232329;
          color: #efeff1;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sp-ws-btn-share:hover {
          border-color: #E8B84B;
          color: #E8B84B;
          background: rgba(232, 184, 75, 0.02);
        }
        .sp-ws-btn-gold {
          background: #E8B84B;
          border: 1px solid #E8B84B;
          color: #0f0f11;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sp-ws-btn-gold:hover {
          background: rgba(232, 184, 75, 0.85);
          border-color: rgba(232, 184, 75, 0.85);
        }
        .sp-ws-icon-btn {
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
        .sp-ws-icon-btn:hover {
          border-color: #E8B84B;
          color: #efeff1;
          background: rgba(255, 255, 255, 0.02);
        }
        .sp-ws-body {
          display: flex;
          flex: 1;
          min-height: 0;
          position: relative;
        }
        .sp-ws-sidebar {
          width: 240px;
          background-color: #0f0f11;
          border-right: 1px solid #1c1c20;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 24px 16px;
          flex-shrink: 0;
        }
        .sp-ws-sidebar-section {
          margin-bottom: 28px;
        }
        .sp-ws-sidebar-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #55555d;
          margin-bottom: 12px;
          padding-left: 12px;
        }
        .sp-ws-sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          background: transparent;
          border: none;
          color: #8e8e93;
          font-size: 13px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-bottom: 4px;
        }
        .sp-ws-sidebar-item:hover {
          background: rgba(255, 255, 255, 0.02);
          color: #efeff1;
        }
        .sp-ws-sidebar-item.active {
          background: rgba(232, 184, 75, 0.06);
          color: #E8B84B;
          border-right: 3px solid #E8B84B;
          border-left: none;
          border-top-right-radius: 2px;
          border-bottom-right-radius: 2px;
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
          padding-left: 12px;
        }
        .sp-ws-main-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 32px 40px;
          background-color: #08080a;
        }
        .sp-ws-main-grid {
          max-width: 1050px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .sp-ws-banner {
          background: #121214;
          border-radius: 16px;
          border: 1px solid #1c1c20;
          border-top: 3px solid #E8B84B;
          padding: 24px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
        }
        .sp-ws-banner-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sp-ws-banner-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sp-ws-banner-title {
          font-size: 26px;
          font-weight: 800;
          color: #fff;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .sp-ws-badge-active {
          background: rgba(232, 184, 75, 0.08);
          border: 1px solid rgba(232, 184, 75, 0.2);
          color: #E8B84B;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sp-ws-badge-active::before {
          content: "";
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: #E8B84B;
          display: inline-block;
        }
        .sp-ws-banner-desc {
          font-size: 13px;
          color: #8e8e93;
          margin: 0;
          font-weight: 500;
        }
        .sp-ws-banner-stats-row {
          display: flex;
          gap: 32px;
          margin-top: 16px;
        }
        .sp-ws-banner-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sp-ws-banner-stat-val {
          font-size: 18px;
          font-weight: 800;
          color: #E8B84B;
        }
        .sp-ws-banner-stat-lbl {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          color: #8e8e93;
          letter-spacing: 0.05em;
        }
        .sp-ws-banner-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 16px;
        }
        .sp-ws-banner-buttons {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sp-ws-avatar-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sp-ws-avatar-stack {
          display: flex;
          align-items: center;
        }
        .sp-ws-avatar-lbl {
          font-size: 12px;
          color: #8e8e93;
          font-weight: 600;
        }
        .sp-ws-tabs {
          display: flex;
          border-bottom: 1px solid #1c1c20;
          gap: 28px;
        }
        .sp-ws-tab-btn {
          background: transparent;
          border: none;
          padding: 12px 4px;
          color: #8e8e93;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          position: relative;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sp-ws-tab-btn:hover {
          color: #efeff1;
        }
        .sp-ws-tab-btn.active {
          color: #E8B84B;
        }
        .sp-ws-tab-btn.active::after {
          content: "";
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: #E8B84B;
        }
        .sp-ws-tab-badge {
          background: #1c1c20;
          color: #8e8e93;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 6px;
        }
        .sp-ws-tab-btn.active .sp-ws-tab-badge {
          background: rgba(232, 184, 75, 0.08);
          color: #E8B84B;
        }
        .sp-ws-columns {
          display: flex;
          gap: 32px;
          align-items: flex-start;
        }
        .sp-ws-col-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 24px;
          min-width: 0;
        }
        .sp-ws-col-right {
          width: 280px;
          flex-shrink: 0;
        }
        .sp-ws-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .sp-ws-section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #8e8e93;
          letter-spacing: 0.08em;
          margin: 0;
        }
        .sp-ws-table-header {
          display: flex;
          padding: 8px 16px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #55555d;
          letter-spacing: 0.08em;
        }
        .sp-ws-table-col-name { flex: 2.5; min-width: 0; }
        .sp-ws-table-col-edited { flex: 1.5; }
        .sp-ws-table-col-pages { flex: 1; text-align: center; }
        .sp-ws-table-col-date { flex: 1; text-align: center; }
        .sp-ws-table-col-action { width: 40px; text-align: right; }

        .sp-ws-row-card {
          display: flex;
          align-items: center;
          padding: 16px;
          background-color: #121214;
          border: 1px solid #1c1c20;
          border-radius: 12px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sp-ws-row-card:hover {
          border-color: rgba(232, 184, 75, 0.25);
          background-color: #16161a;
        }
        .sp-ws-row-name-wrap {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 2.5;
          min-width: 0;
        }
        .sp-ws-row-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background-color: rgba(255, 255, 255, 0.02);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sp-ws-row-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .sp-ws-row-title {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sp-ws-row-subtitle {
          font-size: 12px;
          color: #8e8e93;
          margin: 0;
        }
        .sp-ws-row-edited {
          font-size: 13px;
          color: #efeff1;
          font-weight: 500;
          flex: 1.5;
        }
        .sp-ws-row-badge-wrap {
          flex: 1;
          display: flex;
          justify-content: center;
        }
        .sp-ws-row-badge {
          background: #1c1c20;
          color: #8e8e93;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .sp-ws-row-date {
          font-size: 13px;
          color: #8e8e93;
          font-weight: 500;
          flex: 1;
          text-align: center;
        }
        .sp-ws-row-action {
          width: 40px;
          display: flex;
          justify-content: flex-end;
          position: relative;
        }
        .sp-ws-row-action-btn {
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
        .sp-ws-row-action-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #efeff1;
        }
        .sp-ws-row-avatar-wrap {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 2.5;
          min-width: 0;
        }
        .sp-ws-row-col-email {
          font-size: 13px;
          color: #8e8e93;
          font-weight: 500;
          flex: 1.5;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sp-ws-row-col-role {
          flex: 1;
          display: flex;
          justify-content: center;
        }
        .sp-ws-role-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
        }
        .sp-ws-row-col-joined {
          font-size: 13px;
          color: #8e8e93;
          font-weight: 500;
          flex: 1;
          text-align: center;
        }
        .sp-ws-details-card {
          background: #121214;
          border: 1px solid #1c1c20;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .sp-ws-details-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sp-ws-details-title {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }
        .sp-ws-details-edit-btn {
          background: transparent;
          border: none;
          color: #8e8e93;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sp-ws-details-edit-btn:hover {
          color: #E8B84B;
        }
        .sp-ws-details-divider {
          height: 1px;
          background: #1c1c20;
        }
        .sp-ws-details-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          font-size: 13px;
          font-weight: 500;
        }
        .sp-ws-details-item-lbl {
          color: #8e8e93;
          flex-shrink: 0;
        }
        .sp-ws-details-item-val {
          color: #efeff1;
          font-weight: 600;
          text-align: right;
          word-break: break-word;
          min-width: 0;
        }
        .sp-ws-details-item-val.gold {
          color: #E8B84B;
        }
        .sp-ws-progress-wrap {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sp-ws-progress-bar {
          height: 6px;
          background: #1c1c20;
          border-radius: 4px;
          overflow: hidden;
        }
        .sp-ws-progress-fill {
          height: 100%;
          background-color: #E8B84B;
          border-radius: 4px;
        }

        /* Mobile specific styling inside media query */
        @media (max-width: 768px) {
          .sp-ws-container {
            height: auto;
            overflow-y: auto;
            background-color: #0c0c0e;
          }
          .sp-ws-desktop-layout {
            display: none !important;
          }
          .sp-ws-mobile-layout {
            display: flex;
            flex-direction: column;
            padding: 16px 16px 88px 16px;
            box-sizing: border-box;
            min-height: 100vh;
          }
          .sp-ws-mobile-back-btn {
            background: transparent;
            border: none;
            color: #E8B84B;
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            padding: 0;
            margin-bottom: 16px;
          }
          .sp-ws-mobile-card {
            background: #121214;
            border-radius: 16px;
            border: 1px solid #1c1c20;
            border-top: 3px solid #E8B84B;
            padding: 20px;
            margin-bottom: 24px;
          }
          .sp-ws-mobile-card-title {
            font-size: 24px;
            font-weight: 800;
            color: #fff;
            margin: 0;
            letter-spacing: -0.01em;
          }
          .sp-ws-mobile-card-options-btn {
            background: #1c1c20;
            border: none;
            color: #8e8e93;
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
          .sp-ws-mobile-card-desc {
            font-size: 13px;
            color: #8e8e93;
            margin: 4px 0 8px 0;
          }
          .sp-ws-mobile-card-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #1c1c20;
          }
          .sp-ws-mobile-card-stat {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }
          .sp-ws-mobile-card-stat-val {
            font-size: 16px;
            font-weight: 800;
            color: #E8B84B;
          }
          .sp-ws-mobile-card-stat-lbl {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            color: #8e8e93;
            margin-top: 2px;
          }
          
          /* Tabs mobile */
          .sp-ws-mobile-tabs {
            display: flex;
            border-bottom: 1px solid #1c1c20;
            margin-bottom: 20px;
            gap: 16px;
          }
          .sp-ws-mobile-tab-btn {
            flex: 1;
            background: transparent;
            border: none;
            padding: 12px 0;
            color: #8e8e93;
            font-size: 14px;
            font-weight: 600;
            text-align: center;
            cursor: pointer;
            position: relative;
          }
          .sp-ws-mobile-tab-btn.active {
            color: #E8B84B;
          }
          .sp-ws-mobile-tab-btn.active::after {
            content: "";
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 2px;
            background-color: #E8B84B;
          }
          
          /* File card mobile */
          .sp-ws-mobile-file-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            background-color: #121214;
            border: 1px solid #1c1c20;
            border-radius: 12px;
            margin-bottom: 10px;
            cursor: pointer;
          }
          .sp-ws-mobile-file-title {
            font-size: 14px;
            font-weight: 700;
            color: #fff;
            margin: 0;
          }
          .sp-ws-mobile-file-subtitle {
            font-size: 11px;
            color: #8e8e93;
            margin: 0;
          }
          .sp-ws-mobile-file-badge {
            background: #1c1c20;
            color: #8e8e93;
            font-size: 10px;
            font-weight: 600;
            padding: 3px 6px;
            border-radius: 5px;
            border: 1px solid #232329;
          }
          .sp-ws-mobile-file-date {
            font-size: 11px;
            color: #8e8e93;
          }
          .sp-ws-mobile-file-more-btn {
            background: transparent;
            border: none;
            color: #8e8e93;
            padding: 0;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Collaborator mobile */
          .sp-ws-mobile-collab-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            background-color: #121214;
            border: 1px solid #1c1c20;
            border-radius: 12px;
            margin-bottom: 10px;
          }

          /* Mobile bottom bar */
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
            color: #E8B84B;
          }
          .sp-ws-mobile-nav-fab {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background-color: #E8B84B;
            border: none;
            color: #0f0f11;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(232, 184, 75, 0.3);
            margin-top: -20px;
            transition: all 0.15s ease;
          }
        }
      ` }} />

      {/* ======================================================== */}
      {/* DESKTOP VIEWPORT LAYOUT                                  */}
      {/* ======================================================== */}
      <div className="sp-ws-desktop-layout">
        {/* Top Navigation Header */}
        <header className="sp-ws-header">
          <div className="sp-ws-header-left">
            <div className="sp-ws-logo-wrap" onClick={back}>
              <div className="sp-ws-logo-box">
                {/* Custom inline clapperboard/binder SVG */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f0f11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <path d="M6 6h10" />
                  <path d="M6 10h10" />
                </svg>
              </div>
              <span className="sp-ws-logo-text">WriterDesk</span>
            </div>
            <div style={{ width: 1, height: 16, background: "#1c1c20" }} />
            <div className="sp-ws-breadcrumbs">
              <span>Projects</span>
              <span>/</span>
              <span className="active">{localProject.title}</span>
            </div>
          </div>

          <div className="sp-ws-header-right">
            <button className="sp-ws-btn-share" onClick={() => setShowInviteModal(true)}>
              <Share2 size={14} /> Share
            </button>
            <button className="sp-ws-btn-gold" onClick={addFile}>
              <Plus size={14} /> New Script
            </button>
            <button className="sp-ws-icon-btn" title="Theme selector">
              <Sun size={16} />
            </button>
            <div onClick={() => navigate("/profile")} style={{ cursor: "pointer" }}>
              <Avatar src={user?.avatar} name={user?.name || "User"} size={32} />
            </div>
          </div>
        </header>

        {/* Sidebar + Main content body container */}
        <div className="sp-ws-body">
          {/* Workspace navigation sidebar (Left) */}
          <aside className="sp-ws-sidebar">
            <div>
              <div className="sp-ws-sidebar-section">
                <div className="sp-ws-sidebar-title">WORKSPACE</div>
                <button className="sp-ws-sidebar-item" onClick={back}>
                  <LayoutGrid size={16} /> All Projects
                </button>
                <button className="sp-ws-sidebar-item active">
                  <Folder size={16} /> {localProject.title}
                </button>
                <button className="sp-ws-sidebar-item">
                  <FileText size={16} /> My Scripts
                </button>
                <button className="sp-ws-sidebar-item" onClick={() => navigate("/community")}>
                  <Users size={16} /> Shared With Me
                </button>
              </div>

              <div className="sp-ws-sidebar-section">
                <div className="sp-ws-sidebar-title">RECENT SCRIPTS</div>
                {localProject.files.slice(0, 3).map((f) => (
                  <button key={f.id} className="sp-ws-sidebar-item" onClick={() => openFile(f.id)}>
                    <FileText size={16} /> {f.title}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <button className="sp-ws-sidebar-item" onClick={() => navigate("/explore")} style={{ marginBottom: 4 }}>
                <Search size={16} /> Search
              </button>
              <button className="sp-ws-sidebar-item" onClick={() => navigate("/settings")}>
                <SettingsIcon size={16} /> Settings
              </button>
            </div>
          </aside>

          {/* Scrollable Main Workspace Details Area */}
          <main className="sp-ws-main-scroll">
            <div className="sp-ws-main-grid">
              {/* Main project header stats card */}
              <div className="sp-ws-banner">
                <div className="sp-ws-banner-info">
                  <div className="sp-ws-banner-title-row">
                    <h1 className="sp-ws-banner-title">{localProject.title}</h1>
                    <span
                      className="sp-ws-badge-active"
                      style={{
                        color: localProject.status === "Draft" ? "#60A5FA" : localProject.status === "New" ? "#34D399" : localProject.status === "Empty" ? "#8e8e93" : "#E8B84B",
                        borderColor: localProject.status === "Draft" ? "rgba(96, 165, 250, 0.2)" : localProject.status === "New" ? "rgba(52, 211, 153, 0.2)" : "rgba(142, 142, 147, 0.2)",
                        background: localProject.status === "Draft" ? "rgba(96, 165, 250, 0.08)" : localProject.status === "New" ? "rgba(52, 211, 153, 0.08)" : localProject.status === "Empty" ? "rgba(142, 142, 147, 0.08)" : "rgba(232, 184, 75, 0.08)"
                      }}
                    >
                      {localProject.status || "Active"}
                    </span>
                  </div>
                  <p className="sp-ws-banner-desc">
                    {localProject.type || "Feature Film"}{localProject.genre ? ` • ${localProject.genre}` : ""}
                  </p>

                  {/* Statistics Row */}
                  <div className="sp-ws-banner-stats-row">
                    <div className="sp-ws-banner-stat">
                      <span className="sp-ws-banner-stat-val">{localProject.files.length}</span>
                      <span className="sp-ws-banner-stat-lbl">Scripts</span>
                    </div>
                    <div className="sp-ws-banner-stat">
                      <span className="sp-ws-banner-stat-val">{totalPages}</span>
                      <span className="sp-ws-banner-stat-lbl">Total Pages</span>
                    </div>
                    <div className="sp-ws-banner-stat">
                      <span className="sp-ws-banner-stat-val">{collaborators.length}</span>
                      <span className="sp-ws-banner-stat-lbl">Collaborators</span>
                    </div>
                    <div className="sp-ws-banner-stat">
                      <span className="sp-ws-banner-stat-val">~{estMinutes}</span>
                      <span className="sp-ws-banner-stat-lbl">Est. Minutes</span>
                    </div>
                    <div className="sp-ws-banner-stat">
                      <span className="sp-ws-banner-stat-val">{getLastEditedDate()}</span>
                      <span className="sp-ws-banner-stat-lbl">Last Edited</span>
                    </div>
                  </div>
                </div>

                {/* Banner Right Actions */}
                <div className="sp-ws-banner-actions">
                  <div className="sp-ws-banner-buttons">
                    <button className="sp-ws-btn-share" onClick={() => setShowExport(true)}>
                      <Download size={14} /> Export
                    </button>
                    <button className="sp-ws-btn-gold" onClick={() => setShowEditDetails(true)}>
                      <Edit2 size={14} /> Edit Details
                    </button>
                    <button className="sp-ws-icon-btn" onClick={() => alert("More options clicked")}>
                      <MoreHorizontal size={14} />
                    </button>
                  </div>

                  <div className="sp-ws-avatar-row">
                    <div className="sp-ws-avatar-stack">
                      {collaborators.map((c, idx) => (
                        <Avatar
                          key={c.email}
                          src={c.avatar}
                          name={c.name}
                          size={24}
                          style={{
                            border: "2px solid #121214",
                            marginRight: idx < collaborators.length - 1 ? -6 : 0,
                            zIndex: collaborators.length - idx
                          }}
                        />
                      ))}
                    </div>
                    <span className="sp-ws-avatar-lbl">{collaborators.length} collaborators</span>
                  </div>
                </div>
              </div>

              {/* Tab switch row */}
              <div className="sp-ws-tabs">
                <button
                  className={`sp-ws-tab-btn ${activeTab === "files" ? "active" : ""}`}
                  onClick={() => setActiveTab("files")}
                >
                  Files <span className="sp-ws-tab-badge">{localProject.files.length}</span>
                </button>
                <button
                  className={`sp-ws-tab-btn ${activeTab === "collaborators" ? "active" : ""}`}
                  onClick={() => setActiveTab("collaborators")}
                >
                  Collaborators <span className="sp-ws-tab-badge">{collaborators.length}</span>
                </button>
                <button
                  className={`sp-ws-tab-btn ${activeTab === "settings" ? "active" : ""}`}
                  onClick={() => setActiveTab("settings")}
                >
                  Settings
                </button>
              </div>

              {/* Main Content Layout with Details Sidebar */}
              <div className="sp-ws-columns">
                <div className="sp-ws-col-left">
                  {/* Files block: displayed when Files tab is active */}
                  {activeTab === "files" && (
                    <>
                      <div className="sp-ws-section-header">
                        <h2 className="sp-ws-section-title">ALL FILES</h2>
                        <div style={{ display: "flex", gap: 10 }}>
                          <label className="sp-ws-btn-share" style={{ cursor: "pointer", padding: "6px 12px", borderRadius: 8 }}>
                            Import
                            <input type="file" accept=".fountain,.txt,.md,text/plain" multiple style={{ display: "none" }} onChange={(e) => { importFiles(e.target.files); e.target.value = ""; }} />
                          </label>
                          <button className="sp-ws-btn-share" style={{ padding: "6px 12px", borderRadius: 8 }} onClick={addFile}>
                            <Plus size={14} /> Add File
                          </button>
                        </div>
                      </div>

                      <div className="sp-ws-table-header">
                        <span className="sp-ws-table-col-name">Name</span>
                        <span className="sp-ws-table-col-edited">Last Edited</span>
                        <span className="sp-ws-table-col-pages">Pages</span>
                        <span className="sp-ws-table-col-date">Date</span>
                        <span className="sp-ws-table-col-action" />
                      </div>

                      {localProject.files.length === 0 ? (
                        <p style={{ textAlign: "center", color: "#8e8e93", padding: 48, background: "#121214", borderRadius: 12 }}>No files yet. Click Add File to create one.</p>
                      ) : (
                        localProject.files.map((f) => (
                          <div
                            key={f.id}
                            className="sp-ws-row-card"
                            draggable
                            onDragStart={() => setDragId(f.id)}
                            onDragOver={onDragOver}
                            onDrop={() => onDrop(f.id)}
                            onClick={() => openFile(f.id)}
                          >
                            <div className="sp-ws-row-name-wrap">
                              <div className="sp-ws-row-icon-box">
                                <FileText size={18} color={getFileIconColor(f.title)} />
                              </div>
                              <div className="sp-ws-row-details">
                                <h3 className="sp-ws-row-title">{f.title}</h3>
                                <p className="sp-ws-row-subtitle">{getFileAuthor(f.title)}</p>
                              </div>
                            </div>

                            <span className="sp-ws-row-edited">{getFileFullDate(f.title, f.dateModified)}</span>

                            <div className="sp-ws-row-badge-wrap">
                              <span className="sp-ws-row-badge">{getFilePages(f.title, f.blocks)} pp</span>
                            </div>

                            <span className="sp-ws-row-date">{getFileDate(f.title, f.dateModified)}</span>

                            <div className="sp-ws-row-action" onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === f.id ? null : f.id); }}>
                              <button className="sp-ws-row-action-btn">⋮</button>
                              {openMenu === f.id && (
                                <div className="sp-menu" style={{ right: 0, top: 28 }} onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => { renameFile(f.id); setOpenMenu(null); }}>Rename</button>
                                  <button onClick={() => { duplicateFile(f.id); setOpenMenu(null); }}>Duplicate</button>
                                  <button onClick={() => { deleteFile(f.id); setOpenMenu(null); }} style={{ color: "#ef4444" }}>Delete</button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}

                  {/* Collaborators Block: displayed in BOTH Files and Collaborators tab */}
                  {(activeTab === "collaborators") && (
                    <div>
                      <div className="sp-ws-section-header">
                        <h2 className="sp-ws-section-title">COLLABORATORS</h2>
                        <button className="sp-ws-btn-gold" style={{ padding: "6px 12px", borderRadius: 8 }} onClick={() => setShowInviteModal(true)}>
                          <UserPlus size={14} /> Invite
                        </button>
                      </div>

                      <div className="sp-ws-table-header">
                        <span className="sp-ws-table-col-name">Member</span>
                        <span className="sp-ws-table-col-edited">Email</span>
                        <span className="sp-ws-table-col-pages">Role</span>
                        <span className="sp-ws-table-col-date">Joined</span>
                        <span className="sp-ws-table-col-action" />
                      </div>

                      {collaborators.map((c) => (
                        <div key={c.email} className="sp-ws-row-card" style={{ cursor: "default" }}>
                          <div className="sp-ws-row-avatar-wrap">
                            <Avatar src={c.avatar} name={c.name} size={36} />
                            <div className="sp-ws-row-details">
                              <h3 className="sp-ws-row-title">{c.name}</h3>
                            </div>
                          </div>

                          <span className="sp-ws-row-col-email">{c.email}</span>

                          <div className="sp-ws-row-col-role">
                            <span
                              className="sp-ws-role-badge"
                              style={{ color: c.roleColor, backgroundColor: c.roleBg }}
                            >
                              {c.role}
                            </span>
                          </div>

                          <span className="sp-ws-row-col-joined">{c.joined}</span>

                          <div className="sp-ws-row-action" onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === c.email ? null : c.email); }}>
                            <button className="sp-ws-row-action-btn">⋮</button>
                            {openMenu === c.email && (
                              <div className="sp-menu" style={{ right: 0, top: 28 }} onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => { alert("Changing roles placeholder"); setOpenMenu(null); }}>Change Role</button>
                                <button onClick={() => { handleRemoveCollaborator(c.id); setOpenMenu(null); }} style={{ color: "#ef4444" }}>Remove</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "settings" && (
                    <div style={{ background: "#121214", borderRadius: 16, border: "1px solid #1c1c20", padding: 28 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#fff" }}>Project Settings</h2>
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8e8e93", marginBottom: 6 }}>PROJECT TITLE</label>
                          <input
                            type="text"
                            defaultValue={localProject.title}
                            className="sp-input"
                            style={{ background: "#0c0c0e", border: "1px solid #1c1c20", width: "100%", maxWidth: 400 }}
                            onBlur={(e) => {
                              if (e.target.value.trim()) persist({ ...localProject, title: e.target.value.trim() });
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8e8e93", marginBottom: 6 }}>DESCRIPTION</label>
                          <textarea
                            defaultValue={localProject.description || "Feature Film"}
                            className="sp-input"
                            rows={3}
                            style={{ background: "#0c0c0e", border: "1px solid #1c1c20", width: "100%", maxWidth: 400, resize: "none" }}
                            onBlur={(e) => {
                              persist({ ...localProject, description: e.target.value.trim() });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column details card widget */}
                <div className="sp-ws-col-right">
                  <div className="sp-ws-details-card">
                    <div className="sp-ws-details-title-row">
                      <h3 className="sp-ws-details-title">Project Details</h3>
                      <button className="sp-ws-details-edit-btn" onClick={() => setShowEditDetails(true)} title="Edit Project Details">
                        <Edit2 size={13} />
                      </button>
                    </div>

                    <div className="sp-ws-details-divider" />

                    <div className="sp-ws-details-item">
                      <span className="sp-ws-details-item-lbl">Type</span>
                      <span className="sp-ws-details-item-val">{localProject.type || "Feature Film"}</span>
                    </div>
                    <div className="sp-ws-details-item">
                      <span className="sp-ws-details-item-lbl">Genre</span>
                      <span className="sp-ws-details-item-val">{localProject.genre || "Neo-Noir/Thriller"}</span>
                    </div>
                    <div className="sp-ws-details-item">
                      <span className="sp-ws-details-item-lbl">Created</span>
                      <span className="sp-ws-details-item-val">
                        {new Date(localProject.dateCreated || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <div className="sp-ws-details-item">
                      <span className="sp-ws-details-item-lbl">Status</span>
                      <span className="sp-ws-details-item-val gold" style={{
                        color: localProject.status === "Draft" ? "#60A5FA" : localProject.status === "New" ? "#34D399" : localProject.status === "Empty" ? "#8e8e93" : "#E8B84B"
                      }}>{localProject.status || "Active"}</span>
                    </div>
                    {localProject.description && (
                      <>
                        <div className="sp-ws-details-divider" />
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span className="sp-ws-details-item-lbl" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Description</span>
                          <span style={{ fontSize: 13, color: "#8e8e93", lineHeight: 1.4, wordBreak: "break-word" }}>{localProject.description}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE VIEWPORT LAYOUT                                   */}
      {/* ======================================================== */}
      <div className="sp-ws-mobile-layout">
        {/* Mobile header (Projects back link) */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <button className="sp-ws-mobile-back-btn" onClick={back}>
            <ChevronLeft size={16} /> Projects
          </button>
        </div>

        {/* Mobile Project stats card */}
        <div className="sp-ws-mobile-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
              <h1 className="sp-ws-mobile-card-title">{localProject.title}</h1>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "6px 0" }}>
                <span style={{ fontSize: 10, background: "rgba(255, 255, 255, 0.05)", padding: "2px 8px", borderRadius: 4, color: "#8e8e93", fontWeight: 600 }}>{localProject.type || "Feature Film"}</span>
                {localProject.genre && (
                  <span style={{ fontSize: 10, background: "rgba(255, 255, 255, 0.05)", padding: "2px 8px", borderRadius: 4, color: "#8e8e93", fontWeight: 600 }}>{localProject.genre}</span>
                )}
              </div>
              {localProject.description && <p className="sp-ws-mobile-card-desc" style={{ marginTop: 6, marginBottom: 6 }}>{localProject.description}</p>}
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <span
                  className="sp-ws-badge-active"
                  style={{
                    color: localProject.status === "Draft" ? "#60A5FA" : localProject.status === "New" ? "#34D399" : localProject.status === "Empty" ? "#8e8e93" : "#E8B84B",
                    borderColor: localProject.status === "Draft" ? "rgba(96, 165, 250, 0.2)" : localProject.status === "New" ? "rgba(52, 211, 153, 0.2)" : "rgba(142, 142, 147, 0.2)",
                    background: localProject.status === "Draft" ? "rgba(96, 165, 250, 0.08)" : localProject.status === "New" ? "rgba(52, 211, 153, 0.08)" : localProject.status === "Empty" ? "rgba(142, 142, 147, 0.08)" : "rgba(232, 184, 75, 0.08)"
                  }}
                >
                  {localProject.status || "Active"}
                </span>
              </div>
            </div>
            <button className="sp-ws-mobile-card-options-btn" onClick={() => setShowEditDetails(true)} title="Edit Project Details">
              <Edit2 size={16} />
            </button>
          </div>

          <div className="sp-ws-mobile-card-stats">
            <div className="sp-ws-mobile-card-stat">
              <span className="sp-ws-mobile-card-stat-val">{localProject.files.length}</span>
              <span className="sp-ws-mobile-card-stat-lbl">Scripts</span>
            </div>
            <div className="sp-ws-mobile-card-stat">
              <span className="sp-ws-mobile-card-stat-val">{totalPages}</span>
              <span className="sp-ws-mobile-card-stat-lbl">Pages</span>
            </div>
            <div className="sp-ws-mobile-card-stat">
              <span className="sp-ws-mobile-card-stat-val">{collaborators.length}</span>
              <span className="sp-ws-mobile-card-stat-lbl">Collabs</span>
            </div>
            <div className="sp-ws-mobile-card-stat">
              <span className="sp-ws-mobile-card-stat-val">{getLastEditedDate()}</span>
              <span className="sp-ws-mobile-card-stat-lbl">Last edited</span>
            </div>
          </div>
        </div>

        {/* Mobile Tabs Switch */}
        <div className="sp-ws-mobile-tabs">
          <button
            className={`sp-ws-mobile-tab-btn ${activeTab === "files" ? "active" : ""}`}
            onClick={() => setActiveTab("files")}
          >
            Files
          </button>
          <button
            className={`sp-ws-mobile-tab-btn ${activeTab === "collaborators" ? "active" : ""}`}
            onClick={() => setActiveTab("collaborators")}
          >
            Collaborators
          </button>
          <button
            className={`sp-ws-mobile-tab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>

        {/* Mobile Scroll Content List */}
        <div style={{ flex: 1 }}>
          {/* Files List block */}
          {activeTab === "files" && (
            <>
              <div className="sp-ws-section-header" style={{ marginBottom: 12 }}>
                <h2 className="sp-ws-section-title">ALL FILES</h2>
                <button className="sp-ws-btn-share" style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12 }} onClick={addFile}>
                  <Plus size={12} /> Add File
                </button>
              </div>

              {localProject.files.length === 0 ? (
                <p style={{ textAlign: "center", color: "#8e8e93", padding: 24, background: "#121214", borderRadius: 12 }}>No files yet.</p>
              ) : (
                localProject.files.map((f) => (
                  <div
                    key={f.id}
                    className="sp-ws-mobile-file-card"
                    onClick={() => openFile(f.id)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                      <div className="sp-ws-row-icon-box">
                        <FileText size={18} color={getFileIconColor(f.title)} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                        <h3 className="sp-ws-mobile-file-title">{f.title}</h3>
                        <p className="sp-ws-mobile-file-subtitle">Edited {getFileDate(f.title, f.dateModified)} · {getFileAuthor(f.title)}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span className="sp-ws-mobile-file-badge">{getFilePages(f.title, f.blocks)} pp</span>
                        <span className="sp-ws-mobile-file-date">{getFileDate(f.title, f.dateModified)}</span>
                      </div>
                      <div style={{ position: "relative" }}>
                        <button className="sp-ws-mobile-file-more-btn" onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === f.id ? null : f.id); }}>
                          <MoreVertical size={16} />
                        </button>
                        {openMenu === f.id && (
                          <div className="sp-menu" style={{ right: 0, top: 28 }} onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => { renameFile(f.id); setOpenMenu(null); }}>Rename</button>
                            <button onClick={() => { duplicateFile(f.id); setOpenMenu(null); }}>Duplicate</button>
                            <button onClick={() => { deleteFile(f.id); setOpenMenu(null); }} style={{ color: "#ef4444" }}>Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* Collaborators List block */}
          {activeTab === "collaborators" && (
            <>
              <div className="sp-ws-section-header" style={{ marginBottom: 12 }}>
                <h2 className="sp-ws-section-title">COLLABORATORS</h2>
                <button className="sp-ws-btn-gold" style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12 }} onClick={() => setShowInviteModal(true)}>
                  <UserPlus size={12} /> Invite
                </button>
              </div>

              {collaborators.map((c) => (
                <div key={c.email} className="sp-ws-mobile-collab-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar src={c.avatar} name={c.name} size={36} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <h3 className="sp-ws-mobile-file-title">{c.name}</h3>
                      <p className="sp-ws-mobile-file-subtitle" style={{ fontSize: 10 }}>{c.email}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span className="sp-ws-role-badge" style={{ color: c.roleColor, backgroundColor: c.roleBg, fontSize: 10, padding: "2px 8px" }}>
                        {c.role}
                      </span>
                      <span className="sp-ws-mobile-file-date">Joined {c.joined}</span>
                    </div>
                    <div style={{ position: "relative" }}>
                      <button className="sp-ws-mobile-file-more-btn" onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === c.email ? null : c.email); }}>
                        <MoreVertical size={16} />
                      </button>
                      {openMenu === c.email && (
                        <div className="sp-menu" style={{ right: 0, top: 28 }} onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { alert("Changing roles placeholder"); setOpenMenu(null); }}>Change Role</button>
                          <button onClick={() => { handleRemoveCollaborator(c.id); setOpenMenu(null); }} style={{ color: "#ef4444" }}>Remove</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Settings Tab block */}
          {activeTab === "settings" && (
            <div style={{ background: "#121214", borderRadius: 16, border: "1px solid #1c1c20", padding: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#fff" }}>Project Settings</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8e8e93", marginBottom: 6 }}>PROJECT TITLE</label>
                  <input
                    type="text"
                    defaultValue={localProject.title}
                    className="sp-input"
                    style={{ background: "#0c0c0e", border: "1px solid #1c1c20", width: "100%", boxSizing: "border-box" }}
                    onBlur={(e) => {
                      if (e.target.value.trim()) persist({ ...localProject, title: e.target.value.trim() });
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8e8e93", marginBottom: 6 }}>DESCRIPTION</label>
                  <textarea
                    defaultValue={localProject.description || "Feature Film"}
                    className="sp-input"
                    rows={3}
                    style={{ background: "#0c0c0e", border: "1px solid #1c1c20", width: "100%", boxSizing: "border-box", resize: "none" }}
                    onBlur={(e) => {
                      persist({ ...localProject, description: e.target.value.trim() });
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="sp-ws-mobile-nav">
          <button className="sp-ws-mobile-nav-item" onClick={back}>
            <LayoutGrid size={20} />
            <span>Projects</span>
          </button>
          <button className="sp-ws-mobile-nav-item active">
            <FileText size={20} />
            <span>Scripts</span>
          </button>
          <button className="sp-ws-mobile-nav-fab" onClick={addFile}>
            <Plus size={24} />
          </button>
          <button className="sp-ws-mobile-nav-item" onClick={() => navigate("/explore")}>
            <Search size={20} />
            <span>Explore</span>
          </button>
          <button className="sp-ws-mobile-nav-item" onClick={() => navigate("/profile")}>
            <Avatar src={user?.avatar} name={user?.name || "User"} size={20} />
            <span>Profile</span>
          </button>
        </nav>
      </div>

      {showExport && <ExportModal project={localProject} defaultFileId={null} onClose={() => setShowExport(false)} />}
      {showEditDetails && (
        <EditDetailsModal
          project={localProject}
          onClose={() => setShowEditDetails(false)}
          onSave={(data) => {
            persist({
              ...localProject,
              title: data.title,
              description: data.description,
              type: data.type,
              genre: data.genre,
              status: data.status,
              dateModified: Date.now()
            });
            setShowEditDetails(false);
          }}
        />
      )}
      {showInviteModal && (
        <InviteCollaboratorModal
          projectId={localProject.id}
          onClose={() => setShowInviteModal(false)}
          onInviteSuccess={loadCollaborators}
        />
      )}
    </div>
  );
}

