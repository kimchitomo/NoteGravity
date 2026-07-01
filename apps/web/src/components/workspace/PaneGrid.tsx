import React from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { Pane } from './Pane';

export const PaneGrid = () => {
  const panes = useWorkspaceStore((state) => state.panes);

  // Layout based on number of panes (max 4)
  const getGridStyle = () => {
    switch (panes.length) {
      case 1:
        return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
      case 2:
        return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr' };
      case 3:
        return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
      case 4:
      default:
        return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
    }
  };

  if (panes.length === 0) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div style={{ marginBottom: '16px', fontSize: '16px' }}>Vùng làm việc trống</div>
          <button 
            onClick={() => useWorkspaceStore.getState().addPane()}
            style={{ padding: '8px 16px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
          >
            Mở vùng làm việc mới
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        flex: 1,
        ...getGridStyle(),
        gap: '2px',
        backgroundColor: '#eaeaea', // grid lines
      }}
    >
      {panes.map((pane, index) => (
        <Pane
          key={pane.id}
          pane={pane}
          isThirdOfThree={panes.length === 3 && index === 2}
        />
      ))}
    </div>
  );
};
