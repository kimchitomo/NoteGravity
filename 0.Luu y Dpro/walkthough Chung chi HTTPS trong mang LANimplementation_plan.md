# Hướng Dẫn Kích Hoạt `NoteAntigravity.com` Trên Điện Thoại

Hệ thống máy chủ DNS và chứng chỉ bảo mật đa năng đã được cài đặt thành công trên máy tính của bạn. Dưới đây là các bước để điện thoại của bạn có thể truy cập và sử dụng được tính năng Micro.

## Phần 1: Cài Đặt Chứng Chỉ CA (Chỉ làm 1 lần duy nhất)

> [!IMPORTANT]
> Chứng chỉ này là chìa khóa vạn năng. Khi bạn đi sang mạng Wi-Fi khác, bạn **KHÔNG CẦN** làm lại phần 1 này.

**Bước 1:** Kết nối điện thoại vào **cùng một mạng Wi-Fi** với máy tính.
**Bước 2:** Mở trình duyệt web (Safari/Chrome) trên điện thoại và truy cập địa chỉ IP hiện tại của máy tính: 
👉 `http://192.168.0.194:5173/rootCA.pem`
*(Lưu ý gõ đúng `http://` chứ không phải `https://`)*

**Bước 3: Tải và cài đặt Profile (Dành cho iOS/iPhone)**
1. Safari sẽ hỏi: *"Trang web này đang cố gắng tải về một hồ sơ cấu hình..."* -> Bấm **Cho phép (Allow)**.
2. Mở ứng dụng **Cài đặt (Settings)** trên iPhone.
3. Ngay trên cùng sẽ có mục **Đã tải về hồ sơ (Profile Downloaded)** -> Bấm vào đó.
4. Bấm **Cài đặt (Install)** ở góc trên bên phải và nhập mật khẩu mở khóa màn hình.

**Bước 4: Bật "Tin Cậy" Chứng Chỉ (Dành cho iOS/iPhone)**
Đây là bước quan trọng nhất mà mọi người hay quên:
1. Vào **Cài đặt (Settings)** -> **Cài đặt chung (General)** -> **Giới thiệu (About)**.
2. Kéo xuống tận cùng dưới đáy, chọn **Cài đặt tin cậy chứng chỉ (Certificate Trust Settings)**.
3. Dưới mục *Enable full trust for root certificates*, bạn sẽ thấy chứng chỉ có tên `mkcert...` -> **BẬT công tắc màu xanh lên**. Bấm *Continue* để xác nhận.

*(Đối với Android: Tải file về -> Mở file -> Đặt tên chứng chỉ là NoteGravity -> Chọn "VPN and apps" -> OK)*

---

## Phần 2: Cài Đặt DNS (Làm mỗi khi kết nối Wi-Fi mới)

> [!NOTE]
> Mỗi khi máy tính bạn kết nối vào một mạng Wi-Fi khác (quán cafe, công ty), IP máy tính sẽ bị đổi (ví dụ từ `192.168...` sang `10.0...`). Máy chủ trên máy tính sẽ tự động nhận diện IP mới này. Việc của bạn chỉ là cập nhật IP mới đó vào DNS của điện thoại.

1. Vào **Cài đặt (Settings)** -> **Wi-Fi** trên điện thoại.
2. Bấm vào biểu tượng chữ **(i)** màu xanh bên cạnh tên mạng Wi-Fi đang kết nối.
3. Kéo xuống phần **Định cấu hình DNS (Configure DNS)**.
4. Chọn **Thủ công (Manual)**.
5. Xóa các máy chủ DNS cũ đi (như `8.8.8.8` hoặc `192.168.1.1`).
6. Thêm một máy chủ mới và nhập IP của máy tính vào (Hiện tại đang là `192.168.0.194`).
7. Bấm **Lưu (Save)**.

---

## Tận Hưởng Thành Quả! 🎉

Sau khi làm xong 2 phần trên, hãy mở Safari/Chrome và truy cập:
👉 **`https://noteantigravity.com:5173`**

Bạn sẽ thấy biểu tượng **ổ khóa xanh bảo mật** xuất hiện, và tính năng Giọng Nói (Microphone) sẽ hoạt động hoàn hảo mà không bị chặn!
