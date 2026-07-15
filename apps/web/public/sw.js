self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.nodeId) {
    const nodeId = event.notification.data.nodeId;
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        // Find an open client (NoteGravity app)
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          if (client.url && 'focus' in client) {
            // Send message to client to play node content
            client.postMessage({ type: 'PLAY_NODE_CONTENT', nodeId: nodeId });
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow('/').then(client => {
            if (client) {
              setTimeout(() => {
                client.postMessage({ type: 'PLAY_NODE_CONTENT', nodeId: nodeId });
              }, 2000);
            }
          });
        }
      })
    );
  }
});
