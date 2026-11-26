# Sân Chơi

Ứng dụng tiếng Việt để giáo viên soạn hoạt động tương tác, chia sẻ bài và xem kết quả. Bản hiện tại có 12 mẫu cơ bản chơi được. Xem [ma trận tính năng](docs/FEATURE_MATRIX.md) và [lộ trình](docs/ROADMAP.md) để biết phạm vi còn lại.

## Windows

Cần Node.js 24 và npm. Với Supabase cục bộ trên Windows, mở Docker Desktop trước khi chạy lệnh CLI.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Mở [localhost:3000](http://localhost:3000). 12 mẫu tại trang chủ chạy được ngay. Để dùng tài khoản, thư viện và giao bài, chạy `npx supabase start` rồi điền URL, publishable key và secret key từ `npx supabase status` vào `.env.local`. Với bản CLI trả về khóa cũ, dùng anon key và service_role key tương ứng. Khởi động lại Next.js sau khi sửa biến môi trường. Chỉ định `APP_URL` theo đúng địa chỉ người dùng mở.

Có thể dùng một project Supabase đang hoạt động. Áp dụng migration trong `supabase/migrations`, đặt Site URL và danh sách URL callback theo [hướng dẫn triển khai](docs/DEPLOYMENT.md), rồi điền thông tin project vào `.env.local`. Google OAuth là tùy chọn và cần cấu hình provider trên Supabase.

Đăng ký tài khoản giáo viên, tạo hoặc xuất bản một hoạt động. Từ chi tiết hoạt động, tạo link giao bài. Mở link ở cửa sổ riêng tư, nộp bài rồi kiểm tra màn hình Kết quả. Khi chưa có tài khoản mẫu, [demo nội dung](lib/demo.ts) cung cấp dữ liệu cho đủ 12 trò.

## Kiểm thử

```powershell
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run e2e
npm run build
```

Vitest kiểm tra luật trò, xuất CSV và migration RLS trên PostgreSQL nhúng, dùng các role và hàm auth tương ứng để mô phỏng ngữ cảnh PostgreSQL của Supabase. Playwright kiểm tra demo desktop và viewport Pixel 7. Bài kiểm thử có tài khoản thật chỉ chạy khi cung cấp biến `E2E_TEACHER_EMAIL`, `E2E_TEACHER_PASSWORD`, `E2E_OTHER_EMAIL`, `E2E_OTHER_PASSWORD` cho hai tài khoản giáo viên test trên Supabase local hoặc staging. Bộ kiểm thử tạo hoạt động, bài giao và kết quả trong project đó. Xem [kết quả kiểm thử](docs/TEST_RESULTS.md).

## Tài liệu

[Roadmap V1.1–V2.0 và kết nối Supabase development](docs/UPGRADE_ROADMAP.md)

Thư viện gốc cho bốn cấp nằm ở `/samples`. Trong Flashcards, Match Up và Find the Match, editor hỗ trợ nhập CSV/XLSX với cột `word`, `meaning` và các cột tùy chọn `level`, `ipa`, `example`. Ảnh và audio tối đa 3 MB mỗi tệp. Bật chế độ một giáo viên theo [hướng dẫn deploy](docs/DEPLOYMENT.md) khi dùng project production riêng.

[PRD](docs/PRD.md) · [Kiến trúc](docs/ARCHITECTURE.md) · [Dữ liệu](docs/DATABASE.md) · [Thiết kế](docs/DESIGN.md) · [Mẫu hoạt động](docs/TEMPLATE_MATRIX.md) · [Kiểm thử](docs/TEST_PLAN.md) · [Triển khai](docs/DEPLOYMENT.md) · [Hạn chế](docs/LIMITATIONS.md)
