import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Replace } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

export const CanvasSearchReplace = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const { activeNoteId } = useWorkspaceStore();
  const findInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F or Ctrl+H
      if (e.ctrlKey && (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'h')) {
        // Prevent default browser search
        e.preventDefault();
        setIsOpen(true);
        // Delay focus slightly to ensure render
        setTimeout(() => findInputRef.current?.focus(), 50);
      }
      
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleReplaceAll = () => {
    if (!findText) return;
    
    // Dispatch global event for TiptapEditors to listen to
    window.dispatchEvent(
      new CustomEvent('canvas-replace-all', {
        detail: {
          docId: activeNoteId || 'default-doc',
          find: findText,
          replace: replaceText,
        },
      })
    );
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 60, // below header
        right: 20,
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        padding: '12px',
        zIndex: 9999,
        width: '300px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        border: '1px solid #e5e7eb',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Tìm kiếm & Thay thế</span>
        <button
          onClick={() => setIsOpen(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px' }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 8, top: 8, color: '#9ca3af' }} />
        <input
          ref={findInputRef}
          type="text"
          placeholder="Tìm kiếm..."
          value={findText}
          onChange={(e) => setFindText(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px 6px 28px',
            fontSize: '13px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ position: 'relative' }}>
        <Replace size={14} style={{ position: 'absolute', left: 8, top: 8, color: '#9ca3af' }} />
        <input
          type="text"
          placeholder="Thay thế bằng..."
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px 6px 28px',
            fontSize: '13px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button
          onClick={handleReplaceAll}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Thay thế tất cả
        </button>
      </div>
    </div>
  );
};
