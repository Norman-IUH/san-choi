# Dữ liệu và phân quyền

Phase đầu dùng profiles, workspaces, folders, activities, activity_versions, assignments và attempts. Vai trò nằm trong profiles do hệ thống quản lý. Thư viện, thư mục và phiên bản thuộc giáo viên tạo dữ liệu. Thư mục cha và mục con dùng toàn vẹn tham chiếu theo chủ sở hữu. PostgreSQL giữ nội dung câu hỏi JSONB trong phiên bản để cập nhật cùng metadata.

Bài giao giữ bản sao nội dung và template, cho phép sửa hoặc xóa hoạt động gốc mà không đổi lời giải cũ. Học sinh ẩn danh chỉ gọi qua server theo mã có entropy cao. Câu trả lời nằm trong dữ liệu attempt tách khỏi nội dung gửi tới client. Chỉ giáo viên chủ bài giao được xem các attempt qua API xác thực.

Bản mở rộng gồm lớp, nhóm, hành viên, media, quyền quản trị, báo cáo cộng đồng, phòng trực tiếp, thông báo, audit logs và thống kê.

Sao lưu bằng dashboard Supabase hoặc pg_dump theo lịch của môi trường. Khôi phục vào project staging để xác minh số bản ghi, chính sách quyền, các bài giao và kết quả trước khi chuyển lưu lượng.
