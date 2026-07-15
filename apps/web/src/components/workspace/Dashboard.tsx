import React, { useState, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface DashboardWidget {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'stats' | 'calendar' | 'todo' | 'recent';
}

export const Dashboard: React.FC = () => {
  // Load local specific layout from localStorage
  const loadLayout = (): DashboardWidget[] => {
    const saved = localStorage.getItem('noteantigravity-dashboard-layout');
    if (saved) return JSON.parse(saved);
    return [
      { i: '1', x: 0, y: 0, w: 4, h: 2, type: 'stats' },
      { i: '2', x: 4, y: 0, w: 4, h: 4, type: 'calendar' },
      { i: '3', x: 0, y: 2, w: 4, h: 4, type: 'todo' },
      { i: '4', x: 8, y: 0, w: 4, h: 6, type: 'recent' }
    ];
  };

  const [layout, setLayout] = useState<DashboardWidget[]>(loadLayout());

  const handleLayoutChange = (newLayout: any) => {
    const updatedLayout = newLayout.map((l: any) => {
      const existing = layout.find(old => old.i === l.i);
      return { ...l, type: existing?.type || 'stats' };
    });
    setLayout(updatedLayout);
    // Save to local device explicitly
    localStorage.setItem('noteantigravity-dashboard-layout', JSON.stringify(updatedLayout));
  };

  const renderWidgetContent = (type: string) => {
    switch(type) {
      case 'stats':
        return <div className="p-4 bg-blue-50 h-full rounded-lg shadow-sm border border-blue-100"><h3 className="font-bold text-blue-800">Thống kê</h3><p className="text-2xl mt-2">12 Ghi chú</p></div>;
      case 'calendar':
        return <div className="p-4 bg-green-50 h-full rounded-lg shadow-sm border border-green-100"><h3 className="font-bold text-green-800">Lịch làm việc</h3><div className="mt-4 text-gray-500">Hôm nay không có sự kiện</div></div>;
      case 'todo':
        return <div className="p-4 bg-yellow-50 h-full rounded-lg shadow-sm border border-yellow-100"><h3 className="font-bold text-yellow-800">To-do List</h3><ul className="mt-2 list-disc pl-5"><li>Hoàn thành hệ thống Sync</li><li>Cấu hình Docker</li></ul></div>;
      case 'recent':
        return <div className="p-4 bg-purple-50 h-full rounded-lg shadow-sm border border-purple-100"><h3 className="font-bold text-purple-800">Truy cập gần đây</h3><div className="mt-2 space-y-2"><div className="p-2 bg-white rounded border">Kế hoạch triển khai.md</div><div className="p-2 bg-white rounded border">Video Demo.mp4</div></div></div>;
      default:
        return <div>Widget</div>;
    }
  };

  return (
    <div className="dashboard-container p-6 w-full h-full overflow-auto bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Không gian làm việc của tôi</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition">Thêm Widget</button>
      </div>
      
      {(() => {
        const ActualGridLayout = (GridLayout as any).default || GridLayout;
        return (
          <ActualGridLayout 
            className="layout" 
            layout={layout} 
            cols={12} 
            rowHeight={50} 
            width={1200}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".widget-drag-handle"
          >
            {layout.map(item => (
              <div key={item.i} className="bg-white rounded-lg shadow-sm relative group overflow-hidden">
                <div className="widget-drag-handle absolute top-0 left-0 w-full h-6 bg-gray-200 opacity-0 group-hover:opacity-100 cursor-move transition-opacity flex items-center justify-center">
                  <span className="text-xs text-gray-500">Kéo thả để di chuyển</span>
                </div>
                <div className="w-full h-full pt-2">
                  {renderWidgetContent(item.type)}
                </div>
              </div>
            ))}
          </ActualGridLayout>
        );
      })()}
    </div>
  );
};
