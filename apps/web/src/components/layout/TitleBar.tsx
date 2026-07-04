import React from 'react';
import { Undo2, Redo2, RefreshCw, Search, Minimize, Maximize, X, User, Mic, Menu } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

export const TitleBar: React.FC = () => {
  const isMobile = useIsMobile();
  const toggleSidebar = useWorkspaceStore(state => state.toggleSidebar);

  return (
    <div style={{
      height: '40px',
      backgroundColor: 'var(--titlebar-bg, #ffffff)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      WebkitAppRegion: 'drag', // For Electron/Tauri dragging
      borderBottom: '1px solid #eaeaea',
      userSelect: 'none'
    } as React.CSSProperties}>
      {/* Quick Access Toolbar (QAT) */}
      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '8px', gap: '4px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {isMobile && (
          <button className="qat-btn" title="Menu" onClick={toggleSidebar} style={{ marginRight: '4px', color: '#10b981' }}>
            <Menu size={20} />
          </button>
        )}
        {!isMobile && (
          <>
            <button className="qat-btn" title="Undo"><Undo2 size={16} /></button>
            <button className="qat-btn" title="Redo"><Redo2 size={16} /></button>
            <button className="qat-btn" title="Sync"><RefreshCw size={16} /></button>
          </>
        )}
      </div>

      {/* Center Search Box */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', WebkitAppRegion: 'no-drag', margin: '0 16px' } as React.CSSProperties}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f3f4f6',
          borderRadius: '4px',
          padding: '2px 8px',
          width: '100%',
          maxWidth: '400px',
          border: '1px solid #e5e7eb'
        }}>
          <Search size={14} color="#6b7280" />
          <input 
            type="text" 
            placeholder="Search (Ctrl+E)" 
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              fontSize: '13px',
              marginLeft: '8px'
            }}
          />
          <button className="qat-btn" title="Tìm kiếm bằng giọng nói (F3)" style={{ padding: '2px' }}>
            <Mic size={14} color="#3b82f6" />
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <div style={{ display: 'flex', alignItems: 'center', marginRight: isMobile ? '8px' : '16px', gap: '8px' }}>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: '#4b5563', gap: '4px' }}>
              <RefreshCw size={14} color="#10b981" /> Syncing...
            </div>
          )}
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={14} color="#4b5563" />
          </div>
        </div>

        {/* Window Controls (Mac/Win agnostic mock) */}
        {!isMobile && (
          <div className="window-controls" style={{ display: 'flex', height: '40px' }}>
            <button className="win-btn" title="Minimize"><Minimize size={14} /></button>
            <button className="win-btn" title="Maximize"><Maximize size={14} /></button>
            <button className="win-btn close-btn" title="Close"><X size={14} /></button>
          </div>
        )}
      </div>

      <style>{`
        .qat-btn {
          background: transparent; border: none; cursor: pointer; border-radius: 4px; padding: 4px; display: flex; align-items: center; justify-content: center; color: #4b5563;
        }
        .qat-btn:hover { background-color: #e5e7eb; }
        .win-btn {
          background: transparent; border: none; cursor: pointer; width: 46px; height: 100%; display: flex; align-items: center; justify-content: center; color: #111827; transition: background-color 0.1s;
        }
        .win-btn:hover { background-color: #e5e7eb; }
        .win-btn.close-btn:hover { background-color: #ef4444; color: white; }
      `}</style>
    </div>
  );
};
