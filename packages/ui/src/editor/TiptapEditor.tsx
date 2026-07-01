import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

import Link from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Youtube from '@tiptap/extension-youtube';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';

import { MainToolbar } from './MainToolbar';
import { MiniToolbar } from './MiniToolbar';
import { SlashMenu } from './SlashMenu';
import { TableMenu } from './TableMenu';
import { CanvasExtension } from './CanvasExtension';
import { TableOfContents } from './TableOfContents';
import { DocumentLinkExtension } from './DocumentLinkExtension';

// Tạo ngẫu nhiên màu cho cursor
const getRandomColor = () => {
  const colors = ['#958DF1', '#F98181', '#FBCE76', '#8AE39C', '#84AEE3'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export interface TiptapEditorProps {
  docId?: string;
  createdAt?: number;
  updatedAt?: number;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ docId = 'notegravity-doc-1', createdAt, updatedAt }) => {
  const [headings, setHeadings] = useState<any[]>([]);

  // Chỉ khởi tạo 1 lần theo docId
  const ydoc = React.useMemo(() => new Y.Doc(), [docId]);

  // Khởi tạo provider đồng bộ để tránh null provider gây lỗi ở CollaborationCursor
  const provider = React.useMemo(() => {
    return new WebsocketProvider('ws://localhost:1234', docId, ydoc);
  }, [ydoc, docId]);

  useEffect(() => {
    provider.on('status', (event: { status: string }) => {
      console.log('WS status:', event.status); // 'connected' | 'disconnected'
    });

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Tắt history mặc định vì Collaboration extension sẽ tự quản lý history
        history: false,
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: 'User ' + Math.floor(Math.random() * 100),
          color: getRandomColor(),
        },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      TaskList,
      TaskItem,
      Underline,
      TextStyle,
      Color,
      Link.configure({ openOnClick: false }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Typography,
      Youtube,
      CodeBlockLowlight.configure({ lowlight }),
      SlashMenu, 
      CanvasExtension, // Tích hợp TLDraw NodeView
      DocumentLinkExtension,
    ],
    onUpdate({ editor }) {
      const newHeadings: any[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          newHeadings.push({
            level: node.attrs.level,
            text: node.textContent,
            pos,
          });
        }
      });
      setHeadings(newHeadings);
      
      // Auto-save
      localStorage.setItem(`note-content-${docId}`, editor.getHTML());
    },
    // Không dùng 'content' tĩnh khi dùng Collaboration
    // content: '<p>Bắt đầu nhập nội dung tại đây...</p>',
  }, [docId]); // Re-create editor when docId changes

  useEffect(() => {
    if (editor && editor.isEmpty) {
      const saved = localStorage.getItem(`note-content-${docId}`);
      if (saved) {
        editor.commands.setContent(saved);
      }
    }
  }, [editor, docId]);

  return (
    <div className="editor-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: 'var(--bg-color)' }}>
      {/* Editor Header / Metadata */}
      <div className="editor-header" style={{ padding: '8px 16px', fontSize: '12px', color: '#666', borderBottom: '1px solid #eaeaea', backgroundColor: '#f9f9f9' }}>
        <div className="editor-date">
          <span>🗓 Created: {createdAt ? new Date(createdAt).toLocaleString('vi-VN') : new Date().toLocaleDateString('vi-VN')}</span>
          <span style={{ margin: '0 8px', color: '#ccc' }}>|</span>
          <span>⏱ Updated: {updatedAt ? new Date(updatedAt).toLocaleString('vi-VN') : new Date().toLocaleTimeString('vi-VN')}</span>
        </div>
      </div>

      {/* Main Ribbon Toolbar */}
      {editor && <MainToolbar editor={editor} />}

      {/* Editor Content Area */}
      <div className="editor-scroll-area" style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden' }}>
        <div className="editor-document" style={{ flex: 1, overflowY: 'auto' }}>
          {editor && (
            <>
              <MiniToolbar editor={editor} />
              <TableMenu editor={editor} />
            </>
          )}
          <EditorContent editor={editor} />
        </div>
        
        {/* Table of Contents Sidebar */}
        <div style={{ width: '200px', borderLeft: '1px solid #eaeaea', backgroundColor: '#fafafa', overflowY: 'auto' }}>
          {editor && <TableOfContents editor={editor} headings={headings} />}
        </div>
      </div>
    </div>
  );
};
