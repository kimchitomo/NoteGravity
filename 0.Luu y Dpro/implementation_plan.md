# Kế hoạch triển khai: Kiến trúc Toàn diện cho NoteAntiGravity

Dưới đây là kế hoạch kiến trúc tổng thể đã được kiện toàn với tất cả các lớp công nghệ: Tự động cài đặt (PWA), Đồng bộ tốc độ cao (Chunked WebSockets), Lưu trữ xuyên nền tảng, Backup đa kênh, và mới nhất là Hệ thống Widget tùy biến.

## 1. Tự động Cài đặt Ứng dụng & Dữ liệu (PWA & Initial Sync)
- **Tự động cài Ứng dụng (App Install)**: Thông qua công nghệ Progressive Web App (PWA), khi người dùng truy cập `NoteAntigravity.com` (qua LAN) hoặc `IP_Tailscale:3000` (ngoài LAN), trình duyệt trên iOS/Android/Windows sẽ tự động tải app và gợi ý cài đặt thành một ứng dụng độc lập trên màn hình chính (App Native).
- **Đồng bộ lần đầu (Initial Sync)**: Lần đầu tiên mở app, hệ thống sẽ tự động quét và kéo toàn bộ dữ liệu (Text + Video + PDF...) từ Server về thiết bị và lưu vĩnh viễn ở đó để có thể dùng offline sau này.

## 2. Hệ thống Widget Tùy biến (Customizable Client Widgets)
Sau khi ứng dụng được triển khai lên máy khách, người dùng không chỉ xem ghi chú mà còn có một không gian **Dashboard (Bảng điều khiển) với các Widget tùy biến**:
- **Đa dạng Widget**: Các khối Widget như: Thống kê ghi chú, Lịch, Danh sách công việc (To-do list), Truy cập nhanh file Media, hay Trình phát nhạc/video thu nhỏ.
- **Tùy biến cục bộ (Local Personalization)**: Giao diện (vị trí sắp xếp, kích thước to nhỏ của các Widget) được **lưu riêng rẽ trên từng thiết bị (Client-specific)**. Nghĩa là cùng một kho dữ liệu đồng bộ, nhưng chiếc iPad của bạn có thể xếp Widget kiểu khác, trong khi màn hình PC của bạn lại có layout Widget kiểu khác cho phù hợp với kích thước màn hình.
- **Tương tác kéo thả**: Xây dựng hệ thống lưới (Grid layout) cho phép người dùng tự do Kéo - Thả (Drag & Drop) và kéo giãn kích thước Widget theo ý thích.

## 3. Cơ sở dữ liệu Đa Nền Tảng (Cross-OS Client Storage)
- Sử dụng **IndexedDB** của trình duyệt web làm chuẩn chung để lưu các file dung lượng khổng lồ (Video, PDF) dưới dạng `Blob`. Nhờ vậy ứng dụng hoạt động thống nhất trên hệ sinh thái Apple, Google và Windows mà không gặp rào cản truy cập File System gốc.

## 4. Giải thuật Đồng bộ File Tốc độ cao (Chunked Stream)
- Băm nhỏ các file nặng thành vô số mảnh 1MB và gửi âm thầm qua WebSockets.
- Khi Server nhận đủ dữ liệu, nó sẽ gửi **Broadcast** thông báo. Các máy khách khác sẽ tự động mở luồng **Background Download** để kéo các mảnh file đó về ráp lại, giúp giao diện không bao giờ bị đơ (non-blocking UI).

## 5. Đóng gói Single Container & Backup Tự động
- Tất cả (Node.js Server, PWA Web, cơ sở dữ liệu SQLite và thư mục Media) được nén vào **1 Docker Container duy nhất** với một thư mục Volume `/data` đẩy ra ngoài.
- Tích hợp **Rclone + Cron** chạy ngầm trong Container để tự động nén và đẩy bản sao lưu `/data` ra mạng LAN, qua FTP, ra USB, hoặc đẩy lên Google Drive/OneDrive định kỳ mỗi ngày.

## User Review Required

> [!IMPORTANT]
> Với sự bổ sung **Hệ thống Widget tùy biến cục bộ**, ứng dụng của bạn giờ đây không chỉ là một công cụ đồng bộ ghi chú, mà đã trở thành một **Hệ điều hành cá nhân (Personal OS/Workspace)** thực thụ.
> 
> Bản thiết kế kiến trúc này đã gom đủ tất cả những mảnh ghép hoàn hảo mà bạn hình dung chưa? Nếu mọi thứ đã sẵn sàng, hãy nhấn **Proceed** để chúng ta bắt đầu quá trình code những module đầu tiên nhé!
