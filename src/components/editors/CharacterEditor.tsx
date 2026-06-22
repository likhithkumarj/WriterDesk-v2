import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, Plus, Search, Trash2, Save, Check, Grid, 
  FileText, User, Award, EyeOff, ShieldAlert, Zap, BookOpen, Users, Compass 
} from "lucide-react";
import { Project, FileDoc, CharacterRecord } from "../../types/screenplay";

interface CharacterEditorProps {
  project: Project;
  file: FileDoc;
  user: { name: string; email: string; avatar: string };
  back: () => void;
  persistFile: (f: FileDoc) => void;
}

export function CharacterEditor({
  project,
  file,
  user,
  back,
  persistFile,
}: CharacterEditorProps) {
  const [characters, setCharacters] = useState<CharacterRecord[]>(file.characters || []);
  const [selectedId, setSelectedId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"details" | "comparison">("details");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceTimer = useRef<any>(null);

  // Select first character by default if available
  useEffect(() => {
    const fileChars = file.characters || [];
    setCharacters(fileChars);
    if (fileChars.length > 0 && !selectedId) {
      setSelectedId(fileChars[0].id);
    }
  }, [file.id]);

  // Debounced auto-save handler
  const triggerSave = (updatedChars: CharacterRecord[]) => {
    setSaveStatus("saving");
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      // Calculate approximate word count across all fields of all characters
      let totalWords = 0;
      updatedChars.forEach((c) => {
        const textSum = [
          c.name, c.role, c.personality, c.goals, c.fears, 
          c.motivations, c.backstory, c.relationships, c.actions, c.summary
        ].join(" ");
        totalWords += textSum.split(/\s+/).filter(Boolean).length;
      });

      const updatedFile: FileDoc = {
        ...file,
        characters: updatedChars,
        dateModified: Date.now(),
        wordCount: totalWords,
      };

      persistFile(updatedFile);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 1000);
  };

  const handleAddCharacter = () => {
    const newChar: CharacterRecord = {
      id: "char_" + Date.now() + Math.random().toString(36).substring(2, 5),
      name: "New Character",
      role: "Protagonist",
      personality: "",
      goals: "",
      fears: "",
      motivations: "",
      backstory: "",
      relationships: "",
      actions: "",
      summary: "",
    };

    const newChars = [...characters, newChar];
    setCharacters(newChars);
    setSelectedId(newChar.id);
    triggerSave(newChars);
  };

  const handleDeleteCharacter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this character?")) return;

    const newChars = characters.filter((c) => c.id !== id);
    setCharacters(newChars);

    if (selectedId === id) {
      setSelectedId(newChars.length > 0 ? newChars[0].id : "");
    }
    triggerSave(newChars);
  };

  const handleUpdateField = (charId: string, field: keyof CharacterRecord, value: string) => {
    const newChars = characters.map((c) => {
      if (c.id === charId) {
        return { ...c, [field]: value };
      }
      return c;
    });
    setCharacters(newChars);
    triggerSave(newChars);
  };

  const selectedChar = characters.find((c) => c.id === selectedId);

  // Filtered characters list
  const filteredCharacters = characters.filter((c) => {
    const query = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.role.toLowerCase().includes(query) ||
      c.summary.toLowerCase().includes(query)
    );
  });

  // Analytics Metrics
  const protagonistsCount = characters.filter((c) => c.role.toLowerCase().includes("protagonist")).length;
  const antagonistsCount = characters.filter((c) => c.role.toLowerCase().includes("antagonist")).length;
  const supportingCount = characters.length - protagonistsCount - antagonistsCount;

  // Attributes list for side-by-side comparison matrix
  const attributes: { key: keyof CharacterRecord; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: "role", label: "Archetype / Role", desc: "Their narrative function (e.g. Protagonist, Mentor)", icon: <Award size={14} /> },
    { key: "summary", label: "Quick Summary", desc: "Short logline of who they are in the story", icon: <BookOpen size={14} /> },
    { key: "personality", label: "Personality Traits", desc: "Strengths, weaknesses, habits, temperament", icon: <Zap size={14} /> },
    { key: "goals", label: "Core Goals", desc: "What do they consciously want to achieve?", icon: <Compass size={14} /> },
    { key: "fears", label: "Core Fears", desc: "What terrifies them? What are they running from?", icon: <ShieldAlert size={14} /> },
    { key: "motivations", label: "Motivations", desc: "Why do they want what they want?", icon: <Users size={14} /> },
    { key: "backstory", label: "Backstory", desc: "Past events shaping their current behavior", icon: <FileText size={14} /> },
    { key: "relationships", label: "Relationships", desc: "Dynamic with other characters in the story", icon: <Users size={14} /> },
    { key: "actions", label: "Significant Actions", desc: "Critical choices they make in the narrative", icon: <User size={14} /> },
  ];

  return (
    <div className="sp-char-container">
      <style dangerouslySetInnerHTML={{
        __html: `
        .sp-char-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background-color: #08080a;
          color: #efeff1;
          font-family: 'Outfit', sans-serif;
        }

        .sp-char-navbar {
          height: 56px;
          background-color: #0f0f11;
          border-bottom: 1px solid #18181c;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          flex-shrink: 0;
        }

        .sp-char-navbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .sp-char-navbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Metrics Row */
        .sp-char-metrics-row {
          background-color: #121214;
          border-bottom: 1px solid #1c1c20;
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 10px 20px;
          flex-shrink: 0;
          overflow-x: auto;
        }

        .sp-char-metric-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .sp-char-metric-label {
          color: #8e8e93;
        }

        .sp-char-metric-value {
          color: #E8B84B;
          font-weight: 700;
          background: rgba(232, 184, 75, 0.08);
          padding: 2px 8px;
          border-radius: 6px;
          border: 1px solid rgba(232, 184, 75, 0.15);
        }

        /* Workspace Grid */
        .sp-char-workspace {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        /* Left Character Sidebar */
        .sp-char-sidebar {
          width: 280px;
          background-color: #0d0d10;
          border-right: 1px solid #18181c;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .sp-char-sidebar-search {
          padding: 16px;
          border-bottom: 1px solid #18181c;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sp-char-search-box {
          position: relative;
          width: 100%;
        }

        .sp-char-search-box input {
          width: 100%;
          background: #141418;
          border: 1px solid #232329;
          border-radius: 8px;
          color: #fff;
          padding: 8px 12px 8px 32px;
          font-size: 13px;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }

        .sp-char-search-box input:focus {
          border-color: #E8B84B;
          box-shadow: 0 0 0 2px rgba(232, 184, 75, 0.1);
        }

        .sp-char-search-box svg {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #8e8e93;
        }

        .sp-char-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .sp-char-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          border-radius: 10px;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          margin-bottom: 6px;
          transition: all 0.15s ease;
        }

        .sp-char-item:hover {
          background: rgba(255, 255, 255, 0.02);
          border-color: #1c1c20;
        }

        .sp-char-item.active {
          background: rgba(232, 184, 75, 0.06);
          border-color: rgba(232, 184, 75, 0.2);
          border-left: 3px solid #E8B84B;
          border-top-left-radius: 3px;
          border-bottom-left-radius: 3px;
        }

        .sp-char-item-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .sp-char-item-name {
          font-weight: 600;
          font-size: 14px;
          color: #fff;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .sp-char-item-role {
          font-size: 11px;
          color: #8e8e93;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .sp-char-item.active .sp-char-item-role {
          color: #E8B84B;
        }

        .sp-char-delete-btn {
          color: #8e8e93;
          background: transparent;
          border: none;
          cursor: pointer;
          opacity: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.15s ease;
        }

        .sp-char-item:hover .sp-char-delete-btn {
          opacity: 1;
        }

        .sp-char-delete-btn:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        /* Right Content Panel */
        .sp-char-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-color: #08080a;
        }

        .sp-char-main-header {
          padding: 16px 24px;
          border-bottom: 1px solid #18181c;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .sp-char-mode-selector {
          display: flex;
          background: #121214;
          border: 1px solid #232329;
          padding: 2px;
          border-radius: 8px;
        }

        .sp-char-mode-btn {
          background: transparent;
          border: none;
          color: #8e8e93;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
        }

        .sp-char-mode-btn.active {
          background: #232329;
          color: #fff;
        }

        .sp-char-content-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        /* Card Worksheet View */
        .sp-char-worksheet-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 900px;
          margin: 0 auto;
        }

        .sp-char-header-section {
          background: #0f0f11;
          border: 1px solid #18181c;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          gap: 16px;
        }

        .sp-char-avatar-box {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          background: rgba(232, 184, 75, 0.06);
          border: 1px dashed rgba(232, 184, 75, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #E8B84B;
          flex-shrink: 0;
        }

        .sp-char-header-inputs {
          display: flex;
          flex: 1;
          gap: 16px;
        }

        .sp-char-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .sp-char-field-group label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #8e8e93;
          letter-spacing: 0.05em;
        }

        .sp-char-header-inputs input {
          background: #141418;
          border: 1px solid #232329;
          border-radius: 8px;
          color: #fff;
          padding: 10px 14px;
          font-size: 14px;
          outline: none;
          width: 100%;
          box-sizing: border-box;
        }

        .sp-char-header-inputs input:focus {
          border-color: #E8B84B;
        }

        .sp-char-worksheet-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .sp-char-card {
          background: #0f0f11;
          border: 1px solid #1c1c20;
          border-radius: 12px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color 0.2s ease;
        }

        .sp-char-card:hover {
          border-color: #2c2c35;
        }

        .sp-char-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          color: #E8B84B;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #1c1c20;
          padding-bottom: 8px;
        }

        .sp-char-card textarea {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid transparent;
          border-radius: 6px;
          color: #d1d1d6;
          padding: 8px;
          font-size: 13px;
          line-height: 1.5;
          min-height: 90px;
          resize: vertical;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .sp-char-card textarea:focus {
          background: #141418;
          border-color: #232329;
          color: #fff;
        }

        .sp-char-full-width {
          grid-column: span 2;
        }

        /* Comparison Matrix Table */
        .sp-char-matrix-wrapper {
          width: 100%;
          overflow-x: auto;
          background: #0f0f11;
          border: 1px solid #18181c;
          border-radius: 12px;
        }

        .sp-char-matrix-table {
          width: max-content;
          min-width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .sp-char-matrix-table th, 
        .sp-char-matrix-table td {
          border: 1px solid #1c1c20;
          padding: 12px 16px;
          font-size: 13px;
          vertical-align: top;
          width: 260px;
          box-sizing: border-box;
        }

        .sp-char-matrix-table th {
          background: #121214;
          text-align: left;
          color: #fff;
          font-weight: 700;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .sp-char-matrix-table th.label-col,
        .sp-char-matrix-table td.label-col {
          width: 180px;
          background: #0d0d10;
          position: sticky;
          left: 0;
          z-index: 20;
          border-right: 2px solid #232329;
          font-weight: 600;
          color: #8e8e93;
        }

        .sp-char-matrix-table th.label-col {
          z-index: 30;
          color: #fff;
        }

        .sp-char-matrix-cell-edit {
          width: 100%;
          min-height: 80px;
          background: transparent;
          border: none;
          color: #d1d1d6;
          font-size: 13px;
          line-height: 1.4;
          resize: none;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
        }

        .sp-char-matrix-cell-edit:focus {
          color: #fff;
        }

        .sp-char-matrix-name-row {
          font-size: 15px;
          font-weight: 800;
          color: #E8B84B;
        }

        .sp-char-matrix-tag {
          font-size: 10px;
          background: rgba(232, 184, 75, 0.08);
          color: #E8B84B;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          margin-top: 4px;
          display: inline-block;
        }

        /* Empty State */
        .sp-char-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 16px;
          color: #8e8e93;
        }

        .sp-char-empty-title {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
        }

        /* Responsive Mobile Styles overrides */
        @media (max-width: 768px) {
          .sp-char-workspace {
            flex-direction: column;
            overflow-y: auto;
          }
          .sp-char-sidebar {
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid #18181c;
          }
          .sp-char-worksheet-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .sp-char-full-width {
            grid-column: span 1;
          }
          .sp-char-header-section {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .sp-char-header-inputs {
            flex-direction: column;
            width: 100%;
          }
          .sp-char-main-header {
            flex-direction: column;
            gap: 12px;
            padding: 12px;
            align-items: stretch;
            text-align: center;
          }
          .sp-char-mode-selector {
            width: 100%;
          }
          .sp-char-mode-btn {
            flex: 1;
            justify-content: center;
          }
        }
        ` }} />

      {/* Main Navbar */}
      <nav className="sp-char-navbar">
        <div className="sp-char-navbar-left">
          <button className="sp-btn sp-btn-ghost" onClick={back} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ChevronLeft size={16} /> Back to Files
          </button>
          <div style={{ width: 1, height: 16, background: "#282830" }} />
          <span style={{ fontSize: 13, color: "#8e8e93", fontWeight: 600 }}>{project.title} / {file.title}</span>
        </div>

        <div className="sp-char-navbar-right">
          {saveStatus === "saving" && (
            <span style={{ fontSize: 12, color: "#8e8e93", display: "flex", alignItems: "center", gap: 4 }}>
              <span className="animate-pulse" style={{ width: 6, height: 6, background: "#E8B84B", borderRadius: "50%" }} /> Saving changes...
            </span>
          )}
          {saveStatus === "saved" && (
            <span style={{ fontSize: 12, color: "#E8B84B", display: "flex", alignItems: "center", gap: 4 }}>
              <Check size={12} /> Changes Saved
            </span>
          )}
          <button className="sp-ws-btn-share" onClick={() => triggerSave(characters)} style={{ height: 32, display: "flex", alignItems: "center", padding: "0 12px" }}>
            <Save size={13} /> Save Now
          </button>
        </div>
      </nav>

      {/* Quick Metrics Bar */}
      <div className="sp-char-metrics-row">
        <div className="sp-char-metric-item">
          <span className="sp-char-metric-label">Total Cast:</span>
          <span className="sp-char-metric-value">{characters.length}</span>
        </div>
        {characters.length > 0 && (
          <>
            <div className="sp-char-metric-item">
              <span className="sp-char-metric-label">Protagonists:</span>
              <span className="sp-char-metric-value">{protagonistsCount}</span>
            </div>
            <div className="sp-char-metric-item">
              <span className="sp-char-metric-label">Antagonists:</span>
              <span className="sp-char-metric-value">{antagonistsCount}</span>
            </div>
            <div className="sp-char-metric-item">
              <span className="sp-char-metric-label">Supporting/Other:</span>
              <span className="sp-char-metric-value">{supportingCount}</span>
            </div>
          </>
        )}
      </div>

      {/* Workspace */}
      {characters.length === 0 ? (
        <div className="sp-char-empty">
          <User size={48} className="animate-pulse" style={{ color: "#E8B84B" }} />
          <div className="sp-char-empty-title">No characters added yet</div>
          <p style={{ fontSize: 13, margin: "0 0 10px 0" }}>Start building your cast profile and design worksheets for comparisons.</p>
          <button className="sp-btn sp-btn-primary" onClick={handleAddCharacter}>
            <Plus size={14} /> Add First Character
          </button>
        </div>
      ) : (
        <div className="sp-char-workspace">
          {/* Character sidebar */}
          <aside className="sp-char-sidebar">
            <div className="sp-char-sidebar-search">
              <div className="sp-char-search-box">
                <Search size={14} />
                <input 
                  type="text" 
                  placeholder="Search characters..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="sp-btn sp-btn-primary" onClick={handleAddCharacter} style={{ width: "100%", height: 36 }}>
                <Plus size={14} /> Add Character
              </button>
            </div>

            <div className="sp-char-list">
              {filteredCharacters.map((char) => (
                <div 
                  key={char.id} 
                  className={`sp-char-item ${selectedId === char.id ? "active" : ""}`}
                  onClick={() => setSelectedId(char.id)}
                >
                  <div className="sp-char-item-info">
                    <span className="sp-char-item-name">{char.name || "Unnamed"}</span>
                    <span className="sp-char-item-role">{char.role || "No Role Specified"}</span>
                  </div>
                  <button className="sp-char-delete-btn" onClick={(e) => handleDeleteCharacter(char.id, e)} title="Delete Character">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {filteredCharacters.length === 0 && (
                <div style={{ textAlign: "center", color: "#8e8e93", fontSize: 12, padding: "20px 0" }}>
                  No match found
                </div>
              )}
            </div>
          </aside>

          {/* Core main panel */}
          <main className="sp-char-main">
            <header className="sp-char-main-header">
              <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                {viewMode === "details" ? (selectedChar ? `Worksheet: ${selectedChar.name}` : "Worksheet View") : "Comparison Matrix"}
              </span>

              <div className="sp-char-mode-selector">
                <button 
                  className={`sp-char-mode-btn ${viewMode === "details" ? "active" : ""}`}
                  onClick={() => setViewMode("details")}
                >
                  <FileText size={14} /> Profile Worksheet
                </button>
                <button 
                  className={`sp-char-mode-btn ${viewMode === "comparison" ? "active" : ""}`}
                  onClick={() => setViewMode("comparison")}
                >
                  <Grid size={14} /> Comparison Grid
                </button>
              </div>
            </header>

            <div className="sp-char-content-scroll">
              {viewMode === "details" && selectedChar && (
                <div className="sp-char-worksheet-layout">
                  {/* Name and Role Box */}
                  <div className="sp-char-header-section">
                    <div className="sp-char-avatar-box">
                      <User size={32} />
                    </div>
                    <div className="sp-char-header-inputs">
                      <div className="sp-char-field-group">
                        <label>Character Name</label>
                        <input 
                          value={selectedChar.name} 
                          placeholder="Character Name"
                          onChange={(e) => handleUpdateField(selectedChar.id, "name", e.target.value)}
                        />
                      </div>
                      <div className="sp-char-field-group">
                        <label>Archetype / Role</label>
                        <input 
                          value={selectedChar.role} 
                          placeholder="e.g. Protagonist, Antagonist, Sidekick"
                          onChange={(e) => handleUpdateField(selectedChar.id, "role", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Attribute Cards Grid */}
                  <div className="sp-char-worksheet-grid">
                    <div className="sp-char-card sp-char-full-width">
                      <div className="sp-char-card-header">
                        <BookOpen size={14} /> Quick Summary
                      </div>
                      <textarea 
                        value={selectedChar.summary} 
                        placeholder="Provide a brief paragraph summary of the character..."
                        onChange={(e) => handleUpdateField(selectedChar.id, "summary", e.target.value)}
                        style={{ minHeight: "70px" }}
                      />
                    </div>

                    <div className="sp-char-card">
                      <div className="sp-char-card-header">
                        <Zap size={14} /> Personality Traits
                      </div>
                      <textarea 
                        value={selectedChar.personality} 
                        placeholder="Temperament, habits, strengths, weaknesses, speech patterns..."
                        onChange={(e) => handleUpdateField(selectedChar.id, "personality", e.target.value)}
                      />
                    </div>

                    <div className="sp-char-card">
                      <div className="sp-char-card-header">
                        <Compass size={14} /> Core Goals
                      </div>
                      <textarea 
                        value={selectedChar.goals} 
                        placeholder="What do they consciously want to achieve in the narrative?"
                        onChange={(e) => handleUpdateField(selectedChar.id, "goals", e.target.value)}
                      />
                    </div>

                    <div className="sp-char-card">
                      <div className="sp-char-card-header">
                        <ShieldAlert size={14} /> Core Fears
                      </div>
                      <textarea 
                        value={selectedChar.fears} 
                        placeholder="What do they fear most? What are they trying to avoid?"
                        onChange={(e) => handleUpdateField(selectedChar.id, "fears", e.target.value)}
                      />
                    </div>

                    <div className="sp-char-card">
                      <div className="sp-char-card-header">
                        <Users size={14} /> Motivations
                      </div>
                      <textarea 
                        value={selectedChar.motivations} 
                        placeholder="Why do they want what they want? What drives them?"
                        onChange={(e) => handleUpdateField(selectedChar.id, "motivations", e.target.value)}
                      />
                    </div>

                    <div className="sp-char-card">
                      <div className="sp-char-card-header">
                        <FileText size={14} /> Backstory
                      </div>
                      <textarea 
                        value={selectedChar.backstory} 
                        placeholder="Significant events from their past that shape who they are today..."
                        onChange={(e) => handleUpdateField(selectedChar.id, "backstory", e.target.value)}
                      />
                    </div>

                    <div className="sp-char-card">
                      <div className="sp-char-card-header">
                        <Users size={14} /> Relationships
                      </div>
                      <textarea 
                        value={selectedChar.relationships} 
                        placeholder="How do they relate to others? (e.g. allies, enemies, love interest)..."
                        onChange={(e) => handleUpdateField(selectedChar.id, "relationships", e.target.value)}
                      />
                    </div>

                    <div className="sp-char-card sp-char-full-width">
                      <div className="sp-char-card-header">
                        <User size={14} /> Narrative Actions / Choices
                      </div>
                      <textarea 
                        value={selectedChar.actions || ""} 
                        placeholder="What key choices do they make that drive the plot forward?"
                        onChange={(e) => handleUpdateField(selectedChar.id, "actions", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {viewMode === "comparison" && (
                <div className="sp-char-matrix-wrapper">
                  <table className="sp-char-matrix-table">
                    <thead>
                      <tr>
                        <th className="label-col">Traits / Attributes</th>
                        {characters.map((c) => (
                          <th key={c.id}>
                            <div className="sp-char-matrix-name-row">{c.name || "Unnamed"}</div>
                            <span className="sp-char-matrix-tag">{c.role || "No Role"}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Name row */}
                      <tr>
                        <td className="label-col">Character Name</td>
                        {characters.map((c) => (
                          <td key={c.id}>
                            <input 
                              type="text" 
                              style={{ width: "100%", background: "transparent", border: "none", color: "#fff", outline: "none", fontSize: 13, fontWeight: "bold" }}
                              value={c.name}
                              onChange={(e) => handleUpdateField(c.id, "name", e.target.value)}
                            />
                          </td>
                        ))}
                      </tr>
                      {/* Attributes rows */}
                      {attributes.map((attr) => (
                        <tr key={attr.key}>
                          <td className="label-col">
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {attr.icon}
                              <span>{attr.label}</span>
                            </div>
                            <span style={{ fontSize: 10, color: "#5e5e65", fontWeight: 400, marginTop: 4, display: "block", lineHeight: 1.2 }}>{attr.desc}</span>
                          </td>
                          {characters.map((c) => (
                            <td key={c.id}>
                              <textarea 
                                className="sp-char-matrix-cell-edit"
                                value={c[attr.key] || ""}
                                placeholder={`Enter ${attr.label.toLowerCase()}...`}
                                onChange={(e) => handleUpdateField(c.id, attr.key, e.target.value)}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

export default CharacterEditor;
