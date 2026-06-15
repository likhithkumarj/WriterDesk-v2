import React, { useState } from "react";
import { DashboardLayout, UserProfile } from "./DashboardLayout";
import { Save, Download, ShieldAlert, Sliders, Palette, User } from "lucide-react";
import { Store } from "../types/screenplay";

export function SettingsPage({
  store,
  user,
  onLogout,
  onUpdateUser,
}: {
  store: Store;
  user: UserProfile;
  onLogout: () => void;
  onUpdateUser: (newUser: UserProfile) => void;
}) {
  const [activeTab, setActiveTab] = useState<"profile" | "appearance" | "backup">("profile");
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState("Screenwriter and storytelling explorer.");
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [selectedTheme, setSelectedTheme] = useState("Midnight Gold");
  const [zoomLevel, setZoomLevel] = useState("100%");
  
  const presetAvatars = [
    `https://api.dicebear.com/9.x/avataaars/svg?seed=Ben`,
    `https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah`,
    `https://api.dicebear.com/9.x/avataaars/svg?seed=Marco`,
    `https://api.dicebear.com/9.x/avataaars/svg?seed=Elena`,
    `https://api.dicebear.com/9.x/avataaars/svg?seed=Creative`,
    `https://api.dicebear.com/9.x/avataaars/svg?seed=Novel`,
    `https://api.dicebear.com/9.x/avataaars/svg?seed=Dreamer`,
    `https://api.dicebear.com/9.x/avataaars/svg?seed=Pro`
  ];

  const themes = ["Midnight Gold", "Cyberpunk Purple", "Forest Green", "Classic Dark"];

  const handleSaveProfile = () => {
    if (!name.trim() || !email.trim()) return;
    onUpdateUser({
      name: name.trim(),
      email: email.trim(),
      avatar: selectedAvatar
    });
    alert("Profile settings saved successfully!");
  };

  const handleExportBackup = () => {
    try {
      const dataStr = JSON.stringify(store, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'writerdesk_backup.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (e) {
      console.error(e);
      alert("Failed to export backup.");
    }
  };

  return (
    <DashboardLayout title="Settings" user={user} onLogout={onLogout} projectsCount={store.projects.length}>
      <div className="sp-set-container">
        <style dangerouslySetInnerHTML={{ __html: `
          .sp-set-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 32px 24px;
            box-sizing: border-box;
          }

          .sp-set-tabs {
            display: flex;
            border-bottom: 1px solid #1c1c20;
            gap: 28px;
            margin-bottom: 32px;
          }

          .sp-set-tab-btn {
            background: transparent;
            border: none;
            padding: 12px 4px;
            color: #8e8e93;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            position: relative;
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .sp-set-tab-btn:hover {
            color: #efeff1;
          }

          .sp-set-tab-btn.active {
            color: #E8B84B;
          }

          .sp-set-tab-btn.active::after {
            content: "";
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 2px;
            background-color: #E8B84B;
          }

          .sp-set-card {
            background-color: #121214;
            border: 1px solid #1c1c20;
            border-radius: 14px;
            padding: 28px;
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .sp-set-section-title {
            font-size: 16px;
            font-weight: 700;
            color: #fff;
            margin: 0 0 4px 0;
          }

          .sp-set-row {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .sp-set-grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }

          .sp-set-avatars-grid {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 10px;
            margin-top: 8px;
          }

          .sp-set-avatar-option {
            background: none;
            border: 2px solid transparent;
            border-radius: 50%;
            cursor: pointer;
            padding: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
          }

          .sp-set-avatar-option:hover {
            border-color: rgba(232, 184, 75, 0.4);
          }

          .sp-set-avatar-option.selected {
            border-color: #E8B84B;
          }

          .sp-set-theme-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }

          .sp-set-theme-card {
            background-color: #0c0c0e;
            border: 1px solid #1c1c20;
            border-radius: 10px;
            padding: 14px;
            cursor: pointer;
            text-align: center;
            font-size: 13px;
            font-weight: 600;
            color: #8e8e93;
            transition: all 0.15s ease;
          }

          .sp-set-theme-card:hover {
            border-color: rgba(232, 184, 75, 0.25);
            color: #efeff1;
          }

          .sp-set-theme-card.active {
            border-color: #E8B84B;
            color: #E8B84B;
            background-color: rgba(232, 184, 75, 0.04);
          }
        ` }} />

        {/* Tab Controls */}
        <div className="sp-set-tabs">
          <button 
            className={`sp-set-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <User size={14} /> Profile Settings
          </button>
          <button 
            className={`sp-set-tab-btn ${activeTab === "appearance" ? "active" : ""}`}
            onClick={() => setActiveTab("appearance")}
          >
            <Palette size={14} /> App Appearance
          </button>
          <button 
            className={`sp-set-tab-btn ${activeTab === "backup" ? "active" : ""}`}
            onClick={() => setActiveTab("backup")}
          >
            <Sliders size={14} /> Data & Sync
          </button>
        </div>

        {/* Profile Tab Panel */}
        {activeTab === "profile" && (
          <div className="sp-set-card">
            <div>
              <h3 className="sp-set-section-title">Personal Information</h3>
              <p style={{ fontSize: 12, color: "#8e8e93", margin: 0 }}>Configure how your profile card looks to the writing community.</p>
            </div>

            <div className="sp-set-grid-2">
              <div className="sp-set-row">
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93", letterSpacing: "0.05em" }}>Display Name</label>
                <input className="sp-input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="sp-set-row">
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93", letterSpacing: "0.05em" }}>Email Address</label>
                <input className="sp-input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="sp-set-row">
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93", letterSpacing: "0.05em" }}>Profile Biography</label>
              <textarea className="sp-input" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} style={{ resize: "none" }} />
            </div>

            <div className="sp-set-row">
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93", letterSpacing: "0.05em" }}>Choose Avatar Seed</label>
              <div className="sp-set-avatars-grid">
                {presetAvatars.map((avUrl) => {
                  const isSelected = selectedAvatar === avUrl;
                  return (
                    <button
                      key={avUrl}
                      className={`sp-set-avatar-option ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedAvatar(avUrl)}
                    >
                      <img src={avUrl} alt="Avatar Selection" style={{ width: 36, height: 36, borderRadius: "50%" }} />
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              className="sp-ws-btn-gold" 
              style={{ width: "fit-content", alignSelf: "flex-end", marginTop: 8 }}
              onClick={handleSaveProfile}
              disabled={!name.trim() || !email.trim()}
            >
              <Save size={14} /> Save Profile Changes
            </button>
          </div>
        )}

        {/* Appearance Tab Panel */}
        {activeTab === "appearance" && (
          <div className="sp-set-card">
            <div>
              <h3 className="sp-set-section-title">Visual Styling Preferences</h3>
              <p style={{ fontSize: 12, color: "#8e8e93", margin: 0 }}>Select customized theme schemes and default dimensions.</p>
            </div>

            <div className="sp-set-row">
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93", letterSpacing: "0.05em", marginBottom: 6 }}>Dashboard Theme</label>
              <div className="sp-set-theme-grid">
                {themes.map((t) => (
                  <div 
                    key={t}
                    className={`sp-set-theme-card ${selectedTheme === t ? "active" : ""}`}
                    onClick={() => setSelectedTheme(t)}
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>

            <div className="sp-set-grid-2">
              <div className="sp-set-row">
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93", letterSpacing: "0.05em" }}>Editor Zoom Scale</label>
                <select className="sp-input" value={zoomLevel} onChange={(e) => setZoomLevel(e.target.value)} style={{ background: "#232329", border: "1px solid #34343a", color: "#fff" }}>
                  <option value="90%">90% (Compact)</option>
                  <option value="100%">100% (Standard)</option>
                  <option value="110%">110% (Large)</option>
                  <option value="120%">120% (Extra Large)</option>
                </select>
              </div>

              <div className="sp-set-row">
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93", letterSpacing: "0.05em" }}>Auto-Save Schedulers</label>
                <select className="sp-input" style={{ background: "#232329", border: "1px solid #34343a", color: "#fff" }}>
                  <option>Every 30 seconds</option>
                  <option>Every minute</option>
                  <option>Every 5 minutes</option>
                  <option>On keystroke pause</option>
                </select>
              </div>
            </div>

            <button 
              className="sp-ws-btn-gold" 
              style={{ width: "fit-content", alignSelf: "flex-end", marginTop: 8 }}
              onClick={() => alert("Appearance styles applied!")}
            >
              <Save size={14} /> Apply Styles
            </button>
          </div>
        )}

        {/* Data Tab Panel */}
        {activeTab === "backup" && (
          <div className="sp-set-card">
            <div>
              <h3 className="sp-set-section-title">Local System Database backup</h3>
              <p style={{ fontSize: 12, color: "#8e8e93", margin: 0 }}>Securely download backups or configure reset options.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: 10, background: "#1a1a1f", border: "1px solid #282830" }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", display: "block" }}>Backup Local Workspace</span>
                  <span style={{ fontSize: 12, color: "#8e8e93" }}>Export all projects and files as a single JSON file.</span>
                </div>
                <button className="sp-ws-btn-share" onClick={handleExportBackup} style={{ display: "flex", gap: 6 }}>
                  <Download size={14} /> Export Backup
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: 10, background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#ef4444", display: "block" }}>Danger Zone: Reset Application</span>
                  <span style={{ fontSize: 12, color: "#8e8e93" }}>Delete all local cached screenplays. This action is irreversible.</span>
                </div>
                <button 
                  className="sp-btn" 
                  onClick={() => {
                    if (window.confirm("WARNING: Are you absolutely sure you want to delete all projects and local storage? This cannot be undone.")) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  style={{ borderColor: "#ef4444", color: "#ef4444", display: "flex", gap: 6 }}
                >
                  <ShieldAlert size={14} /> Clear Cache
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
export default SettingsPage;
