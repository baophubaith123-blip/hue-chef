import { useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { Modal } from '@/components/theme-d/Modal';
import { GAME_ART } from '@/components/theme-d/game-assets';
import { GoldButton } from '@/components/theme-d/GoldButton';
import { NoiNoi } from '@/components/theme-d/NoiNoi';
import { WoodButton } from '@/components/theme-d/WoodButton';
import { dishArtFor } from '@/components/theme-d/dish-art';
import { getIngredientById } from '@/data/ingredients';
import { difficultyName } from '@/features/recipes/lib/difficulty';
import { dishGradeFor } from '@/features/recipes/lib/grade';
import { GESTURE_ICONS, gestureForStep } from '@/data/gesture-map';
import { RecipeComments } from '@/features/comments/components/RecipeComments';
import { isRecipeOwned } from '@/features/recipes/lib/ownership';
import { bossChapterForRecipe, chapterForRecipe } from '@/features/journey/lib/chapters';
import { dishBossStateFor, isDishSellable } from '@/features/journey/lib/journey';
import { useAuth } from '@/contexts/AuthContext';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { formatDuration } from '@/lib/format';
import { SceneShell } from '@/pages/player/SceneShell';
import { useTranslation } from '@/i18n/useTranslation';
import { ImageWithFallback } from '@/components/ImageWithFallback';

import dishFrameArt from '@/assets/theme-d/game/r4-dish-frame.webp';
import btnPlayPinArt from '@/assets/theme-d/game/r4-btn-play-pin.webp';
import chipTimeArt from '@/assets/theme-d/game/r4-chip-time.webp';
import chipStarArt from '@/assets/theme-d/game/r4-chip-star.webp';
import chipScrollArt from '@/assets/theme-d/game/r4-chip-scroll.webp';
import chipCoinArt from '@/assets/theme-d/game/r4-chip-coin.webp';
import journeyScrollArt from '@/assets/theme-d/game/r4-journey-scroll-mini.webp';
import btnMapArt from '@/assets/theme-d/game/r4-btn-map.webp';
import buyCardArt from '@/assets/theme-d/game/r4-buy-card.webp';
import commentBookArt from '@/assets/theme-d/game/r4-comment-book.webp';
import confirmBoardArt from '@/assets/theme-d/game/r4-confirm-board.webp';

import styles from '@/pages/player/RecipeDetailPage.module.css';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoading, getRecipeById } = useRecipes();
  const { user, purchaseRecipe } = useAuth();
  const { t, dict } = useTranslation();
  const { recipeCategoryLabel } = useTaxonomy();
  const [buyConfirmOpen, setBuyConfirmOpen] = useState(false);
  const [justBought, setJustBought] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  if (!id) {
    return <Navigate to="/recipes" replace />;
  }

  const recipe = getRecipeById(id);

  if (isLoading) {
    return (
      <SceneShell>
        <div className={styles.statePanel}>
          <Loading label={t('cooking.preparingKitchen')} />
        </div>
      </SceneShell>
    );
  }

  if (!recipe || (recipe.status ?? 'approved') !== 'approved') {
    return (
      <SceneShell>
        <div className={styles.statePanel}>
          <EmptyState
            title={t('cooking.cannotCook')}
            description={t('cooking.recipeMissing')}
          />
          <Link className={styles.back} to="/recipes">
            {t('cooking.backToRecipes')}
          </Link>
        </div>
      </SceneShell>
    );
  }

  const categoryLabel = recipeCategoryLabel(recipe.category);
  const grade = dishGradeFor(recipe);
  const gradeLabel = dict.recipe.gradeNames[grade - 1] ?? '';
  const bestStars = (user?.cookedRecipes ?? [])
    .filter((entry) => entry.recipeId === recipe.id)
    .reduce((max, entry) => Math.max(max, entry.stars), 0);
  const owned = isRecipeOwned(user, recipe);
  const balance = user?.coins ?? 0;
  const canAfford = balance >= recipe.priceCoins;
  // Gói H3 — journey placement of this dish: its chapter, whether the
  // player may sell it at the stall, and whether it is a boss dish.
  const journeyChapter = chapterForRecipe(recipe);
  const journeyChapterName = journeyChapter
    ? dict.journey.chapters[journeyChapter.id]?.name ?? journeyChapter.id
    : '';
  const sellable = isDishSellable(user, recipe);
  const bossChapter = bossChapterForRecipe(recipe.id);
  // Per-dish boss (luật trùm theo món): this dish's own boss state —
  // locked until learned, ready to fight for its sell license after.
  const dishBossState = dishBossStateFor(user, recipe);

  // Khung bước gọn (luật khung bổ sung 2026-11-20): panel bước chỉ hiện
  // đúng một bước tại một thời điểm + nút chuyển riêng, để cột bước không
  // kéo dài lệch cột tranh/nguyên liệu sinh khoảng trống chết.
  const steps = recipe.steps ?? [];
  const safeStepIndex = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const currentStep = steps[safeStepIndex];
  const goToStep = (next: number) => {
    setStepIndex(Math.min(Math.max(0, next), Math.max(0, steps.length - 1)));
  };

  const handleConfirmBuy = () => {
    if (purchaseRecipe(recipe.id, recipe.priceCoins)) {
      setJustBought(true);
    }
    setBuyConfirmOpen(false);
  };

  return (
    <SceneShell>
      <div className={styles.container}>
        <Link className={styles.backLink} to="/recipes">
          ← {t('cooking.backToRecipes')}
        </Link>

        <motion.article
          className={styles.board}
          initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          <span className={`${styles.rivet} ${styles.rivetTl}`} aria-hidden="true" />
          <span className={`${styles.rivet} ${styles.rivetTr}`} aria-hidden="true" />
          <span className={`${styles.rivet} ${styles.rivetBl}`} aria-hidden="true" />
          <span className={`${styles.rivet} ${styles.rivetBr}`} aria-hidden="true" />

          <header className={styles.header}>
            {/* Đợt 4: tên món khắc trên biển cổng treo dây (r4-dish-sign,
                mặt biển đã làm trống — chữ thật đè lên vùng ván). */}
            <div className={styles.dishSign}>
              <div className={styles.dishSignText}>
                <h1 className={styles.title}>{recipe.name}</h1>
                <div className={styles.gradeRow}>
                  <span className={styles.gradeChip}>{gradeLabel}</span>
                  {bestStars > 0 ? (
                    <span className={styles.yourStars}>{dict.recipe.yourStars(bestStars)}</span>
                  ) : null}
                </div>
              </div>
            </div>
            <p className={styles.description}>{recipe.description}</p>

            {/* Đợt 4: 4 chip thông số mang 4 hình dạng riêng của bộ duyệt. */}
            <div className={styles.chipsRow}>
              <div className={styles.chip}>
                <img className={styles.chipArt} src={chipTimeArt} alt="" aria-hidden="true" />
                <span className={styles.chipValue}>{formatDuration(recipe.duration)}</span>
                <span className={styles.chipLabel}>{t('dashboard.time')}</span>
              </div>
              <div className={styles.chip}>
                <img className={styles.chipArt} src={chipStarArt} alt="" aria-hidden="true" />
                <span className={styles.metricStars}>
                  {'★'.repeat(recipe.difficulty)}
                  {'☆'.repeat(5 - recipe.difficulty)}
                </span>
                <span className={styles.chipLabel}>
                  {t('recipe.difficulty')} · {difficultyName(dict.recipe.difficultyNames, recipe.difficulty)}
                </span>
              </div>
              <div className={styles.chip}>
                <img className={styles.chipArt} src={chipScrollArt} alt="" aria-hidden="true" />
                <span className={styles.chipValue}>{(recipe.steps ?? []).length}</span>
                <span className={styles.chipLabel}>{t('cooking.steps')}</span>
              </div>
              <div className={styles.chip}>
                <img className={styles.chipArt} src={chipCoinArt} alt="" aria-hidden="true" />
                <span className={styles.chipValue}>{recipe.baseScore}</span>
                <span className={styles.chipLabel}>{t('recipe.baseScore')}</span>
              </div>
            </div>
          </header>

          {/* Gói H3 — journey chapter, sell license status, boss entry:
              dải bảng treo toàn bề ngang ngay dưới đầu trang (trước đây
              nằm trong cột phải làm cột lệch cao — luật khung 15:41) */}
          {journeyChapter ? (
            <div className={styles.journeyStrip}>
              {/* Đợt 4: dải hành trình = cuộn giấy mini ghim chặng
                  (r4-journey-scroll-mini) + nút thẻ gỗ xem bản đồ. */}
              <div className={styles.journeyScroll}>
                <img className={styles.journeyScrollImg} src={journeyScrollArt} alt="" aria-hidden="true" />
                <div className={styles.journeyScrollText}>
                  <span className={styles.journeyLabel}>
                    {dict.journey.detailChapterLabel}:{' '}
                    <strong>
                      {dict.journey.chapterLabel(journeyChapter.order)} · {journeyChapterName}
                    </strong>
                  </span>
                  <span className={sellable ? styles.journeySellable : styles.journeyNotSellable}>
                    {sellable
                      ? `📜 ${dict.journey.detailSellable}`
                      : `🔒 ${dict.journey.detailNotSellable()}`}
                  </span>
                </div>
              </div>
              <div className={styles.journeySide}>
                <Link className={styles.mapBtn} to="/map">
                  <img className={styles.mapBtnImg} src={btnMapArt} alt="" aria-hidden="true" />
                  <span className={styles.mapBtnText}>🗺️ {dict.journey.detailViewMap}</span>
                </Link>
                {bossChapter ? (
                  <div className={styles.journeyBossRow}>
                    <span className={styles.journeyBossNote}>👑 {dict.journey.detailBossDish}</span>
                    {owned ? (
                      <Link to={`/cooking/${recipe.id}?boss=${bossChapter.id}`} className={styles.bossLink}>
                        <GoldButton>{dict.journey.bossEnter}</GoldButton>
                      </Link>
                    ) : null}
                  </div>
                ) : null}
                {/* Luật trùm theo món: trùm của chính món này — mở ngay
                    khi học xong món, thắng là có phép bán riêng món. */}
                <div className={styles.journeyBossRow}>
                  <span className={styles.journeyBossNote}>
                    ⚔️ {dict.journey.dishBossTitle}:{' '}
                    {dishBossState.kind === 'licensed'
                      ? dict.journey.dishBossLicensed
                      : dishBossState.kind === 'ready'
                        ? dict.journey.dishBossReady
                        : dict.journey.dishBossLocked}
                  </span>
                  {owned && dishBossState.kind !== 'locked' ? (
                    <Link
                      to={`/cooking/${recipe.id}?bossDish=${recipe.id}`}
                      className={styles.bossLink}
                    >
                      <GoldButton>
                        {dishBossState.kind === 'licensed'
                          ? dict.journey.dishBossReplay
                          : dict.journey.dishBossEnter}
                      </GoldButton>
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className={styles.boardGrid}>
            <div className={styles.mediaColumn}>
              {/* Đợt 4: ảnh món lồng trong khung tranh treo dây
                  (r4-dish-frame, ruột trong suốt) + nhãn cấp phủ góc. */}
              <div className={styles.dishFrame}>
                <div className={styles.dishFrameInner}>
                  <ImageWithFallback
                    className={styles.image}
                    src={dishArtFor(recipe)}
                    alt={recipe.name}
                    fallbackTitle={recipe.name}
                  />
                  <span className={styles.categoryBadge}>{categoryLabel}</span>
                </div>
                <img className={styles.dishFrameImg} src={dishFrameArt} alt="" aria-hidden="true" />
                <span className={styles.frameGrade}>{gradeLabel}</span>
              </div>

              <div className={styles.ctaBox}>
                {owned ? (
                  <>
                    <Link to={`/cooking/${recipe.id}`} className={styles.cookNowLink}>
                      <span className={styles.playPin}>
                        <img className={styles.playPinImg} src={btnPlayPinArt} alt="" aria-hidden="true" />
                        <span className={styles.playPinText}>{dict.dashboard.heroPlayNow}</span>
                      </span>
                    </Link>
                    {recipe.priceCoins > 0 ? (
                      <p className={styles.ownedNote}>
                        {justBought ? dict.shop.justBought : dict.shop.ownedNote}
                      </p>
                    ) : (
                      <p className={styles.ownedNote}>{dict.shop.freeNote}</p>
                    )}
                  </>
                ) : (
                  /* Đợt 4: thẻ mua công thức = khung tre + khoá gỗ
                     (r4-buy-card, giấy đã làm trống). */
                  <div className={styles.buyCard}>
                    <img className={styles.buyCardImg} src={buyCardArt} alt="" aria-hidden="true" />
                    <div className={styles.buyCardBody}>
                      <span className={styles.buyPrice}>
                        🪙 {recipe.priceCoins.toLocaleString()} xu
                      </span>
                      <span className={styles.buyBalance}>
                        {dict.shop.yourBalance(balance.toLocaleString())}
                      </span>
                      <GoldButton
                        className={styles.buyBtn}
                        disabled={!canAfford}
                        onClick={() => setBuyConfirmOpen(true)}
                      >
                        🔒 {dict.shop.buyButton}
                      </GoldButton>
                      {!canAfford ? (
                        <span className={styles.buyHint}>
                          {dict.shop.needMore((recipe.priceCoins - balance).toLocaleString())}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Nguyên liệu — bảng gỗ treo cắt từ bản vẽ án A, hàng kem
                là dữ liệu thật đặt lên mặt gỗ (chuẩn án A đã duyệt) */}
            <section className={styles.boardPanel} aria-label={t('cooking.ingredients')}>
              <h2 className={styles.boardSignText}>
                {t('cooking.ingredients')} ({recipe.ingredients.length})
              </h2>
              <ul className={styles.boardRows}>
                {recipe.ingredients.map((item) => {
                  const ingredient = getIngredientById(item.ingredientId);
                  return (
                    <li key={item.ingredientId} className={styles.boardRow}>
                      <span className={styles.boardRowIcon}>
                        {ingredient?.fallbackEmoji || '🍲'}
                      </span>
                      <span className={styles.boardRowName}>
                        {ingredient?.name ?? item.ingredientId}
                      </span>
                      <span className={styles.boardRowAmount}>{item.amount}</span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <div className={styles.rightColumn}>
              {/* Các bước nấu — bảng gỗ treo của bản vẽ án A: thẻ bước
                  kem + nút mũi tên gỗ + plaque số bước đều là asset cắt
                  từ bản vẽ, phủ đúng vị trí đã vẽ; nội dung bước và số
                  "Bước x/N" là dữ liệu thật của món. Khung 1 bước theo
                  luật khung 2026-11-20 (không kéo dài lệch cột). */}
              <section className={styles.stepsBoard} aria-label={t('cooking.steps')}>
                <h2 className={styles.stepsSignText}>{t('cooking.steps')}</h2>
                {currentStep ? (
                  <>
                    <div
                      className={styles.stepCard}
                      onTouchStart={(e) => {
                        touchStartX.current = e.touches[0]?.clientX ?? null;
                      }}
                      onTouchEnd={(e) => {
                        const startX = touchStartX.current;
                        touchStartX.current = null;
                        if (startX === null) return;
                        const endX = e.changedTouches[0]?.clientX ?? startX;
                        if (startX - endX > 48) goToStep(safeStepIndex + 1);
                        else if (endX - startX > 48) goToStep(safeStepIndex - 1);
                      }}
                    >
                      <div key={currentStep.id} className={styles.stepCardInner}>
                        <span className={styles.stepNum}>{safeStepIndex + 1}</span>
                        <div className={styles.stepContent}>
                          <strong className={styles.stepTitle}>{currentStep.title}</strong>
                          <span className={styles.stepGesture}>
                            <span aria-hidden>{GESTURE_ICONS[gestureForStep(currentStep)]}</span>
                            {dict.cooking.gestures.names[gestureForStep(currentStep)]}
                          </span>
                          <p className={styles.stepDesc}>{currentStep.description}</p>
                          {currentStep.requiredIngredients.length > 0 ? (
                            <div className={styles.stepIngredients}>
                              {currentStep.requiredIngredients.map((ingId) => {
                                const ing = getIngredientById(ingId);
                                return (
                                  <span key={ingId} className={styles.stepIngredientChip}>
                                    {ing?.fallbackEmoji ? `${ing.fallbackEmoji} ` : ''}
                                    {ing?.name ?? ingId}
                                  </span>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`${styles.arrowBtn} ${styles.arrowL}`}
                      aria-label={t('cooking.stepPrev')}
                      disabled={safeStepIndex <= 0}
                      onClick={() => goToStep(safeStepIndex - 1)}
                    >
                      <img src={GAME_ART.btnArrowLeft} alt="" aria-hidden="true" />
                    </button>
                    <div className={styles.plaque}>
                      <img src={GAME_ART.plaqueStep} alt="" aria-hidden="true" />
                      <span className={styles.plaqueText}>
                        {t('cooking.hudStepOf', { current: safeStepIndex + 1, total: steps.length })}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`${styles.arrowBtn} ${styles.arrowR}`}
                      aria-label={t('cooking.stepNext')}
                      disabled={safeStepIndex >= steps.length - 1}
                      onClick={() => goToStep(safeStepIndex + 1)}
                    >
                      <img src={GAME_ART.btnArrowRight} alt="" aria-hidden="true" />
                    </button>
                  </>
                ) : null}
              </section>
            </div>
          </div>

          <NoiNoi pose="gioi-thieu" size={104} alt="" className={styles.noiNoiCorner} />
        </motion.article>

        {/* Đợt 4: bình luận nằm trên trang giấy của sổ khách gáy tre
            (r4-comment-book) — tiêu đề BÌNH LUẬN là chữ thiết kế trên
            bìa, nội dung thật cuộn trong vùng trang trống. */}
        <motion.section
          className={styles.commentsPanel}
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: reduceMotion ? 0 : 0.12 }}
        >
          <img className={styles.commentBookImg} src={commentBookArt} alt="" aria-hidden="true" />
          <div className={styles.commentBookPage}>
            <RecipeComments recipeId={recipe.id} />
          </div>
        </motion.section>
      </div>

      {/* Đợt 4: hộp xác nhận mua = bảng treo (r4-confirm-board) làm
          đầu vỏ modal theme-d; hai nút thật nằm ngay dưới bảng. */}
      <Modal
        open={buyConfirmOpen}
        title={dict.shop.confirmTitle}
        onClose={() => setBuyConfirmOpen(false)}
        closeLabel={dict.shop.cancel}
        shellClass={styles.confirmShell}
        headerClass={styles.confirmHeader}
        bodyClass={styles.confirmBody}
        titleClass={styles.confirmTitle}
      >
        <img className={styles.confirmBoardImg} src={confirmBoardArt} alt="" aria-hidden="true" />
        <p className={styles.buyModalBody}>
          {dict.shop.confirmBody(
            recipe.name,
            recipe.priceCoins.toLocaleString(),
            (balance - recipe.priceCoins).toLocaleString(),
          )}
        </p>
        <div className={styles.buyModalFooter}>
          <WoodButton onClick={() => setBuyConfirmOpen(false)}>
            {dict.shop.cancel}
          </WoodButton>
          <GoldButton onClick={handleConfirmBuy}>
            🪙 {dict.shop.confirmBuy}
          </GoldButton>
        </div>
      </Modal>
    </SceneShell>
  );
}
