# Tên Miền Nội Bộ & Chứng Chỉ SSL Hợp Lệ Cho NoteGravity

Kế hoạch này thực hiện yêu cầu tạo tên miền ảo `NoteAntigravity.com` hoạt động độc quyền trong mạng LAN của bạn, đồng thời thỏa mãn hoàn toàn các yêu cầu khắt khe về HTTPS của hệ điều hành iOS/Android để tính năng Giọng Nói (Microphone) hoạt động được.

## Yêu Cầu Xem Xét Từ Người Dùng

> [!WARNING]
> Quá trình này bắt buộc bạn phải cấu hình thủ công trên điện thoại sau khi máy chủ chạy xong.
> Bạn cần phải làm theo đúng các bước hướng dẫn sắp tới để:
> 1. Tải và Cài đặt Cấu hình Chứng Chỉ Gốc (Custom Root CA) vào điện thoại.
> 2. Kích hoạt tính năng "Tin cậy" chứng chỉ này sâu bên trong cài đặt hệ điều hành (Đặc biệt trên iOS).
> 3. Thay đổi máy chủ DNS của kết nối Wi-Fi trên điện thoại trỏ về máy tính này (`192.168.0.194`).

## Câu Hỏi Mở

Không có. Chúng ta đã sẵn sàng bắt tay vào lập trình nếu bạn đồng ý thực hiện các bước cấu hình thủ công trên điện thoại.

## Các Thay Đổi Đề Xuất

Chúng ta sẽ xây dựng một hệ thống mạng nội bộ mô phỏng lại hoàn toàn cách mạng Internet thật hoạt động:

### Máy Chủ DNS Nội Bộ
Tạo một máy chủ DNS cực nhẹ bằng Node.js chạy ngầm trên máy tính.
- Máy chủ này sẽ lắng nghe ở cổng (port) 53.
- Khi điện thoại của bạn hỏi: "IP của NoteAntigravity.com là gì?", nó sẽ trả lời là `192.168.0.194`.
- Đối với tất cả các trang web khác (Facebook, Google...), nó sẽ chuyển tiếp câu hỏi lên máy chủ DNS chuẩn (8.8.8.8) để điện thoại của bạn vẫn lướt web bình thường.

#### [NEW] [dns-server.js](file:///c:/Users/Admin/Desktop/NoteAntiGravity/apps/web/dns-server.js)
Mã nguồn cho máy chủ DNS sử dụng thư viện `dns2`.

### Cơ Quan Cấp Chứng Chỉ (Root CA) Tự Chế
Chúng ta sẽ sử dụng công cụ `mkcert` để tạo ra một "Tổ chức cấp chứng chỉ gốc" giả lập ngay trên máy tính của bạn, sau đó dùng nó để ký và cấp phát một chứng chỉ SSL hợp lệ cho tên miền `NoteAntigravity.com` và IP `192.168.0.194`.

#### [MODIFY] [vite.config.ts](file:///c:/Users/Admin/Desktop/NoteAntiGravity/apps/web/vite.config.ts)
Gỡ bỏ plugin `@vitejs/plugin-basic-ssl` và cấu hình Vite để sử dụng cặp khóa/chứng chỉ CA mà chúng ta vừa tạo ra bằng `mkcert`.

### Phân Phối Chứng Chỉ Gốc Cho Điện Thoại
File chứng chỉ gốc `rootCA.pem` sẽ được nhúng thẳng vào thư mục `public` của trang web. Nhờ đó, bạn chỉ cần mở một đường link trên điện thoại là có thể tải ngay file chứng chỉ về máy để cài đặt.

## Kế Hoạch Xác Minh

Sau khi mình cài đặt mã nguồn xong, mình sẽ gửi cho bạn một bài Hướng Dẫn chi tiết từng bước (Walkthrough) để:
1. Tải profile chứng chỉ về iPhone/Android.
2. Cài đặt và "Tin cậy" Chứng chỉ gốc.
3. Chỉnh sửa DNS mạng Wi-Fi trên điện thoại.
4. Cuối cùng, truy cập `https://NoteAntigravity.com:5173` với biểu tượng ổ khóa xanh lá cây an toàn tuyệt đối và sử dụng trơn tru tính năng Micro!
