import React from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

interface TLDrawCanvasProps {
  initialData?: any;
  onChange?: (data: any) => void;
  readOnly?: boolean;
}

export const TLDrawCanvas: React.FC<TLDrawCanvasProps> = ({ initialData, onChange, readOnly = false }) => {
  return (
    <div style={{ width: '100%', height: '400px', border: '1px solid #eaeaea', borderRadius: '8px', overflow: 'hidden' }}>
      <Tldraw 
        // In real app, bind store to initialData and listen to changes
        // store={store}
        hideUi={false}
      />
    </div>
  );
};
