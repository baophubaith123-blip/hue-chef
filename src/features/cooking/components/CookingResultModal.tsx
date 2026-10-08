import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import type { CookingSession } from '@/features/cooking/types';

interface CookingResultModalProps {
  session: CookingSession;
  onClose: () => void;
  onRetry: () => void;
}

export function CookingResultModal({ session, onClose, onRetry }: CookingResultModalProps) {
  const isSuccess = session.phase === 'success';
  const title = isSuccess ? 'Dish complete!' : 'Cooking failed';

  return (
    <Modal
      isOpen
      title={title}
      onClose={isSuccess ? onClose : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onRetry}>
            Cook again
          </Button>
          <Link to={`/recipes/${session.recipe.id}`} onClick={onClose}>
            <Button>Back to recipe</Button>
          </Link>
        </>
      }
    >
      {isSuccess ? (
        <>
          <p>
            Score: <strong>{session.finalScore}</strong>
          </p>
          <p>
            Stars: {'★'.repeat(session.stars)}
            {'☆'.repeat(5 - session.stars)}
          </p>
          <p>
            Correct drops: {session.correctCount} · Mistakes: {session.wrongCount}
          </p>
        </>
      ) : (
        <>
          <p>
            {session.failReason === 'timeout'
              ? 'Time is up — the kitchen closed this round.'
              : 'Something went wrong.'}
          </p>
          <p>Score: 0</p>
        </>
      )}
    </Modal>
  );
}
