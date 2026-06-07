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

export interface FileDoc {
  id: string;
  title: string;
  dateModified: number;
  blocks: Block[];
  titlePage?: TitlePage;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  dateCreated: number;
  dateModified: number;
  files: FileDoc[];
}

export interface Store {
  projects: Project[];
}

export interface Suggestion {
  label: string;
  insert: string;
  hint?: string;
}
