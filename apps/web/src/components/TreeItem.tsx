import React, { useState, useEffect, useRef } from 'react';
import { TreeNode, useTreeStore } from '../store/useTreeStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { Plus, MoreHorizontal, Pin, PinOff, Mic, MicOff, Delete } from 'lucide-react';

interface TreeItemProps {
  node: TreeNode;
  level?: number;
}

export const TreeItem: React.FC<TreeItemProps> = ({ node, level = 0 }) => {
  const { expandedIds, focusedId, selectedId, toggleExpand, setFocus, setSelected, openContextMenu, hiddenIds, editingNodeId, renameNode, setEditingNodeId, moveNodeTo, moveNodeBefore, moveNodeAfter, addNode, pinnedIds, togglePin, addRecentView } = useTreeStore();
  const { addTabToPane, activePaneId, panes } = useWorkspaceStore();
  
  const [inputValue, setInputValue] = useState(node.title);
  const [dragOverPos, setDragOverPos] = useState<'top' | 'middle' | 'bottom' | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isExpanded = expandedIds.has(node.id);
  const isFocused = focusedId === node.id;
  const isSelected = selectedId === node.id;
  const isHidden = hiddenIds.has(node.id);
  const isEditing = editingNodeId === node.id;
  const isPinned = pinnedIds.has(node.id);

  const hasChildren = node.children && node.children.length > 0;

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'vi-VN';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInputValue((prev) => (prev ? prev + ' ' : '') + finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (!isEditing && isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  }, [isEditing, isListening]);

  const toggleListening = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

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
    if (hasChildren) {
      toggleExpand(node.id);
    } else {
      setSelected(node.id);
      if (node.type === 'note') {
        const targetPaneId = activePaneId || panes[0].id;
        addTabToPane(targetPaneId, { id: node.id, title: node.title });
        addRecentView(node.id);
      }
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
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', node.id);
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
      if (node.type === 'notebook') {
        setDragOverPos('middle');
      } else {
        setDragOverPos(y < height / 2 ? 'top' : 'bottom');
      }
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
    const sourceId = e.dataTransfer.getData('text/plain');
    const pos = dragOverPos;
    setDragOverPos(null);
    
    if (sourceId && sourceId !== node.id) {
      if (pos === 'top') {
        moveNodeBefore(sourceId, node.id);
      } else if (pos === 'bottom') {
        moveNodeAfter(sourceId, node.id);
      } else if (pos === 'middle' && node.type === 'notebook') {
        moveNodeTo(sourceId, node.id);
      }
    }
  };

  // Determine styles for drag indicator
  let borderTop = 'none';
  let borderBottom = 'none';
  let backgroundColor = isSelected ? 'var(--hover-bg, #f0f0f0)' : 'transparent';
  
  if (dragOverPos === 'top') borderTop = '2px solid #0066cc';
  if (dragOverPos === 'bottom') borderBottom = '2px solid #0066cc';
  if (dragOverPos === 'middle') backgroundColor = '#e0f2fe';

  return (
    <div style={{ marginLeft: `${level * 16}px` }}>
      <div 
        className={`tree-node ${node.type}`} 
        onClick={handleClick}
        onDoubleClick={() => { setEditingNodeId(node.id); addRecentView(node.id); }}
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
          if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--hover-bg, #fafafa)';
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
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
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input 
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') { setInputValue(node.title); setEditingNodeId(null); }
              }}
              onClick={(e) => e.stopPropagation()}
              style={{ flex: 1, padding: '2px 4px', border: '1px solid #0066cc', borderRadius: '4px', outline: 'none', width: '50px' }}
            />
            <button 
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleListening}
              title={isListening ? "Dừng nhập liệu giọng nói" : "Nhập liệu giọng nói tiếng Việt"}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: isListening ? '#ef4444' : '#666', padding: '2px', display: 'flex', alignItems: 'center' }}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
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
            {(isHovered || isPinned) && !isEditing && (
              <div style={{ display: 'flex', gap: '4px', opacity: 0.7 }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); togglePin(node.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px', color: isPinned ? '#0066cc' : 'inherit' }}
                  title={isPinned ? "Bỏ ghim" : "Ghim"}
                >
                  {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                </button>
                {isHovered && (
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
            <TreeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
