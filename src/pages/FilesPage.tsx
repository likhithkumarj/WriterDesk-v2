import React from "react";
import { FilesScreen } from "../components/screenplay/FilesScreen";

export function FilesPage(props: React.ComponentProps<typeof FilesScreen>) {
  return <FilesScreen {...props} />;
}
export default FilesPage;
