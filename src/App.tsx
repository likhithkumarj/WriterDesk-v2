import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import { Store } from "./types/screenplay";
import { loadStore, STORAGE_KEY } from "./utils/storage";
import { ProjectsScreen } from "./components/screenplay/ProjectsScreen";
import { FilesScreen } from "./components/screenplay/FilesScreen";
import { EditorScreen } from "./components/screenplay/EditorScreen";
import { LandingScreen } from "./components/screenplay/LandingScreen";
import { LoginScreen } from "./components/screenplay/LoginScreen";
import { GlobalStyles } from "./components/screenplay/GlobalStyles";
import { supabase } from "./utils/supabaseClient";

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || "";
  return url && !url.includes("placeholder-project");
};

function AppContent() {
  const [store, setStore] = useState<Store>(() => loadStore());
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("writerdesk_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isConfigured = isSupabaseConfigured();

    const loadData = async (userId?: string) => {
      if (isConfigured && userId) {
        const { data: projectsData, error } = await supabase
          .from("projects")
          .select("*, files(*)");
        
        if (!error && projectsData) {
          const loadedStore: Store = {
            projects: projectsData.map((p: any) => ({
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
            })),
          };
          setStore(loadedStore);
        }
      } else {
        setStore(loadStore());
      }
    };

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const profile = {
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          avatar: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${session.user.email?.split("@")[0] || "User"}`,
        };
        setUser(profile);
        localStorage.setItem("writerdesk_user", JSON.stringify(profile));
        loadData(session.user.id).finally(() => setIsLoading(false));
      } else {
        loadData().finally(() => setIsLoading(false));
      }
    }).catch(() => {
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const profile = {
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          avatar: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${session.user.email?.split("@")[0] || "User"}`,
        };
        setUser(profile);
        localStorage.setItem("writerdesk_user", JSON.stringify(profile));
        loadData(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        localStorage.removeItem("writerdesk_user");
        loadData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const persist = async (newStore: Store) => {
    // Optimistic update
    setStore(newStore);

    if (!isSupabaseConfigured()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStore));
      return;
    }

    try {
      // Diff sync
      for (const p of newStore.projects) {
        const oldP = store.projects.find((x) => x.id === p.id);
        if (!oldP) {
          // New Project
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();
          if (supabaseUser) {
            await supabase.from("projects").insert({
              id: p.id,
              title: p.title,
              description: p.description,
              user_id: supabaseUser.id,
              date_created: new Date(p.dateCreated).toISOString(),
              date_modified: new Date(p.dateModified).toISOString(),
            });
            for (const f of p.files) {
              await supabase.from("files").insert({
                id: f.id,
                project_id: p.id,
                title: f.title,
                date_modified: new Date(f.dateModified).toISOString(),
                blocks: f.blocks,
                title_page: f.titlePage || null,
              });
            }
          }
        } else {
          // Update existing project
          if (oldP.title !== p.title || oldP.description !== p.description || oldP.dateModified !== p.dateModified) {
            await supabase.from("projects").update({
              title: p.title,
              description: p.description,
              date_modified: new Date(p.dateModified).toISOString(),
            }).eq("id", p.id);
          }

          // Check files inside project
          for (const f of p.files) {
            const oldF = oldP.files.find((x) => x.id === f.id);
            if (!oldF) {
              await supabase.from("files").insert({
                id: f.id,
                project_id: p.id,
                title: f.title,
                date_modified: new Date(f.dateModified).toISOString(),
                blocks: f.blocks,
                title_page: f.titlePage || null,
              });
            } else if (
              oldF.title !== f.title ||
              oldF.dateModified !== f.dateModified ||
              JSON.stringify(oldF.blocks) !== JSON.stringify(f.blocks) ||
              JSON.stringify(oldF.titlePage) !== JSON.stringify(f.titlePage)
            ) {
              await supabase.from("files").update({
                title: f.title,
                date_modified: new Date(f.dateModified).toISOString(),
                blocks: f.blocks,
                title_page: f.titlePage || null,
              }).eq("id", f.id);
            }
          }

          // Delete files not in new state
          for (const oldF of oldP.files) {
            if (!p.files.some((x) => x.id === oldF.id)) {
              await supabase.from("files").delete().eq("id", oldF.id);
            }
          }
        }
      }

      // Projects deleted
      for (const oldP of store.projects) {
        if (!newStore.projects.some((x) => x.id === oldP.id)) {
          await supabase.from("projects").delete().eq("id", oldP.id);
        }
      }
    } catch (err) {
      console.error("Error syncing with Supabase:", err);
    }
  };

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem("writerdesk_user", JSON.stringify(profile));
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    } else {
      setUser(null);
      localStorage.removeItem("writerdesk_user");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, border: "3px solid rgba(245, 158, 11, 0.2)", borderTop: "3px solid #f59e0b", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
          <span style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500 }}>Restoring session...</span>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingScreen />} />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/projects" replace /> : <LoginScreen onLogin={handleLogin} />} 
      />

      {/* Protected Routes */}
      <Route 
        path="/projects" 
        element={user ? <ProjectsRoute store={store} persist={persist} user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/project/:projectId" 
        element={user ? <ProjectFilesRoute store={store} persist={persist} /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/project/:projectId/file/:fileId" 
        element={user ? <EditorRoute store={store} persist={persist} /> : <Navigate to="/login" replace />} 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Route wrappers to keep the screen components completely decoupled from React Router
function ProjectsRoute({ 
  store, 
  persist, 
  user, 
  onLogout 
}: { 
  store: Store; 
  persist: (s: Store) => void; 
  user: UserProfile; 
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  return (
    <ProjectsScreen 
      store={store} 
      persist={persist} 
      openProject={(id) => navigate(`/project/${id}`)} 
      user={user}
      onLogout={onLogout}
    />
  );
}

function ProjectFilesRoute({ store, persist }: { store: Store; persist: (s: Store) => void }) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  
  const project = store.projects.find((p) => p.id === projectId);
  if (!project) return <Navigate to="/projects" replace />;

  return (
    <FilesScreen
      project={project}
      back={() => navigate("/projects")}
      persist={(p) => persist({ ...store, projects: store.projects.map((x) => x.id === p.id ? p : x) })}
      openFile={(fileId) => navigate(`/project/${projectId}/file/${fileId}`)}
    />
  );
}

function EditorRoute({ store, persist }: { store: Store; persist: (s: Store) => void }) {
  const navigate = useNavigate();
  const { projectId, fileId } = useParams();

  const project = store.projects.find((p) => p.id === projectId);
  const file = project?.files.find((f) => f.id === fileId);
  
  if (!project) return <Navigate to="/projects" replace />;
  if (!file) return <Navigate to={`/project/${projectId}`} replace />;

  return (
    <EditorScreen
      project={project}
      file={file}
      back={() => navigate(`/project/${projectId}`)}
      persistFile={(f) => persist({
        ...store, projects: store.projects.map((p) =>
          p.id === projectId ? { ...p, files: p.files.map((x) => x.id === f.id ? f : x) } : p
        )
      })}
      addFiles={(newFiles, openId) => {
        persist({
          ...store, projects: store.projects.map((p) =>
            p.id === projectId ? { ...p, files: [...p.files, ...newFiles] } : p
          )
        });
        if (openId) navigate(`/project/${projectId}/file/${openId}`);
      }}
    />
  );
}

export function App() {
  return (
    <div className="sp-app">
      <GlobalStyles />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </div>
  );
}

export default App;
