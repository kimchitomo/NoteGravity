import React, { useRef, useState } from 'react';
import { useCanvasStore, Stroke, StrokePoint } from '../../store/useCanvasStore';
import getStroke from 'perfect-freehand';

// Get SVG path data from perfect-freehand points
const getSvgPathFromStroke = (stroke: number[][]) => {
  if (!stroke.length) return '';

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );

  d.push('Z');
  return d.join(' ');
};

interface CanvasDrawLayerProps {
  docId: string;
}

export const CanvasDrawLayer: React.FC<CanvasDrawLayerProps> = ({ docId }) => {
  const { getPageData, drawTool, drawColor, drawWidth, addStroke } = useCanvasStore();
  const pageData = getPageData(docId);
  const strokes = pageData.strokes || [];
  
  const [currentStrokePoints, setCurrentStrokePoints] = useState<StrokePoint[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  // If not in a drawing mode, we don't capture pointer events so Notes can be clicked
  const isDrawingMode = ['pen', 'highlighter'].includes(drawTool);
  
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDrawingMode || !svgRef.current) return;
    
    // Middle click is used for panning in EditorView
    if (e.button === 1) return;

    // Use setPointerCapture to keep receiving events even if pointer leaves element
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pageData.panX) / pageData.zoom;
    const y = (e.clientY - rect.top - pageData.panY) / pageData.zoom;
    
    setCurrentStrokePoints([{ x, y, pressure: e.pressure }]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawingMode || currentStrokePoints.length === 0 || !svgRef.current) return;
    
    // Only capture primary button (left click or touch)
    if (e.buttons !== 1) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pageData.panX) / pageData.zoom;
    const y = (e.clientY - rect.top - pageData.panY) / pageData.zoom;
    
    setCurrentStrokePoints(prev => [...prev, { x, y, pressure: e.pressure }]);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawingMode || currentStrokePoints.length === 0) return;

    e.currentTarget.releasePointerCapture(e.pointerId);

    if (currentStrokePoints.length > 2) {
      const newStroke: Stroke = {
        id: Math.random().toString(36).substring(2, 9),
        points: currentStrokePoints,
        color: drawColor,
        width: drawWidth,
        type: drawTool as 'pen' | 'highlighter',
      };
      addStroke(docId, newStroke);
    }
    
    setCurrentStrokePoints([]);
  };

  // Convert points to perfect-freehand outline points
  const renderStroke = (points: StrokePoint[], color: string, width: number, type: 'pen' | 'highlighter', key: string) => {
    const rawPoints = points.map(p => [p.x, p.y, p.pressure || 0.5]);
    
    const outlinePoints = getStroke(rawPoints, {
      size: width,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
      simulatePressure: true, // Only simulates if pressure isn't present
    });
    
    const pathData = getSvgPathFromStroke(outlinePoints);
    
    return (
      <path
        key={key}
        d={pathData}
        fill={color}
        opacity={type === 'highlighter' ? 0.4 : 1}
        style={{ pointerEvents: 'none', mixBlendMode: type === 'highlighter' ? 'multiply' : 'normal' }}
      />
    );
  };

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: isDrawingMode ? 'auto' : 'none',
        zIndex: isDrawingMode ? 50 : 0, // Put it above notes when drawing, behind when typing
        touchAction: 'none' // Prevent browser native zoom/pan while drawing
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <g transform={`translate(${pageData.panX}, ${pageData.panY}) scale(${pageData.zoom})`}>
        {strokes.map(s => renderStroke(s.points, s.color, s.width, s.type, s.id))}
        
        {currentStrokePoints.length > 0 && (
          renderStroke(currentStrokePoints, drawColor, drawWidth, drawTool as 'pen' | 'highlighter', 'current')
        )}
      </g>
    </svg>
  );
};
