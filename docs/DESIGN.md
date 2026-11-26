# Thiết kế

Sân Chơi dùng nền giấy sáng #f8f9fc, chữ mực #1b2340, tím điều hướng #5736cc, tím nhạt #eee9ff và vàng chanh #e6f68b cho vùng minh họa. Chữ giao diện dùng Be Vietnam Pro nếu có, với fallback hệ thống hỗ trợ dấu tiếng Việt. Mẫu dùng biểu tượng theo thao tác như ghép cặp, chọn đáp án, lật thẻ.

Desktop dùng điều hướng dọc bên trái, vùng nội dung cho bộ tìm kiếm, bộ lọc và thẻ hoạt động. Điện thoại dùng điều hướng cuộn ngang và thẻ một cột. Trình chơi ưu tiên mục tiêu chính, thứ tự đọc tự nhiên, hiển thị focus và hỗ trợ reduced motion.

Wireframe: điều hướng > tên màn hình và hành động tạo > tìm/lọc > danh sách. Trang học sinh: hướng dẫn và biệt danh > câu hỏi > phản hồi và kết quả. Biểu mẫu gắn nhãn, báo lỗi bằng chữ và ưu tiên mục tiêu chạm từ 44 px.

## Minh họa học liệu tiếng Anh V1.2

Tệp `public/illustrations/english-decks.webp` là ảnh do công cụ ImageGen tích hợp tạo, chuyển mã WebP để giảm dung lượng. Thư viện hiển thị từng góc bằng CSS. Minh họa dùng để nhận diện chủ đề, còn tên và cấp độ được trình bày bằng chữ HTML.

Prompt ImageGen

> Use case: illustration-story. Create one square illustrated contact sheet for the Sân Chơi young English learner library, exactly equal 2 by 2 grid, with no dividing border or gutter, images will be cropped exactly at the horizontal and vertical half. Top-left: a purple open school satchel with a blue book, pencil and ruler on pale lavender. Top-right: a yellow duck, goat and small horse on a soft mint-green farm with a pond. Bottom-left: a small footbridge, street corner and blue signpost on a powder blue neighborhood. Bottom-right: a school garden with a watering can, flowers, bee and seedlings on warm peach. Contemporary Vietnamese children's textbook editorial illustrations, expressive cut-paper shapes with tactile pencil grain and warm soft lighting. Strong silhouettes readable on thumbnail, subjects centered within their own tile with generous safe padding and no objects crossing quadrants. No letters, text, numbers, logos, white gutters, human faces or typography. Each scene has an independent pastel background all the way to the bounds.

## Sân khấu trò chơi V1.3

Mỗi trò có bảng màu, minh họa mở đầu và bố cục theo thao tác chính. Player dùng React và CSS để giữ điều khiển bằng bàn phím, đọc màn hình và tương thích với dữ liệu bài giao cũ. Vòng quay, lật thẻ và mở hộp tắt hiệu ứng khi trình duyệt yêu cầu giảm chuyển động. Âm báo đúng/sai tạo bằng Web Audio, bật theo lựa chọn của người chơi.

Ảnh `public/illustrations/game-stages.webp` do ImageGen tạo theo bố cục 4 × 3, sau đó chuyển WebP. Các ô lần lượt là Quiz, Ghép cặp, Thẻ từ, Luyện nói, Điền từ, Phân nhóm, Vòng quay, Tìm cặp, Gameshow, Xếp câu, Xáo chữ và Mở hộp. Ảnh dùng để trang trí. Tên trò và hướng dẫn hiển thị bằng HTML.

Prompt ImageGen

> Original children’s English learning web game art atlas. Exactly 4 columns by 3 rows, 12 equally sized square panels filling a 4:3 image edge to edge, crisp panel boundaries without gaps. Each isolated tile consists of one large central object on a solid tinted paper background, safely within tile. Row 1 left to right: indigo question cards, two mint puzzle pieces interlocking, peach double-sided vocabulary cards, blue microphone with speech bubbles. Row 2: plum sentence strips and pencil, teal sorting baskets, orange prize wheel, cyan magnifying glass with two paired paper objects. Row 3: midnight-purple game show stage lights and buzzer, grass-green word tiles arranging, apricot loose alphabet letter blocks, lilac colorful closed gift boxes. Cohesive tactile cut-paper classroom storybook illustration, strong silhouettes and distinct palettes. No text, no people, no interface controls, no scores, no logos, no gutters. Each tile is a distinct illustration for a separately designed game.
