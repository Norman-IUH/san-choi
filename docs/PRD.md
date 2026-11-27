# Sân Chơi

Sân Chơi là workspace dạy tiếng Anh của một giáo viên thiếu nhi. Học liệu phục vụ Kids, Pre A1 Starters, A1 Movers và A2 Flyers. Giáo viên tạo trò chơi, lưu và đổi mẫu trong thư viện riêng, giao bài bằng link hoặc QR, rồi xem tiến độ và điểm theo lớp. Học sinh chơi từ trình duyệt trên điện thoại, tablet hoặc màn hình lớp học, không cần tài khoản.

## Vai trò và dữ liệu

Production dùng một tài khoản giáo viên do chủ hệ thống tạo trước. Supabase Auth giữ phiên bằng cookie. RLS kiểm soát quyền sở hữu ở database. Production tắt đăng ký công khai và Google OAuth. Development giữ các tài khoản thử nghiệm để kiểm tra cách ly. Link bài giao có phạm vi riêng và nội dung được chụp tại lúc giao. Tệp của giáo viên nằm trong Storage riêng tư, học sinh nhận link đọc có thời hạn thông qua hoạt động có quyền truy cập.

## Công việc chính

- **Soạn học liệu** theo cấp độ, kỹ năng, khóa, unit và bài. Tái dùng từ, nghĩa tiếng Việt, IPA, ví dụ, ảnh và audio Anh–Anh/Anh–Mỹ giữa các trò. Cho phép nhập CSV/XLSX và soạn thủ công khi chưa cấu hình AI.
- **Chơi và giao bài** với 34 mẫu có luật và giao diện riêng, preview, fullscreen, phản hồi và kết quả. Hỗ trợ chuột, chạm, bàn phím và giảm chuyển động. Giữ cấu trúc Class và Student riêng với biệt danh chơi công khai.
- **Dạy và theo dõi** qua tài liệu luyện gốc, PDF/đáp án, CSV/XLSX, đọc kết quả theo học sinh/lớp và luyện Cambridge theo format chính thức. Giáo viên chấm chủ động phần nói và viết.
- **Vận hành** qua HTTPS trên hosting Next.js, backend cloud và project production riêng để dữ liệu thử nghiệm nằm ở development. Giữ khả năng phục hồi bằng backup và rollback.

Cộng đồng nhiều giáo viên, Admin Dashboard, đăng ký công khai, thuê bao và billing nằm ngoài phạm vi sản phẩm cá nhân. Các route cũ có thể tiếp tục tồn tại khi vẫn có ích. Tham chiếu chức năng từ [Wordwall Features](https://wordwall.net/features). Chỉ dùng học liệu gốc hoặc được cấp quyền và không tuyên bố kết quả nội bộ là chứng nhận Cambridge.

## V1.5A — Thư viện học liệu tiếng Anh

Giáo viên có thể chọn cấp độ, chủ đề và từ, lưu thành bài học theo unit và kỹ năng, rồi xem trước mẫu tương thích. Bản soạn có thể tùy chỉnh trong editor hiện có trước khi giáo viên xuất bản hoặc giao. Một lesson lưu tham chiếu đến nguồn từ vựng và tập hợp nhiều hoạt động. Bài đã giao giữ bản chụp nội dung để điểm cũ vẫn nhất quán khi nguồn thay đổi.

Thư viện khởi đầu có 440 mục theo bốn nhóm nội bộ. Mỗi cấp độ có một bài mở đầu năm từ kèm ví dụ, IPA và audio tổng hợp Anh–Anh, Anh–Mỹ. Giáo viên có thể nhập CSV hoặc XLSX, sửa từ riêng, cập nhật cấp độ và chủ đề hàng loạt, và tải CSV dữ liệu chữ. Dữ liệu đa phương tiện lưu qua Storage hiện có.

Tên cấp độ dùng để hỗ trợ giáo viên tổ chức bài. V1.5A chưa có đề luyện theo phần thi, rubric hay chấm thủ công. V1.5B và V1.5C cần nghiệm thu riêng, gồm đối chiếu đặc tả Cambridge chính thức trước khi soạn bài luyện theo kỳ thi.
