import React, { useState, useEffect } from "react";
import { EditorScreen } from "../components/screenplay/EditorScreen";
import { IdeaEditor } from "../components/editors/IdeaEditor";
import { CharacterEditor } from "../components/editors/CharacterEditor";
import { OutlineEditor } from "../components/editors/OutlineEditor";
import { ShotListEditor } from "../components/editors/ShotListEditor";
import { Project, FileDoc } from "../types/screenplay";
import { supabaseService } from "../utils/supabaseService";
import { supabase } from "../utils/supabaseClient";

interface EditorPageProps {
  project: Project;
  initialFileId: string;
  user: { id?: string; name: string; email: string; avatar: string };
  back: () => void;
  persistFile: (f: FileDoc) => void;
  addFiles: (files: FileDoc[], openId?: string) => void;
}

export function EditorPage({
  project,
  initialFileId,
  user,
  back,
  persistFile,
  addFiles,
}: EditorPageProps) {
  const file = project.files.find((f) => f.id === initialFileId);
  const [readOnly, setReadOnly] = useState(false);

  useEffect(() => {
    if (!supabaseService.isConfigured() || !project.id) {
      setReadOnly(false);
      return;
    }

    const checkAccess = async () => {
      try {
        // 1. Check if owner
        const { data: pRow } = await supabase
          .from("projects")
          .select("user_id")
          .eq("id", project.id)
          .single();

        const isOwner = !pRow?.user_id || pRow.user_id === user.id;
        if (isOwner) {
          setReadOnly(false);
          return;
        }

        // 2. Fetch collaborators to check role
        const { data: collabs } = await supabaseService.fetchCollaborators(project.id);
        if (collabs) {
          const curEmail = user.email?.toLowerCase();
          const hasCollabEditorRole = collabs.some(
            (c: any) => c.invited_email?.toLowerCase() === curEmail && c.role === "Editor"
          );
          setReadOnly(!hasCollabEditorRole);
        } else {
          setReadOnly(true);
        }
      } catch (err) {
        console.error("Error checking write access:", err);
        setReadOnly(true);
      }
    };

    checkAccess();
  }, [project.id, user.id, user.email]);

  if (!file) {
    return (
      <div style={{ color: "#ef4444", padding: 24, textAlign: "center", background: "#0c0c0e", height: "100vh" }}>
        Error: File not found.
      </div>
    );
  }

  const type = file.type || "script";

  if (type === "script") {
    return (
      <EditorScreen
        project={project}
        initialFileId={initialFileId}
        user={user}
        back={back}
        persistFile={persistFile}
        addFiles={addFiles}
        readOnly={readOnly}
      />
    );
  }

  if (type === "idea") {
    return (
      <IdeaEditor
        project={project}
        file={file}
        user={user}
        back={back}
        persistFile={persistFile}
        readOnly={readOnly}
      />
    );
  }

  if (type === "character") {
    return (
      <CharacterEditor
        project={project}
        file={file}
        user={user}
        back={back}
        persistFile={persistFile}
        readOnly={readOnly}
      />
    );
  }

  if (type === "outline") {
    return (
      <OutlineEditor
        project={project}
        file={file}
        user={user}
        back={back}
        persistFile={persistFile}
        readOnly={readOnly}
      />
    );
  }

  if (type === "shotlist") {
    return (
      <ShotListEditor
        project={project}
        file={file}
        user={user}
        back={back}
        persistFile={persistFile}
        readOnly={readOnly}
      />
    );
  }

  return (
    <div style={{ color: "#ef4444", padding: 24, textAlign: "center", background: "#0c0c0e", height: "100vh" }}>
      Error: Unknown file type "{type}".
    </div>
  );
}

export default EditorPage;
