import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AudioNodeView, VideoNodeView, IframeNodeView } from './MediaNodeViews';

export const AudioExtension = Node.create({
  name: 'audio',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'audio',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['audio', mergeAttributes(HTMLAttributes), ['source', { src: HTMLAttributes.src }]];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AudioNodeView);
  },

  addCommands() {
    return {
      setAudio:
        (options: { src: string }) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    } as any;
  },
});

export const VideoExtension = Node.create({
  name: 'video',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
      width: { default: '100%' },
      style: { default: 'max-width: 100%; max-height: 400px; border-radius: 8px;' }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'video',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes), ['source', { src: HTMLAttributes.src }]];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
  },

  addCommands() {
    return {
      setVideo:
        (options: { src: string }) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    } as any;
  },
});

export const IframeExtension = Node.create({
  name: 'iframe',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: '100%' },
      height: { default: '500px' },
      frameborder: { default: '0' },
      style: { default: 'border: 1px solid #d1d5db; border-radius: 4px; margin-top: 8px;' }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['iframe', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(IframeNodeView);
  },

  addCommands() {
    return {
      setIframe:
        (options: { src: string }) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    } as any;
  },
});
