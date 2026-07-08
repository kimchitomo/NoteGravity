import { create } from 'zustand';
import { useTreeStore, TreeNode } from './useTreeStore';
import { useCanvasStore, PageData } from './useCanvasStore';

export interface GlobalSnapshot {
  treeData: TreeNode[];
  canvasPages: Record<string, PageData>;
  noteContents: Record<string, string>;
}

interface HistoryState {
  past: GlobalSnapshot[];
  future: GlobalSnapshot[];
  isTimeTraveling: boolean;
  captureGlobalSnapshot: () => void;
  pushCustomSnapshot: (snapshot: GlobalSnapshot) => void;
  globalUndo: () => void;
  globalRedo: () => void;
}

export const buildSnapshot = (): GlobalSnapshot => {
  const treeData = useTreeStore.getState().data;
  const canvasPages = useCanvasStore.getState().pages;
  
  const noteContents: Record<string, string> = {};
  if (typeof window !== 'undefined' && window.localStorage) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('note-content-')) {
        const docId = key.replace('note-content-', '');
        noteContents[docId] = localStorage.getItem(key) || '';
      }
    }
  }

  // Deep clone to prevent mutations affecting history
  return {
    treeData: JSON.parse(JSON.stringify(treeData)),
    canvasPages: JSON.parse(JSON.stringify(canvasPages)),
    noteContents: JSON.parse(JSON.stringify(noteContents)),
  };
};

const applySnapshot = (snapshot: GlobalSnapshot) => {
  // Restore Tree Store
  useTreeStore.setState({ data: snapshot.treeData });

  // Restore Canvas Store
  useCanvasStore.setState({ pages: snapshot.canvasPages });

  // Restore Note Contents in LocalStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    // Collect keys to remove (in case a note was created after the snapshot and needs to be deleted)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('note-content-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Restore contents
    Object.entries(snapshot.noteContents).forEach(([docId, content]) => {
      localStorage.setItem(`note-content-${docId}`, content);
    });
  }

  // Trigger global event to force active Tiptap editors to reload from local storage
  if (typeof window !== 'undefined') {
    // Triggering for all docIds since it's global
    window.dispatchEvent(new CustomEvent('reload-editor', { detail: { docId: 'ALL' } }));
  }
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  isTimeTraveling: false,

  pushCustomSnapshot: (snapshot) => {
    set((s) => {
      const newPast = [...s.past, snapshot];
      if (newPast.length > 50) newPast.shift(); // Keep last 50 states
      return {
        past: newPast,
        future: [], // Clear future on new action
      };
    });
  },

  captureGlobalSnapshot: () => {
    const state = get();
    if (state.isTimeTraveling) return;

    const snapshot = buildSnapshot();
    get().pushCustomSnapshot(snapshot);
  },

  globalUndo: () => {
    set((state) => {
      if (state.past.length === 0) return state;

      const currentSnapshot = buildSnapshot();
      const newPast = [...state.past];
      const snapshotToRestore = newPast.pop();

      if (snapshotToRestore) {
        state.isTimeTraveling = true;
        applySnapshot(snapshotToRestore);

        setTimeout(() => set({ isTimeTraveling: false }), 100);

        return {
          past: newPast,
          future: [currentSnapshot, ...state.future],
        };
      }
      return state;
    });
  },

  globalRedo: () => {
    set((state) => {
      if (state.future.length === 0) return state;

      const currentSnapshot = buildSnapshot();
      const newFuture = [...state.future];
      const snapshotToRestore = newFuture.shift();

      if (snapshotToRestore) {
        state.isTimeTraveling = true;
        applySnapshot(snapshotToRestore);
        
        setTimeout(() => set({ isTimeTraveling: false }), 100);

        return {
          past: [...state.past, currentSnapshot],
          future: newFuture,
        };
      }
      return state;
    });
  }
}));
