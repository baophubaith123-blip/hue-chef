import { useState, type FormEvent } from 'react';

import { Button } from '@/components/Button';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { useTranslation } from '@/i18n/useTranslation';

import styles from './FeedbackPage.module.css';

type FeedbackCategory = 'bug' | 'suggestion' | 'feature' | 'other';

interface FeedbackFormData {
  category: FeedbackCategory;
  subject: string;
  message: string;
}

const FEEDBACK_KEY = 'hue-chef-feedback';

export default function FeedbackPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState<FeedbackFormData>({
    category: 'suggestion',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FeedbackFormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof FeedbackFormData, string>> = {};
    if (!form.subject.trim()) nextErrors.subject = t('errors.required');
    if (!form.message.trim()) nextErrors.message = t('errors.required');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    try {
      const existing = JSON.parse(localStorage.getItem(FEEDBACK_KEY) ?? '[]');
      existing.push({
        ...form,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(existing));
    } catch {
      // ignore
    }
    setSubmitted(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <h1 className={styles.title}>{t('feedback.title')}</h1>
          <p className={styles.intro}>{t('feedback.intro')}</p>
        </section>

        {submitted ? (
          <div className={styles.successCard} role="status">
            <h2 className={styles.successTitle}>🎉 {t('feedback.thankYou')}</h2>
            <p className={styles.successBody}>{t('feedback.thankYouBody')}</p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="fb-category" className={styles.label}>{t('feedback.category')}</label>
              <select
                id="fb-category"
                className={styles.select}
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as FeedbackCategory }))}
              >
                <option value="bug">{t('feedback.categoryBug')}</option>
                <option value="suggestion">{t('feedback.categorySuggestion')}</option>
                <option value="feature">{t('feedback.categoryFeature')}</option>
                <option value="other">{t('feedback.categoryOther')}</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="fb-subject" className={styles.label}>{t('feedback.subject')}</label>
              <input
                id="fb-subject"
                className={styles.input}
                value={form.subject}
                onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
              />
              {errors.subject ? <p className={styles.error}>{errors.subject}</p> : null}
            </div>
            <div className={styles.field}>
              <label htmlFor="fb-message" className={styles.label}>{t('feedback.message')}</label>
              <textarea
                id="fb-message"
                className={styles.textarea}
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              />
              {errors.message ? <p className={styles.error}>{errors.message}</p> : null}
            </div>
            <div>
              <Button type="submit" variant="primary">{t('feedback.submit')}</Button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
