import { supabase } from "./supabaseClient";
import { Project, Store, FileDoc, Block } from "../types/screenplay";

export const supabaseService = {
  isConfigured(): boolean {
    const url = import.meta.env.VITE_SUPABASE_URL || "";
    return url && !url.includes("placeholder-project");
  },

  // --- AUTH ---
  async getSession() {
    if (!this.isConfigured()) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!this.isConfigured()) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange(callback);
  },

  async signUp(email: string, password: string) {
    return supabase.auth.signUp({ email, password });
  },

  async signInWithPassword(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signInWithOAuth(provider: "google") {
    return supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + "/projects",
      },
    });
  },

  async signOut() {
    if (!this.isConfigured()) return;
    return supabase.auth.signOut();
  },

  // --- USER PROFILES ---
  async fetchProfileByEmail(email: string) {
    return supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
  },

  // --- PROJECTS & FILES ---
  async fetchUserProjects(userId: string): Promise<Project[] | null> {
    try {
      // 1. Fetch owned projects
      const { data: ownedData, error: ownedError } = await supabase
        .from("projects")
        .select("*, files(*)")
        .order("date_modified", { ascending: false });

      if (ownedError) throw ownedError;

      // 2. Fetch collaborated projects
      const { data: collabData, error: collabError } = await supabase
        .from("collaborators")
        .select("project_id, projects(*, files(*))")
        .eq("user_id", userId)
        .eq("status", "accepted");

      if (collabError) throw collabError;

      const projectsList: any[] = [];
      if (ownedData) {
        projectsList.push(...ownedData);
      }

      if (collabData) {
        collabData.forEach((c: any) => {
          if (c.projects && !projectsList.some((p) => p.id === c.projects.id)) {
            projectsList.push(c.projects);
          }
        });
      }

      // Convert database schema to frontend Store schema
      return projectsList.map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description || "",
        dateCreated: new Date(p.date_created).getTime(),
        dateModified: new Date(p.date_modified).getTime(),
        files: (p.files || []).map((f: any) => ({
          id: f.id,
          title: f.title,
          dateModified: new Date(f.date_modified).getTime(),
          blocks: f.blocks || [],
          titlePage: f.title_page || undefined,
        })),
      }));
    } catch (err: any) {
      console.error("Error fetching projects from Supabase:", err?.message || err, "Code:", err?.code || "", "Details:", JSON.stringify(err));
      return null; // Return null so caller knows it failed (triggers fallback to localStorage)
    }
  },

  async migrateLocalProjects(userId: string, localProjects: Project[]): Promise<Project[]> {
    const migratedProjects: Project[] = [];
    
    for (const p of localProjects) {
      try {
        const { error: projErr } = await supabase.from("projects").insert({
          id: p.id,
          title: p.title,
          description: p.description,
          user_id: userId,
          date_created: new Date(p.dateCreated).toISOString(),
          date_modified: new Date(p.dateModified).toISOString(),
        });
        
        if (projErr) {
          console.error("Migration error: Failed to insert project:", p.id, projErr);
          continue;
        }

        let fileFailures = false;
        for (const f of p.files) {
          const { error: fileErr } = await supabase.from("files").insert({
            id: f.id,
            project_id: p.id,
            title: f.title,
            date_modified: new Date(f.dateModified).toISOString(),
            blocks: f.blocks,
            title_page: f.titlePage || null,
          });
          if (fileErr) {
            console.error("Migration error: Failed to insert file:", f.id, fileErr);
            fileFailures = true;
          }
        }

        migratedProjects.push(p);
      } catch (err) {
        console.error("Unexpected error migrating project:", p.id, err);
      }
    }
    return migratedProjects;
  },

  async syncStore(newStore: Store, oldStore: Store): Promise<boolean> {
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (!supabaseUser) return false;

      let syncSuccess = true;

      for (const p of newStore.projects) {
        const oldP = oldStore.projects.find((x) => x.id === p.id);
        if (!oldP) {
          // New Project
          const { error: projErr } = await supabase.from("projects").insert({
            id: p.id,
            title: p.title,
            description: p.description,
            user_id: supabaseUser.id,
            date_created: new Date(p.dateCreated).toISOString(),
            date_modified: new Date(p.dateModified).toISOString(),
          });
          if (projErr) {
            console.error("Sync error inserting project:", p.id, projErr);
            syncSuccess = false;
            continue;
          }
          for (const f of p.files) {
            const { error: fileErr } = await supabase.from("files").insert({
              id: f.id,
              project_id: p.id,
              title: f.title,
              date_modified: new Date(f.dateModified).toISOString(),
              blocks: f.blocks,
              title_page: f.titlePage || null,
            });
            if (fileErr) {
              console.error("Sync error inserting file:", f.id, fileErr);
              syncSuccess = false;
            }
          }
        } else {
          // Update existing project
          if (oldP.title !== p.title || oldP.description !== p.description || oldP.dateModified !== p.dateModified) {
            const { error: projErr } = await supabase.from("projects").update({
              title: p.title,
              description: p.description,
              date_modified: new Date(p.dateModified).toISOString(),
            }).eq("id", p.id);
            if (projErr) {
              console.error("Sync error updating project:", p.id, projErr);
              syncSuccess = false;
            }
          }

          // Check files inside project
          for (const f of p.files) {
            const oldF = oldP.files.find((x) => x.id === f.id);
            if (!oldF) {
              const { error: fileErr } = await supabase.from("files").insert({
                id: f.id,
                project_id: p.id,
                title: f.title,
                date_modified: new Date(f.dateModified).toISOString(),
                blocks: f.blocks,
                title_page: f.titlePage || null,
              });
              if (fileErr) {
                console.error("Sync error inserting file:", f.id, fileErr);
                syncSuccess = false;
              }
            } else if (
              oldF.title !== f.title ||
              oldF.dateModified !== f.dateModified ||
              JSON.stringify(oldF.blocks) !== JSON.stringify(f.blocks) ||
              JSON.stringify(oldF.titlePage) !== JSON.stringify(f.titlePage)
            ) {
              const { error: fileErr } = await supabase.from("files").update({
                title: f.title,
                date_modified: new Date(f.dateModified).toISOString(),
                blocks: f.blocks,
                title_page: f.titlePage || null,
              }).eq("id", f.id);
              if (fileErr) {
                console.error("Sync error updating file:", f.id, fileErr);
                syncSuccess = false;
              }
            }
          }

          // Delete files not in new state
          for (const oldF of oldP.files) {
            if (!p.files.some((x) => x.id === oldF.id)) {
              const { error: fileErr } = await supabase.from("files").delete().eq("id", oldF.id);
              if (fileErr) {
                console.error("Sync error deleting file:", oldF.id, fileErr);
                syncSuccess = false;
              }
            }
          }
        }
      }

      // Projects deleted
      for (const oldP of oldStore.projects) {
        if (!newStore.projects.some((x) => x.id === oldP.id)) {
          const { error: projErr } = await supabase.from("projects").delete().eq("id", oldP.id);
          if (projErr) {
            console.error("Sync error deleting project:", oldP.id, projErr);
            syncSuccess = false;
          }
        }
      }
      return syncSuccess;
    } catch (err) {
      console.error("Unexpected error during sync:", err);
      return false;
    }
  },

  // --- COLLABORATORS ---
  async fetchCollaborators(projectId: string) {
    return supabase
      .from("collaborators")
      .select("id, invited_email, status")
      .eq("project_id", projectId);
  },

  async inviteCollaborator(projectId: string, email: string, userId: string | null) {
    return supabase
      .from("collaborators")
      .insert({
        project_id: projectId,
        invited_email: email,
        user_id: userId,
        status: "pending",
      });
  },

  async removeCollaborator(collabId: string) {
    return supabase
      .from("collaborators")
      .delete()
      .eq("id", collabId);
  },

  async fetchPendingInvites(email: string) {
    return supabase
      .from("collaborators")
      .select(`
        id,
        project_id,
        projects (
          title,
          user_id
        )
      `)
      .eq("invited_email", email.toLowerCase())
      .eq("status", "pending");
  },

  async acceptInvite(inviteId: string, userId: string) {
    return supabase
      .from("collaborators")
      .update({ status: "accepted", user_id: userId })
      .eq("id", inviteId);
  },

  async declineInvite(inviteId: string) {
    return supabase
      .from("collaborators")
      .delete()
      .eq("id", inviteId);
  },

  // --- REALTIME ---
  subscribeToFileChanges(fileId: string, onUpdate: (blocks: Block[]) => void) {
    if (!this.isConfigured()) return null;

    const channel = supabase
      .channel(`realtime:files:${fileId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "files",
          filter: `id=eq.${fileId}`,
        },
        (payload) => {
          if (payload.new && payload.new.blocks) {
            onUpdate(payload.new.blocks);
          }
        }
      )
      .subscribe();

    return channel;
  },

  // --- COMMENTS ---
  async fetchComments(fileId: string) {
    if (!this.isConfigured()) return { data: null, error: new Error("Supabase is not configured") };
    return supabase
      .from("comments")
      .select("*")
      .eq("file_id", fileId)
      .order("created_at", { ascending: true });
  },

  async insertComment(comment: {
    id: string;
    file_id: string;
    author: string;
    avatar: string;
    text: string;
    timestamp: string;
    scene_label?: string;
  }) {
    if (!this.isConfigured()) return { data: null, error: new Error("Supabase is not configured") };
    return supabase.from("comments").insert({
      id: comment.id,
      file_id: comment.file_id,
      author: comment.author,
      avatar: comment.avatar,
      text: comment.text,
      timestamp: comment.timestamp,
      scene_label: comment.scene_label || null,
    });
  },

  async deleteComment(commentId: string) {
    if (!this.isConfigured()) return { data: null, error: new Error("Supabase is not configured") };
    return supabase.from("comments").delete().eq("id", commentId);
  },

  subscribeToComments(
    fileId: string,
    onInsert: (payload: any) => void,
    onDelete: (commentId: string) => void
  ) {
    if (!this.isConfigured()) return null;
    return supabase
      .channel(`realtime:comments:${fileId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        (payload) => {
          if (payload.new && payload.new.file_id === fileId) {
            onInsert(payload.new);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "comments" },
        (payload) => {
          if (payload.old && payload.old.id) {
            onDelete(payload.old.id);
          }
        }
      )
      .subscribe();
  },

  unsubscribe(channel: any) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }
};
export default supabaseService;
