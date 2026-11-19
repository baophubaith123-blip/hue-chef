import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getIngredientById } from '@/data/ingredients';
import type { Recipe } from '@/data/types';
import {
  CoinPill,
  CustomerFace,
  DishGradeFrame,
  GoldButton,
  Modal,
  NoiNoi,
  Toast,
  WoodButton,
  WoodSign,
  type ToastTone,
} from '@/components/theme-d';
import { SCENES } from '@/components/theme-d/assets';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { bestStarsByRecipe, sellableRecipes } from '@/features/journey/lib/journey';
import { dishGradeFor } from '@/features/recipes/lib/grade';
import { todayKey } from '@/features/stall/lib/day';
import { basePriceFor } from '@/features/stall/lib/market';
import { moodForCustomer, patienceLeftRatio } from '@/features/stall/lib/orders';
import {
  GRADE_MARGIN,
  priceForBatch,
  qualityBandForLevel,
  stallStarsForExp,
  tipForBatch,
} from '@/features/stall/lib/pricing-sell';
import { REQUEST_ICONS } from '@/features/stall/lib/substitutions';
import { REQUEST_OK_TIP_FACTOR, shiftPhaseAt } from '@/features/stall/lib/rush';
import { potCapacityFor, upgradeMaxLevel } from '@/features/stall/lib/upgrades';
import {
  acceptOrder,
  canCookBatch,
  claimStarterPack,
  clearSpoiledNotices,
  closeShift,
  discardBatch,
  dismissSummary,
  inventoryByIngredient,
  missingForBatch,
  openShift,
  serveBatch,
  startBackgroundPot,
  tickStall,
  useStall,
} from '@/features/stall/store';
import type { CookedBatch, StallCustomer } from '@/features/stall/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/pages/player/StallPage.module.css';

/** Scene slots over the painted tables (first three) and yard spots. */
const TABLE_SLOTS = [
  { left: 17, top: 74 },
  { left: 50, top: 73 },
  { left: 83, top: 74 },
  { left: 33, top: 88 },
  { left: 66, top: 88 },
  { left: 7, top: 90 },
  { left: 93, top: 90 },
];

function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function StallPage() {
  const { dict } = useTranslation();
  const s = dict.stall;
  const { user, addCoins, addCok } = useAuth();
  const { getApprovedRecipes } = useRecipes();
  const navigate = useNavigate();
  const stall = useStall(user?.id ?? null);
  const [now, setNow] = useState(() => Date.now());
  const [panel, setPanel] = useState<'menu' | 'pantry' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const prevStatesRef = useRef<Map<string, string>>(new Map());
  const userRef = useRef(user);
  userRef.current = user;
  const recipesRef = useRef<Recipe[]>([]);
  recipesRef.current = getApprovedRecipes();

  const showToast = (message: string, tone: ToastTone) => {
    setToast({ message, tone });
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4200);
  };

  // The stall clock: spawn / patience / shift end, once per second.
  useEffect(() => {
    if (!user) return;
    const id = user.id;
    const timer = window.setInterval(() => {
      const current = userRef.current;
      if (!current) return;
      tickStall(id, current, recipesRef.current, Date.now());
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // A customer flipping to "left" is a lost order — say so out loud.
  useEffect(() => {
    if (!stall) return;
    const prev = prevStatesRef.current;
    for (const customer of stall.customers) {
      const before = prev.get(customer.id);
      if (before && before !== 'left' && customer.state === 'left') {
        const dish = recipesRef.current.find((r) => r.id === customer.recipeId);
        showToast(s.customerLeftToast(dish?.name ?? customer.recipeId), 'error');
      }
      prev.set(customer.id, customer.state);
    }
  }, [stall, s]);

  // A background pot leaving the stove means its batch just landed on
  // the counter (Gói H5) — announce it like the lost-order toast does.
  const prevPotsRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    if (!stall) return;
    const prev = prevPotsRef.current;
    const currentIds = new Set(stall.pots.map((pot) => pot.id));
    for (const [potId, recipeId] of prev) {
      if (!currentIds.has(potId)) {
        const dish = recipesRef.current.find((r) => r.id === recipeId);
        showToast(s.potReadyToast(dish?.name ?? recipeId), 'success');
      }
    }
    prevPotsRef.current = new Map(stall.pots.map((pot) => [pot.id, pot.recipeId]));
  }, [stall, s]);

  const recipes = getApprovedRecipes();
  const sellable = useMemo(
    () => (user ? sellableRecipes(user, recipes) : []),
    [user, recipes],
  );
  const recipeById = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);
  const bestStars = useMemo(() => bestStarsByRecipe(user), [user]);
  const stars = stallStarsForExp(stall?.exp ?? 0);
  const inventory = useMemo(
    () => (stall ? inventoryByIngredient(stall) : new Map<string, number>()),
    [stall],
  );
  const selected = stall?.customers.find((c) => c.id === selectedId) ?? null;
  const selectedRecipe = selected ? recipeById.get(selected.recipeId) : undefined;
  const matchingBatches = selected
    ? (stall?.batches ?? []).filter(
        (b) => b.recipeId === selected.recipeId && b.qty === selected.qty,
      )
    : [];
  const shiftLeft = stall?.shift ? stall.shift.endsAt - now : 0;
  // Rush hour (Gói H5, mục 5.5): the middle of the shift repaints the
  // scene — warmer light, a rush banner, a livelier Nồi Nồi.
  const isRush = Boolean(stall?.shift && shiftPhaseAt(stall.shift, now) === 'rush');
  const potCapacity = potCapacityFor(stall?.upgrades.pot ?? 0);
  const cheapestDish = useMemo(() => {
    let best: Recipe | null = null;
    let bestCost = Number.POSITIVE_INFINITY;
    for (const recipe of sellable) {
      const cost = recipe.ingredients.reduce((sum, ref) => sum + basePriceFor(ref.ingredientId), 0);
      if (cost < bestCost) {
        bestCost = cost;
        best = recipe;
      }
    }
    return best;
  }, [sellable]);
  const starterEligible = Boolean(
    stall &&
      user &&
      !stall.starterPackClaimed &&
      (user.coins ?? 0) <= 0 &&
      stall.lots.length === 0 &&
      stall.batches.length === 0 &&
      sellable.length > 0,
  );

  if (!user || !stall) return null;

  const handleServe = (batch: CookedBatch) => {
    if (!selected || !selectedRecipe) return;
    const result = serveBatch(
      user.id,
      selected.id,
      batch.id,
      bestStars.get(batch.recipeId) ?? 0,
      selectedRecipe,
      Date.now(),
    );
    if (!result) return;
    if (result.totalXu > 0) addCoins(result.totalXu);
    if (result.cok > 0) addCok(result.cok);
    setSelectedId(null);
    showToast(s.servedToast(result.totalXu), 'success');
  };

  const servePreview = (batch: CookedBatch, customer: StallCustomer) => {
    const price = priceForBatch({
      cost: batch.cost,
      grade: dishGradeFor(recipeById.get(batch.recipeId) ?? { difficulty: 1 }),
      bestStars: bestStars.get(batch.recipeId) ?? 0,
      level: batch.level,
    });
    let tip = tipForBatch({
      price,
      level: batch.level,
      patienceLeftRatio: patienceLeftRatio(customer, now),
    });
    // Mirror the store: an honoured picky request tips extra (Gói H5).
    if (batch.requestOutcome === 'ok') tip = Math.round(tip * REQUEST_OK_TIP_FACTOR);
    return { price, tip, total: price + tip };
  };

  return (
    <div className={styles.page}>
      <div className={styles.stageWrap}>
        <div className={styles.stage}>
          <img className={styles.scene} src={SCENES['canh-quay']} alt="" draggable={false} />
          <div className={styles.nightShade} aria-hidden />
          {isRush ? <div className={styles.rushShade} aria-hidden /> : null}

          {/* The only two fixed buttons of the page (mục 5.1). */}
          <Link className={styles.backBtn} to="/home" aria-label={s.backHome}>
            ←
          </Link>
          <Link className={styles.marketBtn} to="/market" aria-label={s.toMarket}>
            <span aria-hidden>🧺</span>
          </Link>

          {/* Stall sign: name, stars, wallets — shown "in-scene" (mục 5.2). */}
          <div className={styles.signBox}>
            <WoodSign
              title={s.stallName(user.name)}
              subtitle={`${'★'.repeat(stars)}${'☆'.repeat(5 - stars)} · ${s.stallStars(stars)}`}
            >
              <div className={styles.signWallets}>
                <CoinPill amount={user.coins ?? 0} currency="xu" label={s.xuBoard} />
                <CoinPill amount={user.cok ?? 0} currency="cok" label={s.cokJar} />
              </div>
            </WoodSign>
            {stall.shift ? (
              <div className={styles.shiftBar}>
                <span className={styles.shiftClock}>{s.shiftTimeLeft(formatClock(shiftLeft))}</span>
                <WoodButton onClick={() => closeShift(user.id, Date.now())}>{s.closeShift}</WoodButton>
              </div>
            ) : (
              <GoldButton
                className={styles.openShiftBtn}
                disabled={sellable.length === 0}
                onClick={() => openShift(user.id, Date.now())}
              >
                🔔 {s.openShift}
              </GoldButton>
            )}
            {isRush ? (
              <div className={styles.rushBanner} role="status">
                <strong>{s.rushBanner}</strong>
                <span>{s.rushBannerBody}</span>
              </div>
            ) : null}
          </div>

          <div className={styles.noiNoiBox}>
            <NoiNoi
              pose={isRush ? 'mc' : stall.shift ? 'chao' : 'ngu'}
              size={132}
              alt={s.noiNoiAlt}
              speech={isRush ? s.noiNoiRush : stall.shift ? s.noiNoiShift : s.noiNoiIdle}
            />
          </div>

          {/* In-scene objects: stove, menu board, pantry door. */}
          <button
            type="button"
            className={styles.stoveBtn}
            aria-label={s.stoveLabel}
            onClick={() => document.getElementById('stall-orders')?.scrollIntoView({ behavior: 'smooth' })}
          >
            🔥
          </button>
          <button
            type="button"
            className={styles.menuBoardBtn}
            aria-label={s.menuBoardLabel}
            onClick={() => setPanel('menu')}
          >
            📜 {s.menuTitle}
          </button>
          <button
            type="button"
            className={styles.pantryBtn}
            aria-label={s.pantryDoorLabel}
            onClick={() => setPanel('pantry')}
          >
            🚪 {s.pantryTitle}
            {stall.lots.length > 0 ? <span className={styles.pantryCount}>{inventory.size}</span> : null}
          </button>

          {/* Customers at their tables, order bubble overhead (mục 5.3). */}
          {stall.customers.map((customer) => {
            const recipe = recipeById.get(customer.recipeId);
            const slot = TABLE_SLOTS[customer.tableIndex % TABLE_SLOTS.length];
            const mood = moodForCustomer(customer, now);
            return (
              <button
                key={customer.id}
                type="button"
                className={styles.customer}
                style={{ left: `${slot.left}%`, top: `${slot.top}%` }}
                onClick={() => setSelectedId(customer.id)}
                aria-label={`${s.tierNames[customer.tier]} — ${recipe?.name ?? ''}`}
              >
                <span className={styles.bubble}>
                  {recipe ? <img src={recipe.image} alt="" className={styles.bubbleImg} /> : null}
                  <span className={styles.bubbleText}>
                    {recipe?.name} ×{customer.qty}
                  </span>
                  {customer.requestKind ? (
                    <span className={styles.bubbleRequest}>
                      {REQUEST_ICONS[customer.requestKind]} {s.requestNames[customer.requestKind]}
                    </span>
                  ) : null}
                  {customer.state === 'waiting' ? (
                    <span className={styles.bubbleState}>{s.acceptOrder}</span>
                  ) : customer.state === 'accepted' ? (
                    <span className={styles.bubbleState}>{s.cookOrder}</span>
                  ) : null}
                </span>
                <CustomerFace
                  tier={customer.tier}
                  mood={mood}
                  size={76}
                  alt={s.customerAlt(s.tierNames[customer.tier])}
                  patiencePercent={
                    customer.state === 'waiting' || customer.state === 'accepted'
                      ? patienceLeftRatio(customer, now) * 100
                      : undefined
                  }
                  patienceLabel={s.patienceLabel}
                />
                <span className={styles.tierTag}>{s.tierNames[customer.tier]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile only (≤560px CSS): the wallets move out of the sign to a
          bar under the stage so the sign cluster cannot collide with the
          in-scene object buttons on a short stage. */}
      <div className={styles.mobileWallets}>
        <CoinPill amount={user.coins ?? 0} currency="xu" label={s.xuBoard} />
        <CoinPill amount={user.cok ?? 0} currency="cok" label={s.cokJar} />
      </div>

      {/* Dock: order board + counter — the stall's working surface. */}
      <div className={styles.dock}>
        <section className={styles.board} id="stall-orders" aria-label={s.orderBoardTitle}>
          <h2 className={styles.dockTitle}>📌 {s.orderBoardTitle}</h2>
          {sellable.length === 0 ? (
            <div className={styles.noLicense}>
              <p className={styles.noLicenseTitle}>{s.noLicenseTitle}</p>
              <p>{s.noLicenseBody}</p>
              <Link to="/map">
                <GoldButton>{s.goToMap}</GoldButton>
              </Link>
            </div>
          ) : stall.customers.filter((c) => c.state === 'accepted').length === 0 ? (
            <p className={styles.dockEmpty}>{s.orderBoardEmpty}</p>
          ) : (
            <ul className={styles.orderList}>
              {stall.customers
                .filter((c) => c.state === 'accepted')
                .map((customer) => {
                  const recipe = recipeById.get(customer.recipeId);
                  if (!recipe) return null;
                  const cookable = canCookBatch(stall, recipe, customer.qty);
                  const ready = stall.batches.some(
                    (b) => b.recipeId === customer.recipeId && b.qty === customer.qty && b.level !== 'spoiled',
                  );
                  return (
                    <li key={customer.id} className={styles.orderCard}>
                      <img src={recipe.image} alt="" className={styles.orderImg} />
                      <div className={styles.orderInfo}>
                        <strong>{recipe.name}</strong>
                        <span>
                          {s.tierNames[customer.tier]} · {s.orderQty(customer.qty)}
                        </span>
                        <span className={styles.orderPatience}>
                          ⏳ {formatClock(customer.patienceMs - (now - customer.arrivedAt))}
                        </span>
                        {customer.requestKind ? (
                          <span className={styles.orderRequest}>
                            {REQUEST_ICONS[customer.requestKind]} {s.requestChip(s.requestNames[customer.requestKind] ?? customer.requestKind)}
                          </span>
                        ) : null}
                      </div>
                      {ready ? (
                        <GoldButton onClick={() => setSelectedId(customer.id)}>{s.serveOrder}</GoldButton>
                      ) : (
                        <GoldButton
                          disabled={!cookable}
                          onClick={() => navigate(`/cooking/${recipe.id}?sell=${customer.id}`)}
                        >
                          🍳 {s.cookOrder}
                        </GoldButton>
                      )}
                      {!cookable && !ready ? <span className={styles.orderWarn}>{s.cookOrderMissing}</span> : null}
                      {(() => {
                        const pot = stall.pots.find((p) => p.customerId === customer.id);
                        if (pot) {
                          const left = Math.max(0, Math.ceil((pot.readyAt - now) / 1000));
                          return <span className={styles.potNote}>🫕 {s.potCooking(recipe.name, left)}</span>;
                        }
                        if (ready || !cookable) return null;
                        if (stall.pots.length >= potCapacity) {
                          return <span className={styles.potNote}>{s.potSlotsFull}</span>;
                        }
                        return (
                          <WoodButton
                            onClick={() => startBackgroundPot(user.id, user, customer.id, recipes, Date.now())}
                          >
                            {s.potStart}
                          </WoodButton>
                        );
                      })()}
                    </li>
                  );
                })}
            </ul>
          )}
        </section>

        <section className={styles.board} aria-label={s.counterTitle}>
          <h2 className={styles.dockTitle}>🍽️ {s.counterTitle}</h2>
          {stall.batches.length === 0 ? (
            <p className={styles.dockEmpty}>{s.counterEmpty}</p>
          ) : (
            <ul className={styles.batchList}>
              {stall.batches.map((batch) => {
                const recipe = recipeById.get(batch.recipeId);
                if (!recipe) return null;
                const band = qualityBandForLevel(batch.level);
                const price = priceForBatch({
                  cost: batch.cost,
                  grade: dishGradeFor(recipe),
                  bestStars: bestStars.get(batch.recipeId) ?? 0,
                  level: batch.level,
                });
                return (
                  <li key={batch.id} className={styles.batchCard}>
                    <img src={recipe.image} alt="" className={styles.orderImg} />
                    <div className={styles.orderInfo}>
                      <strong>
                        {recipe.name} ×{batch.qty}
                      </strong>
                      <span className={styles[`quality_${batch.level}`]}>
                        {s.qualityNames[batch.level]} · {s.batchMeta(batch.qualityScore)}
                      </span>
                      <span>{batch.diagnosis.map((key) => s.diagnosisNames[key] ?? key).join(' · ')}</span>
                      <span>
                        {s.batchCost(batch.cost)}
                        {band.sellable ? ` · ${s.batchPricePreview(price)}` : ''}
                      </span>
                    </div>
                    <WoodButton
                      onClick={() => {
                        if (window.confirm(s.discardConfirm)) discardBatch(user.id, batch.id);
                      }}
                    >
                      {s.discardBatch}
                    </WoodButton>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Background pots (Gói H5): orders simmering in parallel with
            whatever the player cooks by hand on the main stove. */}
        {stall.pots.length > 0 ? (
          <section className={styles.board} aria-label={s.potsTitle}>
            <h2 className={styles.dockTitle}>
              {s.potsTitle} · {stall.pots.length}/{potCapacity}
            </h2>
            <ul className={styles.potList}>
              {stall.pots.map((pot) => {
                const recipe = recipeById.get(pot.recipeId);
                const total = Math.max(1, pot.readyAt - pot.startedAt);
                const pct = Math.min(100, Math.max(0, ((now - pot.startedAt) / total) * 100));
                const left = Math.max(0, Math.ceil((pot.readyAt - now) / 1000));
                return (
                  <li key={pot.id} className={styles.potCard}>
                    <span className={styles.potDish}>
                      🫕 {recipe?.name ?? pot.recipeId} ×{pot.qty}
                    </span>
                    <span
                      className={styles.potBar}
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(pct)}
                      aria-label={s.potsTitle}
                    >
                      <span className={styles.potFill} style={{ width: `${pct}%` }} />
                    </span>
                    <span className={styles.potTime}>⏳ {left}s</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>

      {/* Customer panel: accept / cook / serve for the tapped customer. */}
      <Modal
        open={selected !== null}
        title={selected ? (selectedRecipe?.name ?? '') : ''}
        onClose={() => setSelectedId(null)}
        closeLabel={s.summaryClose}
      >
        {selected && selectedRecipe ? (
          <div className={styles.customerPanel}>
            <div className={styles.customerHead}>
              <CustomerFace
                tier={selected.tier}
                mood={moodForCustomer(selected, now)}
                size={88}
                alt={s.customerAlt(s.tierNames[selected.tier])}
                patiencePercent={patienceLeftRatio(selected, now) * 100}
                patienceLabel={s.patienceLabel}
              />
              <div>
                <p>
                  <strong>{s.tierNames[selected.tier]}</strong> · {s.orderQty(selected.qty)}
                </p>
                <p>⏳ {formatClock(selected.patienceMs - (now - selected.arrivedAt))}</p>
                {selected.requestKind ? (
                  <p className={styles.requestLine}>
                    {REQUEST_ICONS[selected.requestKind]} {s.requestOnOrder(s.requestNames[selected.requestKind] ?? selected.requestKind)}
                  </p>
                ) : null}
                {selected.state === 'waiting' ? <p>{s.waitingCustomer}</p> : null}
              </div>
            </div>
            {selected.state === 'waiting' ? (
              <GoldButton
                onClick={() => {
                  acceptOrder(user.id, selected.id);
                  setSelectedId(null);
                }}
              >
                📝 {s.acceptOrder}
              </GoldButton>
            ) : null}
            {selected.state === 'accepted' ? (
              <>
                {matchingBatches.length === 0 ? <p>{s.serveNoBatch}</p> : null}
                {matchingBatches.map((batch) => {
                  const preview = servePreview(batch, selected);
                  const band = qualityBandForLevel(batch.level);
                  return (
                    <div key={batch.id} className={styles.serveRow}>
                      <div className={styles.orderInfo}>
                        <strong className={styles[`quality_${batch.level}`]}>
                          {s.qualityNames[batch.level]} · {s.batchMeta(batch.qualityScore)}
                        </strong>
                        <span>{batch.diagnosis.map((key) => s.diagnosisNames[key] ?? key).join(' · ')}</span>
                        {band.sellable ? (
                          <span>
                            {s.servePrice} {preview.price} xu · {s.serveTip} {preview.tip} xu ·{' '}
                            {s.serveTotal} {preview.total} xu
                            {selected.tier === 'vip' && (batch.level === 'perfect' || batch.level === 'standard')
                              ? ` · +${batch.level === 'perfect' ? 2 : 1} cok`
                              : ''}
                            {batch.requestOutcome === 'ok' ? ` · ✓ ${s.serveRequestBonus}` : ''}
                          </span>
                        ) : (
                          <span>{s.sellResultSpoiled}</span>
                        )}
                      </div>
                      {band.sellable ? (
                        <GoldButton onClick={() => handleServe(batch)}>🍽️ {s.serveAction}</GoldButton>
                      ) : (
                        <WoodButton
                          onClick={() => {
                            if (window.confirm(s.discardConfirm)) discardBatch(user.id, batch.id);
                          }}
                        >
                          {s.discardBatch}
                        </WoodButton>
                      )}
                    </div>
                  );
                })}
                {canCookBatch(stall, selectedRecipe, selected.qty) ? (
                  <WoodButton onClick={() => navigate(`/cooking/${selectedRecipe.id}?sell=${selected.id}`)}>
                    🍳 {s.cookOrder}
                  </WoodButton>
                ) : (
                  <p className={styles.orderWarn}>
                    {s.cookOrderMissing}:{' '}
                    {missingForBatch(stall, selectedRecipe, selected.qty)
                      .map((m) => `${getIngredientById(m.ingredientId)?.name ?? m.ingredientId} ×${m.missing}`)
                      .join(', ')}
                  </p>
                )}
              </>
            ) : null}
            {selected.state === 'served' || selected.state === 'left' ? (
              <p>{selected.state === 'served' ? '✓' : '✗'}</p>
            ) : null}
          </div>
        ) : null}
      </Modal>

      {/* Menu board panel. */}
      <Modal open={panel === 'menu'} title={s.menuTitle} onClose={() => setPanel(null)} closeLabel={s.summaryClose}>
        {sellable.length === 0 ? (
          <p>{s.menuEmpty}</p>
        ) : (
          <div className={styles.menuGrid}>
            {sellable.map((recipe) => {
              const grade = dishGradeFor(recipe);
              return (
                <DishGradeFrame key={recipe.id} grade={grade} gradeLabel={dict.recipe.gradeNames[grade - 1] ?? ''}>
                  <div className={styles.menuCard}>
                    <img src={recipe.image} alt="" className={styles.menuImg} />
                    <strong>{recipe.name}</strong>
                    <span>{'★'.repeat(bestStars.get(recipe.id) ?? 0)}{'☆'.repeat(5 - (bestStars.get(recipe.id) ?? 0))}</span>
                    <span>{s.menuItemMeta(bestStars.get(recipe.id) ?? 0, Math.round(GRADE_MARGIN[grade] * 100))}</span>
                  </div>
                </DishGradeFrame>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Pantry panel. */}
      <Modal open={panel === 'pantry'} title={s.pantryTitle} onClose={() => setPanel(null)} closeLabel={s.summaryClose}>
        <div className={styles.kitchenBox}>
          <strong>🍳 {s.kitchenTitle}</strong>
          {(['knife', 'stove', 'pot'] as const).map((kind) => (
            <p key={kind}>
              {kind === 'knife' ? '🔪' : kind === 'stove' ? '🔥' : '🍲'} {s.upgradeNames[kind]} —{' '}
              {s.upgradeLevel(stall.upgrades[kind], upgradeMaxLevel(kind))}
              {kind === 'pot' ? ` · ${stall.pots.length}/${potCapacity}` : ''}
            </p>
          ))}
        </div>
        {stall.spoiledNotices.length > 0 ? (
          <div className={styles.spoiledBox}>
            {stall.spoiledNotices.slice(-4).map((notice, idx) => (
              <p key={idx}>
                ⚠️ {s.spoiledNotice(notice.qty, getIngredientById(notice.ingredientId)?.name ?? notice.ingredientId)}
              </p>
            ))}
            <WoodButton onClick={() => clearSpoiledNotices(user.id)}>✓</WoodButton>
          </div>
        ) : null}
        {starterEligible && cheapestDish ? (
          <div className={styles.starterBox}>
            <strong>{s.starterPackTitle}</strong>
            <p>{s.starterPackBody(cheapestDish.name)}</p>
            <GoldButton onClick={() => claimStarterPack(user.id, cheapestDish)}>
              🎁 {s.starterPackClaim}
            </GoldButton>
          </div>
        ) : null}
        {stall.lots.length === 0 ? (
          <p>{s.pantryEmpty}</p>
        ) : (
          <ul className={styles.pantryList}>
            {[...inventory.entries()].map(([ingredientId, qty]) => {
              const ingredient = getIngredientById(ingredientId);
              const lots = stall.lots.filter((lot) => lot.ingredientId === ingredientId);
              const earliest = lots.map((lot) => lot.expiryDay).sort()[0] ?? '';
              const soon = earliest !== '' && earliest <= todayKey();
              return (
                <li key={ingredientId} className={styles.pantryRow}>
                  <span>
                    {ingredient?.fallbackEmoji} {ingredient?.name ?? ingredientId}
                  </span>
                  <span>{s.pantryQty(qty)}</span>
                  <span className={soon ? styles.expiringSoon : undefined}>
                    {s.pantryExpires(earliest)}
                    {soon ? ` · ${s.pantryExpiringSoon}` : ''}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>

      {/* Shift summary. */}
      <Modal
        open={stall.shift === null && stall.lastSummary !== null}
        title={s.summaryTitle}
        onClose={() => dismissSummary(user.id)}
        closeLabel={s.summaryClose}
      >
        {stall.lastSummary ? (
          <div className={styles.summary}>
            <p>💰 {s.summaryRevenue}: <strong>{stall.lastSummary.revenueXu} xu</strong></p>
            <p>♦ {s.summaryCok}: <strong>{stall.lastSummary.revenueCok} cok</strong></p>
            <p>✅ {s.summaryServedOk}: {stall.lastSummary.servedOk}</p>
            <p>🟡 {s.summaryServedPoor}: {stall.lastSummary.servedPoor}</p>
            <p>🚶 {s.summaryLost}: {stall.lastSummary.lost}</p>
            <p>⌛ {s.summaryUnserved}: {stall.lastSummary.unserved}</p>
            <p>🗑️ {s.summarySpoiled}: {stall.lastSummary.spoiledBatches}</p>
            <p>⭐ {s.summaryExp}: +{stall.lastSummary.expGained}</p>
            <p>
              {stall.lastSummary.starsAfter > stall.lastSummary.starsBefore
                ? s.summaryStarsUp(stall.lastSummary.starsAfter)
                : s.summaryStarsSame(stall.lastSummary.starsAfter)}
            </p>
            <GoldButton onClick={() => dismissSummary(user.id)}>{s.summaryClose}</GoldButton>
          </div>
        ) : null}
      </Modal>

      {toast ? (
        <div className={styles.toastBox}>
          <Toast message={toast.message} tone={toast.tone} />
        </div>
      ) : null}
    </div>
  );
}
