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
