import { create } from 'zustand';

interface EditorState {
  activeEditor: any | null;
  setActiveEditor: (editor: any | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activeEditor: null,
  setActiveEditor: (editor) => set({ activeEditor: editor }),
}));
