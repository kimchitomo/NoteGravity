# Task Tracker: Hệ thống Đồng bộ NoteAntiGravity

Tiến độ thực hiện các hạng mục trong Kế hoạch Kiến trúc:

- `[x]` Khởi tạo Backend Server (`apps/server`)
  - `[x]` Tạo package.json và cài đặt các thư viện (Express, Socket.io, SQLite3).
  - `[x]` Fix infinite synchronization loop causing extreme lag and UI flickering
  - `[x]` Fix context menu text reader skipping unfocused note contents on mobile
  - `[x]` Fix immersive reader requiring manual selection of frames on mobile
  - `[x]` Implement `external-note-update` listener in TipTap to reflect live collaborative changes
  - `[x]` Re-enable auto-sync recovery logic for offline/backgrounded mobile clients
- `[x]` Cập nhật cấu hình Docker & Sao lưu (DevOps)
  - `[x]` Viết Dockerfile Multi-stage (Build Web + Chạy Server).
  - `[x]` Cấu hình Docker Compose mount volume `/data`.
  - `[x]` Viết script cấu hình rclone và cron cho tự động Backup.
- `[/]` Nâng cấp Frontend - Tầng Dữ liệu (`apps/web`)
  - `[x]` Tích hợp Socket.io client vào Zustand.
  - `[x]` Tích hợp IndexedDB (localforage) cho file dung lượng lớn.
  - `[x]` Viết thuật toán băm file (Chunking) và Background Download qua WebSockets.
- `[x]` Nâng cấp Frontend - Trải nghiệm Người dùng (`apps/web`)
  - `[x]` Cấu hình PWA (manifest, service worker) để có thể Install như app Native.
  - `[x]` Xây dựng luồng Đồng bộ lần đầu (Initial Sync) khi có máy mới.
  - `[x]` Xây dựng nền tảng Widget Dashboard có khả năng lưu cục bộ theo Grid Layout.
