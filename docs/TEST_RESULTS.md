# Kết quả kiểm thử ngày 14/11/2026

## V1.6B Classroom và Student Progress · 28/11/2026

| Hạng mục | Kết quả |
|---|---|
| Kiểm tra mã nguồn | Lint, typecheck, production build và 93 bài Vitest đạt. Audit dependency runtime báo 0 advisory. |
| Migration | Kiểm thử PostgreSQL cục bộ đạt trước khi áp dụng vào QuizStudy. Lịch sử hosted có `20261127165941_classroom_roster.sql` và `20261127165946_classroom_assignments.sql`. Bốn bảng mới bật RLS và role ẩn danh không có quyền SELECT. |
| Lớp và hồ sơ | Playwright dùng giáo viên tổng hợp để tạo lớp, nhập CSV và XLSX, phân biệt hai hồ sơ cùng tên, nhân bản lớp với cùng hồ sơ và cấp mã riêng. |
| Giao bài và tiến độ | Giao Listening cả lớp, Speaking cho một học sinh, mở QR, phân biệt chưa làm/đang làm và giữ hai lượt đã nộp của cùng hồ sơ. Mã sai, mã của người ngoài danh sách, mã đã thu hồi và lượt vượt giới hạn đều bị từ chối. Kết quả tự động 0/5 giữ nguyên điểm 0. Speaking đi từ chờ chấm tới công bố 10/20. Hồ sơ hiển thị Part Cambridge và lịch sử từng lượt. |
| Quyền và báo cáo | Giáo viên khác nhận 404 với hồ sơ và tệp PDF/XLSX riêng. Đã mở lại Excel ba sheet để kiểm tra lọc ngày và kỹ năng, chấm tự động và rubric, ô điểm chờ chấm và XML không có công thức. Đã mở ba PDF A4, kiểm tra tiếng Việt và xác nhận ghi chú riêng chỉ có trong bản giáo viên. |
| Hồi quy | 23 lượt Playwright desktop đạt, gồm Flyers, giao bài ẩn danh từ Lesson Builder, điểm và đáp án, PDF, QR, CSV/XLSX V1.6A. |

Security Advisor vẫn liệt kê các cảnh báo cũ của `public.rls_auto_enable()`. Nghiệm thu dùng hồ sơ và bài làm tổng hợp trên QuizStudy. [Cảnh báo Advisor](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) · [Hướng dẫn lớp học](CLASSROOMS.md).

## V1.6A Teaching Tools · 27/11/2026

| Hạng mục | Kết quả |
|---|---|
| Lint, typecheck, Vitest và production build | Đạt. 90 bài Vitest. Audit dependency runtime báo 0 advisory. |
| Hồi quy Playwright | 163 lượt đạt, 5 lượt bỏ qua theo điều kiện của kịch bản. Chạy English Practice, Starters, Movers, Flyers và Teaching Tools trên Chromium desktop, mobile và tablet mô phỏng. |
| QuizStudy và phân quyền | Hai giáo viên thử nghiệm tổng hợp qua Auth. Kịch bản tạo bài giao Listening và Speaking, học sinh nộp, điểm tự động lưu 1/25, điểm Speaking đi từ chờ chấm đến công bố 10/20. Phiên ẩn danh được yêu cầu đăng nhập. Giáo viên khác nhận 404 khi truy cập PDF riêng của hoạt động, giáo án, bài giao và dữ liệu XLSX của chủ bài. |
| A1 · PDF | Từ Activity Editor, bài giao, giáo án đã lưu và mẫu cả ba cấp Cambridge. Tệp Flyers Listening A4 có 6 trang, đủ 25 câu và 30 đối tượng ảnh. Đã mở PDF và trích văn bản kiểm tra tiếng Việt, IPA, ngắt trang, đáp án và transcript tách riêng. Giáo án mẫu xuất 2 trang và giữ ghi chú của giáo viên trong bản PDF riêng. |
| A2 · QR | Trình duyệt sao chép link, tải PNG/SVG, trình chiếu và in. Giải mã riêng cả hai tệp và mở URL đã giải mã. Bản in A4 một trang có mã và URL. Cùng URL trả trạng thái đóng bài sau khi giáo viên đóng bài. |
| A3 · Excel | Tải tệp từ bộ lọc hai bài giao và một ngày. Đọc lại ba sheet, xác nhận khoảng ngày loại trừ dữ liệu, điểm tự động, điểm rubric, ô trống chờ chấm, trạng thái công bố và chi tiết đúng/sai. Biệt danh dạng `=1+1` giữ kiểu chữ. Kiểm tra XML của workbook xuất thật không có ô công thức. CSV chạy hồi quy. |
| Vercel | [Draft PR #9](https://github.com/Norman-IUH/san-choi/pull/9) dựa trên nhánh của PR #8. [Preview](https://san-choi-git-codex-v16a-teaching-tools-norman22.vercel.app) có kiểm tra Vercel thành công và yêu cầu xác thực Vercel với phiên ẩn danh. E2E dùng production build chạy cục bộ kết nối QuizStudy. |

Chưa kiểm tra máy in và camera vật lý. [Tệp QA cục bộ](../output/playwright/v16a-hosted) · [Hướng dẫn giáo viên](TEACHING_TOOLS.md).

## Kiểm thử ban đầu

| Lệnh | Kết quả |
|---|---|
| `npm run lint` | Đạt |
| `npm run typecheck` | Đạt |
| `npm test` | 18 đạt, gồm 12 luật mẫu, chuyển mẫu, điểm, CSV và migration/RLS |
| `npm run e2e` | 26 đạt trên Chromium desktop và Pixel 7 mô phỏng. Hai lượt kiểm thử có tài khoản bị bỏ qua |
| `npm run build` | Đạt |
| `npm audit --omit=dev` | 0 advisory tại thời điểm chạy |

PostgreSQL nhúng đã chạy migration và kiểm tra cấp workspace, cách ly hai giáo viên, chặn Student tạo hoạt động, quyền RPC, giữ nguyên điểm khi nộp trùng, từ chối nộp hết hạn, giữ snapshot và toàn vẹn thư mục. Kiểm thử này dùng mô hình role PostgreSQL tương ứng và hàm auth mô phỏng.

Kiểm thử Playwright với Supabase cần hai giáo viên trên một project hoạt động. Project hiện thấy đang INACTIVE. Supabase CLI trên máy Windows không khởi động được vì không tìm thấy Docker hoặc Podman. Chưa có bằng chứng chạy Auth/REST thực tế, email hoặc Google OAuth. Chưa chạy tải 100 học sinh hoặc triển khai production.

## V1.1 ngày 26/11/2026

| Kiểm thử | Kết quả |
|---|---|
| Lint, typecheck, production build | Đạt |
| Vitest | 18 đạt. Có schema, snapshot sau sửa hoạt động, cách ly RLS, điểm nộp trùng, từ chối sau hạn và các ngưỡng giới hạn lượt bắt đầu/nộp trên PostgreSQL nhúng |
| Playwright Chromium desktop và Pixel 7 mô phỏng | 32 đạt. Có 12 demo, focus, nhãn tiến độ, phản hồi Quiz, 44 px điều hướng mobile, favicon, metadata, trạng thái Cộng đồng thiếu backend và mã HTTP công khai |
| E2E Supabase hai giáo viên | Bỏ qua lượt desktop vì thiếu backend và thông tin tài khoản thử. Bản sao mobile của kịch bản này được thiết lập chỉ chạy desktop |

Production build trả 404 cho URL không khớp route, mẫu demo không tồn tại và các ID sai định dạng ở `/play` và `/resource`. Đã bỏ loading boundary cấp gốc để phản hồi 404 có thể được gửi trước khi stream. Chưa kiểm tra UUID tồn tại hoặc không tồn tại trên Supabase. Ảnh sau thay đổi tại [output/playwright/v1.1](../output/playwright/v1.1).

Project QuizStudy đang INACTIVE. Auth, PostgREST, RPC, RLS và việc áp dụng migration trên Supabase development vẫn chờ. [Các bước kết nối và nghiệm thu](UPGRADE_ROADMAP.md).

## Nghiệm thu QuizStudy ngày 26/11/2026

Mục này cập nhật trạng thái Supabase của lần kiểm tra V1.1 phía trên.

| Hạng mục | Kết quả thực tế |
|---|---|
| Project và biến môi trường | QuizStudy `ACTIVE_HEALTHY`. URL đúng project ref. Hai giá trị mẫu trong `.env.local` trả 401. Sau khi thay, Auth settings với publishable key và Auth Admin với server secret đều trả 200 |
| Dry run và migration | Schema ban đầu có bảng `public.quizzes` với 1 bản ghi, 0 tài khoản Auth và lịch sử migration trống. Chạy cả hai migration trong transaction, rollback và xác minh bảng mới chưa tồn tại. Sau khi áp dụng, đồng bộ metadata version của hai entry do connector tạo với tên file repo. Migration history khớp `20261114113207` và `20261126104943`. Bảng cũ vẫn có 1 bản ghi |
| Auth và mã lỗi | Auth logs ghi `/token` HTTP 400 `invalid_credentials` cho email thử chưa tồn tại và `/signup` HTTP 400 `email_address_invalid` cho địa chỉ ví dụ. Hai tài khoản thử tạo qua Auth Admin, mật khẩu ngẫu nhiên riêng và đã được xác nhận cho mục đích kiểm thử. Đăng nhập qua Auth API và qua UI đều đạt. Chưa xác nhận phát thư hoặc hoàn tất signup bằng hộp thư thực |
| PostgREST và RLS | RLS bật trên `profiles`, `workspaces`, `activities`, `assignments` và `attempts`, cùng các bảng mới khác. Hai giáo viên đọc đúng hồ sơ và workspace riêng. Anon đọc attempts bị từ chối với `42501`. Giáo viên thứ hai không mở được hoạt động và bài giao của giáo viên thứ nhất |
| Playwright với Supabase thật | 1/1 kịch bản desktop đạt. Tạo Quiz 10 câu, reload, giao bài, sửa nội dung gốc, học sinh ẩn danh làm đúng snapshot, lưu 10/10, giáo viên xem kết quả, tải CSV và đóng bài |
| RPC hosted | Transaction kiểm tra giữ nguyên điểm và bài làm khi nộp lại, từ chối sau hạn và chặn tại ngưỡng 180/240 lượt. Dữ liệu tạm trong transaction được rollback. Tài khoản và dữ liệu E2E được giữ lại trên development |
| Hồi quy sau sửa thông báo Auth | Hai lượt Playwright nhận đúng thông báo cho `invalid_credentials` và `email_address_invalid`. Lint, typecheck, 18 bài Vitest và production build với cấu hình thực đều đạt |

Advisor báo bảng rate-limit trong schema `private` bật RLS và không có policy cho người dùng thông thường, đúng với thiết kế chỉ server. Các cảnh báo khác liên quan hàm `public.rls_auto_enable()` có sẵn và thiết lập kiểm tra mật khẩu rò rỉ. Không thay đổi các cài đặt này trong đợt nghiệm thu. [Database linter](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) · [Password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## V1.2 cá nhân ngày 26/11/2026

- Lint, typecheck, production build và audit phụ thuộc runtime đạt. Vitest **25 bài**, gồm 12 luật mẫu cũ và schema, import, đáp án thay thế và quyền tham chiếu đường dẫn ảnh.
- Playwright public đạt **28 lượt** trên desktop và Pixel 7 mô phỏng, gồm bốn bộ tiếng Anh đổi giữa Flashcards/Match Up và 12 mẫu hiện hữu. Hai lượt riêng yêu cầu chế độ một giáo viên bị skip ở server development của lần chạy này.
- Một kịch bản Playwright editor đạt trên QuizStudy. Nhập XLSX và CSV, xem IPA, từ chối tệp giả PNG, tải PNG thật, lưu/xuất bản, reload, giao bài và xác nhận ảnh tải ở phía học sinh. URL không ký tới tệp riêng bị từ chối.
- Production build chạy với UUID của một giáo viên cho phép đúng tài khoản, chặn tài khoản development còn lại và ẩn nút đăng ký/Google OAuth. Hai tài khoản development được giữ lại. Chưa có project production riêng để kiểm tra chính sách signup của Supabase Auth ở môi trường đó.
- Dry run rollback và migration `20261126113225_teaching_media.sql` trên QuizStudy đạt. Bucket riêng tư, có hai policy Storage. Bản ghi trong bảng `quizzes` cũ vẫn còn.
- Ảnh màn hình nằm tại [output/playwright/v1.2](../output/playwright/v1.2). Kiểm tra 4G/5G còn chờ URL preview qua tài khoản hosting. Vercel CLI chưa đăng nhập, luồng preview tạm và fallback không cấp URL.
- V1.2 trên Vercel: phiên giáo viên tạo và xuất bản Quiz, giao qua link HTTPS. Một trình duyệt riêng, không đăng nhập, nộp bài 1/1. Giáo viên tải lại trang và thấy điểm, sau đó đóng bài giao kiểm thử.
- QuizStudy: Storage riêng tư, GET không ký trả 400, URL ký ngắn hạn tải được trước khi hết hạn và trả 400 sau khi hết hạn. Cấu hình Auth API ghi nhận Google tắt, đăng ký công khai vẫn bật. Cần tắt signup ở Supabase trước khi nghiệm thu production. HTTP production có HSTS và trang đăng nhập báo cache riêng tư/no-store.
- Thư viện mở rộng lên 20 từ và 40 clip tổng hợp offline bằng eSpeak NG (`en-gb`/`en-us`), phát trực tiếp từ bộ học liệu. Audio do giáo viên tải lên vẫn đi qua Storage riêng tư.
- Commit `2bd0671` được GitHub ghi nhận Vercel build thành công. [Vercel Preview V1.2](https://vercel.com/norman22/san-choi/HbvCA8DkvtCw1CiJUMxwPvgw8gk9).

## V1.3 Trải nghiệm trò chơi ngày 26/11/2026

| Kiểm thử | Kết quả |
|---|---|
| Lint, typecheck, Vitest, production build | Đạt. 25 bài Vitest, bao gồm các luật chấm điểm cũ và xác định mục sai từ kết quả đã lưu |
| `npm audit --omit=dev` | Không có advisory runtime tại thời điểm chạy |
| Playwright công khai | 57 đạt, 6 bỏ qua vì cần máy chủ chế độ một giáo viên hoặc không cấu hình Supabase. Kiểm thử 12 trò đến khi hoàn thành trên cả Chromium desktop 1920 × 1080, điện thoại 390 × 844 và tablet 820 × 1180. Có kiểm tra tràn ngang, phản hồi, bàn phím, kéo thả chuột/chạm, vòng quay, reduced motion và hai chế độ toàn màn hình |
| Migration QuizStudy | Chạy thử trong transaction và rollback. Sau khi áp dụng `20261126122018_assignment_answer_review.sql`, cả ba bài giao có sẵn giữ `show_review = false` |
| Playwright với QuizStudy | 1 kịch bản đạt. Tải lên hai âm UK/US, một ảnh và một âm phương án. Trình duyệt học sinh tải đủ ba tệp WAV riêng, thấy ảnh và tiếp tục đúng mục sau khi tải lại tab. Hai bài giao lưu 1/2. Chỉ bài bật tùy chọn cho phép xem đáp án, giáo viên thấy kết quả sau khi tải lại và đóng cả hai bài |
| Vercel Preview | Commit `0938fe8` báo deployment thành công. Mở bản preview trong phiên Edge có quyền, quay vòng ra chủ đề thật, thấy đủ bốn cấp độ và chạy được cả hai trình phát UK/US của bộ Kids. Phiên ẩn danh được chuyển tới đăng nhập Vercel. [Deployment](https://vercel.com/norman22/san-choi/EitUsuNKoG3DW99noyWQt9ta5DuG) · [PR #1](https://github.com/Norman-IUH/san-choi/pull/1) |

108 ảnh ứng với 12 trò, mỗi trò có ba trạng thái ở ba kích thước. [Ảnh Playwright](../output/playwright/v1.3).

Giới hạn nghiệm thu gồm thiết bị Apple và Android thật, loa và máy chiếu tại lớp, mạng di động và kiểm thử tải đồng thời. Do QuizStudy vẫn mở đăng ký trực tiếp qua Auth API, kết quả preview chưa được dùng để xác nhận toàn bộ cấu hình production.

## Kiểm tra phát hành V1.3 trước V1.4A

| Hạng mục | Kết quả |
|---|---|
| Đăng ký và khóa QuizStudy | Auth settings trả `disable_signup: false`. Auth Admin trả HTTP 200 cho khóa development khớp với khóa cũ từng chia sẻ. Hai điều kiện phát hành chưa đạt |
| Tài khoản giáo viên production | Phiên Edge đã đăng nhập vẫn mở được trang kết quả bài thử và thấy 1/1 sau khi tải lại. Chưa thực hiện đăng nhập mới bằng tài khoản production |
| Security Advisor | Cảnh báo quyền `EXECUTE` cho `anon` và `authenticated` trên `public.rls_auto_enable()` và bảo vệ mật khẩu rò rỉ đang tắt. `private.attempt_rate_limits` bật RLS, không có policy người dùng vì chỉ backend truy cập. [Database linter](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) · [Bảo vệ mật khẩu](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) |
| GitHub và Vercel | PR #1 vẫn là draft, preview thành công, production hiện tại vẫn tải được. Chưa có deployment V1.3 trên production |

Đối chiếu PostgreSQL catalog xác nhận `public.rls_auto_enable()` trả kiểu `event_trigger`, đang được event trigger sử dụng và hai role trên vẫn có quyền `EXECUTE`.

## Nền tảng và V1.4A

| Hạng mục | Kết quả |
|---|---|
| Lint, typecheck, build | Đạt. Production build sinh 20 trang demo |
| Vitest | 37 đạt, gồm 20 mẫu, cấu trúc ô chữ, dò từ theo hai hướng, Hangman và tương thích khi đổi mẫu |
| Playwright Chromium | 81 đạt. Kiểm tra 20 demo từ bắt đầu đến kết quả trên desktop, điện thoại và tablet mô phỏng. Sáu lượt yêu cầu chế độ một giáo viên hoặc backend không cấu hình được bỏ qua trong lần chạy này |
| Playwright với QuizStudy thật | 8/8 mẫu mới đi qua editor, xuất bản, preview, giao bài, nộp và hiển thị điểm cho giáo viên. Truy vấn riêng các bài thử xác nhận đủ tám mẫu có điểm tối đa, và các link giao bài đã đóng |
| Gia hạn media | Kịch bản riêng với Storage thật đạt. Playwright buộc yêu cầu ảnh đầu tiên trả 400 để mô phỏng URL hết hạn. Player xin URL ký mới và tải thành công tệp thật trong cùng lượt làm bài |
| Audit npm runtime | Không có advisory tại thời điểm chạy |

Các giới hạn còn lại gồm WebKit và thiết bị thật, máy chiếu lớp học, và kiểm thử nhiều học sinh đồng thời. Hai nhóm V1.4B và V1.4C nằm ngoài đợt này.

## Rà soát bảo mật trước khi phát hành 20 mẫu

- Dashboard và Auth API của QuizStudy xác nhận đăng ký công khai đã tắt (`disable_signup: true`), Google vẫn tắt. Khóa từng được chia sẻ vẫn là rủi ro chưa xử lý. Việc thay hoặc thu hồi khóa cần quyết định riêng của chủ dự án. [Supabase Auth](https://supabase.com/docs/guides/auth/general-configuration).
- Migration `20261126155849_secure_game_sessions.sql` đã chạy thử và rollback trước khi áp dụng trên QuizStudy. Hangman lưu lượt đoán cho từng mục và lượt làm, dừng ở sáu lỗi. Việc chấm điểm dùng lịch sử từ máy chủ. Cấp lại signed URL có ngân sách riêng 30 lượt/phút và xác minh bài còn mở, chưa hết hạn, lượt làm chưa hoàn thành. URL mới có thời hạn 15 phút.
- Kiểm thử PostgreSQL nhúng đạt cho tải lại trạng thái lượt đoán, lọc dữ liệu sai, đoán trùng, khóa lượt đoán sau giới hạn hoặc sau khi đóng bài, và giữ điểm gốc khi yêu cầu nộp lặp.

## V1.4B — 27 mẫu trên nhánh review

| Hạng mục | Kết quả |
|---|---|
| Lint, typecheck, Vitest, build, audit | Đạt. 47 Vitest gồm từng mẫu. Production build sinh 27 demo. `npm audit --omit=dev` trả 0 advisory |
| E2E QuizStudy | 17 lượt đạt, gồm 7 mẫu mới, 8 mẫu V1.4A, kiểm thử media và thử lại khi mất phản hồi nộp. Sáu mẫu mới có điểm lưu `1/2`. Flip Tiles lưu một lượt hoàn thành. Bảy bài giao mới đã đóng |
| Hồi quy Chromium | 102 lượt đạt trên production build ở kích thước desktop, điện thoại và tablet. Sáu lượt dành riêng cho cấu hình một giáo viên hoặc thiếu Supabase được bỏ qua trong lượt chạy này |
| Hồi quy WebKit | 56 lượt đạt trên hai cấu hình Desktop Safari và iPhone 13 mô phỏng, gồm các demo cũ, các mẫu từ vựng và bảy câu đố mới |
| Lỗi mạng, nộp lại và kết quả | Playwright cắt phản hồi sau khi máy chủ nhận bài sai, rồi gửi lại đáp án khác qua UI. Giáo viên vẫn thấy đúng một kết quả `0/1` đã lưu ban đầu |
| Quyền cấp lại signed URL | Đạt khi kiểm tra trên QuizStudy với bài đã đóng, đã hết hạn và lượt đã nộp. Player từ chối yêu cầu cấp URL mới trong cả ba trường hợp. URL đã cấp trước đó hết hiệu lực theo TTL của Storage |
| Vercel Preview | Commit `6de8207` lên Preview thành công. Thử Image Quiz có một câu đúng, một câu sai, và xác nhận kết quả `1/2` cùng phần xem lại. [Draft PR #3](https://github.com/Norman-IUH/san-choi/pull/3) · [Vercel Preview](https://san-choi-git-codex-v14b-puzzle-games-norman22.vercel.app/demo/image-quiz) |

Ảnh dùng trong thư viện được tạo từ gameplay Playwright. [Ảnh kiểm thử V1.4B](../output/playwright/v14b-gameplay). Phần WebKit là browser engine và profile mô phỏng. Thiết bị iOS, Android và máy chiếu thật vẫn chờ kiểm tra.

## V1.4C — 34 mẫu trên nhánh review

| Hạng mục | Kết quả |
|---|---|
| Lint, typecheck, Vitest và build | Đạt. 59 Vitest. Production build render sẵn 34 trang demo |
| Playwright Chromium | 126 lượt đạt trên desktop 1920 × 1080, điện thoại 390 × 844 và tablet 820 × 1180. Hồi quy 27 mẫu hiện có và bảy mẫu arcade. Sáu lượt dành cho cấu hình riêng được bỏ qua trong lần chạy này |
| Playwright WebKit | 72 lượt đạt trên Desktop Safari và iPhone 13 mô phỏng. Các arcade đã chơi qua câu sai và câu đúng, pause/resume khi mất focus, fullscreen, reduced motion và replay |
| Luật arcade | Unit test kiểm tra tường mê cung, va chạm máy bay ở nhịp khung hình thấp, vùng chạm bóng, chuột chũi đang ẩn, countdown, pause và cách tính điểm thử sức |
| Lazy loading | Chromium theo dõi request của production build. Cả tám trang thử chỉ tải Phaser sau nút Bắt đầu ở năm game canvas. Quiz, Speed Sorting và Win or Lose Quiz không gửi request Phaser |
| Supabase QuizStudy | 7/7 mẫu qua editor, xuất bản, preview, tạo bài giao có hạn nộp, nộp đúng/sai và tải lại bảng kết quả. Sáu mẫu lưu `1/2`. Win or Lose Quiz lưu `2/3`. Các bài giao thử đã đóng |
| Ảnh riêng tư trong canvas | Maze Chase tự tải lại ảnh đáp án từ Storage sau khi yêu cầu signed URL đầu tiên được mô phỏng hết hạn. Học sinh tiếp tục và nộp bài trong cùng lượt |
| Khôi phục và nộp lại | Speed Sorting giữ câu đã làm qua một lần tải lại. Với Win or Lose Quiz, Playwright chặn phản hồi sau khi Supabase nhận bài. Lượt nộp lại giữ nguyên một kết quả `2/3` |
| Audit npm | Runtime có 0 advisory. Audit đầy đủ báo 7 mục mức vừa từ chuỗi phụ thuộc `typescript-eslint` và `minimatch` đã có trên nhánh V1.4B. [Advisory minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249) |

105 ảnh toàn trang lưu Start, Playing và Result của bảy mẫu trên năm cấu hình trình duyệt. Thiết bị thật và máy chiếu lớp học vẫn chờ kiểm tra. [Ảnh kiểm thử V1.4C](../output/playwright/v14c-gameplay).

Đăng ký công khai của QuizStudy đã tắt theo lần xác minh ở đợt phát hành trước. Khóa bí mật từng được chia sẻ vẫn là rủi ro bảo mật chưa xử lý. Đợt này giữ nguyên khóa và tài khoản giáo viên hiện tại. V1.4C dành cho review trên nhánh riêng.

## V1.4D — Premium Visual Polish

| Hạng mục | Kết quả |
|---|---|
| Baseline V1.4C | Commit `98ae902`, 108 lượt Playwright qua 34 trò trên desktop, tablet và mobile. Lưu 306 ảnh Start, Playing và Result |
| Lint, typecheck, unit test và production build | Đạt. 59 Vitest và 34 trang demo render sẵn |
| Playwright Chromium | 143 lượt đạt. Bảy lượt theo cấu hình riêng hoặc chỉ dành cho thiết bị chạm được bỏ qua theo profile. So sánh chín ảnh chuẩn HUD của Quiz, Flip Tiles và Maze Chase. Kiểm tra thêm thư viện tải ảnh theo vùng nhìn, kéo Rank Order bằng chạm và chế độ trình chiếu thẻ ghi nhớ |
| Playwright WebKit | 82 lượt đạt trên Desktop Safari và iPhone 13 mô phỏng. Hai lượt dùng CDP để kéo thả cảm ứng được chạy trong bộ Chromium |
| E2E QuizStudy | 23 lượt đạt. Ba nhóm editor, preview, giao và lưu kết quả V1.4A/B/C cùng luồng ảnh, audio UK/US và quyền xem câu sai của Quiz. Dùng tài khoản và bài thử riêng |
| Lỗi mạng | Kiểm tra lại nộp lặp sau khi mất phản hồi và cấp lại signed URL trong cùng lượt, kể cả ảnh trong canvas |
| Audit npm | Runtime 0 cảnh báo. Audit đầy đủ còn 7 mục mức vừa thuộc chuỗi phụ thuộc phát triển TypeScript ESLint và minimatch. [Advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249) |

612 ảnh Before và After dùng cùng ba viewport desktop 1920 × 1080, tablet 820 × 1180 và mobile 390 × 844. Mỗi mẫu có ảnh Start, Playing và Result. Ma trận ảnh dùng dữ liệu demo. Thiết bị thật và máy chiếu lớp học vẫn chờ xác minh.

Đợt này giữ nguyên cấu hình API và tài khoản giáo viên. Khóa bí mật từng lộ vẫn là rủi ro bảo mật chưa xử lý.

## V1.5A — Thư viện học liệu tiếng Anh

| Hạng mục | Kết quả |
|---|---|
| Danh mục và chuyển đổi | 440 mục, 110 ở mỗi nhóm. Unit test kiểm tra ID duy nhất, bốn bài mở đầu, chuyển đổi và chấm điểm, quy tắc tương thích và CSV |
| Kiểm tra mã và hồi quy Chromium | Lint, typecheck, build và 62 Vitest đạt. 143 Playwright Chromium đạt. Bảy lượt cần cấu hình hoặc profile riêng được bỏ qua |
| Hồi quy WebKit | 84 lượt đạt trên Desktop Safari và iPhone mô phỏng. Bốn lượt dành cho cấu hình hoặc trình duyệt khác được bỏ qua |
| Hồi quy editor cũ | Một lượt hosted đạt cho nhập XLSX/CSV trực tiếp trong Flashcards, tải ảnh thật, mở bài giao và xác nhận học sinh nhận bản chụp có câu ví dụ |
| Bộ kiểm thử hosted mới | 10 lượt đạt, gồm bốn bài giao, một luồng import/export và media, năm lượt tìm/lọc trên desktop Chromium, mobile, tablet, Desktop Safari và iPhone mô phỏng |
| Migration | `20261127021107_english_learning_library.sql` chạy thử trên PostgreSQL nhúng trước khi áp dụng trên QuizStudy. Hoạt động có từ trước vẫn đọc được. Hai bảng mới bật RLS. Vai trò ẩn danh không có quyền đọc. Khóa ngoại theo chủ sở hữu ngăn gắn lesson của workspace khác. [Nguyên tắc cấp quyền Data API của Supabase](https://supabase.com/docs/guides/api/securing-your-api) |
| Bài giao thử | Kids, Pre A1 Starters, A1 Movers và A2 Flyers đều xem trước được Flashcards và dùng cùng bài học để soạn Quiz. Bốn bài giao đều lưu `4/5` với một câu sai. Sửa nguồn Kids sau khi giao vẫn để học sinh làm đủ năm mục. Chế độ ẩn câu sai của bài giao được giữ. Bốn bài thử đã đóng |
| Import và media | CSV, XLSX, cập nhật chủ đề cho nhóm từ và xuất CSV đạt trên dữ liệu thử. Tệp ảnh và phát âm tải lên đi qua Storage. Ảnh tải được bằng signed URL. URL không ký bị từ chối. CSV không chứa signed URL |

20 từ trong bốn bài mở đầu có IPA, câu ví dụ và audio Anh–Anh, Anh–Mỹ tổng hợp có sẵn. Từ còn lại có từ, nghĩa tiếng Việt, từ loại và chủ đề. Phân cấp phục vụ nội bộ. Đánh giá lớp học trên thiết bị thật, nội dung luyện theo phần thi và chấm thủ công thuộc công việc sau V1.5A.

## V1.5B1 — Luyện nghe và ngữ âm

| Hạng mục | Kết quả |
|---|---|
| Lint, typecheck, build và Vitest | Đạt. 65 Vitest, gồm schema Practice v1, chấm đúng, sai, bỏ trống, đáp án thay thế, giữ transcript ngoài payload mặc định và kiểm tra sự tồn tại của tệp audio |
| Chromium và WebKit | Hồi quy 34 mẫu đạt 143 lượt Chromium và 84 lượt WebKit. Bảy lượt Chromium và bốn lượt WebKit dành cho profile hoặc cấu hình khác được bỏ qua |
| QuizStudy thật | Sáu lượt Chromium và một lượt WebKit đạt. Năm dạng Listening cùng Rhyming Words đi qua editor, giao bài, phát clip chậm, giới hạn nghe và lưu điểm. Dictation chấp nhận biến thể bỏ dấu chấm. Dialogue lưu câu sai 0/1 |
| Đáp án và media | Playwright kiểm tra phản hồi bắt đầu trong Chromium. Payload không có trường đáp án, câu dictation và transcript chưa bật. URL ký lỗi mô phỏng trong Rhyming Words được cấp lại và audio thật phát được |
| Thư viện và migration | Một lượt QuizStudy đạt cho CSV/XLSX, ảnh riêng tư, xuất CSV, lưu trữ từ và xác nhận lesson cũ vẫn đọc được. Migration `20261127022933_vocabulary_archive.sql` được chạy thử trong PostgreSQL nhúng rồi áp dụng trên QuizStudy |

B1 thêm 16 mục có IPA, ví dụ và audio cả hai giọng, nâng tổng lên 36/440. Năm clip Listening dùng nội dung gốc và eSpeak NG offline. Sáu dạng phonics có mẫu soạn, yêu cầu giáo viên kiểm tra bản ghi trước khi xuất bản. Lượt Rhyming Words dùng clip thử tổng hợp và không phải đánh giá ngữ âm ngoài lớp. [Báo cáo độ phủ](VOCABULARY_COVERAGE.md)

Kiểm thử dùng tài khoản và dữ liệu riêng. Giới hạn nghe vận hành trong trình duyệt. Đánh giá thiết bị thật và chất lượng bản ghi ngữ âm trong lớp vẫn chờ.

## V1.5B2 — Reading, Grammar và Lesson Builder · 27/11/2026

| Hạng mục | Kết quả |
|---|---|
| Kiểm tra mã | Lint, typecheck, production build và 70 Vitest đạt. `npm audit --omit=dev` báo 0 advisory. `npm run vocabulary:check` xác nhận báo cáo khớp 440 mục và 194 mục bổ sung. |
| Hồi quy 34 mẫu game | 180 lượt đạt trên Chromium desktop, mobile, tablet và WebKit desktop, iPhone mô phỏng. Bộ chạy tập trung gồm demo, vòng chơi word, puzzle và arcade. |
| Hồi quy điều khiển | 25 lượt đạt sau khi chạy lại focus, tiến độ, chọn thẻ, giảm chuyển động, toàn màn hình và xem lại câu sai. Năm lượt cộng đồng yêu cầu server chưa cấu hình Supabase được bỏ qua. |
| Listening và Phonics trên QuizStudy | Kiểm tra đủ năm Listening và sáu Phonics trên Chromium bằng clip thử. Có ảnh lựa chọn tải lên, xóa EXIF, nhãn trung tính, bảng ghép, vùng tô và cấp lại URL clip. Dictation chạy lại trên WebKit đạt. Bản ghi thử Phonics phục vụ kiểm tra luồng kỹ thuật. |
| Reading trên QuizStudy | Chromium và WebKit đạt. Cả hai câu dùng cùng đoạn văn. Học sinh mở lại đoạn văn ở khung 390 × 844 và nộp 1/2. Sửa đoạn văn nguồn sau khi giao không ảnh hưởng bài làm. HTML và phản hồi bắt đầu không có ghi chú riêng hoặc lời giải. |
| Grammar trên QuizStudy | Chromium và WebKit đạt. Dạng Have got ghi đúng 1/1 cho dạng rút gọn, 0/1 cho dạng sai và chỉ hiện giải thích sau nộp khi bật xem lại. Kiểm tra trên khung 820 × 1180. |
| Giáo án trên QuizStudy | Tạo từ mẫu, thêm/bỏ bước, đổi thứ tự bằng bàn phím và kéo thả Chromium, lưu nháp, reload, nhân bản, trình chiếu, vào/thoát fullscreen và tạo bài giao riêng cho một hoạt động. Kết quả gắn với đúng bước. Giáo viên thứ hai nhận 404. |
| Hồi quy thư viện trên QuizStudy | Sáu lượt Chromium đạt, gồm bốn cấp độ, dùng lại Vocabulary Lesson để tạo bài giao, CSV/XLSX, lưu trữ, media và bộ lọc. |
| Migration | `20261127064352_lesson_builder.sql` qua kiểm tra trên PostgreSQL nhúng với schema và dữ liệu fixture cũ. Kiểm tra schema QuizStudy trước khi áp dụng cho thấy không có dòng lesson xung đột. Sau khi áp dụng, xác nhận migration có trong lịch sử, index mới tồn tại và RLS vẫn bật trên lesson và assignments. |
| Vercel Preview | GitHub checks của PR #7 báo deployment hoàn thành. Khi kiểm tra bằng phiên khách, đường dẫn giáo án yêu cầu đăng nhập Vercel. E2E có đăng nhập chạy trên app cục bộ nối QuizStudy. |

Hai tài khoản QA dùng biệt danh và bài giao tổng hợp. Ảnh Playwright của màn Reading và Presentation nằm trong `output/playwright/v15b2-lesson-final`. Giáo án mẫu kiểm tra đủ năm hoạt động và liên kết từ vựng ở cả bốn cấp độ bằng Vitest.

Trong lượt chạy tổng hợp ban đầu, một số kiểm thử bắt được thay đổi cấu trúc DOM của Player và lỗi focus khi nạp renderer. Bộ hồi quy trên đã chạy lại sau khi sửa cấu trúc. WebKit trên máy Windows thử nghiệm thiếu `AudioContext`, nên nút âm hiệu được vô hiệu hóa. Audio bài nghe qua trình phát HTML đã phát được trong Dictation. Bảng ghép trên WebKit được kiểm tra bằng chọn thẻ, chạm và bàn phím.

Chất lượng IPA, ví dụ, clip tổng hợp và phát âm Phonics cần lượt duyệt của giáo viên. Đánh giá trên phần cứng lớp học và thiết bị thật chưa chạy. Rủi ro khóa bí mật đã lộ tiếp tục là cổng phát hành.

## V1.5B3 — Speaking, Writing và chấm thủ công · 27/11/2026

| Hạng mục | Kết quả |
|---|---|
| Kiểm tra mã | 75 Vitest, lint, typecheck, production build và kiểm tra độ phủ đều đạt. `npm audit --omit=dev` ghi nhận 0 cảnh báo. Audit toàn bộ báo 7 mục moderate trên chuỗi `minimatch` của ESLint. Cùng kết quả xuất hiện khi audit lockfile tại baseline `31831db`. |
| Hồi quy game | 180 lượt đạt cho 34 mẫu trên Chromium desktop, mobile, tablet, WebKit desktop và iPhone mô phỏng. |
| Writing và chấm thủ công | Chromium và WebKit đạt luồng tự lưu nháp, nộp bài, giữ rubric gốc sau sửa nguồn, lưu riêng nhận xét, công bố, sửa điểm từ 20/20 xuống 18/20 và kiểm tra quyền giáo viên thứ hai. Chromium chấm đúng biến thể, câu sai và câu trống. PostgreSQL nhúng xác nhận nộp trùng giữ câu trả lời gốc. |
| Speaking và Storage | Chromium và WebKit đạt upload fixture WAV, chặn tệp giả MIME và quá 2 MB, loại phiên không hợp lệ, tải lại, xóa và chấm trực tiếp. Endpoint phát được kiểm tra với yêu cầu Range và chặn yêu cầu mới sau khi xóa. Fixture WebM Opus, MP4 AAC và MP4 Opus được tạo từ tín hiệu tổng hợp bằng Chromium và qua parser trong Vitest. |
| Duyệt từ vựng | Chromium đạt tạo mục riêng, ghi nhận xét, đổi trạng thái, lọc và hủy trạng thái duyệt sau khi sửa ví dụ. Giáo viên thứ hai không đọc được mục riêng. Báo cáo repo giữ số liệu độ phủ kỹ thuật. |
| Giáo án | Vitest kiểm tra tám bộ mẫu, gồm bốn mẫu Speaking và Writing. Chromium kiểm tra trình chiếu đề hai ảnh, đồng hồ chuẩn bị, chặn giao bài ở bản nháp và tạo assignment khi giáo án đã sẵn sàng. |
| QuizStudy | Ba migration `20261127071851`, `20261127072702` và `20261127111628` đã vào lịch sử. Kiểm tra xác nhận ba bảng mới bật RLS, bucket `practice-voice` ở chế độ riêng tư, và guest và giáo viên bị giới hạn theo quyền trực tiếp đã thiết kế. |

Tổng cộng bảy lượt E2E QuizStudy đạt qua lần chạy lại và ca giáo án kiểm tra riêng. Ba lượt WebKit được skip vì các ca Writing khách quan, duyệt từ vựng và tích hợp giáo án chạy theo profile Chromium. Tất cả dữ liệu kiểm thử là tổng hợp. Kiểm thử microphone vật lý và xác nhận sau đăng nhập trên Vercel Preview vẫn chờ. Ghi âm cho học sinh thật mặc định tắt.

## V1.5C1 — Cambridge Pre A1 Starters · 27/11/2026

| Hạng mục | Kết quả |
|---|---|
| Mã và học liệu | 79 Vitest, lint, typecheck và production build đạt. Vitest kiểm tra cấu trúc, điểm đúng/sai/trống, media đi kèm và dữ liệu gửi tới người làm bài. |
| Practice Mode | Playwright chạy đủ 13 Part với Chromium desktop, mobile, tablet, WebKit desktop và iPhone mô phỏng. Các bài nghe kiểm tra phát media thật. Các Part Speaking kiểm tra thao tác và xác nhận giao diện không yêu cầu microphone. |
| Mock Test Mode | Playwright kiểm tra ba kỹ năng, giữ giới hạn hai lượt nghe khi đổi câu, quay lại câu trước, nộp khi hết giờ, giấu phản hồi đúng/sai trong lượt làm và chạy đủ bốn Part Speaking. |
| Hồi quy và giao diện | Chạy bộ 34 mẫu game và bốn bộ từ vựng. Lượt đầu phát hiện đường dẫn Cambridge mới trùng bộ từ vựng Starters. Bộ Cambridge dùng `/samples/cambridge-starters` sau khi sửa. Ảnh 1920 × 1080 và 390 × 844 của thư viện và các màn tiêu biểu nằm trong `output/playwright/v15c1-screens`. Lượt kiểm tra bàn phím xác nhận Space chọn ghim, Enter sang câu và focus chuyển sang câu hỏi mới. |
| QuizStudy thật | 3 E2E desktop đạt từ bản build chạy localhost. Kiểm tra nhập hoạt động, giao cả ba bài thi thử, lưu 1/20 Listening và 1/25 Reading & Writing, nhận bài Speaking, công bố nhận xét cho đúng phiên học sinh và xuất CSV. Chỉ dùng tài khoản và biệt danh tổng hợp. Đã đóng các bài giao QA. |
| Vercel Preview | [PR #8 dạng draft](https://github.com/Norman-IUH/san-choi/pull/8) dựa trên nhánh V1.5B3. GitHub ghi nhận Vercel Preview Ready cho commit triển khai. Playwright phiên khách được chuyển đến màn đăng nhập Vercel. Kiểm tra giao diện sau xác thực chưa thực hiện. |

Tổng lượt Playwright công khai và hồi quy đạt 265 ca. Năm lượt kiểm tra cấu hình single-teacher bỏ qua vì máy chủ localhost dùng cấu hình QA. Chạy riêng ba ca QuizStudy cũng đạt. Phiên bản này giữ cấu hình và schema QuizStudy hiện tại. Lượt QA tắt ghi âm. Phần Speaking cần giáo viên tham gia. [Đặc tả và giới hạn mô phỏng](STARTERS.md).

## V1.5C2 — Cambridge A1 Movers · 27/11/2026

| Hạng mục | Kết quả |
|---|---|
| Mã và học liệu | 82 Vitest. Lint, typecheck và production build đạt. Các ca mới kiểm tra cấu trúc, điểm đúng/sai/trống, đáp án số tương đương, tệp hình và audio, câu viết chấm tay và việc loại kịch bản giám khảo khỏi dữ liệu công khai. |
| 15 Part và hồi quy | 235 ca Playwright công khai đạt trên Chromium desktop, mobile, tablet, WebKit desktop và iPhone mô phỏng. Phạm vi gồm toàn bộ Movers và Starters, bốn bộ từ vựng và game cơ bản. Năm ca kiểm tra cấu hình single-teacher bỏ qua trong môi trường QA nhiều giáo viên. |
| Mock Test | Xác minh giới hạn hai lượt bắt đầu phát, audio phát thật, lưu lựa chọn khi quay lại, các mốc 25/30/7 phút và tự nộp khi hết giờ trong Playwright. Một lần tự nộp trên QuizStudy trong lượt tua đồng hồ trả lỗi. Player cho nộp lại khi hết giờ và giữ nguyên câu trả lời. |
| QuizStudy · Listening | Nhập và giao bộ đề. Sau khi sửa nguồn, bài giao vẫn lấy câu đầu từ snapshot. Tải lại giữ ghim và lượt nghe. Nộp và lưu 1/25 điểm. |
| QuizStudy · Reading & Writing | Bài giao giữ rubric gốc sau khi sửa nguồn. Lưu 1/33 câu tự động và hai câu viết. Giáo viên chấm 1/2 câu mở, công bố tổng 2/35 và xuất CSV có điểm tự động, thủ công và trạng thái. |
| QuizStudy · Speaking | Làm đủ bốn Part qua link với ghi âm tắt. Giáo viên thấy hướng dẫn riêng, chấm và công bố 15/20 kèm nhận xét. Đã kiểm tra CSV và việc phiên khác không mở được nhận xét. |
| Quyền và giao diện | Giáo viên thứ hai bị chặn ở kết quả và CSV. Ảnh tại `output/playwright/v15c2-screens` ghi nhận sáu màn ở 1920 × 1080 và 390 × 844, không tràn ngang ở các màn đã chụp. |
| Vercel Preview | [Draft PR #8](https://github.com/Norman-IUH/san-choi/pull/8) giữ nhánh và base hiện có. Vercel báo Preview Ready. Phiên Playwright khách được chuyển tới đăng nhập Vercel, nên chưa kiểm tra giao diện sau xác thực trên Preview. E2E chạy ở localhost với QuizStudy thật. |

Tất cả lượt kiểm tra dùng tài khoản và biệt danh tổng hợp. Cấu hình API, schema QuizStudy và thiết lập ghi âm production giữ nguyên. [Ánh xạ Paper-based](CAMBRIDGE_SPEC.md).

## V1.5C3 — Cambridge A2 Flyers · 27/11/2026

| Hạng mục | Kết quả |
|---|---|
| Kiểm tra mã | 85 Vitest, lint, typecheck, production build đạt. Unit test kiểm tra cấu trúc, số câu, audio và tranh, chấm tự động đúng/sai/trống, bài viết tay và quyền truy cập kịch bản giám khảo. |
| Playwright | 260 ca Cambridge và từ vựng đạt trên Chromium desktop, mobile, tablet, WebKit desktop và iPhone mô phỏng sau khi chạy lại ca đồng hồ Safari với mốc hết giờ được so sánh trực tiếp. Năm ca chỉ dành cho cấu hình single-teacher được bỏ qua trên máy chủ QA. Thêm 13 ca demo cơ bản đạt trên desktop. |
| Dashboard, thiết bị và thời gian | Kiểm tra 44 link Part, chín bài thi thử, ba mốc Flyers 25/40/9 phút, hai lượt phát và khôi phục đồng hồ, đáp án, lượt nghe sau tải lại. Tám ảnh desktop và mobile trong `output/playwright/v15c3-screens`; các màn chụp không tràn ngang. |
| QuizStudy · Listening | Nhân bản bộ đề, xuất bản bản nháp rồi giao. Bài giao giữ đề cũ sau khi sửa nguồn. Chặn yêu cầu tự nộp lúc hết giờ trước khi máy chủ nhận. Khi có mạng, tải lại cùng tab giữ bản làm và lưu đúng một lượt với 1/25 điểm. Đã kiểm tra xuất CSV và quyền giáo viên thứ hai. |
| QuizStudy · Reading & Writing | Sửa rubric nguồn sau khi giao. Giữ nguyên rubric snapshot và nội dung truyện qua một phản hồi nộp bài bị ngắt sau khi máy chủ lưu. Tải lại nhận đúng một lượt, hiển thị 1/43 tự động. Giáo viên công bố 3/5 thủ công, tổng 4/48, rồi xuất CSV. |
| QuizStudy · Speaking | Làm đủ bốn Part, kiểm tra hai vai Information Exchange. Kịch bản và đáp án giám khảo thuộc bản riêng của giáo viên. Công bố 15/20 và kiểm tra CSV, quyền chủ bài và quyền nhận xét theo cookie. |
| Preview | [Draft PR #8](https://github.com/Norman-IUH/san-choi/pull/8) giữ nhánh review. GitHub ghi nhận Vercel Preview Ready. Trình duyệt khách được chuyển tới đăng nhập Vercel. Các E2E ứng dụng chạy trên bản build localhost nối QuizStudy thật. |

Bốn E2E QuizStudy đạt qua các lượt chạy xác nhận, gồm ba thành phần Flyers và hồi quy Listening Movers. Lượt QA chỉ dùng dữ liệu tổng hợp và tắt ghi âm. Phiên bản này dùng schema hiện có. [Đặc tả và giới hạn mô phỏng](CAMBRIDGE_SPEC.md).
