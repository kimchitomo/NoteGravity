import React from 'react';
import { WorkspaceLayout } from './layouts/WorkspaceLayout';
import { useTreeStore, initAsrWorker } from './store/useTreeStore';
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

  return (
    <div className="app-container">
      <ErrorBoundary>
        <WorkspaceLayout />
      </ErrorBoundary>
    </div>
  );
}

export default App;
