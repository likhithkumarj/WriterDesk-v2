import React, { useState, useEffect } from "react";
import { Project, Store } from "../../types/screenplay";
import { uid } from "../../utils/uid";
import { NewProjectModal } from "../modals/NewProjectModal";
import { ShareModal } from "../modals/ShareModal";
import { supabase } from "../../utils/supabaseClient";

export function ProjectsScreen({
  store, persist, openProject, user, onLogout,
}: { 
  store: Store; 
  persist: (s: Store) => void; 
  openProject: (id: string) => void;
  user?: { name: string; email: string; avatar: string };
  onLogout?: () => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [shareProjectId, setShareProjectId] = useState<string | null>(null);
  const [shareProjectTitle, setShareProjectTitle] = useState("");

  const isSupabaseConfigured = () => {
    const url = import.meta.env.VITE_SUPABASE_URL || "";
    return url && !url.includes("placeholder-project");
  };

  const loadPendingInvites = async () => {
    if (!isSupabaseConfigured() || !user?.email) return;
    try {
      const { data, error } = await supabase
        .from("collaborators")
        .select(`
          id,
          project_id,
          projects (
            title,
            user_id
          )
        `)
        .eq("invited_email", user.email.toLowerCase())
        .eq("status", "pending");

      if (!error && data) {
        setPendingInvites(data);
      }
    } catch (err) {
      console.error("Error loading pending invites:", err);
    }
  };

  useEffect(() => {
    loadPendingInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const acceptInvite = async (inviteId: string) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData.user?.id;

      const { error } = await supabase
        .from("collaborators")
        .update({ status: "accepted", user_id: currentUserId })
        .eq("id", inviteId);

      if (error) throw error;

      alert("Collaboration invite accepted!");
      window.location.reload();
    } catch (err: any) {
      alert("Error accepting invite: " + err.message);
    }
  };

  const declineInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("collaborators")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;

      setPendingInvites(pendingInvites.filter((i) => i.id !== inviteId));
      alert("Invitation declined.");
    } catch (err: any) {
      alert("Error declining invite: " + err.message);
    }
  };

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
      {/* Top Header with Profile */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--sp-border)", paddingBottom: 16, marginBottom: 32, gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em" }}>Screenplay</h1>
        </div>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img 
              src={user.avatar} 
              alt={user.name} 
              style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--sp-border)", border: "1px solid var(--sp-border)" }}
            />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</span>
              <span style={{ fontSize: 11, color: "var(--sp-muted)" }}>{user.email}</span>
            </div>
            {onLogout && (
              <button 
                onClick={onLogout} 
                className="sp-btn" 
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                Log Out
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pending Invites Alert List */}
      {pendingInvites.length > 0 && (
        <div style={{ marginBottom: 24, padding: "16px 20px", borderRadius: 12, border: "1px solid var(--sp-accent)", background: "rgba(232, 184, 75, 0.1)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Pending Collaborations</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pendingInvites.map((invite) => (
              <div key={invite.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 13 }}>
                  You have been invited to collaborate on <strong>{invite.projects?.title}</strong>.
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="sp-btn sp-btn-primary" onClick={() => acceptInvite(invite.id)}>Accept</button>
                  <button className="sp-btn" onClick={() => declineInvite(invite.id)}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", marginBottom: 32, gap: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>My Projects</h2>
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
                    <button onClick={() => { setShareProjectId(p.id); setShareProjectTitle(p.title); setOpenMenu(null); }}>Share</button>
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
      
      {shareProjectId && (
        <ShareModal 
          projectId={shareProjectId} 
          projectTitle={shareProjectTitle} 
          onClose={() => setShareProjectId(null)} 
        />
      )}
    </div>
  );
}
