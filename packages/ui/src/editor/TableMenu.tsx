import React from 'react';
import { BubbleMenu, Editor } from '@tiptap/react';
import { 
  ArrowLeftToLine, ArrowRightToLine, ArrowUpToLine, ArrowDownToLine, 
  Trash2, Combine, Split
} from 'lucide-react';

interface TableMenuProps {
  editor: Editor;
}

export const TableMenu: React.FC<TableMenuProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  // Should show only if cursor is inside a table
  const isTableActive = editor.isActive('table');

  if (!isTableActive) {
    return null;
  }

  return (
    <BubbleMenu editor={editor} tippyOptions={{ duration: 100, placement: 'top' }}>
      <div className="mini-toolbar">
        <button className="mini-btn" onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add Column Before">
          <ArrowLeftToLine size={14} />
        </button>
        <button className="mini-btn" onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column After">
          <ArrowRightToLine size={14} />
        </button>
        <button className="mini-btn" onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column" style={{ color: '#ef4444' }}>
          <Trash2 size={14} />
        </button>
        
        <div className="mini-divider" />
        
        <button className="mini-btn" onClick={() => editor.chain().focus().addRowBefore().run()} title="Add Row Before">
          <ArrowUpToLine size={14} />
        </button>
        <button className="mini-btn" onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row After">
          <ArrowDownToLine size={14} />
        </button>
        <button className="mini-btn" onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row" style={{ color: '#ef4444' }}>
          <Trash2 size={14} />
        </button>
        
        <div className="mini-divider" />
        
        <button className="mini-btn" onClick={() => editor.chain().focus().mergeCells().run()} title="Merge Cells">
          <Combine size={14} />
        </button>
        <button className="mini-btn" onClick={() => editor.chain().focus().splitCell().run()} title="Split Cell">
          <Split size={14} />
        </button>
      </div>
    </BubbleMenu>
  );
};
