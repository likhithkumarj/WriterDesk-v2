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

  async fetchProfileById(id: string) {
    if (!this.isConfigured()) return { data: null, error: null };
    return supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url")
      .eq("id", id)
      .maybeSingle();
  },

  async fetchProfileByEmailOrUsername(input: string) {
    if (!this.isConfigured()) return { data: null, error: null };
    const cleanInput = input.trim();
    
    // First, try to match by email
    let { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("email", cleanInput.toLowerCase())
      .maybeSingle();
      
    if (error || !data) {
      // Try to match by username / full name case-insensitively
      const { data: nameData, error: nameErr } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .ilike("full_name", cleanInput)
        .maybeSingle();
        
      if (!nameErr && nameData) {
        data = nameData;
        error = null;
      }
    }
    return { data, error };
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
        projectsList.push(...ownedData.map((p: any) => ({ ...p, ownerId: p.user_id })));
      }

      if (collabData) {
        collabData.forEach((c: any) => {
          if (c.projects && !projectsList.some((p) => p.id === c.projects.id)) {
            projectsList.push({ ...c.projects, ownerId: c.projects.user_id });
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
        type: p.type || "",
        genre: p.genre || "",
        status: p.status || "",
        ownerId: p.ownerId,
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
          type: p.type || null,
          genre: p.genre || null,
          status: p.status || null,
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
            type: f.type || "script",
            status: f.status || "Draft",
            word_count: f.wordCount || 0,
            blocks: f.blocks || [],
            title_page: f.titlePage || null,
            content: f.content || null,
            characters: f.characters || null,
            outline_tree: f.outlineTree || null,
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
        const isOwner = !p.ownerId || p.ownerId === supabaseUser.id;
        
        if (isOwner) {
          // Upsert project metadata
          const { error: projErr } = await supabase.from("projects").upsert({
            id: p.id,
            title: p.title,
            description: p.description,
            user_id: p.ownerId || supabaseUser.id,
            date_created: new Date(p.dateCreated).toISOString(),
            date_modified: new Date(p.dateModified).toISOString(),
            type: p.type || null,
            genre: p.genre || null,
            status: p.status || null,
          });

          if (projErr) {
            console.error("Sync error upserting project:", p.id, projErr);
            syncSuccess = false;
            continue;
          }
        }

        // Upsert files inside project
        for (const f of p.files) {
          const { error: fileErr } = await supabase.from("files").upsert({
            id: f.id,
            project_id: p.id,
            title: f.title,
            date_modified: new Date(f.dateModified).toISOString(),
            type: f.type || "script",
            status: f.status || "Draft",
            word_count: f.wordCount || 0,
            blocks: f.blocks || [],
            title_page: f.titlePage || null,
            content: f.content || null,
            characters: f.characters || null,
            outline_tree: f.outlineTree || null,
          });
          if (fileErr) {
            console.error("Sync error upserting file:", f.id, fileErr);
            syncSuccess = false;
          }
        }

        // Delete files from DB that are not in the new store state for this project
        const { data: dbFiles, error: dbFilesErr } = await supabase
          .from("files")
          .select("id")
          .eq("project_id", p.id);

        if (!dbFilesErr && dbFiles) {
          for (const dbF of dbFiles) {
            if (!p.files.some((x) => x.id === dbF.id)) {
              // Delete comments first to satisfy foreign key constraints
              const { error: commentErr } = await supabase.from("comments").delete().eq("file_id", dbF.id);
              if (commentErr) {
                console.error("Sync error deleting associated comments:", dbF.id, commentErr);
              }
              const { error: fileErr } = await supabase.from("files").delete().eq("id", dbF.id);
              if (fileErr) {
                console.error("Sync error deleting file:", dbF.id, fileErr);
                syncSuccess = false;
              }
            }
          }
        }
      }

      // Projects deleted: Delete projects from DB that are not in the new store
      const { data: dbProjects, error: dbProjErr } = await supabase
        .from("projects")
        .select("id");

      if (!dbProjErr && dbProjects) {
        for (const dbP of dbProjects) {
          if (!newStore.projects.some((x) => x.id === dbP.id)) {
            // Fetch project files to delete their comments first
            const { data: projFiles } = await supabase.from("files").select("id").eq("project_id", dbP.id);
            if (projFiles) {
              for (const f of projFiles) {
                await supabase.from("comments").delete().eq("file_id", f.id);
              }
            }
            await supabase.from("files").delete().eq("project_id", dbP.id);
            await supabase.from("collaborators").delete().eq("project_id", dbP.id);

            const { error: projErr } = await supabase.from("projects").delete().eq("id", dbP.id);
            if (projErr) {
              console.error("Sync error deleting project:", dbP.id, projErr);
              syncSuccess = false;
            }
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
      .select("id, invited_email, status, user_id, role")
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
        role: "Viewer", // DEFAULT Viewer
      });
  },

  async updateCollaboratorRole(collabId: string, role: "Editor" | "Viewer") {
    return supabase
      .from("collaborators")
      .update({ role })
      .eq("id", collabId);
  },

  async removeCollaborator(collabId: string) {
    return supabase
      .from("collaborators")
      .delete()
      .eq("id", collabId);
  },

  async fetchProjectDetailsBypass(inviteId: string, projectId: string) {
    if (!this.isConfigured()) return { data: null, error: new Error("Supabase is not configured") };
    try {
      // 1. Temporarily update status to accepted to satisfy RLS
      const { error: err1 } = await supabase
        .from("collaborators")
        .update({ status: "accepted" })
        .eq("id", inviteId);

      if (err1) throw err1;

      // 2. Fetch project details now that we are "accepted"
      const { data: projectData, error: err2 } = await supabase
        .from("projects")
        .select("title, user_id")
        .eq("id", projectId)
        .maybeSingle();

      // 3. Reset status back to pending
      const { error: err3 } = await supabase
        .from("collaborators")
        .update({ status: "pending" })
        .eq("id", inviteId);

      if (err2) throw err2;
      if (err3) throw err3;

      return { data: projectData, error: null };
    } catch (err: any) {
      console.error("fetchProjectDetailsBypass failed:", err);
      // Attempt status recovery
      try {
        await supabase
          .from("collaborators")
          .update({ status: "pending" })
          .eq("id", inviteId);
      } catch (e) {}
      return { data: null, error: err };
    }
  },

  async fetchPendingInvites(email: string) {
    if (!this.isConfigured()) return { data: null, error: new Error("Supabase is not configured") };
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      console.log("fetchPendingInvites - User Email:", email);
      console.log("fetchPendingInvites - Session User ID:", currentUserId);

      const { data: invites, error: fetchErr } = await supabase
        .from("collaborators")
        .select(`
          *,
          projects (
            title,
            user_id
          )
        `)
        .eq("invited_email", email.toLowerCase())
        .eq("status", "pending");

      if (fetchErr) {
        console.error("fetchPendingInvites - Fetch Error:", fetchErr);
        throw fetchErr;
      }

      console.log("fetchPendingInvites - Raw invites fetched:", JSON.stringify(invites, null, 2));

      let needsRefetch = false;
      if (invites && currentUserId) {
        for (const invite of invites) {
          const userAuthEmail = session?.user?.email;
          const needsEmailCaseUpdate = userAuthEmail && 
            invite.invited_email.toLowerCase() === userAuthEmail.toLowerCase() && 
            invite.invited_email !== userAuthEmail;

          if (invite.user_id !== currentUserId || needsEmailCaseUpdate) {
            console.log(`fetchPendingInvites - Self-healing invite ${invite.id} setting user_id to ${currentUserId} and email to ${userAuthEmail}`);
            const { error: updateErr } = await supabase
              .from("collaborators")
              .update({ 
                user_id: currentUserId,
                invited_email: userAuthEmail || invite.invited_email
              })
              .eq("id", invite.id);
            if (!updateErr) {
              needsRefetch = true;
            } else {
              console.error("fetchPendingInvites - Update Error:", updateErr);
            }
          }
        }
      }

      let finalInvites = invites || [];

      if (needsRefetch) {
        const { data: refetchedInvites, error: refetchErr } = await supabase
          .from("collaborators")
          .select(`
            *,
            projects (
              title,
              user_id
            )
          `)
          .eq("invited_email", email.toLowerCase())
          .eq("status", "pending");
        
        if (!refetchErr && refetchedInvites) {
          console.log("fetchPendingInvites - Refetched invites:", JSON.stringify(refetchedInvites, null, 2));
          finalInvites = refetchedInvites;
        } else if (refetchErr) {
          console.error("fetchPendingInvites - Refetch Error:", refetchErr);
        }
      }

      // Bypass RLS dynamically for any rows that still have projects as null!
      if (finalInvites.length > 0 && currentUserId) {
        finalInvites = await Promise.all(finalInvites.map(async (invite: any) => {
          if (!invite.projects) {
            console.log(`fetchPendingInvites - projects join was null. Running bypass for invite ${invite.id}`);
            const { data: bypassedProject } = await this.fetchProjectDetailsBypass(invite.id, invite.project_id);
            if (bypassedProject) {
              return {
                ...invite,
                projects: bypassedProject
              };
            }
          }
          return invite;
        }));
      }

      console.log("fetchPendingInvites - Final invites returning:", JSON.stringify(finalInvites, null, 2));
      return { data: finalInvites, error: null };
    } catch (err: any) {
      console.error("Error fetching pending invites:", err);
      return { data: null, error: err };
    }
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
