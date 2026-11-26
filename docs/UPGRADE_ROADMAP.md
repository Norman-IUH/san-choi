# Lộ trình nâng cấp Sân Chơi

## Milestones và cổng nghiệm thu

| Phiên bản | Trạng thái | Cổng nghiệm thu và kiểm thử |
|---|---|---|
| V1.1 Foundation | Đạt luồng cốt lõi | QuizStudy đã nghiệm thu Auth, PostgREST, RLS, RPC, snapshot, deadline, nộp trùng, giới hạn tần suất và CSV. Xử lý cảnh báo bảo mật khi chuẩn bị production. |
| V1.2 Một giáo viên và English Content Engine | Partial | Kiểm tra tài khoản duy nhất, schema tương thích với 12 mẫu, CSV/XLSX, tái dùng nội dung, quyền Storage, file sai định dạng và mẫu gốc cho bốn cấp. Cần cấu hình riêng và nghiệm thu trên production. |
| V1.3 Nâng cấp 12 trò | Not Started | Cải thiện màn hình lớp, ảnh/âm thanh, phản hồi và xem lại đáp án theo chính sách giao bài. Kiểm thử chuột, phím, chạm, giảm chuyển động và resume. |
| V1.4 Hoàn thành 22 mẫu nâng cao | Not Started | Mỗi trò có luật riêng, editor, preview, demo, input và bài kiểm thử. Phaser dùng cho arcade có game loop. |
| V1.5 English Practice và Cambridge YLE | Not Started | Đối chiếu tài liệu Cambridge. Kiểm thử từng kỹ năng và từng phần, gồm rubric giáo viên, bài luyện gốc và quyền truy cập bản ghi âm. |
| V1.6 Teaching Tools và lớp học | Not Started | Vocabulary Bank, Lesson Library, QR, PDF/đáp án, Excel, AI tùy chọn, roster và tiến độ. Kiểm tra phân quyền và cách ly giữa các lớp. |
| V2.0 Production | Not Started | Backup và rollback, audit bảo mật, kiểm thử tải, preview từ mạng di động và triển khai HTTPS với project production riêng. |

## Khôi phục kết nối Supabase development

Ngày 26/11/2026, connector xác nhận **QuizStudy** (`unarohbxeqzsqcyyxveo`) đang `ACTIVE_HEALTHY`. `.env.local` đã xác thực được bằng cả hai loại khóa. Hai migration đã áp dụng và version khớp các file repo. Các bước dưới đây dùng để cài đặt lại trên máy khác hoặc kết nối development mới. [Kết quả nghiệm thu](TEST_RESULTS.md).

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
