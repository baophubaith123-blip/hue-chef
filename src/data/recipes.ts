import type {
  ActionCookingMinigame,
  CookingAction,
  QuizMinigame,
  Recipe,
} from '@/data/types';

interface StepSeedItem {
  title: string;
  description: string;
  duration: number;
  requiredIngredients: string[];
  actionLabel: string;
}

function steps(recipeId: string, items: StepSeedItem[]) {
  return items.map((item, index) => ({
    id: `${recipeId}-step-${index + 1}`,
    order: index + 1,
    title: item.title,
    description: item.description,
    duration: item.duration,
    requiredIngredients: item.requiredIngredients,
    actionLabel: item.actionLabel,
  }));
}

function actionGame(
  id: string,
  question: string,
  ingredientId: string,
  correctAction: CookingAction,
  actions: CookingAction[] = ['steam', 'stir-fry', 'fry', 'grill', 'boil'],
  timeLimit = 15,
  scoreReward = 50,
): ActionCookingMinigame {
  return {
    id,
    type: 'action-cooking',
    question,
    timeLimit,
    scoreReward,
    data: {
      ingredientId,
      correctAction,
      actions,
    },
  };
}

function quizGame(
  id: string,
  question: string,
  options: string[],
  correctAnswerIndex: number,
  explanation: string,
  timeLimit = 20,
  scoreReward = 50,
): QuizMinigame {
  return {
    id,
    type: 'quiz',
    question,
    timeLimit,
    scoreReward,
    data: {
      options,
      correctAnswerIndex,
      explanation,
    },
  };
}

export const SEED_RECIPES: Recipe[] = [
  // 1. Bún bò Huế (5★, cần ≥ 3 action-cooking)
  {
    id: 'bun-bo-hue',
    name: 'Bún bò Huế',
    category: 'bun',
    difficulty: 5,
    duration: 240,
    description: 'Nước dùng cay nồng, sả và mắm ruốc đặc trưng.',
    image: '/images/bun-bo.jpg',
    baseScore: 1000,
    ingredients: [
      { ingredientId: 'beef-shank', amount: '500g' },
      { ingredientId: 'rice-noodle', amount: '400g' },
      { ingredientId: 'lemongrass', amount: '3 cây' },
      { ingredientId: 'shrimp-paste', amount: '2 muỗng' },
      { ingredientId: 'chili', amount: '5 trái' },
      { ingredientId: 'garlic', amount: '10g' },
    ],
    minigames: [
      quizGame(
        'quiz-bun-bo-hue-1',
        'Gia vị tạo nên mùi thơm đặc trưng không thể thiếu của nước dùng Bún bò Huế là gì?',
        ['Mắm ruốc và sả', 'Hoa hồi và thảo quả', 'Hạt tiêu đen và quế', 'Nước mắm nhỉ và giấm'],
        0,
        'Bún bò Huế đặc sắc bởi sự kết hợp tinh tế giữa sả phi thơm nồng và mắm ruốc xứ Huế đậm đà.',
      ),
      actionGame(
        'action-bun-bo-hue-1',
        'Hãy chọn cách sơ chế bắp bò trước khi ninh nước dùng:',
        'beef-shank',
        'boil',
        ['boil', 'stir-fry', 'fry', 'grill'],
      ),
      actionGame(
        'action-bun-bo-hue-2',
        'Thao tác phi thơm sả băm cùng dầu màu điều để tạo màu và hương vị nồi nước lèo:',
        'lemongrass',
        'stir-fry',
        ['stir-fry', 'boil', 'steam', 'grill'],
      ),
      actionGame(
        'action-bun-bo-hue-3',
        'Thao tác nấu sôi mắm ruốc rồi lọc lấy nước trong ngọt thanh cho nước dùng:',
        'shrimp-paste',
        'boil',
        ['boil', 'fry', 'steam', 'grill'],
      ),
    ],
    steps: steps('bun-bo-hue', [
      { title: 'Sơ chế bò', description: 'Rửa sạch bắp bò, luộc sơ qua.', duration: 40, requiredIngredients: ['beef-shank'], actionLabel: 'Luộc sơ' },
      { title: 'Phi sả', description: 'Phi thơm sả đập dập.', duration: 40, requiredIngredients: ['lemongrass'], actionLabel: 'Phi thơm' },
      { title: 'Phi tỏi', description: 'Phi tỏi băm thơm lừng.', duration: 40, requiredIngredients: ['garlic'], actionLabel: 'Phi tỏi' },
      { title: 'Nêm mắm ruốc', description: 'Nêm mắm ruốc Huế đậm vị.', duration: 40, requiredIngredients: ['shrimp-paste'], actionLabel: 'Nêm nếm' },
      { title: 'Thêm ớt cay', description: 'Thêm ớt tươi tạo vị cay nồng.', duration: 40, requiredIngredients: ['chili'], actionLabel: 'Thêm ớt' },
      { title: 'Trụng bún', description: 'Trụng bún tươi, chan nước dùng sôi.', duration: 40, requiredIngredients: ['rice-noodle'], actionLabel: 'Trụng' },
    ]),
  },

  // 2. Cơm hến (3★, cần ≥ 2 action-cooking)
  {
    id: 'com-hen',
    name: 'Cơm hến',
    category: 'com',
    difficulty: 3,
    duration: 150,
    description: 'Hến xào, rau sống, bánh tráng nướng giòn.',
    image: '/images/com-hen.jpg',
    baseScore: 600,
    ingredients: [
      { ingredientId: 'clams', amount: '300g' },
      { ingredientId: 'rice-paper', amount: '4 tờ' },
      { ingredientId: 'rice', amount: '2 chén' },
      { ingredientId: 'herbs-mix', amount: '1 rổ' },
    ],
    minigames: [
      quizGame(
        'quiz-com-hen-1',
        'Món cơm hến xứ Huế chuẩn vị xưa thường dùng loại cơm như thế nào?',
        ['Cơm nguội tơi hạt', 'Cơm nếp dẻo thơm', 'Cơm cháy giòn rụm', 'Cơm nóng hổi vừa chín'],
        0,
        'Theo đúng điệu Huế, cơm hến phải dùng cơm nguội để giữ được độ giòn mát của rau sống và giòn rụm của tóp mỡ.',
      ),
      actionGame(
        'action-com-hen-1',
        'Thao tác chế biến thịt hến với hành tỏi, ớt và mắm ruốc thơm lừng:',
        'clams',
        'stir-fry',
        ['stir-fry', 'boil', 'steam', 'fry'],
      ),
      actionGame(
        'action-com-hen-2',
        'Thao tác nấu chín gạo tẻ rồi để nguội trước khi trộn cơm hến:',
        'rice',
        'boil',
        ['boil', 'stir-fry', 'steam', 'grill'],
      ),
    ],
    steps: steps('com-hen', [
      { title: 'Luộc hến', description: 'Luộc hến, lấy thịt, giữ nước dùng.', duration: 45, requiredIngredients: ['clams'], actionLabel: 'Luộc' },
      { title: 'Nướng bánh tráng', description: 'Nướng bánh tráng giòn tan.', duration: 25, requiredIngredients: ['rice-paper'], actionLabel: 'Nướng' },
      { title: 'Trộn cơm', description: 'Trộn cơm nguội với hến xào.', duration: 45, requiredIngredients: ['rice'], actionLabel: 'Trộn' },
      { title: 'Rắc rau sống', description: 'Rắc rau sống và đậu phộng rang.', duration: 35, requiredIngredients: ['herbs-mix'], actionLabel: 'Hoàn thiện' },
    ]),
  },

  // 3. Bánh bèo (2★, cần ≥ 1 action-cooking)
  {
    id: 'banh-beo',
    name: 'Bánh bèo',
    category: 'banh',
    difficulty: 2,
    duration: 120,
    description: 'Bánh bèo chén, tôm cháy, mỡ hành thơm phức.',
    image: '/images/banh-beo.jpg',
    baseScore: 400,
    ingredients: [
      { ingredientId: 'rice-flour', amount: '200g' },
      { ingredientId: 'dried-shrimp', amount: '50g' },
      { ingredientId: 'fish-sauce', amount: '2 muỗng' },
    ],
    minigames: [
      quizGame(
        'quiz-banh-beo-1',
        'Phần "cháy" rắc lên mặt Bánh bèo chén Huế được làm từ nguyên liệu gì?',
        ['Tôm khô giã nhỏ rang vàng', 'Thịt heo băm phi hành', 'Đậu xanh đồ chín tán nhuyễn', 'Bột ớt cay rắc đều'],
        0,
        'Tôm cháy trên bánh bèo Huế làm từ tôm giã nhuyễn rồi sao khô vàng ươm thơm phức.',
      ),
      actionGame(
        'action-banh-beo-1',
        'Đổ bột vào chén nhỏ rồi cho vào xửng chế biến bằng cách nào để bánh xoáy sâu mềm mướt?',
        'rice-flour',
        'steam',
        ['steam', 'boil', 'fry', 'grill'],
      ),
      actionGame(
        'action-banh-beo-2',
        'Thao tác chấy tôm khô giã nhuyễn làm nhân rắc mặt bánh bèo:',
        'dried-shrimp',
        'stir-fry',
        ['stir-fry', 'fry', 'steam', 'boil'],
      ),
    ],
    steps: steps('banh-beo', [
      { title: 'Hấp bánh', description: 'Đổ bột gạo vào chén, hấp chín.', duration: 60, requiredIngredients: ['rice-flour'], actionLabel: 'Hấp' },
      { title: 'Làm tôm cháy', description: 'Rang tôm khô giòn thơm.', duration: 30, requiredIngredients: ['dried-shrimp'], actionLabel: 'Rang' },
      { title: 'Rưới nước mắm', description: 'Rưới nước mắm đường lên bánh bèo.', duration: 30, requiredIngredients: ['fish-sauce'], actionLabel: 'Rưới' },
    ]),
  },

  // 4. Bánh khoái (4★, cần ≥ 2 action-cooking)
  {
    id: 'banh-khoai',
    name: 'Bánh khoái',
    category: 'banh',
    difficulty: 4,
    duration: 200,
    description: 'Bánh khoái giòn rụm, nước lèo đậu phộng.',
    image: '/images/banh-khoai.jpg',
    baseScore: 800,
    ingredients: [
      { ingredientId: 'rice-flour', amount: '250g' },
      { ingredientId: 'turmeric', amount: '1 muỗng' },
      { ingredientId: 'shrimp', amount: '150g' },
      { ingredientId: 'pork-belly', amount: '100g' },
      { ingredientId: 'peanut', amount: '80g' },
    ],
    minigames: [
      quizGame(
        'quiz-banh-khoai-1',
        'Nước chấm đặc trưng của Bánh khoái xứ Huế gọi là gì?',
        ['Nước lèo đậu phộng và gan heo', 'Nước mắm tỏi ớt chua ngọt', 'Mắm tôm pha chanh đường', 'Xì dầu tỏi ớt'],
        0,
        'Nước lèo bánh khoái nấu từ tương đậu nành, gan heo, đậu phộng và mè rang béo ngậy đậm đà.',
      ),
      actionGame(
        'action-banh-khoai-1',
        'Đổ bột bánh khoai vào chảo gang dầu sôi chiên bằng cách nào để vỏ phồng giòn rụm?',
        'rice-flour',
        'fry',
        ['fry', 'steam', 'boil', 'stir-fry'],
      ),
      actionGame(
        'action-banh-khoai-2',
        'Chiên thịt ba chỉ xắt mỏng cháy cạnh giòn thơm làm nhân bánh khoái:',
        'pork-belly',
        'fry',
        ['fry', 'steam', 'boil', 'grill'],
      ),
    ],
    steps: steps('banh-khoai', [
      { title: 'Pha bột', description: 'Pha bột gạo mịn với nước lạnh.', duration: 35, requiredIngredients: ['rice-flour'], actionLabel: 'Pha' },
      { title: 'Khuấy nghệ', description: 'Thêm bột nghệ tạo màu vàng tươi.', duration: 35, requiredIngredients: ['turmeric'], actionLabel: 'Khuấy' },
      { title: 'Sơ chế tôm', description: 'Bóc vỏ tôm sú tươi.', duration: 40, requiredIngredients: ['shrimp'], actionLabel: 'Sơ chế' },
      { title: 'Chiên ba chỉ', description: 'Chiên ba chỉ xắt mỏng giòn rụm.', duration: 45, requiredIngredients: ['pork-belly'], actionLabel: 'Chiên' },
      { title: 'Nấu nước lèo', description: 'Nấu nước lèo đậu phộng sánh mịn.', duration: 45, requiredIngredients: ['peanut'], actionLabel: 'Nấu' },
    ]),
  },

  // 5. Bánh lọc (3★, cần ≥ 2 action-cooking)
  {
    id: 'banh-loc',
    name: 'Bánh lọc',
    category: 'banh',
    difficulty: 3,
    duration: 150,
    description: 'Bánh lọc trong suốt, tôm thịt đậm đà.',
    image: '/images/banh-loc.jpg',
    baseScore: 600,
    ingredients: [
      { ingredientId: 'shrimp', amount: '120g' },
      { ingredientId: 'pork-mince', amount: '100g' },
      { ingredientId: 'tapioca', amount: '200g' },
      { ingredientId: 'banana-leaf', amount: '10 lá' },
    ],
    minigames: [
      quizGame(
        'quiz-banh-loc-1',
        'Vỏ bánh lọc trong suốt, dai dẻo được làm từ loại bột nào?',
        ['Bột năng (bột đao)', 'Bột gạo tẻ', 'Bột nếp thơm', 'Bột mì đa dụng'],
        0,
        'Bột năng khi nhào với nước sôi và hấp/luộc chín sẽ trở nên trong suốt, khoe trọn nhân tôm thịt đỏ ửng bên trong.',
      ),
      actionGame(
        'action-banh-loc-1',
        'Rim xào tôm tươi với gia vị tiêu đường nước mắm đậm đà làm nhân:',
        'shrimp',
        'stir-fry',
        ['stir-fry', 'steam', 'boil', 'grill'],
      ),
      actionGame(
        'action-banh-loc-2',
        'Thao tác luộc bánh lọc trần trong nước sôi đến khi bánh nổi lên trong suốt:',
        'tapioca',
        'boil',
        ['boil', 'steam', 'fry', 'grill'],
      ),
    ],
    steps: steps('banh-loc', [
      { title: 'Xào tôm', description: 'Xào tôm tươi với gia vị đậm đà.', duration: 35, requiredIngredients: ['shrimp'], actionLabel: 'Xào' },
      { title: 'Sơ chế thịt', description: 'Cho thịt băm xào chung tôm.', duration: 35, requiredIngredients: ['pork-mince'], actionLabel: 'Sơ chế' },
      { title: 'Nhào bột năng', description: 'Nhào bột năng với nước sôi mịn dẻo.', duration: 40, requiredIngredients: ['tapioca'], actionLabel: 'Nhào' },
      { title: 'Gói lá chuối', description: 'Gói bánh lọc dẹt trong lá chuối.', duration: 40, requiredIngredients: ['banana-leaf'], actionLabel: 'Gói' },
    ]),
  },

  // 6. Bánh nậm (3★, cần ≥ 2 action-cooking)
  {
    id: 'banh-nam',
    name: 'Bánh nậm',
    category: 'banh',
    difficulty: 3,
    duration: 150,
    description: 'Bánh nậm gói lá chuối, nhân tôm thịt.',
    image: '/images/banh-nam.jpg',
    baseScore: 600,
    ingredients: [
      { ingredientId: 'rice-flour', amount: '180g' },
      { ingredientId: 'shrimp', amount: '100g' },
      { ingredientId: 'pork-mince', amount: '100g' },
      { ingredientId: 'banana-leaf', amount: '12 lá' },
    ],
    minigames: [
      quizGame(
        'quiz-banh-nam-1',
        'Bánh nậm truyền thống của xứ Huế thường được gói bằng lá gì?',
        ['Lá chuối tươi', 'Lá dong xanh', 'Lá sen thơm', 'Lá lốt rừng'],
        0,
        'Lá chuối tươi sau khi lau sạch hơ lửa mềm sẽ được dùng để gói bánh nậm dẹt mỏng trước khi đem hấp.',
      ),
      actionGame(
        'action-banh-nam-1',
        'Xào chín thịt băm và tôm băm cùng hành tím thơm lừng làm nhân bánh nậm:',
        'pork-mince',
        'stir-fry',
        ['stir-fry', 'steam', 'fry', 'boil'],
      ),
      actionGame(
        'action-banh-nam-2',
        'Gói bánh nậm trong lá chuối rồi đặt vào xửng hấp cách thủy chín mềm mướt:',
        'rice-flour',
        'steam',
        ['steam', 'boil', 'fry', 'grill'],
      ),
    ],
    steps: steps('banh-nam', [
      { title: 'Pha bột', description: 'Pha bột gạo mịn quấy đều.', duration: 30, requiredIngredients: ['rice-flour'], actionLabel: 'Pha' },
      { title: 'Xào tôm', description: 'Xào tôm tươi giã nhỏ.', duration: 40, requiredIngredients: ['shrimp'], actionLabel: 'Xào' },
      { title: 'Xào thịt băm', description: 'Xào thịt băm vàng thơm.', duration: 40, requiredIngredients: ['pork-mince'], actionLabel: 'Sơ chế' },
      { title: 'Gói nậm', description: 'Gói bánh dẹt trong lá chuối rồi hấp.', duration: 40, requiredIngredients: ['banana-leaf'], actionLabel: 'Gói' },
    ]),
  },

  // 7. Chè hạt sen (2★, cần ≥ 1 action-cooking)
  {
    id: 'che-hat-sen',
    name: 'Chè hạt sen',
    category: 'che',
    difficulty: 2,
    duration: 120,
    description: 'Chè hạt sen bùi, ngọt thanh, mát lành.',
    image: '/images/che-hat-sen.jpg',
    baseScore: 400,
    ingredients: [
      { ingredientId: 'lotus-seed', amount: '200g' },
      { ingredientId: 'palm-sugar', amount: '80g' },
      { ingredientId: 'coconut-milk', amount: '200ml' },
    ],
    minigames: [
      quizGame(
        'quiz-che-hat-sen-1',
        'Hạt sen ngon nhất xứ Huế để nấu món chè thanh tao này được hái từ đâu?',
        ['Hồ Tịnh Tâm', 'Sông Hương', 'Hồ Thủy Tiên', 'Đầm Cầu Hai'],
        0,
        'Hạt sen hồ Tịnh Tâm nổi tiếng từ thời triều Nguyễn vì độ bở bùi, thơm thanh đặc biệt.',
      ),
      actionGame(
        'action-che-hat-sen-1',
        'Ninh hạt sen tươi hồ Tịnh Tâm với lửa nhỏ liu riu cho mềm bùi thanh mát:',
        'lotus-seed',
        'boil',
        ['boil', 'steam', 'stir-fry', 'fry'],
      ),
      actionGame(
        'action-che-hat-sen-2',
        'Nấu tan đường thốt nốt cùng nước hạt sen tạo vị ngọt thanh:',
        'palm-sugar',
        'boil',
        ['boil', 'stir-fry', 'steam', 'grill'],
      ),
    ],
    steps: steps('che-hat-sen', [
      { title: 'Nấu hạt sen', description: 'Nấu hạt sen tươi mềm bùi.', duration: 55, requiredIngredients: ['lotus-seed'], actionLabel: 'Nấu' },
      { title: 'Nấu đường thốt nốt', description: 'Nấu đường thốt nốt ngọt thanh.', duration: 30, requiredIngredients: ['palm-sugar'], actionLabel: 'Nấu đường' },
      { title: 'Rưới cốt dừa', description: 'Rưới nước cốt dừa béo ngậy.', duration: 35, requiredIngredients: ['coconut-milk'], actionLabel: 'Rưới' },
    ]),
  },

  // 8. Nem lụi (4★, cần ≥ 2 action-cooking)
  {
    id: 'nem-lui',
    name: 'Nem lụi',
    category: 'nem',
    difficulty: 4,
    duration: 200,
    description: 'Nem nướng than hồng, cuốn bánh tráng chấm nước lèo.',
    image: '/images/nem-lui.jpg',
    baseScore: 800,
    ingredients: [
      { ingredientId: 'pork-mince', amount: '400g' },
      { ingredientId: 'fish-sauce', amount: '3 muỗng' },
      { ingredientId: 'lemongrass', amount: '4 cây' },
      { ingredientId: 'peanut', amount: '60g' },
      { ingredientId: 'rice-paper', amount: '8 tờ' },
    ],
    minigames: [
      quizGame(
        'quiz-nem-lui-1',
        'Nem lụi Huế khi nướng trên than hồng thường được quấn quanh que gì để tăng mùi thơm?',
        ['Cây sả tươi', 'Thanh tre vót nhọn', 'Đũa gỗ mun', 'Cuống lá mía'],
        0,
        'Thịt nem quấn quanh thân sả tươi khi nướng giúp tinh dầu sả thấm sâu vào thịt thơm lừng khó cưỡng.',
      ),
      actionGame(
        'action-nem-lui-1',
        'Quết nhuyễn thịt heo băm rồi nướng trên bếp than hồng đỏ rực:',
        'pork-mince',
        'grill',
        ['grill', 'steam', 'boil', 'stir-fry'],
      ),
      actionGame(
        'action-nem-lui-2',
        'Nấu xào nước lèo đậu phộng gan heo bùi béo sền sệt:',
        'peanut',
        'stir-fry',
        ['stir-fry', 'boil', 'steam', 'grill'],
      ),
    ],
    steps: steps('nem-lui', [
      { title: 'Ướp thịt', description: 'Ướp thịt heo băm đậm đà.', duration: 40, requiredIngredients: ['pork-mince'], actionLabel: 'Ướp' },
      { title: 'Nêm nước mắm', description: 'Nêm nước mắm tiêu hành.', duration: 35, requiredIngredients: ['fish-sauce'], actionLabel: 'Nêm nếm' },
      { title: 'Quấn cây sả', description: 'Quấn thịt quanh thân sả tươi.', duration: 45, requiredIngredients: ['lemongrass'], actionLabel: 'Quấn' },
      { title: 'Nấu nước lèo', description: 'Nấu nước lèo đậu phộng béo.', duration: 40, requiredIngredients: ['peanut'], actionLabel: 'Nấu' },
      { title: 'Cuốn bánh tráng', description: 'Cuốn nem lụi với bánh tráng.', duration: 40, requiredIngredients: ['rice-paper'], actionLabel: 'Cuốn' },
    ]),
  },

  // 9. Bún thịt nướng (3★, cần ≥ 2 action-cooking)
  {
    id: 'bun-thit-nuong',
    name: 'Bún thịt nướng',
    category: 'bun',
    difficulty: 3,
    duration: 150,
    description: 'Bún tươi, thịt nướng thơm, rau sống tươi mát.',
    image: '/images/bun-thit-nuong.jpg',
    baseScore: 600,
    ingredients: [
      { ingredientId: 'grilled-pork', amount: '300g' },
      { ingredientId: 'rice-noodle', amount: '350g' },
      { ingredientId: 'fish-sauce', amount: '4 muỗng' },
      { ingredientId: 'herbs-mix', amount: '1 rổ' },
    ],
    minigames: [
      quizGame(
        'quiz-bun-thit-nuong-1',
        'Thịt heo nướng trong món Bún thịt nướng Huế thường được ướp với gia vị chính nào?',
        ['Sả băm, mật ong và mè rang', 'Ngũ vị hương và sốt cà chua', 'Hạt tiêu sọ và giấm táo', 'Rượu mai quế lộ và tương đen'],
        0,
        'Sả băm nhỏ cùng chút mật mía/mật ong và mè rang giúp thịt nướng than hoa vàng óng, dậy mùi quyến rũ.',
      ),
      actionGame(
        'action-bun-thit-nuong-1',
        'Thịt ướp đậm vị được chế biến bằng cách nào trên vỉ than hoa cháy cạnh?',
        'grilled-pork',
        'grill',
        ['grill', 'boil', 'steam', 'stir-fry'],
      ),
      actionGame(
        'action-bun-thit-nuong-2',
        'Thao tác trụng bún tươi nhanh qua nước sôi rồi để ráo:',
        'rice-noodle',
        'boil',
        ['boil', 'stir-fry', 'fry', 'grill'],
      ),
    ],
    steps: steps('bun-thit-nuong', [
      { title: 'Nướng thịt', description: 'Nướng thịt heo cháy cạnh thơm lừng.', duration: 45, requiredIngredients: ['grilled-pork'], actionLabel: 'Nướng' },
      { title: 'Trụng bún', description: 'Trụng bún tươi ráo nước.', duration: 30, requiredIngredients: ['rice-noodle'], actionLabel: 'Trụng' },
      { title: 'Pha nước mắm', description: 'Pha nước mắm chua ngọt vị Huế.', duration: 35, requiredIngredients: ['fish-sauce'], actionLabel: 'Pha' },
      { title: 'Xếp rau sống', description: 'Xếp rau sống vào tô bún.', duration: 40, requiredIngredients: ['herbs-mix'], actionLabel: 'Xếp tô' },
    ]),
  },

  // 10. Bánh canh Nam Phổ (4★, cần ≥ 2 action-cooking)
  {
    id: 'banh-canh',
    name: 'Bánh canh Nam Phổ',
    category: 'banh',
    difficulty: 4,
    duration: 200,
    description: 'Bánh canh tôm thịt, nước dùng ngọt thanh.',
    image: '/images/banh-canh.jpg',
    baseScore: 800,
    ingredients: [
      { ingredientId: 'pork-hock', amount: '200g' },
      { ingredientId: 'shallot', amount: '80g' },
      { ingredientId: 'garlic', amount: '10g' },
      { ingredientId: 'rice-flour', amount: '300g' },
      { ingredientId: 'shrimp', amount: '150g' },
    ],
    minigames: [
      quizGame(
        'quiz-banh-canh-1',
        'Đặc trưng nổi bật của nước dùng Bánh canh Nam Phổ là gì?',
        ['Sánh sệt màu gạch tôm tự nhiên', 'Trong veo không chút váng mỡ', 'Nước cốt dừa ngọt béo ngậy', 'Nước hầm bò màu nâu cánh gián'],
        0,
        'Bánh canh Nam Phổ có nước dùng sánh sệt từ bột gạo/bột lọc hòa quyện cùng riêu tôm thịt đỏ au óng ả.',
      ),
      actionGame(
        'action-banh-canh-1',
        'Hầm ninh giò heo lấy nước lèo ngọt thanh cho bánh canh:',
        'pork-hock',
        'boil',
        ['boil', 'grill', 'steam', 'fry'],
      ),
      actionGame(
        'action-banh-canh-2',
        'Phi hành tím thơm giòn để dậy mùi béo ngậy cho nồi riêu tôm cua:',
        'shallot',
        'stir-fry',
        ['stir-fry', 'boil', 'steam', 'grill'],
      ),
    ],
    steps: steps('banh-canh', [
      { title: 'Ninh giò heo', description: 'Ninh giò heo ngọt nước.', duration: 45, requiredIngredients: ['pork-hock'], actionLabel: 'Ninh' },
      { title: 'Phi hành tím', description: 'Phi hành tím vàng giòn.', duration: 35, requiredIngredients: ['shallot'], actionLabel: 'Phi' },
      { title: 'Phi tỏi thơm', description: 'Phi tỏi thơm phức.', duration: 35, requiredIngredients: ['garlic'], actionLabel: 'Phi thơm' },
      { title: 'Nhào bột gạo', description: 'Nhào bột gạo ép sợi bánh canh.', duration: 45, requiredIngredients: ['rice-flour'], actionLabel: 'Nhào' },
      { title: 'Thêm tôm tươi', description: 'Cho tôm tươi ngọt thịt.', duration: 40, requiredIngredients: ['shrimp'], actionLabel: 'Luộc' },
    ]),
  },

  // 11. Bánh xèo Huế (4★, cần ≥ 2 action-cooking)
  {
    id: 'banh-xeo',
    name: 'Bánh xèo Huế',
    category: 'banh',
    difficulty: 4,
    duration: 200,
    description: 'Bánh xèo nhỏ giòn, nhân tôm thịt, chấm nước lèo.',
    image: '/images/banh-xeo.jpg',
    baseScore: 800,
    ingredients: [
      { ingredientId: 'crispy-pancake-batter', amount: '250g' },
      { ingredientId: 'turmeric', amount: '1/2 muỗng' },
      { ingredientId: 'shrimp', amount: '120g' },
      { ingredientId: 'pork-belly', amount: '100g' },
      { ingredientId: 'bean-sprout', amount: '100g' },
    ],
    minigames: [
      quizGame(
        'quiz-banh-xeo-1',
        'Bánh xèo Huế (bánh khoái nhỏ) có kích thước như thế nào so với bánh xèo miền Tây?',
        ['Nhỏ gọn vừa bằng lòng bàn tay, vỏ dày giòn', 'Rất lớn gấp đôi đĩa to, vỏ mỏng tanh', 'Vuông vức dày như bánh chưng', 'Dài thon như nem rán'],
        0,
        'Bánh xèo xứ Huế nhỏ nhắn, đổ trong chảo gang nhỏ, ăn kèm rau sống và nước lèo tương đậu.',
      ),
      actionGame(
        'action-banh-xeo-1',
        'Đổ lớp bột mỏng vào chảo dầu nóng chiên xèo xèo vàng giòn rụm:',
        'crispy-pancake-batter',
        'fry',
        ['fry', 'steam', 'boil', 'grill'],
      ),
      actionGame(
        'action-banh-xeo-2',
        'Chiên giòn thịt ba chỉ thái mỏng và tôm tươi trước khi gập đôi bánh:',
        'pork-belly',
        'fry',
        ['fry', 'steam', 'boil', 'grill'],
      ),
    ],
    steps: steps('banh-xeo', [
      { title: 'Pha bột xèo', description: 'Pha bột bánh xèo với nước.', duration: 35, requiredIngredients: ['crispy-pancake-batter'], actionLabel: 'Pha' },
      { title: 'Khuấy bột nghệ', description: 'Khuấy thêm bột nghệ vàng.', duration: 35, requiredIngredients: ['turmeric'], actionLabel: 'Khuấy' },
      { title: 'Cho tôm tươi', description: 'Cho tôm tươi vào khuôn chiên.', duration: 40, requiredIngredients: ['shrimp'], actionLabel: 'Sơ chế' },
      { title: 'Cho thịt ba chỉ', description: 'Cho thịt ba chỉ thái mỏng.', duration: 45, requiredIngredients: ['pork-belly'], actionLabel: 'Chiên' },
      { title: 'Thêm giá đỗ', description: 'Rắc giá đỗ giòn ngọt.', duration: 45, requiredIngredients: ['bean-sprout'], actionLabel: 'Hoàn thiện' },
    ]),
  },

  // 12. Bún mắm nêm (5★, cần ≥ 3 action-cooking)
  {
    id: 'bun-mam',
    name: 'Bún mắm nêm',
    category: 'bun',
    difficulty: 5,
    duration: 240,
    description: 'Bún mắm đậm đà, thịt heo quay, rau sống.',
    image: '/images/bun-mam.jpg',
    baseScore: 1000,
    ingredients: [
      { ingredientId: 'pork-mince', amount: '120g' },
      { ingredientId: 'fermented-fish', amount: '3 muỗng' },
      { ingredientId: 'chili', amount: '4 trái' },
      { ingredientId: 'pork-crackling', amount: '200g' },
      { ingredientId: 'herbs-mix', amount: '1 rổ' },
      { ingredientId: 'rice-noodle', amount: '400g' },
    ],
    minigames: [
      quizGame(
        'quiz-bun-mam-1',
        'Hương vị chủ đạo của tô Bún mắm nêm Huế đến từ loại mắm nào?',
        ['Mắm nêm cá cơm lên men chua mặn', 'Mắm tôm Bắc đậm đà', 'Mắm ruốc xào sả ớt', 'Nước mắm cốt nhĩ'],
        0,
        'Mắm nêm làm từ cá cơm tươi ủ chín, hòa cùng tỏi ớt giã nhuyễn và thơm tạo vị chua ngọt cay mặn đặc trưng.',
      ),
      actionGame(
        'action-bun-mam-1',
        'Nấu sôi mắm nêm lọc bỏ bã lấy nước cốt thơm nồng sánh đậm:',
        'fermented-fish',
        'boil',
        ['boil', 'stir-fry', 'steam', 'grill'],
      ),
      actionGame(
        'action-bun-mam-2',
        'Chiên da heo trong chảo dầu sôi đến khi phồng rộp giòn tan:',
        'pork-crackling',
        'fry',
        ['fry', 'boil', 'steam', 'grill'],
      ),
      actionGame(
        'action-bun-mam-3',
        'Xào thịt heo băm với tỏi ớt phi thơm để trộn bún:',
        'pork-mince',
        'stir-fry',
        ['stir-fry', 'boil', 'steam', 'grill'],
      ),
    ],
    steps: steps('bun-mam', [
      { title: 'Xào thịt băm', description: 'Xào thịt heo băm thơm lừng.', duration: 40, requiredIngredients: ['pork-mince'], actionLabel: 'Xào' },
      { title: 'Pha mắm nêm', description: 'Pha mắm nêm nguyên chất.', duration: 40, requiredIngredients: ['fermented-fish'], actionLabel: 'Pha' },
      { title: 'Thêm ớt cay', description: 'Thêm ớt băm cay nồng.', duration: 40, requiredIngredients: ['chili'], actionLabel: 'Thêm ớt' },
      { title: 'Thêm heo quay', description: 'Thái heo quay da giòn.', duration: 40, requiredIngredients: ['pork-crackling'], actionLabel: 'Sơ chế' },
      { title: 'Trộn rau sống', description: 'Trộn rau sống tươi mát.', duration: 40, requiredIngredients: ['herbs-mix'], actionLabel: 'Trộn' },
      { title: 'Trụng bún', description: 'Trụng bún tươi chan mắm.', duration: 40, requiredIngredients: ['rice-noodle'], actionLabel: 'Trụng' },
    ]),
  },

  // 13. Cơm âm phủ (4★, cần ≥ 2 action-cooking)
  {
    id: 'com-am-phu',
    name: 'Cơm âm phủ',
    category: 'com',
    difficulty: 4,
    duration: 200,
    description: 'Cơm trộn nhiều lớp topping, đặc sản Huế.',
    image: '/images/com-am-phu.jpg',
    baseScore: 800,
    ingredients: [
      { ingredientId: 'rice', amount: '3 chén' },
      { ingredientId: 'shrimp', amount: '100g' },
      { ingredientId: 'pork-mince', amount: '150g' },
      { ingredientId: 'shallot', amount: '60g' },
      { ingredientId: 'herbs-mix', amount: '1 bó' },
    ],
    minigames: [
      quizGame(
        'quiz-com-am-phu-1',
        'Món "Cơm âm phủ" Huế nổi tiếng với cách trình bày như thế nào?',
        ['Cơm đặt ở giữa, 7 loại thức ăn xếp xung quanh rực rỡ', 'Cơm cháy giòn cuộn tròn như sushi', 'Tất cả nguyên liệu xay nhuyễn nấu chung', 'Chỉ gồm cơm trắng chấm muối mè'],
        0,
        'Cơm âm phủ được bày biện như bông hoa 7 cánh với thịt nướng, chả lụa, nem chua, trứng tráng, tôm chấy, dưa leo và rau thơm quanh ụ cơm trắng.',
      ),
      actionGame(
        'action-com-am-phu-1',
        'Nấu gạo tẻ cho chín tơi xốp từng hạt trước khi bày đĩa hoa 7 cánh:',
        'rice',
        'boil',
        ['boil', 'stir-fry', 'steam', 'grill'],
      ),
      actionGame(
        'action-com-am-phu-2',
        'Xào tôm tươi giòn ngọt đậm đà để làm topping xếp quanh cơm:',
        'shrimp',
        'stir-fry',
        ['stir-fry', 'boil', 'steam', 'fry'],
      ),
    ],
    steps: steps('com-am-phu', [
      { title: 'Nấu cơm', description: 'Nấu cơm tơi xốp.', duration: 45, requiredIngredients: ['rice'], actionLabel: 'Nấu' },
      { title: 'Xào tôm tươi', description: 'Xào tôm tươi giòn ngọt.', duration: 35, requiredIngredients: ['shrimp'], actionLabel: 'Xào' },
      { title: 'Xào thịt băm', description: 'Xào thịt băm thơm nức.', duration: 35, requiredIngredients: ['pork-mince'], actionLabel: 'Sơ chế' },
      { title: 'Phi hành tím', description: 'Phi hành tím phi giòn.', duration: 40, requiredIngredients: ['shallot'], actionLabel: 'Phi' },
      { title: 'Rắc rau sống', description: 'Rắc rau sống thái nhỏ.', duration: 45, requiredIngredients: ['herbs-mix'], actionLabel: 'Trộn' },
    ]),
  },

  // 14. Bánh bột lọc (3★, cần ≥ 2 action-cooking)
  {
    id: 'banh-bot-loc',
    name: 'Bánh bột lọc',
    category: 'banh',
    difficulty: 3,
    duration: 150,
    description: 'Bánh bột lọc dai, tôm thịt đỏ au.',
    image: '/images/banh-bot-loc.jpg',
    baseScore: 600,
    ingredients: [
      { ingredientId: 'shrimp', amount: '130g' },
      { ingredientId: 'pork-belly', amount: '80g' },
      { ingredientId: 'tapioca', amount: '220g' },
      { ingredientId: 'banana-leaf', amount: '8 lá' },
    ],
    minigames: [
      quizGame(
        'quiz-banh-bot-loc-1',
        'Bánh bột lọc Huế luộc xong ăn kèm nước mắm như thế nào là đúng điệu?',
        ['Nước mắm ruốc nguyên chất dầm ớt xanh cay xé', 'Nước mắm chua ngọt pha tỏi chanh nhiều đường', 'Tương ớt ngọt đóng chai', 'Muối tiêu chanh ớt'],
        0,
        'Người Huế ăn bánh lọc với nước mắm ngon nguyên chất dầm ớt xiêm xanh cay nồng, không pha loãng với nước hay chanh đường.',
      ),
      actionGame(
        'action-banh-bot-loc-1',
        'Rim xào tôm thịt đậm vị tiêu đường nước mắm làm nhân bánh lọc:',
        'shrimp',
        'stir-fry',
        ['stir-fry', 'steam', 'boil', 'grill'],
      ),
      actionGame(
        'action-banh-bot-loc-2',
        'Bánh gói lá chuối được đặt vào xửng hấp cách thủy đến khi bột trong veo:',
        'tapioca',
        'steam',
        ['steam', 'boil', 'fry', 'grill'],
      ),
    ],
    steps: steps('banh-bot-loc', [
      { title: 'Sơ chế tôm', description: 'Ướp tôm tươi giòn.', duration: 35, requiredIngredients: ['shrimp'], actionLabel: 'Sơ chế' },
      { title: 'Thái ba chỉ', description: 'Thái ba chỉ mỏng nhỏ.', duration: 35, requiredIngredients: ['pork-belly'], actionLabel: 'Sơ chế' },
      { title: 'Nhào bột năng', description: 'Nhào bột năng với nước sôi.', duration: 40, requiredIngredients: ['tapioca'], actionLabel: 'Nhào' },
      { title: 'Gói lá chuối', description: 'Gói bánh hình thoi trong lá chuối.', duration: 40, requiredIngredients: ['banana-leaf'], actionLabel: 'Gói' },
    ]),
  },

  // 15. Chè bắp (2★, cần ≥ 1 action-cooking)
  {
    id: 'che-bap',
    name: 'Chè bắp',
    category: 'che',
    difficulty: 2,
    duration: 120,
    description: 'Chè bắp ngọt bùi, nước cốt dừa béo.',
    image: '/images/che-bap.jpg',
    baseScore: 400,
    ingredients: [
      { ingredientId: 'corn', amount: '3 bắp' },
      { ingredientId: 'palm-sugar', amount: '100g' },
      { ingredientId: 'coconut-milk', amount: '250ml' },
    ],
    minigames: [
      quizGame(
        'quiz-che-bap-1',
        'Giống bắp nổi tiếng nào của xứ Huế tạo nên món chè bắp trứ danh?',
        ['Bắp cồn Hến ngọt thơm dẻo hạt', 'Bắp ngọt Mỹ giòn vàng', 'Bắp nếp nương Tây Bắc', 'Bắp ngô tím sấy giòn'],
        0,
        'Bắp bãi bồi cồn Hến phù sa sông Hương cho hạt bắp non ngọt mềm tự nhiên, nấu chè không cần nhiều đường vẫn thơm nức.',
      ),
      actionGame(
        'action-che-bap-1',
        'Bào bắp non Cồn Hến ninh nhừ cùng nước lá dứa thơm lừng:',
        'corn',
        'boil',
        ['boil', 'stir-fry', 'steam', 'grill'],
      ),
      actionGame(
        'action-che-bap-2',
        'Nấu nước cốt dừa sôi lăn tăn béo ngậy rưới mặt chè:',
        'coconut-milk',
        'boil',
        ['boil', 'stir-fry', 'steam', 'fry'],
      ),
    ],
    steps: steps('che-bap', [
      { title: 'Tách hạt bắp', description: 'Tách hạt bắp tươi non.', duration: 35, requiredIngredients: ['corn'], actionLabel: 'Sơ chế' },
      { title: 'Nấu đường thốt nốt', description: 'Nấu đường thốt nốt dẻo quánh.', duration: 45, requiredIngredients: ['palm-sugar'], actionLabel: 'Nấu' },
      { title: 'Rưới cốt dừa', description: 'Rưới nước cốt dừa thơm béo.', duration: 40, requiredIngredients: ['coconut-milk'], actionLabel: 'Rưới' },
    ]),
  },
];

export function getRecipeById(id: string): Recipe | undefined {
  return SEED_RECIPES.find((recipe) => recipe.id === id);
}
