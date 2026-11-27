# Ma trận mẫu

Các nhóm dữ liệu gồm lựa chọn, cặp, gợi ý, thứ tự, nhập câu trả lời và điền khuyết. Trình xem trước giữ nguyên bản gốc. Chuyển mẫu cần vượt qua schema đích để giữ nội dung, đáp án và media.

| Phase | Nhóm | Mẫu |
|---|---|---|
| 2 | Lựa chọn | Quiz, Gameshow Quiz |
| 2 | Cặp | Match Up, Flash Cards, Find the Match |
| 2 | Mục | Speaking Cards, Spin the Wheel, Open the Box |
| 2 | Điền khuyết | Complete the Sentence |
| 2 | Nhóm | Group Sort |
| 2 | Thứ tự | Unjumble, Anagram |
| 3 | Nhập chữ | Type the Answer, Spell the Word, Hangman, Crossword |
| 3 | Thẻ và từ | Matching Pairs, Wordsearch, Flip Tiles, Word Magnets |
| 3 | Sơ đồ và hình ảnh | Labelled Diagram, Image Quiz |
| 3 | Logic và phân loại | True or False, Rank Order, Pair or No Pair, Speed Sorting |
| 3 | Arcade | Maze Chase, Flying Fruit, Balloon Pop, Whack-a-Mole, Airplane |
| 3 | Ghi nhớ và toán | Watch and Memorize, Win or Lose Quiz, Maths Generator |

## V1.4A trên nhánh review

| Mẫu | Cách chơi và chấm | Ràng buộc soạn bài | Cấp độ gợi ý |
|---|---|---|---|
| Type the Answer | Gõ câu trả lời, chấp nhận biến thể giáo viên nhập | Một đáp án chính và các đáp án thay thế | Starters đến Flyers |
| Matching Pairs | Lật thẻ hai cột, ghép và chấm từng cặp | 2–12 cặp, đáp án mặt sau khác nhau | Kids và Starters |
| Spell the Word | Nghe hoặc đọc gợi ý, nhập từng chữ vào dãy ô | Từ tiếng Anh 2–12 chữ cái | Kids đến Movers |
| Wordsearch | Chọn hai đầu của từ trên bảng chữ, chấp nhận cả hai hướng | Một từ 2–12 chữ cái mỗi lượt | Starters đến Flyers |
| Hangman | Đoán chữ bằng bảng chữ cái, tối đa sáu lượt sai, không có đồng hồ | Từ 2–12 chữ cái cùng gợi ý | Movers và Flyers |
| Crossword | Điền từ ngang/dọc, chia sẻ chữ tại ô giao nhau | 2–10 từ, 2–12 chữ cái có thể nối thành bảng. Bộ xếp thử các cách nối mà giữ thứ tự gợi ý | Movers và Flyers |
| True or False | Chọn True hoặc False cho mỗi nhận định | Một đáp án, hỗ trợ ảnh/âm câu hỏi và từng phương án | Kids đến Flyers |
| Word Magnets | Kéo hoặc chạm để xếp từ, dùng nút mũi tên đổi thứ tự | 2–16 từ hoặc cụm từ | Starters đến Flyers |

Các mẫu dùng chung ảnh câu hỏi, audio và phát âm UK/US khi nội dung có tệp phù hợp. Thumbnail WebP lấy từ ảnh Playwright của gameplay thật. Các ví dụ chuyển mẫu qua schema gồm Word Magnets ↔ Unjumble, True or False → Quiz và chuyển từ Anagram sang các mẫu chính tả khi từ đáp ứng giới hạn.

## V1.4B trên nhánh review

| Mẫu | Cách chơi | Editor và điểm | Cấp độ gợi ý |
|---|---|---|---|
| Labelled Diagram | Gắn nhãn vào ghim hiển thị trên sơ đồ | Ảnh, tọa độ ghim bằng chạm hoặc nhập số, nhãn đúng và nhãn nhiễu. Một điểm mỗi mục | Kids đến Movers |
| Flip Tiles | Tự đoán nghĩa rồi lật các ô từ vựng theo thứ tự tùy chọn | Mặt trước, mặt sau và media. Lưu hoàn thành dạng luyện tập | Kids đến Flyers |
| Rank Order | Kéo thẻ hoặc dùng nút lên/xuống để sắp xếp | Thứ tự chuẩn, gợi ý và media. Chấm đúng thứ tự toàn mục | Starters đến Flyers |
| Pair or No Pair | So sánh hai thẻ trước khi quyết định có ghép được | Hai nội dung, media và đáp án Pair hoặc No Pair. Một điểm mỗi cặp | Kids đến Movers |
| Image Quiz | Chọn hình tương ứng với gợi ý | Mỗi lựa chọn có ảnh riêng, âm tùy chọn và một đáp án đúng | Kids đến Flyers |
| Watch and Memorize | Xem chuỗi rồi tự chọn lúc che thẻ để xếp lại | Gợi ý, media và chuỗi chuẩn. Chấm thứ tự | Starters đến Flyers |
| Maths Generator | Tính từng phép tự sinh theo cấu hình | Khoảng toán hạng và phép cộng, trừ, nhân hoặc chia hết. Một điểm mỗi phép | Luyện số cơ bản bằng tiếng Anh |

Wordsearch vẫn dùng một từ mỗi bảng. Bảng nhiều từ sẽ cần luật chọn từ và schema chấm nhiều đáp án để giữ kết quả cũ.

## V1.4C trên nhánh review

| Mẫu | Tương tác | Editor và luật điểm | Cấp độ gợi ý |
|---|---|---|---|
| Maze Chase | Điều khiển cáo trong mê cung nhiều lối, né vật cản ở mức thử thách | Một đáp án đúng cho mỗi mê cung. Có chỉnh độ khó và bật giới hạn giờ riêng từng mục | Kids đến Movers |
| Flying Fruit | Chạm quả bay có từ phù hợp | Tốc độ theo độ khó, hỗ trợ ảnh từng mục tiêu và phát âm | Kids đến Starters |
| Airplane | Đổi làn bằng phím hoặc chạm, máy bay phải va vào mục tiêu | Máy chủ chấm đáp án đã ghi. Hỗ trợ cấu hình tốc độ và giới hạn giờ | Starters đến Flyers |
| Balloon Pop | Chạm bóng đang bay để làm nổ và ghi đáp án | Tốc độ và giới hạn giờ tùy chọn. Có hình hoặc chữ trên bóng | Kids đến Movers |
| Whack-a-Mole | Chờ chuột chũi xuất hiện rồi chạm vào mục tiêu | Mức chậm giữ mục tiêu lâu hơn. Mục tiêu đang ẩn không ghi đáp án | Kids đến Movers |
| Speed Sorting | Kéo thẻ hoặc chạm thẻ rồi chọn thùng | Giáo viên nhập vật cần phân loại và nhãn các thùng. Mặc định không giới hạn giờ | Starters đến Flyers |
| Win or Lose Quiz | Chọn đáp án trên sân khấu và dùng một lượt thử sức nếu muốn | Bình thường đúng +1, sai 0. Lượt thử sức đúng +2, sai −1. Điểm cuối thấp nhất là 0 | Movers và Flyers |

Mọi mẫu arcade dùng schema câu hỏi lựa chọn có một đáp án đúng. Có thể đổi từ các mẫu cùng cấu trúc nếu dữ liệu đạt schema đích. Tùy chỉnh arcade đã lưu chỉ được chuyển sang nơi có thể giữ tùy chỉnh đó.
