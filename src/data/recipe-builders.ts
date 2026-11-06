import type {
  ActionCookingMinigame,
  CookingAction,
  QuizMinigame,
} from '@/data/types';

interface StepSeedItem {
  title: string;
  description: string;
  duration: number;
  requiredIngredients: string[];
  actionLabel: string;
}

export function steps(recipeId: string, items: StepSeedItem[]) {
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

export function actionGame(
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

export function quizGame(
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

