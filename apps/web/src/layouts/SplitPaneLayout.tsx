import React, { useState } from 'react';
import { TiptapEditor } from '@notegravity/ui';
import { Sidebar } from '../components/Sidebar';

// Giả lập Split Pane (chia màn hình 2 vùng)
export const SplitPaneLayout = () => {
  const [panes, setPanes] = useState([
    { id: 1, title: 'Thiết kế hệ thống NoteGravity' },
    { id: 2, title: 'Họp giao ban (Tuần 42)' },
  ]);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      {/* Sidebar Đệ quy */}
      <Sidebar />

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1 }}>
        {panes.map(pane => (
          <div key={pane.id} style={{ flex: 1, borderRight: '1px solid #eee', padding: '20px', overflowY: 'auto' }}>
            <div className="pane-header">
              <h4>{pane.title}</h4>
            </div>
            {/* Tiptap Editor placeholder */}
            <TiptapEditor />
          </div>
        ))}
      </div>
    </div>
  );
};
