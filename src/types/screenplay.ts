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

export type FileType = "script" | "idea" | "character" | "outline";

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

export interface OutlineNode {
  id: string;
  title: string;
  type: "act" | "sequence" | "beat" | "note";
  content?: string;
  collapsed?: boolean;
  children?: OutlineNode[];
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
  outlineTree?: OutlineNode[]; // used if type === "outline"
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
}

export interface Store {
  projects: Project[];
}

export interface Suggestion {
  label: string;
  insert: string;
  hint?: string;
}
