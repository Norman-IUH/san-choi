# Phạm vi còn lại

- Đã nghiệm thu luồng giáo viên và học sinh trên QuizStudy development. Còn kiểm tra nhận thư và hoàn tất xác minh khi giáo viên tự đăng ký qua hộp thư thực. [Kết quả kiểm thử](TEST_RESULTS.md).
- Thư viện đã có luồng CRUD, lọc, thư mục cấp con, yêu thích, thùng rác và quyền chia sẻ. Kéo thả, di chuyển hàng loạt, sắp xếp theo lượt dùng và giới hạn dung lượng dữ liệu theo tài khoản còn thiếu.
- Editor đã có form theo cấu trúc, snapshot lịch sử và khôi phục dưới dạng bản nháp. Các phần còn thiếu gồm media, autosave, undo/redo và cấu hình thời gian, âm thanh, độ khó.
- 12 trò cơ bản có demo và test cho luồng chính. Gameshow hỗ trợ nhân đôi điểm một câu. Các điều khiển gameshow nâng cao, feedback từng câu, xác nhận phiên làm khi mất kết nối và bảo toàn câu trả lời chưa nộp qua reload cần bổ sung.
- Bài tập có deadline theo giờ Việt Nam, đặt biệt danh, đóng/mở và tùy chọn hiển thị điểm. Giới hạn lượt, chính sách lưu lượt và nhóm nhận bài còn thiếu.
- Kết quả có số lượt nộp, chi tiết và CSV. Phân tích từng câu/lớp, bảng xếp hạng và XLSX còn thiếu.
- Cộng đồng có danh sách công khai, lọc và mở hoạt động. Like, import bản sao, hồ sơ công khai, báo cáo và kiểm duyệt còn thiếu.
- 22 trò nâng cao, Phaser, Storage, printable/PDF, QR, embed, AI, lớp học, realtime, Admin và kiểm thử tải còn trong backlog. Phân quyền Student/Admin ở mức dữ liệu, giao diện riêng chưa được triển khai.
- V1.1 có giới hạn yêu cầu bắt đầu và nộp bài đã kiểm tra trên PostgreSQL nhúng và QuizStudy. Audit bảo mật toàn hệ thống, thử nghiệm mạng yếu, kiểm thử tải và triển khai production còn chờ.
- Kiểm tra dependency runtime không phát hiện advisory tại thời điểm chạy. ESLint có 7 advisory mức trung bình trong phụ thuộc phát triển gián tiếp.
