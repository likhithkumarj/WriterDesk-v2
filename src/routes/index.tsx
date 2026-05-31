import { createFileRoute } from "@tanstack/react-router";
import ScreenplayApp from "@/components/ScreenplayApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Screenplay — Write your script" },
      { name: "description", content: "A professional screenplay editor with industry-standard A4 formatting, multi-file projects, and PDF/Fountain export." },
      { property: "og:title", content: "Screenplay" },
      { property: "og:description", content: "Professional screenplay editor with project management and export." },
    ],
  }),
  component: Index,
  ssr: false,
});

function Index() {
  return <ScreenplayApp />;
}
