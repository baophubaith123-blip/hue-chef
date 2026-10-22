import { renderToString } from 'react-dom/server';

import { IngredientProvider } from '@/contexts/IngredientContext';
import { RecipeProvider } from '@/contexts/RecipeContext';
import { ActionCookingGame } from '@/features/cooking/components/minigames/ActionCookingGame';
import type { ActionCookingMinigame } from '@/features/recipes/types';
import { LanguageProvider } from '@/i18n/useTranslation';

function renderGame(minigame: ActionCookingMinigame) {
  return renderToString(
    <LanguageProvider>
      <RecipeProvider>
        <IngredientProvider>
          <ActionCookingGame
            minigame={minigame}
            onComplete={(_success, _score) => {}}
          />
        </IngredientProvider>
      </RecipeProvider>
    </LanguageProvider>,
  );
}

export function runActionCookingGameSmokeTests(): { passed: boolean; message: string } {
  // Test 1: Minigame with ingredient that has image
  const minigameWithImage: ActionCookingMinigame = {
    id: 'test-action-1',
    type: 'action-cooking',
    question: 'Chế biến tôm thịt cho món Bún bò Huế?',
    timeLimit: 10,
    scoreReward: 50,
    data: {
      ingredientId: 'ing-beef-shank',
      actions: ['steam', 'boil', 'stir-fry'],
      correctAction: 'boil',
    },
  };

  const html1 = renderGame(minigameWithImage);
  if (!html1.includes('Chế biến tôm thịt cho món Bún bò Huế?')) {
    return { passed: false, message: 'Test 1 Failed: Question not rendered' };
  }

  // Test 2: Minigame with ingredient without image (uses fallbackEmoji)
  const minigameNoImage: ActionCookingMinigame = {
    id: 'test-action-2',
    type: 'action-cooking',
    question: 'Chế biến bột gạo?',
    timeLimit: 12,
    scoreReward: 40,
    data: {
      ingredientId: 'ing-rice-flour',
      actions: ['steam', 'stir-fry', 'fry', 'grill', 'boil'],
      correctAction: 'steam',
    },
  };

  const html2 = renderGame(minigameNoImage);
  if (!html2.includes('🌾') && !html2.includes('Bột gạo')) {
    return { passed: false, message: 'Test 2 Failed: Fallback emoji or ingredient name not rendered' };
  }

  // Test 3: Minigame with non-existent ingredient ID (safe fallback)
  const minigameNonExistent: ActionCookingMinigame = {
    id: 'test-action-3',
    type: 'action-cooking',
    question: 'Chế biến nguyên liệu đặc biệt?',
    timeLimit: 8,
    scoreReward: 30,
    data: {
      ingredientId: 'ing-does-not-exist-999',
      actions: ['grill', 'fry'],
      correctAction: 'fry',
    },
  };

  const html3 = renderGame(minigameNonExistent);
  if (!html3.includes('🍲') && !html3.includes('ing-does-not-exist-999')) {
    return { passed: false, message: 'Test 3 Failed: Non-existent ingredient fallback not rendered' };
  }

  return { passed: true, message: 'All 3 ActionCookingGame smoke tests passed successfully.' };
}
