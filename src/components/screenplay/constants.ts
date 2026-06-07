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
  const blocks: Block[] = [
    { id: uid(), type: "scene", text: "INT. COFFEE SHOP - DAY" },
    {
      id: uid(),
      type: "action",
      text: "Rain streaks the front window. MAYA (28), a tired barista with ink-stained fingers, wipes the counter for the third time this hour. The shop is empty.",
    },
    { id: uid(), type: "character", text: "MAYA" },
    { id: uid(), type: "parenthetical", text: "(to herself)" },
    { id: uid(), type: "dialogue", text: "Just one customer. That's all I ask." },
    { id: uid(), type: "action", text: "The bell above the door CHIMES. SONG - a soft jazz number begins to play from the overhead speakers." },
    { id: uid(), type: "character", text: "DANIEL (V.O.)" },
    { id: uid(), type: "dialogue", text: "I had been walking for hours when I found her shop." },
    { id: uid(), type: "scene", text: "EXT. CITY STREET - NIGHT" },
    { id: uid(), type: "action", text: "DANIEL (35), collar up against the rain, hurries past glowing storefronts." },
    { id: uid(), type: "character", text: "WOMAN (O.S.)" },
    { id: uid(), type: "dialogue", text: "¡Cuidado! Watch where you're going!" },
    { id: uid(), type: "scene", text: "I/E. TAXI/CITY STREET - NIGHT" },
    { id: uid(), type: "action", text: "Daniel ducks into a yellow cab. Through the window, neon signs blur into watercolor." },
    { id: uid(), type: "character", text: "DANIEL" },
    { id: uid(), type: "dialogue", text: "Take me anywhere that's still open." },
  ];
  const file: FileDoc = {
    id: uid(),
    title: "Pilot — Episode 1",
    dateModified: Date.now(),
    blocks,
  };
  return {
    id: uid(),
    title: "The Rain Hours",
    description: "A pilot episode about strangers in a city of weather.",
    dateCreated: Date.now(),
    dateModified: Date.now(),
    files: [file],
  };
}
