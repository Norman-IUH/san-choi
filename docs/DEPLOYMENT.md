# Triển khai Vercel và Supabase

1. Chuẩn bị project Supabase staging đang hoạt động. Bật email/password và xác minh email. Xem migration trong `supabase/migrations`. Với Supabase CLI, chạy `npx supabase link --project-ref <ref>`, tiếp theo xem lệnh `npx supabase db push --help` và áp dụng migration cho đúng project. Kiểm thử dữ liệu/quyền trước khi lặp lại trên production.
2. Import repo vào Vercel với preset Next.js. Dùng Node.js 24. Cấu hình `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` và `APP_URL` cho từng môi trường. Giá trị secret chỉ được dùng phía server. Project staging dùng riêng credentials và database.
3. Trong Supabase Auth, đặt Site URL thành origin tương ứng. Allowlist `/auth/callback` và `/auth/callback?next=profile` trên origin đó. Với Google OAuth, cấu hình client, secret và URL callback Supabase theo tài liệu provider rồi đặt `GOOGLE_OAUTH_ENABLED=true`. Cấu hình SMTP để gửi email xác minh và khôi phục.
4. Chạy các kiểm thử từ README. Theo dõi lỗi có cấu trúc trong Vercel Logs và Supabase Logs, mã lỗi RPC và tỷ lệ bài nộp trùng. Không ghi log dữ liệu học sinh hoặc credential.
5. Trước khi dùng với học sinh, thực hiện đầy đủ cổng nghiệm thu Phase 5 trong roadmap, quy định lưu/xóa bài làm và diễn tập phục hồi dữ liệu từ backup staging.

[Next.js trên Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs) · [Supabase local development](https://supabase.com/docs/guides/local-development) · [Supabase Auth SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs)

## Production cá nhân và preview

- Dùng repo Git riêng tư. Kiểm tra `.env.local`, ZIP audit, kết quả Playwright và dữ liệu fixture nằm ngoài staged files trước khi push. Preview công khai chỉ dùng bộ học liệu gốc tích hợp. Preview có tính năng tạo/giao bài cần kết nối Supabase development riêng và kiểm soát quyền truy cập giáo viên.
- Dùng Supabase project production riêng với QuizStudy development. Tạo sẵn đúng một tài khoản giáo viên trong Auth Dashboard, bật xác nhận cho tài khoản đó, đặt `TEACHING_MODE=single` và điền UUID vào `TEACHER_ACCOUNT_ID`. Tắt **Allow new users to sign up** và Google provider trong Supabase Dashboard để chặn cả Auth API. Vercel production tự yêu cầu chế độ một giáo viên. Thiếu UUID thì không cấp quyền giáo viên.
- Áp dụng các migration gồm bucket `teaching-media` riêng tư. Lưu `APP_URL` thành HTTPS origin chính xác. Thử cả link đăng nhập khôi phục và link bài giao từ mạng di động. Tài khoản học sinh không cần cấu hình. Ưu tiên khóa server mới nếu khóa cũ từng được chia sẻ.
- Vercel Hobby dành cho sử dụng cá nhân phi thương mại. Nếu website phục vụ lớp học thu phí hoặc hoạt động thương mại, chọn hosting/gói tương thích sau khi đối chiếu điều khoản và được chủ dự án chấp thuận chi phí. Chạy preview hoặc build không tự động kích hoạt gói trả phí. [Điều khoản Vercel Hobby](https://vercel.com/docs/plans/hobby).
- Backup database và Storage theo phiên bản phát hành. Dùng deployment trước để rollback frontend khi cần và kiểm tra tương thích schema trước khi chuyển traffic. Thực hành khôi phục sang project riêng để bảo vệ dữ liệu đang sử dụng.
