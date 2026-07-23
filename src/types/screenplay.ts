export type BlockType =
  | "scene"
  | "action"
  | "character"
  | "parenthetical"
  | "dialogue";

export interface Block {
  id: string;
  type: BlockType;
  text: string;
}

export interface TitlePage {
  title: string;
  credit: string;     // e.g. "Written by"
  author: string;
  source: string;     // e.g. "Based on..."
  draftDate: string;
  contact: string;
}

export type FileType = "script" | "idea" | "character" | "shotlist";

export interface CharacterRecord {
  id: string;
  name: string;
  role: string;
  personality: string;
  goals: string;
  fears: string;
  motivations: string;
  backstory: string;
  relationships: string;
  actions: string;
  summary: string;
}

export interface Shot {
  id: string;
  sceneNumber: number;       // Auto from scene group (1, 2, 3...)
  shotLabel: string;         // Editable: "A", "B", "OTS-1", etc.
  sceneHeading: string;      // "INT. COFFEE SHOP - DAY"
  description: string;       // Free text notes
  shotType: string;          // Wide | Medium | CU | ECU | Insert
  angle: string;             // Eye Level | High | Low | Bird's Eye | Dutch
  movement: string;          // Static | Pan | Tilt | Dolly | Handheld | Crane
  lens: string;              // 24mm | 35mm | 50mm | 85mm | 100mm
  status: string;            // Planned | Approved | Shot
  imageUrl?: string;         // Reserved for future storyboard feature
  equipment?: string;        // Optional equipment used (Sticks, Handheld, Gimbal...)
  intExt?: string;           // INT / EXT / I/E
  note?: string;             // Notes
}

export interface FileDoc {
  id: string;
  title: string;
  dateModified: number;
  type?: FileType; // defaults to "script" if missing
  status?: string; // e.g. "Draft", "Review", "Final"
  wordCount?: number;
  blocks: Block[]; // used if type === "script" or fallback
  titlePage?: TitlePage; // used if type === "script"
  content?: string; // used if type === "idea" (rich text HTML/Markdown)
  characters?: CharacterRecord[]; // used if type === "character"
  shotList?: Shot[]; // used if type === "shotlist"
  shotListCreationMode?: "manual" | "generated" | "empty"; // creation mode metadata
  author?: string; // name of user who created the file
}

export interface Project {
  id: string;
  title: string;
  description: string;
  dateCreated: number;
  dateModified: number;
  files: FileDoc[];
  type?: string;
  genre?: string;
  status?: string;
  ownerId?: string;
}

export interface Store {
  projects: Project[];
}

export interface Suggestion {
  label: string;
  insert: string;
  hint?: string;
}
