import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import { Store } from "./types/screenplay";
import { loadStore, STORAGE_KEY } from "./utils/storage";
import { ProjectsScreen } from "./components/screenplay/ProjectsScreen";
import { FilesScreen } from "./components/screenplay/FilesScreen";
import { EditorScreen } from "./components/screenplay/EditorScreen";
import { LandingScreen } from "./components/screenplay/LandingScreen";
import { LoginScreen } from "./components/screenplay/LoginScreen";
import { GlobalStyles } from "./components/screenplay/GlobalStyles";

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

  const persist = (s: Store) => {
    setStore(s);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  };

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem("writerdesk_user", JSON.stringify(profile));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("writerdesk_user");
  };

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
