import React from 'react';
import { BubbleMenu, Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  Subscript, Superscript, Highlighter,
  AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';

interface MiniToolbarProps {
  editor: Editor;
}

export const MiniToolbar: React.FC<MiniToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
      <div className="mini-toolbar">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`mini-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
          title="Bold"
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`mini-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
          title="Italic"
        >
          <Italic size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`mini-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
          title="Underline"
        >
          <Underline size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`mini-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
          title="Strikethrough"
        >
          <Strikethrough size={14} />
        </button>
        
        <div className="mini-divider" />
        
        <button
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={`mini-btn ${editor.isActive('subscript') ? 'is-active' : ''}`}
          title="Subscript"
        >
          <Subscript size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={`mini-btn ${editor.isActive('superscript') ? 'is-active' : ''}`}
          title="Superscript"
        >
          <Superscript size={14} />
        </button>

        <div className="mini-divider" />
        
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`mini-btn ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}
          title="Align Left"
        >
          <AlignLeft size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`mini-btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
          title="Align Center"
        >
          <AlignCenter size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`mini-btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
          title="Align Right"
        >
          <AlignRight size={14} />
        </button>

        <div className="mini-divider" />
        
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`mini-btn ${editor.isActive('highlight') ? 'is-active' : ''}`}
          title="Highlight"
          style={{ color: editor.isActive('highlight') ? '#eab308' : 'inherit' }}
        >
          <Highlighter size={14} />
        </button>
      </div>
    </BubbleMenu>
  );
};
