import React from "react";
import { EditorScreen } from "../components/screenplay/EditorScreen";
import { IdeaEditor } from "../components/editors/IdeaEditor";
import { CharacterEditor } from "../components/editors/CharacterEditor";
import { OutlineEditor } from "../components/editors/OutlineEditor";
import { Project, FileDoc } from "../types/screenplay";

interface EditorPageProps {
  project: Project;
  initialFileId: string;
  user: { name: string; email: string; avatar: string };
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
