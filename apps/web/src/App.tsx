import React from 'react';
import { WorkspaceLayout } from './layouts/WorkspaceLayout';
import { useTreeStore, initAsrWorker } from './store/useTreeStore';
import { useEffect } from 'react';

function App() {
  const offlineAsrDevice = useTreeStore(state => state.offlineAsrDevice);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.onLine) {
      initAsrWorker(offlineAsrDevice);
    }
  }, [offlineAsrDevice]);

  return (
    <div className="app-container">
      <WorkspaceLayout />
    </div>
  );
}

export default App;
