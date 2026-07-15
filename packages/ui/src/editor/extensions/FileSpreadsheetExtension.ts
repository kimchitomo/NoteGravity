import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { SpreadsheetNodeView } from './SpreadsheetNodeView';

export const FileSpreadsheetExtension = Node.create({
  name: 'fileSpreadsheet',
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
        tag: 'div[data-type="spreadsheet"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'spreadsheet' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SpreadsheetNodeView);
  },

  addCommands() {
    return {
      setFileSpreadsheet:
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
