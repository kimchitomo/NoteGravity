import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { FontSize } from './FontSize';
import { AudioExtension, VideoExtension, IframeExtension } from './extensions/MediaExtensions';
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

export const ReadingHighlightPluginKey = new PluginKey('readingHighlight');

const ReadingHighlightExtension = Extension.create({
  name: 'readingHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: ReadingHighlightPluginKey,
        state: {
          init() { return DecorationSet.empty; },
          apply(tr, oldState) {
            const highlightRange = tr.getMeta(ReadingHighlightPluginKey);
            if (highlightRange === 'CLEAR') return DecorationSet.empty;
            if (highlightRange) {
              const { from, to } = highlightRange;
              return DecorationSet.create(tr.doc, [
                Decoration.inline(from, to, { class: 'reading-highlight', style: 'background-color: rgba(253, 224, 71, 0.4);' })
              ]);
            }
            return oldState.map(tr.mapping, tr.doc);
          }
        },
        props: {
          decorations(state) {
            return this.getState(state);
          }
        }
      })
    ];
  }
});

export interface TiptapEditorProps {
  docId?: string;
  createdAt?: number;
  updatedAt?: number;
  isLocked?: boolean;
  onFocus?: (editor: any) => void;
  onContentChange?: () => void;
  autoWidth?: boolean;
  autoFocus?: boolean;
}

const RealTiptapEditor: React.FC<TiptapEditorProps> = ({ docId = 'notegravity-doc-1', createdAt, updatedAt, isLocked, onFocus, onContentChange, autoWidth, autoFocus }) => {
  const [headings, setHeadings] = useState<any[]>([]);

  // Chỉ khởi tạo 1 lần theo docId
  const ydoc = React.useMemo(() => new Y.Doc(), [docId]);

  // Removed WebsocketProvider to prevent connection errors during offline development

  const editor = useEditor({
    editable: !isLocked,
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Prevent conflict with CodeBlockLowlight
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
      AudioExtension,
      VideoExtension,
      IframeExtension,
      CodeBlockLowlight.configure({ lowlight }),
      SlashMenu, 
      FontFamily,
      FontSize,
      CanvasExtension, // Tích hợp TLDraw NodeView
      DocumentLinkExtension,
      ReadingHighlightExtension,
    ],
    onFocus({ editor }) {
      if (onFocus) onFocus(editor);
      window.dispatchEvent(new CustomEvent('capture-global-snapshot'));
    },
    onSelectionUpdate({ editor }) {
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(0, from, '\n');
      window.dispatchEvent(new CustomEvent('editor-cursor-changed', { detail: { textBefore, docId } }));
    },
    onUpdate({ editor, transaction }) {
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

      if (transaction.docChanged && onContentChange) {
        onContentChange();
      }
    },
    // Không dùng 'content' tĩnh khi dùng Collaboration
    content: localStorage.getItem(`note-content-${docId}`) || (autoFocus ? '<p></p>' : '<p>Bắt đầu nhập nội dung tại đây...</p>'),
    editorProps: {
      handleClick(view, pos, event) {
        const textBefore = view.state.doc.textBetween(0, pos, '\n');
        const textAfter = view.state.doc.textBetween(pos, view.state.doc.content.size, '\n');
        const rawSnippet = textAfter.substring(0, 50).trim();
        window.dispatchEvent(new CustomEvent('immersive-reader-click', { detail: { docId, textBefore, rawSnippet } }));
        return false;
      }
    },
  }, [docId]); // Re-create editor when docId changes

  useEffect(() => {
    if (editor && isLocked !== undefined) {
      editor.setEditable(!isLocked);
    }
  }, [editor, isLocked]);

  useEffect(() => {
    if (editor && autoFocus) {
      // Use a small timeout to ensure the DOM is ready
      const t = setTimeout(() => editor.commands.focus('end'), 50);
      return () => clearTimeout(t);
    }
  }, [editor, autoFocus]);

  // Listen for Time Travel (Undo) events
  useEffect(() => {
    if (!editor) return;

    const reloadContent = () => {
      const savedContent = localStorage.getItem(`note-content-${docId}`);
      if (savedContent && savedContent !== editor.getHTML()) {
        editor.commands.setContent(savedContent);
      }
    };

    const handleReloadEditor = (e: any) => {
      const targetId = e.detail?.docId;
      if (targetId && (targetId === 'ALL' || docId === targetId || docId.startsWith(`${targetId}-`))) {
        reloadContent();
      }
    };

    window.addEventListener('reload-editor', handleReloadEditor);
    window.addEventListener('storage', reloadContent);

    return () => {
      window.removeEventListener('reload-editor', handleReloadEditor);
      window.removeEventListener('storage', reloadContent);
    };
  }, [editor, docId]);

  // Listen for canvas search and replace
  useEffect(() => {
    if (!editor) return;

    const handleReplaceAll = (e: any) => {
      const { docId: targetDoc, find, replace } = e.detail;
      if (targetDoc && (docId === targetDoc || docId.startsWith(`${targetDoc}-`))) {
         const matches: { from: number; to: number; replacement: string }[] = [];
         editor.state.doc.descendants((node, pos) => {
            if (node.isText && node.text) {
               // Escape regex specials
               const escapedFind = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
               const regex = new RegExp(escapedFind, 'gi');
               let match;
               while ((match = regex.exec(node.text)) !== null) {
                   matches.push({
                       from: pos + match.index,
                       to: pos + match.index + match[0].length,
                       replacement: replace
                   });
               }
            }
         });
         
         if (matches.length > 0) {
             // Apply from back to front to avoid position shifting
             matches.sort((a, b) => b.from - a.from);
             let chain = editor.chain();
             matches.forEach(m => {
                 chain = chain.deleteRange({ from: m.from, to: m.to }).insertContentAt(m.from, m.replacement);
             });
             chain.run();
             
             // Update history
             window.dispatchEvent(new CustomEvent('capture-global-snapshot'));
             
             // Update local storage
             localStorage.setItem(`note-content-${docId}`, editor.getHTML());
             if (onContentChange) onContentChange();
         }
      }
    };

    window.addEventListener('canvas-replace-all', handleReplaceAll);
    return () => {
      window.removeEventListener('canvas-replace-all', handleReplaceAll);
    };
  }, [editor, docId, onContentChange]);

  // Listen for immersive reader highlight
  useEffect(() => {
    if (!editor) return;

    const handleHighlight = (e: any) => {
      const { docId: targetDoc, text } = e.detail;
      if (targetDoc && (docId === targetDoc || docId.startsWith(`${targetDoc}-`))) {
         let cleanTarget = text.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '').toLowerCase();
         if (!cleanTarget) return;

         let docText = '';
         const posMap: number[] = [];
         editor.state.doc.descendants((node, pos) => {
            if (node.isText && node.text) {
               for (let i = 0; i < node.text.length; i++) {
                  const char = node.text[i];
                  if (/[a-zA-Z0-9\u00C0-\u1EF9]/.test(char)) {
                      docText += char.toLowerCase();
                      posMap.push(pos + i);
                  }
               }
            }
         });

         const matchIdx = docText.indexOf(cleanTarget);
         if (matchIdx !== -1) {
            const fromPos = posMap[matchIdx];
            const toPos = posMap[matchIdx + cleanTarget.length - 1] + 1;
            
            // Set reading highlight decoration without changing selection or focus
            editor.view.dispatch(editor.state.tr.setMeta(ReadingHighlightPluginKey, { from: fromPos, to: toPos }));
            
            // Avoid smooth scroll since highlight updates every second and smooth scrolling will lag
            const view = editor.view;
            try {
              const domNode = view.domAtPos(fromPos).node as Element;
              if (domNode && domNode.scrollIntoView) {
                domNode.scrollIntoView({ behavior: 'auto', block: 'center' });
              } else {
                view.dispatch(editor.state.tr.scrollIntoView());
              }
            } catch(e) {
              view.dispatch(editor.state.tr.scrollIntoView());
            }
         }
      }
    };

    const handleClearHighlight = () => {
      if (editor) {
        editor.view.dispatch(editor.state.tr.setMeta(ReadingHighlightPluginKey, 'CLEAR'));
      }
    };

    window.addEventListener('canvas-highlight-text', handleHighlight);
    window.addEventListener('canvas-clear-highlight', handleClearHighlight);
    return () => {
      window.removeEventListener('canvas-highlight-text', handleHighlight);
      window.removeEventListener('canvas-clear-highlight', handleClearHighlight);
    };
  }, [editor, docId]);

  return (
    <div className="editor-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: autoWidth ? 'max-content' : '100%', minWidth: autoWidth ? 'min-content' : '100%', backgroundColor: 'transparent' }}>

      {/* Editor Content Area */}
      <div className="editor-scroll-area" style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden' }}>
        <div 
          className="editor-document" 
          style={{ flex: 1, overflowY: 'auto' }}
          onClickCapture={(e) => {
            if (isLocked) {
              e.preventDefault();
              e.stopPropagation();
              alert("Ghi chú này đang bị khóa. Hãy mở khóa ở thanh bên trái để chỉnh sửa!");
              document.getElementById(`lock-icon-${docId}`)?.focus();
              return;
            }
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && editor) {
              editor.commands.focus('start');
            }
          }}
        >
          {editor && (
            <>
              <MiniToolbar editor={editor} />
              <TableMenu editor={editor} />
            </>
          )}
          <EditorContent editor={editor} />
        </div>

      </div>
    </div>
  );
};

export const TiptapEditor: React.FC<TiptapEditorProps> = (props) => {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    setShouldLoad(false);
    // If autoFocus, load immediately; otherwise use delay to prevent lag during rapid hover
    const delay = props.autoFocus ? 0 : 250;
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [props.docId, props.autoFocus]);

  if (!shouldLoad) {
    const saved = localStorage.getItem(`note-content-${props.docId || 'notegravity-doc-1'}`);
    return (
      <div className="editor-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: 'var(--bg-color)' }}>

        <div className="editor-scroll-area" style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden' }}>
          <div 
            className="editor-document tiptap ProseMirror" 
            style={{ flex: 1, overflowY: 'auto' }}
            onClickCapture={(e) => {
              if (props.isLocked) {
                e.preventDefault();
                e.stopPropagation();
                alert("Ghi chú này đang bị khóa. Hãy mở khóa ở thanh bên trái để chỉnh sửa!");
                document.getElementById(`lock-icon-${props.docId}`)?.focus();
              }
            }}
          >
             {saved ? (
               <div dangerouslySetInnerHTML={{ __html: saved }} />
             ) : (
               <div style={{ color: '#999', padding: '1rem', fontStyle: 'italic' }}>Đang tải...</div>
             )}
          </div>
        </div>
      </div>
    );
  }

  return <RealTiptapEditor {...props} />;
};
