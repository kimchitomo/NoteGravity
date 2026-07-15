# Hướng Dẫn Kích Hoạt `NoteAntigravity.com` Trên Điện Thoại

Hệ thống máy chủ DNS và chứng chỉ bảo mật đa năng đã được cài đặt thành công trên máy tính của bạn. Dưới đây là các bước để điện thoại của bạn có thể truy cập và sử dụng được tính năng Micro.

## Phần 1: Cài Đặt Chứng Chỉ CA (Chỉ làm 1 lần duy nhất)

> [!IMPORTANT]
> Chứng chỉ này là chìa khóa vạn năng. Khi bạn đi sang mạng Wi-Fi khác, bạn **KHÔNG CẦN** làm lại phần 1 này.

**Bước 1:** Kết nối điện thoại vào **cùng một mạng Wi-Fi** với máy tính.
**Bước 2:** Mở trình duyệt web (Safari/Chrome) trên điện thoại và truy cập địa chỉ này: 
👉 `http://192.168.0.194:5173/ca.html`
*(Mình đã tạo hẳn một giao diện có NÚT BẤM TẢI XUỐNG để ép trình duyệt điện thoại phải tải file thay vì đọc chữ).*

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

*(Dành riêng cho Android: KHÔNG bấm trực tiếp vào file tải về, nếu không sẽ báo lỗi "can't install CA certificates...". Bạn hãy làm theo các bước sau)*
1. Mở ứng dụng **Cài đặt (Settings)** trên điện thoại Android của bạn.
2. Bấm vào thanh tìm kiếm ở trên cùng và gõ chữ **Chứng chỉ (Certificate)** hoặc **Thông tin xác thực (Credential)**.
3. Chọn mục **Cài đặt chứng chỉ (Install a certificate)** -> Chọn tiếp **Chứng chỉ CA (CA certificate)**.
4. Một cảnh báo bảo mật nguy hiểm sẽ hiện ra. Đừng lo lắng, hãy bấm **Vẫn cài đặt (Install anyway)**.
5. Máy sẽ mở trình quản lý file. Bạn tìm đến thư mục *Tải xuống (Downloads)* và chọn file `NoteGravity-RootCA.crt` vừa tải về lúc nãy.
6. Điện thoại sẽ báo "Đã cài đặt chứng chỉ CA". (Nếu máy bắt đặt tên, hãy nhập "NoteGravity" rồi ấn OK).
7. Xong!

---

dành cho PC: Ran command: `.\mkcert.exe -install`
Used tool: manage_task

Nếu ý bạn là muốn cài đặt chứng chỉ này lên **chính chiếc máy tính mà chúng ta đang dùng để code này**:
Mình vừa mới chạy một dòng lệnh tự động chèn chứng chỉ vào nhân của Windows rồi đấy!
👉 Bạn hãy nhìn lên màn hình máy tính, sẽ có một bảng thông báo bảo mật **User Account Control (UAC)** màu vàng hiện ra hỏi *"Do you want to allow this app to make changes..."* hoặc một bảng hỏi cài đặt Certificate. Bạn chỉ cần bấm **"Yes"** (hoặc **"OK"**) là máy tính này sẽ tự động tin cậy trang web vĩnh viễn!

---

Còn nếu ý bạn là muốn mang trang web này sang **một chiếc máy tính Windows khác (ví dụ laptop khác) bắt cùng mạng Wi-Fi**:
Bạn cũng vào trình duyệt của máy đó tải file `rootCA.crt` về giống hệt trên điện thoại. Sau khi tải xong, bạn làm như sau:
1. Nhấp đúp chuột vào file `rootCA.crt` vừa tải.
2. Bấm nút **Install Certificate...** (Cài đặt Chứng chỉ).
3. Chọn **Local Machine** (Máy tính cục bộ) hoặc **Current User** (Người dùng hiện tại) -> Bấm **Next**.
4. Chọn ô thứ hai: **Place all certificates in the following store** (Đặt tất cả chứng chỉ vào kho sau).
5. Bấm **Browse...** (Duyệt) -> Chọn thư mục **Trusted Root Certification Authorities** (Tổ chức phát hành chứng chỉ gốc tin cậy).
6. Bấm **OK** -> **Next** -> **Finish**. Lúc này Windows sẽ hiện thông báo "The import was successful" là xong.

Bạn cài trên điện thoại xong phần 1 chưa, cài đặt xong nhớ báo lại cho mình để mình **Bật lại chức năng bảo mật SSL** nhé!

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
