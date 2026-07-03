import React, { useRef, useState, useEffect } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useTreeStore } from '../../store/useTreeStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { NoteContainer } from './NoteContainer';
import { PageTitleBlock } from './PageTitleBlock';
import { CanvasDrawLayer } from './CanvasDrawLayer';

export const EditorView = () => {
  const { activeNoteId } = useWorkspaceStore();
  const { data } = useTreeStore();
  const canvasStore = useCanvasStore();
  
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, initialPanX: 0, initialPanY: 0 });

  // Find note details
  const findNode = (nodes: any[], id: string): any => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };
  const activeNode = activeNoteId ? findNode(data, activeNoteId) : null;
  const docId = activeNoteId || 'default-doc';
  const pageData = canvasStore.getPageData(docId);

  // Mouse wheel for zooming / panning
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        // Zooming
        const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
        let newZoom = Math.max(0.1, Math.min(3, pageData.zoom + zoomDelta));
        canvasStore.setZoom(docId, newZoom);
      } else {
        // Panning with trackpad or mouse wheel
        canvasStore.setPan(docId, pageData.panX - e.deltaX, pageData.panY - e.deltaY);
      }
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, [docId, pageData.zoom, pageData.panX, pageData.panY, canvasStore]);

  // Middle click panning
  const handleMouseDown = (e: React.MouseEvent) => {
    // If we are in 'pan' tool, left click also pans
    const isPanClick = e.button === 1 || (e.button === 0 && e.altKey) || (canvasStore.drawTool === 'pan' && e.button === 0);
    
    if (isPanClick) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        initialPanX: pageData.panX,
        initialPanY: pageData.panY,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      canvasStore.setPan(docId, panStart.current.initialPanX + dx, panStart.current.initialPanY + dy);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Touch panning
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Don't pan if we are in drawing mode (unless it's 'pan' or 'type')
      if (canvasStore.drawTool !== 'type' && canvasStore.drawTool !== 'pan' && canvasStore.drawTool !== 'lasso') return;

      setIsPanning(true);
      panStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        initialPanX: pageData.panX,
        initialPanY: pageData.panY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanning && e.touches.length === 1) {
      const dx = e.touches[0].clientX - panStart.current.x;
      const dy = e.touches[0].clientY - panStart.current.y;
      canvasStore.setPan(docId, panStart.current.initialPanX + dx, panStart.current.initialPanY + dy);
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  // Click to create note
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isPanning) return;
    if (canvasStore.drawTool !== 'type') return; // Don't create text boxes while using drawing tools
    
    // Calculate click pos relative to canvas origin, factoring in zoom and pan
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - pageData.panX) / pageData.zoom;
    const y = (e.clientY - rect.top - pageData.panY) / pageData.zoom;

    canvasStore.addContainer(docId, x, y);
  };

  if (!activeNode) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', backgroundColor: '#f9fafb' }}>
        Select a note to open the canvas
      </div>
    );
  }

  const getBackgroundStyles = () => {
    let backgroundImage = 'none';
    let backgroundSize = 'auto';

    if (pageData.gridPattern === 'rule') {
      backgroundImage = 'linear-gradient(transparent 95%, #cbd5e1 95%)';
      backgroundSize = `100% ${30 * pageData.zoom}px`;
    } else if (pageData.gridPattern === 'grid') {
      backgroundImage = 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)';
      backgroundSize = `${30 * pageData.zoom}px ${30 * pageData.zoom}px`;
    }

    return {
      backgroundColor: pageData.pageColor || '#ffffff',
      backgroundImage,
      backgroundSize,
      backgroundPosition: `${pageData.panX}px ${pageData.panY}px`,
    };
  };

  return (
    <div 
      ref={viewportRef}
      className="editor-scroll-area"
      style={{ 
        flex: 1, 
        overflow: 'hidden', 
        position: 'relative',
        cursor: isPanning ? 'grabbing' : 'text',
        ...getBackgroundStyles()
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleCanvasClick}
    >
      {/* The Canvas Surface */}
      <div 
        className="infinite-canvas-surface"
        style={{
          position: 'absolute',
          top: pageData.paperSize && pageData.paperSize !== 'auto' ? '40px' : 0,
          left: pageData.paperSize && pageData.paperSize !== 'auto' ? '40px' : 0,
          transformOrigin: '0 0',
          transform: `translate(${pageData.panX}px, ${pageData.panY}px) scale(${pageData.zoom})`,
          width: pageData.paperSize === 'a4' ? '794px' : pageData.paperSize === 'a3' ? '1123px' : pageData.paperSize === 'letter' ? '816px' : '10000px',
          height: pageData.paperSize === 'a4' ? '1123px' : pageData.paperSize === 'a3' ? '1587px' : pageData.paperSize === 'letter' ? '1056px' : '10000px',
          backgroundColor: pageData.paperSize && pageData.paperSize !== 'auto' ? '#ffffff' : 'transparent',
          boxShadow: pageData.paperSize && pageData.paperSize !== 'auto' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none',
        }}
      >
        <PageTitleBlock 
          title={activeNode.title} 
          createdAt={Date.now()} // Replace with actual created date later
          onTitleChange={(newTitle) => {
            useTreeStore.getState().renameNode(activeNode.id, newTitle);
          }} 
        />

        <CanvasDrawLayer docId={docId} />

        {pageData.containers.map(c => (
          <NoteContainer key={c.id} docId={docId} containerId={c.id} />
        ))}
      </div>
    </div>
  );
};
