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

export interface ShapeItem {
  id: string;
  type: 'rect' | 'circle' | 'triangle' | 'line' | 'arrow';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
  fill?: string;
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
  shapes: ShapeItem[];
}

interface CanvasState {
  pages: Record<string, PageData>;
  past: Record<string, PageData[]>;
  future: Record<string, PageData[]>;
  drawTool: 'type' | 'lasso' | 'pan' | 'pen' | 'highlighter' | 'shape' | 'eraser';
  drawColor: string;
  drawWidth: number;
  shapeType: 'rect' | 'circle' | 'triangle' | 'line' | 'arrow';

  getPageData: (docId: string) => PageData;
  setDrawTool: (tool: 'type' | 'lasso' | 'pan' | 'pen' | 'highlighter' | 'shape' | 'eraser') => void;
  setDrawColor: (color: string) => void;
  setDrawWidth: (width: number) => void;
  setShapeType: (type: 'rect' | 'circle' | 'triangle' | 'line' | 'arrow') => void;

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
  removeStrokeAt: (docId: string, x: number, y: number, radius: number) => void;
  addShape: (docId: string, shape: ShapeItem) => void;
  removeShape: (docId: string, shapeId: string) => void;
  clearAll: (docId: string) => void;

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
  shapes: [],
};

const generateId = () => Math.random().toString(36).substring(2, 9);

// Kiểm tra điểm có gần stroke không (dùng bounding box đơn giản)
const isPointNearStroke = (x: number, y: number, stroke: Stroke, radius: number): boolean => {
  for (const pt of stroke.points) {
    const dx = pt.x - x;
    const dy = pt.y - y;
    if (Math.sqrt(dx * dx + dy * dy) <= radius + stroke.width / 2) return true;
  }
  return false;
};

// Tối ưu stroke: giảm số lượng điểm (đơn giản hoá đường vẽ)
const simplifyPoints = (points: StrokePoint[], tolerance: number = 1.5): StrokePoint[] => {
  if (points.length <= 3) return points;
  const result: StrokePoint[] = [points[0]];
  let lastKept = points[0];
  for (let i = 1; i < points.length - 1; i++) {
    const dx = points[i].x - lastKept.x;
    const dy = points[i].y - lastKept.y;
    if (dx * dx + dy * dy > tolerance * tolerance) {
      result.push(points[i]);
      lastKept = points[i];
    }
  }
  result.push(points[points.length - 1]);
  return result;
};

// Debounce tracker cho saveHistory trong addStroke
let _lastStrokeHistoryTime: Record<string, number> = {};
const STROKE_HISTORY_DEBOUNCE = 1000; // ms

// Safe localStorage wrapper — không crash khi quota đầy
const safeStorage = {
  getItem: (name: string): string | null => {
    try { return localStorage.getItem(name); }
    catch { return null; }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (e: any) {
      if (e?.name === 'QuotaExceededError') {
        // Xóa old data và thử lại
        console.warn('[CanvasStore] localStorage quota exceeded. Clearing old canvas data...');
        try {
          localStorage.removeItem(name);
          // Thử lại với data gốc
          localStorage.setItem(name, value);
        } catch {
          // Nếu vẫn lỗi, bỏ qua — dữ liệu sẽ mất khi refresh
          console.error('[CanvasStore] Cannot save to localStorage even after cleanup.');
        }
      }
    }
  },
  removeItem: (name: string): void => {
    try { localStorage.removeItem(name); }
    catch { /* ignore */ }
  },
};

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      pages: {},
      past: {},
      future: {},
      drawTool: 'type',
      drawColor: '#000000',
      drawWidth: 3,
      shapeType: 'rect',

      setDrawTool: (tool) => set({ drawTool: tool }),
      setDrawColor: (color) => set({ drawColor: color }),
      setDrawWidth: (width) => set({ drawWidth: width }),
      setShapeType: (type) => set({ shapeType: type }),

      getPageData: (docId: string) => {
        const page = get().pages[docId];
        if (!page) return defaultPageData;
        // Chỉ thêm shapes nếu thực sự không có để tránh tạo object mới mỗi lần
        if (page.shapes !== undefined) return page;
        return { ...page, shapes: [] };
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
                (updates.isFocused ? { ...c, isFocused: false } : c)
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
        // Debounce saveHistory cho strokes: chỉ lưu history nếu >1s kể từ lần cuối
        const now = Date.now();
        if (!_lastStrokeHistoryTime[docId] || now - _lastStrokeHistoryTime[docId] > STROKE_HISTORY_DEBOUNCE) {
          get().saveHistory(docId);
          _lastStrokeHistoryTime[docId] = now;
        }

        // Tối ưu stroke trước khi lưu
        const optimizedStroke = {
          ...stroke,
          points: simplifyPoints(stroke.points),
        };

        set((state) => {
          const page = state.pages[docId] || defaultPageData;
          return {
            pages: {
              ...state.pages,
              [docId]: {
                ...page,
                strokes: [...(page.strokes || []), optimizedStroke]
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
              [docId]: { ...page, strokes: [] }
            }
          };
        });
      },

      removeStrokeAt: (docId, x, y, radius) => {
        set((state) => {
          const page = state.pages[docId];
          if (!page) return state;
          const filtered = (page.strokes || []).filter(s => !isPointNearStroke(x, y, s, radius));
          if (filtered.length === page.strokes.length) return state; // không thay đổi
          return {
            pages: {
              ...state.pages,
              [docId]: { ...page, strokes: filtered }
            }
          };
        });
      },

      addShape: (docId, shape) => {
        get().saveHistory(docId);
        set((state) => {
          const page = state.pages[docId] || defaultPageData;
          return {
            pages: {
              ...state.pages,
              [docId]: {
                ...page,
                shapes: [...(page.shapes || []), shape]
              }
            }
          };
        });
      },

      removeShape: (docId, shapeId) => {
        set((state) => {
          const page = state.pages[docId];
          if (!page) return state;
          return {
            pages: {
              ...state.pages,
              [docId]: {
                ...page,
                shapes: (page.shapes || []).filter(s => s.id !== shapeId)
              }
            }
          };
        });
      },

      clearAll: (docId) => {
        get().saveHistory(docId);
        set((state) => {
          const page = state.pages[docId];
          if (!page) return state;
          return {
            pages: {
              ...state.pages,
              [docId]: { ...page, strokes: [], shapes: [] }
            }
          };
        });
      },

      saveHistory: (docId) => set((state) => {
        const page = state.pages[docId] || defaultPageData;
        const docPast = state.past[docId] || [];
        return {
          past: { ...state.past, [docId]: [...docPast, page].slice(-15) },
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

    }),
    {
      name: 'canvas-storage',
      storage: {
        getItem: (name) => {
          const val = safeStorage.getItem(name);
          return val ? JSON.parse(val) : null;
        },
        setItem: (name, value) => {
          safeStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          safeStorage.removeItem(name);
        },
      },
      // CHỈ persist pages và draw settings — KHÔNG persist past/future (history chỉ trong session)
      partialize: (state) => ({
        pages: state.pages,
        drawTool: state.drawTool,
        drawColor: state.drawColor,
        drawWidth: state.drawWidth,
        shapeType: state.shapeType,
      } as any),
    }
  )
);
