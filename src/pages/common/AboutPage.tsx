import { Link } from 'react-router-dom';
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
    'Context API + useReducer (13 contexts)',
    'CSS Modules + CSS thuần',
    'localStorage persistence (17 keys)',
    'Self-written i18n (vi/en)',
    'Recharts (admin charts)',
  ];

  const features = [
    '15 món ăn Huế đặc trưng',
    'Drag & Drop cooking mode',
    'Hệ thống tính điểm + 5 sao',
    '27 thành tích theo điều kiện',
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
        <section className={styles.heroBanner} aria-label={t('about.title')}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.badgeIcon}>🏮</span>
              <span>{t('header.logo')} · Di Sản Ẩm Thực Cung Đình</span>
            </div>
            <h1 className={styles.heroTitle}>
              {t('about.heroTitleA')}{' '}
              <span className={styles.heroTitleGold}>{t('about.heroTitleGold')}</span>{' '}
              {t('about.heroTitleB')}
            </h1>
            <p className={styles.heroDesc}>{t('about.intro')}</p>
            <div className={styles.heroActions}>
              <Link to="/recipes" className={styles.heroBtnPrimary}>
                🍲 Khám phá công thức
              </Link>
              <Link to="/login" className={styles.heroBtnSecondary}>
                🎮 Bắt đầu ngay
              </Link>
            </div>
          </div>

          <div className={styles.heroArtwork} aria-hidden="true">
            <img src="/images/noi-noi.jpg" alt="" className={styles.heroPotImg} />
          </div>
        </section>

        <section className={styles.journey} aria-label="Hành trình của một đầu bếp Huế">
          <h2 className={styles.journeyTitle}>🧭 Hành trình của một đầu bếp Huế</h2>
          <div className={styles.journeyGrid}>
            <div className={styles.journeyStep}>
              <span className={styles.journeyNum}>1</span>
              <span className={styles.journeyIcon} aria-hidden="true">🍲</span>
              <h3 className={styles.journeyStepTitle}>Chọn món</h3>
              <p className={styles.journeyStepDesc}>
                15 món Huế từ cấp Dễ đến Địa ngục đang chờ bạn chinh phục.
              </p>
            </div>
            <div className={styles.journeyStep}>
              <span className={styles.journeyNum}>2</span>
              <span className={styles.journeyIcon} aria-hidden="true">🥘</span>
              <h3 className={styles.journeyStepTitle}>Kéo-thả nguyên liệu</h3>
              <p className={styles.journeyStepDesc}>
                Đọc kỹ từng bước nấu thật, thả đúng nguyên liệu vào nồi theo thứ tự.
              </p>
            </div>
            <div className={styles.journeyStep}>
              <span className={styles.journeyNum}>3</span>
              <span className={styles.journeyIcon} aria-hidden="true">🎮</span>
              <h3 className={styles.journeyStepTitle}>Đấu trí minigame</h3>
              <p className={styles.journeyStepDesc}>
                Trả lời hỏi đáp văn hoá ẩm thực và vượt thử thách tay nghề để ghi điểm thưởng.
              </p>
            </div>
            <div className={styles.journeyStep}>
              <span className={styles.journeyNum}>4</span>
              <span className={styles.journeyIcon} aria-hidden="true">🏆</span>
              <h3 className={styles.journeyStepTitle}>Nhận sao & thành tích</h3>
              <p className={styles.journeyStepDesc}>
                Tích điểm, lên cấp, leo bảng xếp hạng và mở khoá huy chương đầu bếp Cố Đô.
              </p>
            </div>
          </div>
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
            <div className={styles.authorHead}>
              <span className={styles.authorAvatar} aria-hidden>
                {t('about.authorName').charAt(0)}
              </span>
              <div>
                <h3 className={styles.authorName}>{t('about.authorName')}</h3>
                <p className={styles.authorRole}>{t('about.authorRole')}</p>
              </div>
            </div>
            <p className={styles.authorMeta}>{t('about.authorId')}</p>
            <p className={styles.authorSubject}>{t('about.subject')}</p>
            <p className={styles.authorSubject}>{t('about.projectType')}</p>
            <div className={styles.statBoxes}>
              <div className={styles.statBox}>
                <span className={styles.statNum}>40</span>
                <span className={styles.statLbl}>{t('about.statRoutes')}</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNum}>4</span>
                <span className={styles.statLbl}>{t('about.statRoles')}</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNum}>15</span>
                <span className={styles.statLbl}>{t('about.statDishes')}</span>
              </div>
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>🛠️ {t('about.techTitle')}</h2>
            <div className={styles.techChips}>
              {techStack.map((item) => (
                <span key={item} className={styles.techChip}>
                  {item}
                </span>
              ))}
            </div>
            <p className={styles.archNote}>{t('about.archNote')}</p>
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
