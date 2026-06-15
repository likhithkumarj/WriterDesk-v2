import React from "react";
import { ProjectsScreen } from "../components/screenplay/ProjectsScreen";

export function ProjectsPage(props: React.ComponentProps<typeof ProjectsScreen>) {
  return <ProjectsScreen {...props} />;
}
export default ProjectsPage;
