import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, Bold, Italic, Heading1, Heading2, Heading3, List, CheckSquare, Link, Image, Trash2, Tag, Save, Check } from "lucide-react";
import { Project, FileDoc } from "../../types/screenplay";

interface IdeaEditorProps {
  project: Project;
  file: FileDoc;
  user: { name: string; email: string; avatar: string };
  back: () => void;
  persistFile: (f: FileDoc) => void;
}

export function IdeaEditor({
  project,
  file,
  user,
  back,
  persistFile,
  readOnly = false,
}: IdeaEditorProps & { readOnly?: boolean }) {
  const [title, setTitle] = useState(file.title);
  const [content, setContent] = useState(file.content || "");
  const [tags, setTags] = useState<string[]>(() => {
    // Attempt to extract tags from project details or local state if any, or default
    return ["#concept", "#brainstorm"];
  });
  const [tagInput, setTagInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const editorRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<any>(null);

  // Load content into editor on mount
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== file.content) {
      editorRef.current.innerHTML = file.content || "<h1>" + file.title + "</h1><p>Start brainstorming and jotting down notes here...</p>";
    }
  }, [file.id]);

  // Handle auto-saving on content or title change
  const triggerSave = (updatedTitle: string, updatedContent: string, updatedTags: string[]) => {
    setSaveStatus("saving");
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const updatedFile: FileDoc = {
        ...file,
        title: updatedTitle,
        content: updatedContent,
        dateModified: Date.now(),
        // Estimating word count on rich text contents
        wordCount: updatedContent.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length,
      };
      persistFile(updatedFile);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 1000);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    triggerSave(newTitle, content, tags);
  };

  const handleContentInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);
      triggerSave(title, newContent, tags);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      let cleanTag = tagInput.trim();
      if (!cleanTag.startsWith("#")) cleanTag = "#" + cleanTag;
      if (!tags.includes(cleanTag)) {
        const newTags = [...tags, cleanTag];
        setTags(newTags);
        setTagInput("");
        triggerSave(title, content, newTags);
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(t => t !== tagToRemove);
    setTags(newTags);
    triggerSave(title, content, newTags);
  };

  // Rich Text command executors
  const executeCmd = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      handleContentInput();
    }
  };

  const insertLink = () => {
    const url = window.prompt("Enter target URL (e.g. https://google.com):", "https://");
    if (url) {
      executeCmd("createLink", url);
    }
  };

  const insertImage = () => {
    const url = window.prompt("Enter image source URL (e.g. https://picsum.photos/600/400):", "");
    if (url) {
      executeCmd("insertImage", url);
    }
  };

  const insertChecklist = () => {
    const checkboxHtml = `
      <div style="display: flex; align-items: center; gap: 8px; margin: 6px 0;" class="sp-editor-checkbox-row">
        <input type="checkbox" style="width: 14px; height: 14px; cursor: pointer; accent-color: var(--sp-accent);" />
        <span style="font-size: 14px; outline: none;" contenteditable="true">Checklist item</span>
      </div>
    `;
    executeCmd("insertHTML", checkboxHtml);
  };

  return (
    <div className="sp-idea-container">
      {/* Styles for Idea Editor Component */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .sp-idea-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background-color: #08080a;
          color: #efeff1;
          font-family: 'Outfit', sans-serif;
        }

        .sp-idea-navbar {
          height: 56px;
          background-color: #0f0f11;
          border-bottom: 1px solid #18181c;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          flex-shrink: 0;
        }

        .sp-idea-navbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .sp-idea-navbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sp-idea-toolbar {
          height: 44px;
          background-color: #121214;
          border-bottom: 1px solid #1c1c20;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 20px;
          flex-shrink: 0;
          overflow-x: auto;
        }

        .sp-idea-tool-btn {
          background: transparent;
          border: none;
          color: #8e8e93;
          width: 30px;
          height: 30px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sp-idea-tool-btn:hover {
          color: #fff;
          background-color: rgba(255, 255, 255, 0.05);
        }

        .sp-idea-tool-divider {
          width: 1px;
          height: 18px;
          background-color: #282830;
          margin: 0 4px;
        }

        .sp-idea-body-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 36px 20px;
          display: flex;
          justify-content: center;
        }

        .sp-idea-doc-canvas {
          width: 100%;
          max-width: 720px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sp-idea-title-input {
          background: transparent;
          border: none;
          border-bottom: 1px solid transparent;
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          outline: none;
          padding: 4px 0;
          width: 100%;
          font-family: inherit;
        }

        .sp-idea-title-input:focus {
          border-bottom-color: #282830;
        }

        .sp-idea-tags-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding-bottom: 16px;
          border-bottom: 1px solid #1c1c20;
        }

        .sp-idea-tag-badge {
          background: rgba(var(--sp-accent-rgb), 0.08);
          border: 1px solid rgba(var(--sp-accent-rgb), 0.15);
          color: var(--sp-accent);
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .sp-idea-tag-remove {
          cursor: pointer;
          font-size: 10px;
          color: rgba(var(--sp-accent-rgb), 0.6);
        }
        .sp-idea-tag-remove:hover {
          color: #fff;
        }

        .sp-idea-tag-input {
          background: transparent;
          border: none;
          color: #8e8e93;
          font-size: 12px;
          outline: none;
          width: 120px;
        }

        /* Notion Page Editor core canvas styling */
        .sp-idea-richtext-editor {
          flex: 1;
          outline: none;
          font-size: 15px;
          line-height: 1.6;
          color: #efeff1;
          min-height: 400px;
        }
        
        .sp-idea-richtext-editor h1 {
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          margin-top: 24px;
          margin-bottom: 12px;
        }

        .sp-idea-richtext-editor h2 {
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          margin-top: 20px;
          margin-bottom: 10px;
        }

        .sp-idea-richtext-editor h3 {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          margin-top: 16px;
          margin-bottom: 8px;
        }

        .sp-idea-richtext-editor p {
          margin-bottom: 14px;
          color: #d1d1d6;
        }

        .sp-idea-richtext-editor ul {
          margin-left: 20px;
          margin-bottom: 14px;
          list-style-type: disc;
        }

        .sp-idea-richtext-editor li {
          margin-bottom: 6px;
        }

        .sp-idea-richtext-editor img {
          max-width: 100%;
          border-radius: 8px;
          margin: 16px 0;
          border: 1px solid #1c1c20;
        }

        .sp-idea-richtext-editor a {
          color: var(--sp-accent);
          text-decoration: underline;
        }
        ` }} />

      {/* Navigation Navbar */}
      <nav className="sp-idea-navbar">
        <div className="sp-idea-navbar-left">
          <button className="sp-btn sp-btn-ghost" onClick={back} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ChevronLeft size={16} /> Back to Files
          </button>
          <div style={{ width: 1, height: 16, background: "#282830" }} />
          <span style={{ fontSize: 13, color: "#8e8e93", fontWeight: 600 }}>{project.title} / {file.title}</span>
        </div>

        <div className="sp-idea-navbar-right">
          {saveStatus === "saving" && (
            <span style={{ fontSize: 12, color: "#8e8e93", display: "flex", alignItems: "center", gap: 4 }}>
              <span className="animate-pulse" style={{ width: 6, height: 6, background: "var(--sp-accent)", borderRadius: "50%" }} /> Saving changes...
            </span>
          )}
          {saveStatus === "saved" && (
            <span style={{ fontSize: 12, color: "var(--sp-accent)", display: "flex", alignItems: "center", gap: 4 }}>
              <Check size={12} /> Changes Saved
            </span>
          )}
          {!readOnly && (
            <button className="sp-ws-btn-share" onClick={() => triggerSave(title, content, tags)} style={{ height: 32, display: "flex", alignItems: "center", padding: "0 12px" }}>
              <Save size={13} /> Save Now
            </button>
          )}
        </div>
      </nav>

      {/* Formatting Toolbar */}
      {!readOnly && (
        <div className="sp-idea-toolbar">
          <button className="sp-idea-tool-btn" onClick={() => executeCmd("bold")} title="Bold (Ctrl+B)"><Bold size={14} /></button>
          <button className="sp-idea-tool-btn" onClick={() => executeCmd("italic")} title="Italic (Ctrl+I)"><Italic size={14} /></button>
          <div className="sp-idea-tool-divider" />
          <button className="sp-idea-tool-btn" onClick={() => executeCmd("formatBlock", "h1")} title="Heading 1"><Heading1 size={14} /></button>
          <button className="sp-idea-tool-btn" onClick={() => executeCmd("formatBlock", "h2")} title="Heading 2"><Heading2 size={14} /></button>
          <button className="sp-idea-tool-btn" onClick={() => executeCmd("formatBlock", "h3")} title="Heading 3"><Heading3 size={14} /></button>
          <div className="sp-idea-tool-divider" />
          <button className="sp-idea-tool-btn" onClick={() => executeCmd("insertUnorderedList")} title="Unordered List"><List size={14} /></button>
          <button className="sp-idea-tool-btn" onClick={insertChecklist} title="Add Checklist Item"><CheckSquare size={14} /></button>
          <div className="sp-idea-tool-divider" />
          <button className="sp-idea-tool-btn" onClick={insertLink} title="Insert Hyperlink"><Link size={14} /></button>
          <button className="sp-idea-tool-btn" onClick={insertImage} title="Insert Image"><Image size={14} /></button>
          <div className="sp-idea-tool-divider" />
          <button className="sp-idea-tool-btn" onClick={() => executeCmd("removeFormat")} title="Clear Formatting"><Trash2 size={14} /></button>
        </div>
      )}

      {/* Document Workspace */}
      <div className="sp-idea-body-scroll">
        <div className="sp-idea-doc-canvas">
          {/* Document Title input */}
          <input 
            className="sp-idea-title-input"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Document"
            readOnly={readOnly}
          />

          {/* Tags management row */}
          <div className="sp-idea-tags-row">
            {tags.map((tag) => (
              <span key={tag} className="sp-idea-tag-badge">
                <Tag size={10} /> {tag}
                {!readOnly && <span className="sp-idea-tag-remove" onClick={() => handleRemoveTag(tag)}>✕</span>}
              </span>
            ))}
            {!readOnly && (
              <input 
                className="sp-idea-tag-input"
                placeholder="Add tag + press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            )}
          </div>

          {/* Editable Editor Area */}
          <div 
            ref={editorRef}
            className="sp-idea-richtext-editor"
            contentEditable={!readOnly}
            onInput={handleContentInput}
            style={{ minHeight: "60vh" }}
          />
        </div>
      </div>
    </div>
  );
}
export default IdeaEditor;
