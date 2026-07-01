import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'notebooks',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'parent_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'notes',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'body', type: 'string', isOptional: true }, // Có thể lưu Yjs update/delta
        { name: 'notebook_id', type: 'string', isIndexed: true },
        { name: 'is_pinned', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'attachments',
      columns: [
        { name: 'note_id', type: 'string', isIndexed: true },
        { name: 'file_name', type: 'string' },
        { name: 'file_type', type: 'string' },
        { name: 'file_size', type: 'number' },
        { name: 'url', type: 'string' }, // Có thể lưu Object key của MinIO
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
