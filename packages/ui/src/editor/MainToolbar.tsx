import React from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  Subscript, Superscript, Code, Highlighter,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, CheckSquare, Quote, Link2, 
  Image as ImageIcon, Table as TableIcon, Play
} from 'lucide-react';

interface MainToolbarProps {
  editor: Editor;
}

export const MainToolbar: React.FC<MainToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="main-toolbar">
      {/* Font & Style Group */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
          title="Bold (Cmd+B)"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
          title="Italic (Cmd+I)"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`toolbar-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
          title="Underline (Cmd+U)"
        >
          <Underline size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`toolbar-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Advanced Text Group */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={`toolbar-btn ${editor.isActive('subscript') ? 'is-active' : ''}`}
          title="Subscript"
        >
          <Subscript size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={`toolbar-btn ${editor.isActive('superscript') ? 'is-active' : ''}`}
          title="Superscript"
        >
          <Superscript size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`toolbar-btn ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
          title="Code Block"
        >
          <Code size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`toolbar-btn ${editor.isActive('highlight') ? 'is-active' : ''}`}
          title="Highlight"
        >
          <Highlighter size={16} />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Alignment Group */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Lists & Indentation Group */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`toolbar-btn ${editor.isActive('taskList') ? 'is-active' : ''}`}
          title="Checklist"
        >
          <CheckSquare size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`toolbar-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
          title="Blockquote"
        >
          <Quote size={16} />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Insert Group */}
      <div className="toolbar-group">
        <button
          onClick={() => {
            const url = prompt('Enter link URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`toolbar-btn ${editor.isActive('link') ? 'is-active' : ''}`}
          title="Insert Link"
        >
          <Link2 size={16} />
        </button>
        <button
          onClick={() => {
            const url = prompt('Enter image URL:');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          className="toolbar-btn"
          title="Insert Image"
        >
          <ImageIcon size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="toolbar-btn"
          title="Insert Table"
        >
          <TableIcon size={16} />
        </button>
        <button
          onClick={() => {
            const url = prompt('Enter YouTube URL:');
            if (url) {
              editor.commands.setYoutubeVideo({ src: url });
            }
          }}
          className="toolbar-btn"
          title="Insert YouTube Video"
        >
          <Play size={16} />
        </button>
      </div>
    </div>
  );
};
