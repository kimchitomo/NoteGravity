import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { EditorView } from '../components/workspace/EditorView';
import { TitleBar } from '../components/layout/TitleBar';
import { Ribbon } from '../components/layout/Ribbon';
import { StatusBar } from '../components/layout/StatusBar';

export const WorkspaceLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#ffffff' }}>
      <TitleBar />
      <Ribbon />
      
      {/* Main Workspace Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <EditorView />
      </div>

      <StatusBar />
    </div>
  );
};
