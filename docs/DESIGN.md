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
## Đồ họa arcade V1.4C

Hai atlas nguyên gốc được tạo bằng ImageGen cho Sân Chơi. Atlas môi trường được cắt thành ảnh nền WebP riêng. Atlas nhân vật được chia ô và chuẩn hóa alpha ở phần nền bán trong suốt trước khi xuất sprite WebP. Các màn giữ người chơi, đáp án và hiệu ứng ở các lớp riêng. Phaser vẽ sân khấu, còn điều khiển, câu hỏi, media và kết quả dùng giao diện HTML hiện có.

Ảnh đại diện trong thư viện dùng sân khấu đang chơi của từng demo, chụp trên Chromium rồi chuyển sang WebP rộng 640 px trong `public/illustrations/gameplay`. Màn mở đầu dùng ảnh nền ImageGen để giới thiệu chủ đề của trò.

## V1.4D

Teacher Workspace giữ nền giấy `#f8f9fc`, chữ mực `#1b2340` và nút thao tác tím `#5736cc`. Student Player dùng nền sân khấu `#262044` bao quanh vùng trò chơi, với `--game-accent`, `--game-paper` và `--game-edge` theo từng mẫu. Be Vietnam Pro và font hệ thống hỗ trợ tiếng Việt và tiếng Anh. Câu hỏi dùng cỡ chữ co giãn từ 1,3 đến 2,65 rem. Bo góc sân khấu dùng `--stage-card`, khoảng mép theo `--stage-gutter` và bóng `--stage-shadow`. Nút Bắt đầu cao tối thiểu 56 px, các nút HUD tối thiểu 44 px.

Trang demo, bài giao còn mở và học liệu công khai có Game Shell toàn trang. Điều hướng quay lại, tiến độ và công cụ nằm trên HUD. Giáo viên dùng cùng Player để xem trước trong trang hoạt động. Kết quả dùng minh họa mẫu và lời động viên. Điểm và đáp án tiếp tục tuân theo tùy chọn bài giao. Pause tạm dừng arcade hoặc mở hộp thoại giữ nguyên trạng thái ở các trò theo lượt. Âm phản hồi do người dùng bật, phát âm có nhãn Anh–Anh và Anh–Mỹ, và hiệu ứng dùng tùy chọn giảm chuyển động của thiết bị.

Canvas arcade dọc dùng khung 720 × 540 và tính lại tọa độ vẽ từ không gian mô phỏng. Canvas ngang giữ 960 × 480. Điều này giữ va chạm và lượt chơi qua thay đổi hướng màn hình. Hình đáp án, nền và sprite gốc V1.3–V1.4C tiếp tục được tái sử dụng. 34 thẻ thư viện dùng thumbnail WebP chụp từ gameplay và tải theo vị trí cuộn.

## V1.5A

Thư viện tiếng Anh giữ kiểu chữ và nút V1.4D. Thẻ bài mở đầu dùng minh họa gốc của thư viện mẫu, nền xanh nhạt và nhãn cấp độ. Danh sách từ đặt cạnh phần soạn bài trên desktop và chuyển xuống một cột trên điện thoại. Lựa chọn từ được giữ khi đổi bộ lọc hoặc trang. Các tệp phát âm có sẵn mang nhãn Audio tổng hợp, và tệp tải lên đi qua MediaInput cùng bucket riêng tư.

**Prompt môi trường**

> An exact 4 column by 2 row 8 panel game background atlas, wide landscape image, no gaps, even equal rectangles. Original premium illustrated picture-book art for a Vietnamese children's English arcade; tactile paper and gouache, brightly lit, clear silhouettes, composed like game level backgrounds with spacious center. Row 1 panels left to right: aerial emerald jungle maze ruins with turquoise stream, peach-orange golden orchard with flying leaves, deep blue airplane sky with fluffy clouds and sandstone canyons, purple sunset festival with balloons at the edges. Row 2 left to right: green garden with soft grassy earth, aqua classroom recycling workshop, navy and violet art-deco quiz stage with spotlights, cream and coral paper textures. No words, numbers, watermarks, humans, interface, borders or dividing lines. Each panel independently designed to be used as an illustrated game stage.

**Prompt sprite**

> Transparent game sprites arranged in precisely spaced 4 columns and 2 rows of equal cells with large transparent gutters, original gouache paper-cut Nintendo-independent children's storybook style. One separate centered character or object per cell. Row 1 from left: teal fox explorer with mustard scarf, orange flying peach with tiny cream paper wings, friendly red and cream propeller plane pointed right, glossy lavender striped balloon with tied ribbon. Row 2: smiling tan mole peeking up with round blue garden hat; orange recycling crate with blue classroom objects; purple and gold theatrical buzzer and stars; coral seedpod with leaves. All eight isolated silhouettes separated with transparent padding, neutral lighting, no baselines that cross cells, no words, no symbols or gradients as background, no text. Landscape aspect ratio.

## V1.5B1 — Luyện nghe và ngữ âm

Màn bài luyện dùng chung HUD và hiển thị nút Nghe, Dừng, Nghe lại cùng tốc độ 0,75× hoặc 1×. Giáo viên có thể đặt giới hạn theo clip trong lượt làm. Trình duyệt lưu lượt nghe của phiên hiện tại, kể cả khi tải lại cùng tab. Giới hạn hướng dẫn luyện tập, còn quyền mở tệp do Storage quản lý.

Audio mẫu được gắn nhãn tổng hợp. Mẫu phonics cung cấp câu hỏi gốc và yêu cầu giáo viên kiểm tra bản ghi trước khi xuất bản. Listen and Colour tô lên hình quyển sách vẽ cho Sân Chơi và có nhãn màu bằng chữ. Listen and Match ghép từng clip với một thẻ. Transcript chỉ hiện trong Dialogue khi giáo viên bật.
