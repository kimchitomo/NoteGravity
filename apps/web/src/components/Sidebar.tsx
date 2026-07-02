import React, { useEffect, useRef, useState } from 'react';
import { TreeItem } from './TreeItem';
import { useTreeStore } from '../store/useTreeStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { SidebarContextMenu } from './sidebar/SidebarContextMenu';
import { EmailModal } from './modals/EmailModal';
import { DestinationPickerModal } from './modals/DestinationPickerModal';
import { IconPickerModal } from './modals/IconPickerModal';
import { AIMindmapModal } from './modals/AIMindmapModal';
import { Plus, ChevronDown, ChevronRight, PinOff, Locate } from 'lucide-react';

const findNodeById = (nodes: any[], id: string): any => {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
  }
  return null;
};

const findParentNode = (nodes: any[], targetId: string, parent: any = null): any => {
  for (const node of nodes) {
    if (node.id === targetId) return parent;
    if (node.children) {
      const found = findParentNode(node.children, targetId, node);
      if (found) return found;
    }
  }
  return null;
};

const ShortcutItem: React.FC<{ node: any, isPinned?: boolean }> = ({ node, isPinned }) => {
  const { togglePin, selectedIds, setSelected, data, expandedIds, toggleExpand, addRecentView, setFocus } = useTreeStore();
  const { addTabToPane, setPreviewTab, activePaneId, panes } = useWorkspaceStore();
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number, left: number } | null>(null);
  
  if (!node) return null;
  
  const handleLocate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const state = useTreeStore.getState();
    const parentsToExpand = [];
    let curr = node.id;
    while(true) {
      const parent = findParentNode(state.data, curr);
      if (parent) {
        parentsToExpand.push(parent.id);
        curr = parent.id;
      } else {
        break;
      }
    }
    const newExpanded = new Set(state.expandedIds);
    parentsToExpand.forEach(id => newExpanded.add(id));
    useTreeStore.setState({ expandedIds: newExpanded });
    
    setFocus(node.id);
    setSelected(node.id, false);
    
    setTimeout(() => {
      const el = document.querySelector(`[data-node-id="${node.id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };
  
  return (
    <div 
      onClick={(e) => {
        setFocus(node.id);
        const multi = e.ctrlKey || e.metaKey;
        const wasAlreadySelected = selectedIds.has(node.id);
        setSelected(node.id, multi);
        if (node.type === 'note' && !multi) {
          const targetPaneId = activePaneId || panes[0].id;
          if (wasAlreadySelected) {
            addTabToPane(targetPaneId, { id: node.id, title: node.title });
          } else {
            setPreviewTab(targetPaneId, { id: node.id, title: node.title });
          }
          addRecentView(node.id);
        }
      }}
      onDoubleClick={() => {
        if (node.type === 'note') {
          const targetPaneId = activePaneId || panes[0].id;
          addTabToPane(targetPaneId, { id: node.id, title: node.title });
          addRecentView(node.id);
        }
      }}
      style={{
        padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
        borderRadius: '6px', color: 'var(--text-color)', fontSize: '13px', margin: '2px 0',
        backgroundColor: selectedIds.has(node.id) ? 'var(--hover-bg, #f0f0f0)' : 'transparent'
      }}
      onMouseEnter={(e) => {
        setIsHovered(true);
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({ top: rect.top, left: rect.right + 10 });
        if (!selectedIds.has(node.id)) e.currentTarget.style.backgroundColor = 'var(--hover-bg, #fafafa)';
        if (node.type === 'note') {
          const targetPaneId = activePaneId || panes[0].id;
          setPreviewTab(targetPaneId, { id: node.id, title: node.title });
        }
      }}
      onMouseLeave={(e) => {
        if (!selectedIds.has(node.id)) e.currentTarget.style.backgroundColor = 'transparent';
        setIsHovered(false);
      }}
    >
      <span style={{ width: '16px', display: 'inline-flex', justifyContent: 'center', opacity: 0.6 }}>
        {node.customIcon || (node.type === 'notebook' ? '📁' : '📄')}
      </span>
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, fontWeight: node.type === 'notebook' ? 500 : 400 }}>
        {node.title}
      </span>
      {isHovered && tooltipPos && (
        <div style={{
          position: 'fixed',
          top: tooltipPos.top,
          left: tooltipPos.left,
          backgroundColor: 'rgba(0,0,0,0.85)',
          color: 'white',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '13px',
          whiteSpace: 'nowrap',
          zIndex: 99999,
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          {node.title}
        </div>
      )}
      {isPinned && isHovered && (
        <div style={{ display: 'flex', gap: '4px', opacity: 0.7 }} onClick={(e) => e.stopPropagation()}>
          <button onClick={handleLocate} title="Đi tới vị trí" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', color: 'inherit' }}>
            <Locate size={14} />
          </button>
          <button onClick={() => togglePin(node.id)} title="Bỏ ghim" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', color: 'inherit' }}>
            <PinOff size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export const Sidebar = () => {
  const { data, moveFocusDown, moveFocusUp, moveFocusLeft, moveFocusRight, focusedId, setSelected, closeContextMenu, emailModalNodeIds, destinationModalData, iconPickerNodeIds, mindmapModalNodeId, addRootNode, pinnedIds, recentIds } = useTreeStore();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [isPinnedExpanded, setIsPinnedExpanded] = useState(true);
  const [isRecentExpanded, setIsRecentExpanded] = useState(true);

  const pinnedNodes = Array.from(pinnedIds).map(id => findNodeById(data, id)).filter(Boolean).slice(0, 5);
  const recentNodes = recentIds.map(id => findNodeById(data, id)).filter(Boolean).slice(0, 70);

  const recentCollapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetRecentTimer = () => {
    if (recentCollapseTimeoutRef.current) {
      clearTimeout(recentCollapseTimeoutRef.current);
    }
    recentCollapseTimeoutRef.current = setTimeout(() => {
      setIsRecentExpanded(false);
    }, 3000);
  };

  useEffect(() => {
    if (isRecentExpanded) {
      resetRecentTimer();
    }
    return () => {
      if (recentCollapseTimeoutRef.current) {
        clearTimeout(recentCollapseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow default behavior if user is typing in an input (e.g. renaming)
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      // Only handle if focus is inside sidebar
      if (!sidebarRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          moveFocusDown();
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveFocusUp();
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveFocusRight();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveFocusLeft();
          break;
        case 'F2':
          e.preventDefault();
          if (focusedId) {
            useTreeStore.getState().setEditingNodeId(focusedId);
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedId) {
            setSelected(focusedId, false);
            const node = findNodeById(data, focusedId);
            if (node && node.type === 'note') {
              const workspaceState = useWorkspaceStore.getState();
              const targetPaneId = workspaceState.activePaneId || workspaceState.panes[0].id;
              workspaceState.addTabToPane(targetPaneId, { id: node.id, title: node.title });
              useTreeStore.getState().addRecentView(node.id);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveFocusDown, moveFocusUp, moveFocusLeft, moveFocusRight, focusedId, setSelected]);

  useEffect(() => {
    if (focusedId) {
      const node = findNodeById(data, focusedId);
      if (node && node.type === 'note') {
        const workspaceState = useWorkspaceStore.getState();
        const targetPaneId = workspaceState.activePaneId || workspaceState.panes[0].id;
        workspaceState.setPreviewTab(targetPaneId, { id: node.id, title: node.title });
      }
    }
  }, [focusedId, data]);

  return (
    <div 
      ref={sidebarRef}
      tabIndex={-1}
      style={{ width: '260px', backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid #eaeaea', display: 'flex', flexDirection: 'column', outline: 'none' }}
      onClick={closeContextMenu} // Close menu when clicking outside
    >
      <div style={{ padding: '16px', fontWeight: 600, borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>NoteGravity Workspace</span>
        <button 
          onClick={() => addRootNode('notebook', 'Sổ tay mới')}
          title="Thêm Sổ tay"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-color)', opacity: 0.7 }}
        >
          <Plus size={16} />
        </button>
      </div>
      
      <div style={{ padding: '10px', overflowY: 'auto', flex: 1 }}>
        {pinnedNodes.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div 
              onClick={() => setIsPinnedExpanded(!isPinnedExpanded)}
              style={{ fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '4px', paddingLeft: '4px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {isPinnedExpanded ? <ChevronDown size={14} style={{ marginRight: '4px' }} /> : <ChevronRight size={14} style={{ marginRight: '4px' }} />}
              Đã ghim
            </div>
            {isPinnedExpanded && pinnedNodes.map(n => <ShortcutItem key={n.id} node={n} isPinned={true} />)}
          </div>
        )}

        {recentNodes.length > 0 && (
          <div 
            style={{ marginBottom: '16px' }}
            onMouseEnter={() => {
              if (recentCollapseTimeoutRef.current) clearTimeout(recentCollapseTimeoutRef.current);
            }}
            onMouseLeave={() => {
              if (isRecentExpanded) resetRecentTimer();
            }}
          >
            <div 
              onClick={() => {
                const nextState = !isRecentExpanded;
                setIsRecentExpanded(nextState);
                if (nextState) resetRecentTimer();
              }}
              style={{ fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '4px', paddingLeft: '4px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {isRecentExpanded ? <ChevronDown size={14} style={{ marginRight: '4px' }} /> : <ChevronRight size={14} style={{ marginRight: '4px' }} />}
              Gần đây
            </div>
            {isRecentExpanded && (
              <div 
                style={{ maxHeight: '170px', overflowY: 'auto', overflowX: 'hidden', paddingRight: '4px' }}
                onScroll={resetRecentTimer}
              >
                {recentNodes.map(n => <ShortcutItem key={n.id} node={n} />)}
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '4px', paddingLeft: '8px', textTransform: 'uppercase', marginTop: (pinnedNodes.length || recentNodes.length) ? '8px' : '0' }}>Thư mục</div>
        {data.map(node => (
          <TreeItem key={node.id} node={node} />
        ))}
      </div>

      <SidebarContextMenu />
      {emailModalNodeIds && <EmailModal />}
      {destinationModalData && <DestinationPickerModal />}
      {iconPickerNodeIds && <IconPickerModal />}
      {mindmapModalNodeId && <AIMindmapModal />}
    </div>
  );
};
