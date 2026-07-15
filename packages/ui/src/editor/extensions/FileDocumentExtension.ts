import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { DocumentNodeView } from './DocumentNodeView';

export const FileDocumentExtension = Node.create({
  name: 'fileDocument',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      filename: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="document"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'document' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentNodeView);
  },

  addCommands() {
    return {
      setFileDocument:
        (options: { src: string; filename?: string }) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    } as any;
  },
});
