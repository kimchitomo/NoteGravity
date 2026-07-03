import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WorkspaceState {
  activeNoteId: string | null;
  isSidebarOpen: boolean;
  setActiveNoteId: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeNoteId: null,
      isSidebarOpen: false, // Default closed on mobile, ignored on desktop
      setActiveNoteId: (id) => set({ activeNoteId: id }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
    }),
    {
      name: 'workspace-storage',
      version: 2,
    }
  )
);
