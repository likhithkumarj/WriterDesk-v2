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
  ChevronLeft, MoreHorizontal, Lightbulb, User, ListCollapse, BookOpen, Bookmark, Trash2, Gauge, CheckSquare
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
  project, back, persist, openFile, user, allProjects = [],
}: {
  project: Project;
  back: () => void;
  persist: (p: Project) => void;
  openFile: (id: string) => void;
  user: { name: string; email: string; avatar: string };
  allProjects?: Project[];
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

  const [selectedFilter, setSelectedFilter] = useState<"all" | "script" | "idea" | "character" | "outline">("all");
  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [newFileType, setNewFileType] = useState<"script" | "idea" | "character" | "outline">("script");
  const [newFileTitle, setNewFileTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "words">("date");

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
            type: f.type || "script",
            status: f.status || "Draft",
            wordCount: f.word_count || 0,
            blocks: f.blocks || [],
            titlePage: f.title_page || undefined,
            content: f.content || "",
            characters: f.characters || [],
            outlineTree: f.outline_tree || [],
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
  const getFilePages = (f: FileDoc) => {
    if (!f.type || f.type === "script") {
      return Math.max(1, paginate(f.blocks || []).length);
    }
    if (f.type === "idea") {
      return Math.max(1, Math.ceil((f.content || "").length / 1500));
    }
    if (f.type === "character") {
      return Math.max(1, Math.ceil((f.characters || []).length / 2));
    }
    if (f.type === "outline") {
      return Math.max(1, Math.ceil((f.outlineTree || []).length / 3));
    }
    return 1;
  };

  const getFileWords = (f: FileDoc) => {
    if (f.wordCount) return f.wordCount;
    if (!f.type || f.type === "script") {
      return (f.blocks || []).reduce((sum, b) => sum + (b.text || "").split(/\s+/).filter(Boolean).length, 0);
    }
    if (f.type === "idea") {
      return (f.content || "").replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
    }
    if (f.type === "character") {
      return (f.characters || []).reduce((sum, char) => {
        return sum + [char.name, char.role, char.personality, char.goals, char.fears, char.motivations, char.backstory, char.relationships, char.actions, char.summary]
          .join(" ").split(/\s+/).filter(Boolean).length;
      }, 0);
    }
    if (f.type === "outline") {
      const sumNodeWords = (node: OutlineNode): number => {
        let count = (node.title || "").split(/\s+/).filter(Boolean).length + (node.content || "").split(/\s+/).filter(Boolean).length;
        if (node.children) {
          count += node.children.reduce((sum, child) => sum + sumNodeWords(child), 0);
        }
        return count;
      };
      return (f.outlineTree || []).reduce((sum, n) => sum + sumNodeWords(n), 0);
    }
    return 0;
  };

  const getFileAuthor = (f: FileDoc) => {
    if (f.title === "Act One Draft") return "Ben Carter";
    if (f.title === "Act Two Outline") return "Sarah Mitchell";
    if (f.title === "Character Bible") return "Marco Rivera";
    return user?.name || "Ben Carter";
  };

  const getFileIconColor = (type: string) => {
    if (type === "script") return "#c084fc"; // Purple
    if (type === "idea") return "#fde047"; // Yellow
    if (type === "character") return "#93c5fd"; // Blue
    if (type === "outline") return "#86efac"; // Green
    return "#E8B84B";
  };

  const getFileDate = (dateModified?: number) => {
    if (dateModified) {
      return new Date(dateModified).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return "Jun 8";
  };

  const getFileFullDate = (dateModified?: number) => {
    if (dateModified) {
      return new Date(dateModified).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return "Jun 8, 2026";
  };

  // Stats Calculations
  const totalPages = localProject.files.reduce((sum, f) => sum + getFilePages(f), 0);
  const totalWords = localProject.files.reduce((sum, f) => sum + getFileWords(f), 0);
  const scriptCount = localProject.files.filter(f => !f.type || f.type === "script").length;
  const ideaCount = localProject.files.filter(f => f.type === "idea").length;
  const characterCount = localProject.files.filter(f => f.type === "character").length;
  const outlineCount = localProject.files.filter(f => f.type === "outline").length;
  const totalFilesCount = localProject.files.length;

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

  // Add File Submit logic from popup modal
  const handleCreateFile = () => {
    if (!newFileTitle.trim()) return;
    const title = newFileTitle.trim();
    let newFile: FileDoc;
    if (newFileType === "script") {
      newFile = {
        id: uid(),
        title,
        type: "script",
        dateModified: Date.now(),
        status: "Draft",
        wordCount: 0,
        blocks: [{ id: uid(), type: "scene", text: "INT. NEW LOCATION - DAY" }],
      };
    } else if (newFileType === "idea") {
      newFile = {
        id: uid(),
        title,
        type: "idea",
        dateModified: Date.now(),
        status: "Draft",
        wordCount: 0,
        blocks: [],
        content: `<h1>${title}</h1><p>Start brainstorming and capturing thoughts here...</p>`,
      };
    } else if (newFileType === "character") {
      newFile = {
        id: uid(),
        title,
        type: "character",
        dateModified: Date.now(),
        status: "Draft",
        wordCount: 0,
        blocks: [],
        characters: [
          {
            id: uid(),
            name: "New Character",
            role: "Protagonist",
            personality: "Driven, mysterious",
            goals: "Reveal the truth",
            fears: "Being trapped",
            motivations: "Personal values",
            backstory: "Unknown beginnings.",
            relationships: "Linked to the main narrative mystery.",
            actions: "Enters the scene.",
            summary: "Brief character summary."
          }
        ]
      };
    } else { // outline
      newFile = {
        id: uid(),
        title,
        type: "outline",
        dateModified: Date.now(),
        status: "Draft",
        wordCount: 0,
        blocks: [],
        outlineTree: [
          {
            id: uid(),
            title: "Act I: Setup",
            type: "act",
            collapsed: false,
            content: "Set the stage, characters, and initial situation.",
            children: [
              {
                id: uid(),
                title: "Sequence A: Introduction",
                type: "sequence",
                collapsed: false,
                content: "Introduce the main players.",
                children: [
                  {
                    id: uid(),
                    title: "First Beat",
                    type: "beat",
                    content: "The story begins here."
                  }
                ]
              }
            ]
          }
        ]
      };
    }

    persist({
      ...localProject,
      dateModified: Date.now(),
      files: [...localProject.files, newFile],
    });

    setShowAddFileModal(false);
    setNewFileTitle("");
    setNewFileType("script");

    // Open file immediately
    openFile(newFile.id);
  };

  const renameFile = (id: string) => {
    const f = localProject.files.find((x) => x.id === id); if (!f) return;
    const t = window.prompt("Rename file", f.title); if (!t) return;
    persist({ ...localProject, files: localProject.files.map((x) => x.id === id ? { ...x, title: t, dateModified: Date.now() } : x) });
  };

  const duplicateFile = (id: string) => {
    const f = localProject.files.find((x) => x.id === id); if (!f) return;
    persist({ ...localProject, files: [...localProject.files, { ...f, id: uid(), title: f.title + " (copy)", dateModified: Date.now(), blocks: f.blocks ? f.blocks.map(b => ({ ...b, id: uid() })) : [], characters: f.characters ? f.characters.map(c => ({ ...c, id: uid() })) : undefined, outlineTree: f.outlineTree ? JSON.parse(JSON.stringify(f.outlineTree)) : undefined }] });
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
            resolve({ id: uid(), title, dateModified: Date.now(), type: "script", blocks: parseFountain(text) });
          };
          r.readAsText(f);
        })
    );
    Promise.all(readers).then((newFiles) => {
      persist({ ...localProject, dateModified: Date.now(), files: [...localProject.files, ...newFiles] });
    });
  };

  // Searching, Filtering and Sorting
  const filteredFiles = localProject.files.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || 
      (selectedFilter === "script" && (!f.type || f.type === "script")) || 
      f.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === "name") {
      return a.title.localeCompare(b.title);
    } else if (sortBy === "words") {
      return getFileWords(b) - getFileWords(a);
    } else { // date
      return b.dateModified - a.dateModified;
    }
  });

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
          background-color: #08080a;
          color: #efeff1;
          font-family: 'Outfit', sans-serif;
        }

        .sp-ws-desktop-layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }
        .sp-ws-mobile-layout {
          display: none;
        }

        .sp-ws-header {
          height: 60px;
          background-color: #0f0f11;
          border-bottom: 1px solid #18181c;
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
          gap: 20px;
        }
        .sp-ws-logo-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }
        .sp-ws-logo-box {
          width: 28px;
          height: 28px;
          background-color: #E8B84B;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0f0f11;
          font-weight: 800;
        }
        .sp-ws-logo-text {
          font-size: 15px;
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
          color: #6c6c74;
        }
        .sp-ws-breadcrumbs span.active {
          color: #efeff1;
          font-weight: 600;
        }
        .sp-ws-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sp-ws-btn-share {
          background: #18181c;
          border: 1px solid #282830;
          color: #efeff1;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sp-ws-btn-share:hover {
          border-color: rgba(232, 184, 75, 0.4);
          color: #fff;
          background: #1d1d22;
        }
        .sp-ws-btn-gold {
          background: #E8B84B;
          border: 1px solid #E8B84B;
          color: #0f0f11;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sp-ws-btn-gold:hover {
          background: #efc464;
          border-color: #efc464;
        }
        .sp-ws-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #282830;
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
          border-right: 1px solid #18181c;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 20px 16px;
          flex-shrink: 0;
        }
        .sp-ws-sidebar-section {
          margin-bottom: 24px;
        }
        .sp-ws-sidebar-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #55555d;
          margin-bottom: 10px;
          padding-left: 12px;
        }
        .sp-ws-sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: #8e8e93;
          font-size: 13px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-bottom: 2px;
        }
        .sp-ws-sidebar-item:hover {
          background: rgba(255, 255, 255, 0.02);
          color: #efeff1;
        }
        .sp-ws-sidebar-item.active {
          background: rgba(232, 184, 75, 0.05);
          color: #E8B84B;
          font-weight: 700;
        }
        .sp-ws-sidebar-item-badge {
          margin-left: auto;
          background: #1c1c20;
          color: #8e8e93;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 4px;
        }
        .sp-ws-sidebar-item.active .sp-ws-sidebar-item-badge {
          background: rgba(232, 184, 75, 0.12);
          color: #E8B84B;
        }
        .sp-ws-main-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 28px 36px;
          background-color: #08080a;
        }
        .sp-ws-main-grid {
          max-width: 1050px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Project Banner Card */
        .sp-ws-banner {
          background: #121214;
          border-radius: 14px;
          border: 1px solid #1c1c20;
          padding: 24px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          position: relative;
        }
        .sp-ws-banner-folder-box {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          background-color: rgba(232, 184, 75, 0.08);
          border: 1px solid rgba(232, 184, 75, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #E8B84B;
          flex-shrink: 0;
        }
        .sp-ws-banner-info-wrap {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          flex: 1;
        }
        .sp-ws-banner-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sp-ws-banner-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .sp-ws-banner-title {
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .sp-ws-tag-pill {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid #232329;
          color: #8e8e93;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .sp-ws-tag-pill.gold {
          background: rgba(232, 184, 75, 0.08);
          border-color: rgba(232, 184, 75, 0.2);
          color: #E8B84B;
        }
        .sp-ws-tag-pill.purple {
          background: rgba(168, 85, 247, 0.08);
          border-color: rgba(168, 85, 247, 0.2);
          color: #c084fc;
        }
        .sp-ws-banner-desc {
          font-size: 13px;
          color: #8e8e93;
          margin: 0;
          line-height: 1.45;
          max-width: 650px;
        }
        .sp-ws-banner-meta-row {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 11.5px;
          color: #6c6c74;
          margin-top: 4px;
        }
        .sp-ws-banner-meta-row span {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sp-ws-banner-actions-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 16px;
          flex-shrink: 0;
        }
        .sp-ws-banner-buttons-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sp-ws-avatar-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sp-ws-avatar-stack {
          display: flex;
          align-items: center;
        }
        .sp-ws-avatar-lbl {
          font-size: 11.5px;
          color: #6c6c74;
          font-weight: 600;
        }

        /* Redesigned Summary Cards Grid */
        .sp-ws-cards-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 14px;
        }
        .sp-ws-summary-card {
          background: #121214;
          border: 1px solid #1c1c20;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: all 0.15s ease;
        }
        .sp-ws-summary-card:hover {
          border-color: rgba(232, 184, 75, 0.2);
          background-color: #16161a;
        }
        .sp-ws-summary-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sp-ws-summary-card-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sp-ws-summary-card-val {
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          margin: 0;
          line-height: 1;
        }
        .sp-ws-summary-card-lbl {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #6c6c74;
          letter-spacing: 0.05em;
        }

        /* Files Section with filters */
        .sp-ws-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .sp-ws-section-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #18181c;
          padding-bottom: 10px;
        }
        .sp-ws-filter-tabs {
          display: flex;
          gap: 6px;
        }
        .sp-ws-filter-tab {
          background: transparent;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          color: #8e8e93;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sp-ws-filter-tab:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.02);
        }
        .sp-ws-filter-tab.active {
          background: #18181c;
          color: #fff;
          border: 1px solid #282830;
        }
        .sp-ws-right-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Files Redesigned Table styling */
        .sp-ws-table {
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        .sp-ws-th-row {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          color: #6c6c74;
          letter-spacing: 0.08em;
          border-bottom: 1px solid #18181c;
          margin-bottom: 8px;
        }
        .sp-ws-col-checkbox { width: 40px; display: flex; align-items: center; }
        .sp-ws-col-filename { flex: 2.2; min-width: 0; display: flex; align-items: center; gap: 12px; }
        .sp-ws-col-type { width: 120px; display: flex; justify-content: flex-start; }
        .sp-ws-col-status { width: 120px; display: flex; justify-content: flex-start; }
        .sp-ws-col-words { width: 110px; text-align: right; }
        .sp-ws-col-modified { width: 140px; text-align: right; }
        .sp-ws-col-author { width: 80px; display: flex; justify-content: flex-end; }
        .sp-ws-col-more { width: 40px; display: flex; justify-content: flex-end; }

        .sp-ws-td-row {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background: #121214;
          border: 1px solid #1c1c20;
          border-radius: 10px;
          margin-bottom: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sp-ws-td-row:hover {
          border-color: rgba(232, 184, 75, 0.25);
          background-color: #16161a;
        }
        .sp-ws-td-row-selected {
          border-color: #E8B84B;
          background-color: rgba(232, 184, 75, 0.01);
        }
        .sp-ws-file-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 2px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sp-ws-file-subtitle {
          font-size: 11px;
          color: #6c6c74;
          margin: 0;
        }
        .sp-ws-badge-type {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: capitalize;
        }
        .sp-ws-badge-status {
          font-size: 10.5px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .sp-ws-badge-status.draft { background: rgba(142, 142, 147, 0.08); color: #8e8e93; border: 1px solid rgba(142, 142, 147, 0.15); }
        .sp-ws-badge-status.review { background: rgba(245, 158, 11, 0.08); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.15); }
        .sp-ws-badge-status.final { background: rgba(34, 197, 94, 0.08); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.15); }

        .sp-ws-sidebar-meter-box {
          background-color: #121214;
          border: 1px solid #1c1c20;
          border-radius: 8px;
          padding: 12px;
          margin-top: 16px;
        }
        .sp-ws-meter-title {
          font-size: 11px;
          font-weight: 700;
          color: #8e8e93;
          margin-bottom: 6px;
          display: block;
        }
        .sp-ws-meter-bar-outer {
          height: 5px;
          background-color: #1c1c20;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 6px;
        }
        .sp-ws-meter-bar-inner {
          height: 100%;
          background-color: #E8B84B;
        }
        .sp-ws-meter-lbl {
          font-size: 10px;
          color: #6c6c74;
          display: block;
        }

        /* Modal card layout popup custom styling */
        .sp-newfile-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sp-newfile-modal {
          background: #0f0f11;
          border: 1px solid #282830;
          border-radius: 16px;
          width: 520px;
          padding: 24px;
          box-shadow: 0 24px 48px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .sp-newfile-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sp-newfile-modal-title {
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          margin: 0;
        }
        .sp-newfile-modal-subtitle {
          font-size: 12px;
          color: #8e8e93;
          margin: 4px 0 0 0;
        }
        .sp-newfile-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .sp-newfile-type-card {
          background: #18181c;
          border: 1px solid #282830;
          border-radius: 10px;
          padding: 16px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.15s ease;
          position: relative;
        }
        .sp-newfile-type-card:hover {
          border-color: rgba(232, 184, 75, 0.3);
          background: #1d1d22;
        }
        .sp-newfile-type-card.selected {
          border-color: #E8B84B;
          background: rgba(232, 184, 75, 0.02);
        }
        .sp-newfile-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sp-newfile-card-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sp-newfile-card-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }
        .sp-newfile-card-desc {
          font-size: 11.5px;
          color: #8e8e93;
          margin: 0;
          line-height: 1.4;
        }
        .sp-newfile-checkmark-badge {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #E8B84B;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0f0f11;
        }
        .sp-newfile-checkmark-placeholder {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 1.5px solid #282830;
        }

        /* Mobile Viewport Responsive Styles overrides */
        @media (max-width: 767px) {
          .sp-ws-desktop-layout {
            display: none !important;
          }
          .sp-ws-mobile-layout {
            display: flex !important;
            flex-direction: column;
            min-height: 100vh;
            background-color: #08080a;
            padding: 16px;
            box-sizing: border-box;
            padding-bottom: 80px;
          }
          .sp-ws-mobile-back-btn {
            background: transparent;
            border: none;
            color: #E8B84B;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            padding: 0;
          }
          .sp-ws-mobile-card {
            background: #121214;
            border: 1px solid #1c1c20;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .sp-ws-mobile-card-title {
            font-size: 18px;
            font-weight: 800;
            color: #fff;
            margin: 0;
          }
          .sp-ws-mobile-card-desc {
            font-size: 12px;
            color: #8e8e93;
            line-height: 1.4;
            margin: 0;
          }
          .sp-ws-mobile-card-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            border-top: 1px solid #1c1c20;
            padding-top: 12px;
            margin-top: 4px;
          }
          .sp-ws-mobile-card-stat {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .sp-ws-mobile-card-stat-val {
            font-size: 13px;
            font-weight: 700;
            color: #fff;
          }
          .sp-ws-mobile-card-stat-lbl {
            font-size: 9px;
            color: #6c6c74;
            text-transform: uppercase;
            font-weight: 600;
            margin-top: 2px;
          }
          .sp-ws-mobile-tabs {
            display: flex;
            background: #121214;
            border: 1px solid #1c1c20;
            padding: 3px;
            border-radius: 10px;
            margin-bottom: 16px;
          }
          .sp-ws-mobile-tab-btn {
            flex: 1;
            text-align: center;
            background: transparent;
            border: none;
            padding: 8px;
            border-radius: 8px;
            color: #8e8e93;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .sp-ws-mobile-tab-btn.active {
            background: #1c1c20;
            color: #fff;
            border: 1px solid #282830;
          }
          .sp-ws-mobile-file-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #121214;
            border: 1px solid #1c1c20;
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .sp-ws-mobile-file-card:hover {
            border-color: rgba(232, 184, 75, 0.2);
            background: #151518;
          }
          .sp-ws-mobile-file-title {
            font-size: 13.5px;
            font-weight: 700;
            color: #fff;
            margin: 0;
          }
          .sp-ws-mobile-file-subtitle {
            font-size: 11px;
            color: #6c6c74;
            margin: 0;
          }
          .sp-ws-mobile-file-badge {
            font-size: 9px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid #232329;
            color: #8e8e93;
            padding: 1px 5px;
            border-radius: 4px;
            font-weight: 600;
          }
          .sp-ws-mobile-file-date {
            font-size: 10px;
            color: #6c6c74;
          }
          .sp-ws-mobile-file-more-btn {
            background: transparent;
            border: none;
            color: #6c6c74;
            padding: 6px;
            cursor: pointer;
          }
          .sp-ws-mobile-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: #0f0f11;
            border-top: 1px solid #18181c;
            display: flex;
            align-items: center;
            justify-content: space-around;
            z-index: 999;
          }
          .sp-ws-mobile-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            background: transparent;
            border: none;
            color: #6c6c74;
            font-size: 9px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            width: 60px;
          }
          .sp-ws-mobile-nav-item.active {
            color: #E8B84B;
          }
          .sp-ws-mobile-nav-fab {
            width: 46px;
            height: 46px;
            border-radius: 50%;
            background: #E8B84B;
            border: none;
            color: #0f0f11;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(232, 184, 75, 0.3);
            transform: translateY(-14px);
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .sp-ws-mobile-nav-fab:hover {
            background: #efc464;
            transform: translateY(-15px) scale(1.05);
          }
          .sp-ws-mobile-collab-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #121214;
            border: 1px solid #1c1c20;
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 8px;
          }
          .sp-ws-role-badge {
            font-size: 9px;
            font-weight: 700;
            padding: 1px 6px;
            border-radius: 4px;
            text-transform: uppercase;
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
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f0f11" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <path d="M6 6h10" />
                  <path d="M6 10h10" />
                </svg>
              </div>
              <span className="sp-ws-logo-text">WriterDesk</span>
            </div>
            <div style={{ width: 1, height: 16, background: "#282830" }} />
            <div className="sp-ws-breadcrumbs">
              <span>Projects</span>
              <span>/</span>
              <span className="active">{localProject.title}</span>
            </div>
          </div>

          <div className="sp-ws-header-right">
            <button className="sp-ws-btn-share" onClick={() => setShowInviteModal(true)}>
              <Share2 size={13} /> Share
            </button>
            <button className="sp-ws-btn-gold" onClick={() => {
              setNewFileType("script");
              setNewFileTitle("");
              setShowAddFileModal(true);
            }}>
              <Plus size={13} /> New File
            </button>
            <div onClick={() => navigate("/profile")} style={{ cursor: "pointer", marginLeft: 4 }}>
              <Avatar src={user?.avatar} name={user?.name || "User"} size={28} />
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
                  <LayoutGrid size={15} /> Dashboard
                </button>
                <button className="sp-ws-sidebar-item active">
                  <Folder size={15} /> All Projects <span className="sp-ws-sidebar-item-badge">{allProjects.length || 1}</span>
                </button>
                <button className="sp-ws-sidebar-item">
                  <Bookmark size={15} /> Bookmarks
                </button>
                <button className="sp-ws-sidebar-item">
                  <Trash2 size={15} /> Trash
                </button>
              </div>

              <div className="sp-ws-sidebar-section">
                <div className="sp-ws-sidebar-title">PROJECTS</div>
                {allProjects.map((p) => {
                  const isActive = p.id === localProject.id;
                  return (
                    <button 
                      key={p.id} 
                      className={`sp-ws-sidebar-item ${isActive ? "active" : ""}`}
                      onClick={() => {
                        if (!isActive) navigate(`/project/${p.id}`);
                      }}
                    >
                      <Folder size={15} style={{ color: isActive ? "#E8B84B" : "#8e8e93" }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{p.title}</span>
                      <span className="sp-ws-sidebar-item-badge">{p.files.length}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="sp-ws-sidebar-meter-box">
                <span className="sp-ws-meter-title">Storage Limit</span>
                <div className="sp-ws-meter-bar-outer">
                  <div className="sp-ws-meter-bar-inner" style={{ width: "68%" }} />
                </div>
                <span className="sp-ws-meter-lbl">3.4 GB of 5 GB used (68%)</span>
              </div>
              <button className="sp-ws-sidebar-item" onClick={() => navigate("/settings")} style={{ marginTop: 12 }}>
                <SettingsIcon size={15} /> Settings
              </button>
            </div>
          </aside>

          {/* Scrollable Main Workspace Details Area */}
          <main className="sp-ws-main-scroll">
            <div className="sp-ws-main-grid">
              {/* Main project header stats card */}
              <div className="sp-ws-banner">
                <div className="sp-ws-banner-info-wrap">
                  <div className="sp-ws-banner-folder-box">
                    <Folder size={26} />
                  </div>
                  <div className="sp-ws-banner-info">
                    <div className="sp-ws-banner-title-row">
                      <h1 className="sp-ws-banner-title">{localProject.title}</h1>
                      <span className="sp-ws-tag-pill gold">{localProject.status || "Draft"}</span>
                      {localProject.genre && <span className="sp-ws-tag-pill">{localProject.genre}</span>}
                      {localProject.type && <span className="sp-ws-tag-pill purple">{localProject.type}</span>}
                    </div>
                    <p className="sp-ws-banner-desc">
                      {localProject.description || "A screenplay writing draft project inside WriterDesk workspace."}
                    </p>
                    <div className="sp-ws-banner-meta-row">
                      <span>Created: {new Date(localProject.dateCreated || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span>•</span>
                      <span>Updated: {getLastEditedDate()} ago</span>
                      <span>•</span>
                      <span>{localProject.files.length} files</span>
                      <span>•</span>
                      <span>~{totalWords.toLocaleString()} words</span>
                    </div>
                  </div>
                </div>

                {/* Banner Right Actions */}
                <div className="sp-ws-banner-actions-col">
                  <div className="sp-ws-banner-buttons-row">
                    <button className="sp-ws-btn-gold" style={{ display: "flex", gap: 6 }} onClick={() => {
                      const firstFile = localProject.files[0];
                      if (firstFile) openFile(firstFile.id);
                      else alert("Create a file first!");
                    }}>
                      <Edit2 size={13} /> Open Editor
                    </button>
                    <button className="sp-ws-btn-share" onClick={() => setShowInviteModal(true)}>
                      <Users size={13} /> Share
                    </button>
                    <button className="sp-ws-icon-btn" onClick={() => setShowEditDetails(true)} title="Edit details">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>

                  <div className="sp-ws-avatar-row">
                    <div className="sp-ws-avatar-stack">
                      {collaborators.slice(0, 3).map((c, idx) => (
                        <Avatar
                          key={c.email}
                          src={c.avatar}
                          name={c.name}
                          size={22}
                          style={{
                            border: "2px solid #121214",
                            marginRight: idx < collaborators.length - 1 ? -5 : 0,
                            zIndex: collaborators.length - idx
                          }}
                        />
                      ))}
                    </div>
                    <span className="sp-ws-avatar-lbl">{collaborators.length} collaborators</span>
                  </div>
                </div>
              </div>

              {/* Redesigned summary statistics cards row */}
              <div className="sp-ws-cards-grid">
                <div className="sp-ws-summary-card">
                  <div className="sp-ws-summary-card-header">
                    <div className="sp-ws-summary-card-icon-box" style={{ background: "rgba(168, 85, 247, 0.12)", color: "#c084fc" }}>
                      <FileText size={16} />
                    </div>
                    <span className="sp-ws-summary-card-val">{scriptCount}</span>
                  </div>
                  <span className="sp-ws-summary-card-lbl">Scripts</span>
                </div>

                <div className="sp-ws-summary-card">
                  <div className="sp-ws-summary-card-header">
                    <div className="sp-ws-summary-card-icon-box" style={{ background: "rgba(234, 179, 8, 0.12)", color: "#fde047" }}>
                      <Lightbulb size={16} />
                    </div>
                    <span className="sp-ws-summary-card-val">{ideaCount}</span>
                  </div>
                  <span className="sp-ws-summary-card-lbl">Ideas</span>
                </div>

                <div className="sp-ws-summary-card">
                  <div className="sp-ws-summary-card-header">
                    <div className="sp-ws-summary-card-icon-box" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#93c5fd" }}>
                      <User size={16} />
                    </div>
                    <span className="sp-ws-summary-card-val">{characterCount}</span>
                  </div>
                  <span className="sp-ws-summary-card-lbl">Characters</span>
                </div>

                <div className="sp-ws-summary-card">
                  <div className="sp-ws-summary-card-header">
                    <div className="sp-ws-summary-card-icon-box" style={{ background: "rgba(34, 197, 94, 0.12)", color: "#86efac" }}>
                      <ListCollapse size={16} />
                    </div>
                    <span className="sp-ws-summary-card-val">{outlineCount}</span>
                  </div>
                  <span className="sp-ws-summary-card-lbl">Outlines</span>
                </div>

                <div className="sp-ws-summary-card">
                  <div className="sp-ws-summary-card-header">
                    <div className="sp-ws-summary-card-icon-box" style={{ background: "rgba(236, 72, 153, 0.12)", color: "#fbcfe8" }}>
                      <BookOpen size={16} />
                    </div>
                    <span className="sp-ws-summary-card-val">3</span>
                  </div>
                  <span className="sp-ws-summary-card-lbl">Research</span>
                </div>

                <div className="sp-ws-summary-card">
                  <div className="sp-ws-summary-card-header">
                    <div className="sp-ws-summary-card-icon-box" style={{ background: "rgba(255, 255, 255, 0.05)", color: "#fff" }}>
                      <Folder size={16} />
                    </div>
                    <span className="sp-ws-summary-card-val">{totalFilesCount}</span>
                  </div>
                  <span className="sp-ws-summary-card-lbl">Total</span>
                </div>
              </div>

              {/* Main Content Layout with Details Sidebar */}
              <div className="sp-ws-section">
                {/* Control bar */}
                <div className="sp-ws-section-controls">
                  <div className="sp-ws-filter-tabs">
                    <button 
                      className={`sp-ws-filter-tab ${selectedFilter === "all" ? "active" : ""}`}
                      onClick={() => setSelectedFilter("all")}
                    >
                      All
                    </button>
                    <button 
                      className={`sp-ws-filter-tab ${selectedFilter === "script" ? "active" : ""}`}
                      onClick={() => setSelectedFilter("script")}
                    >
                      Scripts
                    </button>
                    <button 
                      className={`sp-ws-filter-tab ${selectedFilter === "idea" ? "active" : ""}`}
                      onClick={() => setSelectedFilter("idea")}
                    >
                      Ideas
                    </button>
                    <button 
                      className={`sp-ws-filter-tab ${selectedFilter === "character" ? "active" : ""}`}
                      onClick={() => setSelectedFilter("character")}
                    >
                      Characters
                    </button>
                    <button 
                      className={`sp-ws-filter-tab ${selectedFilter === "outline" ? "active" : ""}`}
                      onClick={() => setSelectedFilter("outline")}
                    >
                      Outlines
                    </button>
                  </div>

                  <div className="sp-ws-right-controls">
                    {/* Search bar inside section */}
                    <div style={{ position: "relative" }}>
                      <Search size={13} style={{ position: "absolute", left: 10, top: 10, color: "#6c6c74" }} />
                      <input 
                        className="sp-input"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: 30, height: 32, fontSize: 12, width: 180, background: "#0f0f11", border: "1px solid #18181c" }}
                      />
                    </div>
                    {/* Sort selector */}
                    <select
                      className="sp-input"
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      style={{ height: 32, fontSize: 12, background: "#0f0f11", border: "1px solid #18181c", color: "#8e8e93", padding: "0 8px", cursor: "pointer" }}
                    >
                      <option value="date">Sort by: Date</option>
                      <option value="name">Sort by: Name</option>
                      <option value="words">Sort by: Words</option>
                    </select>
                    {/* Import / Create buttons */}
                    <label className="sp-ws-btn-share" style={{ cursor: "pointer", height: 32, boxSizing: "border-box", display: "flex", alignItems: "center", padding: "0 12px" }}>
                      Import
                      <input type="file" accept=".fountain,.txt,.md,text/plain" multiple style={{ display: "none" }} onChange={(e) => { importFiles(e.target.files); e.target.value = ""; }} />
                    </label>
                    <button className="sp-ws-btn-gold" style={{ height: 32, display: "flex", alignItems: "center" }} onClick={() => {
                      setNewFileType("script");
                      setNewFileTitle("");
                      setShowAddFileModal(true);
                    }}>
                      <Plus size={13} /> New File
                    </button>
                  </div>
                </div>

                {/* Redesigned Files Table */}
                <div className="sp-ws-table">
                  <div className="sp-ws-th-row">
                    <span className="sp-ws-col-checkbox"><input type="checkbox" readOnly checked={false} style={{ cursor: "pointer" }} /></span>
                    <span className="sp-ws-col-filename">File Name</span>
                    <span className="sp-ws-col-type">Type</span>
                    <span className="sp-ws-col-status">Status</span>
                    <span className="sp-ws-col-words">Words</span>
                    <span className="sp-ws-col-modified">Modified</span>
                    <span className="sp-ws-col-author">Author</span>
                    <span className="sp-ws-col-more" />
                  </div>

                  {sortedFiles.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#8e8e93", padding: 48, background: "#121214", borderRadius: 12, border: "1px dashed #282830" }}>
                      No files match the filters. Click New File to add one.
                    </p>
                  ) : (
                    sortedFiles.map((f) => {
                      const displayType = f.type || "script";
                      const displayStatus = f.status || "Draft";
                      const displayWords = getFileWords(f);
                      const fileAuthor = getFileAuthor(f);
                      const fileIconColor = getFileIconColor(displayType);

                      return (
                        <div
                          key={f.id}
                          className="sp-ws-td-row"
                          onClick={() => openFile(f.id)}
                        >
                          <div className="sp-ws-col-checkbox" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" readOnly checked={false} style={{ cursor: "pointer" }} />
                          </div>
                          
                          <div className="sp-ws-col-filename">
                            <div className="sp-ws-row-icon-box" style={{ background: `rgba(255, 255, 255, 0.01)` }}>
                              {displayType === "script" && <FileText size={15} color={fileIconColor} />}
                              {displayType === "idea" && <Lightbulb size={15} color={fileIconColor} />}
                              {displayType === "character" && <User size={15} color={fileIconColor} />}
                              {displayType === "outline" && <ListCollapse size={15} color={fileIconColor} />}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <h3 className="sp-ws-file-title">{f.title}</h3>
                              <p className="sp-ws-file-subtitle">{fileAuthor}</p>
                            </div>
                          </div>

                          <div className="sp-ws-col-type">
                            <span 
                              className="sp-ws-badge-type" 
                              style={{ 
                                background: displayType === "script" ? "rgba(168, 85, 247, 0.12)" : displayType === "idea" ? "rgba(234, 179, 8, 0.12)" : displayType === "character" ? "rgba(59, 130, 246, 0.12)" : "rgba(34, 197, 94, 0.12)",
                                color: fileIconColor
                              }}
                            >
                              {displayType}
                            </span>
                          </div>

                          <div className="sp-ws-col-status">
                            <span className={`sp-ws-badge-status ${displayStatus.toLowerCase()}`}>
                              {displayStatus}
                            </span>
                          </div>

                          <span className="sp-ws-col-words" style={{ fontSize: 13, fontWeight: 600, color: "#efeff1" }}>
                            {displayWords.toLocaleString()}
                          </span>

                          <span className="sp-ws-col-modified" style={{ fontSize: 13, color: "#8e8e93" }}>
                            {getFileDate(f.dateModified)}
                          </span>

                          <div className="sp-ws-col-author">
                            <Avatar src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${fileAuthor}`} name={fileAuthor} size={22} />
                          </div>

                          <div className="sp-ws-col-more" onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === f.id ? null : f.id); }}>
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
                      );
                      })
                    )}
                  </div>

                  <div className="sp-ws-details-panel">
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
                <button className="sp-ws-btn-share" style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12 }} onClick={() => {
                  setNewFileType("script");
                  setNewFileTitle("");
                  setShowAddFileModal(true);
                }}>
                  <Plus size={12} /> Add File
                </button>
              </div>

              {localProject.files.length === 0 ? (
                <p style={{ textAlign: "center", color: "#8e8e93", padding: 24, background: "#121214", borderRadius: 12 }}>No files yet.</p>
              ) : (
                localProject.files.map((f) => {
                  const displayType = f.type || "script";
                  const displayStatus = f.status || "Draft";
                  const displayWords = getFileWords(f);
                  const fileAuthor = getFileAuthor(f);
                  const fileIconColor = getFileIconColor(displayType);
                  const fileDate = getFileDate(f.dateModified);
                  const filePages = getFilePages(f);

                  return (
                    <div
                      key={f.id}
                      className="sp-ws-mobile-file-card"
                      onClick={() => openFile(f.id)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                        <div className="sp-ws-row-icon-box" style={{ background: `rgba(255, 255, 255, 0.01)` }}>
                          {displayType === "script" && <FileText size={16} color={fileIconColor} />}
                          {displayType === "idea" && <Lightbulb size={16} color={fileIconColor} />}
                          {displayType === "character" && <User size={16} color={fileIconColor} />}
                          {displayType === "outline" && <ListCollapse size={16} color={fileIconColor} />}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                          <h3 className="sp-ws-mobile-file-title" style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.title}</h3>
                          <p className="sp-ws-mobile-file-subtitle" style={{ fontSize: 11, color: "#6c6c74", margin: 0 }}>
                            {displayType} · {displayStatus} · {fileAuthor}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                          <span className="sp-ws-mobile-file-badge" style={{ fontSize: 10, background: "#1c1c20", color: "#8e8e93", padding: "1px 5px", borderRadius: 4, fontWeight: 600 }}>
                            {filePages} pp
                          </span>
                          <span className="sp-ws-mobile-file-date" style={{ fontSize: 10, color: "#6c6c74" }}>{fileDate}</span>
                        </div>
                        <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                          <button className="sp-ws-mobile-file-more-btn" onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === f.id ? null : f.id); }} style={{ background: "transparent", border: "none", color: "#8e8e93", cursor: "pointer", padding: 4 }}>
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
                  );
                })
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
          <button className="sp-ws-mobile-nav-fab" onClick={() => {
            setNewFileType("script");
            setNewFileTitle("");
            setShowAddFileModal(true);
          }}>
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

      {/* Redesigned Add File Modal Popup */}
      {showAddFileModal && (
        <div className="sp-newfile-modal-backdrop" onClick={() => setShowAddFileModal(false)}>
          <div className="sp-newfile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sp-newfile-modal-header">
              <div>
                <h3 className="sp-newfile-modal-title">Add file</h3>
                <p className="sp-newfile-modal-subtitle">Choose a file type for this project</p>
              </div>
              <button 
                onClick={() => setShowAddFileModal(false)}
                style={{ background: "transparent", border: "none", color: "#8e8e93", fontSize: 18, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div className="sp-newfile-cards-grid">
              {/* Script selector */}
              <div 
                className={`sp-newfile-type-card ${newFileType === "script" ? "selected" : ""}`}
                onClick={() => setNewFileType("script")}
              >
                <div className="sp-newfile-card-header">
                  <div className="sp-newfile-card-icon" style={{ background: "rgba(168, 85, 247, 0.12)", color: "#c084fc" }}>
                    <FileText size={16} />
                  </div>
                  {newFileType === "script" ? (
                    <div className="sp-newfile-checkmark-badge">✓</div>
                  ) : (
                    <div className="sp-newfile-checkmark-placeholder" />
                  )}
                </div>
                <div>
                  <h4 className="sp-newfile-card-title">Script</h4>
                  <p className="sp-newfile-card-desc">Full screenplay editor with automatic layout margins.</p>
                </div>
              </div>

              {/* Idea selector */}
              <div 
                className={`sp-newfile-type-card ${newFileType === "idea" ? "selected" : ""}`}
                onClick={() => setNewFileType("idea")}
              >
                <div className="sp-newfile-card-header">
                  <div className="sp-newfile-card-icon" style={{ background: "rgba(234, 179, 8, 0.12)", color: "#fde047" }}>
                    <Lightbulb size={16} />
                  </div>
                  {newFileType === "idea" ? (
                    <div className="sp-newfile-checkmark-badge">✓</div>
                  ) : (
                    <div className="sp-newfile-checkmark-placeholder" />
                  )}
                </div>
                <div>
                  <h4 className="sp-newfile-card-title">Idea</h4>
                  <p className="sp-newfile-card-desc">Logline, tags, free notes and structured details brainstorming.</p>
                </div>
              </div>

              {/* Outline selector */}
              <div 
                className={`sp-newfile-type-card ${newFileType === "outline" ? "selected" : ""}`}
                onClick={() => setNewFileType("outline")}
              >
                <div className="sp-newfile-card-header">
                  <div className="sp-newfile-card-icon" style={{ background: "rgba(34, 197, 94, 0.12)", color: "#86efac" }}>
                    <ListCollapse size={16} />
                  </div>
                  {newFileType === "outline" ? (
                    <div className="sp-newfile-checkmark-badge">✓</div>
                  ) : (
                    <div className="sp-newfile-checkmark-placeholder" />
                  )}
                </div>
                <div>
                  <h4 className="sp-newfile-card-title">Outline</h4>
                  <p className="sp-newfile-card-desc">Beat sheet, hierarchical acts planning, and collapsible tree.</p>
                </div>
              </div>

              {/* Character selector */}
              <div 
                className={`sp-newfile-type-card ${newFileType === "character" ? "selected" : ""}`}
                onClick={() => setNewFileType("character")}
              >
                <div className="sp-newfile-card-header">
                  <div className="sp-newfile-card-icon" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#93c5fd" }}>
                    <User size={16} />
                  </div>
                  {newFileType === "character" ? (
                    <div className="sp-newfile-checkmark-badge">✓</div>
                  ) : (
                    <div className="sp-newfile-checkmark-placeholder" />
                  )}
                </div>
                <div>
                  <h4 className="sp-newfile-card-title">Character</h4>
                  <p className="sp-newfile-card-desc">Arc, goals, fears, relationships, and motivation grid details.</p>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93", letterSpacing: "0.05em" }}>File Name</label>
              <input 
                className="sp-input"
                placeholder="e.g. Act One Draft or Cole Profile"
                value={newFileTitle}
                onChange={(e) => setNewFileTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFile();
                }}
                autoFocus
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <button 
                className="sp-btn" 
                onClick={() => setShowAddFileModal(false)}
                style={{ padding: "8px 16px" }}
              >
                Cancel
              </button>
              <button 
                className="sp-btn sp-btn-primary" 
                onClick={handleCreateFile}
                disabled={!newFileTitle.trim()}
                style={{ padding: "8px 16px" }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilesScreen;

