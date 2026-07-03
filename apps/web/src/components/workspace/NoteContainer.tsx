import React, { useRef, useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { TiptapEditor } from '@notegravity/ui';

interface NoteContainerProps {
  docId: string;
  containerId: string;
}

export const NoteContainer: React.FC<NoteContainerProps> = ({ docId, containerId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const pageData = useCanvasStore(state => state.getPageData(docId));
  const containerData = pageData.containers.find(c => c.id === containerId);
  const updateContainer = useCanvasStore(state => state.updateContainer);
  const removeContainer = useCanvasStore(state => state.removeContainer);

  const startDragPos = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const startResizePos = useRef({ x: 0, initialWidth: 0 });

  if (!containerData) return null;

  // Handle Dragging
  const handleDragStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    startDragPos.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: containerData.x,
      initialY: containerData.y
    };
    updateContainer(docId, containerId, { isFocused: true });
  };

  // Handle Resizing
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    startResizePos.current = {
      x: e.clientX,
      initialWidth: containerData.width
    };
    updateContainer(docId, containerId, { isFocused: true });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Need to factor in zoom for drag delta
      const zoom = useCanvasStore.getState().getPageData(docId).zoom;

      if (isDragging) {
        const dx = (e.clientX - startDragPos.current.x) / zoom;
        const dy = (e.clientY - startDragPos.current.y) / zoom;
        updateContainer(docId, containerId, {
          x: Math.max(0, startDragPos.current.initialX + dx),
          y: Math.max(0, startDragPos.current.initialY + dy)
        });
      }

      if (isResizing) {
        const dx = (e.clientX - startResizePos.current.x) / zoom;
        updateContainer(docId, containerId, {
          width: Math.max(200, startResizePos.current.initialWidth + dx)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, docId, containerId, updateContainer]);

  const isFocused = containerData.isFocused;

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'absolute',
        left: containerData.x,
        top: containerData.y,
        width: containerData.width,
        backgroundColor: 'transparent', // Looks like native canvas text
        border: isFocused ? '1px solid #d1d5db' : '1px solid transparent',
        borderRadius: '4px',
        boxShadow: (isDragging || isFocused) ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
        zIndex: isFocused ? 10 : 1,
        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s',
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!isFocused) updateContainer(docId, containerId, { isFocused: true });
      }}
    >
      {/* Drag Handle Top Bar */}
      <div 
        style={{
          height: '16px',
          backgroundColor: isFocused ? '#f3f4f6' : 'transparent',
          cursor: isDragging ? 'grabbing' : 'grab',
          borderTopLeftRadius: '4px',
          borderTopRightRadius: '4px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: isFocused ? 1 : 0,
        }}
        onMouseDown={handleDragStart}
      >
        <div style={{ width: '20px', height: '4px', backgroundColor: '#d1d5db', borderRadius: '2px' }} />
      </div>

      {/* Tiptap Editor Content */}
      <div style={{ padding: '4px 8px', minHeight: '50px' }}>
        <TiptapEditor docId={`${docId}-${containerId}`} />
      </div>

      {/* Resize Handle Right */}
      <div 
        style={{
          position: 'absolute',
          top: '16px',
          bottom: '0',
          right: '-4px',
          width: '8px',
          cursor: 'ew-resize',
          display: isFocused ? 'block' : 'none',
        }}
        onMouseDown={handleResizeStart}
      />
    </div>
  );
};
