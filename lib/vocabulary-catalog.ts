import { deckIds, englishDeckContent, englishDecks, type DeckId } from "./english-samples";
import type { BankWord } from "./vocabulary-bank";

type Topic = [name: string, part: string, entries: string];
const topics: Record<DeckId, Topic[]> = {
  kids: [
    ["Alphabet", "noun", "apple:táo|ball:quả bóng|cat:con mèo|dog:con chó|egg:quả trứng|fish:con cá|hat:cái mũ|ice:đá lạnh|jam:mứt|kite:diều|lion:sư tử|moon:mặt trăng|nest:tổ chim|owl:cú|pig:lợn"],
    ["Numbers", "number", "one:một|two:hai|three:ba|four:bốn|five:năm|six:sáu|seven:bảy|eight:tám|nine:chín|ten:mười|eleven:mười một|twelve:mười hai|thirteen:mười ba|fourteen:mười bốn|fifteen:mười lăm"],
    ["Colours", "adjective", "red:đỏ|blue:xanh dương|green:xanh lá|yellow:vàng|orange:cam|pink:hồng|purple:tím|brown:nâu|black:đen|white:trắng|grey:xám|golden:vàng óng|silver:màu bạc|light blue:xanh dương nhạt|dark green:xanh lá đậm"],
    ["Animals", "noun", "bird:chim|frog:ếch|ant:kiến|bee:ong|bear:gấu|rabbit:thỏ|mouse:chuột|tiger:hổ|monkey:khỉ|elephant:voi|zebra:ngựa vằn|panda:gấu trúc|snake:rắn|turtle:rùa|giraffe:hươu cao cổ"],
    ["Shapes", "noun", "circle:hình tròn|square:hình vuông|triangle:hình tam giác|rectangle:hình chữ nhật|oval:hình bầu dục|star:hình ngôi sao|heart:hình trái tim|diamond:hình thoi|line:đường kẻ|dot:chấm|cube:khối lập phương|cone:khối nón|cylinder:khối trụ|semicircle:nửa hình tròn|spiral:đường xoắn ốc"],
    ["Classroom objects", "noun", "desk:bàn học|chair:ghế|board:bảng|bag:cặp sách|crayon:bút sáp màu|marker:bút dạ|glue:keo dán|paper:giấy|scissors:kéo|notebook:vở|pencil case:hộp bút|sharpener:gọt bút chì|clock:đồng hồ|poster:áp phích|shelf:kệ"],
    ["Toys", "noun", "doll:búp bê|teddy bear:gấu bông|toy car:ô tô đồ chơi|blocks:khối xếp hình|train set:bộ tàu đồ chơi|puzzle:bộ ghép hình|robot:rô-bốt|puppet:con rối|toy drum:trống đồ chơi|scooter:xe trượt|toy boat:thuyền đồ chơi|yo-yo:con quay yo-yo|marble:viên bi|skipping rope:dây nhảy|play dough:đất nặn"],
  ],
  starters: [
    ["Family", "noun", "mother:mẹ|father:bố|sister:chị hoặc em gái|brother:anh hoặc em trai|grandmother:bà|grandfather:ông|aunt:cô, dì hoặc bác gái|uncle:chú, cậu hoặc bác trai|cousin:anh chị em họ|parents:bố mẹ|daughter:con gái|son:con trai|baby:em bé|twins:cặp sinh đôi|family member:thành viên gia đình"],
    ["Food", "noun", "bread:bánh mì|rice:cơm|milk:sữa|juice:nước ép|cheese:phô mai|banana:chuối|pear:lê|lemon:chanh vàng|grapes:nho|carrot:cà rốt|potato:khoai tây|tomato:cà chua|sandwich:bánh mì kẹp|soup:súp|yoghurt:sữa chua"],
    ["Clothes", "noun", "shirt:áo sơ mi|T-shirt:áo thun|dress:váy liền|skirt:chân váy|jacket:áo khoác ngắn|coat:áo khoác ngoài|trousers:quần dài|shorts:quần đùi|socks:tất|shoes:giày|boots:ủng|cap:mũ lưỡi trai|scarf:khăn quàng|belt:thắt lưng|gloves:găng tay"],
    ["Body", "noun", "head:đầu|hair:tóc|face:khuôn mặt|eye:mắt|ear:tai|nose:mũi|mouth:miệng|tooth:răng|tongue:lưỡi|neck:cổ|shoulder:vai|arm:cánh tay|hand:bàn tay|finger:ngón tay|foot:bàn chân"],
    ["Home", "noun", "kitchen:nhà bếp|bedroom:phòng ngủ|bathroom:phòng tắm|living room:phòng khách|garden:vườn|door:cửa ra vào|window:cửa sổ|stairs:cầu thang|bed:giường|sofa:ghế sô pha|lamp:đèn|cupboard:tủ đựng đồ|mirror:gương|floor:sàn nhà|wall:bức tường"],
    ["School", "noun", "teacher:giáo viên|student:học sinh|classroom:phòng học|playground:sân chơi|school library:thư viện trường|lesson:bài học|homework:bài tập về nhà|question:câu hỏi|answer:câu trả lời|classmate:bạn cùng lớp|lunch box:hộp cơm trưa|paintbrush:cọ vẽ|computer:máy tính|word:từ|sentence:câu"],
    ["Animals", "noun", "chicken:gà|donkey:lừa|rabbit:thỏ|kitten:mèo con|puppy:chó con|lamb:cừu con|calf:bê con|duckling:vịt con|hen:gà mái|turkey:gà tây|goose:ngỗng|parrot:vẹt|hamster:chuột hamster|goldfish:cá vàng|dolphin:cá heo"],
  ],
  movers: [
    ["Daily routines", "verb phrase", "wake up:thức giấc|get dressed:mặc quần áo|brush your teeth:đánh răng|make the bed:dọn giường|have breakfast:ăn sáng|pack your bag:soạn cặp|leave home:rời nhà|catch the bus:bắt xe buýt|do your homework:làm bài tập về nhà|feed the pet:cho thú cưng ăn|set the table:dọn bàn ăn|wash the dishes:rửa bát|tidy your room:dọn phòng|take a shower:tắm vòi sen|go to bed:đi ngủ"],
    ["Places", "noun", "museum:bảo tàng|market:chợ|library:thư viện|hospital:bệnh viện|cinema:rạp chiếu phim|sports centre:trung tâm thể thao|supermarket:siêu thị|post office:bưu điện|police station:đồn cảnh sát|bus stop:điểm dừng xe buýt|town hall:tòa thị chính|bookshop:hiệu sách|swimming pool:bể bơi|park entrance:lối vào công viên|town square:quảng trường thị trấn"],
    ["Transport", "noun", "bicycle:xe đạp|motorbike:xe máy|taxi:xe taxi|tram:xe điện mặt đất|lorry:xe tải|helicopter:trực thăng|ferry:phà|coach:xe khách đường dài|underground:tàu điện ngầm|ticket:vé|platform:sân ga|passenger:hành khách|driver:tài xế|station:nhà ga|seat belt:dây an toàn"],
    ["Weather", "adjective", "sunny:có nắng|cloudy:nhiều mây|windy:có gió|rainy:có mưa|stormy:có giông|foggy:có sương mù|snowy:có tuyết|icy:đóng băng|dry:khô|wet:ướt|warm:ấm|cool:mát|hot:nóng|cold:lạnh|freezing:rét buốt"],
    ["Sports", "noun", "badminton:cầu lông|basketball:bóng rổ|football:bóng đá|tennis:quần vợt|volleyball:bóng chuyền|swimming:bơi lội|skating:trượt băng|cycling:đạp xe|running:chạy bộ|gymnastics:thể dục dụng cụ|goal:bàn thắng|team:đội|match:trận đấu|racket:vợt|helmet:mũ bảo hiểm"],
    ["Health", "noun", "headache:đau đầu|toothache:đau răng|stomach ache:đau bụng|cough:cơn ho|sore throat:đau họng|temperature:thân nhiệt|bandage:băng y tế|dentist:nha sĩ|nurse:y tá|doctor:bác sĩ|medicine:thuốc|knee:đầu gối|elbow:khuỷu tay|back:lưng|rest:sự nghỉ ngơi"],
    ["Activities", "verb phrase", "fly a kite:thả diều|paint a picture:vẽ một bức tranh|make a model:làm mô hình|read a comic:đọc truyện tranh|bake a cake:nướng bánh|plant a tree:trồng một cây|go fishing:đi câu cá|visit a museum:thăm bảo tàng|build a sandcastle:xây lâu đài cát|take a photo:chụp ảnh|learn a song:học một bài hát|walk the dog:dắt chó đi dạo|play chess:chơi cờ vua|write a postcard:viết bưu thiếp|go on a picnic:đi dã ngoại"],
  ],
  flyers: [
    ["Travel", "noun", "journey:chuyến đi|destination:điểm đến|luggage:hành lý|suitcase:va li|passport:hộ chiếu|boarding pass:thẻ lên máy bay|departure:giờ hoặc việc khởi hành|arrival:giờ hoặc việc đến|route:lộ trình|timetable:lịch trình|travel guide:sách hướng dẫn du lịch|youth hostel:nhà nghỉ giá rẻ cho khách trẻ|delay:sự chậm trễ|border:biên giới|return ticket:vé khứ hồi"],
    ["Environment", "noun", "habitat:môi trường sống|wildlife:động vật hoang dã|litter:rác vứt bừa bãi|recycling bin:thùng rác tái chế|rainforest:rừng mưa nhiệt đới|freshwater:nước ngọt|drought:hạn hán|flood:lũ lụt|solar energy:năng lượng mặt trời|coastline:đường bờ biển|air quality:chất lượng không khí|food waste:thức ăn bỏ đi|seedling:cây con|soil:đất trồng|shelter:nơi trú ẩn"],
    ["Technology", "noun", "screen:màn hình|keyboard:bàn phím|speaker:loa|headphones:tai nghe|charger:bộ sạc|battery:pin|website:trang web|password:mật khẩu|folder:thư mục|link:đường liên kết|attachment:tệp đính kèm|search engine:công cụ tìm kiếm|video call:cuộc gọi video|download:tệp đã tải xuống|update:bản cập nhật"],
    ["Adventures", "noun", "explorer:nhà thám hiểm|compass:la bàn|backpack:ba lô|torch:đèn pin|trail:đường mòn|campsite:bãi cắm trại|waterfall:thác nước|cliff:vách đá|valley:thung lũng|cave:hang động|island:hòn đảo|footprint:dấu chân|rope:dây thừng|rescue:cuộc giải cứu|treasure:kho báu"],
    ["Feelings", "adjective", "curious:tò mò|confident:tự tin|proud:tự hào|nervous:lo lắng|relieved:nhẹ nhõm|grateful:biết ơn|annoyed:bực mình|disappointed:thất vọng|confused:bối rối|embarrassed:ngượng ngùng|excited:hào hứng|worried:lo lắng|calm:bình tĩnh|surprised:ngạc nhiên|lonely:cô đơn"],
    ["Stories", "noun", "character:nhân vật|setting:bối cảnh|chapter:chương|plot:cốt truyện|ending:phần kết|beginning:phần mở đầu|narrator:người kể chuyện|dialogue:lời thoại|mystery:bí ẩn|clue:manh mối|adventure:cuộc phiêu lưu|event:sự kiện|scene:cảnh|title:tiêu đề|illustration:hình minh họa"],
    ["Communication", "verb", "explain:giải thích|describe:miêu tả|invite:mời|suggest:đề xuất|promise:hứa|agree:đồng ý|disagree:không đồng ý|reply:trả lời|whisper:thì thầm|announce:thông báo|repeat:lặp lại|remind:nhắc nhở|apologise:xin lỗi|introduce:giới thiệu|interrupt:ngắt lời"],
  ],
};

const starterTags = { kids: "Classroom objects", starters: "Animals", movers: "Places", flyers: "Environment" } as const;

export const starterLessons = deckIds.map(id => ({
  id, title: englishDecks[id].title, level: englishDecks[id].level, topic: starterTags[id], unit: "Unit 1",
  keys: englishDeckContent(id).map(item => `catalog/${id}/${item.prompt}`),
}));

export const vocabularyCatalog: BankWord[] = deckIds.flatMap(id => [
  ...englishDeckContent(id).map((item): BankWord => ({
    id: `catalog/${id}/${item.prompt}`, word: item.prompt, meaning: item.answers[0], level: englishDecks[id].level,
    topic: starterTags[id], part: ["protect", "collect", "improve", "recycle", "cross"].includes(item.prompt) ? "verb"
      : item.prompt === "opposite" ? "preposition" : item.prompt === "straight" ? "adverb" : "noun",
    ipa: item.english!.ipa ?? "", example: item.english!.example ?? "", related: "",
    uk: item.english!.uk, us: item.english!.us,
    image: ["book", "pencil"].includes(item.prompt) ? `/illustrations/puzzles/${item.prompt}.webp` : undefined,
  })),
  ...topics[id].flatMap(([topic, part, entries]) => entries.split("|").map((entry): BankWord => {
    const [word, meaning] = entry.split(":");
    return { id: `catalog/${id}/${word}`, word, meaning, part, level: englishDecks[id].level, topic, ipa: "", example: "", related: "" };
  })),
]);
