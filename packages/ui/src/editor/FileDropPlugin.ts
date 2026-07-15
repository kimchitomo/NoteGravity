import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Slice, Fragment, Node as ProseMirrorNode } from 'prosemirror-model';

export const FileDropPluginKey = new PluginKey('fileDropPlugin');

export const FileDropPlugin = (onFileUpload?: (file: File) => Promise<string>) => {
  return new Plugin({
    key: FileDropPluginKey,
    props: {
      handleDrop(view: EditorView, event: DragEvent, slice: Slice, moved: boolean) {
        if (!onFileUpload || moved || !event.dataTransfer || !event.dataTransfer.files || event.dataTransfer.files.length === 0) {
          return false; // let standard tiptap handler process it
        }

        const files = Array.from(event.dataTransfer.files);
        event.preventDefault();

        const { schema } = view.state;
        const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (!coordinates) return false;

        files.forEach(async (file) => {
          try {
            // Hiển thị trạng thái đang tải (có thể cài tiến bằng placeholder)
            const url = await onFileUpload(file);
            
            let node: ProseMirrorNode | null = null;
            
            if (file.type.startsWith('image/')) {
              node = schema.nodes.image.create({ src: url, alt: file.name });
            } else if (file.type.startsWith('video/')) {
              node = schema.nodes.video.create({ src: url });
            } else if (file.type.startsWith('audio/')) {
              node = schema.nodes.audio.create({ src: url });
            } else if (file.type === 'application/pdf') {
              node = schema.nodes.iframe.create({ src: url });
            } else if (
              file.name.endsWith('.docx') || 
              file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ) {
              node = schema.nodes.fileDocument.create({ src: url, filename: file.name });
            } else if (
              file.name.endsWith('.xlsx') || 
              file.name.endsWith('.csv') ||
              file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
              file.type === 'text/csv'
            ) {
              node = schema.nodes.fileSpreadsheet.create({ src: url, filename: file.name });
            } else {
              // Fallback to standard link
              const textNode = schema.text(file.name, [schema.marks.link.create({ href: url })]);
              node = schema.nodes.paragraph.create({}, textNode);
            }

            if (node) {
              const tr = view.state.tr.insert(coordinates.pos, node);
              view.dispatch(tr);
            }
          } catch (error) {
            console.error('Lỗi khi upload file:', error);
          }
        });

        return true;
      },
      handlePaste(view: EditorView, event: ClipboardEvent, slice: Slice) {
        if (!onFileUpload || !event.clipboardData || !event.clipboardData.files || event.clipboardData.files.length === 0) {
          return false;
        }

        const files = Array.from(event.clipboardData.files);
        event.preventDefault();

        const { schema } = view.state;
        const pos = view.state.selection.from;

        files.forEach(async (file) => {
          try {
            const url = await onFileUpload(file);
            
            let node: ProseMirrorNode | null = null;
            
            if (file.type.startsWith('image/')) {
              node = schema.nodes.image.create({ src: url, alt: file.name });
            } else if (file.type.startsWith('video/')) {
              node = schema.nodes.video.create({ src: url });
            } else if (file.type.startsWith('audio/')) {
              node = schema.nodes.audio.create({ src: url });
            } else if (file.type === 'application/pdf') {
              node = schema.nodes.iframe.create({ src: url });
            } else if (
              file.name.endsWith('.docx') || 
              file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ) {
              node = schema.nodes.fileDocument.create({ src: url, filename: file.name });
            } else if (
              file.name.endsWith('.xlsx') || 
              file.name.endsWith('.csv') ||
              file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
              file.type === 'text/csv'
            ) {
              node = schema.nodes.fileSpreadsheet.create({ src: url, filename: file.name });
            } else {
              const textNode = schema.text(file.name || 'File', [schema.marks.link.create({ href: url })]);
              node = schema.nodes.paragraph.create({}, textNode);
            }

            if (node) {
              const tr = view.state.tr.insert(pos, node);
              view.dispatch(tr);
            }
          } catch (error) {
            console.error('Lỗi khi upload file từ Paste:', error);
          }
        });

        return true;
      }
    }
  });
};

import { Extension } from '@tiptap/core';

export const FileDropExtension = Extension.create<{ onFileUpload?: (file: File) => Promise<string> }>({
  name: 'fileDrop',

  addOptions() {
    return {
      onFileUpload: undefined,
    };
  },

  addProseMirrorPlugins() {
    return [FileDropPlugin(this.options.onFileUpload)];
  },
});
