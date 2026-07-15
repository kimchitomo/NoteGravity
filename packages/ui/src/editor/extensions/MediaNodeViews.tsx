import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';

export const AudioNodeView: React.FC<NodeViewProps> = ({ node }) => {
  const { src } = node.attrs;
  return (
    <NodeViewWrapper className="audio-node-wrapper" style={{ margin: '8px 0' }}>
      <audio controls src={src} style={{ width: '100%' }} />
    </NodeViewWrapper>
  );
};

export const VideoNodeView: React.FC<NodeViewProps> = ({ node }) => {
  const { src, width, style } = node.attrs;
  return (
    <NodeViewWrapper className="video-node-wrapper" style={{ margin: '8px 0', textAlign: 'center' }}>
      <video controls src={src} width={width} style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }} />
    </NodeViewWrapper>
  );
};

export const IframeNodeView: React.FC<NodeViewProps> = ({ node }) => {
  const { src, width, height, frameborder, style } = node.attrs;
  return (
    <NodeViewWrapper className="iframe-node-wrapper" style={{ margin: '8px 0' }}>
      <iframe src={src} width={width} height={height} frameBorder={frameborder} style={{ border: '1px solid #d1d5db', borderRadius: '4px', width: '100%', minHeight: '400px' }} />
    </NodeViewWrapper>
  );
};
