import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { SEED_INGREDIENTS } from '@/data/ingredients';
import type { Ingredient } from '@/data/types';
import { AudioControls, CoinPill, GoldButton, WoodSign } from '@/components/theme-d';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { useTheme } from '@/contexts/ThemeContext';
import awningImg from '@/assets/theme-d/game/r3-awning.webp';
import bannerImg from '@/assets/theme-d/game/r3-banner.webp';
import basketImg from '@/assets/theme-d/game/r3-basket.webp';
import roofRed from '@/assets/theme-d/game/r3-roof-red.webp';
import roofTarp from '@/assets/theme-d/game/r3-roof-tarp.webp';
import roofThatch from '@/assets/theme-d/game/r3-roof-thatch.webp';
import roofTile from '@/assets/theme-d/game/r3-roof-tile.webp';
import streetDark from '@/assets/theme-d/game/r3-street-dark.webp';
import streetLight from '@/assets/theme-d/game/r3-street-light.webp';
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
import { playSound } from '@/lib/sound';

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

/**
 * Đợt 3 — mỗi sạp một mặt tiền riêng theo bộ thiết kế chợ đã duyệt:
 * mái + biển hiệu chất liệu riêng theo nhóm nguyên liệu. Nhóm
 * 'dau-hat' không có mái — rổ tre (r3-basket) làm ornament góc sạp,
 * xử lý riêng trong JSX. Sạp đồ bếp / hỗ trợ (không thuộc nhóm
 * nguyên liệu) dùng mái ngói / mái hiên với biển riêng ở JSX.
 */
const STALL_ART: Record<string, { roof: string; plaque: string }> = {
  protein: { roof: roofRed, plaque: styles.signProtein },
  vegetable: { roof: roofThatch, plaque: styles.signVegetable },
  spice: { roof: roofTile, plaque: styles.signSpice },
  grain: { roof: roofTarp, plaque: styles.signGrain },
  other: { roof: awningImg, plaque: styles.signOther },
};

/**
 * Đợt 4 — thẻ MUA đồng bộ chất liệu với sạp chứa nó (Bảo chỉ đích
 * danh 22:09: thẻ kem trơn chưa đạt bộ duyệt): rau = khay tre đan,
 * thịt cá = thẻ gỗ treo, gia vị = ngói/gốm nung, gạo bột = bạt xanh
 * (biển vải của sạp cá trong ảnh duyệt), đậu hạt = bao gai, đặc sản
 * = vải sọc mái hiên. Sạp đồ bếp = gỗ + đồng thau, sạp hỗ trợ =
 * sơn mài đỏ. Không còn thân thẻ kem/trắng trơn nào.
 */
const CARD_ART: Record<string, string> = {
  protein: styles.itemProtein,
  vegetable: styles.itemVegetable,
  spice: styles.itemSpice,
  grain: styles.itemGrain,
  'dau-hat': styles.itemDauHat,
  other: styles.itemOther,
};

export default function MarketPage() {
  const { dict } = useTranslation();
  const s = dict.stall;
  const { user, addCoins } = useAuth();
  const { getApprovedRecipes } = useRecipes();
  const { theme } = useTheme();
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
    // Gói H8: a purchase gets the soft spend descent.
    playSound('buy');
  };

  // Kitchen upgrades (Gói H5): the store books the new level first and
  // reports the price, so the wallet is only charged for a level that
  // actually landed.
  const handleBuyUpgrade = (kind: UpgradeKind) => {
    const price = nextUpgradePrice(kind, stall.upgrades[kind]);
    if (price === null || coins < price) return;
    const paid = buyUpgrade(user.id, kind);
    if (paid !== null) {
      addCoins(-paid);
      playSound('buy');
    }
  };

  // Support gear / cards / decor / ads (Gói H6): same book-first
  // pattern as the kitchen upgrades — the store books the goods and
  // reports the price, the wallet is charged only for what landed.
  const handleBuyGear = (kind: GearKind) => {
    const price = GEAR_PRICES[kind];
    if (coins < price) return;
    const paid = buyGear(user.id, kind);
    if (paid !== null) {
      addCoins(-paid);
      playSound('buy');
    }
  };

  const handleBuyCard = (kind: CardKind) => {
    const price = CARD_PRICES[kind];
    if (coins < price) return;
    const paid = buyCard(user.id, kind);
    addCoins(-paid);
    playSound('buy');
  };

  const handleBuyDecor = (kind: DecorKind) => {
    const price = DECOR_PRICES[kind];
    if (coins < price) return;
    const paid = buyDecor(user.id, kind);
    if (paid !== null) {
      addCoins(-paid);
      playSound('buy');
    }
  };

  const handleBuyAd = () => {
    if (coins < AD_PRICE) return;
    const paid = buyAd(user.id, Date.now());
    addCoins(-paid);
    playSound('buy');
  };

  return (
    <div className={styles.page}>
      <img
        className={styles.sceneBg}
        src={theme === 'dark' ? streetDark : streetLight}
        alt=""
        draggable={false}
      />
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
            {/* Gói H8: audio controls on the market sign, mirroring
                the stall sign — the page keeps its single fixed
                back button untouched. */}
            <div className={styles.audioRow}>
              <AudioControls compact />
            </div>
          </WoodSign>
          <span className={styles.headerSpacer} aria-hidden />
        </header>

        <figure className={styles.bannerWrap}>
          <img className={styles.bannerImg} src={bannerImg} alt="" draggable={false} />
          <figcaption className={styles.notePlaque}>
            <p className={styles.noteText}>{s.marketPricesNote}</p>
          </figcaption>
        </figure>

        {stalls.map((stallGroup) => {
          const title = s.marketStallNames[stallGroup.key] ?? stallGroup.key;
          const art = STALL_ART[stallGroup.key] ?? STALL_ART.other;
          return (
          <section key={stallGroup.key} className={styles.stallSection} aria-label={title}>
            <div className={styles.stallFront}>
              {stallGroup.key === 'dau-hat' ? (
                <div className={styles.basketHead}>
                  <h2 className={`${styles.signPlaque} ${styles.signPlaqueStatic} ${styles.signDauHat}`}>
                    {title}
                  </h2>
                  <img className={styles.basketImg} src={basketImg} alt="" draggable={false} />
                </div>
              ) : (
                <div
                  className={`${styles.roofWrap} ${stallGroup.key === 'protein' ? styles.roofWrapProtein : ''}`}
                >
                  <img className={styles.roofImg} src={art.roof} alt="" draggable={false} />
                  <h2 className={`${styles.signPlaque} ${art.plaque}`}>{title}</h2>
                </div>
              )}
              <div className={styles.stallBody}>
              <div className={styles.grid}>
                {stallGroup.items.map((ingredient) => {
                  const price = dailyPriceFor(ingredient.id, today);
                  const change = dailyChangeFor(ingredient.id, today);
                  const qty = qtyById[ingredient.id] ?? 1;
                  const total = price * qty;
                  const owned = inventory.get(ingredient.id) ?? 0;
                  const cardArt = CARD_ART[stallGroup.key] ?? styles.itemOther;
                  return (
                    <article key={ingredient.id} className={`${styles.item} ${cardArt}`}>
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
                        <span className={styles.priceTag}>
                          <span className={styles.price}>{price} xu</span>
                        </span>
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
              </div>
            </div>
          </section>
          );
        })}

        {/* Kitchenware stall (Gói H5): one-time equipment purchases —
            the stall loop's long-term xu sink (Phần 11). */}
        <section className={styles.stallSection} aria-label={s.upgradeStallTitle}>
          <div className={styles.stallFront}>
            <div className={styles.roofWrap}>
              <img className={styles.roofImg} src={roofTile} alt="" draggable={false} />
              <h2 className={`${styles.signPlaque} ${styles.signUpgrade}`}>{s.upgradeStallTitle}</h2>
            </div>
            <div className={styles.stallBody}>
            <p className={styles.upgradeNote}>{s.upgradeStallNote}</p>
            <div className={styles.grid}>
              {(['knife', 'stove', 'pot'] as UpgradeKind[]).map((kind) => {
                const level = stall.upgrades[kind];
                const max = upgradeMaxLevel(kind);
                const price = nextUpgradePrice(kind, level);
                return (
                  <article key={kind} className={`${styles.item} ${styles.itemUpgrade}`}>
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
            </div>
          </div>
        </section>

        {/* Support stall (Gói H6): gear, rescue cards, decoration and
            advertising for the sell loop (Phần 8.2). */}
        <section className={styles.stallSection} aria-label={s.support.supportStallTitle}>
          <div className={styles.stallFront}>
            <div className={styles.roofWrap}>
              <img className={styles.roofImg} src={awningImg} alt="" draggable={false} />
              <h2 className={`${styles.signPlaque} ${styles.signSupport}`}>{s.support.supportStallTitle}</h2>
            </div>
            <div className={styles.stallBody}>
            <p className={styles.upgradeNote}>{s.support.supportStallNote}</p>
            <div className={styles.grid}>
              {GEAR_KINDS.map((kind) => {
                const price = GEAR_PRICES[kind];
                const owned =
                  kind === 'extraStove'
                    ? stall.gear.extraStoves >= MAX_EXTRA_STOVES
                    : stall.gear[kind];
                return (
                  <article key={`gear-${kind}`} className={`${styles.item} ${styles.itemSupport}`}>
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
                  <article key={`card-${kind}`} className={`${styles.item} ${styles.itemSupport}`}>
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
                  <article key={`decor-${kind}`} className={`${styles.item} ${styles.itemSupport}`}>
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

              <article className={`${styles.item} ${styles.itemSupport}`}>
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
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
