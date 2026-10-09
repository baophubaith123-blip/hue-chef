import { useTranslation } from '@/i18n/useTranslation';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

import styles from './HelpPage.module.css';

export default function HelpPage() {
  const { t } = useTranslation();

  const faqs = [
    {
      q: t('help.gettingStarted'),
      a: t('help.gettingStartedBody'),
    },
    {
      q: t('help.rolesTitle'),
      a: t('help.rolesBody'),
    },
    {
      q: t('help.cookingTitle'),
      a: t('help.cookingBody'),
    },
    {
      q: t('help.supportTitle'),
      a: t('help.supportBody'),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <h1 className={styles.title}>{t('help.title')}</h1>
          <p className={styles.intro}>{t('help.intro')}</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📖 {t('help.faqTitle')}</h2>
          <div>
            {faqs.map((f, idx) => (
              <article key={idx} className={styles.faqItem}>
                <h3 className={styles.faqQ}>{f.q}</h3>
                <p className={styles.faqA}>{f.a}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
