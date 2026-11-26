# Kiến trúc

Next.js App Router xử lý UI và các lệnh server. React quản lý trình soạn và trạng thái phiên chơi. Supabase Auth xác thực, PostgreSQL cấp quyền qua RLS. Server lắp dữ liệu cho người chơi và chấm từ snapshot riêng. Bí mật server nằm trong biến môi trường.

Nội dung có phiên bản và định danh activity ổn định. Chuyển mẫu chỉ được phép khi cấu trúc đích giữ toàn bộ nội dung. Phaser dùng riêng cho các trò cần vòng lặp thời gian thực trong giai đoạn arcade. Realtime dùng cho phòng trực tiếp và tách khỏi bài giao bất đồng bộ.

Trạng thái phiên: vào link, bắt đầu, trả lời, nộp, hiển thị kết quả. Khóa idempotency và ràng buộc database chống ghi trùng. Nhật ký vận hành dùng logging server có cấu trúc và tránh ghi bài làm, địa chỉ email hoặc mật khẩu.
