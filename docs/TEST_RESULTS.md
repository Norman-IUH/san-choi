# Kết quả kiểm thử ngày 14/11/2026

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
