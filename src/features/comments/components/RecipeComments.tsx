import { useCallback, useState } from 'react';

import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useComment } from '@/contexts/CommentContext';
import type { RecipeComment } from '@/features/comments/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from './RecipeComments.module.css';

interface RecipeCommentsProps {
  recipeId: string;
}

const RATING_VALUES = [1, 2, 3, 4, 5] as const;

function Stars({ value }: { value: number }) {
  return (
    <span className={styles.stars} aria-label={`${value}/5`}>
      {RATING_VALUES.map((n) => (
        <span key={n} className={n <= value ? styles.starOn : styles.starOff}>
          ★
        </span>
      ))}
    </span>
  );
}

/**
 * Player-facing comment section for a recipe. This is the write side of the
 * comment system the admin Comments/Reports pages moderate: without it the
 * store stayed empty forever and those pages could never have data.
 */
export function RecipeComments({ recipeId }: RecipeCommentsProps) {
  const { t, dict } = useTranslation();
  const { user } = useAuth();
  const { listForRecipe, addComment, editComment, deleteComment, toggleLike, reportComment } =
    useComment();

  const [comments, setComments] = useState<RecipeComment[]>(() => listForRecipe(recipeId));
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setComments(listForRecipe(recipeId));
  }, [listForRecipe, recipeId]);

  const handleSubmit = () => {
    if (!user) return;
    setError(null);
    setNotice(null);
    try {
      addComment({ author: user, recipeId, content: content.trim(), rating });
      setContent('');
      setRating(5);
      refresh();
    } catch {
      setError(dict.errors.commentEmpty ?? '');
    }
  };

  const handleLike = (comment: RecipeComment) => {
    if (!user) return;
    toggleLike(comment.id, user.id);
    refresh();
  };

  const handleReport = (comment: RecipeComment) => {
    if (!user) return;
    if (comment.reportedBy.includes(user.id)) {
      setNotice(t('comments.alreadyReported'));
      return;
    }
    const reason = window.prompt(t('comments.reportReason'));
    if (reason === null || reason.trim().length === 0) return;
    try {
      reportComment({ commentId: comment.id, recipeId, reporterId: user.id, reason: reason.trim() });
      refresh();
    } catch {
      setNotice(t('comments.alreadyReported'));
    }
  };

  const handleEdit = (comment: RecipeComment) => {
    if (!user) return;
    const next = window.prompt(t('comments.edit'), comment.content);
    if (next === null || next.trim().length === 0) return;
    try {
      editComment(comment.id, user.id, next.trim());
      refresh();
    } catch {
      // Not the author or the comment is gone: leave the list as rendered.
    }
  };

  const handleDelete = (comment: RecipeComment) => {
    if (!user) return;
    if (!window.confirm(t('common.confirm'))) return;
    try {
      deleteComment(comment.id, user);
      refresh();
    } catch {
      // Already deleted elsewhere: a refresh shows the current state.
      refresh();
    }
  };

  return (
    <section className={styles.section} aria-label={t('nav.comments')}>
      <h2 className={styles.title}>💬 {t('nav.comments')}</h2>

      {user ? (
        <div className={styles.form}>
          <label className={styles.ratingLabel}>
            {t('comments.rating')}
            <span className={styles.starInput}>
              {RATING_VALUES.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={n <= rating ? styles.starOn : styles.starOff}
                  onClick={() => setRating(n)}
                  aria-label={`${n}/5`}
                >
                  ★
                </button>
              ))}
            </span>
          </label>
          <textarea
            className={styles.textarea}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={t('comments.placeholder')}
            rows={3}
            maxLength={1000}
          />
          {error ? <p className={styles.error}>{error}</p> : null}
          <div className={styles.formActions}>
            <Button type="button" onClick={handleSubmit} disabled={content.trim().length === 0}>
              {t('comments.addComment')}
            </Button>
          </div>
        </div>
      ) : null}

      {notice ? <p className={styles.notice}>{notice}</p> : null}

      {comments.length === 0 ? (
        <p className={styles.empty}>{t('comments.empty')}</p>
      ) : (
        <ul className={styles.list}>
          {comments.map((comment) => {
            const mine = user?.id === comment.authorId;
            const liked = user ? comment.likedBy.includes(user.id) : false;
            return (
              <li key={comment.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <span className={styles.avatar}>
                    {(comment.authorName || '?').trim().charAt(0).toUpperCase()}
                  </span>
                  <strong className={styles.author}>{comment.authorName}</strong>
                  <Stars value={comment.rating} />
                  <span className={styles.date}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className={styles.content}>{comment.content}</p>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => handleLike(comment)}
                    disabled={!user}
                  >
                    {liked ? '❤️' : '🤍'} {comment.likes}
                  </button>
                  {mine ? (
                    <>
                      <button type="button" className={styles.actionBtn} onClick={() => handleEdit(comment)}>
                        ✏️ {t('comments.edit')}
                      </button>
                      <button type="button" className={styles.actionBtn} onClick={() => handleDelete(comment)}>
                        🗑️ {t('comments.delete')}
                      </button>
                    </>
                  ) : user ? (
                    <button type="button" className={styles.actionBtn} onClick={() => handleReport(comment)}>
                      🚩 {t('comments.report')}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
