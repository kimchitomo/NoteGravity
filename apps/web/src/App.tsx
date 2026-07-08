import React from 'react';
import { WorkspaceLayout } from './layouts/WorkspaceLayout';
import { useTreeStore, initAsrWorker } from './store/useTreeStore';
import { useCanvasStore } from './store/useCanvasStore';
import { useHistoryStore, buildSnapshot } from './store/useHistoryStore';
import { useEffect } from 'react';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red', padding: '20px' }}><h1>React Error</h1><pre>{this.state.error?.stack}</pre></div>;
    }
    return this.props.children;
  }
}

function App() {
  const offlineAsrDevice = useTreeStore(state => state.offlineAsrDevice);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.onLine) {
      initAsrWorker(offlineAsrDevice);
    }
  }, [offlineAsrDevice]);

  // Global Undo/Redo
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Let active inputs handle their own undo/redo natively
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        useHistoryStore.getState().globalUndo();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        useHistoryStore.getState().globalRedo();
      }
    };
    
    const handleCaptureSnapshot = () => {
      useHistoryStore.getState().captureGlobalSnapshot();
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('capture-global-snapshot', handleCaptureSnapshot as EventListener);
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('capture-global-snapshot', handleCaptureSnapshot as EventListener);
    };
  }, []);

  // History Auto-Capture Subscriptions
  useEffect(() => {
    let treeDebounceTimer: any = null;
    let lastSavedTreeData = JSON.parse(JSON.stringify(useTreeStore.getState().data));

    const unsubTree = useTreeStore.subscribe((state, prevState) => {
      if (state.data !== prevState.data) {
        if (useHistoryStore.getState().isTimeTraveling) {
          lastSavedTreeData = JSON.parse(JSON.stringify(state.data));
          return;
        }
        if (treeDebounceTimer) clearTimeout(treeDebounceTimer);
        treeDebounceTimer = setTimeout(() => {
          const snapshot = buildSnapshot();
          snapshot.treeData = lastSavedTreeData;
          useHistoryStore.getState().pushCustomSnapshot(snapshot);
          lastSavedTreeData = JSON.parse(JSON.stringify(state.data));
        }, 500);
      }
    });

    let canvasDebounceTimer: any = null;
    let lastSavedCanvasPages = JSON.parse(JSON.stringify(useCanvasStore.getState().pages));

    const unsubCanvas = useCanvasStore.subscribe((state, prevState) => {
      if (state.pages !== prevState.pages) {
        if (useHistoryStore.getState().isTimeTraveling) {
          lastSavedCanvasPages = JSON.parse(JSON.stringify(state.pages));
          return;
        }
        if (canvasDebounceTimer) clearTimeout(canvasDebounceTimer);
        canvasDebounceTimer = setTimeout(() => {
          const snapshot = buildSnapshot();
          snapshot.canvasPages = lastSavedCanvasPages;
          useHistoryStore.getState().pushCustomSnapshot(snapshot);
          lastSavedCanvasPages = JSON.parse(JSON.stringify(state.pages));
        }, 500);
      }
    });

    return () => {
      unsubTree();
      unsubCanvas();
      if (treeDebounceTimer) clearTimeout(treeDebounceTimer);
      if (canvasDebounceTimer) clearTimeout(canvasDebounceTimer);
    };
  }, []);

  return (
    <div className="app-container">
      <ErrorBoundary>
        <WorkspaceLayout />
      </ErrorBoundary>
    </div>
  );
}

export default App;
