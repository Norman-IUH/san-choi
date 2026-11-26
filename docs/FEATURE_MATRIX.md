# Ma trận tính năng

| Tính năng | Màn hình | Vai trò | Ưu tiên | Nguồn xác minh | Độ khó | Phase / nghiệm thu |
|---|---|---|---|---|---|---|
| Landing, mẫu chơi | Trang chủ, player | Mọi người | P0 | Quan sát trang công khai | Vừa | 1–3 / browser |
| Auth và hồ sơ | Đăng nhập, cài đặt | Mọi người | P0 | Quan sát cổng đăng nhập | Vừa | 1 / E2E |
| Thư viện, tìm, thư mục, bản nháp, thùng rác | Hoạt động | Giáo viên | P0 | Help Center, brief | Vừa | 1 / RLS + E2E |
| Soạn, phiên bản, media và đổi mẫu | Editor | Giáo viên | P0 | Features, brief | Cao | 2 / unit + browser |
| Bài giao, link, kết quả | Bài giao, kết quả | Giáo viên, học sinh | P0 | Features, Help Center | Cao | 2 / integration + browser |
| 34 luật chơi, chấm điểm, timeout | Player | Mọi người | P0 | Features, Pricing, brief | Cao | 2–3 / theo mẫu |
| PDF, Excel, QR, nhúng | In, kết quả, chia sẻ | Giáo viên | P1 | Features, brief | Vừa | 3–4 / tệp mở được |
| Tìm, lưu, sao chép và kiểm duyệt | Cộng đồng, admin | Giáo viên, admin | P1 | Pricing, brief | Cao | 4 / RLS + E2E |
| Lớp, nhóm, phòng chơi, sơ đồ chỗ | Lớp học | Giáo viên, học sinh | P1 | Features (sơ đồ), đề xuất dự án | Cao | 4 / realtime + tải |
| AI, tài liệu và quyền duyệt | Trợ lý soạn | Giáo viên | P1 | Pricing, brief | Cao | 4 / schema + quota |
| Đăng ký công khai, Admin SaaS, thuê bao | — | — | — | Phạm vi cá nhân | — | Ngoài roadmap cá nhân |

## Trạng thái triển khai

| Phạm vi | Trạng thái | Bằng chứng |
|---|---|---|
| Trang chủ và 12 mẫu cơ bản | Luồng chơi demo hoạt động | Playwright desktop và mobile, Vitest cho từng mẫu |
| Thư viện, editor, version, chuyển mẫu | Có trong mã | PostgreSQL nhúng kiểm tra quyền và version. Vitest kiểm tra schema và giữ nội dung. Chờ E2E Supabase |
| Auth, xác minh email, Google, hồ sơ | Có trong mã và cần cấu hình | PostgreSQL nhúng kiểm tra role và provision. Chờ E2E Supabase Auth |
| Bài giao, kết quả và CSV | Có trong mã | PostgreSQL nhúng kiểm tra snapshot và nộp trùng. Vitest kiểm tra điểm và CSV. Chờ E2E Supabase |
| Cộng đồng, link public/unlisted | Có listing và trang chi tiết | Chờ E2E Supabase |
| 22 mẫu nâng cao và các chức năng mở rộng | Backlog | Xem lộ trình và danh sách hạn chế |

Xem [kết quả kiểm thử](TEST_RESULTS.md) và [các phần còn thiếu](LIMITATIONS.md).

## Cập nhật V1.1

| Phạm vi | Trạng thái | Bằng chứng |
|---|---|---|
| Focus khi bắt đầu/đổi câu, nhãn tiến độ, hướng dẫn đáp án, phản hồi demo | Done | Playwright Chromium desktop và mobile trên production build |
| Vùng chạm điều hướng, favicon, tiêu đề trang, trạng thái thiếu backend | Done | Playwright và ảnh Quiz/Cộng đồng |
| HTTP 404 của đường dẫn sai | Done cho URL thử | Kiểm tra production với demo không có, ID sai, URL không khớp. ID hợp lệ thiếu backend có thông báo riêng |
| Giới hạn tần suất bắt đầu/nộp | Done | Hai ngưỡng đã kiểm tra trên PostgreSQL nhúng và QuizStudy. Luồng E2E thực tế gọi RPC |
| Auth, PostgREST, RPC, RLS và E2E hai giáo viên trên Supabase | Done | QuizStudy development. Hai giáo viên cách ly, học sinh nộp bài 10/10, chủ bài tải CSV |
| Tự đăng ký giáo viên và xác minh email | Partial | Đã kiểm tra form, mã lỗi Auth và provision qua Auth Admin. Chờ kiểm tra nhận thư và xác minh bằng hộp thư thực |
| Mời giáo viên tại trung tâm | Done ở mức thiết kế | Quy trình đóng đăng ký và nghiệm thu lời mời ghi trong roadmap. Chưa bật trên Supabase |
| V1.3–V2.0 | Not Started | [Lộ trình và cổng nghiệm thu](UPGRADE_ROADMAP.md) |

## Phạm vi cá nhân V1.2

| Phạm vi | Trạng thái | Nghiệm thu |
|---|---|---|
| Chế độ một giáo viên | Đạt trên bản build thử | Ẩn đăng ký/OAuth, đúng UUID được vào và tài khoản khác bị chặn. Supabase production cần tắt đăng ký trực tiếp |
| Học liệu tiếng Anh theo cấp độ và kỹ năng | Đạt bước đầu | Bốn bộ từ gốc dùng chung cho Flashcards và Match Up đã chạy desktop/mobile. Có chức năng lưu bản sao vào thư viện |
| Nhập CSV/XLSX, IPA và ví dụ | Đạt | Playwright nhập cả hai loại tệp, đọc IPA và câu ví dụ, lưu lại nội dung |
| Ảnh, audio và media theo đáp án | Partial | QuizStudy đã kiểm tra ảnh sai định dạng, ảnh riêng tư có URL hết hạn và nhận ảnh trong bài giao. Còn nghiệm thu toàn bộ biến thể audio Anh–Anh/Anh–Mỹ và media theo phương án |
| 22 mẫu tiếp theo, Cambridge, lớp học, PDF, Excel và QR | Backlog | [Roadmap](UPGRADE_ROADMAP.md) |
