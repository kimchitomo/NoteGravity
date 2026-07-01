import React, { useEffect, useRef } from 'react';
import { useTreeStore } from '../../store/useTreeStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { Edit2, Eye, Trash2, Copy, Scissors, Clipboard, MoveRight, CopyPlus, Image as ImageIcon, ArrowUp, ArrowDown, Mail, Plus, EyeOff, Eye as EyeIcon, BrainCircuit } from 'lucide-react';

export const SidebarContextMenu = () => {
  const { 
    contextMenuNodeId, contextMenuPos, closeContextMenu, 
    openEmailModal, addNode, deleteNode, hideNode, unhideNode, hiddenIds,
    setSelected, setEditingNodeId, copyToClipboard, pasteFromClipboard, clipboard,
    moveNodeUp, moveNodeDown, openDestinationModal, openIconPicker, data, openMindmapModal
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
  const menuHeight = 450; // estimated height
  
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

  const handleAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    
    if (action === 'email') openEmailModal(contextMenuNodeId);
    if (action === 'delete') deleteNode(contextMenuNodeId);
    if (action === 'hide') hideNode(contextMenuNodeId);
    if (action === 'unhide') unhideNode(contextMenuNodeId);
    if (action === 'add_note') addNode(contextMenuNodeId, 'note', 'Ghi chú mới');
    if (action === 'add_folder') addNode(contextMenuNodeId, 'notebook', 'Thư mục mới');
    
    if (action === 'view') {
      setSelected(contextMenuNodeId);
      // find node to get title
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
    if (action === 'copy') copyToClipboard(contextMenuNodeId, 'copy');
    if (action === 'cut') copyToClipboard(contextMenuNodeId, 'cut');
    if (action === 'paste') pasteFromClipboard(contextMenuNodeId);
    
    if (action === 'move_up') moveNodeUp(contextMenuNodeId);
    if (action === 'move_down') moveNodeDown(contextMenuNodeId);
    if (action === 'move_to') openDestinationModal(contextMenuNodeId, 'move');
    if (action === 'copy_to') openDestinationModal(contextMenuNodeId, 'copy');
    if (action === 'change_icon') openIconPicker(contextMenuNodeId);
    if (action === 'ai_mindmap') openMindmapModal(contextMenuNodeId);
    
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

  return (
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
      <MenuItem icon={CopyPlus} label="Sao chép tới..." action="copy_to" />
      <MenuItem icon={ImageIcon} label="Đổi Icon" action="change_icon" />
      <div style={{ height: '1px', backgroundColor: '#eaeaea', margin: '4px 0' }} />
      <MenuItem icon={ArrowUp} label="Move Up" action="move_up" />
      <MenuItem icon={ArrowDown} label="Move Down" action="move_down" />
      <div style={{ height: '1px', backgroundColor: '#eaeaea', margin: '4px 0' }} />
      <MenuItem icon={Mail} label="Gửi qua Email" action="email" />
      <div style={{ height: '1px', backgroundColor: '#eaeaea', margin: '4px 0' }} />
      <MenuItem icon={Trash2} label="Xóa" action="delete" danger />
    </div>
  );
};
