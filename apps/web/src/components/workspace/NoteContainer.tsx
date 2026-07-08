import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Mic } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useEditorStore } from '../../store/useEditorStore';
import { TiptapEditor } from '@notegravity/ui';
import { useTreeStore, findNodeById } from '../../store/useTreeStore';
import { SpeechRecognitionModal } from '../modals/SpeechRecognitionModal';

interface NoteContainerProps {
  docId: string;
  containerId: string;
}

type ResizeDir = 'e' | 'se' | 'sw' | 'ne' | 'nw' | null;

export const NoteContainer: React.FC<NoteContainerProps> = ({ docId, containerId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDir, setResizeDir] = useState<ResizeDir>(null);
  const setActiveEditor = useEditorStore(state => state.setActiveEditor);
  const addActionLog = useTreeStore(state => state.addActionLog);
  const treeData = useTreeStore(state => state.data);
  const debounceRef = useRef<any>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const handleContentChange = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const node = findNodeById(treeData, docId);
      addActionLog('Edited note', node ? node.title : 'Unknown Note', docId);
    }, 2000);
  };

  const pageDataRaw = useCanvasStore(state => state.pages[docId]);
  const pageData = React.useMemo(() => {
    const defaults = { panX: 0, panY: 0, zoom: 1, pageColor: '#ffffff', gridPattern: 'none' as const, paperSize: 'a4' as const, containers: [], strokes: [], shapes: [] };
    return pageDataRaw ? { ...defaults, ...pageDataRaw, shapes: pageDataRaw.shapes || [] } : defaults;
  }, [pageDataRaw]);
  const containerData = pageData.containers.find(c => c.id === containerId);
  const updateContainer = useCanvasStore(state => state.updateContainer);
  const removeContainer = useCanvasStore(state => state.removeContainer);

  // Store initial state for drag/resize
  const dragStart = useRef({ mouseX: 0, mouseY: 0, x: 0, y: 0 });
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, x: 0, y: 0, width: 0, height: 0 });

  // Prevent text selection globally during drag/resize
  useEffect(() => {
    if (isDragging || resizeDir) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = isDragging ? 'grabbing' : resizeCursorMap[resizeDir!] || 'nwse-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, resizeDir]);

  useEffect(() => {
    if (!isDragging && !resizeDir) return;

    const handleMouseMove = (e: MouseEvent) => {
      const zoom = useCanvasStore.getState().getPageData(docId).zoom;

      if (isDragging) {
        const dx = (e.clientX - dragStart.current.mouseX) / zoom;
        const dy = (e.clientY - dragStart.current.mouseY) / zoom;
        updateContainer(docId, containerId, {
          x: Math.max(0, dragStart.current.x + dx),
          y: Math.max(0, dragStart.current.y + dy),
        });
      }

      if (resizeDir) {
        const dx = (e.clientX - resizeStart.current.mouseX) / zoom;
        const dy = (e.clientY - resizeStart.current.mouseY) / zoom;
        const updates: any = {};

        if (resizeDir === 'e' || resizeDir === 'se' || resizeDir === 'ne') {
          updates.width = Math.max(120, resizeStart.current.width + dx);
        }
        if (resizeDir === 'sw' || resizeDir === 'nw') {
          const newWidth = Math.max(120, resizeStart.current.width - dx);
          updates.width = newWidth;
          updates.x = resizeStart.current.x + (resizeStart.current.width - newWidth);
        }
        if (resizeDir === 'se' || resizeDir === 'sw') {
          updates.height = Math.max(40, resizeStart.current.height + dy);
        }
        if (resizeDir === 'ne' || resizeDir === 'nw') {
          const newHeight = Math.max(40, resizeStart.current.height - dy);
          updates.height = newHeight;
          updates.y = resizeStart.current.y + (resizeStart.current.height - newHeight);
        }

        updateContainer(docId, containerId, { ...updates, isAutoWidth: false });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setResizeDir(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, resizeDir, docId, containerId, updateContainer]);

  // Focus container via event
  useEffect(() => {
    const handleFocus = (e: any) => {
      if (e.detail.id === containerId && containerRef.current) {
        const editorEl = containerRef.current.querySelector('.ProseMirror') as HTMLElement;
        if (editorEl) editorEl.focus();
      }
    };
    window.addEventListener('focus-note-container', handleFocus);
    return () => window.removeEventListener('focus-note-container', handleFocus);
  }, [containerId]);

  // Shift+Tab -> go back to sidebar
  useEffect(() => {
    const handleShiftTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && e.shiftKey) {
        if (containerRef.current && containerRef.current.contains(document.activeElement)) {
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('focus-sidebar-node', { detail: { id: docId } }));
        }
      }
    };
    window.addEventListener('keydown', handleShiftTab, true);
    return () => window.removeEventListener('keydown', handleShiftTab, true);
  }, [docId]);

  // F3 -> mở modal nhận diện giọng nói khi container đang được focus
  useEffect(() => {
    const handleF3 = (e: KeyboardEvent) => {
      if (e.key === 'F3' && !e.repeat) {
        if (containerRef.current && containerRef.current.contains(document.activeElement)) {
          e.preventDefault();
          e.stopPropagation();
          setShowVoiceModal(true);
        }
      }
    };
    window.addEventListener('keydown', handleF3, true);
    return () => window.removeEventListener('keydown', handleF3, true);
  }, []);

  if (!containerData) return null;

  const isFocused = containerData.isFocused;
  const isAutoWidth = containerData.isAutoWidth !== false;
  const containerWidth = isAutoWidth ? undefined : containerData.width;
  const containerHeight = (containerData as any).height;

  const startDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    useCanvasStore.getState().saveHistory(docId);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: containerData.x,
      y: containerData.y,
    };
    setIsDragging(true);
    updateContainer(docId, containerId, { isFocused: true });
  };

  const startResize = (e: React.MouseEvent, dir: ResizeDir) => {
    e.stopPropagation();
    e.preventDefault();
    useCanvasStore.getState().saveHistory(docId);
    const currentWidth = isAutoWidth
      ? (containerRef.current?.offsetWidth || containerData.width)
      : containerData.width;
    const currentHeight = (containerData as any).height || containerRef.current?.offsetHeight || 100;
    resizeStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: containerData.x,
      y: containerData.y,
      width: currentWidth,
      height: currentHeight,
    };
    setResizeDir(dir);
    updateContainer(docId, containerId, { isFocused: true });
  };

  const handleVisible = isFocused || isHovered || isDragging || !!resizeDir;

  // Corner handle style
  const cornerStyle = (pos: { top?: number | string; bottom?: number | string; left?: number | string; right?: number | string }, cursor: string): React.CSSProperties => ({
    position: 'absolute',
    ...pos,
    width: 10,
    height: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    cursor,
    zIndex: 20,
    display: handleVisible ? 'block' : 'none',
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: containerData.x,
        top: containerData.y,
        width: containerWidth,
        minWidth: 80,
        height: containerHeight,
        backgroundColor: 'transparent',
        border: handleVisible ? '1px solid #3b82f6' : '1px solid transparent',
        borderRadius: 4,
        zIndex: isFocused ? 10 : 1,
        transition: 'border-color 0.15s',
        display: 'inline-block',
        boxSizing: 'border-box',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (e.ctrlKey) {
          updateContainer(docId, containerId, { isFocused: !isFocused }, true);
        } else if (!isFocused) {
          updateContainer(docId, containerId, { isFocused: true });
        }
        // Nếu click không trúng trực tiếp vào ProseMirror thì tự focus và đặt con trỏ về đầu
        const editorEl = containerRef.current?.querySelector('.ProseMirror') as HTMLElement;
        if (editorEl && !editorEl.contains(e.target as Node)) {
          editorEl.focus();
          // Đặt con trỏ về đầu văn bản (góc trái trên cùng)
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            // Tìm node text đầu tiên, nếu không thì dùng chính editorEl
            const firstNode = editorEl.firstChild || editorEl;
            try {
              range.setStart(firstNode, 0);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            } catch {
              // fallback: chỉ focus mà không set range
            }
          }
        }
      }}
    >
      {/* Top Bar: Drag handle + Delete */}
      <div
        style={{
          position: 'absolute',
          top: -22,
          left: 0,
          right: 0,
          height: 22,
          backgroundColor: '#f0f7ff',
          borderRadius: '4px 4px 0 0',
          border: '1px solid #bfdbfe',
          borderBottom: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: handleVisible ? 1 : 0,
          transition: 'opacity 0.15s',
          paddingLeft: 4,
          paddingRight: 4,
        }}
      >
        {/* Drag handle */}
        <div
          style={{ flex: 1, height: '100%', cursor: isDragging ? 'grabbing' : 'grab', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          onMouseDown={startDrag}
          title="Kéo để di chuyển"
        >
          <div style={{ width: 28, height: 3, backgroundColor: '#93c5fd', borderRadius: 2 }} />
        </div>
        {/* Voice Recognition */}
        <button
          className="nc-mic-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowVoiceModal(true);
          }}
          title="Nhận diện giọng nói (F3)"
        >
          <Mic size={12} />
        </button>
        {/* Delete */}
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Bạn có chắc muốn xóa khối văn bản này?')) removeContainer(docId, containerId);
          }}
          title="Xóa khối"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      {/* Voice Modal */}
      {showVoiceModal && (
        <SpeechRecognitionModal
          initialText=""
          onClose={() => setShowVoiceModal(false)}
          onApply={(text) => {
            if (text) {
              // Chèn văn bản vào editor đang active
              const editorEl = containerRef.current?.querySelector('.ProseMirror') as HTMLElement;
              if (editorEl) {
                editorEl.focus();
                document.execCommand('insertText', false, text);
              }
            }
            setShowVoiceModal(false);
          }}
        />
      )}

      {/* Editor */}
      <div className="canvas-tiptap-container" style={{ padding: 4, margin: 0, height: 'auto', display: 'inline-block', width: '100%', boxSizing: 'border-box' }}>
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
            padding: 2px 4px !important;
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
          autoFocus={isFocused && !localStorage.getItem(`note-content-${docId}-${containerId}`)}
        />
      </div>

      {/* ── Resize handles ── */}
      {/* Right edge */}
      <div
        style={{ position: 'absolute', top: 0, bottom: 0, right: -4, width: 8, cursor: 'ew-resize', display: handleVisible ? 'block' : 'none' }}
        onMouseDown={(e) => startResize(e, 'e')}
      />
      {/* Corner: SE */}
      <div style={cornerStyle({ bottom: -5, right: -5 }, 'nwse-resize')} onMouseDown={(e) => startResize(e, 'se')} title="Kéo để thay đổi kích thước" />
      {/* Corner: SW */}
      <div style={cornerStyle({ bottom: -5, left: -5 }, 'nesw-resize')} onMouseDown={(e) => startResize(e, 'sw')} title="Kéo để thay đổi kích thước" />
      {/* Corner: NE */}
      <div style={cornerStyle({ top: -5, right: -5 }, 'nesw-resize')} onMouseDown={(e) => startResize(e, 'ne')} title="Kéo để thay đổi kích thước" />
      {/* Corner: NW */}
      <div style={cornerStyle({ top: -5, left: -5 }, 'nwse-resize')} onMouseDown={(e) => startResize(e, 'nw')} title="Kéo để thay đổi kích thước" />
    </div>
  );
};

const resizeCursorMap: Record<string, string> = {
  e: 'ew-resize',
  se: 'nwse-resize',
  sw: 'nesw-resize',
  ne: 'nesw-resize',
  nw: 'nwse-resize',
};
