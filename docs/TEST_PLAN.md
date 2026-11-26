# Kế hoạch kiểm thử

- Unit Vitest kiểm tra schema, luật trò, chuyển mẫu giữ dữ liệu, chấm điểm và CSV.
- Integration PostgreSQL kiểm tra migration, RLS, tính duy nhất, khóa ngoại, snapshot và bài nộp trùng.
- Playwright desktop và điện thoại kiểm tra trang công khai, từng demo và bàn phím.
- Playwright Supabase staging kiểm tra đăng ký/xác minh, CRUD/reload/duplicate/thư mục/thùng rác, cách ly vai trò, học sinh ẩn danh, deadline và xuất kết quả.
- Các phase sau kiểm tra PDF có dấu tiếng Việt, export XLSX, 34 demo, đồng bộ phòng theo PIN, mạng yếu và tải ít nhất 100 học sinh đồng thời.
