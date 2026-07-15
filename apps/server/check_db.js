const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('c:/Users/Admin/Desktop/NoteAntiGravity/apps/data/database.sqlite');

// Check how much data is on server
db.all("SELECT key, LENGTH(value) as len FROM state WHERE key IN ('tree-store', 'canvas-storage', 'workspace-storage', 'history-store') ORDER BY len DESC", (err, rows) => {
  if (err) { console.error(err); }
  else {
    console.log('Server state data:');
    rows.forEach(r => console.log(`  ${r.key}: ${(r.len / 1024).toFixed(1)} KB`));
  }

  // Count note-content entries  
  db.get("SELECT COUNT(*) as cnt FROM state WHERE key LIKE 'note-content-%'", (err2, row2) => {
    if (!err2) console.log(`  note-content entries: ${row2.cnt}`);
    
    // Check tree-store to count notes
    db.get("SELECT value FROM state WHERE key = 'tree-store'", (err3, row3) => {
      if (!err3 && row3) {
        try {
          const tree = JSON.parse(row3.value);
          if (tree.state && tree.state.data) {
            const countNodes = (nodes) => {
              let count = 0;
              for (const n of nodes) {
                count++;
                if (n.children) count += countNodes(n.children);
              }
              return count;
            };
            console.log(`  tree nodes: ${countNodes(tree.state.data)}`);
          }
        } catch (e) { console.error(e.message); }
      }
      db.close();
    });
  });
});
