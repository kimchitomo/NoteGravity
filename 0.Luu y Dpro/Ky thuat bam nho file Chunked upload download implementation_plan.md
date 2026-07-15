# Kế hoạch triển khai: Cross-OS Real-time Sync & Single Container

Để giải quyết triệt để bài toán đồng bộ các file dung lượng khổng lồ (Video, Excel, PDF...) giữa các hệ điều hành (OS) khác nhau qua WebSockets mà vẫn đảm bảo tốc độ cực cao và lưu cục bộ, chúng ta cần một **cơ chế Đồng bộ File đặc thù (Chunked Stream Sync)**.

Dưới đây là kiến trúc đã được làm lại hoàn toàn ở tầng xử lý Dữ liệu để đáp ứng chính xác bài toán của bạn.

## 1. Cơ chế Lưu trữ Đa Nền Tảng (Cross-OS Client Storage)
Vì ứng dụng chạy trên nhiều hệ điều hành (iOS, Android, Windows, macOS...), chúng ta không thể can thiệp vào File System gốc của thiết bị. Giải pháp duy nhất và mạnh mẽ nhất mà mọi trình duyệt/OS đều hỗ trợ là **IndexedDB**.
- **Cách làm**: Khi người dùng thả 1 file Video 1GB vào ghi chú, ứng dụng sẽ lưu file đó dưới dạng `Blob` (dữ liệu thô nguyên bản) trực tiếp vào `IndexedDB` của trình duyệt. 
- **Tốc độ**: Truy xuất từ IndexedDB diễn ra ngay lập tức. Ghi chú chứa Video sẽ play mượt mà ngay cả khi ngắt mạng (Local-First).

## 2. Giải thuật Đồng bộ File Tốc độ cao qua WebSockets (Chunked Stream)
Nếu gửi một cục Video 1GB qua WebSocket ngay lập tức, trình duyệt sẽ bị "đơ" và Server sẽ sập bộ nhớ. Chúng ta sẽ áp dụng giải thuật **WebSocket Chunking**:

- **Băm nhỏ File (Chunking)**: Client sẽ dùng `FileReader API` cắt file Video ra thành hàng nghìn mảnh nhỏ (ví dụ: mỗi mảnh 1MB).
- **Gửi qua WebSocket**: Client liên tục đẩy các mảnh 1MB này qua WebSocket. Quá trình này không làm kẹt băng thông, diễn ra âm thầm (Background Sync).
- **Phía Server**: Server nhận các mảnh 1MB và ghi nối tiếp (append) thẳng vào ổ cứng. Khi nhận đủ 100% các mảnh, Server xác nhận file đã hoàn chỉnh.

## 3. Cơ chế Broadcast & Cập nhật Local Storage
Khi File đã nằm an toàn trên Server, luồng Broadcast sẽ hoạt động theo chuẩn sau để không làm chết mạng của các thiết bị khác:

- **Bước 1 (Broadcast Metadata)**: Server phát (broadcast) một thông điệp WebSocket nhỏ cho TẤT CẢ các thiết bị: *"Có một file Video mới được thêm vào, ID là XYZ"*.
- **Bước 2 (Background Download)**: Các thiết bị đang kết nối (điện thoại iOS, máy tính Win) nhận được thông báo sẽ tự động gửi yêu cầu: *"Hãy truyền file XYZ qua WebSocket cho tôi"*.
- **Bước 3 (Truyền ngược Chunking)**: Server bắt đầu chẻ file XYZ ra thành các mảnh nhỏ 1MB và truyền qua WebSockets về cho các máy con.
- **Bước 4 (Cập nhật Local Storage)**: Máy con nhận đủ các mảnh, ráp lại thành `Blob` và ghi đè vào `IndexedDB` (Local Storage) của nó.
- **Hoàn tất**: Người dùng ở máy con sẽ đột nhiên thấy Video xuất hiện trên ghi chú của họ một cách mượt mà.

## 4. Đóng gói Container & Backup

Cấu trúc vẫn được giữ nguyên tính di động tuyệt đối:
- **1 Docker Container**: Chứa Frontend, Node.js WebSocket Server.
- **Dữ liệu**: Nằm gọn trong thư mục `/data` (bao gồm file `.db` chứa văn bản/metadata và các mảnh file Video/PDF).
- **Tự động sao lưu**: Hệ thống tự động dùng **Rclone** nén toàn bộ thư mục `/data` theo lịch trình, đẩy sang FTP, LAN, hoặc Cloud Storage.

## User Review Required

> [!IMPORTANT]
> Phương án **"Băm nhỏ file (Chunking) truyền qua WebSockets và ráp lại vào IndexedDB"** là kỹ thuật tối thượng mà các app nhắn tin/cộng tác đa nền tảng (như Telegram Web, WhatsApp) dùng để truyền file lớn siêu tốc mà không làm giật ứng dụng.
> 
> Bạn đánh giá giải pháp này đã giải quyết triệt để vấn đề về tốc độ và sự khác biệt OS của bạn chưa? Hãy nhấn **Proceed** nếu bạn đồng ý nhé!
