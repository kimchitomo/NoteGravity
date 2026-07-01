import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { PaneGrid } from '../components/workspace/PaneGrid';

export const WorkspaceLayout = () => {
  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar for Navigation */}
      <Sidebar />

      {/* Main Workspace Area */}
      <PaneGrid />
    </div>
  );
};
