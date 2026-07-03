import React from 'react';
import { Cloud, CheckCircle2, AlertTriangle, Minus, Plus } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useCanvasStore } from '../../store/useCanvasStore';

export const StatusBar: React.FC = () => {
  const activeNoteId = useWorkspaceStore(state => state.activeNoteId);
  const zoom = useCanvasStore(state => activeNoteId ? (state.pages[activeNoteId]?.zoom || 1) : 1);
  const setZoom = useCanvasStore(state => state.setZoom);

  const zoomPercent = Math.round(zoom * 100);

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeNoteId) return;
    const newZoom = parseInt(e.target.value) / 100;
    setZoom(activeNoteId, newZoom);
  };

  const handleZoomOut = () => {
    if (!activeNoteId) return;
    setZoom(activeNoteId, Math.max(0.1, zoom - 0.1));
  };

  const handleZoomIn = () => {
    if (!activeNoteId) return;
    setZoom(activeNoteId, Math.min(3, zoom + 0.1));
  };

  return (
    <div style={{
      height: '24px',
      backgroundColor: '#f3f4f6',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      fontSize: '12px',
      color: '#4b5563',
      userSelect: 'none'
    }}>
      {/* Left Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title="Sync Status: All up to date">
          <Cloud size={14} />
          <CheckCircle2 size={12} color="#10b981" />
          <span>Page synced</span>
        </div>
      </div>

      {/* Right Controls (Zoom) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={handleZoomOut}
          disabled={!activeNoteId}
          style={{ background: 'none', border: 'none', cursor: activeNoteId ? 'pointer' : 'default', display: 'flex', alignItems: 'center', opacity: activeNoteId ? 1 : 0.5 }}>
          <Minus size={14} color="#6b7280" />
        </button>
        
        <input 
          type="range" 
          min="10" 
          max="300" 
          value={zoomPercent} 
          onChange={handleZoomChange}
          disabled={!activeNoteId}
          style={{ width: '100px', cursor: activeNoteId ? 'pointer' : 'default', opacity: activeNoteId ? 1 : 0.5 }}
          title="Zoom Level"
        />
        
        <button 
          onClick={handleZoomIn}
          disabled={!activeNoteId}
          style={{ background: 'none', border: 'none', cursor: activeNoteId ? 'pointer' : 'default', display: 'flex', alignItems: 'center', opacity: activeNoteId ? 1 : 0.5 }}>
          <Plus size={14} color="#6b7280" />
        </button>
        
        <span style={{ minWidth: '40px', textAlign: 'right', opacity: activeNoteId ? 1 : 0.5 }}>{zoomPercent}%</span>
      </div>
    </div>
  );
};
