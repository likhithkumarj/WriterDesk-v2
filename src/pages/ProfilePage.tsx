import React, { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { 
  Award, 
  PenTool, 
  Flame, 
  Calendar, 
  BookOpen, 
  Layers, 
  Building,
  Briefcase,
  Clock,
  Heart,
  Mail,
  Link as LinkIcon,
  Folder,
  ChevronRight,
  Star,
  Sparkles,
  Edit2,
  Plus
} from "lucide-react";
import { Store } from "../types/screenplay";
import { useNavigate } from "react-router-dom";
import { ActivityCalendar } from "../components/screenplay/ActivityCalendar";

export function ProfilePage({
  store,
  user,
  onLogout,
}: {
  store: Store;
  user: { id?: string; name: string; email: string; avatar: string };
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "achievements">("overview");
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const completed = localStorage.getItem(`onboarding_completed:${user.id}`);
    if (completed === "true") {
      const saved = localStorage.getItem(`onboarding_state:${user.id}`);
      if (saved) {
        try {
          const profile = JSON.parse(saved);
          const hasEmptyField = 
            !profile.roles || profile.roles.length === 0 || 
            !profile.experienceLevel || 
            !profile.productionHouseType || 
            !profile.writeFrequency || 
            !profile.favoriteStoryteller;
          setProfileIncomplete(hasEmptyField);
        } catch (e) {
          setProfileIncomplete(true);
        }
      } else {
        setProfileIncomplete(true);
      }
    } else {
      setProfileIncomplete(true);
    }
  }, [user?.id]);

  // Load onboarding data from local storage
  const onboardingData = useMemo(() => {
    const saved = localStorage.getItem(`onboarding_state:${user.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  }, [user.id]);

  // Compute dynamic biography
  const dynamicBio = useMemo(() => {
    if (!onboardingData) return "Screenwriter & storytelling developer. Working on feature screenplays and TV pilots.";
    
    const roleText = onboardingData.roles?.length > 0 
      ? onboardingData.roles.join(" / ") 
      : "Storyteller";
      
    const expText = onboardingData.experienceLevel 
      ? `(${onboardingData.experienceLevel})` 
      : "";
      
    const houseText = onboardingData.productionHouseType === "studio" && onboardingData.productionHouseName
      ? `at ${onboardingData.productionHouseName}`
      : onboardingData.productionHouseType === "independent"
        ? "as an Independent Creator"
        : "";
        
    const tellerText = onboardingData.favoriteStoryteller
      ? ` inspired by ${onboardingData.favoriteStoryteller}`
      : "";
      
    return `${roleText} ${expText} ${houseText}${tellerText}. Planning to write ${onboardingData.writeFrequency?.toLowerCase() || "regularly"}.`;
  }, [onboardingData]);

  // Calculate statistics
  const totalProjects = store.projects.length;
  const totalScripts = store.projects.reduce((sum, p) => sum + p.files.length, 0);
  
  const totalWords = store.projects.reduce((sum, p) => 
    sum + p.files.reduce((fSum, f) => 
      fSum + f.blocks.reduce((bSum, b) => {
        const words = b.text ? b.text.trim().split(/\s+/).filter(Boolean).length : 0;
        return bSum + words;
      }, 0)
    , 0)
  , 0);

  const getFormattedDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Predefined achievements milestones
  const achievements = [
    { id: "a-1", title: "Prolific Wordsmith", desc: "Write over 100 words across all scripts", unlocked: totalWords > 100, icon: PenTool },
    { id: "a-2", title: "Archive Architect", desc: "Create 3 or more active screenplays", unlocked: totalProjects >= 3, icon: Layers },
    { id: "a-3", title: "Late Night Thinker", desc: "Write scripts during post-midnight sessions", unlocked: true, icon: Flame },
    { id: "a-4", title: "Collaborator Star", desc: "Invite co-writers to work on drafts", unlocked: true, icon: Award }
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;



  return (
    <DashboardLayout title="Profile" user={user} onLogout={onLogout} projectsCount={store.projects.length}>
      <div className="sp-wd-container">
        
        {/* Style block */}
        <style dangerouslySetInnerHTML={{ __html: `
          .sp-wd-container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 32px 24px;
            box-sizing: border-box;
            font-family: 'Outfit', sans-serif;
            color: #efeff1;
          }

          .sp-db-top-widgets-row {
            display: grid;
            grid-template-columns: 1fr max-content;
            gap: 16px;
            width: 100%;
            margin-bottom: 24px;
            align-items: stretch;
          }
          @media (max-width: 768px) {
            .sp-db-top-widgets-row {
              grid-template-columns: 1fr;
            }
          }

          .sp-db-warning-widget {
            flex: 1;
            min-width: 260px;
            border: 1px solid rgba(245, 158, 11, 0.2);
            border-radius: 16px;
            padding: 16px 20px;
            background: rgba(245, 158, 11, 0.04);
            backdrop-filter: blur(8px);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .sp-db-calendar-widget {
            flex-shrink: 0;
          }

          /* Banner Card Styles */
          .sp-db-banner {
            background: var(--sp-accent);
            border-radius: 16px;
            padding: 28px 36px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 24px;
            color: #0f0f11;
            box-sizing: border-box;
          }
          .sp-db-banner-text {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .sp-db-banner-subtitle {
            font-size: 11px;
            font-weight: 700;
            color: #3b2803;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          .sp-db-banner-title {
            font-size: 26px;
            font-weight: 800;
            color: #0f0f11;
            margin: 0;
            letter-spacing: -0.01em;
          }
          .sp-db-banner-desc {
            font-size: 14px;
            color: #3b2803;
            margin: 0;
            font-weight: 500;
          }
          .sp-db-banner-buttons {
            display: flex;
            gap: 12px;
          }
          .sp-db-btn-black {
            background: #0f0f11;
            border: 1px solid #0f0f11;
            color: var(--sp-accent);
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 13.5px;
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .sp-db-btn-black:hover {
            background: #1c1c20;
            border-color: #1c1c20;
          }

          .sp-db-banner.sp-db-banner-compact {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 14px 20px;
            gap: 16px;
            box-sizing: border-box;
            width: 100%;
          }
          @media (max-width: 580px) {
            .sp-db-banner.sp-db-banner-compact {
              flex-direction: column;
              align-items: flex-start;
              gap: 12px;
            }
          }
          .sp-db-banner.sp-db-banner-compact .sp-db-banner-title {
            font-size: 17px;
          }
          .sp-db-banner.sp-db-banner-compact .sp-db-banner-desc {
            font-size: 11.5px;
            line-height: 1.35;
          }
          .sp-db-banner.sp-db-banner-compact .sp-db-btn-black {
            padding: 6px 12px;
            font-size: 12px;
          }

          .sp-wd-layout {
            display: grid;
            grid-template-columns: 280px 1fr;
            gap: 40px;
          }

          /* Left Column - Sidebar card with glassmorphism */
          .sp-wd-sidebar {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .sp-wd-profile-card {
            background: linear-gradient(135deg, rgba(20, 20, 22, 0.6) 0%, rgba(12, 12, 14, 0.8) 100%);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 24px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(12px);
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .sp-wd-avatar-container {
            position: relative;
            width: 120px;
            height: 120px;
            margin-bottom: 16px;
            border-radius: 50%;
            padding: 4px;
            background: linear-gradient(135deg, var(--sp-accent) 0%, #7c3aed 100%);
            box-shadow: 0 8px 24px rgba(245, 158, 11, 0.15);
          }

          .sp-wd-avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #08080a;
          }

          .sp-wd-name {
            font-size: 22px;
            font-weight: 800;
            color: #fff;
            margin: 0 0 4px 0;
            letter-spacing: -0.01em;
          }

          .sp-wd-username {
            font-size: 13px;
            font-weight: 500;
            color: #8e8e93;
            margin: 0 0 20px 0;
          }

          .sp-wd-edit-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 10px 16px;
            font-size: 13px;
            font-weight: 700;
            color: var(--sp-accent);
            background-color: rgba(245, 158, 11, 0.05);
            border: 1px solid rgba(245, 158, 11, 0.2);
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .sp-wd-edit-btn:hover {
            background-color: rgba(245, 158, 11, 0.1);
            border-color: var(--sp-accent);
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.08);
          }

          .sp-wd-bio {
            font-size: 13.5px;
            line-height: 1.5;
            color: #c9d1d9;
            margin: 20px 0;
            text-align: left;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 16px;
          }

          .sp-wd-meta-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 100%;
            text-align: left;
          }

          .sp-wd-meta-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            font-size: 13.5px;
            color: #efeff1;
          }

          .sp-wd-meta-icon {
            color: var(--sp-accent);
            margin-top: 2px;
            flex-shrink: 0;
          }

          .sp-wd-meta-item strong {
            color: #fff;
            font-weight: 600;
          }

          /* Right Column - Main Area */
          .sp-wd-main {
            display: flex;
            flex-direction: column;
            gap: 28px;
            min-width: 0;
          }

          /* Header Tabs styled with custom glass look */
          .sp-wd-tabs {
            display: flex;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.04);
            border-radius: 12px;
            padding: 6px;
            gap: 6px;
          }

          .sp-wd-tab-btn {
            background: transparent;
            border: none;
            padding: 10px 20px;
            font-family: 'Outfit', sans-serif;
            font-size: 13.5px;
            font-weight: 700;
            color: #8e8e93;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            border-radius: 8px;
            transition: all 0.2s ease;
          }

          .sp-wd-tab-btn:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.03);
          }

          .sp-wd-tab-btn.active {
            background: #1c1c20;
            color: var(--sp-accent);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .sp-wd-counter {
            background-color: rgba(245, 158, 11, 0.1);
            color: var(--sp-accent);
            border: 1px solid rgba(245, 158, 11, 0.15);
            font-size: 11px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
          }

          /* Grid layout for featured overview screenplays */
          .sp-wd-pinned-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }

          .sp-wd-project-card {
            background: rgba(20, 20, 22, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.04);
            border-radius: 14px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 140px;
            box-sizing: border-box;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .sp-wd-project-card:hover {
            border-color: rgba(245, 158, 11, 0.25);
            transform: translateY(-2px);
            background: rgba(255, 255, 255, 0.02);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          }

          .sp-wd-project-top {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .sp-wd-project-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }

          .sp-wd-project-name {
            font-size: 15px;
            font-weight: 700;
            color: #fff;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .sp-wd-project-badge {
            font-size: 10px;
            font-weight: 700;
            color: #8e8e93;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 2px 8px;
            background: rgba(255, 255, 255, 0.01);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .sp-wd-project-desc {
            font-size: 12.5px;
            color: #8e8e93;
            margin: 0;
            line-height: 1.5;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .sp-wd-project-bottom {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
            color: #55555d;
            margin-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.03);
            padding-top: 12px;
          }

          .sp-wd-project-lang {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #8e8e93;
            font-weight: 600;
          }

          .sp-wd-lang-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--sp-accent);
          }



          /* Projects List Tab */
          .sp-wd-projects-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .sp-wd-project-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background: rgba(20, 20, 22, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.04);
            border-radius: 14px;
            gap: 20px;
            transition: all 0.2s ease;
          }

          .sp-wd-project-row:hover {
            border-color: rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.01);
          }

          .sp-wd-row-title-wrap {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 6px;
          }

          .sp-wd-row-title {
            font-size: 18px;
            font-weight: 700;
            color: #fff;
            margin: 0;
            cursor: pointer;
            transition: color 0.15s ease;
          }

          .sp-wd-row-title:hover {
            color: var(--sp-accent);
          }

          /* Achievements Grid */
          .sp-wd-achievements-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }

          .sp-wd-achievement-card {
            background: rgba(20, 20, 22, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.04);
            border-radius: 16px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 20px;
            opacity: 0.45;
            transition: all 0.2s ease;
          }

          .sp-wd-achievement-card.unlocked {
            opacity: 1;
            border-color: rgba(245, 158, 11, 0.2);
            background: linear-gradient(135deg, rgba(20, 20, 22, 0.5) 0%, rgba(245, 158, 11, 0.02) 100%);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          }

          .sp-wd-achievement-icon-box {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background-color: rgba(255, 255, 255, 0.01);
            border: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #8e8e93;
            flex-shrink: 0;
          }

          .sp-wd-achievement-card.unlocked .sp-wd-achievement-icon-box {
            background-color: rgba(245, 158, 11, 0.08);
            border-color: rgba(245, 158, 11, 0.15);
            color: var(--sp-accent);
          }

          .sp-wd-achievement-details {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .sp-wd-achievement-title {
            font-size: 15px;
            font-weight: 700;
            color: #fff;
            margin: 0;
          }

          .sp-wd-achievement-desc {
            font-size: 12.5px;
            color: #8e8e93;
            margin: 0;
            line-height: 1.45;
          }

          /* Responsive Tweaks */
          @media (max-width: 850px) {
            .sp-wd-layout {
              grid-template-columns: 1fr;
              gap: 32px;
            }
            .sp-wd-sidebar {
              width: 100%;
            }
            .sp-wd-profile-card {
              max-width: 400px;
              margin: 0 auto;
              width: 100%;
            }
            .sp-wd-pinned-grid {
              grid-template-columns: 1fr;
            }
            .sp-wd-achievements-grid {
              grid-template-columns: 1fr;
            }
          }
        ` }} />

        {/* Outer Layout wrapper */}
        <div className="sp-wd-layout">
          
          {/* Sidebar - Profile details column */}
          <div className="sp-wd-sidebar">
            <div className="sp-wd-profile-card">
              <div className="sp-wd-avatar-container">
                <img className="sp-wd-avatar" src={user.avatar} alt={user.name} />
              </div>

              <h1 className="sp-wd-name">{user.name}</h1>
              <h2 className="sp-wd-username">@{user.email?.split("@")[0] || "writer"}</h2>

              <button 
                className="sp-wd-edit-btn"
                onClick={() => navigate("/settings")}
              >
                <Edit2 size={13} /> Edit Profile
              </button>

              <p className="sp-wd-bio">{dynamicBio}</p>

              <ul className="sp-wd-meta-list">
                {onboardingData?.roles && onboardingData.roles.length > 0 && (
                  <li className="sp-wd-meta-item">
                    <Briefcase size={16} className="sp-wd-meta-icon" />
                    <span>Roles: <strong>{onboardingData.roles.join(", ")}</strong></span>
                  </li>
                )}
                {onboardingData?.experienceLevel && (
                  <li className="sp-wd-meta-item">
                    <Award size={16} className="sp-wd-meta-icon" />
                    <span>Exp: <strong>{onboardingData.experienceLevel}</strong></span>
                  </li>
                )}
                {onboardingData?.productionHouseType && (
                  <li className="sp-wd-meta-item">
                    <Building size={16} className="sp-wd-meta-icon" />
                    <span>
                      Affiliation: <strong>
                        {onboardingData.productionHouseType === "studio" 
                          ? onboardingData.productionHouseName || "Production Studio" 
                          : "Independent Writer"}
                      </strong>
                    </span>
                  </li>
                )}
                {onboardingData?.writeFrequency && (
                  <li className="sp-wd-meta-item">
                    <Clock size={16} className="sp-wd-meta-icon" />
                    <span>Schedule: <strong>{onboardingData.writeFrequency}</strong></span>
                  </li>
                )}
                {onboardingData?.favoriteStoryteller && (
                  <li className="sp-wd-meta-item">
                    <Heart size={16} className="sp-wd-meta-icon" />
                    <span>Influence: <strong>{onboardingData.favoriteStoryteller}</strong></span>
                  </li>
                )}
                <li className="sp-wd-meta-item" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: 16, marginTop: 4 }}>
                  <Calendar size={16} className="sp-wd-meta-icon" />
                  <span>Member since <strong>Jan 2026</strong></span>
                </li>
              </ul>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="sp-wd-main">
            
            {/* Tabs Navigation Bar */}
            <div className="sp-wd-tabs">
              <button 
                onClick={() => setActiveTab("overview")} 
                className={`sp-wd-tab-btn ${activeTab === "overview" ? "active" : ""}`}
              >
                <BookOpen size={16} /> Overview
              </button>
              
              <button 
                onClick={() => setActiveTab("projects")} 
                className={`sp-wd-tab-btn ${activeTab === "projects" ? "active" : ""}`}
              >
                <Folder size={16} /> Projects 
                <span className="sp-wd-counter">{totalProjects}</span>
              </button>
              
              <button 
                onClick={() => setActiveTab("achievements")} 
                className={`sp-wd-tab-btn ${activeTab === "achievements" ? "active" : ""}`}
              >
                <Award size={16} /> Milestones 
                <span className="sp-wd-counter">{unlockedCount}</span>
              </button>
            </div>

            {/* Render Overview Content Tab */}
            {activeTab === "overview" && (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {profileIncomplete && (
                  <div style={{ 
                    padding: "12px 18px", 
                    borderRadius: 12, 
                    border: "1px solid rgba(245, 158, 11, 0.4)", 
                    background: "rgba(245, 158, 11, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600 }}>⚠️ Incomplete Profile</span>
                      <span style={{ fontSize: 13, color: "#fff" }}>
                        Complete your creative roles and writing habits to unlock full customizations!
                      </span>
                    </div>
                    <button 
                      className="sp-ws-btn-gold" 
                      style={{ padding: "6px 14px", fontSize: 12, background: "var(--sp-accent)", color: "#000" }} 
                      onClick={() => navigate("/settings")}
                    >
                      Complete Profile
                    </button>
                  </div>
                )}

                <div>
                  <h3 className="sp-prof-section-title" style={{ marginBottom: 16 }}>Pinned Projects</h3>
                  
                  {store.projects.length === 0 ? (
                    <div style={{ padding: "32px 16px", border: "1px dashed rgba(255, 255, 255, 0.06)", borderRadius: 14, textAlign: "center", color: "#8e8e93", background: "rgba(20, 20, 22, 0.2)" }}>
                      No screenplays pinned yet. Create a project to pin it here.
                    </div>
                  ) : (
                    <div className="sp-wd-pinned-grid">
                      {store.projects.slice(0, 4).map((p) => (
                        <div key={p.id} className="sp-wd-project-card" onClick={() => navigate(`/project/${p.id}`)}>
                          <div className="sp-wd-project-top">
                            <div className="sp-wd-project-header">
                              <h4 className="sp-wd-project-name">
                                <Folder size={14} style={{ color: "var(--sp-accent)" }} />
                                {p.title}
                              </h4>
                              <span className="sp-wd-project-badge">Private</span>
                            </div>
                            <p className="sp-wd-project-desc">
                              {p.description || `A premium ${p.genre || "Drama"} ${p.type || "Feature Film"} screenplay written on WriterDesk.`}
                            </p>
                          </div>
                          <div className="sp-wd-project-bottom">
                            <span className="sp-wd-project-lang">
                              <span className="sp-wd-lang-dot" />
                              {p.type || "Screenplay"}
                            </span>
                            <span style={{ fontSize: 11 }}>Updated {getFormattedDate(p.dateModified)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Start Writing & Activity Calendar Row */}
                <div className="sp-db-top-widgets-row">
                  <div className="sp-db-banner sp-db-banner-compact animate-fade-in">
                    <div className="sp-db-banner-text">
                      <span className="sp-db-banner-subtitle">START WRITING</span>
                      <h2 className="sp-db-banner-title">Create a New Project</h2>
                      <p className="sp-db-banner-desc">Bring your story to life - start a blank screenplay today</p>
                    </div>
                    <div className="sp-db-banner-buttons">
                      <button className="sp-db-btn-black" onClick={() => navigate("/projects")}>
                        <Plus size={14} /> New Project
                      </button>
                    </div>
                  </div>

                  {user?.id && (
                    <div className="sp-db-calendar-widget">
                      <ActivityCalendar userId={user.id} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Render Projects List Content Tab */}
            {activeTab === "projects" && (
              <div className="sp-wd-projects-list animate-fade-in">
                {store.projects.length === 0 ? (
                  <div style={{ padding: "48px 16px", textAlign: "center", color: "#8e8e93" }}>
                    You don't have any projects in your workspace.
                  </div>
                ) : (
                  store.projects.map((p) => (
                    <div key={p.id} className="sp-wd-project-row">
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                        <div className="sp-wd-row-title-wrap">
                          <h3 className="sp-wd-row-title" onClick={() => navigate(`/project/${p.id}`)}>
                            {p.title}
                          </h3>
                          <span className="sp-wd-project-badge">Private</span>
                        </div>
                        <p style={{ fontSize: 13.5, color: "#8e8e93", margin: 0, lineHeight: 1.45 }}>
                          {p.description || `Creative ${p.genre || "Drama"} draft containing ${p.files.length} document files.`}
                        </p>
                        <div className="sp-wd-project-bottom" style={{ marginTop: 8, border: "none", paddingTop: 0 }}>
                          <span className="sp-wd-project-lang">
                            <span className="sp-wd-lang-dot" />
                            {p.type || "Screenplay"}
                          </span>
                          <span style={{ marginLeft: 16 }}>{p.files.length} script files</span>
                          <span style={{ marginLeft: 16 }}>Updated {getFormattedDate(p.dateModified)}</span>
                        </div>
                      </div>
                      
                      <button 
                        className="sp-wd-edit-btn" 
                        style={{ width: "auto", fontSize: 12, padding: "8px 16px" }}
                        onClick={() => navigate(`/project/${p.id}`)}
                      >
                        Open
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Render Achievements Content Tab */}
            {activeTab === "achievements" && (
              <div className="sp-wd-achievements-grid animate-fade-in">
                {achievements.map((a) => {
                  const Icon = a.icon;
                  return (
                    <div key={a.id} className={`sp-wd-achievement-card ${a.unlocked ? "unlocked" : ""}`}>
                      <div className="sp-wd-achievement-icon-box">
                        <Icon size={24} />
                      </div>
                      <div className="sp-wd-achievement-details">
                        <h4 className="sp-wd-achievement-title">
                          {a.title}
                          {a.unlocked && <Sparkles size={14} style={{ color: "var(--sp-accent)", display: "inline", marginLeft: 6 }} />}
                        </h4>
                        <p className="sp-wd-achievement-desc">{a.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
export default ProfilePage;
