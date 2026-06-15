import { Film, Type as TypeIcon, User, Quote, MessageSquare } from "lucide-react";
import { Project, Block, FileDoc } from "../../types/screenplay";
import { uid } from "../../utils/uid";

export const TYPE_ICONS = {
  scene: Film,
  action: TypeIcon,
  character: User,
  parenthetical: Quote,
  dialogue: MessageSquare,
} as const;

export function makeSample(): Project {
  const sampleBlocks = [
    { id: uid(), type: "scene", text: "INT. JAZZ CLUB - NIGHT" },
    {
      id: uid(),
      type: "action",
      text: "Rain drums against the neon-lit window pane. COLE (40s), in a wet trench coat, sits at the bar staring into his bourbon.",
    },
    { id: uid(), type: "character", text: "COLE" },
    { id: uid(), type: "dialogue", text: "Some nights, the city closes its eyes and pretends it has a heart." }
  ];

  return {
    id: "default-project",
    title: "Noir City",
    description: "A hard-boiled detective story set in the dark streets of a rain-soaked metropolis.",
    dateCreated: 1768000000000, // Jan 12, 2026
    dateModified: 1780936800000, // Jun 8, 2026
    type: "Feature Film",
    genre: "Neo-Noir/Thriller",
    status: "Active",
    files: [
      {
        id: "act-one-draft",
        title: "Act One Draft",
        dateModified: 1780936800000, // Jun 8, 2026
        blocks: [
          { id: uid(), type: "scene", text: "INT. JAZZ CLUB - NIGHT" },
          { id: uid(), type: "action", text: "COLE stares at his glass. VERA enters." },
          { id: uid(), type: "character", text: "COLE" },
          { id: uid(), type: "dialogue", text: "You're late." }
        ]
      },
      {
        id: "act-two-outline",
        title: "Act Two Outline",
        dateModified: 1780764000000, // Jun 6, 2026
        blocks: [
          { id: uid(), type: "scene", text: "EXT. MERIDIAN HOTEL - NIGHT" },
          { id: uid(), type: "action", text: "Outline notes for the hotel confrontation scene." }
        ]
      },
      {
        id: "character-bible",
        title: "Character Bible",
        dateModified: 1780591200000, // Jun 4, 2026
        blocks: [
          { id: uid(), type: "action", text: "Profile notes for Cole, Vera, and the Detective." }
        ]
      }
    ]
  };
}
