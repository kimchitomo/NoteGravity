import React from 'react';
import { Editor } from '@tiptap/react';

interface TOCProps {
  editor: Editor;
  headings: any[];
}

export const TableOfContents: React.FC<TOCProps> = ({ editor, headings }) => {
  if (headings.length === 0) {
    return (
      <div style={{ padding: '16px', color: '#999', fontSize: '13px' }}>
        No headings found
      </div>
    );
  }

  return (
    <div className="toc-container" style={{ padding: '16px' }}>
      <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#555' }}>Table of Contents</h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {headings.map((heading, index) => (
          <li
            key={index}
            style={{
              paddingLeft: `${(heading.level - 1) * 12}px`,
              marginBottom: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              color: '#0066cc',
            }}
            onClick={() => {
              editor.commands.setTextSelection(heading.pos);
              editor.commands.scrollIntoView();
            }}
          >
            {heading.text}
          </li>
        ))}
      </ul>
    </div>
  );
};
