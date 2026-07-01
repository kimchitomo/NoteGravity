import React from 'react';
import { useWorkspaceStore, Pane as PaneType } from '../../store/useWorkspaceStore';
import { useTreeStore } from '../../store/useTreeStore';
import { TiptapEditor } from '@notegravity/ui';
import { X, Plus, SplitSquareHorizontal } from 'lucide-react';

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

interface PaneProps {
  pane: PaneType;
  isThirdOfThree?: boolean;
}

export const Pane: React.FC<PaneProps> = ({ pane, isThirdOfThree }) => {
  const { setActiveTab, removeTabFromPane, addTabToPane, removePane, addPane, setActivePane, activePaneId } = useWorkspaceStore();
  const { data } = useTreeStore();

  const handleAddTab = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    addTabToPane(pane.id, { id: `note-${newId}`, title: 'New Note' });
  };

  const activeNode = pane.activeTabId ? findNodeById(data, pane.activeTabId) : null;

  return (
    <div
      onClick={() => setActivePane(pane.id)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-color)',
        overflow: 'hidden',
        // Make the third pane span 2 columns if there are 3 panes
        gridColumn: isThirdOfThree ? 'span 2' : 'auto',
        outline: activePaneId === pane.id ? '2px solid #0066cc' : 'none',
        outlineOffset: '-2px',
      }}
    >
      {/* Pane Header (Tabs) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #eaeaea',
          padding: '0 8px',
          height: '40px',
        }}
      >
        <div style={{ display: 'flex', flex: 1, overflowX: 'auto', gap: '4px' }}>
          {pane.tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(pane.id, tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 12px',
                backgroundColor: pane.activeTabId === tab.id ? '#fff' : 'transparent',
                border: '1px solid',
                borderColor: pane.activeTabId === tab.id ? '#eaeaea' : 'transparent',
                borderBottom: 'none',
                borderTopLeftRadius: '6px',
                borderTopRightRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: pane.activeTabId === tab.id ? 500 : 400,
                color: pane.activeTabId === tab.id ? '#333' : '#666',
                minWidth: '100px',
                maxWidth: '200px',
              }}
            >
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tab.title}
              </span>
              <X
                size={14}
                style={{ marginLeft: '8px', cursor: 'pointer', opacity: 0.5 }}
                onClick={(e) => {
                  e.stopPropagation();
                  removeTabFromPane(pane.id, tab.id);
                }}
              />
            </div>
          ))}
          {pane.previewTab && !pane.tabs.find((t) => t.id === pane.previewTab!.id) && (
            <div
              key={pane.previewTab.id}
              onClick={() => setActiveTab(pane.id, pane.previewTab!.id)}
              onDoubleClick={() => addTabToPane(pane.id, pane.previewTab!)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 12px',
                backgroundColor: pane.activeTabId === pane.previewTab.id ? '#fff' : 'transparent',
                border: '1px solid',
                borderColor: pane.activeTabId === pane.previewTab.id ? '#eaeaea' : 'transparent',
                borderBottom: 'none',
                borderTopLeftRadius: '6px',
                borderTopRightRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontStyle: 'italic',
                fontWeight: pane.activeTabId === pane.previewTab.id ? 500 : 400,
                color: pane.activeTabId === pane.previewTab.id ? '#333' : '#666',
                minWidth: '100px',
                maxWidth: '200px',
              }}
            >
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pane.previewTab.title}
              </span>
              <X
                size={14}
                style={{ marginLeft: '8px', cursor: 'pointer', opacity: 0.5 }}
                onClick={(e) => {
                  e.stopPropagation();
                  removeTabFromPane(pane.id, pane.previewTab!.id);
                }}
              />
            </div>
          )}
          <div
            onClick={handleAddTab}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px 8px',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            <Plus size={16} />
          </div>
        </div>

        {/* Pane Controls */}
        <div style={{ display: 'flex', gap: '8px', color: '#666' }}>
          <span title="Split Pane" style={{ cursor: 'pointer', display: 'flex' }} onClick={addPane}>
            <SplitSquareHorizontal size={16} />
          </span>
          <span title="Close Pane" style={{ cursor: 'pointer', display: 'flex' }} onClick={() => removePane(pane.id)}>
            <X size={16} />
          </span>
        </div>
      </div>

      {/* Pane Content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {pane.activeTabId ? (
          <TiptapEditor key={pane.activeTabId} docId={pane.activeTabId} createdAt={activeNode?.createdAt} updatedAt={activeNode?.updatedAt} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
            No tab selected
          </div>
        )}
      </div>
    </div>
  );
};
