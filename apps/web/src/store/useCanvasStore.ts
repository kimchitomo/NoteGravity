import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useHistoryStore } from './useHistoryStore';

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
  updateContainer: (docId: string, containerId: string, updates: Partial<NoteContainerData>, multiSelect?: boolean) => void;
  removeContainer: (docId: string, containerId: string) => void;
  removeContainers: (docId: string, containerIds: string[]) => void;
  selectAllContainers: (docId: string) => void;
  clearAllFocus: (docId: string) => void;
  addStroke: (docId: string, stroke: Stroke) => void;
  clearStrokes: (docId: string) => void;
  removeStrokeAt: (docId: string, x: number, y: number, radius: number) => void;
  addShape: (docId: string, shape: ShapeItem) => void;
  removeShape: (docId: string, shapeId: string) => void;
  removeStrokes: (docId: string, strokeIds: string[]) => void;
  removeShapes: (docId: string, shapeIds: string[]) => void;
  moveStrokes: (docId: string, strokeIds: string[], dx: number, dy: number) => void;
  moveShapes: (docId: string, shapeIds: string[], dx: number, dy: number) => void;
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

      updateContainer: (docId, containerId, updates, multiSelect = false) => set((state) => {
        const page = state.pages[docId];
        if (!page) return state;
        return {
          pages: {
            ...state.pages,
            [docId]: {
              ...page,
              containers: page.containers.map(c =>
                c.id === containerId ? { ...c, ...updates } :
                (updates.isFocused && !multiSelect ? { ...c, isFocused: false } : c)
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

      removeContainers: (docId, containerIds) => {
        if (containerIds.length === 0) return;
        get().saveHistory(docId);
        set((state) => {
          const page = state.pages[docId];
          if (!page) return state;
          const idsSet = new Set(containerIds);
          return {
            pages: {
              ...state.pages,
              [docId]: {
                ...page,
                containers: page.containers.filter(c => !idsSet.has(c.id))
              }
            }
          };
        });
      },

      selectAllContainers: (docId) => set((state) => {
        const page = state.pages[docId];
        if (!page) return state;
        return {
          pages: {
            ...state.pages,
            [docId]: {
              ...page,
              containers: page.containers.map(c => ({ ...c, isFocused: true }))
            }
          }
        };
      }),

      clearAllFocus: (docId) => set((state) => {
        const page = state.pages[docId];
        if (!page) return state;
        return {
          pages: {
            ...state.pages,
            [docId]: {
              ...page,
              containers: page.containers.map(c => ({ ...c, isFocused: false }))
            }
          }
        };
      }),

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

      removeStrokes: (docId, strokeIds) => {
        get().saveHistory(docId);
        set((state) => {
          const page = state.pages[docId];
          if (!page) return state;
          const idSet = new Set(strokeIds);
          return {
            pages: {
              ...state.pages,
              [docId]: { ...page, strokes: (page.strokes || []).filter(s => !idSet.has(s.id)) }
            }
          };
        });
      },

      removeShapes: (docId, shapeIds) => {
        get().saveHistory(docId);
        set((state) => {
          const page = state.pages[docId];
          if (!page) return state;
          const idSet = new Set(shapeIds);
          return {
            pages: {
              ...state.pages,
              [docId]: { ...page, shapes: (page.shapes || []).filter(s => !idSet.has(s.id)) }
            }
          };
        });
      },

      moveStrokes: (docId, strokeIds, dx, dy) => {
        set((state) => {
          const page = state.pages[docId];
          if (!page) return state;
          const idSet = new Set(strokeIds);
          return {
            pages: {
              ...state.pages,
              [docId]: {
                ...page,
                strokes: page.strokes.map(s =>
                  idSet.has(s.id)
                    ? { ...s, points: s.points.map(p => ({ ...p, x: p.x + dx, y: p.y + dy })) }
                    : s
                )
              }
            }
          };
        });
      },

      moveShapes: (docId, shapeIds, dx, dy) => {
        set((state) => {
          const page = state.pages[docId];
          if (!page) return state;
          const idSet = new Set(shapeIds);
          return {
            pages: {
              ...state.pages,
              [docId]: {
                ...page,
                shapes: (page.shapes || []).map(s =>
                  idSet.has(s.id)
                    ? { ...s, x: s.x + dx, y: s.y + dy }
                    : s
                )
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

      saveHistory: (docId) => {
        // Handled by automatic subscription in useHistoryStore.ts
      },

      undo: (docId) => {
        useHistoryStore.getState().globalUndo();
      },

      redo: (docId) => {
        useHistoryStore.getState().globalRedo();
      },

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
