# Độ phủ học liệu V1.5B2

Tệp sinh từ danh mục và tệp media trong repo bằng `npm run vocabulary:coverage`.

| Cấp độ | Tổng | Nghĩa VI | Từ loại | Chủ đề | IPA | Ví dụ | Ảnh theo từ | Audio UK | Audio US | Từ liên quan | Giáo viên đã duyệt |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Kids | 110 | 110 | 110 | 110 | 110 | 110 | 2 | 27 | 27 | 0 | 0 |
| Pre A1 Starters | 110 | 110 | 110 | 110 | 110 | 110 | 0 | 20 | 20 | 0 | 0 |
| A1 Movers | 110 | 110 | 110 | 110 | 5 | 5 | 0 | 5 | 5 | 0 | 0 |
| A2 Flyers | 110 | 110 | 110 | 110 | 5 | 5 | 0 | 5 | 5 | 0 | 0 |
| Tổng | 440 | 440 | 440 | 440 | 230 | 230 | 2 | 57 | 57 | 0 | 0 |

Kids và Starters có 220/220 mục với cả IPA và câu ví dụ. Còn 173 mục Kids/Starters thiếu cặp audio và 218 mục chưa có ảnh theo từ. Ảnh chỉ gắn khi hỗ trợ nhận diện.

Lô B2 bổ sung 194 mục với IPA và ví dụ. 194 mục của lô đang chờ giáo viên duyệt. Học liệu từ các bản trước chưa có nhật ký duyệt theo quy trình này.

Nguồn lô B2. Sân Chơi, câu ví dụ biên soạn riêng. IPA và audio tổng hợp từ eSpeak NG 1.0.2. IPA đã được hiệu chỉnh một số quy ước và cách đọc Anh–Anh sau khi tạo. Công cụ kiểm tra định dạng và tệp. Giáo viên xác nhận nghĩa, từ loại, chủ đề, ví dụ và phát âm bằng lượt rà soát riêng. [eSpeak NG](https://github.com/espeak-ng/espeak-ng)

Quyền sử dụng. Học liệu gốc Sân Chơi. Chỉ phát hành clip tổng hợp, giữ dẫn nguồn công cụ. Ba hình nhận diện táo, sách và thước do Sân Chơi vẽ cho Listen and Choose. Hai ảnh liên kết sẵn trong kho thuộc bộ minh họa Sân Chơi. Audio của các bản trước giữ nguồn theo tài liệu dự án.

Đã kiểm tra ID và nghĩa lặp chính xác trong cùng cấp độ. Có 1 nhóm trùng mặt chữ hoặc biến thể chính tả để đối chiếu: `catalog/kids/rabbit` ↔ `catalog/starters/rabbit`.

Để duyệt một mục, kiểm tra nghĩa, từ loại, chủ đề, IPA, câu ví dụ và clip hiện có. Ghi người duyệt, ngày và nhận xét tại `vocabularyTeacherReviews`, rồi sinh lại báo cáo. Kiểm tra CI cục bộ bằng `npm run vocabulary:check`.
