# Task Tracker: Hệ thống Đồng bộ NoteAntiGravity

Tiến độ thực hiện các hạng mục trong Kế hoạch Kiến trúc:

- `[/]` Khởi tạo Backend Server (`apps/server`)
  - `[x]` Tạo package.json và cài đặt các thư viện (Express, Socket.io, SQLite3).
  - `[/]` Khởi tạo Cấu trúc thư mục (Routes, Database, Sockets).
  - `[ ]` Viết API xử lý Chunked File Stream.
- `[ ]` Cập nhật cấu hình Docker & Sao lưu (DevOps)
  - `[ ]` Viết Dockerfile Multi-stage (Build Web + Chạy Server).
  - `[ ]` Cấu hình Docker Compose mount volume `/data`.
  - `[ ]` Viết script cấu hình rclone và cron cho tự động Backup.
- `[ ]` Nâng cấp Frontend - Tầng Dữ liệu (`apps/web`)
  - `[ ]` Tích hợp Socket.io client vào Zustand.
  - `[ ]` Tích hợp IndexedDB (localforage) cho file dung lượng lớn.
  - `[ ]` Viết thuật toán băm file (Chunking) và Background Download qua WebSockets.
- `[ ]` Nâng cấp Frontend - Trải nghiệm Người dùng (`apps/web`)
  - `[ ]` Cấu hình PWA (manifest, service worker) để có thể Install như app Native.
  - `[ ]` Xây dựng luồng Đồng bộ lần đầu (Initial Sync) khi có máy mới.
  - `[ ]` Xây dựng nền tảng Widget Dashboard có khả năng lưu cục bộ theo Grid Layout.
