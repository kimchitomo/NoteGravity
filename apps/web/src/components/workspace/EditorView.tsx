import React from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useTreeStore } from '../../store/useTreeStore';
import { TiptapEditor } from '@notegravity/ui';

const findNodeById = (nodes: any[], id: string): any => {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
  }
  return null;
};

export const EditorView: React.FC = () => {
  const { activeNoteId } = useWorkspaceStore();
  const { data, lockedIds } = useTreeStore();

  const activeNode = activeNoteId ? findNodeById(data, activeNoteId) : null;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-color)',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {activeNoteId ? (
        <TiptapEditor 
          key={activeNoteId} 
          docId={activeNoteId} 
          createdAt={activeNode?.createdAt} 
          updatedAt={activeNode?.updatedAt} 
          isLocked={lockedIds.has(activeNoteId)}
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '48px', opacity: 0.2 }}>📓</div>
          <div style={{ fontSize: '16px' }}>Select a note from the sidebar to start editing</div>
        </div>
      )}
    </div>
  );
};
