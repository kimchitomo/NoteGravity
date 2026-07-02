import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useTreeStore } from '../../store/useTreeStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { Edit2, Eye, Trash2, Copy, Scissors, Clipboard, MoveRight, CopyPlus, Image as ImageIcon, ArrowUp, ArrowDown, Mail, Plus, EyeOff, Eye as EyeIcon, BrainCircuit, ListOrdered, Files, Clock } from 'lucide-react';

export const SidebarContextMenu = () => {
  const { 
    contextMenuNodeId, contextMenuPos, closeContextMenu, 
    openEmailModal, addNode, deleteNode, hideNode, unhideNode, hiddenIds,
    setSelected, setEditingNodeId, copyToClipboard, pasteFromClipboard, clipboard,
    moveNodeUp, moveNodeDown, openDestinationModal, openIconPicker, data, openMindmapModal, numberChildNotes, duplicateNode, selectedIds, openSchedulePinModal
  } = useTreeStore();
  
  const { addTabToPane, activePaneId, panes } = useWorkspaceStore();
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    if (contextMenuPos) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenuPos, closeContextMenu]);

  if (!contextMenuNodeId || !contextMenuPos) return null;

  const menuWidth = 220;
  const menuHeight = 650; // updated estimated height because of newly added items
  
  let adjustedLeft = contextMenuPos.x;
  let adjustedTop = contextMenuPos.y;
  
  // Prevent horizontal clipping
  if (adjustedLeft + menuWidth > window.innerWidth) {
    adjustedLeft = window.innerWidth - menuWidth - 10;
  }
  
  // Prevent vertical clipping
  if (adjustedTop + menuHeight > window.innerHeight) {
    adjustedTop = window.innerHeight - menuHeight - 10;
  }
  
  // Clamp to screen edges on very small screens
  adjustedTop = Math.max(10, adjustedTop);
  adjustedLeft = Math.max(10, adjustedLeft);

  const targetNode = (() => {
    const findN = (nodes: any[], id: string): any => {
      for (const n of nodes) {
        if (n.id === id) return n;
        if (n.children) {
          const found = findN(n.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    return findN(data, contextMenuNodeId);
  })();

  const handleAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    if (!contextMenuNodeId) return;

    const targetIds = selectedIds.has(contextMenuNodeId) 
      ? Array.from(selectedIds) 
      : [contextMenuNodeId];
    
    if (action === 'email') openEmailModal(targetIds);
    if (action === 'delete') targetIds.forEach(id => deleteNode(id));
    if (action === 'hide') targetIds.forEach(id => hideNode(id));
    if (action === 'unhide') targetIds.forEach(id => unhideNode(id));
    
    // Add operations only apply to single node
    if (action === 'add_note') addNode(contextMenuNodeId, 'note', 'Ghi chú mới');
    if (action === 'add_folder') addNode(contextMenuNodeId, 'notebook', 'Thư mục mới');
    
    // View operation only applies to single node
    if (action === 'view') {
      setSelected(contextMenuNodeId, false);
      const findNode = (nodes: any[], id: string): any => {
        for (const n of nodes) {
          if (n.id === id) return n;
          if (n.children) {
            const found = findNode(n.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      const n = findNode(data, contextMenuNodeId);
      if (n && n.type === 'note') {
        const targetPaneId = activePaneId || panes[0].id;
        addTabToPane(targetPaneId, { id: n.id, title: n.title });
      }
    }
    
    if (action === 'edit') setEditingNodeId(contextMenuNodeId);
    if (action === 'copy') copyToClipboard(targetIds, 'copy');
    if (action === 'cut') copyToClipboard(targetIds, 'cut');
    if (action === 'paste') pasteFromClipboard(contextMenuNodeId); // Paste destination is the single clicked node
    
    // Move up/down only on single node for predictable behavior
    if (action === 'move_up') moveNodeUp(contextMenuNodeId);
    if (action === 'move_down') moveNodeDown(contextMenuNodeId);
    
    if (action === 'move_to') openDestinationModal(targetIds, 'move');
    if (action === 'duplicate') targetIds.forEach(id => duplicateNode(id));
    if (action === 'change_icon') openIconPicker(targetIds);
    if (action === 'schedule_pin') openSchedulePinModal(targetIds);
    if (action === 'ai_mindmap') openMindmapModal(contextMenuNodeId);
    if (action === 'number_children') numberChildNotes(contextMenuNodeId);
    
    closeContextMenu();
  };

  const MenuItem = ({ icon: Icon, label, action, danger = false, disabled = false }: any) => (
    <div 
      className="context-menu-item"
      onClick={(e) => !disabled && handleAction(e, action)}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px',
        cursor: disabled ? 'not-allowed' : 'pointer', 
        color: danger ? '#ef4444' : 'var(--text-color)',
        opacity: disabled ? 0.5 : 1,
        fontSize: '13px'
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = 'var(--hover-bg, #f5f5f5)'; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <Icon size={14} />
      <span>{label}</span>
    </div>
  );

  return ReactDOM.createPortal(
    <div 
      ref={menuRef}
      style={{
        position: 'fixed',
        top: adjustedTop,
        left: adjustedLeft,
        backgroundColor: '#fff',
        border: '1px solid #eaeaea',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        padding: '4px 0',
        zIndex: 1000,
        borderRadius: '6px',
        minWidth: '200px',
        maxHeight: 'calc(100vh - 20px)',
        overflowY: 'auto'
      }}
    >
      <MenuItem icon={Plus} label="Thêm Ghi chú" action="add_note" />
      <MenuItem icon={Plus} label="Thêm Thư mục" action="add_folder" />
      <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
      <MenuItem icon={BrainCircuit} label="AI MindMap" action="ai_mindmap" />
      <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
      <MenuItem icon={Eye} label="Xem" action="view" />
      <MenuItem icon={Edit2} label="Sửa (Đổi tên)" action="edit" />
      <MenuItem icon={ListOrdered} label="Đánh số thứ tự các ghi chú" action="number_children" />
      <div style={{ height: '1px', backgroundColor: '#eaeaea', margin: '4px 0' }} />
      {hiddenIds.has(contextMenuNodeId) ? (
        <MenuItem icon={EyeIcon} label="Hiện" action="unhide" />
      ) : (
        <MenuItem icon={EyeOff} label="Ẩn" action="hide" />
      )}
      <div style={{ height: '1px', backgroundColor: '#eaeaea', margin: '4px 0' }} />
      <MenuItem icon={Copy} label="Copy" action="copy" />
      <MenuItem icon={Scissors} label="Cut" action="cut" />
      <MenuItem icon={Clipboard} label="Paste" action="paste" disabled={!clipboard} />
      <div style={{ height: '1px', backgroundColor: '#eaeaea', margin: '4px 0' }} />
      <MenuItem icon={MoveRight} label="Di chuyển tới..." action="move_to" />
      <MenuItem icon={Files} label="Nhân bản" action="duplicate" />
      <MenuItem icon={ImageIcon} label="Đổi Icon" action="change_icon" />
      <div style={{ height: '1px', backgroundColor: '#eaeaea', margin: '4px 0' }} />
      <MenuItem icon={Clock} label="Lên lịch ghim tuần tự..." action="schedule_pin" />
      <div style={{ height: '1px', backgroundColor: '#eaeaea', margin: '4px 0' }} />
      <MenuItem icon={ArrowUp} label="Move Up" action="move_up" />
      <MenuItem icon={ArrowDown} label="Move Down" action="move_down" />
      <div style={{ height: '1px', backgroundColor: '#eaeaea', margin: '4px 0' }} />
      <MenuItem icon={Mail} label="Gửi qua Email" action="email" />
      <div style={{ height: '1px', backgroundColor: '#eaeaea', margin: '4px 0' }} />
      <MenuItem icon={Trash2} label="Xóa" action="delete" danger />
    </div>,
    document.body
  );
};
