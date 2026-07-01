import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { TLDrawCanvas } from '../canvas/TLDrawCanvas';

export const CanvasNodeView: React.FC<NodeViewProps> = (props) => {
  return (
    <NodeViewWrapper className="canvas-node-view">
      <div contentEditable="false">
        <TLDrawCanvas 
          initialData={props.node.attrs.canvasData}
          onChange={(data) => {
            props.updateAttributes({ canvasData: data });
          }}
        />
      </div>
    </NodeViewWrapper>
  );
};
