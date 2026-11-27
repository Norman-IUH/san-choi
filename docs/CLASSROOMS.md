# Lớp học và tiến độ V1.6B

## Lớp và hồ sơ

- Vào **Lớp học** để tạo lớp Kids, Starters, Movers hoặc Flyers. Có thể lưu lịch học, khóa học và ghi chú. Khi nhân bản lớp, tùy chọn giữ danh sách sẽ liên kết lại các hồ sơ hiện có.
- Thêm từng học sinh hoặc nhập CSV/XLSX với một cột `name` hoặc `Họ tên`, tối đa 200 dòng mỗi tệp. Mỗi dòng hợp lệ tạo một ID. Dùng **Hồ sơ học sinh** để tìm hồ sơ cũ và thêm hoặc chuyển lớp. Hai người trùng tên hiển thị thêm phần đầu ID.
- Cấp **Mã tham gia cá nhân** và gửi trực tiếp cho học sinh. Mã chỉ hiện lúc cấp. Cấp lại, thu hồi và lưu trữ vô hiệu hóa mã cũ. Lưu trữ giữ lịch sử. Giáo viên có thể xóa hồ sơ đã lưu trữ bằng xác nhận, gồm dữ liệu lượt làm và rubric gắn với hồ sơ.

## Giao và theo dõi bài

- Dùng **Giao cho** ở hoạt động đã lưu hoặc bước giáo án. Với đề Cambridge, lưu Part hoặc Mock Test vào thư viện rồi giao. Chọn cả lớp hoặc từng học sinh và từ 1 đến 20 lượt làm. Link và QR dùng luồng chia sẻ hiện có.
- Bài giao chụp người nhận và nội dung tại thời điểm tạo. Thêm hoặc chuyển thành viên sau đó không đổi danh sách người nhận của bài đã giao. Lưu trữ lớp ngừng nhận lượt làm mới. Các bài giao qua link ẩn danh giữ cách nhập biệt danh và các kết quả riêng trước đây.
- Học sinh nhập mã cá nhân khi bắt đầu hoặc tiếp tục. Lượt chưa nộp có thể tiếp tục trong cùng thẻ nếu bản nháp còn. Cổng máy chủ kiểm tra người nhận, thời hạn, mã còn hiệu lực và số lượt đã nộp. Kết quả rubric của bài lớp được giáo viên xem và gửi riêng.

## Tiến độ và báo cáo

- **Chưa làm** là chưa tạo lượt làm. **Đang làm** là lượt mới nhất đã bắt đầu và chưa nộp. **Chờ chấm** dùng cho lượt đã nộp cần rubric. Điểm 0 là một điểm đã chấm. Tỷ lệ hoàn thành tính số người nhận đã nộp trên số người nhận, theo từng bài. Điểm trung bình lấy lượt nộp gần nhất của mỗi bài và chỉ tính chỗ đã có điểm, riêng tự động và thủ công.
- Tiến độ kỹ năng và Part hiển thị số câu đúng trên số câu được chấm tự động, kèm số mục cần đánh giá khi phù hợp. Rubric theo bài được tách riêng. Lượt luyện từ và câu hay sai lấy từ các câu đã nộp. Mục cần hỗ trợ dựa vào bài quá hạn chưa nộp hoặc bài có từ ba câu sai.
- Bộ lọc dùng **ngày giao** theo giờ Việt Nam. Lọc kỹ năng chọn các bài chứa kỹ năng đó và giới hạn bảng phân tích câu theo kỹ năng, còn bảng điểm giữ điểm của toàn lượt. Tệp Excel có ba sheet **Danh sách**, **Bảng điểm** và **Tiến độ**. Mở PDF trong trình đọc để in. Bản dành cho phụ huynh yêu cầu chọn một học sinh và không gồm ghi chú riêng.

Hai migration `classroom_roster` và `classroom_assignments` giữ dữ liệu cũ. RLS giới hạn các bảng lớp theo owner. Mã chỉ được lưu dưới dạng băm và bảng mã không có dữ liệu đọc công khai. Báo cáo yêu cầu phiên giáo viên và trả về với `Cache-Control: private, no-store`. [Cách Supabase áp dụng RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
