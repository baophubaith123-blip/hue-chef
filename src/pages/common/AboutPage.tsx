import { useTranslation } from '@/i18n/useTranslation';

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';

import styles from './AboutPage.module.css';

export default function AboutPage() {
  const { t } = useTranslation();

  const techStack = [
    'React 18 + TypeScript strict',
    'Vite 5 (build tool)',
    'React Router v6 (40 routes)',
    'Context API + useReducer (12 contexts)',
    'CSS Modules + CSS thuần',
    'localStorage persistence (17 keys)',
    'Self-written i18n (vi/en)',
    'Recharts (admin charts)',
  ];

  const features = [
    '15 món ăn Huế đặc trưng',
    'Drag & Drop cooking mode',
    'Hệ thống tính điểm + 5 sao',
    '12 thành tích theo điều kiện',
    '4 vai trò phân quyền rõ ràng',
    'Mail system (6 loại thư)',
    'Support chat & khiếu nại',
    'i18n vi/en + Dark mode',
    'Responsive mobile-friendly',
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <span className={styles.badge}>🍜 {t('header.logo')}</span>
          <h1 className={styles.title}>{t('about.title')}</h1>
          <p className={styles.intro}>{t('about.intro')}</p>
        </section>

        <div className={styles.grid}>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>🏷️ {t('about.projectName')}</h2>
            <ul className={styles.list}>
              <li>{t('about.projectName')}: Hue Chef</li>
              <li>{t('about.description')}</li>
            </ul>
          </article>

          <article className={styles.authorCard}>
            <h2 className={styles.cardTitle}>👤 {t('about.authorTitle')}</h2>
            <h3 className={styles.authorName}>{t('about.authorName')}</h3>
            <p className={styles.authorMeta}>{t('about.authorId')}</p>
            <p className={styles.authorSubject}>{t('about.subject')}</p>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>🛠️ {t('about.techTitle')}</h2>
            <ul className={styles.list}>
              {techStack.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>✨ {t('about.stackTitle')}</h2>
            <ul className={styles.list}>
              {features.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>

        <p className={styles.acknowledge}>💫 {t('about.acknowledgements')}</p>
      </main>
      <Footer />
    </div>
  );
}
