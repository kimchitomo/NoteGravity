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

interface TreeState {
  data: TreeNode[];
  expandedIds: Set<string>;
  focusedId: string | null;
  selectedId: string | null;
  contextMenuPos: { x: number; y: number } | null;
  contextMenuNodeId: string | null;
  emailModalNodeId: string | null;
  hiddenIds: Set<string>;
  pinnedIds: Set<string>;
  recentIds: string[];

  // New States
  editingNodeId: string | null;
  clipboard: { id: string; action: 'copy' | 'cut'; node: TreeNode } | null;
  destinationModalData: { id: string; action: 'move' | 'copy' } | null;
  iconPickerNodeId: string | null;
  mindmapModalNodeId: string | null;

  toggleExpand: (id: string) => void;
  setFocus: (id: string) => void;
  setSelected: (id: string) => void;
  openContextMenu: (id: string, x: number, y: number) => void;
  closeContextMenu: () => void;
  openEmailModal: (id: string) => void;
  closeEmailModal: () => void;

  setEditingNodeId: (id: string | null) => void;
  openDestinationModal: (id: string, action: 'move' | 'copy') => void;
  closeDestinationModal: () => void;
  openIconPicker: (id: string) => void;
  closeIconPicker: () => void;
  openMindmapModal: (id: string) => void;
  closeMindmapModal: () => void;

  togglePin: (id: string) => void;
  addRecentView: (id: string) => void;

  // Mutations
  addRootNode: (titleOrType: string, title?: string) => void;
  addNode: (parentId: string, type: 'notebook' | 'note', title: string) => void;
  deleteNode: (id: string) => void;
  hideNode: (id: string) => void;
  unhideNode: (id: string) => void;
  renameNode: (id: string, title: string) => void;
  updateNodeIcon: (id: string, icon: string) => void;
  copyToClipboard: (id: string, action: 'copy' | 'cut') => void;
  pasteFromClipboard: (parentId: string) => void;
  moveNodeUp: (id: string) => void;
  moveNodeDown: (id: string) => void;
  moveNodeTo: (id: string, destParentId: string) => void;
  moveNodeBefore: (sourceId: string, targetId: string) => void;
  moveNodeAfter: (sourceId: string, targetId: string) => void;
  copyNodeTo: (id: string, destParentId: string) => void;

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

export const useTreeStore = create<TreeState>()(
  persist(
    (set, get) => ({
      data: mockData,
  expandedIds: new Set<string>(),
  focusedId: null,
  selectedId: null,
  contextMenuPos: null,
  contextMenuNodeId: null,
  emailModalNodeId: null,
  hiddenIds: new Set<string>(),
  pinnedIds: new Set<string>(),
  recentIds: [],

  editingNodeId: null,
  clipboard: null,
  destinationModalData: null,
  iconPickerNodeId: null,
  mindmapModalNodeId: null,

  toggleExpand: (id) => set((state) => {
    const newExpanded = new Set(state.expandedIds);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    return { expandedIds: newExpanded };
  }),

  setFocus: (id) => set({ focusedId: id }),
  setSelected: (id) => set({ selectedId: id }),
  
  openContextMenu: (id, x, y) => set({ contextMenuNodeId: id, contextMenuPos: { x, y } }),
  closeContextMenu: () => set({ contextMenuNodeId: null, contextMenuPos: null }),
  
  openEmailModal: (id) => set({ emailModalNodeId: id }),
  closeEmailModal: () => set({ emailModalNodeId: null }),

  setEditingNodeId: (id) => set({ editingNodeId: id }),
  openDestinationModal: (id, action) => set({ destinationModalData: { id, action } }),
  closeDestinationModal: () => set({ destinationModalData: null }),
  openIconPicker: (id) => set({ iconPickerNodeId: id }),
  closeIconPicker: () => set({ iconPickerNodeId: null }),
  openMindmapModal: (id) => set({ mindmapModalNodeId: id }),
  closeMindmapModal: () => set({ mindmapModalNodeId: null }),

  togglePin: (id) => set((state) => {
    const newPinned = new Set(state.pinnedIds);
    if (newPinned.has(id)) newPinned.delete(id);
    else newPinned.add(id);
    return { pinnedIds: newPinned };
  }),

  addRecentView: (id) => set((state) => {
    const newRecents = [id, ...state.recentIds.filter(i => i !== id)].slice(0, 9);
    return { recentIds: newRecents };
  }),

  addRootNode: (titleOrType, title) => set((state) => {
    const now = Date.now();
    const actualTitle = title || titleOrType;
    const actualType = title ? titleOrType : 'notebook';
    const newNode: TreeNode = { id: `${now}`, title: actualTitle, type: actualType as any, children: actualType === 'notebook' ? [] : undefined, createdAt: now, updatedAt: now };
    return { data: [...state.data, newNode] };
  }),

  addNode: (parentId, type, title) => set((state) => {
    const now = Date.now();
    const addRecursive = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === parentId) {
          return {
            ...node,
            children: [...(node.children || []), { id: `${now}`, title, type, customIcon: node.customIcon, children: type === 'notebook' ? [] : undefined, createdAt: now, updatedAt: now }]
          };
        }
        if (node.children) {
          return { ...node, children: addRecursive(node.children) };
        }
        return node;
      });
    };
    return { data: addRecursive(state.data), expandedIds: new Set(state.expandedIds).add(parentId) };
  }),

  deleteNode: (id) => set((state) => {
    const deleteRecursive = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.filter(node => node.id !== id).map(node => ({
        ...node,
        children: node.children ? deleteRecursive(node.children) : undefined
      }));
    };
    return { data: deleteRecursive(state.data) };
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

  copyToClipboard: (id, action) => set((state) => {
    const node = findNode(state.data, id);
    if (!node) return state;
    // deep clone node logic here can be simple JSON parse/stringify
    const cloned = JSON.parse(JSON.stringify(node));
    return { clipboard: { id, action, node: cloned } };
  }),

  pasteFromClipboard: (parentId) => set((state) => {
    if (!state.clipboard) return state;
    const { id, action, node } = state.clipboard;
    let newData = state.data;
    
    if (action === 'cut') {
      const deleteRecursive = (nodes: TreeNode[]): TreeNode[] => nodes.filter(n => n.id !== id).map(n => ({ ...n, children: n.children ? deleteRecursive(n.children) : undefined }));
      newData = deleteRecursive(newData);
    }
    
    const newNode = { ...node, id: `${Date.now()}` };
    const addRecursive = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
      if (n.id === parentId && n.type === 'notebook') {
        return { ...n, children: [...(n.children || []), newNode] };
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
    const nodeToMove = findNode(state.data, id);
    if (!nodeToMove) return state;
    
    // delete from original
    const deleteRecursive = (nodes: TreeNode[]): TreeNode[] => nodes.filter(n => n.id !== id).map(n => ({ ...n, children: n.children ? deleteRecursive(n.children) : undefined }));
    let newData = deleteRecursive(state.data);
    
    // add to new
    const addRecursive = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
      if (n.id === destParentId && n.type === 'notebook') {
        return { ...n, children: [...(n.children || []), nodeToMove] };
      }
      return { ...n, children: n.children ? addRecursive(n.children) : undefined };
    });
    
    return { data: addRecursive(newData), expandedIds: new Set(state.expandedIds).add(destParentId) };
  }),

  moveNodeBefore: (sourceId, targetId) => set((state) => {
    if (sourceId === targetId) return state;
    const nodeToMove = findNode(state.data, sourceId);
    if (!nodeToMove) return state;

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

  moveNodeAfter: (sourceId, targetId) => set((state) => {
    if (sourceId === targetId) return state;
    const nodeToMove = findNode(state.data, sourceId);
    if (!nodeToMove) return state;

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

  copyNodeTo: (id, destParentId) => set((state) => {
    const nodeToCopy = findNode(state.data, id);
    if (!nodeToCopy) return state;
    
    const clonedNode = JSON.parse(JSON.stringify(nodeToCopy));
    clonedNode.id = `${Date.now()}`;
    
    const addRecursive = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
      if (n.id === destParentId && n.type === 'notebook') {
        return { ...n, children: [...(n.children || []), clonedNode] };
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
        };
      },
    }
  )
);
