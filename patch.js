const fs = require('fs');
const path = 'apps/web/src/store/useTreeStore.ts';
let content = fs.readFileSync(path, 'utf8');

const mutationsToPatch = [
  'addRootNode', 'addImportedNodes', 'addNode', 'deleteNode', 'hideNode', 'unhideNode',
  'renameNode', 'updateNodeIcon', 'numberChildNotes', 'pasteFromClipboard',
  'moveNodeUp', 'moveNodeDown', 'moveNodeTo', 'moveNodeBefore', 'moveNodeAfter',
  'moveNodesTo', 'moveNodesBefore', 'moveNodesAfter', 'copyNodeTo', 'copyNodesTo', 'duplicateNode'
];

mutationsToPatch.forEach(m => {
  const regex1 = new RegExp(`\\b${m}:\\s*\\((.*?)\\)\\s*=>\\s*set\\(\\(state\\)\\s*=>\\s*\\{`);
  if (regex1.test(content)) {
    content = content.replace(regex1, `${m}: ($1) => {\n    useHistoryStore.getState().captureGlobalSnapshot();\n    return set((state) => {`);
  }
});

fs.writeFileSync(path, content);
console.log('Patched useTreeStore.ts');
