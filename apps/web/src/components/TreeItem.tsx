import React, { useState, useEffect, useRef } from 'react';
import { TreeNode, useTreeStore } from '../store/useTreeStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { Plus, MoreHorizontal, Pin, PinOff, Mic, Delete, Lock, Unlock } from 'lucide-react';
import { SpeechRecognitionModal } from './modals/SpeechRecognitionModal';

interface TreeItemProps {
  node: TreeNode;
  level?: number;
  isHighlighted?: boolean;
}

export const TreeItem: React.FC<TreeItemProps> = ({ node, level = 0, isHighlighted = false }) => {
  const { expandedIds, focusedId, selectedIds, toggleExpand, setFocus, setSelected, selectRange, openContextMenu, hiddenIds, editingNodeId, renameNode, setEditingNodeId, moveNodesTo, moveNodesBefore, moveNodesAfter, addNode, pinnedIds, togglePin, addRecentView, highlightedBranchId, lockedIds, toggleLock, offlineAsrDevice, setOfflineAsrDevice } = useTreeStore();
  const { setActiveNoteId } = useWorkspaceStore();
  
  const isHighlightRoot = highlightedBranchId === node.id;
  const shouldHighlight = isHighlightRoot || isHighlighted;
  
  const [inputValue, setInputValue] = useState(node.title);
  const [dragOverPos, setDragOverPos] = useState<'top' | 'middle' | 'bottom' | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number, left: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isExpanded = expandedIds.has(node.id);
  const isFocused = focusedId === node.id;
  const isSelected = selectedIds.has(node.id);
  const isHidden = hiddenIds.has(node.id);
  const isEditing = editingNodeId === node.id;
  const isPinned = pinnedIds.has(node.id);
  const isLocked = lockedIds.has(node.id);

  const hasChildren = node.children && node.children.length > 0;
  const [isSpeechModalOpen, setIsSpeechModalOpen] = useState(false);

  const deleteLastWord = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue((prev) => {
      const words = prev.trim().split(' ');
      words.pop();
      return words.join(' ') + (words.length > 0 ? ' ' : '');
    });
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditing) return; // Prevent collapse/expand when clicking input
    setFocus(node.id);

    const multi = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const wasAlreadySelected = selectedIds.has(node.id);
    
    if (shift) {
      selectRange(node.id);
    } else {
      setSelected(node.id, multi);
    }

    if (node.type === 'note' && !multi && !shift) {
      setActiveNoteId(node.id);
      addRecentView(node.id);
    }

    if (hasChildren && !multi) {
      toggleExpand(node.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEditing) return;
    setFocus(node.id);
    openContextMenu(node.id, e.clientX, e.clientY);
  };

  const handleRenameSubmit = () => {
    if (inputValue.trim()) {
      renameNode(node.id, inputValue.trim());
    } else {
      setInputValue(node.title); // revert
    }
    setEditingNodeId(null);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (isLocked) {
      e.preventDefault();
      alert("Mục này đang bị khóa. Hãy mở khóa để di chuyển!");
      document.getElementById(`lock-icon-${node.id}`)?.focus();
      return;
    }
    e.stopPropagation();
    let dragIds = [node.id];
    if (selectedIds.has(node.id)) {
      dragIds = Array.from(selectedIds);
    }
    e.dataTransfer.setData('application/json', JSON.stringify(dragIds));
    e.dataTransfer.setData('text/plain', node.id); // Fallback
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    if (y < height * 0.25) {
      setDragOverPos('top');
    } else if (y > height * 0.75) {
      setDragOverPos('bottom');
    } else {
      setDragOverPos('middle');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPos(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    let sourceIds: string[] = [];
    try {
      const jsonData = e.dataTransfer.getData('application/json');
      if (jsonData) {
        sourceIds = JSON.parse(jsonData);
      } else {
        const textData = e.dataTransfer.getData('text/plain');
        if (textData) sourceIds = [textData];
      }
    } catch {
      const textData = e.dataTransfer.getData('text/plain');
      if (textData) sourceIds = [textData];
    }
    
    const pos = dragOverPos;
    setDragOverPos(null);
    
    const validSourceIds = sourceIds.filter(id => id !== node.id);
    
    if (validSourceIds.length > 0) {
      if (pos === 'top') {
        moveNodesBefore(validSourceIds, node.id);
      } else if (pos === 'bottom') {
        moveNodesAfter(validSourceIds, node.id);
      } else if (pos === 'middle') {
        moveNodesTo(validSourceIds, node.id);
      }
    }
  };

  // Determine styles for drag indicator
  let borderTop = 'none';
  let borderBottom = 'none';
  let backgroundColor = isSelected ? 'var(--hover-bg, #f0f0f0)' : 'transparent';
  
  if (!isSelected && dragOverPos !== 'middle' && shouldHighlight) {
     backgroundColor = 'rgba(0, 102, 204, 0.04)';
  }

  if (dragOverPos === 'top') borderTop = '2px solid #0066cc';
  if (dragOverPos === 'bottom') borderBottom = '2px solid #0066cc';
  if (dragOverPos === 'middle') backgroundColor = '#e0f2fe';

  return (
    <div style={{ marginLeft: `${level * 16}px` }}>
      <div 
        className={`tree-node ${node.type}`} 
        data-node-id={node.id}
        onKeyDown={(e) => {
           if (e.key === 'F3' && !isLocked && !isEditing) {
              e.preventDefault();
              setIsSpeechModalOpen(true);
              // Defer global state update to avoid blocking modal render
              setTimeout(() => setEditingNodeId(node.id), 0);
           }
        }}
        onClick={handleClick}
        onDoubleClick={() => { 
          if (isLocked) {
            alert("Mục này đang bị khóa. Hãy mở khóa để thao tác!");
            document.getElementById(`lock-icon-${node.id}`)?.focus();
            return;
          }
          if (node.type === 'note') {
            setActiveNoteId(node.id);
          } else {
            setEditingNodeId(node.id); 
          }
          addRecentView(node.id); 
        }}
        onContextMenu={handleContextMenu}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        tabIndex={-1} 
        style={{
          padding: '8px 6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderRadius: '6px',
          userSelect: 'none',
          color: 'var(--text-color)',
          opacity: isHidden ? 0.4 : 1,
          backgroundColor,
          borderTop,
          borderBottom,
          outline: isFocused && !isEditing ? '2px solid #0066cc' : 'none',
          outlineOffset: '-2px',
          transition: 'background-color 0.1s',
        }}
        onMouseEnter={(e) => {
          setIsHovered(true);
          const rect = e.currentTarget.getBoundingClientRect();
          setTooltipPos({ top: rect.top, left: rect.right + 10 });
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = shouldHighlight ? 'rgba(0, 102, 204, 0.08)' : 'var(--hover-bg, #fafafa)';
          }
          
          // No longer using preview tabs on hover in simplified workspace
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = shouldHighlight ? 'rgba(0, 102, 204, 0.04)' : 'transparent';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: hasChildren ? '36px' : '16px' }}>
          <span style={{ display: 'inline-flex', justifyContent: 'center', opacity: 0.8 }}>
            {node.customIcon || (node.type === 'notebook' ? '📁' : '📄')}
          </span>
          {hasChildren && (
            <span style={{ display: 'inline-flex', justifyContent: 'center', opacity: 0.6, fontSize: '10px' }}>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
        </div>
        {isEditing ? (
          <div 
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                handleRenameSubmit();
              }
            }}
          >
            <input 
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'F3') {
                  e.preventDefault();
                  let currentInput = inputValue;
                  if (inputRef.current) {
                      const start = inputRef.current.selectionStart || 0;
                      const end = inputRef.current.selectionEnd || 0;
                      if (end > start) {
                          currentInput = currentInput.substring(0, start) + (start > 0 ? ' ' : '') + currentInput.substring(end);
                          setInputValue(currentInput.trim());
                      }
                  }
                  setIsSpeechModalOpen(true);
                }
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') { setInputValue(node.title); setEditingNodeId(null); }
              }}
              onClick={(e) => e.stopPropagation()}
              style={{ flex: 1, padding: '2px 4px', border: '1px solid #0066cc', borderRadius: '4px', outline: 'none', minWidth: '30px', width: '30px' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button 
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  let currentInput = inputValue;
                  if (inputRef.current) {
                      const start = inputRef.current.selectionStart || 0;
                      const end = inputRef.current.selectionEnd || 0;
                      if (end > start) {
                          currentInput = currentInput.substring(0, start) + (start > 0 ? ' ' : '') + currentInput.substring(end);
                          setInputValue(currentInput.trim());
                      }
                  }
                  setIsSpeechModalOpen(true);
                }}
                title="Mở hộp thoại Nhận diện Giọng nói"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '2px', display: 'flex', alignItems: 'center' }}
              >
                <Mic size={14} />
              </button>
            </div>
            <button 
              onMouseDown={(e) => e.preventDefault()}
              onClick={deleteLastWord}
              title="Xóa từ cuối"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '2px', display: 'flex', alignItems: 'center' }}
            >
              <Delete size={14} />
            </button>
          </div>
        ) : (
          <>
            <span style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: node.type === 'notebook' ? 500 : 400, flex: 1 }}>
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
            {(isHovered || isSelected || isPinned || isLocked) && !isEditing && (
              <div style={{ display: 'flex', gap: '4px', opacity: 0.7 }}>
                {(isHovered || isSelected || isLocked) && (
                  <button 
                    id={`lock-icon-${node.id}`}
                    onClick={(e) => { e.stopPropagation(); toggleLock(node.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px', color: isLocked ? '#ef4444' : 'inherit' }}
                    title={isLocked ? "Mở khóa" : "Khóa"}
                  >
                    {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                )}
                {(isHovered || isSelected || isPinned) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); togglePin(node.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px', color: isPinned ? '#0066cc' : 'inherit' }}
                    title={isPinned ? "Bỏ ghim" : "Ghim"}
                  >
                    {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                  </button>
                )}
                {(isHovered || isSelected) && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); addNode(node.id, 'note', 'Ghi chú mới'); if (!expandedIds.has(node.id)) toggleExpand(node.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px', color: 'inherit' }}
                      title="Thêm Ghi chú"
                    >
                      <Plus size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFocus(node.id); openContextMenu(node.id, e.clientX, e.clientY); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px', color: 'inherit' }}
                      title="Tùy chọn"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className="tree-children">
          {node.children!.map((child) => (
            <TreeItem key={child.id} node={child} level={level + 1} isHighlighted={shouldHighlight} />
          ))}
        </div>
      )}
      
      {isSpeechModalOpen && (
        <SpeechRecognitionModal 
           initialText={inputValue}
           onClose={() => setIsSpeechModalOpen(false)}
           onApply={(text) => {
              const final = text.trim();
              setInputValue(final);
              renameNode(node.id, final || node.title);
              setEditingNodeId(null);
              setIsSpeechModalOpen(false);
           }}
        />
      )}
    </div>
  );
};
