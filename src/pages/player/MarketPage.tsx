import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { SEED_INGREDIENTS } from '@/data/ingredients';
import type { Ingredient } from '@/data/types';
import { CoinPill, GoldButton, WoodSign } from '@/components/theme-d';
import { SCENES } from '@/components/theme-d/assets';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { todayKey } from '@/features/stall/lib/day';
import {
  basePriceFor,
  dailyChangeFor,
  dailyPriceFor,
  shelfLifeDaysFor,
} from '@/features/stall/lib/market';
import {
  buyAd,
  buyCard,
  buyDecor,
  buyGear,
  buyIngredient,
  buyUpgrade,
  inventoryByIngredient,
  useStall,
} from '@/features/stall/store';
import {
  AD_PRICE,
  CARD_KINDS,
  CARD_PRICES,
  DECOR_KINDS,
  DECOR_PRICES,
  GEAR_KINDS,
  GEAR_PRICES,
  MAX_EXTRA_STOVES,
  shelfLifeFactor,
  type CardKind,
  type DecorKind,
  type GearKind,
} from '@/features/stall/lib/support';
import {
  nextUpgradePrice,
  upgradeMaxLevel,
  type UpgradeKind,
} from '@/features/stall/lib/upgrades';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/pages/player/MarketPage.module.css';

const CATEGORY_ORDER = ['protein', 'vegetable', 'grain', 'spice', 'dau-hat', 'other'];

const GEAR_EMOJI: Record<GearKind, string> = {
  fridge: '🧊',
  freezer: '❄️',
  slicer: '🔪',
  mixer: '🥣',
  extraStove: '🔥',
};

const CARD_EMOJI: Record<CardKind, string> = {
  patience: '⏳',
  swap: '🔀',
  freeze: '🥶',
  reseason: '🧂',
};

const DECOR_EMOJI: Record<DecorKind, string> = {
  lanterns: '🏮',
  flowers: '🌼',
  goldSign: '🪧',
  plant: '🪴',
};

export default function MarketPage() {
  const { dict } = useTranslation();
  const s = dict.stall;
  const { user, addCoins } = useAuth();
  const { getApprovedRecipes } = useRecipes();
  const stall = useStall(user?.id ?? null);
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const today = todayKey();

  // The market sells the seed catalogue plus any ingredient an approved
  // (possibly editor-made) recipe references.
  const catalogue = useMemo(() => {
    const byId = new Map<string, Ingredient>();
    for (const ingredient of SEED_INGREDIENTS) byId.set(ingredient.id, ingredient);
    for (const recipe of getApprovedRecipes()) {
      for (const ref of recipe.ingredients) {
        if (!byId.has(ref.ingredientId)) {
          byId.set(ref.ingredientId, {
            id: ref.ingredientId,
            name: ref.ingredientId,
            category: 'other',
            fallbackEmoji: '🧺',
          });
        }
      }
    }
    return [...byId.values()];
  }, [getApprovedRecipes]);

  const stalls = useMemo(() => {
    const groups = new Map<string, Ingredient[]>();
    for (const ingredient of catalogue) {
      const key = CATEGORY_ORDER.includes(ingredient.category) ? ingredient.category : 'other';
      const list = groups.get(key) ?? [];
      list.push(ingredient);
      groups.set(key, list);
    }
    return CATEGORY_ORDER.filter((key) => groups.has(key)).map((key) => ({
      key,
      items: groups.get(key) ?? [],
    }));
  }, [catalogue]);

  const inventory = useMemo(
    () => (stall ? inventoryByIngredient(stall) : new Map<string, number>()),
    [stall],
  );

  if (!user || !stall) return null;
  const coins = user.coins ?? 0;

  const handleBuy = (ingredient: Ingredient) => {
    const qty = qtyById[ingredient.id] ?? 1;
    const price = dailyPriceFor(ingredient.id, today);
    const total = price * qty;
    if (coins < total) return;
    addCoins(-total);
    buyIngredient(user.id, ingredient.id, qty, price);
  };

  // Kitchen upgrades (Gói H5): the store books the new level first and
  // reports the price, so the wallet is only charged for a level that
  // actually landed.
  const handleBuyUpgrade = (kind: UpgradeKind) => {
    const price = nextUpgradePrice(kind, stall.upgrades[kind]);
    if (price === null || coins < price) return;
    const paid = buyUpgrade(user.id, kind);
    if (paid !== null) addCoins(-paid);
  };

  // Support gear / cards / decor / ads (Gói H6): same book-first
  // pattern as the kitchen upgrades — the store books the goods and
  // reports the price, the wallet is charged only for what landed.
  const handleBuyGear = (kind: GearKind) => {
    const price = GEAR_PRICES[kind];
    if (coins < price) return;
    const paid = buyGear(user.id, kind);
    if (paid !== null) addCoins(-paid);
  };

  const handleBuyCard = (kind: CardKind) => {
    const price = CARD_PRICES[kind];
    if (coins < price) return;
    const paid = buyCard(user.id, kind);
    addCoins(-paid);
  };

  const handleBuyDecor = (kind: DecorKind) => {
    const price = DECOR_PRICES[kind];
    if (coins < price) return;
    const paid = buyDecor(user.id, kind);
    if (paid !== null) addCoins(-paid);
  };

  const handleBuyAd = () => {
    if (coins < AD_PRICE) return;
    const paid = buyAd(user.id, Date.now());
    addCoins(-paid);
  };

  return (
    <div className={styles.page}>
      <img className={styles.sceneBg} src={SCENES.cho} alt="" draggable={false} />
      <div className={styles.shade} aria-hidden />

      <div className={styles.content}>
        <header className={styles.header}>
          <Link className={styles.backBtn} to="/stall" aria-label={s.backToStall}>
            ←
          </Link>
          <WoodSign title={s.marketTitle} subtitle={s.marketToday(today)}>
            <div className={styles.walletRow}>
              <span>{s.marketWallet}</span>
              <CoinPill amount={coins} currency="xu" />
              <CoinPill amount={user.cok ?? 0} currency="cok" />
            </div>
          </WoodSign>
          <span className={styles.headerSpacer} aria-hidden />
        </header>

        <p className={styles.note}>{s.marketPricesNote}</p>

        {stalls.map((stallGroup) => (
          <section key={stallGroup.key} className={styles.stallPanel} aria-label={s.marketStallNames[stallGroup.key]}>
            <h2 className={styles.stallName}>
              {stallGroup.key === 'protein'
                ? '🥩'
                : stallGroup.key === 'vegetable'
                  ? '🥬'
                  : stallGroup.key === 'spice'
                    ? '🌶️'
                    : stallGroup.key === 'grain'
                      ? '🍚'
                      : stallGroup.key === 'dau-hat'
                        ? '🫘'
                        : '🎁'}{' '}
              {s.marketStallNames[stallGroup.key] ?? stallGroup.key}
            </h2>
            <div className={styles.grid}>
              {stallGroup.items.map((ingredient) => {
                const price = dailyPriceFor(ingredient.id, today);
                const change = dailyChangeFor(ingredient.id, today);
                const qty = qtyById[ingredient.id] ?? 1;
                const total = price * qty;
                const owned = inventory.get(ingredient.id) ?? 0;
                return (
                  <article key={ingredient.id} className={styles.item}>
                    <div className={styles.itemHead}>
                      <span className={styles.itemEmoji} aria-hidden>
                        {ingredient.fallbackEmoji}
                      </span>
                      <div className={styles.itemNames}>
                        <strong>{ingredient.name}</strong>
                        <span className={styles.itemOwned}>
                          {s.marketOwned(owned)} ·{' '}
                          {s.marketShelfLife(shelfLifeDaysFor(ingredient.id, shelfLifeFactor(stall.gear)))}
                        </span>
                      </div>
                    </div>
                    <div className={styles.priceRow}>
                      <span className={styles.price}>{price} xu</span>
                      <span
                        className={
                          change > 0.005 ? styles.trendUp : change < -0.005 ? styles.trendDown : styles.trendFlat
                        }
                        aria-label={`${Math.round(change * 100)}%`}
                      >
                        {change > 0.005 ? '▲' : change < -0.005 ? '▼' : '•'} {Math.abs(Math.round(change * 100))}%
                        <span className={styles.baseHint}> / {basePriceFor(ingredient.id)} xu</span>
                      </span>
                    </div>
                    <div className={styles.buyRow}>
                      <div className={styles.stepper}>
                        <button
                          type="button"
                          aria-label="-"
                          onClick={() =>
                            setQtyById((prev) => ({ ...prev, [ingredient.id]: Math.max(1, qty - 1) }))
                          }
                        >
                          −
                        </button>
                        <span>{qty}</span>
                        <button
                          type="button"
                          aria-label="+"
                          onClick={() =>
                            setQtyById((prev) => ({ ...prev, [ingredient.id]: Math.min(20, qty + 1) }))
                          }
                        >
                          +
                        </button>
                      </div>
                      <GoldButton disabled={coins < total} onClick={() => handleBuy(ingredient)}>
                        {coins < total ? s.marketNotEnoughXu : `${s.marketBuy} · ${total} xu`}
                      </GoldButton>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        {/* Kitchenware stall (Gói H5): one-time equipment purchases —
            the stall loop's long-term xu sink (Phần 11). */}
        <section className={styles.stallPanel} aria-label={s.upgradeStallTitle}>
          <h2 className={styles.stallName}>🔪 {s.upgradeStallTitle}</h2>
          <p className={styles.upgradeNote}>{s.upgradeStallNote}</p>
          <div className={styles.grid}>
            {(['knife', 'stove', 'pot'] as UpgradeKind[]).map((kind) => {
              const level = stall.upgrades[kind];
              const max = upgradeMaxLevel(kind);
              const price = nextUpgradePrice(kind, level);
              return (
                <article key={kind} className={styles.item}>
                  <div className={styles.itemHead}>
                    <span className={styles.itemEmoji} aria-hidden>
                      {kind === 'knife' ? '🔪' : kind === 'stove' ? '🔥' : '🍲'}
                    </span>
                    <div className={styles.itemNames}>
                      <strong>{s.upgradeNames[kind]}</strong>
                      <span className={styles.itemOwned}>{s.upgradeLevel(level, max)}</span>
                    </div>
                  </div>
                  <span className={styles.levelPips} aria-hidden>
                    {Array.from({ length: max }, (_, i) => (
                      <span key={i} className={i < level ? styles.pipOn : styles.pipOff} />
                    ))}
                  </span>
                  <p className={styles.upgradeDesc}>{s.upgradeDescs[kind]}</p>
                  <div className={styles.buyRow}>
                    {price === null ? (
                      <span className={styles.maxedNote}>✓ {s.upgradeMaxed}</span>
                    ) : (
                      <GoldButton disabled={coins < price} onClick={() => handleBuyUpgrade(kind)}>
                        {coins < price ? s.marketNotEnoughXu : `${s.upgradeBuy} · ${s.upgradePrice(price)}`}
                      </GoldButton>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Support stall (Gói H6): gear, rescue cards, decoration and
            advertising for the sell loop (Phần 8.2). */}
        <section className={styles.stallPanel} aria-label={s.support.supportStallTitle}>
          <h2 className={styles.stallName}>🧰 {s.support.supportStallTitle}</h2>
          <p className={styles.upgradeNote}>{s.support.supportStallNote}</p>
          <div className={styles.grid}>
            {GEAR_KINDS.map((kind) => {
              const price = GEAR_PRICES[kind];
              const owned =
                kind === 'extraStove'
                  ? stall.gear.extraStoves >= MAX_EXTRA_STOVES
                  : stall.gear[kind];
              return (
                <article key={`gear-${kind}`} className={styles.item}>
                  <div className={styles.itemHead}>
                    <span className={styles.itemEmoji} aria-hidden>
                      {GEAR_EMOJI[kind]}
                    </span>
                    <div className={styles.itemNames}>
                      <strong>{s.support.gearNames[kind]}</strong>
                      {kind === 'extraStove' ? (
                        <span className={styles.itemOwned}>
                          {stall.gear.extraStoves}/{MAX_EXTRA_STOVES}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className={styles.upgradeDesc}>{s.support.gearDescs[kind]}</p>
                  <div className={styles.buyRow}>
                    {owned ? (
                      <span className={styles.maxedNote}>✓ {s.support.gearOwned}</span>
                    ) : (
                      <GoldButton disabled={coins < price} onClick={() => handleBuyGear(kind)}>
                        {coins < price ? s.marketNotEnoughXu : `${s.support.gearBuy} · ${price} xu`}
                      </GoldButton>
                    )}
                  </div>
                </article>
              );
            })}

            {CARD_KINDS.map((kind) => {
              const price = CARD_PRICES[kind];
              return (
                <article key={`card-${kind}`} className={styles.item}>
                  <div className={styles.itemHead}>
                    <span className={styles.itemEmoji} aria-hidden>
                      {CARD_EMOJI[kind]}
                    </span>
                    <div className={styles.itemNames}>
                      <strong>{s.support.cardNames[kind]}</strong>
                      <span className={styles.itemOwned}>{s.support.cardOwned(stall.cards[kind])}</span>
                    </div>
                  </div>
                  <p className={styles.upgradeDesc}>{s.support.cardDescs[kind]}</p>
                  <div className={styles.buyRow}>
                    <GoldButton disabled={coins < price} onClick={() => handleBuyCard(kind)}>
                      {coins < price ? s.marketNotEnoughXu : `${s.support.cardBuy} · ${price} xu`}
                    </GoldButton>
                  </div>
                </article>
              );
            })}

            {DECOR_KINDS.map((kind) => {
              const price = DECOR_PRICES[kind];
              const owned = stall.decorIds.includes(kind);
              return (
                <article key={`decor-${kind}`} className={styles.item}>
                  <div className={styles.itemHead}>
                    <span className={styles.itemEmoji} aria-hidden>
                      {DECOR_EMOJI[kind]}
                    </span>
                    <div className={styles.itemNames}>
                      <strong>{s.support.decorNames[kind]}</strong>
                    </div>
                  </div>
                  <p className={styles.upgradeDesc}>{s.support.decorDescs[kind]}</p>
                  <div className={styles.buyRow}>
                    {owned ? (
                      <span className={styles.maxedNote}>✓ {s.support.decorOwned}</span>
                    ) : (
                      <GoldButton disabled={coins < price} onClick={() => handleBuyDecor(kind)}>
                        {coins < price ? s.marketNotEnoughXu : `${s.support.decorBuy} · ${price} xu`}
                      </GoldButton>
                    )}
                  </div>
                </article>
              );
            })}

            <article className={styles.item}>
              <div className={styles.itemHead}>
                <div className={styles.itemNames}>
                  <strong>{s.support.adTitle}</strong>
                </div>
              </div>
              <p className={styles.upgradeDesc}>{s.support.adDesc}</p>
              {stall.adUntil > Date.now() ? (
                <p className={styles.adActiveNote}>{s.support.adActiveNote}</p>
              ) : null}
              <div className={styles.buyRow}>
                <GoldButton disabled={coins < AD_PRICE} onClick={handleBuyAd}>
                  {coins < AD_PRICE ? s.marketNotEnoughXu : s.support.adBuy}
                </GoldButton>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
