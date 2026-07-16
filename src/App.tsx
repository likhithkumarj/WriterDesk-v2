import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate, useLocation } from "react-router-dom";
import { Store } from "./types/screenplay";
import { loadStore, STORAGE_KEY } from "./utils/storage";
import { LandingScreen } from "./components/screenplay/LandingScreen";
import { LoginScreen } from "./components/screenplay/LoginScreen";
import { GlobalStyles } from "./components/screenplay/GlobalStyles";
import { ProjectsPage } from "./pages/ProjectsPage";
import { FilesPage } from "./pages/FilesPage";
import { EditorPage } from "./pages/EditorPage";
import { CommunityPage } from "./pages/CommunityPage";
import { ExplorePage } from "./pages/ExplorePage";
import { MessagesPage } from "./pages/MessagesPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { OnboardingScreen } from "./components/screenplay/OnboardingScreen";
import { supabaseService } from "./utils/supabaseService";
import { Analytics } from "@vercel/analytics/react";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";

interface UserProfile {
  id?: string;
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" | "info" }[]>([]);

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const lastSyncRef = useRef<number>(0);

  const flushActivitySync = async (userId: string) => {
    const dirtyStr = localStorage.getItem(`writing_activity_dirty:${userId}`);
    if (!dirtyStr) return;
    try {
      const dirty = JSON.parse(dirtyStr);
      const entries = Object.entries(dirty).map(([date, count]) => ({
        date,
        count: count as number
      }));
      
      if (entries.length === 0) return;
      
      const res = await supabaseService.syncWritingActivityBatch(userId, entries);
      if (!res.error) {
        localStorage.removeItem(`writing_activity_dirty:${userId}`);
      }
    } catch (e) {
      console.error("Failed to flush activity sync:", e);
    }
  };

  const triggerThrottledActivitySync = (userId: string) => {
    const now = Date.now();
    if (now - lastSyncRef.current > 5 * 60 * 1000) { // 5 minutes
      lastSyncRef.current = now;
      flushActivitySync(userId);
    }
  };

  const syncAndLoadActivity = async (userId: string) => {
    try {
      const actRes = await supabaseService.fetchWritingActivity(userId);
      if (actRes?.data) {
        const dbActivities = actRes.data;
        const localStateStr = localStorage.getItem(`writing_activity:${userId}`) || "{}";
        const localState = JSON.parse(localStateStr);
        
        dbActivities.forEach((act: any) => {
          const dateStr = act.activity_date;
          const dbCount = act.activity_count || 0;
          if (!localState[dateStr] || localState[dateStr] < dbCount) {
            localState[dateStr] = dbCount;
          }
        });
        
        localStorage.setItem(`writing_activity:${userId}`, JSON.stringify(localState));
      }
    } catch (e) {
      console.error("Error loading writing activity details:", e);
    }
    await flushActivitySync(userId);
  };

  const location = useLocation();

  // Flush activity sync on route changes (editor exit)
  useEffect(() => {
    if (user?.id) {
      flushActivitySync(user.id);
    }
  }, [location.pathname, user?.id]);

  // Flush activity sync on page unload
  useEffect(() => {
    const handleUnload = () => {
      if (user?.id) {
        // Run flush synchronously or try sending it
        flushActivitySync(user.id);
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [user?.id]);

  // Check if logged-in user needs onboarding
  useEffect(() => {
    if (user?.id) {
      const onboardingCompleted = localStorage.getItem(`onboarding_completed:${user.id}`);
      if (onboardingCompleted !== "true") {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    } else {
      setShowOnboarding(false);
    }
  }, [user?.id]);
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    title: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "destructive" | "primary";
    resolve: (val: boolean) => void;
  } | null>(null);

  const addToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    // Override default alert
    window.alert = (msg: any) => {
      const messageString = typeof msg === "object" ? JSON.stringify(msg) : String(msg);
      let type: "success" | "error" | "info" = "info";
      const lower = messageString.toLowerCase();
      if (lower.includes("success") || lower.includes("saved") || lower.includes("accepted") || lower.includes("deleted file") || lower.includes("simulated") || lower.includes("sent")) {
        type = "success";
      } else if (lower.includes("error") || lower.includes("failed") || lower.includes("invalid") || lower.includes("violation") || lower.includes("missing")) {
        type = "error";
      }
      addToast(messageString, type);
    };

    // Expose a custom async confirmation popup
    (window as any).customConfirm = (message: string, title = "Confirm Action", options: any = {}) => {
      return new Promise<boolean>((resolve) => {
        setConfirmDialog({ 
          message, 
          title, 
          confirmText: options.confirmText, 
          cancelText: options.cancelText, 
          variant: options.variant, 
          resolve 
        });
      });
    };

    // Inject animation styles
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      @keyframes sp-toast-fade-in {
        from { opacity: 0; transform: translateY(12px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes sp-modal-fade-in {
        from { opacity: 0; transform: scale(0.92); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      try {
        document.head.removeChild(styleEl);
      } catch (e) {}
    };
  }, []);

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

  const handleRefreshProjects = async () => {
    const session = await supabaseService.getSession();
    if (session?.user?.id) {
      await loadData(session.user.id);
    }
  };

  useEffect(() => {
    // Check active session
    supabaseService.getSession().then(async (session) => {
      if (session?.user) {
        let dbProfile: any = null;
        try {
          const res = await supabaseService.fetchProfileById(session.user.id);
          dbProfile = res?.data;
        } catch (e) {
          console.error("Error fetching db profile:", e);
        }

        const profile = {
          id: session.user.id,
          name: dbProfile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          avatar: dbProfile?.avatar_url || session.user.user_metadata?.avatar_url || `https://api.dicebear.com/9.x/bottts/svg?seed=${session.user.email?.split("@")[0] || "User"}`,
        };
        setUser(profile);
        localStorage.setItem("writerdesk_user", JSON.stringify(profile));

        if (dbProfile?.onboarding_metadata) {
          localStorage.setItem(`onboarding_state:${session.user.id}`, JSON.stringify(dbProfile.onboarding_metadata));
          localStorage.setItem(`onboarding_completed:${session.user.id}`, "true");
        } else {
          // Silent migration check
          const localStateStr = localStorage.getItem(`onboarding_state:${session.user.id}`);
          if (localStateStr) {
            try {
              const localState = JSON.parse(localStateStr);
              supabaseService.updateProfile(session.user.id, {
                onboarding_metadata: localState
              }).catch(e => console.error("Error migrating local onboarding to DB:", e));
            } catch (e) {}
          }
        }

        syncAndLoadActivity(session.user.id).finally(() => {
          loadData(session.user.id).finally(() => setIsLoading(false));
        });
      } else {
        loadData().finally(() => setIsLoading(false));
      }
    }).catch(() => {
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabaseService.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        let dbProfile: any = null;
        try {
          const res = await supabaseService.fetchProfileById(session.user.id);
          dbProfile = res?.data;
        } catch (e) {
          console.error("Error fetching db profile on auth change:", e);
        }

        const profile = {
          id: session.user.id,
          name: dbProfile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          avatar: dbProfile?.avatar_url || session.user.user_metadata?.avatar_url || `https://api.dicebear.com/9.x/bottts/svg?seed=${session.user.email?.split("@")[0] || "User"}`,
        };
        setUser(profile);
        localStorage.setItem("writerdesk_user", JSON.stringify(profile));

        if (dbProfile?.onboarding_metadata) {
          localStorage.setItem(`onboarding_state:${session.user.id}`, JSON.stringify(dbProfile.onboarding_metadata));
          localStorage.setItem(`onboarding_completed:${session.user.id}`, "true");
        } else {
          // Silent migration check on auth changes
          const localStateStr = localStorage.getItem(`onboarding_state:${session.user.id}`);
          if (localStateStr) {
            try {
              const localState = JSON.parse(localStateStr);
              supabaseService.updateProfile(session.user.id, {
                onboarding_metadata: localState
              }).catch(e => console.error("Error migrating local onboarding to DB on auth change:", e));
            } catch (e) {}
          }
        }

        syncAndLoadActivity(session.user.id).finally(() => {
          loadData(session.user.id);
        });
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        localStorage.removeItem("writerdesk_user");
        loadData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncQueueRef = useRef<Store[]>([]);
  const isSyncingRef = useRef(false);

  const processSyncQueue = async () => {
    if (isSyncingRef.current || syncQueueRef.current.length === 0) return;
    isSyncingRef.current = true;

    try {
      while (syncQueueRef.current.length > 0) {
        // Grab the latest queued store state, discarding intermediate updates
        const targetStore = syncQueueRef.current[syncQueueRef.current.length - 1];
        syncQueueRef.current = [];

        const success = await supabaseService.syncStore(targetStore, targetStore);
        if (!success) {
          console.warn("Supabase sync failed. Falling back to local storage backup.");
          localStorage.setItem(STORAGE_KEY, JSON.stringify(targetStore));
        }
      }
    } catch (err) {
      console.error("Error syncing with Supabase, saving to local storage fallback:", err);
    } finally {
      isSyncingRef.current = false;
    }
  };

  const persist = async (newStore: Store) => {
    // 1. Optimistic update
    setStore(newStore);

    // 2. Immediate local cache write (synchronous, 0ms lag)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStore));

    // 3. Track activity
    if (user?.id) {
      const todayStr = getTodayDateString();
      try {
        const cacheStr = localStorage.getItem(`writing_activity:${user.id}`) || "{}";
        const cache = JSON.parse(cacheStr);
        cache[todayStr] = (cache[todayStr] || 0) + 1;
        localStorage.setItem(`writing_activity:${user.id}`, JSON.stringify(cache));

        const dirtyStr = localStorage.getItem(`writing_activity_dirty:${user.id}`) || "{}";
        const dirty = JSON.parse(dirtyStr);
        dirty[todayStr] = cache[todayStr];
        localStorage.setItem(`writing_activity_dirty:${user.id}`, JSON.stringify(dirty));

        triggerThrottledActivitySync(user.id);
      } catch (e) {
        console.error("Failed to update activity cache:", e);
      }
    }

    if (!supabaseService.isConfigured()) {
      return;
    }

    // 4. Queue the sync to Supabase to run sequentially
    syncQueueRef.current.push(newStore);
    processSyncQueue();
  };

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem("writerdesk_user", JSON.stringify(profile));
  };

  const handleUpdateUser = async (newUser: UserProfile) => {
    setUser(newUser);
    localStorage.setItem("writerdesk_user", JSON.stringify(newUser));
    if (supabaseService.isConfigured() && newUser.id) {
      try {
        await supabaseService.updateProfile(newUser.id, {
          full_name: newUser.name,
          avatar_url: newUser.avatar
        });
      } catch (e) {
        console.error("Error updating supabase profile:", e);
      }
    }
  };

  const handleLogout = async () => {
    if (supabaseService.isConfigured()) {
      await supabaseService.signOut();
    }
    setUser(null);
    localStorage.removeItem("writerdesk_user");
    setShowOnboarding(false);
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

  if (showOnboarding && user) {
    const defaultData = {
      displayName: user.name || "",
      roles: [],
      experienceLevel: "",
      productionHouseType: "" as const,
      productionHouseName: "",
      writeFrequency: "",
      favoriteStoryteller: ""
    };
    
    let initialData = defaultData;
    const saved = localStorage.getItem(`onboarding_state:${user.id}`);
    if (saved) {
      try {
        initialData = JSON.parse(saved);
      } catch (e) {}
    }

    return (
      <OnboardingScreen
        userId={user.id!}
        defaultName={user.name}
        initialData={initialData}
        onComplete={async (onboardingData) => {
          localStorage.setItem(`onboarding_state:${user.id}`, JSON.stringify(onboardingData));
          localStorage.setItem(`onboarding_completed:${user.id}`, "true");
          
          if (supabaseService.isConfigured() && user.id) {
            try {
              await supabaseService.updateProfile(user.id, {
                full_name: onboardingData.displayName,
                onboarding_metadata: onboardingData
              });
            } catch (e) {
              console.error("Error updating supabase profile with onboarding data:", e);
            }
          }

          if (onboardingData.displayName && onboardingData.displayName !== user.name) {
            const updatedProfile = { ...user, name: onboardingData.displayName };
            setUser(updatedProfile);
            localStorage.setItem("writerdesk_user", JSON.stringify(updatedProfile));
          }
          setShowOnboarding(false);
        }}
      />
    );
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingScreen />} />
        <Route 
          path="/login" 
          element={user ? <Navigate to="/projects" replace /> : <LoginScreen onLogin={handleLogin} />} 
        />
        <Route 
          path="/reset-password" 
          element={<ResetPasswordPage />} 
        />

        {/* Protected Routes */}
        <Route 
          path="/projects" 
          element={user ? <ProjectsRoute store={store} persist={persist} user={user} onLogout={handleLogout} onEditProfile={() => setShowOnboarding(true)} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/project/:projectId" 
          element={user ? <ProjectFilesRoute store={store} persist={persist} user={user} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/project/:projectId/file/:fileId" 
          element={user ? <EditorRoute store={store} persist={persist} user={user} /> : <Navigate to="/login" replace />} 
        />

        {/* Expanded Routes */}
        <Route 
          path="/community" 
          element={user ? <CommunityPage store={store} user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/explore" 
          element={user ? <ExplorePage store={store} user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/messages" 
          element={user ? <MessagesPage store={store} user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/notifications" 
          element={user ? <NotificationsPage store={store} user={user} onLogout={handleLogout} onRefreshProjects={handleRefreshProjects} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/settings" 
          element={user ? <SettingsPage store={store} user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/profile" 
          element={user ? <ProfilePage store={store} user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Floating Toast Notification Stack */}
      {toasts.length > 0 && (
        <div 
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            maxWidth: "calc(100% - 48px)",
            width: 360,
          }}
        >
          {toasts.map((t) => {
            const isSuccess = t.type === "success";
            const isError = t.type === "error";
            return (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: "rgba(20, 20, 22, 0.95)",
                  border: `1px solid ${isSuccess ? "rgba(16, 185, 129, 0.4)" : isError ? "rgba(239, 68, 68, 0.4)" : "rgba(255, 255, 255, 0.08)"}`,
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(8px)",
                  transform: "translateY(0)",
                  animation: "sp-toast-fade-in 0.3s ease",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ marginTop: 2 }}>
                  {isSuccess && <CheckCircle size={16} color="#10b981" />}
                  {isError && <AlertTriangle size={16} color="#ef4444" />}
                  {!isSuccess && !isError && <Info size={16} color="var(--sp-accent)" />}
                </div>
                <div style={{ flex: 1, fontSize: 13, color: "#fff", fontWeight: 500, lineHeight: 1.4 }}>
                  {t.message}
                </div>
                <button
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 2,
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Global Custom Confirmation Modal Dialog */}
      {confirmDialog && (
        <div 
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => {
            confirmDialog.resolve(false);
            setConfirmDialog(null);
          }}
        >
          <div 
            style={{
              width: "100%",
              maxWidth: 400,
              background: "rgba(20, 20, 22, 0.95)",
              border: "1px solid var(--sp-border)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
              borderRadius: 16,
              padding: 20,
              animation: "sp-modal-fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginTop: 0, marginBottom: 8 }}>
              {confirmDialog.title}
            </h3>
            <p style={{ fontSize: 13, color: "var(--sp-muted)", lineHeight: 1.5, margin: 0, marginBottom: 24 }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button 
                className="sp-btn"
                onClick={() => {
                  confirmDialog.resolve(false);
                  setConfirmDialog(null);
                }}
                style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12 }}
              >
                {confirmDialog.cancelText || "Cancel"}
              </button>
              <button 
                className={confirmDialog.variant === "destructive" ? "sp-btn" : "sp-btn sp-btn-primary"}
                onClick={() => {
                  confirmDialog.resolve(true);
                  setConfirmDialog(null);
                }}
                style={{ 
                  padding: "6px 14px", 
                  borderRadius: 8, 
                  fontSize: 12,
                  ...(confirmDialog.variant === "destructive" ? {
                    background: "#ef4444",
                    borderColor: "#ef4444",
                    color: "#fff"
                  } : {})
                }}
              >
                {confirmDialog.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Route wrappers to keep the screen components completely decoupled from React Router
function ProjectsRoute({ 
  store, 
  persist, 
  user, 
  onLogout,
  onEditProfile
}: { 
  store: Store; 
  persist: (s: Store) => void; 
  user: UserProfile; 
  onLogout: () => void;
  onEditProfile: () => void;
}) {
  const navigate = useNavigate();
  return (
    <ProjectsPage 
      store={store} 
      persist={persist} 
      openProject={(id) => navigate(`/project/${id}`)} 
      user={user}
      onLogout={onLogout}
      onEditProfile={onEditProfile}
    />
  );
}

function ProjectFilesRoute({ store, persist, user }: { store: Store; persist: (s: Store) => void; user: UserProfile }) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  
  const project = store.projects.find((p) => p.id === projectId);
  if (!project) return <Navigate to="/projects" replace />;

  return (
    <FilesPage
      project={project}
      allProjects={store.projects}
      user={user}
      back={() => navigate("/projects")}
      persist={(p) => persist({ ...store, projects: store.projects.map((x) => x.id === p.id ? p : x) })}
      openFile={(fileId) => navigate(`/project/${projectId}/file/${fileId}`)}
    />
  );
}

function EditorRoute({ store, persist, user }: { store: Store; persist: (s: Store) => void; user: UserProfile }) {
  const navigate = useNavigate();
  const { projectId, fileId } = useParams();

  const project = store.projects.find((p) => p.id === projectId);
  if (!project) return <Navigate to="/projects" replace />;
  
  // Validate the fileId exists; if not, redirect to first file
  const fileExists = project.files.some((f) => f.id === fileId);
  if (!fileExists) {
    const firstFile = project.files[0];
    if (!firstFile) return <Navigate to={`/project/${projectId}`} replace />;
    return <Navigate to={`/project/${projectId}/file/${firstFile.id}`} replace />;
  }

  return (
    // key=projectId means EditorPage stays mounted when switching files within the same project
    <EditorPage
      key={projectId}
      project={project}
      initialFileId={fileId!}
      user={user}
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
