import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import { Store } from "./types/screenplay";
import { loadStore, STORAGE_KEY } from "./utils/storage";
import { ProjectsScreen } from "./components/screenplay/ProjectsScreen";
import { FilesScreen } from "./components/screenplay/FilesScreen";
import { EditorScreen } from "./components/screenplay/EditorScreen";
import { GlobalStyles } from "./components/screenplay/GlobalStyles";

function AppContent() {
  const [store, setStore] = useState<Store>(() => loadStore());

  const persist = (s: Store) => {
    setStore(s);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  };

  return (
    <Routes>
      <Route path="/" element={<ProjectsRoute store={store} persist={persist} />} />
      <Route path="/project/:projectId" element={<ProjectFilesRoute store={store} persist={persist} />} />
      <Route path="/project/:projectId/file/:fileId" element={<EditorRoute store={store} persist={persist} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Route wrappers to keep the screen components completely decoupled from React Router
function ProjectsRoute({ store, persist }: { store: Store; persist: (s: Store) => void }) {
  const navigate = useNavigate();
  return (
    <ProjectsScreen 
      store={store} 
      persist={persist} 
      openProject={(id) => navigate(`/project/${id}`)} 
    />
  );
}

function ProjectFilesRoute({ store, persist }: { store: Store; persist: (s: Store) => void }) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  
  const project = store.projects.find((p) => p.id === projectId);
  if (!project) return <Navigate to="/" replace />;

  return (
    <FilesScreen
      project={project}
      back={() => navigate("/")}
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
  
  if (!project) return <Navigate to="/" replace />;
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
