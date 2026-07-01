import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Tab {
  id: string;
  title: string;
}

export interface Pane {
  id: string;
  tabs: Tab[];
  activeTabId: string | null;
  previewTab: Tab | null;
}

interface WorkspaceState {
  panes: Pane[];
  activePaneId: string;
  addPane: () => void;
  removePane: (paneId: string) => void;
  addTabToPane: (paneId: string, tab: Tab) => void;
  setPreviewTab: (paneId: string, tab: Tab) => void;
  removeTabFromPane: (paneId: string, tabId: string) => void;
  setActiveTab: (paneId: string, tabId: string) => void;
  setActivePane: (paneId: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      panes: [
    {
      id: generateId(),
      tabs: [{ id: 'note-1', title: 'Welcome to NoteGravity' }],
      activeTabId: 'note-1',
      previewTab: null,
    },
  ],
  activePaneId: '',

  addPane: () =>
    set((state) => {
      if (state.panes.length >= 4) return state;
      const newPane: Pane = {
        id: generateId(),
        tabs: [{ id: `note-${generateId()}`, title: 'New Note' }],
        activeTabId: '',
        previewTab: null,
      };
      newPane.activeTabId = newPane.tabs[0].id;
      return { panes: [...state.panes, newPane] };
    }),

  removePane: (paneId) =>
    set((state) => ({
      panes: state.panes.filter((p) => p.id !== paneId),
    })),

  addTabToPane: (paneId, tab) =>
    set((state) => ({
      panes: state.panes.map((pane) => {
        if (pane.id === paneId) {
          const tabExists = pane.tabs.find((t) => t.id === tab.id);
          if (tabExists) {
            return { ...pane, activeTabId: tab.id, previewTab: pane.previewTab?.id === tab.id ? null : pane.previewTab };
          }
          return {
            ...pane,
            tabs: [...pane.tabs, tab],
            activeTabId: tab.id,
            previewTab: pane.previewTab?.id === tab.id ? null : pane.previewTab,
          };
        }
        return pane;
      }),
    })),

  setPreviewTab: (paneId, tab) =>
    set((state) => ({
      panes: state.panes.map((pane) => {
        if (pane.id === paneId) {
          const tabExists = pane.tabs.find((t) => t.id === tab.id);
          if (tabExists) {
            return { ...pane, activeTabId: tab.id }; // Already a permanent tab
          }
          return {
            ...pane,
            activeTabId: tab.id,
            previewTab: tab, // Set as preview tab
          };
        }
        return pane;
      }),
    })),

  removeTabFromPane: (paneId, tabId) =>
    set((state) => ({
      panes: state.panes.map((pane) => {
        if (pane.id === paneId) {
          if (pane.previewTab?.id === tabId) {
            return {
              ...pane,
              previewTab: null,
              activeTabId: pane.activeTabId === tabId ? (pane.tabs.length > 0 ? pane.tabs[pane.tabs.length - 1].id : null) : pane.activeTabId,
            };
          }
          const newTabs = pane.tabs.filter((t) => t.id !== tabId);
          return {
            ...pane,
            tabs: newTabs,
            activeTabId:
              pane.activeTabId === tabId
                ? newTabs.length > 0
                  ? newTabs[newTabs.length - 1].id
                  : (pane.previewTab ? pane.previewTab.id : null)
                : pane.activeTabId,
          };
        }
        return pane;
      }),
    })),

  setActiveTab: (paneId, tabId) =>
    set((state) => ({
      panes: state.panes.map((pane) =>
        pane.id === paneId ? { ...pane, activeTabId: tabId } : pane
      ),
      activePaneId: paneId,
    })),

  setActivePane: (paneId) => set({ activePaneId: paneId }),
}),
    {
      name: 'workspace-store',
    }
  )
);
