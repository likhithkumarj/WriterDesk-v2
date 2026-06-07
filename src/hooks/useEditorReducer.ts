import { Block } from "../types/screenplay";

export type EditorState = { past: Block[][]; present: Block[]; future: Block[][] };
export type EditorAction =
  | { type: "set"; blocks: Block[] }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; blocks: Block[] };

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "set":
      if (JSON.stringify(state.present) === JSON.stringify(action.blocks)) return state;
      return {
        past: [...state.past, state.present].slice(-100),
        present: action.blocks,
        future: [],
      };
    case "undo": {
      if (!state.past.length) return state;
      const prev = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: prev,
        future: [state.present, ...state.future],
      };
    }
    case "redo": {
      if (!state.future.length) return state;
      const next = state.future[0];
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
      };
    }
    case "reset":
      return { past: [], present: action.blocks, future: [] };
  }
}
