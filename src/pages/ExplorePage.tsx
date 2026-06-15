import React, { useState } from "react";
import { DashboardLayout, UserProfile } from "./DashboardLayout";
import { Search, Compass, BookOpen, Eye, X, Award } from "lucide-react";
import { Store } from "../types/screenplay";

interface ScriptBlock {
  type: "scene" | "action" | "character" | "parenthetical" | "dialogue";
  text: string;
}

interface Script {
  id: string;
  title: string;
  author: string;
  avatar: string;
  type: string;
  genre: string;
  pages: number;
  likes: number;
  description: string;
  blocks: ScriptBlock[];
}

export function ExplorePage({
  store,
  user,
  onLogout,
}: {
  store: Store;
  user: UserProfile;
  onLogout: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeReadScript, setActiveReadScript] = useState<Script | null>(null);

  const categories = ["All", "Feature", "TV Pilot", "Short Film", "Drama", "Thriller", "Sci-Fi"];

  const featuredScripts: Script[] = [
    {
      id: "script-1",
      title: "Neon Tokyo",
      author: "Elena Rostova",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Elena",
      type: "TV Pilot",
      genre: "Sci-Fi",
      pages: 42,
      likes: 142,
      description: "In a cyber-dystopian Tokyo, an android detective hunts down a rogue synthetic lifeform that has developed human empathy.",
      blocks: [
        { type: "scene", text: "INT. DETECTIVE AGENCY - NIGHT" },
        { type: "action", text: "Rain beats against the dirty window grids. Neon light from the massive holographic billboards outside washes the room in shades of cyan and magenta. RYAN (40s), in a synth-leather trench coat, stares at a floating data shard." },
        { type: "character", text: "RYAN" },
        { type: "dialogue", text: "They build them to feel. Then they hunt them down for feeling. Doesn't make sense, does it?" },
        { type: "character", text: "VEE" },
        { type: "parenthetical", text: "(from the dark doorway)" },
        { type: "dialogue", text: "Making sense was never part of our programming, detective." }
      ]
    },
    {
      id: "script-2",
      title: "Shadow Play",
      author: "Marco Rivera",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Marco",
      type: "Short Film",
      genre: "Thriller",
      pages: 12,
      likes: 84,
      description: "A psychological thriller about an illusionist whose shadows begin to enact crimes in the real world.",
      blocks: [
        { type: "scene", text: "INT. THEATRE BACKSTAGE - NIGHT" },
        { type: "action", text: "Dressed in a formal tailcoat, ANTON (30s) watches his shadow cast against the dressing room wall. He raises his right hand. The shadow raises its left hand. Then... the shadow smiles, but Anton's face remains blank." },
        { type: "character", text: "ANTON" },
        { type: "dialogue", text: "We agreed on midnight. Why are you early?" },
        { type: "action", text: "The shadow points to the vintage dressing room clock. The hands sweep rapidly. Midnight strikes." }
      ]
    },
    {
      id: "script-3",
      title: "The Long Run",
      author: "Sarah Mitchell",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
      type: "Feature Film",
      genre: "Drama",
      pages: 94,
      likes: 310,
      description: "An emotional drama following an aging marathon runner who undertakes one final race to raise funds for his small-town community track.",
      blocks: [
        { type: "scene", text: "EXT. DIRT TRACK - DAWN" },
        { type: "action", text: "Mist rises off the empty school running field. Cold morning air puffs from ARTHUR's (60s) lungs. He adjusts his worn sneakers. His knees click in protest." },
        { type: "character", text: "ARTHUR" },
        { type: "parenthetical", text: "(to himself)" },
        { type: "dialogue", text: "One foot. Then the other. That's all it ever is." },
        { type: "action", text: "He takes off into the mist. His stride is slow but rhythmic. A runner in his natural element." }
      ]
    }
  ];

  const filteredScripts = featuredScripts.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "All" || 
                       s.type === selectedCategory || 
                       s.genre === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <DashboardLayout title="Explore" user={user} onLogout={onLogout} projectsCount={store.projects.length}>
      <div className="sp-exp-container">
        <style dangerouslySetInnerHTML={{ __html: `
          .sp-exp-container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 32px 40px;
            box-sizing: border-box;
          }

          .sp-exp-hero {
            background: linear-gradient(135deg, rgba(232, 184, 75, 0.1) 0%, rgba(15, 15, 17, 0) 100%);
            border: 1px solid rgba(232, 184, 75, 0.15);
            border-radius: 16px;
            padding: 32px;
            margin-bottom: 32px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
          }

          .sp-exp-hero-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-width: 600px;
          }

          .sp-exp-hero-badge {
            background-color: rgba(232, 184, 75, 0.08);
            border: 1px solid rgba(232, 184, 75, 0.2);
            color: #E8B84B;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            gap: 6px;
            width: fit-content;
          }

          .sp-exp-hero-title {
            font-size: 26px;
            font-weight: 800;
            color: #fff;
            margin: 0;
            letter-spacing: -0.02em;
          }

          .sp-exp-hero-desc {
            font-size: 14px;
            color: #8e8e93;
            line-height: 1.5;
            margin: 0;
          }

          .sp-exp-search-bar {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
          }

          .sp-exp-filter-chips {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 32px;
          }

          .sp-exp-chip {
            background-color: #121214;
            border: 1px solid #1c1c20;
            color: #8e8e93;
            font-size: 12px;
            font-weight: 600;
            padding: 6px 14px;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .sp-exp-chip:hover {
            border-color: rgba(232, 184, 75, 0.25);
            color: #efeff1;
          }

          .sp-exp-chip.active {
            background-color: rgba(232, 184, 75, 0.08);
            border-color: #E8B84B;
            color: #E8B84B;
          }

          .sp-exp-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
            gap: 20px;
          }

          .sp-exp-card {
            background-color: #121214;
            border: 1px solid #1c1c20;
            border-radius: 14px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 16px;
            transition: all 0.15s ease;
          }

          .sp-exp-card:hover {
            border-color: rgba(232, 184, 75, 0.25);
            background-color: #16161a;
          }

          .sp-exp-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }

          .sp-exp-card-badge-row {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
          }

          .sp-exp-card-badge {
            background-color: rgba(255, 255, 255, 0.03);
            border: 1px solid #1c1c20;
            color: #8e8e93;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 150px;
          }

          .sp-exp-card-title {
            font-size: 16px;
            font-weight: 800;
            color: #fff;
            margin: 6px 0 2px 0;
          }

          .sp-exp-card-author {
            font-size: 12px;
            color: #8e8e93;
          }

          .sp-exp-card-desc {
            font-size: 12.5px;
            color: #8e8e93;
            line-height: 1.4;
            margin: 0;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
          }

          .sp-exp-card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid #1c1c20;
            padding-top: 12px;
          }

          .sp-exp-card-author-info {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          /* Interactive script reader layout stylesheet styling */
          .sp-reader-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .sp-reader-container {
            width: 800px;
            height: 90vh;
            background-color: #18181c;
            border-radius: 16px;
            border: 1px solid #282830;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 30px 60px rgba(0,0,0,0.6);
          }

          .sp-reader-header {
            height: 60px;
            border-bottom: 1px solid #282830;
            background-color: #1c1c22;
            padding: 0 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .sp-reader-canvas {
            flex: 1;
            overflow-y: auto;
            padding: 56px 80px;
            background-color: #f7f7f9;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .sp-reader-page {
            width: 100%;
            max-width: 600px;
            background-color: #ffffff;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 1px solid #e2e2e7;
            padding: 60px 72px;
            box-sizing: border-box;
            font-family: 'Courier New', Courier, monospace;
            color: #000000;
            min-height: 800px;
          }

          .sp-reader-block-scene {
            font-weight: bold;
            margin-top: 24px;
            margin-bottom: 12px;
            text-transform: uppercase;
            font-size: 13.5px;
            letter-spacing: 0.02em;
          }

          .sp-reader-block-action {
            margin-bottom: 14px;
            font-size: 13px;
            line-height: 1.45;
          }

          .sp-reader-block-char {
            margin-left: auto;
            margin-right: auto;
            width: fit-content;
            max-width: 250px;
            text-transform: uppercase;
            font-weight: normal;
            margin-top: 14px;
            margin-bottom: 2px;
            font-size: 13px;
            text-align: center;
          }

          .sp-reader-block-paren {
            margin-left: auto;
            margin-right: auto;
            width: fit-content;
            max-width: 200px;
            font-style: italic;
            margin-bottom: 2px;
            font-size: 12.5px;
            text-align: center;
          }

          .sp-reader-block-dial {
            margin-left: auto;
            margin-right: auto;
            width: 320px;
            margin-bottom: 14px;
            font-size: 13px;
            line-height: 1.4;
            text-align: left;
          }
        ` }} />

        {/* Hero banner */}
        <div className="sp-exp-hero">
          <div className="sp-exp-hero-info">
            <span className="sp-exp-hero-badge">
              <Award size={12} /> FEATURED STORY
            </span>
            <h2 className="sp-exp-hero-title">Discover Award-Winning Screenplays</h2>
            <p className="sp-exp-hero-desc">
              Browse, read, and draw inspiration from trending community drafts. Connect with authors and request collaboration rights to co-write their screenplays.
            </p>
          </div>
          <div style={{ paddingRight: 12 }}>
            <Compass size={64} style={{ color: "#E8B84B", opacity: 0.8 }} />
          </div>
        </div>

        {/* Search bar */}
        <div className="sp-exp-search-bar">
          <div className="sp-layout-search-wrap" style={{ width: "100%" }}>
            <Search size={16} className="sp-layout-search-icon" style={{ left: 14 }} />
            <input 
              type="text" 
              placeholder="Search scripts, genres, authors..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sp-layout-search-input"
              style={{ width: "100%", paddingLeft: 40, height: 44, fontSize: 14 }}
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="sp-exp-filter-chips">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`sp-exp-chip ${selectedCategory === cat ? "active" : ""}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scripts grid */}
        <div className="sp-exp-grid">
          {filteredScripts.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 20px", color: "#8e8e93" }}>
              No screenplays found matching your search.
            </div>
          ) : (
            filteredScripts.map((script) => (
              <div key={script.id} className="sp-exp-card">
                <div>
                  <div className="sp-exp-card-header">
                    <div className="sp-exp-card-badge-row">
                      <span className="sp-exp-card-badge">{script.type}</span>
                      <span className="sp-exp-card-badge">{script.genre}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#8e8e93", fontWeight: 700 }}>
                      {script.pages} pp
                    </span>
                  </div>
                  <h3 className="sp-exp-card-title">{script.title}</h3>
                  <span className="sp-exp-card-author">by {script.author}</span>
                  <p className="sp-exp-card-desc" style={{ marginTop: 12 }}>{script.description}</p>
                </div>

                <div className="sp-exp-card-footer">
                  <div className="sp-exp-card-author-info">
                    <img src={script.avatar} alt={script.author} style={{ width: 24, height: 24, borderRadius: "50%" }} />
                    <span style={{ fontSize: 12, color: "#efeff1", fontWeight: 600 }}>{script.author.split(" ")[0]}</span>
                  </div>

                  <button 
                    className="sp-ws-btn-share" 
                    onClick={() => setActiveReadScript(script)}
                    style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6, display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <BookOpen size={12} /> Read Script
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Script Reader Modal */}
        {activeReadScript && (
          <div className="sp-reader-backdrop" onClick={() => setActiveReadScript(null)}>
            <div className="sp-reader-container" onClick={(e) => e.stopPropagation()}>
              
              {/* Reader Header */}
              <div className="sp-reader-header">
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>{activeReadScript.title}</h3>
                  <span style={{ fontSize: 11, color: "#8e8e93" }}>Screenplay by {activeReadScript.author} · {activeReadScript.pages} pages</span>
                </div>
                <button 
                  className="sp-layout-header-btn" 
                  onClick={() => setActiveReadScript(null)}
                  title="Close script"
                  style={{ width: 32, height: 32 }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Reader Document Canvas */}
              <div className="sp-reader-canvas">
                <div className="sp-reader-page">
                  
                  {/* Formatted Script Title */}
                  <div style={{ textAlign: "center", marginBottom: 48, borderBottom: "1px double #e2e2e7", paddingBottom: 24 }}>
                    <h1 style={{ fontSize: 20, fontWeight: "normal", textTransform: "uppercase", margin: "0 0 8px 0" }}>{activeReadScript.title}</h1>
                    <span style={{ fontSize: 11, textTransform: "uppercase", color: "#555" }}>Written by {activeReadScript.author}</span>
                  </div>

                  {/* Render fountain blocks */}
                  {activeReadScript.blocks.map((block, idx) => {
                    if (block.type === "scene") {
                      return <div key={idx} className="sp-reader-block-scene">{block.text}</div>;
                    }
                    if (block.type === "action") {
                      return <div key={idx} className="sp-reader-block-action">{block.text}</div>;
                    }
                    if (block.type === "character") {
                      return <div key={idx} className="sp-reader-block-char">{block.text}</div>;
                    }
                    if (block.type === "parenthetical") {
                      return <div key={idx} className="sp-reader-block-paren">{block.text}</div>;
                    }
                    if (block.type === "dialogue") {
                      return <div key={idx} className="sp-reader-block-dial">{block.text}</div>;
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
export default ExplorePage;
