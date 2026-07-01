import React, { useEffect, useRef, useState } from 'react';
import { TreeItem } from './TreeItem';
import { useTreeStore } from '../store/useTreeStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { SidebarContextMenu } from './sidebar/SidebarContextMenu';
import { EmailModal } from './modals/EmailModal';
import { DestinationPickerModal } from './modals/DestinationPickerModal';
import { IconPickerModal } from './modals/IconPickerModal';
import { AIMindmapModal } from './modals/AIMindmapModal';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';

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

const ShortcutItem = ({ node }: { node: any }) => {
  const { selectedId, setSelected, setFocus, addRecentView } = useTreeStore();
  const { addTabToPane, setPreviewTab, activePaneId, panes } = useWorkspaceStore();
  
  if (!node) return null;
  
  return (
    <div 
      onClick={() => {
        setFocus(node.id);
        const wasAlreadySelected = selectedId === node.id;
        setSelected(node.id);
        if (node.type === 'note') {
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
        borderRadius: '6px', color: 'var(--text-color)', fontSize: '13px', margin: '2px 0'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--hover-bg, #f0f0f0)';
        if (node.type === 'note') {
          const targetPaneId = activePaneId || panes[0].id;
          setPreviewTab(targetPaneId, { id: node.id, title: node.title });
        }
      }}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <span style={{ width: '16px', display: 'inline-flex', justifyContent: 'center', opacity: 0.6 }}>
        {node.customIcon || (node.type === 'notebook' ? '📁' : '📄')}
      </span>
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, fontWeight: node.type === 'notebook' ? 500 : 400 }}>
        {node.title}
      </span>
    </div>
  );
};

export const Sidebar = () => {
  const { data, moveFocusDown, moveFocusUp, moveFocusLeft, moveFocusRight, focusedId, setSelected, closeContextMenu, emailModalNodeId, destinationModalData, iconPickerNodeId, mindmapModalNodeId, addRootNode, pinnedIds, recentIds } = useTreeStore();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [isPinnedExpanded, setIsPinnedExpanded] = useState(true);
  const [isRecentExpanded, setIsRecentExpanded] = useState(true);

  const pinnedNodes = Array.from(pinnedIds).map(id => findNodeById(data, id)).filter(Boolean).slice(0, 5);
  const recentNodes = recentIds.map(id => findNodeById(data, id)).filter(Boolean).slice(0, 9);

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
            setSelected(focusedId);
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
            {isPinnedExpanded && pinnedNodes.map(n => <ShortcutItem key={n.id} node={n} />)}
          </div>
        )}

        {recentNodes.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div 
              onClick={() => setIsRecentExpanded(!isRecentExpanded)}
              style={{ fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '4px', paddingLeft: '4px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {isRecentExpanded ? <ChevronDown size={14} style={{ marginRight: '4px' }} /> : <ChevronRight size={14} style={{ marginRight: '4px' }} />}
              Gần đây
            </div>
            {isRecentExpanded && recentNodes.map(n => <ShortcutItem key={n.id} node={n} />)}
          </div>
        )}

        <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '4px', paddingLeft: '8px', textTransform: 'uppercase', marginTop: (pinnedNodes.length || recentNodes.length) ? '8px' : '0' }}>Thư mục</div>
        {data.map(node => (
          <TreeItem key={node.id} node={node} />
        ))}
      </div>

      <SidebarContextMenu />
      {emailModalNodeId && <EmailModal />}
      {destinationModalData && <DestinationPickerModal />}
      {iconPickerNodeId && <IconPickerModal />}
      {mindmapModalNodeId && <AIMindmapModal />}
    </div>
  );
};
