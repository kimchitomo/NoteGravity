import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TreeNode {
  id: string;
  title: string;
  type: 'notebook' | 'note';
  customIcon?: string;
  children?: TreeNode[];
  createdAt?: number;
  updatedAt?: number;
}

const mockData: TreeNode[] = [
  {
    id: '1',
    title: 'Sổ tay Cá nhân',
    type: 'notebook',
    children: [
      {
        id: '1-1',
        title: 'Nhật ký 2026',
        type: 'notebook',
        children: [
          { id: '1-1-1', title: 'Tháng 1', type: 'note' },
          { id: '1-1-2', title: 'Tháng 2', type: 'note' }
        ]
      },
      { id: '1-2', title: 'Ý tưởng khởi nghiệp', type: 'note' }
    ]
  },
  {
    id: '2',
    title: 'Sổ tay Công việc',
    type: 'notebook',
    children: [
      { id: '2-1', title: 'Họp giao ban (Tuần 42)', type: 'note' },
      { id: '2-2', title: 'Thiết kế hệ thống NoteGravity', type: 'note' }
    ]
  }
];

export interface PinScheduleItem {
  id: string;
  startTime: number;
  endTime: number;
  announcedStart?: boolean;
  announcedEnd?: boolean;
  announcedUnpin?: boolean;
}

interface TreeState {
  data: TreeNode[];
  expandedIds: Set<string>;
  focusedId: string | null;
  selectedIds: Set<string>;
  anchorId: string | null;
  contextMenuPos: { x: number; y: number } | null;
  contextMenuNodeId: string | null;
  emailModalNodeIds: string[] | null;
  hiddenIds: Set<string>;
  pinnedIds: Set<string>;
  recentIds: string[];
  lastAccessedAt: Record<string, number>;
  actionLog: { 
    id: string; 
    timestamp: number; 
    action: string; 
    noteTitle: string; 
    docId?: string;
    snapshot?: {
      treeData: TreeNode[];
      noteContents: Record<string, string>;
    }
  }[];

  // New States
  editingNodeId: string | null;
  clipboard: { ids: string[]; action: 'copy' | 'cut'; nodes: TreeNode[] } | null;
  destinationModalData: { ids: string[]; action: 'move' | 'copy' } | null;
  iconPickerNodeIds: string[] | null;
  mindmapModalNodeId: string | null;
  schedulePinModalNodeIds: string[] | null;
  highlightedBranchId: string | null;
  lockedIds: Set<string>;
  readIds: Set<string>;
  deletedNodes: { node: TreeNode; parentId: string | null; deletedAt: number }[];

  pinSchedule: {
    items: PinScheduleItem[];
    isActive: boolean;
  } | null;

  offlineAsrDevice: 'webgpu' | 'wasm';
  setOfflineAsrDevice: (device: 'webgpu' | 'wasm') => void;

  toggleExpand: (id: string) => void;
  setFocus: (id: string) => void;
  toggleLock: (id: string) => void;
  toggleRead: (id: string) => void;
  restoreNode: (id: string) => void;
  permanentlyDelete: (id: string) => void;
  selectRange: (id: string) => void;
  setSelected: (id: string, multi?: boolean) => void;
  openContextMenu: (id: string, x: number, y: number) => void;
  closeContextMenu: () => void;
  openEmailModal: (ids: string[]) => void;
  closeEmailModal: () => void;

  setEditingNodeId: (id: string | null) => void;
  openDestinationModal: (ids: string[], action: 'move' | 'copy') => void;
  closeDestinationModal: () => void;
  openIconPicker: (ids: string[]) => void;
  closeIconPicker: () => void;
  openMindmapModal: (id: string) => void;
  closeMindmapModal: () => void;

  togglePin: (id: string) => void;
  addRecentView: (id: string) => void;
  autoCollapseOldFolders: () => void;

  openSchedulePinModal: (ids: string[]) => void;
  closeSchedulePinModal: () => void;
  startPinSchedule: (items: PinScheduleItem[]) => void;
  stopPinSchedule: () => void;
  checkPinSchedule: () => void;

  // Mutations
  restoreSnapshot: (snapshot: { treeData: TreeNode[], noteContents: Record<string, string> }, mode: 'global' | 'local', targetDocId?: string) => void;
  addActionLog: (action: string, noteTitle: string, docId?: string) => void;
  addRootNode: (titleOrType: string, title?: string) => void;
  addImportedNodes: (nodes: TreeNode[]) => void;
  addNode: (parentId: string, type: 'notebook' | 'note', title: string) => void;
  deleteNode: (id: string) => void;
  hideNode: (id: string) => void;
  unhideNode: (id: string) => void;
  renameNode: (id: string, title: string) => void;
  updateNodeIcon: (id: string, icon: string) => void;
  numberChildNotes: (id: string) => void;
  copyToClipboard: (ids: string[], action: 'copy' | 'cut') => void;
  pasteFromClipboard: (parentId: string | null) => void;
  moveNodeUp: (id: string) => void;
  moveNodeDown: (id: string) => void;
  moveNodeTo: (id: string, destParentId: string) => void;
  moveNodeBefore: (sourceId: string, targetId: string) => void;
  moveNodeAfter: (sourceId: string, targetId: string) => void;
  moveNodesTo: (ids: string[], destParentId: string) => void;
  moveNodesBefore: (sourceIds: string[], targetId: string) => void;
  moveNodesAfter: (sourceIds: string[], targetId: string) => void;
  copyNodeTo: (id: string, destParentId: string) => void;
  copyNodesTo: (ids: string[], destParentId: string) => void;
  duplicateNode: (id: string) => void;

  // Keyboard navigation
  moveFocusDown: () => void;
  moveFocusUp: () => void;
  moveFocusRight: () => void;
  moveFocusLeft: () => void;
}

const getVisibleNodes = (nodes: TreeNode[], expandedIds: Set<string>): TreeNode[] => {
  let visible: TreeNode[] = [];
  for (const node of nodes) {
    visible.push(node);
    if (expandedIds.has(node.id) && node.children) {
      visible = visible.concat(getVisibleNodes(node.children, expandedIds));
    }
  }
  return visible;
};

export const findNodeById = (nodes: TreeNode[], id: string): TreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const createSnapshot = (treeData: TreeNode[]) => {
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
  return { treeData: JSON.parse(JSON.stringify(treeData)), noteContents };
};

let ttsWorker: Worker | null = null;
let audioContext: AudioContext | null = null;

const playAudio = (audioData: Float32Array, sampleRate: number) => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioBuffer = audioContext.createBuffer(1, audioData.length, sampleRate);
    audioBuffer.copyToChannel(audioData as any, 0);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
};

const initTTSWorker = () => {
  if (typeof window === 'undefined') return;
  if (!ttsWorker) {
    ttsWorker = new Worker(new URL('../workers/tts.worker.ts', import.meta.url), { type: 'module' });
    ttsWorker.onmessage = (e) => {
        const { status, audio, sampling_rate, error, text } = e.data;
        if (status === 'complete' && audio) {
            playAudio(audio, sampling_rate);
            
            if ('Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification('NoteGravity', { body: text });
              }
            }
        } else if (status === 'error') {
            console.error('TTS Worker Error:', error);
        }
    };
    ttsWorker.postMessage({ type: 'INIT' });
  }
};

export let asrWorker: Worker | null = null;
export const initAsrWorker = (device: 'wasm' | 'webgpu') => {
  if (typeof window === 'undefined') return;
  if (!asrWorker) {
    asrWorker = new Worker(new URL('../workers/asr.worker.ts', import.meta.url), { type: 'module' });
  }
  asrWorker.postMessage({ type: 'INIT', device });
};
export const terminateAsrWorker = () => {
  if (asrWorker) {
    asrWorker.terminate();
    asrWorker = null;
  }
};

const announce = (message: string) => {
  if (typeof window !== 'undefined') {
    if (ttsWorker) {
        ttsWorker.postMessage({ type: 'GENERATE', text: message, id: Date.now().toString() });
    }
    
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }
};

const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const getParentNode = (nodes: TreeNode[], targetId: string, parent: TreeNode | null = null): TreeNode | null => {
  for (const node of nodes) {
    if (node.id === targetId) return parent;
    if (node.children) {
      const found = getParentNode(node.children, targetId, node);
      if (found) return found;
    }
  }
  return null;
}

const getFullNodePath = (nodes: TreeNode[], targetId: string): string => {
  let current: TreeNode | null = findNode(nodes, targetId);
  if (!current) return 'ghi chú';
  
  const path = [current.title];
  let parentId = targetId;
  
  while (true) {
    const parent = getParentNode(nodes, parentId);
    if (parent) {
      path.unshift(parent.title);
      parentId = parent.id;
    } else {
      break;
    }
  }
  
  return path.join(', ');
};

const updateLastAccessedAt = (data: TreeNode[], currentLastAccessedAt: Record<string, number>, id: string) => {
    const newLastAccessedAt = { ...(currentLastAccessedAt || {}) };
    const now = Date.now();
    let currentId = id;
    newLastAccessedAt[currentId] = now;
    while (true) {
      const parent = getParentNode(data, currentId);
      if (parent) {
        newLastAccessedAt[parent.id] = now;
        currentId = parent.id;
      } else {
        break;
      }
    }
    return newLastAccessedAt;
};

export const useTreeStore = create<TreeState>()(
  persist(
    (set, get) => ({
      data: mockData,
  expandedIds: new Set<string>(),
  focusedId: null,
  selectedIds: new Set<string>(),
  anchorId: null,
  contextMenuPos: null,
  contextMenuNodeId: null,
  emailModalNodeIds: null,
  hiddenIds: new Set<string>(),
  pinnedIds: new Set<string>(),
  lockedIds: new Set<string>(),
  readIds: new Set<string>(),
  deletedNodes: [],
  recentIds: [],
  lastAccessedAt: {},
  actionLog: [],

  editingNodeId: null,
  clipboard: null,
  destinationModalData: null,
  iconPickerNodeIds: null,
  mindmapModalNodeId: null,
  schedulePinModalNodeIds: null,
  highlightedBranchId: null,
  pinSchedule: null,
  offlineAsrDevice: 'wasm',

  setOfflineAsrDevice: (device) => set({ offlineAsrDevice: device }),

  toggleExpand: (id) => set((state) => {
    const newExpanded = new Set(state.expandedIds);
    let newHighlightedBranchId = state.highlightedBranchId;
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
      if (newHighlightedBranchId === id) newHighlightedBranchId = null;
    } else {
      newExpanded.add(id);
      newHighlightedBranchId = id;
    }
    return { 
      expandedIds: newExpanded, 
      highlightedBranchId: newHighlightedBranchId,
      lastAccessedAt: updateLastAccessedAt(state.data, state.lastAccessedAt, id)
    };
  }),

  setFocus: (id) => set((state) => ({ 
    focusedId: id,
    lastAccessedAt: updateLastAccessedAt(state.data, state.lastAccessedAt, id)
  })),
  setSelected: (id, multi) => set((state) => {
    const newLastAccessed = updateLastAccessedAt(state.data, state.lastAccessedAt, id);
    if (multi) {
      const newSelected = new Set(state.selectedIds);
      if (newSelected.has(id)) newSelected.delete(id);
      else newSelected.add(id);
      return { selectedIds: newSelected, anchorId: id, lastAccessedAt: newLastAccessed };
    }
    return { selectedIds: new Set([id]), anchorId: id, lastAccessedAt: newLastAccessed };
  }),
  
  toggleLock: (id) => set((state) => {
    const newLocked = new Set(state.lockedIds);
    if (newLocked.has(id)) newLocked.delete(id);
    else newLocked.add(id);
    return { lockedIds: newLocked };
  }),

  toggleRead: (id) => set((state) => {
    const newRead = new Set(state.readIds);
    if (newRead.has(id)) newRead.delete(id);
    else newRead.add(id);
    return { readIds: newRead };
  }),

  restoreNode: (id) => set((state) => {
    const entry = state.deletedNodes.find(e => e.node.id === id);
    if (!entry) return state;
    const newDeleted = state.deletedNodes.filter(e => e.node.id !== id);
    // Restore to root if parent gone, else to parent
    const parentExists = entry.parentId ? !!findNodeById(state.data, entry.parentId) : false;
    let newData: TreeNode[];
    if (!entry.parentId || !parentExists) {
      newData = [...state.data, entry.node];
    } else {
      const addToParent = (nodes: TreeNode[]): TreeNode[] =>
        nodes.map(n => n.id === entry.parentId
          ? { ...n, children: [...(n.children || []), entry.node] }
          : { ...n, children: n.children ? addToParent(n.children) : undefined }
        );
      newData = addToParent(state.data);
    }
    return { data: newData, deletedNodes: newDeleted };
  }),

  permanentlyDelete: (id) => set((state) => {
    const entry = state.deletedNodes.find(e => e.node.id === id);
    if (entry) {
      const collectAllIds = (node: TreeNode): string[] => {
        let ids = [node.id];
        if (node.children) {
          node.children.forEach(child => {
            ids = ids.concat(collectAllIds(child));
          });
        }
        return ids;
      };
      
      const idsToDelete = collectAllIds(entry.node);
      
      if (typeof window !== 'undefined' && 'caches' in window) {
        caches.open('tts-offline-cache').then(async (cache) => {
          try {
            const requests = await cache.keys();
            for (const req of requests) {
              const url = new URL(req.url);
              const nodeId = url.searchParams.get('nodeId');
              if (nodeId && idsToDelete.includes(nodeId)) {
                await cache.delete(req);
              }
            }
          } catch (e) {
            console.error('Lỗi khi xóa cache offline cho node bị xóa vĩnh viễn:', e);
          }
        });
      }
    }
    return {
      deletedNodes: state.deletedNodes.filter(e => e.node.id !== id)
    };
  }),

  selectRange: (id) => set((state) => {
    if (!state.anchorId) return { selectedIds: new Set([id]), anchorId: id };
    
    const visibleNodes = getVisibleNodes(state.data, state.expandedIds);
    const startIndex = visibleNodes.findIndex(n => n.id === state.anchorId);
    const endIndex = visibleNodes.findIndex(n => n.id === id);
    
    if (startIndex === -1 || endIndex === -1) {
      return { selectedIds: new Set([id]), anchorId: id };
    }
    
    const min = Math.min(startIndex, endIndex);
    const max = Math.max(startIndex, endIndex);
    
    const newSelected = new Set(state.selectedIds);
    for (let i = min; i <= max; i++) {
      newSelected.add(visibleNodes[i].id);
    }
    
    return { selectedIds: newSelected };
  }),
  
  openContextMenu: (id, x, y) => set({ contextMenuNodeId: id, contextMenuPos: { x, y } }),
  closeContextMenu: () => set({ contextMenuNodeId: null, contextMenuPos: null }),
  
  openEmailModal: (ids) => set({ emailModalNodeIds: ids, contextMenuNodeId: null }),
  closeEmailModal: () => set({ emailModalNodeIds: null }),

  setEditingNodeId: (id) => set({ editingNodeId: id }),
  openDestinationModal: (ids, action) => set({ destinationModalData: { ids, action }, contextMenuNodeId: null }),
  closeDestinationModal: () => set({ destinationModalData: null }),
  openIconPicker: (ids) => set({ iconPickerNodeIds: ids, contextMenuNodeId: null }),
  closeIconPicker: () => set({ iconPickerNodeIds: null }),
  openSchedulePinModal: (ids) => set({ schedulePinModalNodeIds: ids, contextMenuNodeId: null }),
  closeSchedulePinModal: () => set({ schedulePinModalNodeIds: null }),
  
  startPinSchedule: (items) => set((state) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    initTTSWorker();
    return {
      pinSchedule: { items, isActive: true },
      schedulePinModalNodeIds: null
    };
  }),

  stopPinSchedule: () => set((state) => {
    if (!state.pinSchedule) return state;
    const newPinned = new Set(state.pinnedIds);
    state.pinSchedule.items.forEach(item => newPinned.delete(item.id));
    return { pinSchedule: null, pinnedIds: newPinned };
  }),

  checkPinSchedule: () => set((state) => {
    if (!state.pinSchedule || !state.pinSchedule.isActive) return state;
    
    const now = Date.now();
    let allFinished = true;
    let changed = false;
    let itemsChanged = false;
    const newItems = [...state.pinSchedule.items];
    
    newItems.forEach((item, index) => {
        const itemCopy = { ...item };
        let modified = false;
        
        if (now >= itemCopy.startTime && now <= itemCopy.endTime) {
            if (!state.pinnedIds.has(itemCopy.id)) changed = true;
            allFinished = false;
            
            if (!itemCopy.announcedStart) {
                const name = getFullNodePath(state.data, itemCopy.id);
                announce(`Bắt đầu ghim ${name}`);
                itemCopy.announcedStart = true;
                modified = true;
            }
            
            if (now >= itemCopy.endTime - 10000 && !itemCopy.announcedEnd) {
                const name = getFullNodePath(state.data, itemCopy.id);
                announce(`Chuẩn bị kết thúc ghim ${name}`);
                itemCopy.announcedEnd = true;
                modified = true;
            }
        } else {
            if (state.pinnedIds.has(itemCopy.id)) changed = true;
            if (now < itemCopy.endTime) {
                allFinished = false;
            } else {
                // now > itemCopy.endTime
                if (!itemCopy.announcedUnpin) {
                    const name = getFullNodePath(state.data, itemCopy.id);
                    announce(`Đã bỏ ghim ${name}`);
                    itemCopy.announcedUnpin = true;
                    modified = true;
                }
            }
        }
        
        if (modified) {
            newItems[index] = itemCopy;
            itemsChanged = true;
        }
    });
    
    if (allFinished) {
        const newPinned = new Set(state.pinnedIds);
        state.pinSchedule.items.forEach(item => newPinned.delete(item.id));
        return {
            pinnedIds: newPinned,
            pinSchedule: null
        };
    }
    
    if (changed || itemsChanged) {
        const newPinned = new Set(state.pinnedIds);
        newItems.forEach(item => {
            if (now >= item.startTime && now <= item.endTime) {
                newPinned.add(item.id);
            } else {
                newPinned.delete(item.id);
            }
        });
        return { 
            pinnedIds: newPinned,
            pinSchedule: { ...state.pinSchedule, items: newItems }
        };
    }
    
    return state;
  }),

  openMindmapModal: (id) => set({ mindmapModalNodeId: id }),
  closeMindmapModal: () => set({ mindmapModalNodeId: null }),

  togglePin: (id) => set((state) => {
    const newPinned = new Set(state.pinnedIds);
    if (newPinned.has(id)) newPinned.delete(id);
    else newPinned.add(id);
    return { pinnedIds: newPinned };
  }),

  addRecentView: (id) => set((state) => {
    let newRecent = [id, ...state.recentIds.filter(recentId => recentId !== id)];
    if (newRecent.length > 20) newRecent = newRecent.slice(0, 20);
    
    const newLastAccessedAt = updateLastAccessedAt(state.data, state.lastAccessedAt, id);
    
    // Auto add an action log for view
    const node = findNodeById(state.data, id);
    const title = node ? node.title : 'Unknown Note';
    let newLog = [{ 
      id: Math.random().toString(36).substring(2, 9), 
      timestamp: Date.now(), 
      action: 'Opened note', 
      noteTitle: title,
      docId: id,
      snapshot: createSnapshot(state.data) 
    }, ...state.actionLog];
    if (newLog.length > 30) newLog = newLog.slice(0, 30);

    return { recentIds: newRecent, actionLog: newLog, lastAccessedAt: newLastAccessedAt };
  }),

  autoCollapseOldFolders: () => set((state) => {
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const newExpandedIds = new Set(state.expandedIds);
    let changed = false;
    const newLastAccessed = { ...(state.lastAccessedAt || {}) };
    
    state.expandedIds.forEach(id => {
      const lastAccessed = newLastAccessed[id];
      if (!lastAccessed) {
        newLastAccessed[id] = now;
        changed = true;
      } else if (now - lastAccessed > THREE_DAYS) {
        newExpandedIds.delete(id);
        changed = true;
      }
    });
    
    if (changed) {
      return { expandedIds: newExpandedIds, lastAccessedAt: newLastAccessed };
    }
    return {};
  }),

  restoreSnapshot: (snapshot, mode, targetDocId) => set((state) => {
    if (mode === 'global') {
      if (typeof window !== 'undefined' && window.localStorage) {
        Object.entries(snapshot.noteContents).forEach(([docId, content]) => {
          localStorage.setItem(`note-content-${docId}`, content);
        });
        // Bắn event để editor tự reload
        window.dispatchEvent(new Event('storage'));
      }
      return { data: snapshot.treeData };
    } else if (mode === 'local' && targetDocId) {
      if (typeof window !== 'undefined' && window.localStorage) {
        let restoredAny = false;
        Object.keys(snapshot.noteContents).forEach(key => {
          if (key === targetDocId || key.startsWith(`${targetDocId}-`)) {
            const oldContent = snapshot.noteContents[key];
            localStorage.setItem(`note-content-${key}`, oldContent);
            restoredAny = true;
          }
        });
        if (restoredAny) {
          // Bắn event
          window.dispatchEvent(new CustomEvent('reload-editor', { detail: { docId: targetDocId } }));
        }
      }
      return state;
    }
    return state;
  }),

  addActionLog: (action, noteTitle, docId) => set((state) => {
    let newLog = [{ 
      id: Math.random().toString(36).substring(2, 9), 
      timestamp: Date.now(), 
      action, 
      noteTitle,
      docId,
      snapshot: createSnapshot(state.data)
    }, ...state.actionLog];
    if (newLog.length > 30) newLog = newLog.slice(0, 30);
    return { actionLog: newLog };
  }),

  addImportedNodes: (nodes) => set((state) => {
    let newLog = [{ 
      id: Math.random().toString(36).substring(2, 9), 
      timestamp: Date.now(), 
      action: 'Imported data', 
      noteTitle: `${nodes.length} items`,
      snapshot: createSnapshot(state.data) 
    }, ...state.actionLog];
    if (newLog.length > 50) newLog = newLog.slice(0, 50);
    
    return { 
      data: [...state.data, ...nodes],
      actionLog: newLog,
    };
  }),

  addRootNode: (titleOrType, title) => set((state) => {
    const now = Date.now();
    const actualTitle = title || titleOrType;
    const actualType = title ? titleOrType : 'notebook';
    const newId = `${now}`;
    const newNode: TreeNode = { id: newId, title: actualTitle, type: actualType as any, children: actualType === 'notebook' ? [] : undefined, createdAt: now, updatedAt: now };
    
    let newLog = [{ id: Math.random().toString(36).substring(2, 9), timestamp: Date.now(), action: 'Created new node', noteTitle: actualTitle }, ...state.actionLog];
    if (newLog.length > 50) newLog = newLog.slice(0, 50);
    
    return { 
      data: [...state.data, newNode],
      focusedId: newId,
      editingNodeId: newId,
      selectedIds: new Set([newId]),
      anchorId: newId,
      actionLog: newLog,
      lastAccessedAt: updateLastAccessedAt(state.data, state.lastAccessedAt, newId)
    };
  }),

  addNode: (parentId, type, title) => set((state) => {
    const now = Date.now();
    const newId = `${now}`;
    const addRecursive = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === parentId) {
          return {
            ...node,
            children: [...(node.children || []), { id: newId, title, type, customIcon: node.customIcon, children: type === 'notebook' ? [] : undefined, createdAt: now, updatedAt: now }]
          };
        }
        if (node.children) {
          return { ...node, children: addRecursive(node.children) };
        }
        return node;
      });
    };
    let newLog = [{ 
      id: Math.random().toString(36).substring(2, 9), 
      timestamp: Date.now(), 
      action: `Created ${type}`, 
      noteTitle: title,
      snapshot: createSnapshot(state.data) 
    }, ...state.actionLog];
    if (newLog.length > 30) newLog = newLog.slice(0, 30);

    return { 
      data: addRecursive(state.data), 
      expandedIds: new Set(state.expandedIds).add(parentId),
      focusedId: newId,
      editingNodeId: newId,
      selectedIds: new Set([newId]),
      anchorId: newId,
      actionLog: newLog,
      lastAccessedAt: updateLastAccessedAt(state.data, state.lastAccessedAt, newId)
    };
  }),

  deleteNode: (id) => set((state) => {
    const nodeToDelete = findNodeById(state.data, id);
    const title = nodeToDelete ? nodeToDelete.title : 'Unknown Note';
    const parentNode = getParentNode(state.data, id);

    const findFocusTarget = (nodes: TreeNode[], targetId: string, parentId: string | null = null): string | null => {
      const index = nodes.findIndex(n => n.id === targetId);
      if (index !== -1) {
        if (index > 0) {
           return nodes[index - 1].id;
        } else {
           return parentId;
        }
      }
      for (const n of nodes) {
        if (n.children) {
          const found = findFocusTarget(n.children, targetId, n.id);
          if (found !== null) return found;
        }
      }
      return null;
    };

    const idToFocus = findFocusTarget(state.data, id);

    const deleteRecursive = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.filter(node => node.id !== id).map(node => ({
        ...node,
        children: node.children ? deleteRecursive(node.children) : undefined
      }));
    };
    
    let newLog = [{ 
      id: Math.random().toString(36).substring(2, 9), 
      timestamp: Date.now(), 
      action: 'Deleted note', 
      noteTitle: title,
      snapshot: createSnapshot(state.data) 
    }, ...state.actionLog];
    if (newLog.length > 30) newLog = newLog.slice(0, 30);

    // Lưu vào Recycle Bin
    const newDeletedEntry = nodeToDelete
      ? { node: nodeToDelete, parentId: parentNode ? parentNode.id : null, deletedAt: Date.now() }
      : null;
    const newDeleted = newDeletedEntry
      ? [...state.deletedNodes, newDeletedEntry].slice(-50)
      : state.deletedNodes;

    return { 
       data: deleteRecursive(state.data), 
       actionLog: newLog,
       focusedId: idToFocus || null,
       deletedNodes: newDeleted
    };
  }),

  hideNode: (id) => set((state) => {
    const newHidden = new Set(state.hiddenIds);
    newHidden.add(id);
    return { hiddenIds: newHidden };
  }),

  unhideNode: (id) => set((state) => {
    const newHidden = new Set(state.hiddenIds);
    newHidden.delete(id);
    return { hiddenIds: newHidden };
  }),

  renameNode: (id, title) => set((state) => {
    const now = Date.now();
    const mapNodes = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => 
      n.id === id ? { ...n, title, updatedAt: now } : { ...n, children: n.children ? mapNodes(n.children) : undefined }
    );

    const oldNode = findNodeById(state.data, id);
    const oldTitle = oldNode ? oldNode.title : 'Unknown Note';

    let newLog = [{ 
      id: Math.random().toString(36).substring(2, 9), 
      timestamp: Date.now(), 
      action: `Renamed from "${oldTitle}"`, 
      noteTitle: title,
      docId: id,
      snapshot: createSnapshot(state.data) 
    }, ...state.actionLog];
    if (newLog.length > 30) newLog = newLog.slice(0, 30);

    return { data: mapNodes(state.data), actionLog: newLog };
  }),

  numberChildNotes: (id) => set((state) => {
    const now = Date.now();
    const mapNodes = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
      if (n.id === id && n.children) {
        let noteCounter = 1;
        const newChildren = n.children.map(child => {
          if (child.type === 'note') {
            const cleanTitle = child.title.replace(/^\d+[\.\-]\s*/, '');
            return { ...child, title: `${noteCounter++}. ${cleanTitle}`, updatedAt: now };
          }
          return child;
        });
        return { ...n, children: newChildren, updatedAt: now };
      }
      return { ...n, children: n.children ? mapNodes(n.children) : undefined };
    });
    return { data: mapNodes(state.data) };
  }),

  updateNodeIcon: (id, icon) => set((state) => {
    const applyIconRecursive = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => ({
      ...n,
      customIcon: icon,
      children: n.children ? applyIconRecursive(n.children) : undefined
    }));

    const mapNodes = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
      if (n.id === id) {
        return {
          ...n,
          customIcon: icon,
          children: n.children ? applyIconRecursive(n.children) : undefined
        };
      }
      return { ...n, children: n.children ? mapNodes(n.children) : undefined };
    });
    return { data: mapNodes(state.data) };
  }),

  copyToClipboard: (ids, action) => set((state) => {
    const nodes = ids.map(id => findNode(state.data, id)).filter(Boolean) as TreeNode[];
    if (nodes.length === 0) return state;
    const clonedNodes = JSON.parse(JSON.stringify(nodes));
    return { clipboard: { ids, action, nodes: clonedNodes } };
  }),

  pasteFromClipboard: (parentId) => set((state) => {
    if (!state.clipboard) return state;
    const { ids, action, nodes } = state.clipboard;
    let newData = state.data;
    
    if (action === 'cut') {
      const idsSet = new Set(ids);
      const deleteRecursive = (treeNodes: TreeNode[]): TreeNode[] => treeNodes.filter(n => !idsSet.has(n.id)).map(n => ({ ...n, children: n.children ? deleteRecursive(n.children) : undefined }));
      newData = deleteRecursive(newData);
    }
    
    const cloneRecursive = (node: TreeNode): TreeNode => {
      const newId = `${node.type}-${Math.random().toString(36).substr(2, 9)}`;
      if (node.type === 'note') {
        const savedContent = localStorage.getItem(`note-content-${node.id}`);
        if (savedContent) localStorage.setItem(`note-content-${newId}`, savedContent);
      }
      return {
        ...node,
        id: newId,
        children: node.children ? node.children.map(cloneRecursive) : undefined,
      };
    };

    const newNodes = nodes.map(cloneRecursive);
    
    if (!parentId) {
      return {
        data: [...newData, ...newNodes],
        clipboard: action === 'cut' ? null : state.clipboard
      };
    }

    const addRecursive = (treeNodes: TreeNode[]): TreeNode[] => treeNodes.map(n => {
      if (n.id === parentId) {
        return { ...n, children: [...(n.children || []), ...newNodes] };
      }
      return { ...n, children: n.children ? addRecursive(n.children) : undefined };
    });

    return { 
      data: addRecursive(newData), 
      clipboard: action === 'cut' ? null : state.clipboard,
      expandedIds: new Set(state.expandedIds).add(parentId)
    };
  }),

  moveNodeUp: (id) => set((state) => {
    const moveRec = (nodes: TreeNode[]): TreeNode[] => {
      const idx = nodes.findIndex(n => n.id === id);
      if (idx > 0) {
        const newNodes = [...nodes];
        [newNodes[idx - 1], newNodes[idx]] = [newNodes[idx], newNodes[idx - 1]];
        return newNodes;
      }
      return nodes.map(n => ({ ...n, children: n.children ? moveRec(n.children) : undefined }));
    };
    return { data: moveRec(state.data) };
  }),

  moveNodeDown: (id) => set((state) => {
    const moveRec = (nodes: TreeNode[]): TreeNode[] => {
      const idx = nodes.findIndex(n => n.id === id);
      if (idx !== -1 && idx < nodes.length - 1) {
        const newNodes = [...nodes];
        [newNodes[idx], newNodes[idx + 1]] = [newNodes[idx + 1], newNodes[idx]];
        return newNodes;
      }
      return nodes.map(n => ({ ...n, children: n.children ? moveRec(n.children) : undefined }));
    };
    return { data: moveRec(state.data) };
  }),

  moveNodeTo: (id, destParentId) => set((state) => {
    if (id === destParentId) return state;
    const nodeToMove = findNode(state.data, id);
    if (!nodeToMove) return state;
    if (findNode(nodeToMove.children || [], destParentId)) return state; // Prevent moving to descendant
    
    // delete from original
    const deleteRecursive = (nodes: TreeNode[]): TreeNode[] => nodes.filter(n => n.id !== id).map(n => ({ ...n, children: n.children ? deleteRecursive(n.children) : undefined }));
    let newData = deleteRecursive(state.data);
    
    // add to new
    const addRecursive = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
      if (n.id === destParentId) {
        return { ...n, children: [...(n.children || []), nodeToMove] };
      }
      return { ...n, children: n.children ? addRecursive(n.children) : undefined };
    });
    
    return { data: addRecursive(newData), expandedIds: new Set(state.expandedIds).add(destParentId) };
  }),

  moveNodesTo: (ids, destParentId) => set((state) => {
    const isInvalid = ids.some(id => {
      const n = findNode(state.data, id);
      return n && (n.id === destParentId || findNode(n.children || [], destParentId));
    });
    if (isInvalid) return state;

    const nodesToMove = ids.map(id => findNode(state.data, id)).filter(Boolean) as TreeNode[];
    if (nodesToMove.length === 0) return state;

    const idsSet = new Set(ids);
    const deleteRecursive = (nodes: TreeNode[]): TreeNode[] => nodes.filter(n => !idsSet.has(n.id)).map(n => ({ ...n, children: n.children ? deleteRecursive(n.children) : undefined }));
    let newData = deleteRecursive(state.data);

    const addRecursive = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
      if (n.id === destParentId) {
        return { ...n, children: [...(n.children || []), ...nodesToMove] };
      }
      return { ...n, children: n.children ? addRecursive(n.children) : undefined };
    });

    return { data: addRecursive(newData), expandedIds: new Set(state.expandedIds).add(destParentId) };
  }),

  moveNodeBefore: (sourceId, targetId) => set((state) => {
    if (sourceId === targetId) return state;
    const nodeToMove = findNode(state.data, sourceId);
    if (!nodeToMove) return state;
    if (findNode(nodeToMove.children || [], targetId)) return state;

    const deleteRecursive = (nodes: TreeNode[]): TreeNode[] => nodes.filter(n => n.id !== sourceId).map(n => ({ ...n, children: n.children ? deleteRecursive(n.children) : undefined }));
    let newData = deleteRecursive(state.data);

    const insertRecursive = (nodes: TreeNode[]): TreeNode[] => {
      let result: TreeNode[] = [];
      for (const n of nodes) {
        if (n.id === targetId) {
          result.push(nodeToMove);
          result.push(n);
        } else {
          result.push({ ...n, children: n.children ? insertRecursive(n.children) : undefined });
        }
      }
      return result;
    };
    return { data: insertRecursive(newData) };
  }),

  moveNodesBefore: (sourceIds, targetId) => set((state) => {
    const isInvalid = sourceIds.some(id => {
      const n = findNode(state.data, id);
      return n && (n.id === targetId || findNode(n.children || [], targetId));
    });
    if (isInvalid) return state;

    const idsSet = new Set(sourceIds);
    if (idsSet.has(targetId)) return state;
    const nodesToMove = sourceIds.map(id => findNode(state.data, id)).filter(Boolean) as TreeNode[];
    if (nodesToMove.length === 0) return state;

    const deleteRecursive = (nodes: TreeNode[]): TreeNode[] => nodes.filter(n => !idsSet.has(n.id)).map(n => ({ ...n, children: n.children ? deleteRecursive(n.children) : undefined }));
    let newData = deleteRecursive(state.data);

    const insertRecursive = (nodes: TreeNode[]): TreeNode[] => {
      let result: TreeNode[] = [];
      for (const n of nodes) {
        if (n.id === targetId) {
          result.push(...nodesToMove);
          result.push(n);
        } else {
          result.push({ ...n, children: n.children ? insertRecursive(n.children) : undefined });
        }
      }
      return result;
    };
    return { data: insertRecursive(newData) };
  }),

  moveNodeAfter: (sourceId, targetId) => set((state) => {
    if (sourceId === targetId) return state;
    const nodeToMove = findNode(state.data, sourceId);
    if (!nodeToMove) return state;
    if (findNode(nodeToMove.children || [], targetId)) return state;

    const deleteRecursive = (nodes: TreeNode[]): TreeNode[] => nodes.filter(n => n.id !== sourceId).map(n => ({ ...n, children: n.children ? deleteRecursive(n.children) : undefined }));
    let newData = deleteRecursive(state.data);

    const insertRecursive = (nodes: TreeNode[]): TreeNode[] => {
      let result: TreeNode[] = [];
      for (const n of nodes) {
        if (n.id === targetId) {
          result.push(n);
          result.push(nodeToMove);
        } else {
          result.push({ ...n, children: n.children ? insertRecursive(n.children) : undefined });
        }
      }
      return result;
    };
    return { data: insertRecursive(newData) };
  }),

  moveNodesAfter: (sourceIds, targetId) => set((state) => {
    const isInvalid = sourceIds.some(id => {
      const n = findNode(state.data, id);
      return n && (n.id === targetId || findNode(n.children || [], targetId));
    });
    if (isInvalid) return state;

    const idsSet = new Set(sourceIds);
    if (idsSet.has(targetId)) return state;
    const nodesToMove = sourceIds.map(id => findNode(state.data, id)).filter(Boolean) as TreeNode[];
    if (nodesToMove.length === 0) return state;

    const deleteRecursive = (nodes: TreeNode[]): TreeNode[] => nodes.filter(n => !idsSet.has(n.id)).map(n => ({ ...n, children: n.children ? deleteRecursive(n.children) : undefined }));
    let newData = deleteRecursive(state.data);

    const insertRecursive = (nodes: TreeNode[]): TreeNode[] => {
      let result: TreeNode[] = [];
      for (const n of nodes) {
        if (n.id === targetId) {
          result.push(n);
          result.push(...nodesToMove);
        } else {
          result.push({ ...n, children: n.children ? insertRecursive(n.children) : undefined });
        }
      }
      return result;
    };
    return { data: insertRecursive(newData) };
  }),

  duplicateNode: (id) => set((state) => {
    const nodeToDuplicate = findNode(state.data, id);
    if (!nodeToDuplicate) return state;

    const cloneRecursive = (node: TreeNode): TreeNode => {
      const newId = `${node.type}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Copy content from localStorage if it exists
      if (node.type === 'note') {
        const savedContent = localStorage.getItem(`note-content-${node.id}`);
        if (savedContent) {
          localStorage.setItem(`note-content-${newId}`, savedContent);
        }
      }

      return {
        ...node,
        id: newId,
        title: `${node.title} (Bản sao)`,
        children: node.children ? node.children.map(cloneRecursive) : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    };

    const clonedNode = cloneRecursive(nodeToDuplicate);

    const insertAfterRecursive = (nodes: TreeNode[]): TreeNode[] => {
      let result: TreeNode[] = [];
      for (const n of nodes) {
        if (n.id === id) {
          result.push({ ...n, children: n.children ? insertAfterRecursive(n.children) : undefined });
          result.push(clonedNode);
        } else {
          result.push({ ...n, children: n.children ? insertAfterRecursive(n.children) : undefined });
        }
      }
      return result;
    };

    return { data: insertAfterRecursive(state.data) };
  }),

  copyNodeTo: (id, destParentId) => set((state) => {
    const nodeToCopy = findNode(state.data, id);
    if (!nodeToCopy) return state;
    
    const cloneRecursive = (node: TreeNode): TreeNode => {
      const newId = `${node.type}-${Math.random().toString(36).substr(2, 9)}`;
      if (node.type === 'note') {
        const savedContent = localStorage.getItem(`note-content-${node.id}`);
        if (savedContent) localStorage.setItem(`note-content-${newId}`, savedContent);
      }
      return {
        ...node,
        id: newId,
        children: node.children ? node.children.map(cloneRecursive) : undefined,
      };
    };

    const clonedNode = cloneRecursive(nodeToCopy);
    
    const addRecursive = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
      if (n.id === destParentId) {
        return { ...n, children: [...(n.children || []), clonedNode] };
      }
      return { ...n, children: n.children ? addRecursive(n.children) : undefined };
    });
    
    return { data: addRecursive(state.data), expandedIds: new Set(state.expandedIds).add(destParentId) };
  }),

  copyNodesTo: (ids, destParentId) => set((state) => {
    const nodesToCopy = ids.map(id => findNode(state.data, id)).filter(Boolean) as TreeNode[];
    if (nodesToCopy.length === 0) return state;

    const cloneRecursive = (node: TreeNode): TreeNode => {
      const newId = `${node.type}-${Math.random().toString(36).substr(2, 9)}`;
      if (node.type === 'note') {
        const savedContent = localStorage.getItem(`note-content-${node.id}`);
        if (savedContent) localStorage.setItem(`note-content-${newId}`, savedContent);
      }
      return {
        ...node,
        id: newId,
        children: node.children ? node.children.map(cloneRecursive) : undefined,
      };
    };

    const clonedNodes = nodesToCopy.map(cloneRecursive);

    const addRecursive = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
      if (n.id === destParentId) {
        return { ...n, children: [...(n.children || []), ...clonedNodes] };
      }
      return { ...n, children: n.children ? addRecursive(n.children) : undefined };
    });

    return { data: addRecursive(state.data), expandedIds: new Set(state.expandedIds).add(destParentId) };
  }),

  moveFocusDown: () => {
    const { data, expandedIds, focusedId } = get();
    const visible = getVisibleNodes(data, expandedIds);
    if (visible.length === 0) return;
    
    if (!focusedId) {
      set({ focusedId: visible[0].id });
      return;
    }
    const idx = visible.findIndex(n => n.id === focusedId);
    if (idx !== -1 && idx < visible.length - 1) {
      set({ focusedId: visible[idx + 1].id });
    }
  },

  moveFocusUp: () => {
    const { data, expandedIds, focusedId } = get();
    const visible = getVisibleNodes(data, expandedIds);
    if (!focusedId) return;

    const idx = visible.findIndex(n => n.id === focusedId);
    if (idx > 0) {
      set({ focusedId: visible[idx - 1].id });
    }
  },

  moveFocusRight: () => {
    const { data, expandedIds, focusedId, toggleExpand } = get();
    if (!focusedId) return;
    
    const node = findNode(data, focusedId);
    if (node && node.children && node.children.length > 0) {
      if (!expandedIds.has(focusedId)) {
        toggleExpand(focusedId);
      } else {
        // move to first child
        set({ focusedId: node.children[0].id });
      }
    }
  },

  moveFocusLeft: () => {
    const { data, expandedIds, focusedId, toggleExpand } = get();
    if (!focusedId) return;

    const node = findNode(data, focusedId);
    if (node && node.children && node.children.length > 0 && expandedIds.has(focusedId)) {
      toggleExpand(focusedId);
    } else {
      // move to parent
      const parent = getParentNode(data, focusedId);
      if (parent) {
        set({ focusedId: parent.id });
      }
    }
  }
}),
    {
      name: 'tree-store',
      partialize: (state) => ({
        data: state.data,
        expandedIds: Array.from(state.expandedIds),
        hiddenIds: Array.from(state.hiddenIds),
        pinnedIds: Array.from(state.pinnedIds),
        lockedIds: Array.from(state.lockedIds),
        recentIds: state.recentIds,
      }),
      merge: (persistedState: any, currentState) => {
        if (!persistedState) return currentState;
        return {
          ...currentState,
          ...persistedState,
          expandedIds: new Set(persistedState.expandedIds || []),
          hiddenIds: new Set(persistedState.hiddenIds || []),
          pinnedIds: new Set(persistedState.pinnedIds || []),
          lockedIds: new Set(persistedState.lockedIds || []),
        };
      },
    }
  )
);
