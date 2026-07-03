import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WorkspaceState {
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeNoteId: null,
      setActiveNoteId: (id) => set({ activeNoteId: id }),
    }),
    {
      name: 'workspace-store',
    }
  )
);
