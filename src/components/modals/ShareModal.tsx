import React, { useState, useEffect } from "react";
import { supabaseService } from "../../utils/supabaseService";
import { Loader2, Trash2, Mail, CheckCircle, Clock } from "lucide-react";

interface Collaborator {
  id: string;
  invited_email: string;
  status: string;
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

  const loadCollaborators = async () => {
    if (!supabaseService.isConfigured()) {
      setIsLoading(false);
      return;
    }
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
    loadCollaborators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    if (!supabaseService.isConfigured()) {
      alert("Invite sent! (Simulated - Supabase is not configured)");
      setEmail("");
      return;
    }

    if (collaborators.some((c) => c.invited_email.toLowerCase() === cleanEmail)) {
      alert("This user is already invited or is a collaborator on this project.");
      return;
    }

    setIsSending(true);
    try {
      // Find if user already has a profile to set user_id
      const { data: profileData } = await supabaseService.fetchProfileByEmail(cleanEmail);

      const { error } = await supabaseService.inviteCollaborator(
        projectId,
        cleanEmail,
        profileData?.id || null
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

  const handleRemove = async (collabId: string) => {
    if (!window.confirm("Remove this collaborator? They will lose access to the project.")) return;

    if (!supabaseService.isConfigured()) {
      setCollaborators(collaborators.filter((c) => c.id !== collabId));
      return;
    }

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
      <div className="sp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Share "{projectTitle}"</h2>
        <p style={{ fontSize: 13, color: "var(--sp-muted)", marginBottom: 20 }}>
          Invite other writers to edit this screenplay in real time.
        </p>

        {!supabaseService.isConfigured() ? (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-xl text-center">
            ⚠️ Supabase is not configured. Real-time collaboration is disabled in mock/demo mode.
          </div>
        ) : (
          <form onSubmit={handleInvite} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Mail 
                size={14} 
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--sp-muted)" }} 
              />
              <input
                type="email"
                required
                className="sp-input"
                placeholder="writer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 32 }}
              />
            </div>
            <button 
              type="submit" 
              className="sp-btn sp-btn-primary" 
              disabled={isSending || !email.trim()}
              style={{ padding: "8px 16px" }}
            >
              {isSending ? <Loader2 size={14} className="animate-spin" /> : "Invite"}
            </button>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 200, overflowY: "auto", marginBottom: 20 }}>
            {collaborators.map((c) => (
              <div 
                key={c.id} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  padding: "10px 12px", 
                  borderRadius: 8, 
                  border: "1px solid var(--sp-border)",
                  background: "var(--sp-bg)" 
                }}
              >
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
                <button 
                  className="sp-btn sp-btn-ghost sp-btn-icon" 
                  onClick={() => handleRemove(c.id)}
                  title="Remove collaborator"
                  style={{ color: "var(--sp-muted)", padding: 6 }}
                >
                  <Trash2 size={14} />
                </button>
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
