import React, { useRef, useState, useCallback } from 'react';
import { useCanvasStore, Stroke, StrokePoint, ShapeItem } from '../../store/useCanvasStore';
import getStroke from 'perfect-freehand';

// Tạo SVG path từ perfect-freehand points
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

// Render shape SVG element
const renderShapeElement = (shape: ShapeItem) => {
  const props = {
    key: shape.id,
    stroke: shape.color,
    strokeWidth: shape.strokeWidth,
    fill: shape.fill || 'none',
    style: { pointerEvents: 'none' as const },
  };

  if (shape.type === 'rect') {
    return <rect {...props} x={shape.x} y={shape.y} width={shape.width} height={shape.height} />;
  }
  if (shape.type === 'circle') {
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;
    const rx = Math.abs(shape.width / 2);
    const ry = Math.abs(shape.height / 2);
    return <ellipse {...props} cx={cx} cy={cy} rx={rx} ry={ry} />;
  }
  if (shape.type === 'triangle') {
    const x1 = shape.x + shape.width / 2;
    const y1 = shape.y;
    const x2 = shape.x;
    const y2 = shape.y + shape.height;
    const x3 = shape.x + shape.width;
    const y3 = shape.y + shape.height;
    return <polygon {...props} points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`} />;
  }
  if (shape.type === 'line') {
    return <line {...props} x1={shape.x} y1={shape.y} x2={shape.x + shape.width} y2={shape.y + shape.height} />;
  }
  if (shape.type === 'arrow') {
    const x2 = shape.x + shape.width;
    const y2 = shape.y + shape.height;
    const angle = Math.atan2(shape.height, shape.width);
    const arrowLen = 14;
    const ax1 = x2 - arrowLen * Math.cos(angle - Math.PI / 6);
    const ay1 = y2 - arrowLen * Math.sin(angle - Math.PI / 6);
    const ax2 = x2 - arrowLen * Math.cos(angle + Math.PI / 6);
    const ay2 = y2 - arrowLen * Math.sin(angle + Math.PI / 6);
    return (
      <g key={shape.id} style={{ pointerEvents: 'none' }}>
        <line stroke={shape.color} strokeWidth={shape.strokeWidth} fill="none" x1={shape.x} y1={shape.y} x2={x2} y2={y2} />
        <polyline stroke={shape.color} strokeWidth={shape.strokeWidth} fill="none" points={`${ax1},${ay1} ${x2},${y2} ${ax2},${ay2}`} />
      </g>
    );
  }
  return null;
};

interface CanvasDrawLayerProps {
  docId: string;
}

export const CanvasDrawLayer: React.FC<CanvasDrawLayerProps> = ({ docId }) => {
  const {
    drawTool, drawColor, drawWidth, shapeType,
    addStroke, removeStrokeAt, addShape
  } = useCanvasStore();

  const pageDataRaw = useCanvasStore(state => state.pages[docId]);
  const pageData = React.useMemo(() => {
    const defaults = { panX: 0, panY: 0, zoom: 1, containers: [], strokes: [], shapes: [] };
    return pageDataRaw ? { ...defaults, ...pageDataRaw, shapes: pageDataRaw.shapes || [] } : defaults;
  }, [pageDataRaw]);

  const strokes = pageData.strokes || [];
  const shapes = pageData.shapes || [];

  const [currentStrokePoints, setCurrentStrokePoints] = useState<StrokePoint[]>([]);
  const [previewShape, setPreviewShape] = useState<ShapeItem | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const eraserActiveRef = useRef(false);

  const isDrawingMode = ['pen', 'highlighter', 'eraser', 'shape'].includes(drawTool);

  const getSVGCoords = (e: React.PointerEvent): { x: number; y: number } => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pageData.panX) / pageData.zoom,
      y: (e.clientY - rect.top - pageData.panY) / pageData.zoom,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDrawingMode || !svgRef.current) return;
    if (e.button === 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = getSVGCoords(e);

    if (drawTool === 'pen' || drawTool === 'highlighter') {
      setCurrentStrokePoints([{ x, y, pressure: e.pressure }]);
    } else if (drawTool === 'eraser') {
      eraserActiveRef.current = true;
      removeStrokeAt(docId, x, y, drawWidth);
    } else if (drawTool === 'shape') {
      dragStartRef.current = { x, y };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawingMode || !svgRef.current) return;
    if (e.buttons !== 1) return;
    const { x, y } = getSVGCoords(e);

    if ((drawTool === 'pen' || drawTool === 'highlighter') && currentStrokePoints.length > 0) {
      setCurrentStrokePoints(prev => [...prev, { x, y, pressure: e.pressure }]);
    } else if (drawTool === 'eraser' && eraserActiveRef.current) {
      removeStrokeAt(docId, x, y, drawWidth);
    } else if (drawTool === 'shape' && dragStartRef.current) {
      const sx = dragStartRef.current.x;
      const sy = dragStartRef.current.y;
      setPreviewShape({
        id: 'preview',
        type: shapeType,
        x: Math.min(sx, x),
        y: Math.min(sy, y),
        width: Math.abs(x - sx),
        height: Math.abs(y - sy),
        color: drawColor,
        strokeWidth: drawWidth,
        fill: 'none',
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawingMode) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}

    if ((drawTool === 'pen' || drawTool === 'highlighter') && currentStrokePoints.length > 2) {
      const newStroke: Stroke = {
        id: Math.random().toString(36).substring(2, 9),
        points: currentStrokePoints,
        color: drawColor,
        width: drawWidth,
        type: drawTool as 'pen' | 'highlighter',
      };
      addStroke(docId, newStroke);
    } else if (drawTool === 'shape' && previewShape && previewShape.width > 5 && previewShape.height > 5) {
      addShape(docId, { ...previewShape, id: Math.random().toString(36).substring(2, 9) });
    }

    setCurrentStrokePoints([]);
    setPreviewShape(null);
    dragStartRef.current = null;
    eraserActiveRef.current = false;
  };

  const renderStroke = (points: StrokePoint[], color: string, width: number, type: 'pen' | 'highlighter', key: string) => {
    const rawPoints = points.map(p => [p.x, p.y, p.pressure || 0.5]);
    const outlinePoints = getStroke(rawPoints, {
      size: width,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
      simulatePressure: true,
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

  // Cursor based on tool
  const getCursor = () => {
    if (drawTool === 'eraser') return 'cell';
    if (drawTool === 'shape') return 'crosshair';
    if (drawTool === 'pen' || drawTool === 'highlighter') return 'crosshair';
    return 'default';
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
        zIndex: isDrawingMode ? 50 : 0,
        touchAction: 'none',
        cursor: getCursor(),
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <g transform={`translate(${pageData.panX}, ${pageData.panY}) scale(${pageData.zoom})`}>
        {/* Render strokes */}
        {strokes.map(s => renderStroke(s.points, s.color, s.width, s.type, s.id))}

        {/* Render shapes */}
        {shapes.map(shape => renderShapeElement(shape))}

        {/* Eraser cursor indicator */}
        {drawTool === 'eraser' && (
          <circle id="eraser-cursor" r={drawWidth} fill="rgba(255,255,255,0.5)" stroke="#6b7280" strokeWidth={1} style={{ pointerEvents: 'none' }} />
        )}

        {/* Current stroke preview */}
        {currentStrokePoints.length > 0 && (
          renderStroke(currentStrokePoints, drawColor, drawWidth, drawTool as 'pen' | 'highlighter', 'current')
        )}

        {/* Shape preview */}
        {previewShape && renderShapeElement(previewShape)}
      </g>
    </svg>
  );
};
