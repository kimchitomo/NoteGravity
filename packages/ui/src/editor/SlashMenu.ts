import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

// Placeholder cho Slash Menu Extension
// Trong thực tế, cần tích hợp thư viện @tiptap/suggestion và tippy.js
// để render popup menu chứa các commands khi gõ '/'

export const SlashMenu = Extension.create({
  name: 'slashMenu',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
