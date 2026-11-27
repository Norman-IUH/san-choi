# Lộ trình nâng cấp Sân Chơi

## Milestones và cổng nghiệm thu

| Phiên bản | Trạng thái | Cổng nghiệm thu và kiểm thử |
|---|---|---|
| V1.1 Foundation | Đạt luồng cốt lõi | QuizStudy đã nghiệm thu Auth, PostgREST, RLS, RPC, snapshot, deadline, nộp trùng, giới hạn tần suất và CSV. Xử lý cảnh báo bảo mật khi chuẩn bị production. |
| V1.2 Một giáo viên và English Content Engine | Luồng chính đạt trên Vercel | Tạo bài, giao bài, nộp và lưu điểm đã chạy trên production. Preview bổ sung 20 từ, 40 audio UK/US và media phương án. QuizStudy đã tắt đăng ký trực tiếp. |
| V1.3 Nâng cấp 12 trò | Triển khai trên nhánh review | 12 sân khấu riêng, toàn màn hình, kéo thả, hiệu ứng và xem lại theo tùy chọn khi giao bài. Kiểm thử trên ba kích thước Chromium và bài giao QuizStudy. Xem kết quả và giới hạn thiết bị bên dưới. |
| V1.4A Nền tảng và 8 trò từ vựng | Nhánh review, 20 mẫu tổng cộng | Registry, tải renderer theo nhu cầu, URL media ký lại theo quyền và tám trải nghiệm có editor, demo, giao bài và kiểm thử. |
| V1.4B 7 câu đố tương tác | Nhánh review, 27 mẫu tổng cộng | Labelled Diagram, Flip Tiles, Rank Order, Pair or No Pair, Image Quiz, Watch and Memorize, Maths Generator. |
| V1.4C 7 trò arcade | Nhánh review, 34 mẫu tổng cộng | Hai nhóm C1 và C2, đủ bảy vòng chơi. Năm trò tải Phaser theo nhu cầu. Hai trò lượt rời rạc giữ HTML. |
| Visual Polish cho 34 mẫu | Đề xuất sau V1.4C | So sánh ảnh Start, Playing, Result. Ưu tiên màn chơi lớp học, chữ trên di động, phản hồi, độ tương phản và điều khiển chạm. |
| V1.5 English Practice và Cambridge YLE | Not Started | Đối chiếu tài liệu Cambridge. Kiểm thử từng kỹ năng và từng phần, gồm rubric giáo viên, bài luyện gốc và quyền truy cập bản ghi âm. |
| V1.6 Teaching Tools và lớp học | Not Started | Vocabulary Bank, Lesson Library, QR, PDF/đáp án, Excel, AI tùy chọn, roster và tiến độ. Kiểm tra phân quyền và cách ly giữa các lớp. |
| V2.0 Production | Not Started | Backup và rollback, audit bảo mật, kiểm thử tải, preview từ mạng di động và triển khai HTTPS với project production riêng. |

## Khôi phục kết nối Supabase development

Ngày 26/11/2026, connector xác nhận **QuizStudy** (`unarohbxeqzsqcyyxveo`) đang `ACTIVE_HEALTHY`. `.env.local` đã xác thực được bằng cả hai loại khóa. Lịch sử migration của các lần nghiệm thu khớp với repo. Các bước dưới đây dùng để cài đặt lại trên máy khác hoặc kết nối development mới. [Kết quả nghiệm thu](TEST_RESULTS.md).

1. Nếu QuizStudy là project development định dùng, mở Project Overview, chọn **Resume project** nếu dashboard có nút và chờ trạng thái hoạt động. Nếu QuizStudy dùng cho mục đích khác, xác định một project development riêng. [Dashboard QuizStudy](https://supabase.com/dashboard/project/unarohbxeqzsqcyyxveo) · [Tài liệu khôi phục project](https://supabase.com/docs/guides/platform/free-project-pausing).
2. Sao chép `.env.example` sang `.env.local`. Lấy Project URL từ Connect và khóa từ Settings → API Keys. Điền `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` và đặt `APP_URL=http://localhost:3000`. Giữ secret phía server trong `.env.local`. Giữ `GOOGLE_OAUTH_ENABLED=false` khi chưa thiết lập Google.
3. Sau khi xác nhận project development, link Supabase CLI tới đúng ref. Kiểm tra trạng thái migration và nội dung dry run từ `npx supabase db push --help`, rồi áp dụng migration theo [hướng dẫn triển khai](DEPLOYMENT.md). Với Supabase local dùng `npx supabase start` trên máy đã có Docker hoặc Podman. Dùng migration additive `20261126104943_attempt_rate_limits.sql` trước khi kiểm tra giao bài bằng bản V1.1.
4. Xác minh form Auth, và dùng hai tài khoản giáo viên thử nghiệm. Đặt bốn biến `E2E_TEACHER_EMAIL`, `E2E_TEACHER_PASSWORD`, `E2E_OTHER_EMAIL`, `E2E_OTHER_PASSWORD` trong shell dùng chạy Playwright. Dùng `npm run e2e -- --project=desktop tests/browser/teacher.spec.ts` khi server đã kết nối. Luồng có ghi hoạt động, sửa nội dung sau khi giao, một lượt nộp thử và đóng bài. Chỉ dùng tài khoản và dữ liệu thử.
5. Trên development xác minh Auth → thư viện và PostgREST, quyền xem của giáo viên khác, RPC chấm điểm, deadline, việc nộp lại với cùng phiên và tỷ lệ request bị giới hạn. Kiểm tra CSV đã tải. Đối chiếu smoke test với kết quả PGlite để phát hiện sai khác quyền hoặc schema cache.

## Giới hạn tần suất bài giao

Giới hạn khởi tạo **180 yêu cầu/phút** và nộp **240 yêu cầu/phút** trên mỗi địa chỉ đáng tin cậy của Vercel, tính theo hai ngân sách độc lập. Môi trường khác dùng ngân sách chung theo bài giao. Ngưỡng cho phép một lớp 100 học sinh dùng chung mạng bắt đầu/nộp cùng phút, kèm một phần yêu cầu thử lại. Đây là ngưỡng ban đầu cần đo trên staging. PostgreSQL cập nhật bộ đếm nguyên tử. Khóa bộ đếm là HMAC, bảng không lưu địa chỉ IP dạng thô. Migration chỉ thêm bảng và hàm, không sửa role giáo viên. Lên lịch chạy bằng database owner để dọn khóa hết hạn trong môi trường vận hành, ví dụ chạy hằng ngày với câu lệnh dưới đây.

```sql
delete from private.attempt_rate_limits where window_start < now() - interval '1 day';
```

## Tài khoản production của một giáo viên

Ở project production riêng, chủ hệ thống tạo đúng một giáo viên qua Supabase Auth Dashboard rồi lấy UUID của tài khoản làm `TEACHER_ACCOUNT_ID`. Đặt `TEACHING_MODE=single`, tắt **Allow new users to sign up**, tắt Google provider và giữ `GOOGLE_OAUTH_ENABLED=false`. Đây là hai lớp chặn: server Sân Chơi giới hạn phiên theo UUID, Supabase Auth tắt đăng ký trực tiếp. QuizStudy giữ cấu hình development và tài khoản thử nghiệm. [Cấu hình Supabase Auth](https://supabase.com/docs/guides/auth/general-configuration).

## Cổng phát hành V1.3

Áp dụng `20261126122018_assignment_answer_review.sql` trên đúng project được deployment sử dụng. Cột `show_review` mặc định tắt để bài đã giao giữ chính sách cũ. Đối chiếu `APP_URL` với domain của từng môi trường trước khi kiểm tra link giao bài qua Vercel Preview. Kiểm thử tiếp tục làm bài giữ các mục đã hoàn thành khi tải lại cùng tab, trong cùng phiên đang mở. Kiểm thử phần cứng trên màn hình lớp và thiết bị iOS/Android còn chờ. [Bằng chứng và giới hạn nghiệm thu](TEST_RESULTS.md).

QuizStudy đã tắt signup theo dashboard và Auth API. Chủ dự án chọn giữ cấu hình API hiện tại. Khóa bí mật từng chia sẻ vẫn là rủi ro chưa giải quyết, nên bản hiện tại chưa đạt cổng bảo mật production. [Tài liệu khóa Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

Sau khi xử lý cổng bảo mật và có phê duyệt, merge PR #1 trước và giữ nhánh nguồn. Cập nhật PR #2 với `master`, đổi base và đối chiếu diff để giữ đúng phần V1.4A, rồi chạy lại hồi quy trước khi merge. Xác minh deployment production mới, chạy đủ 20 demo, và kiểm tra giáo viên tạo bài, giao link, học sinh nộp và lưu điểm. V1.4B tiếp tục review trên nhánh phụ thuộc PR #2.

## Đề xuất Visual Polish sau V1.4C

Đối chiếu [ảnh V1.4B](../output/playwright/v14b-gameplay) với [ảnh arcade V1.4C](../output/playwright/v14c-gameplay). Ưu tiên các mẫu cũ còn dành phần lớn màn hình cho biểu mẫu hoặc khoảng trắng. Vòng tiếp theo sẽ chuẩn hóa bố cục toàn màn hình, cỡ chữ và vùng chạm, rồi thử từng trò ở viewport dọc, ngang và khi chiếu lớp. Với trò có sân khấu, kiểm tra đầu mục và kết quả có cùng ngôn ngữ hình ảnh. Với trò nhập chữ hoặc sắp xếp, ưu tiên khả năng đọc và thao tác trước hiệu ứng.

## V1.4D Premium Visual Polish

- D1 đưa các trang chơi riêng sang Game Shell toàn trang với HUD, màn mở đầu và kết quả thống nhất.
- D2 tăng khả năng đọc của câu hỏi, ô chữ, thẻ lựa chọn và thẻ ghép. Rank Order thêm vùng kéo cảm ứng. Watch and Memorize có nút phóng to thẻ khi trình chiếu.
- D3 thêm canvas dọc và D-pad, tìm kiếm và lọc 34 mẫu, thumbnail tải gần viewport và lối tắt đến phần giao bài.

Labelled Diagram tiếp tục giữ một ghim mỗi mục. Nhiều ghim trong một ảnh cần thiết kế cấu trúc nhập liệu, snapshot và luật chấm trước khi triển khai.

V1.4D dựa trên PR #4. Chỉ phát hành sau khi review các PR theo thứ tự và chủ dự án phê duyệt. Rủi ro Secret Key từng lộ vẫn được ghi nhận theo cấu hình hiện tại.

## V1.5 — Công cụ soạn bài tiếng Anh

- V1.5A bổ sung Ngân hàng từ vựng và lesson version 1, danh mục 440 từ, nhập và xuất, dùng lại nguồn trong các mẫu tương thích. Migration additive trên QuizStudy thêm hai bảng của giáo viên và liên kết tùy chọn tới hoạt động.
- V1.5B sẽ dùng bài học làm nguồn để luyện nghe, phonics, nói, đọc, viết và ngữ pháp. Rubric và bản ghi âm học sinh cần một đợt thiết kế quyền truy cập và lưu giữ riêng.
- V1.5C sẽ đối chiếu cấu trúc thi Cambridge English hiện hành trước khi xây dựng bài luyện gốc theo từng phần. Tiến độ sẽ dùng cách tính điểm nội bộ của Sân Chơi.

V1.5A dùng nhánh review dựa trên V1.4D. Chỉ phát hành sau khi chủ dự án phê duyệt. Khóa bí mật từng lộ vẫn là rủi ro chưa xử lý.
