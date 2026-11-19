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
import { StallSceneLayers } from '@/features/stall/components/StallSceneLayers';
import { todayKey } from '@/features/stall/lib/day';
import { basePriceFor } from '@/features/stall/lib/market';
import { moodForCustomer, patienceLeftMs, patienceLeftRatio } from '@/features/stall/lib/orders';
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
  STAFF_ROLES,
  TRAINING_COST,
  cashierTipFactor,
  dailyWageTotal,
  decorTipFactor,
  deliveryFeeFor,
  isReseasonable,
  rankForOrders,
  skinAvailable,
  skinDef,
  specialtyMatches,
  wageFor,
  NOI_NOI_SKINS,
  type DishGroup,
  type StaffRole,
} from '@/features/stall/lib/support';
import {
  incomeFactorForLevel,
  menuCapForLevel,
  stallLevelDef,
  upgradeStatusFor,
} from '@/features/stall/lib/stall-levels';
import { afkEfficiencyFor, afkEssentialFor } from '@/features/stall/lib/afk';
import {
  acceptOrder,
  acknowledgeWallet,
  buySkin,
  canCookBatch,
  claimStarterPack,
  clearSpoiledNotices,
  closeShift,
  discardBatch,
  dismissAfkReport,
  dismissSummary,
  effectiveMenuRecipes,
  hireStaff,
  inventoryByIngredient,
  missingForBatch,
  openShift,
  remoteBuyIngredient,
  remoteUnitPriceFor,
  selectSkin,
  serveBatch,
  serveDeliveryBatch,
  setMenuDish,
  settleAfk,
  staffOf,
  startBackgroundPot,
  tickStall,
  trainStaff,
  upgradeStall,
  useFreezeCard,
  usePatienceCard,
  useReseasonCard,
  useStall,
  useSwapCard,
} from '@/features/stall/store';
import type { CookedBatch, StallCustomer } from '@/features/stall/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/pages/player/StallPage.module.css';

/** Scene slots over the painted tables and yard spots — twelve since
 * Gói H6, matching the level-5 table count (mục 8.3). */
const TABLE_SLOTS = [
  { left: 17, top: 74 },
  { left: 50, top: 73 },
  { left: 83, top: 74 },
  { left: 33, top: 88 },
  { left: 66, top: 88 },
  { left: 7, top: 90 },
  { left: 93, top: 90 },
  { left: 24, top: 61 },
  { left: 76, top: 61 },
  { left: 41, top: 90 },
  { left: 58, top: 90 },
  { left: 50, top: 61 },
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
  const sup = s.support;
  const { user, addCoins, addCok } = useAuth();
  const { getApprovedRecipes } = useRecipes();
  const navigate = useNavigate();
  const stall = useStall(user?.id ?? null);
  const [now, setNow] = useState(() => Date.now());
  const [panel, setPanel] = useState<'menu' | 'pantry' | 'staff' | 'support' | null>(null);
  const [remoteQty, setRemoteQty] = useState<Record<string, number>>({});
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

  // AFK settlement (Gói H6, mục 5.9): once per mount, before the first
  // tick refreshes the tended-clock, settle whatever the crew did
  // while the stall was untended. The report (if any) waits in state.
  const settleRef = useRef(false);
  useEffect(() => {
    if (!user || settleRef.current) return;
    settleRef.current = true;
    settleAfk(user.id, user, recipesRef.current, Date.now());
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wallet settlement (Gói H6): crew earnings (auto-serve, AFK) wait
  // in the store's pending books; wages wait as a debt. This effect is
  // the single place they cross into the wallets — via AuthContext,
  // exactly like a manual serve.
  useEffect(() => {
    if (!user || !stall) return;
    const creditXu = stall.pendingCreditXu;
    const creditCok = stall.pendingCreditCok;
    const debt = stall.wageDebtXu;
    if (creditXu === 0 && creditCok === 0 && debt === 0) return;
    let paid = 0;
    if (creditXu > 0) addCoins(creditXu);
    if (creditCok > 0) addCok(creditCok);
    if (debt > 0) {
      paid = Math.min((userRef.current?.coins ?? 0) + Math.max(0, creditXu), debt);
      if (paid > 0) addCoins(-paid);
    }
    if (creditXu === 0 && creditCok === 0 && paid === 0) return;
    acknowledgeWallet(user.id, creditXu, creditCok, paid);
    if (paid > 0) showToast(sup.wagesPaidToast(paid), 'success');
  }, [user, stall, addCoins, addCok, sup]); // eslint-disable-line react-hooks/exhaustive-deps

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
  // Gói H6 derived state: level, menu, crew, AFK readiness, skin.
  const stallLevel = stall?.stallLevel ?? 1;
  const levelNow = stallLevelDef(stallLevel);
  const menuRecipes = useMemo(
    () => (user && stall ? effectiveMenuRecipes(stall, user, recipes) : []),
    [user, stall, recipes],
  );
  const upgradeStatus = useMemo(
    () =>
      upgradeStatusFor({
        level: stallLevel,
        stars: stallStarsForExp(stall?.exp ?? 0),
        licensed: sellable,
      }),
    [stallLevel, stall, sellable],
  );
  const essential = useMemo(() => afkEssentialFor(stall?.staff ?? []), [stall]);
  const afkEfficiencyPct = Math.round(afkEfficiencyFor(stall?.staff ?? []) * 100);
  const skin = skinDef(stall?.noiNoiSkinId ?? 'mac-dinh');
  const deliveryCustomers = (stall?.customers ?? []).filter((c) => c.delivery);
  const sceneCustomers = (stall?.customers ?? []).filter((c) => !c.delivery);
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
    const serve = selected.delivery ? serveDeliveryBatch : serveBatch;
    const result = serve(
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
    // Mirror serveCore exactly: capital-law price × level factor,
    // then the tip chain (request → cashier → flowers).
    const price = Math.round(
      priceForBatch({
        cost: batch.cost,
        grade: dishGradeFor(recipeById.get(batch.recipeId) ?? { difficulty: 1 }),
        bestStars: bestStars.get(batch.recipeId) ?? 0,
        level: batch.level,
      }) * incomeFactorForLevel(stallLevel),
    );
    let tip = tipForBatch({
      price,
      level: batch.level,
      patienceLeftRatio: patienceLeftRatio(customer, now),
    });
    // Mirror the store: an honoured picky request tips extra (Gói H5).
    if (batch.requestOutcome === 'ok') tip = Math.round(tip * REQUEST_OK_TIP_FACTOR);
    const cashier = stall ? staffOf(stall, 'cashier') : undefined;
    if (cashier) {
      const recipe = recipeById.get(batch.recipeId);
      tip = Math.round(
        tip *
          cashierTipFactor(
            rankForOrders(cashier.ordersDone),
            recipe ? specialtyMatches(cashier.specialty, recipe) : false,
          ),
      );
    }
    tip = Math.round(tip * decorTipFactor(stall?.decorIds ?? []));
    const fee = customer.delivery ? deliveryFeeFor(price) : 0;
    return { price, tip, fee, total: price + tip + fee };
  };

  return (
    <div className={styles.page}>
      <div className={styles.stageWrap}>
        <div className={styles.stage}>
          <img className={styles.scene} src={SCENES['canh-quay']} alt="" draggable={false} />
          <div className={styles.nightShade} aria-hidden />
          {isRush ? <div className={styles.rushShade} aria-hidden /> : null}
          {/* Upgrade + decoration layers (Gói H6): one layer system —
              the level paints the structure, decor the ornaments. */}
          <StallSceneLayers level={stallLevel} decor={stall.decorIds} />

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
              subtitle={`${'★'.repeat(stars)}${'☆'.repeat(5 - stars)} · ${s.stallStars(stars)} · ${sup.levelLabel(stallLevel)} ${sup.levelNames[stallLevel - 1] ?? ''}`}
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
            <div
              className={styles.skinFrame}
              style={{ borderColor: skin.ring }}
              title={sup.skinNames[skin.id] ?? skin.id}
            >
              <NoiNoi
                pose={isRush ? 'mc' : stall.shift ? 'chao' : 'ngu'}
                size={132}
                alt={s.noiNoiAlt}
                speech={isRush ? s.noiNoiRush : stall.shift ? s.noiNoiShift : s.noiNoiIdle}
              />
              <span className={styles.skinBadge} aria-hidden>
                {skin.badge}
              </span>
            </div>
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
          <button
            type="button"
            className={styles.staffBtn}
            aria-label={sup.staffTitle}
            onClick={() => setPanel('staff')}
          >
            👥 {sup.staffBtn}
            {stall.staff.length > 0 ? <span className={styles.pantryCount}>{stall.staff.length}</span> : null}
          </button>
          <button
            type="button"
            className={styles.supportBtn}
            aria-label={sup.supportTitle}
            onClick={() => setPanel('support')}
          >
            🧰 {sup.supportBtn}
          </button>

          {/* Customers at their tables, order bubble overhead (mục 5.3).
              Delivery customers never enter the scene (Gói H6). */}
          {sceneCustomers.map((customer) => {
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

      {/* Away status (Gói H6, mục 5.9): said out loud before it matters —
          the player should never guess whether the stall will stay open. */}
      {!stall.shift && sellable.length > 0 ? (
        <p className={styles.afkStatus} role="status">
          {essential.ok && menuRecipes.length > 0
            ? `🌙 ${sup.afkReadyNote} (${sup.afkEfficiency(afkEfficiencyPct)})`
            : `🔒 ${sup.afkClosedNote}`}
        </p>
      ) : null}
      {stall.wageDebtXu > 0 ? (
        <p className={styles.afkStatus} role="status">
          ⚠️ {sup.wagesDebtNote(stall.wageDebtXu)}
        </p>
      ) : null}

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
                          ⏳ {formatClock(patienceLeftMs(customer, now))}
                          {customer.freezeUntil && now < customer.freezeUntil ? ` · ❄️ ${sup.frozenNote}` : ''}
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

        {/* Delivery board (Gói H6, mục 8.2): a separate order stream
            from stall level 4 — cooked like any order, served only by
            the hired server, paid with a delivery fee on top. */}
        {stallLevel >= 4 ? (
          <section className={styles.board} aria-label={sup.deliveryTitle}>
            <h2 className={styles.dockTitle}>{sup.deliveryTitle}</h2>
            {!staffOf(stall, 'server') ? (
              <p className={styles.dockEmpty}>{sup.deliveryNeedServer}</p>
            ) : deliveryCustomers.filter((c) => c.state === 'waiting' || c.state === 'accepted').length === 0 ? (
              <p className={styles.dockEmpty}>{sup.deliveryEmpty}</p>
            ) : (
              <ul className={styles.orderList}>
                {deliveryCustomers
                  .filter((c) => c.state === 'waiting' || c.state === 'accepted')
                  .map((customer) => {
                    const recipe = recipeById.get(customer.recipeId);
                    if (!recipe) return null;
                    const ready = stall.batches.some(
                      (b) => b.recipeId === customer.recipeId && b.qty === customer.qty && b.level !== 'spoiled',
                    );
                    return (
                      <li key={customer.id} className={styles.orderCard}>
                        <img src={recipe.image} alt="" className={styles.orderImg} />
                        <div className={styles.orderInfo}>
                          <strong>
                            {recipe.name} <span className={styles.deliveryTag}>{sup.deliveryBadge}</span>
                          </strong>
                          <span>
                            {s.tierNames[customer.tier]} · {s.orderQty(customer.qty)}
                          </span>
                          <span className={styles.orderPatience}>
                            ⏳ {formatClock(patienceLeftMs(customer, now))}
                          </span>
                        </div>
                        {customer.state === 'waiting' ? (
                          <GoldButton
                            onClick={() => {
                              acceptOrder(user.id, customer.id);
                            }}
                          >
                            📝 {s.acceptOrder}
                          </GoldButton>
                        ) : ready ? (
                          <GoldButton onClick={() => setSelectedId(customer.id)}>
                            🛵 {sup.deliveryServe}
                          </GoldButton>
                        ) : (
                          <GoldButton
                            disabled={!canCookBatch(stall, recipe, customer.qty)}
                            onClick={() => navigate(`/cooking/${recipe.id}?sell=${customer.id}`)}
                          >
                            🍳 {s.cookOrder}
                          </GoldButton>
                        )}
                      </li>
                    );
                  })}
              </ul>
            )}
          </section>
        ) : null}

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
                const price = Math.round(
                  priceForBatch({
                    cost: batch.cost,
                    grade: dishGradeFor(recipe),
                    bestStars: bestStars.get(batch.recipeId) ?? 0,
                    level: batch.level,
                  }) * incomeFactorForLevel(stallLevel),
                );
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
                    {isReseasonable(batch.diagnosis) && stall.cards.reseason > 0 ? (
                      <GoldButton
                        onClick={() => {
                          if (useReseasonCard(user.id, batch.id)) {
                            showToast(sup.reseasonedToast(recipe.name), 'success');
                          }
                        }}
                      >
                        {sup.useReseason} ({sup.cardOwned(stall.cards.reseason)})
                      </GoldButton>
                    ) : null}
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
                  {selected.delivery ? ` · 🛵 ${sup.deliveryBadge}` : ''}
                </p>
                <p>
                  ⏳ {formatClock(patienceLeftMs(selected, now))}
                  {selected.freezeUntil && now < selected.freezeUntil ? ` · ❄️ ${sup.frozenNote}` : ''}
                </p>
                {selected.requestKind ? (
                  <p className={styles.requestLine}>
                    {REQUEST_ICONS[selected.requestKind]} {s.requestOnOrder(s.requestNames[selected.requestKind] ?? selected.requestKind)}
                  </p>
                ) : null}
                {selected.state === 'waiting' ? <p>{s.waitingCustomer}</p> : null}
              </div>
            </div>
            {selected.state === 'waiting' || selected.state === 'accepted' ? (
              <div className={styles.cardRow}>
                {stall.cards.patience > 0 ? (
                  <WoodButton
                    onClick={() => {
                      if (usePatienceCard(user.id, selected.id)) {
                        showToast(sup.cardUsedToast(sup.cardNames.patience), 'success');
                      }
                    }}
                  >
                    ⏱️ {sup.usePatience} ({stall.cards.patience})
                  </WoodButton>
                ) : null}
                {stall.cards.freeze > 0 ? (
                  <WoodButton
                    onClick={() => {
                      if (useFreezeCard(user.id, selected.id, Date.now())) {
                        showToast(sup.cardUsedToast(sup.cardNames.freeze), 'success');
                      }
                    }}
                  >
                    ❄️ {sup.useFreeze} ({stall.cards.freeze})
                  </WoodButton>
                ) : null}
                {stall.cards.swap > 0 ? (
                  <WoodButton
                    onClick={() => {
                      if (useSwapCard(user.id, selected.id, user, recipes)) {
                        showToast(sup.cardUsedToast(sup.cardNames.swap), 'success');
                        setSelectedId(null);
                      }
                    }}
                  >
                    🔀 {sup.useSwap} ({stall.cards.swap})
                  </WoodButton>
                ) : null}
              </div>
            ) : null}
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
                            {s.servePrice} {preview.price} xu · {s.serveTip} {preview.tip} xu
                            {preview.fee > 0 ? ` · ${sup.deliveryFee(preview.fee)}` : ''} ·{' '}
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

      {/* Menu board panel: licensed dishes + the on-sale curation of
          the stall level (Gói H6, mục 8.3). */}
      <Modal open={panel === 'menu'} title={s.menuTitle} onClose={() => setPanel(null)} closeLabel={s.summaryClose}>
        {sellable.length === 0 ? (
          <p>{s.menuEmpty}</p>
        ) : (
          <>
            <p className={styles.menuCapNote}>{sup.menuCapNote(menuCapForLevel(stallLevel))}</p>
            <div className={styles.menuGrid}>
              {sellable.map((recipe) => {
                const grade = dishGradeFor(recipe);
                const onSale = menuRecipes.some((menuRecipe) => menuRecipe.id === recipe.id);
                return (
                  <DishGradeFrame key={recipe.id} grade={grade} gradeLabel={dict.recipe.gradeNames[grade - 1] ?? ''}>
                    <div className={styles.menuCard}>
                      <img src={recipe.image} alt="" className={styles.menuImg} />
                      <strong>{recipe.name}</strong>
                      <span>{'★'.repeat(bestStars.get(recipe.id) ?? 0)}{'☆'.repeat(5 - (bestStars.get(recipe.id) ?? 0))}</span>
                      <span>{s.menuItemMeta(bestStars.get(recipe.id) ?? 0, Math.round(GRADE_MARGIN[grade] * 100))}</span>
                      <WoodButton
                        onClick={() => setMenuDish(user.id, recipe.id, !onSale, user, recipes)}
                      >
                        {onSale ? `✅ ${sup.menuOnSale}` : sup.menuOffSale}
                      </WoodButton>
                    </div>
                  </DishGradeFrame>
                );
              })}
            </div>
          </>
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
        {/* Market runner (Gói H6, mục 8.1): remote orders for the
            ingredients the on-sale menu actually cooks with. */}
        <div className={styles.remoteBox}>
          <strong>{sup.remoteTitle}</strong>
          {!staffOf(stall, 'runner') ? (
            <p>{sup.remoteNeedRunner}</p>
          ) : (
            <>
              <p>{sup.remoteNote}</p>
              <ul className={styles.pantryList}>
                {[...new Set(menuRecipes.flatMap((recipe) => recipe.ingredients.map((ref) => ref.ingredientId)))].map(
                  (ingredientId) => {
                    const ingredient = getIngredientById(ingredientId);
                    const unit = remoteUnitPriceFor(stall, ingredientId, recipes, todayKey());
                    const qty = remoteQty[ingredientId] ?? 1;
                    const total = unit !== null ? unit * qty : 0;
                    return (
                      <li key={ingredientId} className={styles.pantryRow}>
                        <span>
                          {ingredient?.fallbackEmoji} {ingredient?.name ?? ingredientId}
                        </span>
                        <span>{unit !== null ? sup.remoteUnit(unit) : ''}</span>
                        <span className={styles.remoteControls}>
                          <button
                            type="button"
                            aria-label="-"
                            onClick={() =>
                              setRemoteQty((prev) => ({ ...prev, [ingredientId]: Math.max(1, qty - 1) }))
                            }
                          >
                            −
                          </button>
                          <span>{qty}</span>
                          <button
                            type="button"
                            aria-label="+"
                            onClick={() =>
                              setRemoteQty((prev) => ({ ...prev, [ingredientId]: Math.min(20, qty + 1) }))
                            }
                          >
                            +
                          </button>
                          <GoldButton
                            disabled={unit === null || (user.coins ?? 0) < total}
                            onClick={() => {
                              const paidTotal = remoteBuyIngredient(user.id, ingredientId, qty, recipes);
                              if (paidTotal !== null) {
                                addCoins(-paidTotal);
                                showToast(
                                  sup.remoteToast(ingredient?.name ?? ingredientId, qty),
                                  'success',
                                );
                              }
                            }}
                          >
                            {sup.remoteBuy} · {total} xu
                          </GoldButton>
                        </span>
                      </li>
                    );
                  },
                )}
              </ul>
            </>
          )}
        </div>
      </Modal>

      {/* Staff panel (Gói H6, mục 8.1): five roles, ranks, wages, training. */}
      <Modal open={panel === 'staff'} title={sup.staffTitle} onClose={() => setPanel(null)} closeLabel={s.summaryClose}>
        {stallLevel < 2 ? (
          <p>{sup.staffLocked(2)}</p>
        ) : (
          <div className={styles.staffList}>
            <p className={styles.essentialLine}>
              {essential.cook ? '✅' : '❌'} {sup.essentialCook} · {essential.seller ? '✅' : '❌'} {sup.essentialSeller}
            </p>
            {STAFF_ROLES.map((role: StaffRole) => {
              const member = staffOf(stall, role);
              if (!member) {
                return (
                  <div key={role} className={styles.staffCard}>
                    <div className={styles.orderInfo}>
                      <strong>{sup.roleNames[role]}</strong>
                      <span>{sup.roleDescs[role]}</span>
                      <span>{sup.staffWage(wageFor(role, 0))}</span>
                    </div>
                    <GoldButton
                      onClick={() => {
                        if (hireStaff(user.id, role)) {
                          showToast(sup.hiredToast(sup.roleNames[role]), 'success');
                        }
                      }}
                    >
                      {sup.hireAction}
                    </GoldButton>
                  </div>
                );
              }
              const rank = rankForOrders(member.ordersDone);
              return (
                <div key={role} className={styles.staffCard}>
                  <div className={styles.orderInfo}>
                    <strong>
                      {sup.roleNames[role]} · {sup.rankNames[rank]}
                    </strong>
                    <span>
                      {sup.staffOrders(member.ordersDone)} · {sup.staffWage(wageFor(role, rank))}
                    </span>
                    <span>
                      {member.specialty
                        ? `${sup.trainAction}: ${sup.groupNames[member.specialty]}`
                        : sup.staffSpecialtyNone}
                    </span>
                    <span className={styles.trainRow}>
                      {(['nuoc', 'banh', 'che'] as DishGroup[]).map((group) => (
                        <WoodButton
                          key={group}
                          disabled={member.specialty === group || (user.coins ?? 0) < TRAINING_COST}
                          onClick={() => {
                            const paid = trainStaff(user.id, member.id, group);
                            if (paid !== null) {
                              addCoins(-paid);
                              showToast(sup.trainedToast(sup.groupNames[group]), 'success');
                            }
                          }}
                        >
                          {sup.groupNames[group]} · {sup.trainCost(TRAINING_COST)}
                        </WoodButton>
                      ))}
                    </span>
                  </div>
                </div>
              );
            })}
            {stall.staff.length > 0 ? (
              <p className={styles.essentialLine}>{sup.teamWageTotal(dailyWageTotal(stall.staff))}</p>
            ) : null}
          </div>
        )}
      </Modal>

      {/* Support panel (Gói H6, mục 8.3 + ý 16): stall upgrade + Nồi Nồi skins.
          Gear / cards / decor / ads live at the market's support stall. */}
      <Modal open={panel === 'support'} title={sup.supportTitle} onClose={() => setPanel(null)} closeLabel={s.summaryClose}>
        <div className={styles.supportBox}>
          <strong>{sup.upgradeTitle}</strong>
          <p>{sup.starsVsLevelNote}</p>
          <p>
            {sup.levelLabel(stallLevel)} · {sup.levelNames[stallLevel - 1] ?? ''} ·{' '}
            {sup.upgradeIncome(Math.round(levelNow.incomeBonus * 100))} ·{' '}
            {sup.upgradeTablesMenu(levelNow.tables, levelNow.menuCap)}
          </p>
          {upgradeStatus.next ? (
            <>
              <p>
                {sup.levelLabel(upgradeStatus.next.level)} ·{' '}
                {sup.levelNames[upgradeStatus.next.level - 1] ?? ''} ·{' '}
                {sup.upgradeIncome(Math.round(upgradeStatus.next.incomeBonus * 100))} ·{' '}
                {sup.upgradeTablesMenu(upgradeStatus.next.tables, upgradeStatus.next.menuCap)} ·{' '}
                {sup.upgradeCost(upgradeStatus.next.cost)}
              </p>
              {upgradeStatus.missing.length > 0 ? (
                <ul className={styles.missingList}>
                  {upgradeStatus.missing.map((missing) => (
                    <li key={missing}>
                      {missing === 'stars'
                        ? sup.upgradeNeedStars(upgradeStatus.next?.starsNeeded ?? 0)
                        : missing === 'licensed'
                          ? sup.upgradeNeedLicensed(upgradeStatus.next?.licensedNeeded ?? 0)
                          : sup.upgradeNeedTopGrade}
                    </li>
                  ))}
                </ul>
              ) : null}
              <GoldButton
                disabled={!upgradeStatus.ok || (user.coins ?? 0) < upgradeStatus.next.cost}
                onClick={() => {
                  const nextLevel = upgradeStatus.next?.level ?? 0;
                  const paid = upgradeStall(user.id, user, recipes);
                  if (paid !== null) {
                    addCoins(-paid);
                    showToast(sup.upgradeDone(nextLevel), 'success');
                  }
                }}
              >
                {sup.upgradeAction} · {sup.upgradeCost(upgradeStatus.next.cost)}
              </GoldButton>
            </>
          ) : (
            <p>{sup.upgradeMaxed}</p>
          )}
        </div>
        <div className={styles.supportBox}>
          <strong>{sup.skinTitle}</strong>
          <div className={styles.skinGrid}>
            {NOI_NOI_SKINS.map((skinItem) => {
              const available = skinAvailable(skinItem, {
                stallLevel,
                totalServed: stall.totalServed,
                ownedSkinIds: stall.ownedSkinIds,
              });
              const wearing = stall.noiNoiSkinId === skinItem.id;
              return (
                <div key={skinItem.id} className={styles.skinCard}>
                  <span className={styles.skinSwatch} style={{ borderColor: skinItem.ring }} aria-hidden>
                    {skinItem.badge}
                  </span>
                  <strong>{sup.skinNames[skinItem.id] ?? skinItem.id}</strong>
                  {wearing ? (
                    <span>{sup.skinWearing}</span>
                  ) : available ? (
                    <WoodButton
                      onClick={() => {
                        if (selectSkin(user.id, skinItem.id)) {
                          showToast(sup.skinToast(sup.skinNames[skinItem.id] ?? skinItem.id), 'success');
                        }
                      }}
                    >
                      {sup.skinWear}
                    </WoodButton>
                  ) : skinItem.unlock.kind === 'cok' ? (
                    <GoldButton
                      disabled={(user.cok ?? 0) < skinItem.unlock.price}
                      onClick={() => {
                        if (skinItem.unlock.kind !== 'cok') return;
                        const paid = buySkin(user.id, skinItem.id);
                        if (paid !== null) {
                          addCok(-paid);
                          selectSkin(user.id, skinItem.id);
                          showToast(sup.skinToast(sup.skinNames[skinItem.id] ?? skinItem.id), 'success');
                        }
                      }}
                    >
                      {sup.skinBuyCok(skinItem.unlock.price)}
                    </GoldButton>
                  ) : (
                    <span>
                      {skinItem.unlock.kind === 'level'
                        ? sup.skinLockedLevel(skinItem.unlock.level)
                        : skinItem.unlock.kind === 'served'
                          ? sup.skinLockedServed(skinItem.unlock.count)
                          : ''}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* AFK report (Gói H6, mục 5.9): the cash box and the short ledger. */}
      <Modal
        open={stall.afkReport !== null}
        title={sup.afkTitle}
        onClose={() => dismissAfkReport(user.id)}
        closeLabel={s.summaryClose}
      >
        {stall.afkReport ? (
          <div className={styles.summary}>
            <p>
              {stall.afkReport.closedReason === 'staff'
                ? sup.afkClosedStaff
                : stall.afkReport.closedReason === 'ingredients'
                  ? sup.afkClosedIngredients
                  : sup.afkClosedTime}
            </p>
            {stall.afkReport.closedReason !== 'staff' ? (
              <p>{sup.afkEfficiency(afkEfficiencyPct)}</p>
            ) : null}
            <p>💰 {sup.afkRevenue(stall.afkReport.revenueXu)}</p>
            {stall.afkReport.revenueCok > 0 ? <p>♦ {sup.afkCok(stall.afkReport.revenueCok)}</p> : null}
            <p>✅ {sup.afkServed(stall.afkReport.servedCount)}</p>
            {stall.afkReport.dishes.map((line) => (
              <p key={line.recipeId}>
                🍽️ {sup.afkDishLine(recipeById.get(line.recipeId)?.name ?? line.recipeId, line.qty)}
              </p>
            ))}
            {stall.afkReport.wasted.map((line) => (
              <p key={line.recipeId}>
                🚶 {sup.afkWastedLine(recipeById.get(line.recipeId)?.name ?? line.recipeId, line.qty)}
              </p>
            ))}
            {stall.afkReport.spoiledLots.map((line, idx) => (
              <p key={idx}>
                ⚠️ {sup.afkSpoiledLine(getIngredientById(line.ingredientId)?.name ?? line.ingredientId, line.qty)}
              </p>
            ))}
            <GoldButton onClick={() => dismissAfkReport(user.id)}>{sup.afkClose}</GoldButton>
          </div>
        ) : null}
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
