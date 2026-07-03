import { create } from 'zustand';

export interface NoteContainerData {
  id: string;
  x: number;
  y: number;
  width: number;
  isFocused?: boolean;
}

export interface PageData {
  panX: number;
  panY: number;
  zoom: number;
  containers: NoteContainerData[];
}

interface CanvasState {
  pages: Record<string, PageData>;
  getPageData: (docId: string) => PageData;
  setPan: (docId: string, panX: number, panY: number) => void;
  setZoom: (docId: string, zoom: number) => void;
  addContainer: (docId: string, x: number, y: number) => string;
  updateContainer: (docId: string, containerId: string, updates: Partial<NoteContainerData>) => void;
  removeContainer: (docId: string, containerId: string) => void;
}

const defaultPageData: PageData = {
  panX: 0,
  panY: 0,
  zoom: 1,
  containers: [],
};

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useCanvasStore = create<CanvasState>((set, get) => ({
  pages: {},
  
  getPageData: (docId: string) => {
    return get().pages[docId] || defaultPageData;
  },

  setPan: (docId, panX, panY) => set((state) => ({
    pages: {
      ...state.pages,
      [docId]: {
        ...(state.pages[docId] || defaultPageData),
        panX,
        panY,
      }
    }
  })),

  setZoom: (docId, zoom) => set((state) => ({
    pages: {
      ...state.pages,
      [docId]: {
        ...(state.pages[docId] || defaultPageData),
        zoom,
      }
    }
  })),

  addContainer: (docId, x, y) => {
    const newId = generateId();
    set((state) => {
      const page = state.pages[docId] || defaultPageData;
      // Unfocus others
      const containers = page.containers.map(c => ({ ...c, isFocused: false }));
      
      return {
        pages: {
          ...state.pages,
          [docId]: {
            ...page,
            containers: [...containers, { id: newId, x, y, width: 400, isFocused: true }]
          }
        }
      };
    });
    return newId;
  },

  updateContainer: (docId, containerId, updates) => set((state) => {
    const page = state.pages[docId];
    if (!page) return state;

    return {
      pages: {
        ...state.pages,
        [docId]: {
          ...page,
          containers: page.containers.map(c => 
            c.id === containerId ? { ...c, ...updates } : 
            (updates.isFocused ? { ...c, isFocused: false } : c) // Only one focused at a time
          )
        }
      }
    };
  }),

  removeContainer: (docId, containerId) => set((state) => {
    const page = state.pages[docId];
    if (!page) return state;

    return {
      pages: {
        ...state.pages,
        [docId]: {
          ...page,
          containers: page.containers.filter(c => c.id !== containerId)
        }
      }
    };
  })
}));
