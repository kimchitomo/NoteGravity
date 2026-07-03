import React, { useRef, useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useEditorStore } from '../../store/useEditorStore';
import { TiptapEditor } from '@notegravity/ui';
import { useTreeStore, findNodeById } from '../../store/useTreeStore';

interface NoteContainerProps {
  docId: string;
  containerId: string;
}

export const NoteContainer: React.FC<NoteContainerProps> = ({ docId, containerId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const setActiveEditor = useEditorStore(state => state.setActiveEditor);
  const addActionLog = useTreeStore(state => state.addActionLog);
  const treeData = useTreeStore(state => state.data);
  const debounceRef = useRef<any>(null);

  const handleContentChange = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const node = findNodeById(treeData, docId);
      addActionLog('Edited note', node ? node.title : 'Unknown Note', docId);
    }, 2000);
  };
  
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

  const [isHovered, setIsHovered] = useState(false);
  const isFocused = containerData.isFocused;
  const isAutoWidth = containerData.isAutoWidth !== false; // Default to true if undefined

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'absolute',
        left: containerData.x,
        top: containerData.y,
        minWidth: '50px',
        maxWidth: containerData.isAutoWidth === false ? containerData.width : 'calc(100vw - 100px)',
        backgroundColor: 'transparent',
        border: (isFocused || isHovered) ? '1px solid #e5e7eb' : '1px solid transparent',
        borderRadius: '2px',
        zIndex: isFocused ? 10 : 1,
        transition: 'border 0.2s',
        display: 'inline-block',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (!isFocused) updateContainer(docId, containerId, { isFocused: true });
      }}
    >
      {/* Top Bar with Grab Handle and Lock Button */}
      <div 
        style={{
          position: 'absolute',
          top: '-20px',
          left: '0',
          right: '0',
          height: '20px',
          backgroundColor: '#f9fafb',
          borderTopLeftRadius: '2px',
          borderTopRightRadius: '2px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: (isHovered || isDragging) ? 1 : 0,
          transition: 'opacity 0.2s',
          borderBottom: '1px solid #e5e7eb',
          borderLeft: '1px solid #e5e7eb',
          borderRight: '1px solid #e5e7eb',
          borderTop: '1px solid #e5e7eb',
        }}
      >
        {/* Placeholder for left spacing */}
        <div style={{ width: '24px' }}></div>
        
        {/* Center Drag Handle */}
        <div 
          style={{
            flex: 1,
            height: '100%',
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onMouseDown={handleDragStart}
          title="Nắm để di chuyển"
        >
           <div style={{ width: '32px', height: '4px', backgroundColor: '#d1d5db', borderRadius: '2px' }} />
        </div>

        {/* Right Delete Button */}
        <button
          style={{
            width: '24px',
            height: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#ef4444',
            padding: 0
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Bạn có chắc muốn xóa khối văn bản này?')) {
              removeContainer(docId, containerId);
            }
          }}
          title="Xóa khối"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>

      <div className="canvas-tiptap-container" style={{ padding: '0', margin: 0, height: 'auto', display: 'inline-block' }}>
        <style>{`
          .canvas-tiptap-container > div,
          .canvas-tiptap-container .editor-container,
          .canvas-tiptap-container .editor-scroll-area,
          .canvas-tiptap-container .editor-document,
          .canvas-tiptap-container .ProseMirror {
            display: inline-block !important;
            position: static !important;
            height: auto !important;
            min-height: unset !important;
            max-height: none !important;
            width: auto !important;
            min-width: unset !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            flex: none !important;
            overflow: visible !important;
            border: none !important;
          }
          .canvas-tiptap-container .ProseMirror {
            padding: 2px 4px !important; /* Minimum padding for cursor */
            outline: none !important;
            min-width: 10px !important;
          }
          .canvas-tiptap-container .ProseMirror p {
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.4 !important;
            display: inline-block !important;
          }
          .canvas-tiptap-container .ProseMirror p:not(:last-child) {
            margin-bottom: 2px !important;
            display: block !important;
          }
          .canvas-tiptap-container .mini-toolbar {
            /* Protect toolbar from aggressive overrides */
            display: flex !important;
            position: absolute !important;
          }
        `}</style>
        <TiptapEditor 
          docId={`${docId}-${containerId}`} 
          isLocked={false}
          onFocus={setActiveEditor}
          onContentChange={handleContentChange}
          autoWidth={true}
        />
      </div>

      {/* Resize Handle Right */}
      <div 
        style={{
          position: 'absolute',
          top: '0',
          bottom: '0',
          right: '-4px',
          width: '8px',
          cursor: 'ew-resize',
          display: (isFocused || isHovered) ? 'block' : 'none',
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsResizing(true);
          startResizePos.current = {
            x: e.clientX,
            initialWidth: isAutoWidth ? (containerRef.current?.offsetWidth || containerData.width) : containerData.width
          };
          updateContainer(docId, containerId, { isFocused: true, isAutoWidth: false });
        }}
      />
    </div>
  );
};
