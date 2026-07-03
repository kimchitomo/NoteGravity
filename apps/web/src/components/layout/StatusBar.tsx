import React from 'react';
import { Cloud, CheckCircle2, AlertTriangle, Minus, Plus } from 'lucide-react';

export const StatusBar: React.FC = () => {
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
        
        {/* Placeholder for errors */}
        {/* <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', cursor: 'pointer' }}>
          <AlertTriangle size={14} />
          <span>1 Error</span>
        </div> */}
      </div>

      {/* Right Controls (Zoom) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Minus size={14} color="#6b7280" />
        </button>
        
        <input 
          type="range" 
          min="10" 
          max="300" 
          defaultValue="100" 
          style={{ width: '100px', cursor: 'pointer' }}
          title="Zoom Level"
        />
        
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Plus size={14} color="#6b7280" />
        </button>
        
        <span style={{ minWidth: '40px', textAlign: 'right' }}>100%</span>
      </div>
    </div>
  );
};
