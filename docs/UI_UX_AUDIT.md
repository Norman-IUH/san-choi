# Audit UI/UX Sân Chơi

**26/11/2026 · localhost:3000 · bản đang chạy ở chế độ phát triển**

Sân Chơi chạy trọn 12/12 demo trên cả hai viewport, gồm bắt đầu, chơi, kết thúc và chơi lại. Bản cục bộ báo thiếu cấu hình Supabase, nên luồng giáo viên và giao bài chỉ kiểm tra được tới màn hình chặn truy cập. Với giáo viên tiếng Anh thiếu nhi, các trò chữ và thẻ nói phù hợp làm hoạt động bổ trợ có giáo viên dẫn dắt. Các demo quan sát được đều bằng tiếng Việt và chưa cung cấp học liệu tiếng Anh theo từng cấp Cambridge.

## Phương pháp và bằng chứng

- Mở trang chủ và đọc cây giao diện bằng Playwright CLI trên Edge. Chạy batch chụp toàn trang và tương tác từng game bằng Playwright Chromium với hai viewport **1920×1080** và **390×844**. Mobile mô phỏng thao tác chạm. Dùng hồ sơ sạch, UUID thử nghiệm và câu trả lời của demo.
- Mỗi viewport có **21 lượt điều hướng trang ngoài game**, **2 yêu cầu tới endpoint CSV** và **12 URL game hợp lệ**. Có **124 ảnh PNG toàn trang**, gồm **72 ảnh** bắt đầu/đang chơi/kết thúc, **10 ảnh** thao tác bổ sung và **42 ảnh** các trang và trạng thái còn lại. Ảnh toàn trang có thể cao hơn viewport.
- Trong ZIP, tìm ảnh theo `screenshots/desktop/` và `screenshots/mobile/`. Các tệp `evidence/observations.json`, `evidence/focused-checks.json` và `evidence/fullscreen.json` cung cấp trạng thái route, điểm, sự kiện và phép đo. Bản làm việc nằm tại [output/playwright/ui-audit](../output/playwright/ui-audit).
- Kiểm tra ngữ nghĩa bằng cây trợ năng Chromium, Tab, Enter và Space, trạng thái focus, tên điều khiển, reduced motion và kích thước vùng bấm. Dùng [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) và [thiết kế dự án](DESIGN.md) để đối chiếu.
- Chưa nghiệm thu với trình đọc màn hình thực, thiết bị iOS/Android vật lý, toàn bộ độ tương phản hay các tổ hợp zoom và bàn phím ảo. Màn hình lỗi runtime và loading là trạng thái dùng chung, không có URL riêng. Audit có ảnh trang không khả dụng và lỗi callback, chưa chủ động gây lỗi backend để kích hoạt error boundary.

## Các trang đã mở

Kết quả bên dưới giống nhau ở cả hai viewport. `{id}` là UUID thử nghiệm không đại diện cho dữ liệu học sinh.

| Trang hoặc URL | Kết quả thực tế | Tên ảnh trong mỗi thư mục viewport |
|---|---|---|
| `/` | HTTP 200. Có 12 thẻ demo và CTA tạo hoạt động | `home.png` |
| `/community`, tìm `Cambridge` với mẫu Quiz | HTTP 200. Gửi form đưa bộ lọc vào URL, trang giữ trạng thái rỗng | `community.png`, `community-search.png` |
| `/login`, `?mode=register`, `?mode=reset`, `?message=failed` | HTTP 200. Có nhãn email và mật khẩu khi áp dụng. Các nút gửi tương ứng bị vô hiệu hóa và trang báo cần kết nối Supabase | `login.png`, `register.png`, `reset.png`, `login-error.png` |
| `/activities`, `/activities/new`, `/activities/new?template=quiz` | Kết thúc ở `/login?setup=1` | `activities.png`, `activity-new.png`, `activity-new-quiz.png` |
| `/activities/{id}`, `/activities/{id}?edit=1` | Kết thúc ở `/login?setup=1` | `activity-detail.png`, `activity-edit.png` |
| `/assignments/{id}`, `/results`, `/results/{id}`, `/profile` | Kết thúc ở `/login?setup=1` | `assignments.png`, `results.png`, `result-detail.png`, `profile.png` |
| `/play/{id}`, `/resource/{id}`, `/demo/unknown` | Hiện “Trang không khả dụng”, phản hồi tài liệu HTTP 200 | `assignment-play.png`, `resource.png`, `invalid-demo.png` |
| `/auth/callback` thiếu mã | HTTP 307 tới `/login?message=failed` | `callback.png` |
| `/results/export`, có và thiếu tham số `assignment` | Có UUID thì HTTP 307 tới login. Thiếu tham số thì HTTP 404. Đây là endpoint nên lưu bằng chứng HTTP | JSON |
| `/audit-404` | HTTP 404 và hiện “Trang không khả dụng” | `not-found.png` |

Dashboard, editor sau đăng nhập, tạo và mở bài giao hợp lệ, lưu lượt nộp, kết quả và tải CSV đều **chưa được kiểm tra bằng dữ liệu backend**. Ảnh các URL bị chuyển hướng ghi lại đúng trang chặn truy cập. Tìm kiếm Cộng đồng được xác minh ở mức giao diện và URL, chưa xác minh truy vấn dữ liệu thực.

## 12 game

Mỗi hàng đều có ba ảnh `<mẫu>-01-start.png`, `<mẫu>-02-play.png`, `<mẫu>-03-result.png` trong cả hai thư mục viewport. Tất cả nút **Chơi lại** đưa về màn hình **Bắt đầu**.

| Mẫu | Tương tác đã thực hiện | Kết quả trên hai viewport |
|---|---|---|
| `quiz` | Chọn đáp án đơn và nhiều đáp án | 3/3 |
| `match-up` | Chọn cả ba cặp qua danh sách | 3/3 |
| `flash-cards` | Lật thẻ bằng Enter trên desktop và tap trên mobile | Hoàn thành, không chấm điểm |
| `speaking` | Đi qua ba đề nói dạng văn bản | Hoàn thành, không chấm điểm |
| `sentence` | Nhập hai từ tiếng Việt có dấu | 2/2 |
| `group-sort` | Chọn nhóm cho từng mục | 3/3 |
| `wheel` | Quay, hiện đề và tiếp tục đủ ba vòng | Hoàn thành, không chấm điểm |
| `find-match` | Chọn từng đáp án ghép | 3/3 |
| `gameshow` | Dùng nút nhân đôi một câu và trả lời đủ | 4/4 |
| `unjumble` | Chọn các từ/cụm theo thứ tự để xếp hai câu | 2/2 |
| `anagram` | Xếp chữ có dấu thành hai từ | 2/2 |
| `open-box` | Mở ba hộp và đọc đề hiện ra | Hoàn thành, không chấm điểm |

## Ngôn ngữ thiết kế

- **Bề mặt audit** gồm trang khám phá, trò chơi, đăng nhập và các URL giáo viên trong phạm vi bản deploy cục bộ.
- **Nguồn thiết kế** là [docs/DESIGN.md](DESIGN.md). Biến màu và bố cục trong [app/globals.css](../app/globals.css) được nạp ở layout. Player dùng cùng cấu trúc và kiểu điều khiển cho các biến thể, với màu theo mẫu và nền tối riêng của Gameshow.
- **Quan sát thị giác**. Thẻ minh họa trên trang chủ mở được Quiz. Các mẫu có nhãn chữ và biểu tượng. Trong trò chơi, câu hỏi, vùng thao tác và nút tiếp tục có thứ tự rõ. Trên mobile, Quiz giữ hai cột đáp án và toàn bộ trang vừa chiều ngang tại 390 px. Màu chủ đạo và phân cấp chữ nhất quán giữa các ảnh đối chiếu.
- **Các quyết định có thể đối chiếu** gồm focus nhìn thấy được, giảm chuyển động, mục tiêu chạm ưu tiên 44 px và trình tự hướng dẫn → câu hỏi → phản hồi/kết quả. Không có ngoại lệ được ghi trong tài liệu thiết kế cho trình chơi.

## Findings

| # | Vấn đề | Bằng chứng | Thay đổi đề xuất | Phạm vi | Độ tin cậy |
|---|---|---|---|---|---|
| 1 | **P1 · Mất vị trí bàn phím khi bắt đầu và sang câu** | `focused-checks.json` ghi `BODY` sau Enter ở nút Bắt đầu và Tiếp theo. Tab kế tiếp sau khi đổi câu đi tới logo “Sân Chơi”. Các nhánh render nằm tại `components/Player.tsx:92` và `components/Player.tsx:107`. Đi ngược trình tự đọc trong [thiết kế](DESIGN.md) | Chuyển focus tới tiêu đề câu mới khi bắt đầu hoặc đổi lượt | Quiz đã tái hiện bằng bàn phím | Cao |
| 2 | **P2 · Thanh tiến độ không có tên trợ năng** | Màn hình có chữ “Mục 1 / 3”, nhưng node `progressbar` trong cây AX có tên rỗng. `components/Player.tsx:107` đặt chữ và `progress` cùng vùng mà chưa liên kết chúng. Xem `observations.json` và `quiz-02-play.png` | Dùng chữ “Mục …” hiện có làm nhãn truy cập cho thanh tiến độ | Quiz đã đo bằng cây AX. Cùng markup xuất hiện ở các trò theo lượt | Cao |
| 3 | **P2 · Quiz thiếu chỉ dẫn chọn nhiều đáp án** | Ở câu 2, người chơi thấy câu hỏi, ba lựa chọn và nút Tiếp theo. Chọn một đáp án đã bật nút. Trong lượt đối chứng, chọn riêng “Mặt Trời” bị tính sai vì cần thêm “Đèn đang sáng”. Nút dùng `aria-pressed` tại `components/Player.tsx:118`, phần tiếp tục chỉ yêu cầu có lựa chọn tại `components/Player.tsx:123` | Hiện chỉ dẫn chọn đáp án cho câu trắc nghiệm, kể cả khi câu có nhiều đáp án đúng | Quiz demo, trên cả hai viewport | Cao |

**Ưu tiên sửa đầu tiên** là chuyển focus sang câu mới. Lượt kiểm tra bằng Enter và Tab cho thấy vị trí đọc bị mất ngay ở luồng Quiz cơ bản.

## Network, responsive và khả năng tiếp cận

- **Console / network.** Batch Chromium không ghi nhận `pageerror`, lỗi request transport hoặc HTTP 5xx. Console ghi lỗi tài nguyên khi cố ý mở `/audit-404`. Edge ghi thêm lỗi favicon ngay trên trang chủ. GET trực tiếp `/favicon.ico` xác nhận HTTP 404. Ba URL động hiện “Trang không khả dụng” với mã 200, trong khi URL không tồn tại thật trả 404. `app/demo/[template]/page.tsx`, `app/play/[id]/page.tsx` và `app/resource/[id]/page.tsx` gọi `notFound()` trong các trường hợp thử này. Đây là sai khác HTTP quan sát được trên server hiện tại. Chưa truy nguyên cơ chế streaming trên production.
- **Hiển thị.** Không có overflow ngang cấp tài liệu ở các trang và ba trạng thái game đã chụp. Ba liên kết điều hướng đầu trang cao khoảng **23 CSS px** ở mobile. Giá trị này dưới mục tiêu thiết kế **44 px** của dự án, và không đủ để kết luận vi phạm WCAG chỉ từ chiều cao.
- **Bàn phím và chuyển động.** Skip link hiện viền khi Tab và Enter đưa hash tới `#main`. Space/Enter kích hoạt Quiz và lật thẻ. Nút “Toàn màn hình” vào/thoát fullscreen trên Chromium desktop sau khi chờ sự kiện hoàn tất. Vòng quay giảm thời lượng chuyển động xuống **0,01 ms** với `prefers-reduced-motion: reduce`.
- **Phản hồi học tập.** Lượt Quiz đối chứng trên cả hai viewport chọn sai câu 1, chọn thiếu ở câu 2 và đúng câu 3. Kết quả là **1/3**. Trình chơi chuyển thẳng sang câu tiếp theo và cuối lượt chỉ hiện tổng điểm. Reload ở câu 2 trở về nút Bắt đầu. Hai hành vi này được xác minh trên demo, còn lưu tiến độ hoặc hiển thị phản hồi trong bài giao thật chưa được kiểm tra.
- **Tiêu đề tab.** Các URL đo đều mang cùng tiêu đề “Sân Chơi — Học liệu tương tác”, kể cả demo và tài khoản. `app/layout.tsx:6` đặt tiêu đề chung. Điều này khó phân biệt khi mở nhiều trò trong các tab.
- **Tình trạng Cộng đồng.** Ở bản thiếu cấu hình backend, trang vẫn hiện “Chưa tìm thấy hoạt động công khai”. `app/community/page.tsx:7` và `app/community/page.tsx:29` cho thấy giao diện dùng cùng trạng thái rỗng khi chưa kết nối. Có thể nhầm giữa môi trường thiếu cấu hình và kết quả tìm kiếm thật.

## Phù hợp với giáo viên tiếng Anh Kids

Đánh giá theo nhiệm vụ đã chơi và yêu cầu kỹ năng trong [Cambridge English Young Learners](https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/) và [handbook cho giáo viên](https://www.cambridgeenglish.org/Images/357180-starters-movers-and-flyers-handbook-for-teachers-2024.pdf). Đây là đối chiếu dạng hoạt động. Không quan sát lớp học hay dùng dữ liệu học sinh để đánh giá hiệu quả.

| Nhóm | Dạng bài có thể tận dụng | Giới hạn có bằng chứng |
|---|---|---|
| **Kids / Pre A1 Starters** | Thẻ hai mặt, ghép cặp, xếp chữ và chọn đáp án có thể dùng để ôn từ ngắn theo chủ đề, với giáo viên hỗ trợ đọc hướng dẫn | Demo hiện dùng cặp chữ/số hoặc chữ/chữ. Không thấy tranh kích thích hoặc phát audio trong 12 demo. Chưa thấy bộ học liệu Starters trên các trang đã mở |
| **A1 Movers** | Điền từ, phân loại, xếp câu và thẻ nói có thể hỗ trợ ngữ pháp và hỏi đáp ngắn trong lớp | Thẻ nói chỉ hiện đề và nút tiếp tục, không thấy thu âm hoặc đánh giá bài nói. Quiz chỉ trả tổng điểm, không cho học sinh xem câu nào sai trong lượt thử |
| **A2 Flyers** | Xếp câu, điền từ và Quiz nhiều lựa chọn có thể dùng để ôn cấu trúc và đọc hiểu ngắn | Không quan sát phần đọc/viết dài, kể chuyện theo chuỗi tranh, nghe có âm thanh hay rubric nói trong mẫu demo. Chưa xác minh editor tạo được bài tiếng Anh hoàn chỉnh do luồng giáo viên bị chặn |

Các demo có vòng tương tác phù hợp để giáo viên xây dựng bài bổ trợ. Bằng chứng hiện có chưa đủ để nghiệm thu việc giao bài, theo dõi tiến bộ hoặc độ bao phủ đề thi bốn kỹ năng.

## Phần chưa hoàn thiện hoặc chưa nghiệm thu

- **Đã quan sát trực tiếp**. Các chức năng tài khoản bị vô hiệu hóa trong cấu hình hiện tại. Không có media nội dung trong 12 demo. Quiz demo thiếu phản hồi từng câu và không giữ câu đang làm qua reload.
- **Ghi trong hồ sơ dự án, chưa nghiệm thu trong lần này**. 22 mẫu nâng cao, media trong editor, PDF/XLSX, AI, lớp học, realtime và Admin còn trong phạm vi phát triển đã ghi nhận. [Danh sách hạn chế của dự án](LIMITATIONS.md).
- **Đóng gói**. ZIP gồm ảnh, dữ liệu quan sát đã lọc theo phạm vi audit, mã nguồn, migration, kiểm thử và tài liệu. Chỉ thu dữ liệu demo công khai và dùng UUID thử nghiệm. Không xuất database, profile trình duyệt, request body hay lịch sử đăng nhập. Giữ `.env.example` chứa biến mẫu. Mã ứng dụng được giữ nguyên.
