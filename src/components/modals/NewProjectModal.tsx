import React, { useState } from "react";

export function NewProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (title: string, description: string, type: string, genre: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("Feature Film");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [customGenre, setCustomGenre] = useState("");

  const projectTypes = [
    "Feature Film",
    "TV Pilot",
    "Short Film",
    "Stage Play",
    "Novel",
    "Other"
  ];

  const presetGenres = [
    "Drama",
    "Comedy",
    "Thriller",
    "Action",
    "Horror",
    "Sci-Fi",
    "Fantasy",
    "Romance",
    "Mystery",
    "Noir"
  ];

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const addCustomGenre = () => {
    const trimmed = customGenre.trim();
    if (trimmed && !selectedGenres.includes(trimmed)) {
      setSelectedGenres([...selectedGenres, trimmed]);
      setCustomGenre("");
    }
  };

  const handleCreate = () => {
    const genreStr = selectedGenres.join(" / ");
    onCreate(title.trim(), desc.trim(), type, genreStr);
  };

  return (
    <div className="sp-modal-backdrop" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 18, color: "#fff" }}>New Project</h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93", marginBottom: 6, letterSpacing: "0.05em" }}>Project Title</label>
            <input 
              className="sp-input" 
              placeholder="e.g. Noir City" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              autoFocus 
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93", marginBottom: 6, letterSpacing: "0.05em" }}>Description (Optional)</label>
            <textarea 
              className="sp-input" 
              placeholder="Brief summary of the story..." 
              value={desc} 
              onChange={(e) => setDesc(e.target.value)} 
              rows={2} 
              style={{ resize: "none" }} 
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93", marginBottom: 6, letterSpacing: "0.05em" }}>Project Type</label>
            <select 
              className="sp-input" 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              style={{ background: "#232329", border: "1px solid #34343a", color: "#fff", cursor: "pointer", width: "100%" }}
            >
              {projectTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93", marginBottom: 6, letterSpacing: "0.05em" }}>Genres</label>
            
            {/* Genre Pills list */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {presetGenres.map((g) => {
                const isSelected = selectedGenres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    style={{
                      background: isSelected ? "rgba(232, 184, 75, 0.08)" : "rgba(255, 255, 255, 0.02)",
                      border: isSelected ? "1px solid #E8B84B" : "1px solid #232329",
                      borderRadius: 20,
                      color: isSelected ? "#E8B84B" : "#8e8e93",
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.15s ease"
                    }}
                  >
                    {isSelected && <span style={{ fontSize: 10 }}>✓ </span>}
                    {g}
                  </button>
                );
              })}

              {/* Selected custom genres that aren't presets */}
              {selectedGenres.filter(g => !presetGenres.includes(g)).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  style={{
                    background: "rgba(232, 184, 75, 0.08)",
                    border: "1px solid #E8B84B",
                    borderRadius: 20,
                    color: "#E8B84B",
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    transition: "all 0.15s ease"
                  }}
                >
                  <span>✓ </span>
                  {g}
                </button>
              ))}
            </div>

            {/* Custom genre input row */}
            <div style={{ display: "flex", gap: 8 }}>
              <input 
                className="sp-input" 
                placeholder="Add custom genre..." 
                value={customGenre} 
                onChange={(e) => setCustomGenre(e.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomGenre();
                  }
                }}
                style={{ flex: 1, padding: "6px 12px", fontSize: 12 }}
              />
              <button 
                type="button" 
                className="sp-btn" 
                onClick={addCustomGenre}
                style={{ padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="sp-btn" onClick={onClose} style={{ padding: "8px 16px" }}>Cancel</button>
          <button 
            className="sp-btn sp-btn-primary" 
            disabled={!title.trim()} 
            onClick={handleCreate}
            style={{ padding: "8px 16px" }}
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}
