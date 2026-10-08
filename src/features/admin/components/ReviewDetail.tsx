import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { findUserById, loadUsers } from '@/features/auth/store';
import { getIngredientById } from '@/data/ingredients';
import type { Recipe } from '@/data/types';
import { formatDuration } from '@/lib/format';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/admin/components/ReviewDetail.module.css';

interface ReviewDetailProps {
  recipe: Recipe;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

export function ReviewDetail({ recipe, onApprove, onReject }: ReviewDetailProps) {
  const navigate = useNavigate();
  const { t, dict } = useTranslation();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const users = loadUsers();
  const editor = recipe.editorId ? findUserById(users, recipe.editorId) : undefined;
  const categoryLabel = dict.recipe.categoryLabels[recipe.category];

  const handleReject = () => {
    if (!reason.trim()) {
      setError(t('errors.rejectionRequired'));
      return;
    }
    setError(null);
    setProcessing(true);
    try {
      onReject(reason.trim());
      navigate('/admin/review');
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = () => {
    setProcessing(true);
    try {
      onApprove();
      navigate('/admin/review');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={styles.layout}>
      <div className={styles.banner}>
        {t('admin.pendingBanner')}
        {recipe.submittedAt ? (
          new Date(recipe.submittedAt).toLocaleString()
        ) : (
          t('admin.submittedRecently')
        )}
      </div>

      <div className={styles.header}>
        {recipe.image ? (
          <div className={styles.heroWrap}>
            <img
              className={styles.hero}
              src={recipe.image}
              alt={recipe.name}
              onError={(event) => {
                (event.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : null}
        <div className={styles.headerText}>
          <h1 className={styles.title}>{recipe.name}</h1>
          <p className={styles.meta}>
            <span className={styles.categoryChip}>{categoryLabel}</span>
            <span className={styles.metaItem}>
              {t('recipe.difficulty')} {'★'.repeat(recipe.difficulty)}
              {'☆'.repeat(5 - recipe.difficulty)}
            </span>
            <span className={styles.metaItem}>{formatDuration(recipe.duration)}</span>
          </p>
          {editor ? (
            <div className={styles.editorInfo}>
              {editor.avatar ? (
                <img className={styles.avatar} src={editor.avatar} alt={editor.name} />
              ) : null}
              <div>
                <div className={styles.editorName}>{editor.name}</div>
                <div className={styles.editorEmail}>{editor.email}</div>
              </div>
            </div>
          ) : null}
          <p className={styles.description}>{recipe.description}</p>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          🍴 {t('admin.ingredientsTitle')} · {recipe.ingredients.length}
        </h2>
        <ul className={styles.ingredientsGrid}>
          {recipe.ingredients.map((item) => {
            const ingredient = getIngredientById(item.ingredientId);
            return (
              <li key={item.ingredientId} className={styles.ingredientItem}>
                <span className={styles.ingredientName}>
                  {ingredient?.name ?? item.ingredientId}
                </span>
                <span className={styles.ingredientAmount}>{item.amount}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          📝 {t('admin.stepsTitle')} · {recipe.steps.length}
        </h2>
        <ol className={styles.stepsList}>
          {recipe.steps.map((step, index) => (
            <li key={step.id} className={styles.stepItem}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <div className={styles.stepMeta}>
                  <strong className={styles.stepTitle}>{step.title}</strong>
                  <span className={styles.stepTime}>
                    ⏱ {formatDuration(step.durationSeconds)}
                  </span>
                </div>
              </div>
              <p className={styles.stepDesc}>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className={styles.actions}>
        <Button type="button" onClick={handleApprove} disabled={processing}>
          ✅ {t('common.approve')}
        </Button>
        <div className={styles.rejectField}>
          <label htmlFor="reject-reason">{t('admin.rejectionLabel')}</label>
          <textarea
            id="reject-reason"
            className={styles.textarea}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('admin.rejectionPlaceholder')}
          />
          {error ? <p className={styles.error}>{error}</p> : null}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleReject}
          disabled={processing}
          className={styles.rejectBtn}
        >
          ❌ {t('common.reject')}
        </Button>
      </div>
    </div>
  );
}
