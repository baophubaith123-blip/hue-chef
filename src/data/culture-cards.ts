/**
 * Culture cards of the dish album (Kế hoạch hợp nhất, mục 4.4): one card
 * per dish, unlocked in the album when the player's best run of the dish
 * reaches 3 stars. Content data (like the recipes themselves) — each card
 * carries a short origin note and a cultural story in both languages.
 */
export interface CultureCardText {
  origin: string;
  story: string;
}

export interface CultureCard {
  recipeId: string;
  vi: CultureCardText;
  en: CultureCardText;
}

const CARDS: CultureCard[] = [
  // ---------- Chặng 1 · Gánh hàng rong & chợ Đông Ba ----------
  {
    recipeId: 'che-hat-sen',
    vi: {
      origin: 'Chè hạt sen là món ngự thiện của cung đình Huế, nấu từ hạt sen hồ Tịnh Tâm — giống sen thơm nổi tiếng ngay trong Hoàng thành.',
      story: 'Hạt sen phải bở mà không nát, nước đường phèn trong veo thoảng lá dứa. Xưa kia đây là món chè thanh tao dâng lên vua chúa sau bữa ngự thiện.',
    },
    en: {
      origin: 'Lotus seed sweet soup was an imperial dessert of the Hue court, made with lotus seeds from Tinh Tam lake inside the Imperial City.',
      story: 'The seeds must be tender but whole, the rock-sugar broth crystal clear with a hint of pandan — a refined dessert served to emperors after royal meals.',
    },
  },
  {
    recipeId: 'che-bap',
    vi: {
      origin: 'Chè bắp Huế nấu từ bắp non trồng ở cồn Hến giữa sông Hương, nơi hạt bắp dẻo và ngọt sữa tự nhiên.',
      story: 'Bắp bào mỏng nấu cùng nước cốt dừa và chút bột sắn cho sánh nhẹ. Một ly chè bắp mát lạnh là ký ức mùa hè của nhiều thế hệ người Huế.',
    },
    en: {
      origin: 'Hue corn sweet soup uses young corn grown on Hen islet in the middle of the Perfume River, where the kernels are naturally milky and sweet.',
      story: 'Shaved corn simmers with coconut milk and a touch of tapioca for body. A chilled glass of it is a summer memory for generations of Hue families.',
    },
  },
  {
    recipeId: 'banh-beo',
    vi: {
      origin: 'Bánh bèo là món ăn chơi trứ danh của Huế, đúc trong những chiếc chén sành nhỏ xíu và bán khắp các gánh hàng rong, ngõ hẻm.',
      story: 'Mặt bánh có xoáy tròn như đồng tiền, phủ tôm chấy đỏ au, mỡ hành và bánh mì chiên giòn. Người Huế ăn bánh bèo bằng que tre, chan thêm nước mắm ngọt cay.',
    },
    en: {
      origin: 'Banh beo is Hue\u2019s beloved snack, steamed in tiny ceramic cups and sold from street carts in every alley of the city.',
      story: 'Each cake dimples like a coin and is topped with dried shrimp, scallion oil and crunchy bread crumbs. Locals eat it with a bamboo stick and sweet-spicy fish sauce.',
    },
  },
  {
    recipeId: 'che-dau-xanh',
    vi: {
      origin: 'Chè đậu xanh là món chè dân dã có mặt trong mọi mâm cúng và bữa ăn thường ngày của người Huế.',
      story: 'Đậu xanh cà vỏ đánh nhuyễn mịn, thơm vani hoặc lá dứa. Ăn nóng ấm lòng ngày mưa, ăn lạnh với đá lại thành món giải nhiệt lành tính.',
    },
    en: {
      origin: 'Mung bean sweet soup is the humble dessert found on every Hue offering tray and family table.',
      story: 'Hulled mung beans are whipped silky smooth and scented with vanilla or pandan — warming on rainy days, refreshing over ice in the heat.',
    },
  },
  {
    recipeId: 'banh-uot',
    vi: {
      origin: 'Bánh ướt cuốn thịt là đặc sản làng Kim Long bên sông Hương, nơi những lò tráng bánh ướt mỏng như lụa hoạt động từ sáng sớm.',
      story: 'Tấm bánh ướt nóng hổi cuốn thịt nướng hoặc thịt luộc, rau thơm, chấm nước mắm tỏi ớt. Mềm, thơm và thanh — đúng khẩu vị tinh tế của người Huế.',
    },
    en: {
      origin: 'Banh uot rolls come from Kim Long village on the Perfume River, where steamed rice sheets are made silk-thin from early morning.',
      story: 'The warm, delicate sheet wraps grilled or boiled pork with herbs, dipped in garlic-chilli fish sauce — soft, fragrant and refined, true to Hue taste.',
    },
  },
  {
    recipeId: 'banh-nam',
    vi: {
      origin: 'Bánh nậm là món bánh gói lá dong của Huế, nhân tôm thịt xay nhuyễn phết mỏng trên lớp bột gạo dẻo.',
      story: 'Bánh nậm thường có mặt trong mâm cúng giỗ và các buổi ăn chơi tao nhã. Bóc lớp lá xanh, miếng bánh trắng mịn thơm mùi tôm, chấm nước mắm cay là đúng điệu.',
    },
    en: {
      origin: 'Banh nam is a Hue cake wrapped in dong leaves: a thin smear of shrimp-and-pork paste over soft rice batter.',
      story: 'It appears on ancestral offering trays and at gentle afternoon gatherings. Peel back the green leaf and dip the silky white cake in spicy fish sauce.',
    },
  },
  {
    recipeId: 'banh-bot-loc',
    vi: {
      origin: 'Bánh bột lọc là niềm tự hào của chợ Đông Ba: viên bánh trong veo nhìn thấu nhân tôm thịt đỏ hồng bên trong.',
      story: 'Bột lọc phải nhồi nước sôi thật khéo mới dai trong mà không cứng. Bánh luộc xong chan mỡ hành, ăn kèm nước mắm ớt — món quà chiều quen thuộc của người Huế.',
    },
    en: {
      origin: 'Banh bot loc is the pride of Dong Ba market: crystal-clear tapioca dumplings showing the pink shrimp-and-pork filling inside.',
      story: 'The dough is kneaded with boiling water for its signature chew. Boiled dumplings get scallion oil and chilli fish sauce — a classic Hue afternoon treat.',
    },
  },
  {
    recipeId: 'banh-loc',
    vi: {
      origin: 'Bánh lọc trần là biến thể không gói lá của bánh bột lọc, xuất hiện nhiều ở các quán ăn vặt và gánh rong Huế.',
      story: 'Viên bánh trần luộc chín nổi lên trong veo, dai giòn sần sật. Chỉ cần mỡ hành và chén nước mắm cay cũng đủ làm nên một món ăn chơi khó quên.',
    },
    en: {
      origin: 'Banh loc tran is the unwrapped cousin of banh bot loc, a staple of Hue snack stalls and street carts.',
      story: 'The bare dumplings boil up translucent and pleasantly chewy. Scallion oil and a bowl of spicy fish sauce are all it takes to make them unforgettable.',
    },
  },
  {
    recipeId: 'banh-cuon',
    vi: {
      origin: 'Bánh cuốn vào Huế theo chân người Bắc và được biến tấu thanh nhẹ hơn, ăn cùng chả quế và rau thơm.',
      story: 'Lớp bánh tráng trên nồi hơi phải mỏng tang mà không rách, cuốn nhân thịt mộc nhĩ. Chan nước mắm loãng ấm, rắc hành phi — món điểm tâm tinh tươm.',
    },
    en: {
      origin: 'Banh cuon travelled to Hue from the north and was lightened to local taste, served with cinnamon pork sausage and herbs.',
      story: 'The steamed sheet must be paper-thin yet unbroken, wrapped around pork and wood-ear mushroom. Warm diluted fish sauce and fried shallots finish it.',
    },
  },
  {
    recipeId: 'che-troi-nuoc',
    vi: {
      origin: 'Chè trôi nước gắn với ngày rằm và lễ cúng của người Việt, viên bánh tròn tượng trưng cho sự viên mãn.',
      story: 'Viên bột nếp nhân đậu xanh thả vào nước đường gừng ấm, rắc mè rang. Ở Huế, chè trôi nước thường được dâng cúng rồi cả nhà cùng thưởng thức khi còn nóng.',
    },
    en: {
      origin: 'Che troi nuoc belongs to full-moon days and offering rituals; its round dumplings symbolise wholeness and reunion.',
      story: 'Glutinous rice balls with mung bean filling float in warm ginger syrup, sprinkled with toasted sesame — offered first, then shared hot by the family.',
    },
  },
  {
    recipeId: 'banh-dap',
    vi: {
      origin: 'Bánh đập gốc Quảng Nam, theo chân người miền Trung ra Huế và thành món ăn sáng quen thuộc.',
      story: 'Một lớp bánh tráng nướng giòn kẹp tấm bánh ướt mềm, dùng tay "đập" cho vỡ giòn rồi chấm mắm nêm hoặc nước mắm tỏi. Tiếng bánh vỡ giòn là một phần của món ăn.',
    },
    en: {
      origin: 'Banh dap comes from Quang Nam and travelled with central Vietnamese cooks to become a familiar Hue breakfast.',
      story: 'A crisp grilled rice cracker sandwiches a soft wet sheet; you slap it to shatter, then dip in fermented pineapple sauce. The crunch is part of the dish.',
    },
  },
  {
    recipeId: 'va-tron',
    vi: {
      origin: 'Vả trộn là món chỉ Huế mới có, làm từ trái vả — loại quả họ sung mọc nhiều trong vườn nhà người Huế.',
      story: 'Vả luộc thái mỏng hết chát, trộn tôm thịt, rau răm, đậu phộng, xúc bằng bánh tráng mè nướng. Vị bùi chát nhẹ rất riêng, ăn một lần là nhớ.',
    },
    en: {
      origin: 'Va tron is found only in Hue, made from the va fruit — a fig relative that grows in local home gardens.',
      story: 'Boiled va is sliced thin to tame its astringency, tossed with shrimp, pork, laksa leaf and peanuts, scooped up with sesame crackers.',
    },
  },
  {
    recipeId: 'bun-rieu',
    vi: {
      origin: 'Bún riêu cua ở Huế được nấu từ cua đồng giã tay, thêm chút mắm ruốc cho dậy mùi rất riêng của đất cố đô.',
      story: 'Nồi riêu phải nổi váng cua vàng ươm, ăn kèm chả, huyết và rau sống thái nhỏ. Tô bún riêu chợ Đông Ba là bữa sáng quốc dân của người Huế.',
    },
    en: {
      origin: 'Hue bun rieu is built on hand-pounded river crab, lifted with a whisper of fermented shrimp paste — the old capital\u2019s signature depth.',
      story: 'The broth must carry a golden crab raft, with sausage, blood cubes and shredded herbs. A Dong Ba market bowl is Hue\u2019s national breakfast.',
    },
  },
  {
    recipeId: 'mi-quang',
    vi: {
      origin: 'Mì Quảng là hồn cốt ẩm thực Quảng Nam, theo người Quảng vào Huế và được yêu thích khắp miền Trung.',
      story: 'Sợi mì vàng nghệ chỉ chan xâm xấp nước dùng đậm đặc, ăn với bánh tráng nướng, đậu phộng và rau sống chín loại. Ít nước mà đậm vị là cái thần của mì Quảng.',
    },
    en: {
      origin: 'Mi Quang is the soul of Quang Nam cooking, carried into Hue and loved across the central region.',
      story: 'Turmeric-yellow noodles get only a ladle of concentrated broth, with grilled crackers, peanuts and nine kinds of herbs. Little liquid, deep flavour.',
    },
  },
  {
    recipeId: 'cao-lau',
    vi: {
      origin: 'Cao lầu là món chỉ Hội An mới nấu đúng vị: sợi mì làm từ nước giếng Bá Lễ và tro cây cù lao Chàm.',
      story: 'Tên gọi gợi thời xưa thực khách ngồi trên "lầu cao" ngắm phố đèn lồng mà ăn. Thịt xá xíu, da heo chiên giòn và chút nước sốt đậm làm nên tô cao lầu khó lẫn.',
    },
    en: {
      origin: 'Cao lau tastes right only in Hoi An: its noodles are made with water from the ancient Ba Le well and ash from the Cham islands.',
      story: 'The name recalls diners eating on a high floor above the lantern streets. Char siu pork, crackling and a spoon of dark sauce make it unmistakable.',
    },
  },
];

CARDS.push(
  // ---------- Chặng 2 · Quán nhỏ phố cổ ----------
  {
    recipeId: 'nem-lui',
    vi: {
      origin: 'Nem lụi là món nướng trứ danh của Huế: thịt heo xay quấn quanh cây sả, nướng trên than hồng thơm nức phố.',
      story: 'Gỡ nem khỏi cây sả, cuốn bánh tráng cùng rau thơm, chuối chát, khế chua rồi chấm nước lèo đậu phộng béo bùi. Món ăn chơi mà no, vui nhất là ăn theo nhóm.',
    },
    en: {
      origin: 'Nem lui is Hue\u2019s famous grill: seasoned minced pork moulded around lemongrass stalks and charred over coals.',
      story: 'Slide the meat off the stalk, wrap it in rice paper with herbs, star fruit and green banana, and dip in rich peanut sauce. Best eaten in a crowd.',
    },
  },
  {
    recipeId: 'banh-xeo',
    vi: {
      origin: 'Bánh xèo Huế nhỏ chỉ bằng bàn tay, đổ trong khuôn đất, vỏ giòn rụm khác hẳn chiếc bánh xèo to của miền Nam.',
      story: 'Nhân tôm đất, thịt ba chỉ và giá đỗ; cuốn rau sống chấm nước lèo hoặc nước mắm chua ngọt. Tiếng "xèo" khi đổ bột là âm thanh quen thuộc của phố Huế buổi chiều.',
    },
    en: {
      origin: 'Hue banh xeo is palm-sized, fried in clay moulds until shatter-crisp — quite unlike the big southern version.',
      story: 'Filled with river shrimp, pork belly and bean sprouts, wrapped in herbs and dipped in peanut sauce. The sizzle of batter is Hue\u2019s afternoon soundtrack.',
    },
  },
  {
    recipeId: 'bun-mam',
    vi: {
      origin: 'Bún mắm nêm là món ăn đậm chất miền Trung, linh hồn nằm ở chén mắm nêm pha từ cá cơm lên men.',
      story: 'Bún ăn kèm thịt heo luộc, tai heo giòn, rau sống và mít non; mắm nêm phải dậy mùi thơm, cay nồng mà không gắt. Ai ăn được mắm nêm là coi như đã "qua cửa" ẩm thực Huế.',
    },
    en: {
      origin: 'Bun mam nem is fiercely central Vietnamese; its soul is the dipping sauce of fermented anchovy pineapple mam nem.',
      story: 'Noodles come with boiled pork, crunchy pig ear, herbs and young jackfruit. The sauce must be aromatic and fiery yet balanced — a true Hue rite of passage.',
    },
  },
  {
    recipeId: 'banh-it-tran',
    vi: {
      origin: 'Bánh ít trần là viên bánh nếp tròn trịa của Huế, anh em với bánh ít lá gai nhưng không gói lá.',
      story: 'Vỏ nếp dẻo ôm nhân tôm thịt hoặc đậu xanh, phủ mỡ hành bóng mượt. Bánh nhỏ xinh, thường được bày trong các mâm bánh Huế nhiều món để ăn mỗi thứ một ít.',
    },
    en: {
      origin: 'Banh it tran is Hue\u2019s round glutinous dumpling, cousin of the leaf-wrapped banh it but served bare.',
      story: 'Chewy sticky-rice skin hugs shrimp-pork or mung bean filling under glossy scallion oil. It shines on mixed Hue cake platters — a little of everything.',
    },
  },
  {
    recipeId: 'banh-duc',
    vi: {
      origin: 'Bánh đúc là món bột gạo quấy dân dã, có mặt từ bữa ăn nhà nghèo xưa đến các gánh hàng rong ngày nay.',
      story: 'Bánh đúc nóng dẻo quánh, chan nước mắm hoặc nước ruốc, rắc hành phi và đậu phộng. Mộc mạc vậy thôi mà là hương vị tuổi thơ của nhiều người Huế.',
    },
    en: {
      origin: 'Banh duc is a humble stirred rice-flour cake, once a poor family\u2019s food and now a street-cart favourite.',
      story: 'Served warm and wobbly with fish sauce, fried shallots and peanuts — plain as can be, and pure childhood for many Hue locals.',
    },
  },
  {
    recipeId: 'mit-tron',
    vi: {
      origin: 'Mít trộn làm từ mít non — thứ quả vườn nhà miền Trung được tận dụng khi còn xanh để thành món trộn lạ miệng.',
      story: 'Mít non luộc xé sợi, trộn tôm thịt, da heo, rau răm và đậu phộng rang, xúc bánh tráng nướng. Giòn, bùi, thơm — món nhắm dân dã mà tinh tế.',
    },
    en: {
      origin: 'Mit tron uses young jackfruit — central Vietnam\u2019s garden fruit, picked green and turned into a lively salad.',
      story: 'Shredded boiled jackfruit meets shrimp, pork skin, laksa leaf and roasted peanuts, scooped with grilled crackers. Rustic yet refined.',
    },
  },
  {
    recipeId: 'xoi-ga',
    vi: {
      origin: 'Xôi gà là món điểm tâm chắc bụng của người Huế, nếp dẻo nấu vừa tới ăn cùng gà ta luộc xé phay.',
      story: 'Hạt xôi bóng mẩy phủ thịt gà vàng ươm, hành phi và chút muối tiêu. Các gánh xôi gà quanh chợ Đông Ba bán hết veo từ sớm tinh mơ.',
    },
    en: {
      origin: 'Xoi ga is Hue\u2019s hearty breakfast: perfectly steamed sticky rice with shredded free-range chicken.',
      story: 'Glossy grains are piled with golden chicken, fried shallots and pepper salt. Sticky-rice carts around Dong Ba market sell out by early morning.',
    },
  },
  {
    recipeId: 'goi-cuon',
    vi: {
      origin: 'Gỏi cuốn là món cuốn tươi mát phổ biến khắp Việt Nam, vào Huế được điểm thêm rau thơm vườn và chén tương đậu đậm đà.',
      story: 'Bánh tráng mỏng cuốn tôm, thịt, bún và rau sống; cuốn nào cũng phải chặt tay, trong veo thấy nhân. Ăn nhẹ nhàng, hợp những trưa hè oi ả.',
    },
    en: {
      origin: 'Goi cuon is Vietnam\u2019s fresh spring roll; in Hue it gains garden herbs and a deep peanut-hoisin dip.',
      story: 'Rice paper wraps shrimp, pork, vermicelli and herbs — rolled tight and translucent. A light, cooling bite for hot afternoons.',
    },
  },
  {
    recipeId: 'che-suong-sa',
    vi: {
      origin: 'Chè sương sa hạt lựu là món chè "nhiều màu" của miền Trung, gợi hình những hạt lựu đỏ và sương sa trong mát.',
      story: 'Củ năng bọc bột lọc nhuộm lá cẩm, lá dứa; thêm sương sáo, thạch và nước cốt dừa. Một ly chè như vườn hoa nhỏ — đẹp mắt trước khi ngon miệng.',
    },
    en: {
      origin: 'Che suong sa hat luu is central Vietnam\u2019s many-coloured dessert, named for its pomegranate-like pearls and cool jellies.',
      story: 'Water chestnuts in tinted tapioca, grass jelly and coconut milk — a little flower garden in a glass, pretty before it is delicious.',
    },
  },
  {
    recipeId: 'banh-phu-the',
    vi: {
      origin: 'Bánh phu thê còn gọi là bánh xu xê, món bánh truyền thống trong lễ cưới hỏi, tên gọi tượng trưng cho tình nghĩa vợ chồng.',
      story: 'Vỏ bánh trong dai làm từ bột lọc và dừa, nhân đậu xanh ngọt dịu. Ngày xưa bánh được gói trong hai lớp lá dừa úp vào nhau như đôi lứa khăng khít.',
    },
    en: {
      origin: 'Banh phu the, also called banh xu xe, is the wedding cake of Vietnamese tradition — its name means "husband and wife".',
      story: 'Translucent chewy skin of tapioca and coconut wraps sweet mung bean. It was once packed between two coconut leaves pressed together like a couple.',
    },
  },
  {
    recipeId: 'tom-chua',
    vi: {
      origin: 'Tôm chua là đặc sản lên men nổi tiếng nhất của Huế: tôm đất ủ chua cùng riềng, tỏi, ớt cho đến khi đỏ au thơm nồng.',
      story: 'Tôm chua ăn kèm thịt ba chỉ luộc, rau sống, chuối chát, khế và bánh tráng — đủ vị chua cay mặn ngọt trong một cuốn. Khách xa đến Huế hầu như ai cũng mang một hũ về làm quà.',
    },
    en: {
      origin: 'Tom chua is Hue\u2019s most famous ferment: river shrimp soured with galangal, garlic and chilli until glowing red.',
      story: 'It is rolled with boiled pork belly, herbs, green banana and star fruit — sour, spicy, salty, sweet in one bite. Every visitor takes a jar home.',
    },
  },
  {
    recipeId: 'bun-nghe',
    vi: {
      origin: 'Bún nghệ là món ăn "giải cảm" của người Huế: bún xào với nghệ tươi giã nhuyễn vàng rực cùng lòng heo hoặc thịt.',
      story: 'Nghệ ấm nóng, thơm nồng; tô bún nghệ cay nhẹ thường được nấu khi trong nhà có người ốm. Dân dã mà chứa cả tấm lòng chăm sóc của người nấu.',
    },
    en: {
      origin: 'Bun nghe is Hue\u2019s cold-fighting bowl: noodles stir-fried golden with pounded fresh turmeric and pork or offal.',
      story: 'Warm, pungent and gently spicy, it is the bowl cooked when someone at home is unwell — humble food carrying a cook\u2019s care.',
    },
  },
  {
    recipeId: 'banh-trang-cuon',
    vi: {
      origin: 'Bánh tráng cuốn thịt heo là món tự hào của phố cổ Huế, nổi tiếng với miếng thịt "hai đầu da" luộc khéo hiếm nơi có.',
      story: 'Thịt thái mỏng cuốn bánh tráng cùng rau thơm đủ loại, chấm mắm nêm sóng sánh. Sự cầu kỳ nằm ở khâu chọn thịt và luộc sao cho hai đầu đều là da giòn.',
    },
    en: {
      origin: 'Banh trang cuon thit heo is old-town Hue\u2019s pride, famous for pork slices boiled so both ends keep their skin — "two-ended skin".',
      story: 'Thin pork, a garden of herbs and glossy mam nem for dipping. The craft lies in choosing and boiling the cut so the skin stays crisp at both ends.',
    },
  },
  {
    recipeId: 'com-ga-hoi-an',
    vi: {
      origin: 'Cơm gà Hội An nấu cơm bằng nước luộc gà pha nghệ, hạt cơm vàng óng, là biểu tượng ẩm thực phố đèn lồng.',
      story: 'Gà ta xé phay trộn hành tây rau răm, ăn kèm cơm dẻo thơm và chén nước luộc ngọt. Món ăn theo chân người Hội An đi khắp miền Trung, trong đó có Huế.',
    },
    en: {
      origin: 'Hoi An chicken rice cooks its grains in chicken broth and turmeric until golden — the lantern town\u2019s edible emblem.',
      story: 'Shredded chicken tossed with onion and laksa leaf sits over fragrant rice with a cup of sweet broth. The dish travelled all over the centre, Hue included.',
    },
  },
);

CARDS.push(
  // ---------- Chặng 3 · Bếp cung đình ----------
  {
    recipeId: 'bun-thit-nuong',
    vi: {
      origin: 'Bún thịt nướng là món ăn trưa phổ biến của miền Trung — Nam, với thịt nướng than hoa thơm lừng các con phố Huế.',
      story: 'Thịt ướp sả tỏi nướng xém cạnh, ăn cùng bún, rau thơm, đồ chua và nước mắm chua ngọt rưới đều. Đơn giản mà hài hoà đủ vị.',
    },
    en: {
      origin: 'Bun thit nuong is the central and southern lunch bowl, its charcoal-grilled pork perfuming Hue streets at noon.',
      story: 'Lemongrass-garlic pork charred at the edges, noodles, herbs, pickles and a pour of sweet-sour fish sauce — simple and perfectly balanced.',
    },
  },
  {
    recipeId: 'banh-khoai',
    vi: {
      origin: 'Bánh khoái là "anh em" của bánh xèo nhưng là niềm tự hào riêng của Huế, nổi tiếng ở khu Thượng Thành gần Hoàng thành.',
      story: 'Tên "khoái" vì ăn vào thấy khoái khẩu: bánh dày, giòn, nhân tôm thịt trứng, chấm nước lèo gan heo đậu phộng béo ngậy rất riêng, không lẫn với nơi nào.',
    },
    en: {
      origin: 'Banh khoai is banh xeo\u2019s proud Hue sibling, famous in the Thuong Thanh quarter beside the Imperial City.',
      story: 'Its name means "delight": a thick crisp cake of shrimp, pork and egg, dipped in a rich pork-liver peanut sauce found nowhere else.',
    },
  },
  {
    recipeId: 'banh-canh',
    vi: {
      origin: 'Bánh canh Nam Phổ gắn với làng Nam Phổ ven phá Tam Giang, nơi những gánh bánh canh đỏ au màu gạch cua đã thành thương hiệu.',
      story: 'Sợi bánh canh bột gạo pha bột lọc dai mềm, nước dùng sệt sánh với chả cua, tôm và hành ngò. Tô bánh canh gánh vào phố là bữa quà chiều thân thương của người Huế.',
    },
    en: {
      origin: 'Banh canh Nam Pho belongs to Nam Pho village by Tam Giang lagoon, whose crab-red soup pots became a brand of their own.',
      story: 'Chewy rice-tapioca noodles in a thick broth with crab sausage and shrimp. Carried into town on shoulder poles, it is Hue\u2019s beloved afternoon gift.',
    },
  },
  {
    recipeId: 'ca-kho-to',
    vi: {
      origin: 'Cá kho tộ là món cơm nhà kinh điển: cá kho trong nồi đất cùng nước dừa và tiêu sọ cho đến khi sánh keo, thơm nức.',
      story: 'Nồi cá kho đạt chuẩn phải có màu cánh gián, thịt cá săn mà không khô. Ăn với cơm trắng nóng và rau luộc là đủ một bữa cơm Huế đầm ấm.',
    },
    en: {
      origin: 'Ca kho to is the classic home pot: fish braised in clay with coconut water and peppercorns until glossy and reduced.',
      story: 'A proper pot is deep amber, the fish firm yet moist. Hot white rice and boiled greens are all a warm Hue dinner needs.',
    },
  },
  {
    recipeId: 'thit-kho-tau',
    vi: {
      origin: 'Thịt kho tàu là món kho quốc dân của miền Nam — Trung, thường nấu nồi to ăn dần trong nhiều ngày, càng kho lại càng thấm.',
      story: 'Cái tên "tàu" được giải thích theo nghĩa con sông nước ngọt: thịt kho vị ngọt thanh của nước dừa, khác vị mặn của kho Bắc. Trứng kho thấm nâu là phần được giành nhau nhất.',
    },
    en: {
      origin: 'Thit kho tau is the great southern-central braise, cooked in big pots to last days and tasting better each reheating.',
      story: 'Its "tau" is linked to river water — a gentle coconut sweetness unlike the saltier northern braise. The brown-stained eggs are fought over.',
    },
  },
  {
    recipeId: 'canh-chua-ca',
    vi: {
      origin: 'Canh chua cá là món canh giải ngán của miền Trung — Nam, chua thanh từ me hoặc thơm, nấu cùng cá sông tươi.',
      story: 'Nồi canh phải đủ chua — cay — thơm mùi ngò gai, ăn lúc sôi sùng sục bên mâm cơm có thêm nồi cá kho. Cặp đôi canh chua — cá kho là chuẩn cơm nhà Việt.',
    },
    en: {
      origin: 'Canh chua ca is the centre-south\u2019s palate-cleansing soup, bright with tamarind or pineapple and fresh river fish.',
      story: 'It must be sour, hot and fragrant with sawtooth herb, served bubbling beside a pot of braised fish — Vietnam\u2019s classic home pairing.',
    },
  },
  {
    recipeId: 'bo-kho',
    vi: {
      origin: 'Bò kho là món hầm chịu ảnh hưởng ẩm thực Hoa và Pháp, du nhập rồi bén rễ sâu trong bữa ăn miền Trung — Nam.',
      story: 'Thịt bò hầm mềm cùng sả, quế, hồi và cà rốt, nước sốt đỏ au thơm nồng. Ăn với bánh mì chấm sốt hay hủ tiếu đều ngon — món ăn sáng "sang" của nhiều gia đình.',
    },
    en: {
      origin: 'Bo kho is a braise shaped by Chinese and French cooking that put down deep roots in central and southern Vietnam.',
      story: 'Beef simmers tender with lemongrass, cinnamon, star anise and carrot in a rust-red sauce. With baguette for dipping, it is a festive breakfast.',
    },
  },
  {
    recipeId: 'muc-rim-me',
    vi: {
      origin: 'Mực rim me là món hải sản chua ngọt của vùng biển miền Trung, nơi mực tươi được rim cùng me cho đến khi bóng mượt.',
      story: 'Miếng mực dai giòn thấm vị me chua, đường ngọt và ớt cay — vừa là món nhắm, vừa "hao cơm" bậc nhất. Mâm cơm có đĩa mực rim là thấy vui nhà.',
    },
    en: {
      origin: 'Muc rim me is the central coast\u2019s sweet-sour squid, glazed with tamarind until it shines.',
      story: 'Chewy-crisp squid soaked in tamarind tang, sugar and chilli heat — a drinker\u2019s snack and a champion rice-finisher in one.',
    },
  },
  {
    recipeId: 'bun-ca-ngu',
    vi: {
      origin: 'Bún cá ngừ là món ăn của các làng biển miền Trung, nấu từ cá ngừ đại dương tươi rói vừa cập bến.',
      story: 'Nước dùng trong, ngọt thanh vị cá, điểm cay nồng của ớt xanh. Tô bún cá ngừ nóng hổi là cách ngư dân bắt đầu một ngày ra khơi mới.',
    },
    en: {
      origin: 'Bun ca ngu comes from the central fishing villages, cooked from ocean tuna the moment the boats land.',
      story: 'A clear, sweet fish broth warmed with green chilli. A steaming bowl is how fishermen start a new day at sea.',
    },
  },
  {
    recipeId: 'vit-nau-chao',
    vi: {
      origin: 'Vịt nấu chao là món ăn sum họp của miền Trung — Nam, nổi bật nhờ chao đỏ lên men béo thơm rất đặc trưng.',
      story: 'Thịt vịt thấm chao, khoai môn bở tơi hút nước sốt béo ngậy. Nồi vịt nấu chao thường xuất hiện trong những bữa ăn đông người, càng đông càng vui.',
    },
    en: {
      origin: 'Vit nau chao is a gathering dish of the centre-south, defined by fermented red beancurd — rich and unmistakably aromatic.',
      story: 'Duck soaks up the chao while taro melts into the sauce. It is a pot for crowds; the more people around it, the better.',
    },
  },
  {
    recipeId: 'tom-su-nuong',
    vi: {
      origin: 'Tôm sú nướng muối ớt dùng tôm sú đầm phá Tam Giang — vùng đầm phá lớn nhất Đông Nam Á ngay cạnh Huế.',
      story: 'Tôm tươi chỉ cần ướp muối ớt rồi nướng than cho vỏ đỏ au, thịt chắc ngọt. Món ăn giữ trọn vị biển, không cần chế biến cầu kỳ.',
    },
    en: {
      origin: 'Tom su nuong uses black tiger prawns from Tam Giang — Southeast Asia\u2019s largest lagoon system, right beside Hue.',
      story: 'Fresh prawns need only salt and chilli before the grill: red shells, firm sweet flesh. The sea\u2019s flavour, left alone.',
    },
  },
  {
    recipeId: 'heo-quay',
    vi: {
      origin: 'Heo quay giòn bì là món lễ và tiệc của người Việt: miếng heo quay bì vàng nổ giòn thường có mặt trong mâm cúng và đám tiệc.',
      story: 'Bí quyết nằm ở khâu xăm bì, phơi và quay lửa đều cho bì phồng rộp mà thịt vẫn mọng nước. Tiếng dao chặt "rốp rốp" trên thớt là âm thanh của ngày vui.',
    },
    en: {
      origin: 'Heo quay is Vietnam\u2019s feast pork: crackling-skinned roast pork present at offerings and celebrations.',
      story: 'The secret is pricking, drying and even roasting so the skin blisters while the meat stays juicy. The chopping board\u2019s crackle is the sound of a party.',
    },
  },
  {
    recipeId: 'ga-nuong-muoi-ot',
    vi: {
      origin: 'Gà nướng muối ớt là món nướng dân dã của miền Trung, dùng gà ta thả vườn thịt chắc thơm.',
      story: 'Gà ướp muối ớt sả, nướng than đến khi da vàng giòn, xé tay chấm muối tiêu chanh. Món ăn của những buổi tụ họp ngoài trời, càng đơn giản càng ngon.',
    },
    en: {
      origin: 'Ga nuong muoi ot is the centre\u2019s rustic grill: free-range chicken with firm, fragrant meat.',
      story: 'Marinated in salt, chilli and lemongrass, grilled until the skin crisps, torn by hand and dipped in lime pepper salt. Outdoor food at its best.',
    },
  },
  {
    recipeId: 'lau-bo',
    vi: {
      origin: 'Lẩu bò nhúng giấm là món lẩu thanh nhẹ: nước dùng chua thơm từ giấm và nước dừa, khác hẳn các loại lẩu cay nồng.',
      story: 'Thịt bò thái mỏng nhúng nhanh tay cho vừa tái, cuốn bánh tráng với rau thơm và dứa, chấm mắm nêm. Ăn lẩu mà vẫn thấy nhẹ nhàng, thanh mát.',
    },
    en: {
      origin: 'Lau bo nhung giam is the light hotpot: a fragrant vinegar-coconut broth instead of the usual fiery soup.',
      story: 'Paper-thin beef is swished just to blushing, rolled with herbs and pineapple, dipped in mam nem. A hotpot that still feels fresh.',
    },
  },
  {
    recipeId: 'cha-tom',
    vi: {
      origin: 'Chả tôm là món chả cao cấp của Huế: tôm đất quết dai cùng thịt và mỡ, xưa thường có mặt trong mâm cỗ và tiệc cung đình nhỏ.',
      story: 'Chả tôm đạt chuẩn phải dai, ngọt tự nhiên vị tôm, thơm mùi than khi nướng. Người Huế hay ăn chả tôm cùng bánh ướt hoặc cơm, chấm nước mắm pha khéo.',
    },
    en: {
      origin: 'Cha tom is Hue\u2019s premium sausage: pounded river prawns with pork and fat, once served at feasts and small court banquets.',
      story: 'Good cha tom is springy and naturally sweet, fragrant from the grill. Hue families pair it with banh uot or rice and a well-judged fish sauce.',
    },
  },
  {
    recipeId: 'che-to-yen',
    vi: {
      origin: 'Chè tổ yến là món chè thượng hạng của cung đình: tổ yến — "vàng trắng" của biển Khánh Hoà — chưng cùng hạt sen và đường phèn.',
      story: 'Yến phải chưng cách thuỷ nhẹ nhàng để sợi yến trong, giòn nhẹ mà không tan. Đây từng là món bồi bổ chỉ dành cho vua chúa và hoàng tộc nhà Nguyễn.',
    },
    en: {
      origin: 'Che to yen is the court\u2019s supreme dessert: bird\u2019s nest — the "white gold" of Khanh Hoa — steamed with lotus seeds and rock sugar.',
      story: 'The nest is gently double-steamed so its strands stay clear and delicate. It was once a tonic reserved for Nguyen emperors and royalty.',
    },
  },
  {
    recipeId: 'bun-bo-hue',
    vi: {
      origin: 'Bún bò Huế là biểu tượng ẩm thực cố đô, tương truyền hình thành từ thời các chúa Nguyễn mở mang xứ Đàng Trong, gắn với làng Vân Cù.',
      story: 'Linh hồn tô bún là mắm ruốc Huế và sả: nước dùng đỏ au, cay thơm, có giò heo, thịt bò, chả cua. Người Huế ăn bún bò vào buổi sáng, kèm rau sống và quẩy — một thói quen khó bỏ.',
    },
    en: {
      origin: 'Bun bo Hue is the old capital\u2019s emblem, said to date from the Nguyen lords\u2019 southern expansion and the village of Van Cu.',
      story: 'Its soul is Hue shrimp paste and lemongrass: a rust-red, fiery broth with pork knuckle, beef and crab sausage. Hue eats it for breakfast, always.',
    },
  },
  {
    recipeId: 'com-hen',
    vi: {
      origin: 'Cơm hến sinh ra ở cồn Hến giữa sông Hương, từ món ăn của dân chài nghèo thành đặc sản không thể thiếu của Huế.',
      story: 'Cơm nguội trộn hến xào, mắm ruốc, rau thơm, da heo chiên giòn và đậu phộng; chan thêm chén nước hến nóng trong veo. Dân dã mà đủ vị chua cay mặn ngọt bùi.',
    },
    en: {
      origin: 'Com hen was born on Hen islet in the Perfume River — a poor fishermen\u2019s meal that became essential Hue.',
      story: 'Cold rice tossed with stir-fried baby clams, shrimp paste, herbs, crackling and peanuts, plus a cup of clear hot clam broth. Humble, and complete.',
    },
  },
  {
    recipeId: 'com-am-phu',
    vi: {
      origin: 'Cơm âm phủ ra đời từ một quán cơm đêm gần ga Huế những năm 1930, phục vụ khách đi tàu khuya dưới ánh đèn dầu leo lét như "cõi âm".',
      story: 'Đĩa cơm trộn đủ thứ: thịt nướng, chả, trứng, rau dưa — như một bữa cơm thập cẩm của người lao động đêm. Cái tên rùng rợn lại làm nên thương hiệu trăm năm.',
    },
    en: {
      origin: 'Com am phu — "hell rice" — began at a night stall near Hue station in the 1930s, serving late train passengers under a flickering oil lamp.',
      story: 'A mixed plate of grilled pork, sausage, egg and pickles for night workers. Its spooky name became a century-old brand.',
    },
  },
  {
    recipeId: 'nem-cong',
    vi: {
      origin: 'Nem công là món ngự thiện huyền thoại của triều Nguyễn, xưa làm từ thịt chim công — linh vật tượng trưng cho sự cao quý.',
      story: 'Nem công cùng chả phượng làm thành cặp món đứng đầu yến tiệc cung đình, tượng trưng cho âm dương hài hoà. Ngày nay nem công được làm từ thịt heo, thịt gà theo đúng nghi thức cũ.',
    },
    en: {
      origin: 'Nem cong is the Nguyen court\u2019s legendary royal dish, once made from peacock — a symbol of nobility.',
      story: 'With cha phuong it formed the supreme pair of imperial banquets, yin and yang on one tray. Today it is made from pork and chicken by the old ritual.',
    },
  },
  {
    recipeId: 'cha-phuong',
    vi: {
      origin: 'Chả phượng là món ngự thiện tạo hình chim phượng hoàng, xưa làm từ thịt chim trĩ, chỉ xuất hiện trong đại yến của triều Nguyễn.',
      story: 'Người đầu bếp cung đình phải tỉa, nặn chả thành hình phượng xoè cánh sống động — nấu ăn nâng thành nghệ thuật. Cặp nem công chả phượng là đỉnh cao của ẩm thực cung đình Huế.',
    },
    en: {
      origin: 'Cha phuong is the imperial dish sculpted as a phoenix, once made from pheasant and served only at great Nguyen court banquets.',
      story: 'Royal chefs carved and shaped the sausage into a phoenix with spread wings — cooking raised to art. With nem cong, it is Hue court cuisine\u2019s peak.',
    },
  },
);

export const CULTURE_CARDS: Record<string, CultureCard> = Object.fromEntries(
  CARDS.map((card) => [card.recipeId, card]),
);

export function getCultureCard(recipeId: string): CultureCard | undefined {
  return CULTURE_CARDS[recipeId];
}
