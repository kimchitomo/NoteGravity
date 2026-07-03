import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NoteContainerData {
  id: string;
  x: number;
  y: number;
  width: number;
  isAutoWidth?: boolean;
  isFocused?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  id: string;
  points: StrokePoint[];
  color: string;
  width: number;
  type: 'pen' | 'highlighter';
}

export interface PageData {
  panX: number;
  panY: number;
  zoom: number;
  pageColor?: string;
  gridPattern?: 'none' | 'rule' | 'grid';
  paperSize?: 'auto' | 'a4' | 'a3' | 'letter';
  containers: NoteContainerData[];
  strokes: Stroke[];
}

interface CanvasState {
  pages: Record<string, PageData>;
  past: Record<string, PageData[]>;
  future: Record<string, PageData[]>;
  drawTool: 'type' | 'lasso' | 'pan' | 'pen' | 'highlighter' | 'shape';
  drawColor: string;
  drawWidth: number;
  
  getPageData: (docId: string) => PageData;
  setDrawTool: (tool: 'type' | 'lasso' | 'pan' | 'pen' | 'highlighter' | 'shape') => void;
  setDrawColor: (color: string) => void;
  setDrawWidth: (width: number) => void;
  
  setPan: (docId: string, panX: number, panY: number) => void;
  setZoom: (docId: string, zoom: number) => void;
  setPageColor: (docId: string, color: string) => void;
  setGridPattern: (docId: string, pattern: 'none' | 'rule' | 'grid') => void;
  setPaperSize: (docId: string, size: 'auto' | 'a4' | 'a3' | 'letter') => void;
  addContainer: (docId: string, x: number, y: number) => string;
  updateContainer: (docId: string, containerId: string, updates: Partial<NoteContainerData>) => void;
  removeContainer: (docId: string, containerId: string) => void;
  addStroke: (docId: string, stroke: Stroke) => void;
  clearStrokes: (docId: string) => void;
  
  saveHistory: (docId: string) => void;
  undo: (docId: string) => void;
  redo: (docId: string) => void;
}

const defaultPageData: PageData = {
  panX: 0,
  panY: 0,
  zoom: 1,
  pageColor: '#ffffff',
  gridPattern: 'none',
  paperSize: 'a4',
  containers: [],
  strokes: [],
};

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      pages: {},
      past: {},
      future: {},
      drawTool: 'type',
      drawColor: '#000000',
      drawWidth: 3,
      
      setDrawTool: (tool) => set({ drawTool: tool }),
      setDrawColor: (color) => set({ drawColor: color }),
      setDrawWidth: (width) => set({ drawWidth: width }),
      
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

      setPageColor: (docId, color) => set((state) => ({
        pages: {
          ...state.pages,
          [docId]: {
            ...(state.pages[docId] || defaultPageData),
            pageColor: color,
          }
        }
      })),

      setGridPattern: (docId, pattern) => set((state) => ({
        pages: {
          ...state.pages,
          [docId]: {
            ...(state.pages[docId] || defaultPageData),
            gridPattern: pattern,
          }
        }
      })),

      setPaperSize: (docId, size) => {
        get().saveHistory(docId);
        set((state) => ({
          pages: {
            ...state.pages,
            [docId]: {
              ...(state.pages[docId] || defaultPageData),
              paperSize: size,
            }
          }
        }));
      },

  addContainer: (docId, x, y) => {
    const newId = generateId();
    get().saveHistory(docId);
    set((state) => {
      const page = state.pages[docId] || defaultPageData;
      // Unfocus others
      const containers = page.containers.map(c => ({ ...c, isFocused: false }));
      
      return {
        pages: {
          ...state.pages,
          [docId]: {
            ...page,
            containers: [...containers, { id: newId, x, y, width: 400, isAutoWidth: true, isFocused: true }]
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

  removeContainer: (docId, containerId) => {
    get().saveHistory(docId);
    set((state) => {
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
    });
  },

  addStroke: (docId, stroke) => {
    get().saveHistory(docId);
    set((state) => {
      const page = state.pages[docId] || defaultPageData;
    return {
      pages: {
        ...state.pages,
        [docId]: {
          ...page,
          strokes: [...(page.strokes || []), stroke]
        }
      }
    };
    });
  },

  clearStrokes: (docId) => {
    get().saveHistory(docId);
    set((state) => {
      const page = state.pages[docId];
    if (!page) return state;
    return {
      pages: {
        ...state.pages,
        [docId]: {
          ...page,
          strokes: []
        }
      }
    };
    });
  },

  saveHistory: (docId) => set((state) => {
    const page = state.pages[docId] || defaultPageData;
    const docPast = state.past[docId] || [];
    return {
      past: { ...state.past, [docId]: [...docPast, page].slice(-50) },
      future: { ...state.future, [docId]: [] }
    };
  }),

  undo: (docId) => set((state) => {
    const docPast = state.past[docId] || [];
    if (docPast.length === 0) return state;
    
    const previous = docPast[docPast.length - 1];
    const newPast = docPast.slice(0, -1);
    const docFuture = state.future[docId] || [];
    const current = state.pages[docId] || defaultPageData;
    
    return {
      pages: { ...state.pages, [docId]: previous },
      past: { ...state.past, [docId]: newPast },
      future: { ...state.future, [docId]: [current, ...docFuture] }
    };
  }),

  redo: (docId) => set((state) => {
    const docFuture = state.future[docId] || [];
    if (docFuture.length === 0) return state;
    
    const next = docFuture[0];
    const newFuture = docFuture.slice(1);
    const docPast = state.past[docId] || [];
    const current = state.pages[docId] || defaultPageData;
    
    return {
      pages: { ...state.pages, [docId]: next },
      past: { ...state.past, [docId]: [...docPast, current] },
      future: { ...state.future, [docId]: newFuture }
    };
  }),

}), { name: 'canvas-storage' }));
