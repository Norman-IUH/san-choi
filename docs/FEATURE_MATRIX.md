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
| V1.5–V2.0 | Backlog | [Lộ trình và cổng nghiệm thu](UPGRADE_ROADMAP.md) |

## Phạm vi cá nhân V1.2

| Phạm vi | Trạng thái | Nghiệm thu |
|---|---|---|
| Chế độ một giáo viên | Đạt trên bản build thử | Ẩn đăng ký/OAuth, đúng UUID được vào và tài khoản khác bị chặn. Supabase production cần tắt đăng ký trực tiếp |
| Học liệu tiếng Anh theo cấp độ và kỹ năng | Đạt | Bốn bộ từ gốc dùng chung cho Flashcards và Match Up. 20 từ và 40 tệp audio tổng hợp UK/US. Có chức năng lưu bản sao vào thư viện |
| Nhập CSV/XLSX, IPA và ví dụ | Đạt | Playwright nhập cả hai loại tệp, đọc IPA và câu ví dụ, lưu lại nội dung |
| Ảnh, audio và media theo đáp án | Có trong preview | Audio UK/US theo mục, ảnh và audio theo phương án. Tệp giáo viên lưu trong bucket riêng tư và tải qua URL có hạn |
| Tạo, giao, nộp và lưu điểm trên Vercel | Đạt | Giáo viên thấy điểm 1/1 sau khi tải lại trang và đã đóng bài giao thử |
| 22 mẫu tiếp theo, Cambridge, lớp học, PDF, Excel và QR | Backlog | [Roadmap](UPGRADE_ROADMAP.md) |

## Trải nghiệm game V1.3

| Phạm vi | Nghiệm thu |
|---|---|
| 12 sân khấu, minh họa, lật thẻ, hộp, vòng quay và Gameshow | Từ bắt đầu đến kết quả trên desktop, điện thoại và tablet Chromium. Vòng quay hiển thị nội dung bài. Gameshow demo có điểm trực tiếp và nhân đôi điểm |
| Ghép cặp và Phân nhóm | Kéo thả chuột và chạm, kèm thao tác chọn hai bước và điều khiển bàn phím |
| Thao tác lớp học | Toàn màn hình trình duyệt hoặc phủ khung nhìn, âm báo tùy chọn, hỗ trợ chế độ giảm chuyển động |
| Bài đã giao | Mặc định ẩn đáp án. Giáo viên có thể bật phần xem lại sau khi học sinh nộp. Bài cũ giữ thiết lập cũ |
| Tiếp tục bài giao | Lưu các mục đã làm sau khi tải lại cùng tab. Giáo viên và máy chủ vẫn nhận đúng một bài hoàn chỉnh qua quy trình hiện có |

## Nền tảng và mẫu V1.4A

| Phạm vi | Trạng thái trên nhánh review |
|---|---|
| Registry, schema, adapter, scoring và rendering | Tách riêng trong `lib/games` và `components/games`. Dữ liệu cũ tiếp tục đi qua schema hiện hữu. Hai cụm renderer mới chỉ tải khi chơi |
| Thư viện và giao bài | Tám mẫu mới có editor, demo, preview, giao bài, chấm điểm và hiển thị kết quả chung. Tăng tổng số mẫu lên 20 |
| Media riêng | Player xin URL mới khi tệp ký bị lỗi. Máy chủ kiểm tra quyền với nguồn bài, lượt làm còn hiệu lực và đường dẫn thuộc chủ sở hữu |
| Sân chơi | Không mặc định đếm giờ. Ảnh gameplay dùng trong thư viện, có toàn màn hình, âm báo, thao tác chạm và bàn phím |
| Câu đố tương tác V1.4B | Bảy mẫu có editor, demo, preview, gameplay, kết quả và giao bài. Tổng 27 mẫu trên nhánh review |
| Phiên an toàn | Hangman dùng lịch sử server, cấp lại media giới hạn theo phiên/IP và kiểm tra tình trạng bài giao |
| Arcade V1.4C | Bảy mẫu mới dùng chung editor, giao bài theo snapshot, kết quả, toàn màn hình và âm thanh. Tổng 34 mẫu trên nhánh review |

## Vận hành arcade

- Phaser được tải khi bắt đầu Maze Chase, Flying Fruit, Airplane, Balloon Pop hoặc Whack-a-Mole. Speed Sorting và Win or Lose Quiz dùng DOM cho các lượt kéo thả và đố vui rời rạc.
- Mặc định không đếm giờ. Đồng hồ và độ khó nằm trong snapshot từng mục. Ẩn tab hoặc mất focus sẽ tạm dừng. Khi tải lại cùng tab, trò giữ các câu đã chốt và mở lại câu hiện tại từ đầu.
- Bài giao gửi phương án đã chốt. Server chấm trước khi lưu, kể cả lượt thử sức của Win or Lose Quiz. Đáp án sai và chi tiết trả lời chỉ hiện khi chính sách bài giao cho phép.

## V1.4D — Cải tiến trải nghiệm

| Tính năng | Trạng thái V1.4D |
|---|---|
| Game Shell | Trang demo và bài chơi riêng có HUD quay lại, tiến độ, âm thanh, pause và fullscreen. Player xem trước vẫn nằm trong trang hoạt động |
| Start và Result | Minh họa theo mẫu, nút bắt đầu lớn, lời động viên và chơi lại. Điểm và câu sai theo quyền bài giao |
| Trò theo lượt | Thẻ Quiz lớn hơn, vùng kéo Rank Order cho cảm ứng, chế độ trình chiếu thẻ ghi nhớ, cỡ chữ ô chữ lớn hơn |
| Arcade | Phối cảnh dọc và ngang, chữ mục tiêu tương phản cao hơn và D-pad Maze Chase. Tiếp tục dùng riêng luật chơi V1.4C |
| Giáo viên | Tìm và lọc bộ 34 mẫu bằng ảnh gameplay, lối tắt đến biểu mẫu giao bài, tinh chỉnh danh sách kết quả và học liệu tiếng Anh |

## V1.5A

| Tính năng | Phạm vi |
|---|---|
| Ngân hàng từ | 110 mục mỗi cấp độ. Từ, nghĩa, từ loại và chủ đề cho toàn bộ danh mục. 20 mục mở đầu có IPA, ví dụ và 40 tệp phát âm tổng hợp |
| Từ của giáo viên | Tạo, sửa, sao chép, tìm và lọc. Có ảnh và audio Anh–Anh, Anh–Mỹ tùy chọn |
| Nhập, xuất và sửa theo nhóm | CSV/XLSX tối đa 1.000 dòng trong giới hạn tệp 512 KiB. CSV tải xuống gồm dữ liệu chữ. Sửa cấp độ và chủ đề cho từ riêng đã chọn |
| Bài học | Lưu danh sách tham chiếu, lọc theo cấp độ, kỹ năng, chủ đề, unit và độ khó, sao chép bài |
| Tái sử dụng | Xem trước từ cùng nguồn. Chỉ bật mẫu vượt qua schema và phù hợp dữ liệu đã chọn. Bản soạn và bài giao là bản chụp độc lập |
| V1.5B/C | Bài luyện nhiều kỹ năng, rubric, thu âm tùy chọn và luyện theo phần thi thuộc các đợt kế tiếp |
