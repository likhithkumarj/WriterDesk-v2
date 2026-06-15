import React from "react";
import { EditorScreen } from "../components/screenplay/EditorScreen";

export function EditorPage(props: React.ComponentProps<typeof EditorScreen>) {
  return <EditorScreen {...props} />;
}
export default EditorPage;
