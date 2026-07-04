import React, { useState, useEffect } from "react";
import { supabaseService } from "../../utils/supabaseService";
import { supabase } from "../../utils/supabaseClient";
import { Loader2, Trash2, Mail, CheckCircle, Clock } from "lucide-react";

interface Collaborator {
  id: string;
  invited_email: string;
  status: string;
  role: "Editor" | "Viewer";
  production_role?: string;
  user_id?: string | null;
}

export function ShareModal({
  projectId,
  projectTitle,
  onClose,
}: {
  projectId: string;
  projectTitle: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isOwner, setIsOwner] = useState(true);
  const [invitedRole, setInvitedRole] = useState<"Editor" | "Viewer">("Viewer");
  const [invitedProductionRole, setInvitedProductionRole] = useState<string>("Writer");

  const checkOwner = async () => {
    if (!supabaseService.isConfigured()) {
      setIsOwner(true);
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: p } = await supabase
        .from("projects")
        .select("user_id")
        .eq("id", projectId)
        .single();

      if (p) {
        setIsOwner(p.user_id === user.id);
      }
    } catch (err) {
      console.error("Error checking owner in ShareModal:", err);
    }
  };

  const loadCollaborators = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabaseService.fetchCollaborators(projectId);
      
      if (!error && data) {
        setCollaborators(data);
      }
    } catch (err) {
      console.error("Error loading collaborators:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await checkOwner();
      await loadCollaborators();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    if (collaborators.some((c) => c.invited_email.toLowerCase() === cleanEmail)) {
      alert("This user is already invited or is a collaborator on this project.");
      return;
    }

    setIsSending(true);
    try {
      let userId: string | null = null;
      if (supabaseService.isConfigured()) {
        const { data: profileData } = await supabaseService.fetchProfileByEmail(cleanEmail);
        userId = profileData?.id || null;
      }

      const { error } = await supabaseService.inviteCollaborator(
        projectId,
        cleanEmail,
        userId,
        invitedRole,
        invitedProductionRole
      );

      if (error) throw error;

      setEmail("");
      loadCollaborators();
    } catch (err: any) {
      alert("Error inviting collaborator: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateCollaborator = async (collabId: string, role: "Editor" | "Viewer", productionRole: string) => {
    try {
      const { error } = await supabaseService.updateCollaboratorRole(collabId, role, productionRole);
      if (error) throw error;
      loadCollaborators();
    } catch (err: any) {
      alert("Error updating collaborator: " + err.message);
    }
  };

  const handleRemove = async (collabId: string) => {
    const confirmed = await (window as any).customConfirm(
      "Remove this collaborator? They will lose access to the project.", 
      "Remove Collaborator",
      { confirmText: "Remove", variant: "destructive" }
    );
    if (!confirmed) return;

    try {
      const { error } = await supabaseService.removeCollaborator(collabId);
      if (error) throw error;
      loadCollaborators();
    } catch (err: any) {
      alert("Error removing collaborator: " + err.message);
    }
  };

  return (
    <div className="sp-modal-backdrop" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Share "{projectTitle}"</h2>
        <p style={{ fontSize: 13, color: "var(--sp-muted)", marginBottom: 20 }}>
          Invite other creative writers, directors, and actors to collaborate on this screenplay.
        </p>

        {!isOwner ? (
          <div style={{ marginBottom: 24, padding: "10px 12px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--sp-border)", borderRadius: 8, fontSize: 13, color: "var(--sp-muted)", textAlign: "center" }}>
            ℹ️ Only the project owner can invite or modify collaborators.
          </div>
        ) : (
          <form onSubmit={handleInvite} style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            <div style={{ position: "relative", width: "100%" }}>
              <Mail 
                size={14} 
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--sp-muted)" }} 
              />
              <input
                type="email"
                required
                className="sp-input"
                placeholder="collaborator@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 36, width: "100%" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select
                value={invitedRole}
                onChange={(e) => setInvitedRole(e.target.value as "Editor" | "Viewer")}
                className="sp-input"
                style={{ flex: 1, padding: "8px 12px", minWidth: 120, borderRadius: 8, background: "#1c1c20", border: "1px solid var(--sp-border)", color: "var(--sp-text)", fontSize: 13, cursor: "pointer" }}
              >
                <option value="Viewer">Viewer (Read-only)</option>
                <option value="Editor">Editor (Read/Write)</option>
              </select>
              <select
                value={invitedProductionRole}
                onChange={(e) => setInvitedProductionRole(e.target.value)}
                className="sp-input"
                style={{ flex: 1, padding: "8px 12px", minWidth: 120, borderRadius: 8, background: "#1c1c20", border: "1px solid var(--sp-border)", color: "var(--sp-text)", fontSize: 13, cursor: "pointer" }}
              >
                <option value="Writer">Writer</option>
                <option value="Director">Director</option>
                <option value="Actor">Actor</option>
                <option value="Producer">Producer</option>
                <option value="DP">Director of Photography</option>
                <option value="Editor">Creative Editor</option>
                <option value="Other">Other</option>
              </select>
              <button 
                type="submit" 
                className="sp-btn sp-btn-primary" 
                disabled={isSending || !email.trim()}
                style={{ padding: "8px 16px" }}
              >
                {isSending ? <Loader2 size={14} className="animate-spin" /> : "Invite"}
              </button>
            </div>
          </form>
        )}

        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Collaborators</h3>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--sp-accent)" }} />
          </div>
        ) : collaborators.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--sp-muted)", fontStyle: "italic", textAlign: "center", padding: "16px 0" }}>
            No collaborators invited yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 220, overflowY: "auto", marginBottom: 20 }}>
            {collaborators.map((c) => (
              <div 
                key={c.id} 
                style={{ 
                  display: "flex", 
                  flexDirection: "column",
                  gap: 8,
                  padding: "10px 12px", 
                  borderRadius: 8, 
                  border: "1px solid var(--sp-border)",
                  background: "var(--sp-bg)" 
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{c.invited_email}</span>
                    <span 
                      style={{ 
                        fontSize: 10, 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: 4, 
                        color: c.status === "accepted" ? "#10b981" : "#f59e0b" 
                      }}
                    >
                      {c.status === "accepted" ? (
                        <><CheckCircle size={10} /> Accepted</>
                      ) : (
                        <><Clock size={10} /> Pending invite</>
                      )}
                    </span>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {isOwner ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <select
                          value={c.role || "Viewer"}
                          onChange={(e) => {
                            const newRole = e.target.value as "Editor" | "Viewer";
                            handleUpdateCollaborator(c.id, newRole, c.production_role || "Writer");
                          }}
                          style={{
                            background: "#1c1c20",
                            border: "1px solid var(--sp-border)",
                            color: "var(--sp-text)",
                            fontSize: 11,
                            padding: "4px 8px",
                            borderRadius: 6,
                            cursor: "pointer",
                          }}
                        >
                          <option value="Viewer">Viewer</option>
                          <option value="Editor">Editor</option>
                        </select>
                        <select
                          value={c.production_role || "Writer"}
                          onChange={(e) => {
                            const newProdRole = e.target.value;
                            handleUpdateCollaborator(c.id, c.role || "Viewer", newProdRole);
                          }}
                          style={{
                            background: "#1c1c20",
                            border: "1px solid var(--sp-border)",
                            color: "var(--sp-text)",
                            fontSize: 11,
                            padding: "4px 8px",
                            borderRadius: 6,
                            cursor: "pointer",
                          }}
                        >
                          <option value="Writer">Writer</option>
                          <option value="Director">Director</option>
                          <option value="Actor">Actor</option>
                          <option value="Producer">Producer</option>
                          <option value="DP">DP</option>
                          <option value="Editor">Editor</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 4 }}>
                        <span style={{ fontSize: 10, color: "#60A5FA", background: "rgba(96, 165, 250, 0.08)", padding: "2px 6px", borderRadius: 4, fontWeight: 500 }}>
                          {c.role || "Viewer"}
                        </span>
                        <span style={{ fontSize: 10, color: "#10B981", background: "rgba(16, 185, 129, 0.08)", padding: "2px 6px", borderRadius: 4, fontWeight: 500 }}>
                          {c.production_role || "Writer"}
                        </span>
                      </div>
                    )}
                    {isOwner && (
                      <button 
                        className="sp-btn sp-btn-ghost sp-btn-icon" 
                        onClick={() => handleRemove(c.id)}
                        title="Remove collaborator"
                        style={{ color: "var(--sp-muted)", padding: 6 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="sp-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
