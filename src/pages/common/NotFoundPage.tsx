import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { useTranslation } from '@/i18n/useTranslation';

import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.wrap}>
      <Header />
      <main className={styles.page}>
        <section className={styles.card}>
          <div className={styles.emoji} aria-hidden="true">🍜</div>
          <h1 className={styles.code}>404</h1>
          <div className={styles.codeLabel}>{t('notFound.code')}</div>
          <h2 className={styles.title}>{t('notFound.title')}</h2>
          <p className={styles.subtitle}>{t('notFound.subtitle')}</p>
          <Link to="/">
            <Button variant="primary">{t('notFound.backHome')}</Button>
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
