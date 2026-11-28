# Ma trận tính năng

## Cambridge Starters · V1.5C1

| Phạm vi | Luồng thực hiện | Cách chấm |
|---|---|---|
| Listening · 4 Part, 20 câu | Nối tên, nghe viết, chọn hình, tô màu | 1 điểm mỗi câu |
| Reading & Writing · 5 Part, 25 câu | Tick/cross, yes/no, xếp chữ, điền đoạn đọc, viết từ theo truyện | 1 điểm mỗi câu |
| Speaking · 4 Part | Làm trực tiếp với giáo viên, chấm trong lớp hoặc nhận bài qua link | Rubric và nhận xét do giáo viên công bố |
| Practice Mode | Chọn từng Part, xem ví dụ, luyện không giới hạn thời gian | Mẫu công khai phản hồi sau mỗi câu và tổng kết |
| Mock Test Mode | Thi theo từng kỹ năng, đồng hồ, sửa câu trước và tối đa hai lượt bắt đầu phát mỗi clip | Chấm khi nộp. Giáo viên chọn quyền xem trên bài giao |
| Nhập bộ đề và giao bài | Học liệu mẫu → lưu riêng tư → tạo link → xem kết quả và CSV | Snapshot và quyền giáo viên hiện có |

[Đối chiếu từng Part và hướng dẫn sử dụng](STARTERS.md).

## Cambridge Practice · V1.5C3

| Phạm vi | Luồng thực hiện | Cách chấm |
|---|---|---|
| Dashboard Cambridge | 44 Part và chín bài thi thử cho Starters, Movers, Flyers | Điểm theo từng bài |
| Flyers Listening · 5 Part, 25 câu | Nối tên, điền phiếu, ghép ảnh, chọn ảnh, tô màu và viết hai từ | 25 câu tự động |
| Flyers Reading & Writing · 7 Part, 44 câu | Có điền thư không có khung từ và viết truyện ba tranh | 43 câu tự động và một bài viết chấm theo rubric |
| Flyers Speaking · 4 Part | So sánh tranh, trao đổi thông tin, kể tiếp truyện và trả lời cá nhân | Giáo viên chấm trực tiếp hoặc qua bài giao |
| Giao bài và khôi phục | Sửa, nhân bản, giao snapshot, lưu bản nộp trong phiên, xuất CSV | Tách điểm tự động và thủ công, nhận lại kết quả đã lưu khi mất phản hồi |

[Đặc tả đủ ba cấp độ](CAMBRIDGE_SPEC.md).

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

## V1.5B1

| Hạng mục | Phạm vi |
|---|---|
| Practice v1 | Metadata có version trong nội dung hoạt động và snapshot bài giao. Dùng Quiz hoặc Type the Answer để chấm ở máy chủ. Có thể bỏ trống |
| Listening | Choose, Match, Colour, Dictation, Dialogue. Có clip mẫu, tốc độ chậm, phát lại và giới hạn phía trình duyệt |
| Phonics | Letter Sounds, Beginning Sounds, Ending Sounds, Blending, Rhyming Words, Sound Discrimination. Mỗi mẫu yêu cầu clip do giáo viên kiểm tra |
| Kho từ | Từ đang lưu trữ được lọc khỏi nguồn chọn mới và CSV. Lesson đã lưu vẫn đọc được. [Độ phủ từ vựng](VOCABULARY_COVERAGE.md) |
| Đợt tiếp theo | Reading, Grammar và Lesson Builder thuộc B2. Speaking, Writing và chấm thủ công thuộc B3 |

## V1.5B2

| Hạng mục | Phạm vi |
|---|---|
| Listening | Dùng ảnh phương án, gồm chế độ chỉ hiện ảnh với nhãn trung tính. Ghép 2–8 clip với bộ thẻ chung. Listen and Colour hỗ trợ vùng bầu dục do giáo viên đặt. |
| Media và bảo mật | Ảnh tải mới được chuyển WebP để bỏ metadata và lưu với tên ngẫu nhiên. Học sinh nhận URL ngắn hạn, mã phương án ảnh và dữ liệu cần để làm bài. Không gửi đáp án, giải thích hoặc transcript đã ẩn trước khi nộp. |
| Reading | Sentence Matching, Picture Comprehension, Short Passage Comprehension, Story Sequencing, Gap Filling và Multiple Choice. Dùng một ngữ liệu chung, chấm ở server và giữ nguyên bản chụp bài đã giao. |
| Grammar | 21 chủ điểm nội bộ có ví dụ ngữ cảnh và giải thích cho câu sai khi cho phép xem lại. Dạng nhập chữ nhận các biến thể đã khai báo. Dùng Quiz, Unjumble, Word Magnets, Complete the Sentence và Type the Answer. |
| Giáo án | Mở rộng Vocabulary Lesson. Có thông tin tiết dạy, ghi chú riêng, bản nháp, thứ tự kéo thả và bàn phím, nhân bản, xem trước, trình chiếu và giao bài từng bước. Xem điểm theo từng bài giao chấm được. |
| Giáo án mẫu | Colours and Classroom Objects, Animals and Pets, My Daily Routine, Travel and Adventures. Mỗi bộ có năm hoạt động gốc kèm từ vựng, mục tiêu, thời lượng và bài về nhà. |
| Học liệu | 220/220 mục Kids và Starters có IPA và câu ví dụ. Dấu chờ duyệt và nhật ký duyệt phân biệt độ phủ dữ liệu với chất lượng giảng dạy. [Số liệu và quy trình](VOCABULARY_COVERAGE.md) |

## V1.5B3

| Hạng mục | Phạm vi |
|---|---|
| Speaking | Personal Questions, Describe the Picture, Picture Differences, Storytelling, Speaking Cards và Guided Conversation. Hỗ trợ ảnh, audio hướng dẫn, từ gợi ý, câu mẫu, đồng hồ tùy chọn và chấm trực tiếp trên lớp. |
| Writing | Complete the Word, Sentence Building, Picture-based Writing, Short Answers, Short Paragraph và Story Completion. Dạng khách quan nhận đáp án thay thế đã khai báo. Dạng mở vào hàng chờ chấm. Bản nháp chữ tự lưu trong phiên tab. |
| Chấm thủ công | Rubric tùy chỉnh được chụp lúc giao bài. Bài nộp, điểm tự động và đánh giá thủ công được lưu riêng. Có lưu đánh giá, công bố, sửa điểm và lọc theo trạng thái, kỹ năng, giáo án, bài giao hoặc cấp độ. |
| Bản ghi | Cờ mặc định tắt. Khi có quyền, bắt đầu và dừng chủ động, nghe lại, xóa và gửi tệp. Storage riêng tư và URL ký theo phiên hợp lệ hoặc chủ bài. |
| Duyệt từ vựng | Ghi trạng thái, ngày và nhận xét trong database theo giáo viên. Chỉnh mục trong kho riêng đưa mục về Chưa duyệt. Danh mục mẫu giữ nguồn gốc để sao chép. |
| Giáo án | Thêm bốn giáo án Speaking và Writing, mỗi cấp một bộ. Mỗi giáo án có năm bước. Giáo án ở trạng thái sẵn sàng mới giao hoạt động được. |

## V1.6A Teaching Tools

| Hạng mục | Phạm vi |
|---|---|
| Phiếu bài tập | Quiz, Match Up, Flashcards, Wordsearch, Crossword, Hangman, Anagram, Group Sort, Unjumble, Complete Sentence và các mẫu tương thích, gồm English Practice và Cambridge Starters, Movers, Flyers. Phiếu bản in dùng nội dung hoạt động hoặc snapshot giao bài. |
| PDF | Xem trước, tải phiếu học sinh, đáp án riêng, giáo án và transcript khi có. Hỗ trợ khổ A4/Letter, màu/xám, tiếng Việt, tiếng Anh, IPA và hình ảnh. |
| QR | Link theo domain đang mở, sao chép, tải PNG/SVG, bản in tên hoạt động và chế độ trình chiếu. Mã giữ nguyên URL và quy tắc truy cập bài giao. |
| Excel | Ba sheet Tổng quan, Kết quả và Chi tiết trả lời. Lọc nhiều bài giao, ngày bắt đầu và dữ liệu theo chủ bài. Tách điểm, trạng thái rubric, tỷ lệ nộp, điểm trung bình và câu thường sai. Ô chữ được ghi dưới dạng văn bản. CSV vẫn có trên trang bài giao. |

## V1.6B Classroom và Student Progress

| Hạng mục | Phạm vi |
|---|---|
| Lớp và hồ sơ | Bốn cấp độ, lịch học, khóa học, ghi chú, tìm và lọc. Tạo, sửa, nhân bản và lưu trữ lớp. Hồ sơ có ID riêng, nhập CSV/XLSX, có thể tham gia nhiều lớp, chuyển lớp hoặc lưu trữ. |
| Mã cá nhân | Mã ngẫu nhiên, hiển thị khi cấp và kiểm tra phía server. Thu hồi, cấp lại và giới hạn yêu cầu. Hồ sơ và kết quả thuộc giáo viên. |
| Bài giao | Cả lớp hoặc học sinh được chọn từ hoạt động đã lưu, giáo án hoặc Cambridge nhập vào thư viện. Link, QR, thời hạn và số lần làm. Giữ snapshot nội dung và người nhận. |
| Tiến độ | Phân biệt chưa làm, đang làm, đã nộp, chờ chấm, đã chấm và điểm 0. Biểu đồ theo thời gian, kỹ năng, Part Cambridge, lượt luyện từ và câu cần ôn. |
| Báo cáo | PDF giáo viên và PDF riêng từng học sinh cho phụ huynh. Excel ba sheet có danh sách, bảng điểm từng lượt và tiến độ. Lọc theo lớp, học sinh, ngày giao và kỹ năng. |

## V1.6C Live Classroom và Smart Teaching Tools

| Hạng mục | Phạm vi |
|---|---|
| Phòng trực tiếp | Quiz, Gameshow, True/False, Image Quiz. Hai nhịp chơi, điều khiển giáo viên, mã phòng/link/QR, sẵn sàng, Realtime và đồng bộ lại. |
| Danh tính và tiến độ | Khách dùng phiên trình duyệt. Phòng theo lớp xác minh mã cá nhân và ghi lịch sử trực tiếp riêng vào hồ sơ. Mỗi người chỉ có một câu trả lời đã lưu cho mỗi mục. |
| Vinh danh | Mặc định tắt trong phòng. Bí danh, cá nhân hoặc hai đội, chuỗi đúng, điểm thưởng và trình chiếu. Bảng bài giao chỉ có trong khu giáo viên. |
| Tạo nhanh | Nguồn chủ đề, từ vựng, đoạn văn, giáo án hoặc văn bản. Tạo bản nháp riêng từ quy tắc nội bộ, kiểm tra schema và mở Activity Editor để duyệt. |
| Nhúng | Mã iframe cho hoạt động công khai đã xuất bản. Bài giao và kết quả riêng giữ URL, quyền, hạn và snapshot riêng. |
