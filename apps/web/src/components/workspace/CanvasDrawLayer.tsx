import React, { useRef, useState, useCallback, useEffect } from 'react';
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
const renderShapeElement = (shape: ShapeItem, highlight = false) => {
  const props = {
    key: shape.id,
    stroke: highlight ? '#3b82f6' : shape.color,
    strokeWidth: highlight ? shape.strokeWidth + 1 : shape.strokeWidth,
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
        <line stroke={highlight ? '#3b82f6' : shape.color} strokeWidth={shape.strokeWidth} fill="none" x1={shape.x} y1={shape.y} x2={x2} y2={y2} />
        <polyline stroke={highlight ? '#3b82f6' : shape.color} strokeWidth={shape.strokeWidth} fill="none" points={`${ax1},${ay1} ${x2},${y2} ${ax2},${ay2}`} />
      </g>
    );
  }
  return null;
};

// ===== Lasso geometry helpers =====

// Kiểm tra một điểm có nằm trong polygon không (Ray Casting)
const pointInPolygon = (px: number, py: number, polygon: { x: number; y: number }[]): boolean => {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
};

// Kiểm tra stroke có nằm trong lasso polygon không (ít nhất 50% points)
const isStrokeInLasso = (stroke: Stroke, polygon: { x: number; y: number }[]): boolean => {
  if (polygon.length < 3 || stroke.points.length === 0) return false;
  let insideCount = 0;
  for (const pt of stroke.points) {
    if (pointInPolygon(pt.x, pt.y, polygon)) insideCount++;
  }
  return insideCount >= stroke.points.length * 0.4; // 40% bên trong = selected
};

// Kiểm tra shape có nằm trong lasso polygon không (center point)
const isShapeInLasso = (shape: ShapeItem, polygon: { x: number; y: number }[]): boolean => {
  if (polygon.length < 3) return false;
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;
  // Kiểm tra center + 4 corners
  const corners = [
    { x: cx, y: cy },
    { x: shape.x, y: shape.y },
    { x: shape.x + shape.width, y: shape.y },
    { x: shape.x, y: shape.y + shape.height },
    { x: shape.x + shape.width, y: shape.y + shape.height },
  ];
  let hits = 0;
  for (const pt of corners) {
    if (pointInPolygon(pt.x, pt.y, polygon)) hits++;
  }
  return hits >= 2; // 2/5 corners bên trong = selected
};

// Tính bounding box của selection
const getSelectionBounds = (
  selectedStrokes: Stroke[],
  selectedShapes: ShapeItem[]
): { x: number; y: number; w: number; h: number } | null => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const s of selectedStrokes) {
    for (const pt of s.points) {
      minX = Math.min(minX, pt.x - s.width / 2);
      minY = Math.min(minY, pt.y - s.width / 2);
      maxX = Math.max(maxX, pt.x + s.width / 2);
      maxY = Math.max(maxY, pt.y + s.width / 2);
    }
  }
  for (const sh of selectedShapes) {
    minX = Math.min(minX, sh.x);
    minY = Math.min(minY, sh.y);
    maxX = Math.max(maxX, sh.x + sh.width);
    maxY = Math.max(maxY, sh.y + sh.height);
  }

  if (minX === Infinity) return null;
  return { x: minX - 4, y: minY - 4, w: maxX - minX + 8, h: maxY - minY + 8 };
};

interface CanvasDrawLayerProps {
  docId: string;
}

export const CanvasDrawLayer: React.FC<CanvasDrawLayerProps> = ({ docId }) => {
  const {
    drawTool, drawColor, drawWidth, shapeType,
    addStroke, removeStrokeAt, addShape,
    moveStrokes, moveShapes, removeStrokes, removeShapes
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

  // === Lasso state ===
  const [lassoPoints, setLassoPoints] = useState<{ x: number; y: number }[]>([]);
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<Set<string>>(new Set());
  const [selectedShapeIds, setSelectedShapeIds] = useState<Set<string>>(new Set());
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const dragSelStartRef = useRef<{ x: number; y: number } | null>(null);
  const isLassoDrawing = useRef(false);

  const isDrawingMode = ['pen', 'highlighter', 'eraser', 'shape'].includes(drawTool);
  const isLassoMode = drawTool === 'lasso';
  const hasSelection = selectedStrokeIds.size > 0 || selectedShapeIds.size > 0;

  // Clear selection khi chuyển tool
  useEffect(() => {
    if (drawTool !== 'lasso') {
      setSelectedStrokeIds(new Set());
      setSelectedShapeIds(new Set());
      setLassoPoints([]);
    }
  }, [drawTool]);

  // Keyboard: Delete/Backspace xóa selection
  useEffect(() => {
    if (!isLassoMode) return;
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && hasSelection) {
        e.preventDefault();
        if (selectedStrokeIds.size > 0) removeStrokes(docId, Array.from(selectedStrokeIds));
        if (selectedShapeIds.size > 0) removeShapes(docId, Array.from(selectedShapeIds));
        setSelectedStrokeIds(new Set());
        setSelectedShapeIds(new Set());
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLassoMode, hasSelection, selectedStrokeIds, selectedShapeIds, docId, removeStrokes, removeShapes]);

  const getSVGCoords = (e: React.PointerEvent): { x: number; y: number } => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pageData.panX) / pageData.zoom,
      y: (e.clientY - rect.top - pageData.panY) / pageData.zoom,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!svgRef.current) return;
    if (e.button === 1) return;
    const { x, y } = getSVGCoords(e);

    // === LASSO MODE ===
    if (isLassoMode) {
      e.currentTarget.setPointerCapture(e.pointerId);

      // Nếu đã có selection, kiểm tra xem click vào vùng selection không -> drag
      if (hasSelection) {
        const selStrokes = strokes.filter(s => selectedStrokeIds.has(s.id));
        const selShapes = shapes.filter(s => selectedShapeIds.has(s.id));
        const bounds = getSelectionBounds(selStrokes, selShapes);
        if (bounds && x >= bounds.x && x <= bounds.x + bounds.w && y >= bounds.y && y <= bounds.y + bounds.h) {
          // Bắt đầu drag selection
          setIsDraggingSelection(true);
          dragSelStartRef.current = { x, y };
          return;
        }
        // Click ngoài selection -> clear
        setSelectedStrokeIds(new Set());
        setSelectedShapeIds(new Set());
      }

      // Bắt đầu vẽ lasso
      isLassoDrawing.current = true;
      setLassoPoints([{ x, y }]);
      return;
    }

    // === DRAW MODES ===
    if (!isDrawingMode) return;
    e.currentTarget.setPointerCapture(e.pointerId);

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
    if (!svgRef.current) return;
    if (e.buttons !== 1) return;
    const { x, y } = getSVGCoords(e);

    // === LASSO MODE ===
    if (isLassoMode) {
      if (isDraggingSelection && dragSelStartRef.current) {
        const dx = x - dragSelStartRef.current.x;
        const dy = y - dragSelStartRef.current.y;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          if (selectedStrokeIds.size > 0) moveStrokes(docId, Array.from(selectedStrokeIds), dx, dy);
          if (selectedShapeIds.size > 0) moveShapes(docId, Array.from(selectedShapeIds), dx, dy);
          dragSelStartRef.current = { x, y };
        }
        return;
      }
      if (isLassoDrawing.current) {
        setLassoPoints(prev => [...prev, { x, y }]);
      }
      return;
    }

    // === DRAW MODES ===
    if (!isDrawingMode) return;

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
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}

    // === LASSO MODE ===
    if (isLassoMode) {
      if (isDraggingSelection) {
        // Kết thúc drag — lưu history 1 lần
        useCanvasStore.getState().saveHistory(docId);
        setIsDraggingSelection(false);
        dragSelStartRef.current = null;
        return;
      }
      if (isLassoDrawing.current && lassoPoints.length > 5) {
        // Hoàn thành lasso → tìm items trong vùng chọn
        const newStrokeIds = new Set<string>();
        const newShapeIds = new Set<string>();
        for (const s of strokes) {
          if (isStrokeInLasso(s, lassoPoints)) newStrokeIds.add(s.id);
        }
        for (const sh of shapes) {
          if (isShapeInLasso(sh, lassoPoints)) newShapeIds.add(sh.id);
        }
        setSelectedStrokeIds(newStrokeIds);
        setSelectedShapeIds(newShapeIds);
      }
      setLassoPoints([]);
      isLassoDrawing.current = false;
      return;
    }

    // === DRAW MODES ===
    if (!isDrawingMode) return;

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

  const renderStroke = (points: StrokePoint[], color: string, width: number, type: 'pen' | 'highlighter', key: string, highlight = false) => {
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
        fill={highlight ? '#3b82f6' : color}
        opacity={type === 'highlighter' ? 0.4 : (highlight ? 0.6 : 1)}
        style={{ pointerEvents: 'none', mixBlendMode: type === 'highlighter' ? 'multiply' : 'normal' }}
      />
    );
  };

  // Cursor based on tool
  const getCursor = () => {
    if (drawTool === 'eraser') return 'cell';
    if (drawTool === 'shape') return 'crosshair';
    if (drawTool === 'pen' || drawTool === 'highlighter') return 'crosshair';
    if (drawTool === 'lasso') {
      if (isDraggingSelection) return 'move';
      if (hasSelection) return 'move';
      return 'crosshair';
    }
    return 'default';
  };

  // Selection bounding box
  const selStrokes = strokes.filter(s => selectedStrokeIds.has(s.id));
  const selShapes = shapes.filter(s => selectedShapeIds.has(s.id));
  const selectionBounds = hasSelection ? getSelectionBounds(selStrokes, selShapes) : null;

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: (isDrawingMode || isLassoMode) ? 'auto' : 'none',
        zIndex: (isDrawingMode || isLassoMode) ? 50 : 0,
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
        {strokes.map(s => renderStroke(
          s.points, s.color, s.width, s.type, s.id,
          selectedStrokeIds.has(s.id)
        ))}

        {/* Render shapes */}
        {shapes.map(shape => renderShapeElement(shape, selectedShapeIds.has(shape.id)))}

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

        {/* === LASSO UI === */}
        {/* Lasso drawing path (dashed blue line) */}
        {lassoPoints.length > 1 && (
          <polyline
            points={lassoPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="rgba(59, 130, 246, 0.08)"
            stroke="#3b82f6"
            strokeWidth={1.5 / pageData.zoom}
            strokeDasharray={`${4 / pageData.zoom} ${3 / pageData.zoom}`}
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Selection bounding box */}
        {selectionBounds && (
          <>
            <rect
              x={selectionBounds.x}
              y={selectionBounds.y}
              width={selectionBounds.w}
              height={selectionBounds.h}
              fill="rgba(59, 130, 246, 0.06)"
              stroke="#3b82f6"
              strokeWidth={1.5 / pageData.zoom}
              strokeDasharray={`${5 / pageData.zoom} ${3 / pageData.zoom}`}
              rx={3 / pageData.zoom}
              style={{ pointerEvents: 'none' }}
            />
            {/* Corner handles */}
            {[
              { cx: selectionBounds.x, cy: selectionBounds.y },
              { cx: selectionBounds.x + selectionBounds.w, cy: selectionBounds.y },
              { cx: selectionBounds.x, cy: selectionBounds.y + selectionBounds.h },
              { cx: selectionBounds.x + selectionBounds.w, cy: selectionBounds.y + selectionBounds.h },
            ].map((handle, i) => (
              <circle
                key={`handle-${i}`}
                cx={handle.cx}
                cy={handle.cy}
                r={4 / pageData.zoom}
                fill="#fff"
                stroke="#3b82f6"
                strokeWidth={1.5 / pageData.zoom}
                style={{ pointerEvents: 'none' }}
              />
            ))}
          </>
        )}
      </g>
    </svg>
  );
};
