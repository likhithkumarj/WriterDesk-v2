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
import { supabaseService } from "./utils/supabaseService";
import { Analytics } from "@vercel/analytics/react";

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

function AppContent() {
  const [store, setStore] = useState<Store>(() => loadStore());
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("writerdesk_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async (userId?: string) => {
      if (supabaseService.isConfigured() && userId) {
        try {
          const projectsList = await supabaseService.fetchUserProjects(userId);

          if (projectsList === null) {
            console.warn("Supabase fetch failed. Falling back to local storage projects.");
            setStore(loadStore());
            return;
          }

          // Migrate local storage projects if database is empty
          if (projectsList.length === 0) {
            const localStore = loadStore();
            if (localStore.projects && localStore.projects.length > 0) {
              console.log("Migrating local projects to Supabase...");
              const migrated = await supabaseService.migrateLocalProjects(userId, localStore.projects);
              if (migrated.length > 0) {
                projectsList.push(...migrated);
              }
            }
          }

          setStore({ projects: projectsList });
        } catch (err) {
          console.error("Unexpected error loading Supabase data, falling back to local storage:", err);
          setStore(loadStore());
        }
      } else {
        setStore(loadStore());
      }
    };

    // Check active session
    supabaseService.getSession().then((session) => {
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
    const { data: { subscription } } = supabaseService.onAuthStateChange((event, session) => {
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

    if (!supabaseService.isConfigured()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStore));
      return;
    }

    try {
      const success = await supabaseService.syncStore(newStore, store);
      if (!success) {
        console.warn("Supabase sync failed. Falling back to local storage backup.");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newStore));
      }
    } catch (err) {
      console.error("Error syncing with Supabase, saving to local storage fallback:", err);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStore));
    }
  };

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem("writerdesk_user", JSON.stringify(profile));
  };

  const handleLogout = async () => {
    if (supabaseService.isConfigured()) {
      await supabaseService.signOut();
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
      <Analytics />
    </div>
  );
}

export default App;
