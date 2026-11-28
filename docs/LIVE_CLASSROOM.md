# V1.6C Live Classroom

## Mở phòng

- Từ hoạt động Quiz, Gameshow, True/False hoặc Image Quiz đã xuất bản, chọn **Tạo phòng trực tiếp**. Có thể mở phòng từ bước tương thích trong giáo án đã lưu. Bài luyện chuyên biệt có dữ liệu Cambridge/Practice tiếp tục dùng trình chơi riêng.
- Chọn giáo viên chuyển câu hoặc học sinh tự chuyển câu. Gửi mã, đường dẫn hoặc QR. Phòng theo lớp đòi mã cá nhân của thành viên còn hoạt động. Giáo viên xem số người tham gia và đã sẵn sàng, bắt đầu, tạm dừng, tiếp tục hoặc kết thúc.
- Phòng lưu bản chụp câu hỏi. Lượt gửi được khóa theo người và câu. Tải lại trang dùng phiên hiện có. Học sinh trong lớp có thể xác thực lại bằng mã cá nhân. Khách ẩn danh giữ phiên trong cùng trình duyệt.
- Mỗi phòng tối đa 30 người và tự hết hạn sau 4 giờ. Realtime chuyển tín hiệu không chứa nội dung cá nhân hay đáp án, qua chủ đề ngẫu nhiên chỉ được trả sau khi xác thực phiên. Máy chủ cấp lại trạng thái theo quyền. Khi mất Realtime, trình duyệt đọc lại định kỳ và có nút **Đồng bộ lại**. [Giới hạn Realtime của Supabase](https://supabase.com/docs/guides/realtime/limits).

## Vinh danh

- Giáo viên bật tùy chọn vinh danh cho phòng, có thể đổi trên trang điều khiển. Mỗi câu đúng cho 1 điểm, thêm 1 điểm sau mỗi chuỗi 3 câu đúng liên tiếp. Tốc độ trả lời không được tính.
- Bảng vinh danh chỉ xuất hiện cuối phòng và chọn tối đa ba vị trí có điểm dương. Phòng tự cấp bí danh. Chế độ đội chia luân phiên thành hai đội và cộng điểm theo đội.
- Giáo viên có thể mở bảng vinh danh từ bài giao và trình chiếu toàn màn hình. Điểm phòng tách khỏi bài giao, báo cáo Excel và điểm học tập chính thức.

## Tạo hoạt động và mã nhúng

- Vào **Hoạt động → Tạo hoạt động nhanh**. Chọn nguồn, cấp độ, kỹ năng, độ khó, mẫu và từ 1 đến 20 câu. Với danh sách từ, nhập tên có trong kho hoặc từng dòng `từ | nghĩa`. Với đoạn văn, các câu điền từ lấy đáp án từ chính văn bản. Chức năng dùng các quy tắc có sẵn, chạy mà không cần AI provider.
- Nội dung được lưu dưới dạng bản nháp riêng và mở trong Activity Editor. Giáo viên có thể sửa câu, chọn lại phương án và xuất bản khi sẵn sàng.
- Hoạt động **Công khai** đã xuất bản có nút **Nhúng hoạt động**. Dán iframe vào trang ngoài. Khi chuyển thành Có link, Riêng tư hoặc lưu bản nháp, đường dẫn nhúng không còn cung cấp hoạt động. Link giao bài dùng quy trình riêng với deadline và snapshot.
