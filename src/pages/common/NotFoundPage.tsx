import { Link } from 'react-router-dom';

import { GoldButton } from '@/components/theme-d/GoldButton';
import noiNoiSad from '@/assets/theme-d/noi-noi-flat/noinoi-sad.webp';
import { useTranslation } from '@/i18n/useTranslation';
import { PublicScene } from '@/pages/common/TitleScene';

import styles from './NotFoundPage.module.css';

/**
 * 404 inside the game frame (audit #122): the old page wore the
 * pre-game web chrome (top nav + footer + white card). Now it hangs
 * a wooden sign on the festival scene like every public page.
 */
export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <PublicScene>
      <main className={styles.page}>
        <section className={styles.signBoard}>
          <img src={noiNoiSad} alt="" className={styles.mascot} aria-hidden="true" />
          <h1 className={styles.code}>404</h1>
          <div className={styles.codeLabel}>{t('notFound.code')}</div>
          <h2 className={styles.title}>{t('notFound.title')}</h2>
          <p className={styles.subtitle}>{t('notFound.subtitle')}</p>
          <Link to="/" className={styles.homeLink}>
            <GoldButton>{t('notFound.backHome')}</GoldButton>
          </Link>
        </section>
      </main>
    </PublicScene>
  );
}
