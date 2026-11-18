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
import { buyIngredient, inventoryByIngredient, useStall } from '@/features/stall/store';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/pages/player/MarketPage.module.css';

const CATEGORY_ORDER = ['protein', 'vegetable', 'grain', 'spice', 'dau-hat', 'other'];

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
                          {s.marketOwned(owned)} · {s.marketShelfLife(shelfLifeDaysFor(ingredient.id))}
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
      </div>
    </div>
  );
}
