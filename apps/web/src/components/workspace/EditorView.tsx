import React, { useRef, useState, useEffect } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useTreeStore } from '../../store/useTreeStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { NoteContainer } from './NoteContainer';
import { PageTitleBlock } from './PageTitleBlock';
import { CanvasDrawLayer } from './CanvasDrawLayer';
import { CanvasSearchReplace } from './CanvasSearchReplace';

export const EditorView = () => {
  const { activeNoteId } = useWorkspaceStore();
  const { data } = useTreeStore();
  const setZoom = useCanvasStore(state => state.setZoom);
  const drawTool = useCanvasStore(state => state.drawTool);
  const addContainer = useCanvasStore(state => state.addContainer);
  const removeContainers = useCanvasStore(state => state.removeContainers);
  const selectAllContainers = useCanvasStore(state => state.selectAllContainers);
  const clearAllFocus = useCanvasStore(state => state.clearAllFocus);
  
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [showZoomOverlay, setShowZoomOverlay] = useState(false);
  const zoomTimer = useRef<any>(null);
  const panStart = useRef({ x: 0, y: 0, initialScrollLeft: 0, initialScrollTop: 0 });

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
  const pageDataRaw = useCanvasStore(state => state.pages[docId]);
  const pageData = React.useMemo(() => {
    const defaults = { panX: 0, panY: 0, zoom: 1, pageColor: '#ffffff', gridPattern: 'none' as const, paperSize: 'a4' as const, containers: [], strokes: [], shapes: [] };
    return pageDataRaw ? { ...defaults, ...pageDataRaw, shapes: pageDataRaw.shapes || [] } : defaults;
  }, [pageDataRaw]);

  // Migrate legacy main content to a NoteContainer
  useEffect(() => {
    if (!docId) return;
    const legacyContent = localStorage.getItem(`note-content-${docId}`);
    if (legacyContent && legacyContent.trim() !== '' && legacyContent !== '<p></p>') {
      // Check if we already migrated (to avoid creating duplicates if they undo/redo)
      const migrated = localStorage.getItem(`migrated-note-${docId}`);
      // Only migrate if there are no existing containers on the page
      if (!migrated && pageData.containers.length === 0) {
        const newId = addContainer(docId, 40, 90);
        localStorage.setItem(`note-content-${docId}-${newId}`, legacyContent);
        localStorage.setItem(`migrated-note-${docId}`, 'true');
        // Do not delete legacy content yet so that older history snapshots or readers don't break immediately,
        // but we've marked it migrated so it won't duplicate again.
      } else if (!migrated && pageData.containers.length > 0) {
        // If there are already containers (like from an import), just mark as migrated
        localStorage.setItem(`migrated-note-${docId}`, 'true');
      }
    }
  }, [docId, addContainer, pageData.containers.length]);

  const [canvasBounds, setCanvasBounds] = useState({ width: 794, height: 1123 });

  useEffect(() => {
    if (pageData.paperSize === 'auto') return;
    
    const updateBounds = () => {
      const canvasEl = document.querySelector('.infinite-canvas-surface') as HTMLElement;
      if (!canvasEl) return;
      
      let maxW = 0;
      let maxH = 0;
      const children = canvasEl.children;
      for (let i = 0; i < children.length; i++) {
         const el = children[i] as HTMLElement;
         if (el.classList.contains('canvas-bg-page')) continue;
         const bottom = el.offsetTop + el.offsetHeight;
         const right = el.offsetLeft + el.offsetWidth;
         if (bottom > maxH) maxH = bottom;
         if (right > maxW) maxW = right;
      }
      
      const pW = pageData.paperSize === 'a4' ? 794 : pageData.paperSize === 'a3' ? 1123 : 816;
      const pH = pageData.paperSize === 'a4' ? 1123 : pageData.paperSize === 'a3' ? 1587 : 1056;
      
      const cols = Math.max(1, Math.ceil(maxW / pW));
      const rows = Math.max(1, Math.ceil(maxH / pH));
      
      setCanvasBounds(prev => {
        const newWidth = cols * pW;
        const newHeight = rows * pH;
        if (prev.width !== newWidth || prev.height !== newHeight) {
          return { width: newWidth, height: newHeight };
        }
        return prev;
      });
    };
    
    const interval = setInterval(updateBounds, 1000);
    updateBounds();
    return () => clearInterval(interval);
  }, [pageData.paperSize, docId]);

  // Mouse wheel for zooming
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        // Zooming
        // Zooming smoothly based on deltaY magnitude
        const zoomFactor = Math.pow(0.999, e.deltaY);
        let newZoom = Math.max(0.1, Math.min(3, pageData.zoom * zoomFactor));
        setZoom(docId, newZoom);
        
        setShowZoomOverlay(true);
        if (zoomTimer.current) clearTimeout(zoomTimer.current);
        zoomTimer.current = setTimeout(() => setShowZoomOverlay(false), 1500);
      }
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, [docId, pageData.zoom, setZoom]);

  // Middle click or Alt panning
  const handleMouseDown = (e: React.MouseEvent) => {
    // If we are in 'pan' tool, left click also pans
    const isPanClick = e.button === 1 || (e.button === 0 && e.altKey) || (drawTool === 'pan' && e.button === 0);
    
    if (isPanClick && viewportRef.current) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        initialScrollLeft: viewportRef.current.scrollLeft,
        initialScrollTop: viewportRef.current.scrollTop,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && viewportRef.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      viewportRef.current.scrollLeft = panStart.current.initialScrollLeft - dx;
      viewportRef.current.scrollTop = panStart.current.initialScrollTop - dy;
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Touch panning
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && viewportRef.current) {
      // Don't pan if we are in drawing mode (unless it's 'pan' or 'type')
      if (drawTool !== 'type' && drawTool !== 'pan' && drawTool !== 'lasso') return;

      setIsPanning(true);
      panStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        initialScrollLeft: viewportRef.current.scrollLeft,
        initialScrollTop: viewportRef.current.scrollTop,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanning && e.touches.length === 1 && viewportRef.current) {
      const dx = e.touches[0].clientX - panStart.current.x;
      const dy = e.touches[0].clientY - panStart.current.y;
      viewportRef.current.scrollLeft = panStart.current.initialScrollLeft - dx;
      viewportRef.current.scrollTop = panStart.current.initialScrollTop - dy;
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  // Keyboard undo/redo for workspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Skip if user is actively typing in a text field or editable element for other shortcuts
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      if (e.key === 'Delete') {
        // Find focused containers and delete them
        const state = useCanvasStore.getState();
        const page = state.pages[docId];
        if (page) {
           const focusedIds = page.containers.filter(c => c.isFocused).map(c => c.id);
           if (focusedIds.length > 0) {
              e.preventDefault();
              removeContainers(docId, focusedIds);
           }
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAllContainers(docId);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [docId]);

  // Click to create note
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isPanning) return;
    
    // Clear all focus when clicking on the canvas surface
    clearAllFocus(docId);

    if (drawTool !== 'type') return; // Don't create text boxes while using drawing tools
    
    // Calculate click pos relative to canvas origin, factoring in zoom and native scroll
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect || !viewportRef.current) return;

    const scrollLeft = viewportRef.current.scrollLeft;
    const scrollTop = viewportRef.current.scrollTop;

    // The surface itself might have a top/left offset if paperSize is NOT auto, e.g. 8px (2mm)
    const offsetX = pageData.paperSize === 'auto' ? 0 : 8;
    const offsetY = pageData.paperSize === 'auto' ? 0 : 8;

    const x = (e.clientX - rect.left + scrollLeft - offsetX) / pageData.zoom;
    const y = (e.clientY - rect.top + scrollTop - offsetY) / pageData.zoom;

    addContainer(docId, x, y);
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
      backgroundPosition: `0px 0px`, // Scrollbars handle panning now
    };
  };

  const renderBackgroundPages = () => {
    if (pageData.paperSize === 'auto') return null;
    const pW = pageData.paperSize === 'a4' ? 794 : pageData.paperSize === 'a3' ? 1123 : 816;
    const pH = pageData.paperSize === 'a4' ? 1123 : pageData.paperSize === 'a3' ? 1587 : 1056;
    const cols = canvasBounds.width / pW;
    const rows = canvasBounds.height / pH;
    
    const pages = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pageNumber = r * cols + c + 1;
        pages.push(
          <div
            key={`${r}-${c}`}
            className="canvas-bg-page"
            data-html2canvas-ignore="true" // Ignore during print so it doesn't show up in the pdf/image
            style={{
              position: 'absolute',
              top: r * pH,
              left: c * pW,
              width: pW,
              height: pH,
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              borderBottom: '1px solid #e5e7eb', 
              borderRight: '1px solid #e5e7eb',
              zIndex: -1, 
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '20px',
              color: '#9ca3af',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          >
            Trang {pageNumber}
          </div>
        );
      }
    }
    return pages;
  };

  return (
    <div 
      ref={viewportRef}
      className="editor-scroll-area"
      style={{ 
        flex: 1, 
        overflow: 'auto', 
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
      <CanvasSearchReplace />
      {/* The Canvas Surface */}
      <div 
        className="infinite-canvas-surface"
        style={{
          position: pageData.paperSize === 'auto' ? 'absolute' : 'relative',
          marginTop: pageData.paperSize && pageData.paperSize !== 'auto' ? '8px' : 0,
          marginLeft: pageData.paperSize && pageData.paperSize !== 'auto' ? '8px' : 0,
          marginBottom: pageData.paperSize && pageData.paperSize !== 'auto' ? '40px' : 0,
          transformOrigin: '0 0',
          transform: `scale(${pageData.zoom})`,
          width: pageData.paperSize === 'auto' ? '10000px' : `${canvasBounds.width}px`,
          height: pageData.paperSize === 'auto' ? '10000px' : `${canvasBounds.height}px`,
          backgroundColor: 'transparent',
          boxShadow: 'none',
        }}
      >
        {renderBackgroundPages()}
        
        <PageTitleBlock 
          title={activeNode.title} 
          createdAt={Date.now()} 
          onTitleChange={(newTitle) => {
            useTreeStore.getState().renameNode(activeNode.id, newTitle);
          }} 
        />

        <CanvasDrawLayer docId={docId} />

        {pageData.containers.map(c => (
          <NoteContainer key={c.id} docId={docId} containerId={c.id} />
        ))}
      </div>
      {showZoomOverlay && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(17, 24, 39, 0.8)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 600,
          zIndex: 1000,
          pointerEvents: 'none',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(4px)',
        }}>
          Thu phóng {Math.round(pageData.zoom * 100)}%
        </div>
      )}
    </div>
  );
};
