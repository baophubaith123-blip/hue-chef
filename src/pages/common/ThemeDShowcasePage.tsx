import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  Badge,
  CoinPill,
  CustomerFace,
  DishGradeFrame,
  FestivalGarland,
  GoldButton,
  IngredientTray,
  KraftCard,
  Modal,
  NoiNoi,
  Podium,
  ProgressPot,
  SCENES,
  SeasonMeter,
  StepChecklist,
  TimingRing,
  Toast,
  TopBar,
  WoodButton,
  WoodSign,
} from '@/components/theme-d';
import { CUSTOMER_MOODS, CUSTOMER_TIERS, NOI_NOI_POSES } from '@/components/theme-d/assets';
import type { DishGrade } from '@/components/theme-d';
import type { NoiNoiPose, SceneKey } from '@/components/theme-d/assets';
import { useTranslation } from '@/i18n/useTranslation';
import styles from '@/pages/common/ThemeDShowcasePage.module.css';

const SWATCHES: Array<{ token: string; label: string }> = [
  { token: '--td-plum', label: 'Plum' },
  { token: '--td-plum-deep', label: 'Plum deep' },
  { token: '--td-brick', label: 'Brick' },
  { token: '--td-gold', label: 'Gold' },
  { token: '--td-gold-bright', label: 'Gold bright' },
  { token: '--td-gold-deep', label: 'Gold deep' },
  { token: '--td-cream', label: 'Cream' },
  { token: '--td-paper', label: 'Paper' },
  { token: '--td-paper-deep', label: 'Paper deep' },
  { token: '--td-wood', label: 'Wood' },
  { token: '--td-wood-dark', label: 'Wood dark' },
  { token: '--td-cok', label: 'Cok (ruby)' },
  { token: '--td-success', label: 'Success' },
  { token: '--td-danger', label: 'Danger' },
];

const POSE_ORDER: NoiNoiPose[] = [
  'chao',
  'chi-tay',
  'be-noi',
  'keo-xe',
  'mc',
  'an-mung',
  'buon',
  'ngu',
  'cam-muong',
  'doi-non',
  'vui',
  'hoang',
  'khuay',
  'gioi-thieu',
];

const SCENE_ORDER: SceneKey[] = ['san-le-hoi', 'cho', 'bep', 'ban-hoan-thien', 'san-khau-hoi-dap', 'nen-xep-hang', 'canh-quay'];

const GRADES: DishGrade[] = [1, 2, 3, 4, 5];

/**
 * Gói H1 internal showcase — every Theme D token, component, grade frame,
 * Nồi Nồi pose, customer face and scene in one page for visual acceptance.
 * The page has no sample of its own: it follows the home target drawing
 * (dich-1) design language — plum scene, garland, wooden sign, kraft panels.
 */
export default function ThemeDShowcasePage() {
  const { t, dict } = useTranslation();
  const [angle, setAngle] = useState(0);
  const [meter, setMeter] = useState(72);
  const [traySelected, setTraySelected] = useState<string>('thit-bo');
  const [modalOpen, setModalOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => document.documentElement.dataset.theme === 'dark');

  useEffect(() => {
    const id = window.setInterval(() => setAngle((a) => (a + 4) % 360), 50);
    return () => window.clearInterval(id);
  }, []);

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('hue-chef-theme', next);
    } catch {
      // storage unavailable — theme still applies for this session
    }
    setIsDark(!isDark);
  };

  const gradeLabel = (g: DishGrade): string =>
    g === 1 ? t('showcase.grade1') : g === 2 ? t('showcase.grade2') : g === 3 ? t('showcase.grade3') : g === 4 ? t('showcase.grade4') : t('showcase.grade5');
  const tierLabel = (tier: string): string =>
    tier === 'thuong' ? t('showcase.tierThuong') : tier === 'giau' ? t('showcase.tierGiau') : t('showcase.tierVip');
  const moodLabel = (mood: string): string =>
    mood === 'vui'
      ? t('showcase.moodVui')
      : mood === 'binh-thuong'
        ? t('showcase.moodBinhThuong')
        : mood === 'sot-ruot'
          ? t('showcase.moodSotRuot')
          : mood === 'tuc-gian'
            ? t('showcase.moodTucGian')
            : mood === 'buon'
              ? t('showcase.moodBuon')
              : t('showcase.moodNgacNhien');

  return (
    <div className={styles.page}>
      <TopBar>
        <CoinPill amount={1250} />
        <CoinPill amount={7} currency="cok" />
      </TopBar>
      <div className={styles.hero}>
        <FestivalGarland />
        <WoodSign title={t('showcase.title')} subtitle={t('showcase.subtitle')} />
        <div className={styles.heroActions}>
          <Link to="/" className={styles.backLink}>
            ← {t('showcase.backHome')}
          </Link>
          <WoodButton onClick={toggleTheme}>{t('showcase.toggleTheme')}</WoodButton>
        </div>
      </div>

      <main className={styles.main}>
        <KraftCard as="section" className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('showcase.sectionTokens')}</h2>
          <div className={styles.swatches}>
            {SWATCHES.map((s) => (
              <div key={s.token} className={styles.swatch}>
                <span className={styles.swatchColor} style={{ background: `var(${s.token})` }} />
                <span className={styles.swatchLabel}>{s.label}</span>
                <span className={styles.swatchToken}>{s.token}</span>
              </div>
            ))}
          </div>
          <p className={styles.goldOnCream}>{t('showcase.cardSampleBody')}</p>
        </KraftCard>

        <KraftCard as="section" className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('showcase.sectionType')}</h2>
          <p className={styles.typeHero}>{t('showcase.typeSample')}</p>
          <p className={styles.typeXl}>Playfair Display 28 · {t('showcase.sampleDish')}</p>
          <p className={styles.typeLg}>Be Vietnam Pro 20 · {t('showcase.sampleDish')}</p>
          <p className={styles.typeMd}>Be Vietnam Pro 16 · {t('showcase.typeSample')}</p>
          <p className={styles.typeSm}>Be Vietnam Pro 14 · {t('showcase.typeSample')}</p>
          <p className={styles.typeXs}>Be Vietnam Pro 12 · {t('showcase.typeSample')}</p>
        </KraftCard>

        <KraftCard as="section" className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('showcase.sectionButtons')}</h2>
          <div className={styles.row}>
            <span className={styles.stateLabel}>{t('showcase.stateNormal')}</span>
            <GoldButton>{t('showcase.sampleDish')}</GoldButton>
            <WoodButton>{t('showcase.backHome')}</WoodButton>
          </div>
          <div className={styles.row}>
            <span className={styles.stateLabel}>{t('showcase.stateDisabled')}</span>
            <GoldButton disabled>{t('showcase.sampleDish')}</GoldButton>
            <WoodButton disabled>{t('showcase.backHome')}</WoodButton>
          </div>
          <div className={styles.row}>
            <span className={styles.stateLabel}>{t('showcase.stateLoading')}</span>
            <GoldButton loading>{t('showcase.sampleDish')}</GoldButton>
            <WoodButton loading>{t('showcase.backHome')}</WoodButton>
          </div>
        </KraftCard>

        <KraftCard as="section" className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('showcase.sectionSurfaces')}</h2>
          <div className={styles.row}>
            <WoodSign title={t('showcase.sampleDish')} subtitle={t('showcase.signSubtitle')} />
          </div>
          <KraftCard className={styles.innerCard}>
            <h3 className={styles.innerTitle}>{t('showcase.cardSampleTitle')}</h3>
            <p className={styles.bodyText}>{t('showcase.cardSampleBody')}</p>
          </KraftCard>
        </KraftCard>

        <KraftCard as="section" className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('showcase.sectionCurrency')}</h2>
          <div className={styles.row}>
            <CoinPill amount={1250} />
            <CoinPill amount={273} />
            <CoinPill amount={7} currency="cok" />
            <Badge tone="gold">{t('showcase.grade4')}</Badge>
            <Badge tone="brick">{t('showcase.grade5')}</Badge>
            <Badge tone="cok">VIP</Badge>
            <Badge>{t('showcase.moodVui')}</Badge>
          </div>
          <div className={styles.row}>
            <Toast tone="success" message={t('showcase.toastSuccess')} />
            <Toast tone="error" message={t('showcase.toastError')} />
            <Toast tone="info" message={t('showcase.toastInfo')} />
          </div>
          <div className={styles.row}>
            <GoldButton onClick={() => setModalOpen(true)}>{t('showcase.openModal')}</GoldButton>
          </div>
        </KraftCard>

        <KraftCard as="section" className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('showcase.sectionGame')}</h2>
          <div className={styles.gameGrid}>
            <div>
              <IngredientTray
                ariaLabel={t('showcase.trayLabel')}
                items={[
                  { id: 'thit-bo', label: 'Thịt bò', selected: traySelected === 'thit-bo' },
                  { id: 'sa', label: 'Sả', selected: traySelected === 'sa' },
                  { id: 'mam', label: 'Mắm ruốc', selected: traySelected === 'mam' },
                  { id: 'ot', label: 'Ớt', selected: traySelected === 'ot', disabled: true },
                ]}
                onSelect={setTraySelected}
              />
              <StepChecklist
                ariaLabel={t('showcase.checklistLabel')}
                steps={[
                  { id: 's1', label: 'Sơ chế thịt bò', status: 'done' },
                  { id: 's2', label: 'Phi sả ớt', status: 'done' },
                  { id: 's3', label: 'Nêm mắm ruốc', status: 'current' },
                  { id: 's4', label: 'Trụng bún', status: 'todo' },
                ]}
              />
            </div>
            <div className={styles.gameCol}>
              <TimingRing angle={angle} label={t('showcase.ringLabel')} />
              <div className={styles.meterBox}>
                <SeasonMeter
                  label={t('showcase.meterLabel')}
                  value={meter}
                  lowLabel={t('showcase.meterLow')}
                  highLabel={t('showcase.meterHigh')}
                />
                <input
                  className={styles.slider}
                  type="range"
                  min={0}
                  max={100}
                  value={meter}
                  aria-label={t('showcase.meterLabel')}
                  onChange={(e) => setMeter(Number(e.target.value))}
                />
              </div>
              <ProgressPot percent={62} stepIndex={2} stepTotal={5} label={t('showcase.potLabel')} noiNoiSrc={NOI_NOI_POSES.khuay} />
            </div>
          </div>
        </KraftCard>

        <KraftCard as="section" className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('showcase.sectionPodium')}</h2>
          <Podium
            scoreLabel={t('showcase.podiumScoreLabel')}
            entries={[
              { id: 'p1', name: 'An Nhiên', score: 9850, rank: 1 },
              { id: 'p2', name: 'Bảo Khang', score: 9420, rank: 2 },
              { id: 'p3', name: 'Chi Mai', score: 9010, rank: 3 },
            ]}
          />
        </KraftCard>

        <KraftCard as="section" className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('showcase.sectionFrames')}</h2>
          <div className={styles.frames}>
            {GRADES.map((g) => (
              <DishGradeFrame key={g} grade={g} gradeLabel={gradeLabel(g)}>
                <div className={styles.dishCard}>
                  <img className={styles.dishImg} src="/images/bun-bo.jpg" alt={t('showcase.sampleDish')} />
                  <div className={styles.dishBody}>
                    <span className={styles.dishName}>{t('showcase.sampleDish')}</span>
                    <span className={styles.dishStars} aria-hidden>
                      ★★★★☆
                    </span>
                    <span className={styles.dishSub}>{t('showcase.sampleDishSub')}</span>
                    <span className={styles.dishFoot}>
                      <Badge tone={g === 5 ? 'cok' : g === 4 ? 'gold' : 'paper'}>{gradeLabel(g)}</Badge>
                      <CoinPill amount={100 + g * 45} />
                    </span>
                  </div>
                </div>
              </DishGradeFrame>
            ))}
          </div>
        </KraftCard>

        <KraftCard as="section" className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('showcase.sectionNoiNoi')}</h2>
          <div className={styles.noiNoiGrid}>
            {POSE_ORDER.map((pose, i) => (
              <div key={pose} className={styles.noiNoiCell}>
                <NoiNoi
                  pose={pose}
                  size={150}
                  alt={`Nồi Nồi — ${dict.showcase.poseNames[pose] ?? pose}`}
                  speech={i === 0 ? t('showcase.speechSample') : undefined}
                />
                <span className={styles.cellLabel}>{dict.showcase.poseNames[pose] ?? pose}</span>
              </div>
            ))}
          </div>
        </KraftCard>

        <KraftCard as="section" className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('showcase.sectionFaces')}</h2>
          {CUSTOMER_TIERS.map((tier) => (
            <div key={tier} className={styles.faceTier}>
              <h3 className={styles.tierTitle}>{tierLabel(tier)}</h3>
              <div className={styles.faceRow}>
                {CUSTOMER_MOODS.map((mood) => (
                  <div key={mood} className={styles.faceCell}>
                    <CustomerFace
                      tier={tier}
                      mood={mood}
                      size={104}
                      alt={`${t('showcase.faceAlt')} — ${tierLabel(tier)} — ${moodLabel(mood)}`}
                      patiencePercent={mood === 'vui' ? 92 : mood === 'sot-ruot' ? 45 : mood === 'tuc-gian' ? 16 : undefined}
                      patienceLabel={t('showcase.patienceLabel')}
                    />
                    <span className={styles.cellLabel}>{moodLabel(mood)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </KraftCard>

        <KraftCard as="section" className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('showcase.sectionScenes')}</h2>
          <div className={styles.sceneGrid}>
            {SCENE_ORDER.map((key) => (
              <figure key={key} className={styles.sceneCell}>
                <img className={styles.sceneImg} src={SCENES[key]} alt={dict.showcase.sceneNames[key] ?? key} />
                <figcaption className={styles.cellLabel}>{dict.showcase.sceneNames[key] ?? key}</figcaption>
              </figure>
            ))}
          </div>
        </KraftCard>
      </main>

      <Modal open={modalOpen} title={t('showcase.modalTitle')} onClose={() => setModalOpen(false)} closeLabel={t('showcase.closeLabel')}>
        <p>{t('showcase.modalBody')}</p>
        <div className={styles.row}>
          <GoldButton onClick={() => setModalOpen(false)}>{t('showcase.closeLabel')}</GoldButton>
        </div>
      </Modal>
    </div>
  );
}
