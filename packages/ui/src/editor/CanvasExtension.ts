import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CanvasNodeView } from './CanvasNodeView';

export const CanvasExtension = Node.create({
  name: 'drawingCanvas',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      canvasData: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="drawing-canvas"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'drawing-canvas' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CanvasNodeView);
  },
});
