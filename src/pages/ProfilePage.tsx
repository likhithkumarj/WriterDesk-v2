import React from "react";
import { DashboardLayout, UserProfile } from "./DashboardLayout";
import { Award, PenTool, Flame, Calendar, BookOpen, Layers, BarChart } from "lucide-react";
import { Store } from "../types/screenplay";
import { useNavigate } from "react-router-dom";

export function ProfilePage({
  store,
  user,
  onLogout,
}: {
  store: Store;
  user: UserProfile;
  onLogout: () => void;
}) {
  const navigate = useNavigate();

  // Dynamically compute real writer statistics from store
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

  return (
    <DashboardLayout title="Profile" user={user} onLogout={onLogout} projectsCount={store.projects.length}>
      <div className="sp-prof-container">
        <style dangerouslySetInnerHTML={{ __html: `
          .sp-prof-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 32px 24px;
            box-sizing: border-box;
          }

          .sp-prof-hero {
            background: linear-gradient(135deg, #1c1c20 0%, #121214 100%);
            border: 1px solid #1c1c20;
            border-radius: 16px;
            overflow: hidden;
            margin-bottom: 28px;
          }

          .sp-prof-banner {
            height: 120px;
            background: linear-gradient(90deg, var(--sp-accent) 0%, #1D4ED8 100%);
            opacity: 0.85;
          }

          .sp-prof-identity {
            display: flex;
            align-items: flex-end;
            padding: 0 32px 24px 32px;
            margin-top: -48px;
            gap: 24px;
            flex-wrap: wrap;
          }

          .sp-prof-avatar-wrap {
            border: 6px solid #08080a;
            border-radius: 50%;
            background-color: #08080a;
            line-height: 0;
          }

          .sp-prof-details {
            flex: 1;
            min-width: 250px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .sp-prof-name {
            font-size: 24px;
            font-weight: 800;
            color: #fff;
            margin: 0;
            letter-spacing: -0.01em;
          }

          .sp-prof-bio {
            font-size: 13.5px;
            color: #8e8e93;
            margin: 0;
            line-height: 1.4;
          }

          .sp-prof-meta {
            display: flex;
            gap: 16px;
            font-size: 12px;
            color: #55555d;
            font-weight: 600;
          }

          .sp-prof-meta-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .sp-prof-stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 28px;
          }

          .sp-prof-stat-card {
            background-color: #121214;
            border: 1px solid #1c1c20;
            border-radius: 12px;
            padding: 18px 20px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .sp-prof-stat-val {
            font-size: 24px;
            font-weight: 800;
            color: #fff;
          }

          .sp-prof-stat-lbl {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #8e8e93;
            letter-spacing: 0.05em;
          }

          .sp-prof-columns {
            display: flex;
            gap: 28px;
            align-items: flex-start;
          }

          .sp-prof-col-left {
            flex: 1.8;
            display: flex;
            flex-direction: column;
            gap: 16px;
            min-width: 0;
          }

          .sp-prof-col-right {
            flex: 1.1;
            display: flex;
            flex-direction: column;
            gap: 16px;
            min-width: 0;
          }

          .sp-prof-section-title {
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            color: #8e8e93;
            letter-spacing: 0.08em;
            margin: 0 0 12px 0;
          }

          .sp-prof-project-card {
            background-color: #121214;
            border: 1px solid #1c1c20;
            border-radius: 12px;
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .sp-prof-project-card:hover {
            border-color: rgba(var(--sp-accent-rgb), 0.25);
            background-color: #16161a;
          }

          .sp-prof-badge-grid {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .sp-prof-badge-card {
            background-color: #121214;
            border: 1px solid #1c1c20;
            border-radius: 12px;
            padding: 14px;
            display: flex;
            align-items: center;
            gap: 14px;
            opacity: 0.4;
            transition: all 0.15s ease;
          }

          .sp-prof-badge-card.unlocked {
            opacity: 1;
            border-color: rgba(var(--sp-accent-rgb), 0.15);
          }

          .sp-prof-badge-icon-box {
            width: 36px;
            height: 36px;
            background-color: rgba(255, 255, 255, 0.02);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #8e8e93;
            flex-shrink: 0;
          }

          .sp-prof-badge-card.unlocked .sp-prof-badge-icon-box {
            background-color: rgba(var(--sp-accent-rgb), 0.08);
            color: var(--sp-accent);
            border: 1px solid rgba(var(--sp-accent-rgb), 0.1);
          }

          .sp-prof-badge-details {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .sp-prof-badge-title {
            font-size: 13.5px;
            font-weight: 700;
            color: #fff;
          }

          .sp-prof-badge-desc {
            font-size: 11px;
            color: #8e8e93;
          }
        ` }} />

        {/* Identity Hero Panel */}
        <div className="sp-prof-hero">
          <div className="sp-prof-banner" />
          <div className="sp-prof-identity">
            <div className="sp-prof-avatar-wrap">
              <img src={user.avatar} alt={user.name} style={{ width: 80, height: 80, borderRadius: "50%" }} />
            </div>
            <div className="sp-prof-details">
              <h2 className="sp-prof-name">{user.name}</h2>
              <p className="sp-prof-bio">
                Screenwriter & storytelling developer. Working on feature screenplays and TV pilots.
              </p>
              <div className="sp-prof-meta">
                <div className="sp-prof-meta-item">
                  <Calendar size={12} />
                  <span>Joined Jan 2026</span>
                </div>
                <div className="sp-prof-meta-item">
                  <BarChart size={12} />
                  <span>Rank: Level 4 Writer</span>
                </div>
              </div>
            </div>
            <button 
              className="sp-ws-btn-share" 
              style={{ alignSelf: "center", padding: "6px 14px", borderRadius: 8 }}
              onClick={() => navigate("/settings")}
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Statistic Cards Panel */}
        <div className="sp-prof-stats-grid">
          <div className="sp-prof-stat-card">
            <span className="sp-prof-stat-val">{totalProjects}</span>
            <span className="sp-prof-stat-lbl">Projects</span>
          </div>
          <div className="sp-prof-stat-card">
            <span className="sp-prof-stat-val">{totalScripts}</span>
            <span className="sp-prof-stat-lbl">Scripts</span>
          </div>
          <div className="sp-prof-stat-card">
            <span className="sp-prof-stat-val">{totalWords.toLocaleString()}</span>
            <span className="sp-prof-stat-lbl">Words Written</span>
          </div>
          <div className="sp-prof-stat-card">
            <span className="sp-prof-stat-val">3</span>
            <span className="sp-prof-stat-lbl">Collaborations</span>
          </div>
        </div>

        {/* Column Splits */}
        <div className="sp-prof-columns">
          
          {/* Active Screenplays Directory */}
          <div className="sp-prof-col-left">
            <h3 className="sp-prof-section-title">Active Projects</h3>
            {store.projects.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px", background: "#121214", borderRadius: 12, border: "1px solid #1c1c20", color: "#8e8e93", fontSize: 13 }}>
                No active screenplays.
              </div>
            ) : (
              store.projects.map((p) => (
                <div key={p.id} className="sp-prof-project-card" onClick={() => navigate(`/project/${p.id}`)}>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 4px 0" }}>{p.title}</h4>
                    <span style={{ fontSize: 12, color: "#8e8e93" }}>
                      {p.type || "Feature Film"} • {p.files.length} script{p.files.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "#55555d", fontWeight: 600 }}>
                    Edited {getFormattedDate(p.dateModified)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Writer Milestones Achievements */}
          <div className="sp-prof-col-right">
            <h3 className="sp-prof-section-title">Writer Milestones</h3>
            <div className="sp-prof-badge-grid">
              {achievements.map((a) => {
                const Icon = a.icon;
                return (
                  <div key={a.id} className={`sp-prof-badge-card ${a.unlocked ? "unlocked" : ""}`}>
                    <div className="sp-prof-badge-icon-box">
                      <Icon size={18} />
                    </div>
                    <div className="sp-prof-badge-details">
                      <span className="sp-prof-badge-title">{a.title}</span>
                      <span className="sp-prof-badge-desc">{a.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
export default ProfilePage;
