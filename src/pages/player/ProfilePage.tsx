import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AchievementIcon } from '@/components/AchievementIcon';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { useAchievements } from '@/contexts/AchievementContext';
import { findUserById, loadUsers } from '@/features/auth/store';
import { getJsonStorage, STORAGE_KEYS } from '@/lib/storage';
import { countOwnedRecipes } from '@/features/recipes/lib/ownership';
import { useTranslation } from '@/i18n/useTranslation';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { id } = useParams<{ id?: string }>();
  const { t, dict } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser, updateProfile } = useAuth();
  const { getApprovedRecipes } = useRecipes();
  const { allAchievements } = useAchievements();

  const isOwnProfile = !id || id === currentUser?.id;

  const targetUser = isOwnProfile
    ? currentUser
    : findUserById(loadUsers(), id || '');

  // Form state for own profile editing
  const [name, setName] = useState(targetUser?.name ?? '');
  const [avatar, setAvatar] = useState(targetUser?.avatar ?? '');
  const [equippedBadgeId, setEquippedBadgeId] = useState<string | null>(
    targetUser?.equippedAchievementId ?? null,
  );
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [avatarError, setAvatarError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!targetUser) {
    return (
      <PlayerShell>
        <EmptyState
          title="Không tìm thấy người dùng"
          description="Tài khoản này không tồn tại hoặc đã bị xóa."
        />
      </PlayerShell>
    );
  }

  const cookedRecipes = targetUser.cookedRecipes ?? [];
  const totalScore = cookedRecipes.reduce((sum, r) => sum + (r.score ?? 0), 0);
  const cookedCount = cookedRecipes.length;
  const unlockedBadges = targetUser.unlockedAchievements ?? [];

  const expValue = targetUser.exp ?? 0;
  const maxExpValue = targetUser.maxExp ?? 1000;
  const xpPercent =
    maxExpValue > 0 ? Math.min(100, Math.round((expValue / maxExpValue) * 100)) : 0;
  const equippedAchievement = allAchievements.find(
    (b) => b.id === (equippedBadgeId ?? targetUser.equippedAchievementId ?? ''),
  );
  const joinedDate = targetUser.createdAt ? new Date(targetUser.createdAt) : null;
  const joinedLabel =
    joinedDate && !Number.isNaN(joinedDate.getTime())
      ? t('profile.joinedLabel', {
          date: `${joinedDate.getMonth() + 1}/${joinedDate.getFullYear()}`,
        })
      : '';

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAvatarError('');
    setSuccessMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError(t('profile.invalidImageType'));
      return;
    }

    const uploadSettings = getJsonStorage<{ maxUploadMB?: number }>(STORAGE_KEYS.adminSettings);
    const maxMB =
      typeof uploadSettings?.maxUploadMB === 'number' && uploadSettings.maxUploadMB > 0
        ? uploadSettings.maxUploadMB
        : 5;
    if (file.size > maxMB * 1024 * 1024) {
      setAvatarError(dict.profile.maxAvatarSize(maxMB));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawData = event.target?.result;
      if (typeof rawData !== 'string') return;

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setAvatar(compressed);
          } else {
            setAvatar(rawData);
          }
        } catch {
          setAvatar(rawData);
        }
      };
      img.onerror = () => {
        setAvatar(rawData);
      };
      img.src = rawData;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setAvatarError('');
    setPasswordError('');
    setNameError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setNameError(t('errors.required'));
      return;
    }

    let finalPassword: string | undefined = undefined;

    if (oldPassword || newPassword || confirmPassword) {
      // Find stored user to verify old password
      const storedUsers = loadUsers();
      const currentStored = findUserById(storedUsers, targetUser.id);
      if (currentStored && currentStored.password !== oldPassword) {
        setPasswordError(t('profile.invalidOldPassword'));
        return;
      }

      if (!newPassword || newPassword !== confirmPassword) {
        setPasswordError(t('profile.passwordMismatch'));
        return;
      }

      finalPassword = newPassword;
    }

    const patch: Parameters<typeof updateProfile>[0] = {
      name: name.trim(),
      avatar,
      equippedAchievementId: equippedBadgeId,
    };

    if (finalPassword) {
      patch.password = finalPassword;
    }

    try {
      const updated = updateProfile(patch);
      if (updated) {
        setSuccessMsg(t('profile.saveSuccess'));
        setTimeout(() => {
          navigate('/home');
        }, 800);
      }
    } catch {
      setAvatarError('Lỗi khi lưu thông tin. Kích thước dữ liệu ảnh có thể quá lớn.');
    }
  };

  return (
    <PlayerShell>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {isOwnProfile ? t('profile.title') : t('profile.viewTitle')}
        </h1>
        <p className={styles.subtitle}>{t('profile.subtitle')}</p>
      </header>

      <div className={styles.grid}>
        {/* Profile Card Summary */}
        <div className={styles.profileCard}>
          <div className={styles.cover} aria-hidden>
            <img src="/images/noi-noi-2d.webp" alt="" className={styles.coverPot} />
          </div>
          <div className={styles.avatarContainer}>
            {avatar || targetUser.avatar ? (
              <img
                src={avatar || targetUser.avatar}
                alt={targetUser.name}
                className={styles.avatarImage}
              />
            ) : (
              <div className={styles.avatarFallback}>
                {targetUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            {equippedBadgeId || targetUser.equippedAchievementId ? (
              <div className={styles.equippedOverlay}>
                <AchievementIcon
                  badgeId={
                    (equippedBadgeId !== undefined
                      ? equippedBadgeId
                      : targetUser.equippedAchievementId) || ''
                  }
                  size="sm"
                />
              </div>
            ) : null}
          </div>

          <div className={styles.nameRow}>
            <h2 className={styles.userName}>{isOwnProfile ? name || targetUser.name : targetUser.name}</h2>
            <span className={styles.lvChip}>
              ⭐ Lv.{targetUser.level ?? 1}
              {equippedAchievement ? ` · ${equippedAchievement.name}` : ''}
            </span>
          </div>
          <p className={styles.userEmail}>
            {targetUser.email}
            {joinedLabel ? ` · ${joinedLabel}` : ''}
          </p>

          <div className={styles.xpBlock}>
            <div className={styles.xpTrack}>
              <div className={styles.xpFill} style={{ width: `${xpPercent}%` }} />
            </div>
            <p className={styles.xpText}>
              {t('profile.expLine', {
                exp: expValue,
                maxExp: maxExpValue,
                remaining: Math.max(0, maxExpValue - expValue),
                next: (targetUser.level ?? 1) + 1,
              })}
            </p>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <span className={styles.statVal}>Level {targetUser.level ?? 1}</span>
              <span className={styles.statLbl}>{t('home.level')}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statVal}>{cookedCount}</span>
              <span className={styles.statLbl}>Món đã nấu</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statVal}>{totalScore}</span>
              <span className={styles.statLbl}>Tổng điểm</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statVal}>🪙 {(targetUser.coins ?? 0).toLocaleString()}</span>
              <span className={styles.statLbl}>{t('profile.coinsLabel')}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statVal}>
                {countOwnedRecipes(targetUser, getApprovedRecipes())}/
                {getApprovedRecipes().length}
              </span>
              <span className={styles.statLbl}>{t('profile.ownedLabel')}</span>
            </div>
            <div className={styles.statBox}>
              <span className={`${styles.statVal} ${styles.statPerk}`}>
                {equippedAchievement?.perk
                  ? `⚡ ${dict.perks.describe[equippedAchievement.perk.kind](equippedAchievement.perk.value)}`
                  : '—'}
              </span>
              <span className={styles.statLbl}>{dict.perks.activeLabel}</span>
            </div>
          </div>

          <div style={{ width: '100%', textAlign: 'left', marginTop: '0.5rem' }}>
            <span className={styles.label}>
              {t('profile.unlockedCount', {
                unlocked: unlockedBadges.length,
                total: allAchievements.length,
              })}
            </span>
            <div className={styles.badgeTiles}>
              {allAchievements.map((b) => {
                const isUnlocked = unlockedBadges.includes(b.id);
                const isEquipped =
                  (equippedBadgeId ?? targetUser.equippedAchievementId) === b.id;
                return (
                  <div
                    key={b.id}
                    className={[
                      styles.badgeTile,
                      isEquipped ? styles.badgeTileEquipped : '',
                      !isUnlocked ? styles.badgeTileLocked : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <AchievementIcon
                      badgeId={b.id}
                      category={b.category}
                      size="sm"
                      locked={!isUnlocked}
                    />
                    <span className={styles.badgeTileName}>
                      {isEquipped ? `${t('profile.wearingLabel')}: ` : ''}
                      {b.name}
                      {!isUnlocked ? ` (${t('profile.lockedShort')})` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Profile Form (Only for Own Profile) */}
        {isOwnProfile ? (
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>{t('profile.editTitle')}</h2>
            <form onSubmit={handleSave}>
              <div className={styles.fieldGroup}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="profile-name">
                    {t('profile.displayName')}
                  </label>
                  <input
                    id="profile-name"
                    className={styles.input}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {nameError ? <p className={styles.errorText}>{nameError}</p> : null}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>{t('profile.avatar')}</label>
                  <div className={styles.avatarBtns}>
                    <label htmlFor="avatar-file" className={styles.fileUploadBtn}>
                      📷 {t('profile.uploadAvatar')}
                    </label>
                    <button
                      type="button"
                      className={styles.fileUploadBtn}
                      onClick={() => {
                        setAvatar('/images/noi-noi-2d.webp');
                        setAvatarError('');
                      }}
                    >
                      🍲 {t('profile.useNoiNoi')}
                    </button>
                  </div>
                  <input
                    id="avatar-file"
                    type="file"
                    accept="image/*"
                    className={styles.fileInput}
                    onChange={handleAvatarChange}
                  />
                  {avatarError ? <p className={styles.errorText}>{avatarError}</p> : null}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="equipped-badge">
                    {t('profile.equippedBadge')}
                  </label>
                  <select
                    id="equipped-badge"
                    className={styles.select}
                    value={equippedBadgeId ?? ''}
                    onChange={(e) =>
                      setEquippedBadgeId(e.target.value ? e.target.value : null)
                    }
                  >
                    <option value="">-- {t('profile.noBadge')} --</option>
                    {allAchievements.map((b) => {
                      const isUnlocked = unlockedBadges.includes(b.id);
                      return (
                        <option key={b.id} value={b.id} disabled={!isUnlocked}>
                          {b.name} {!isUnlocked ? `(${t('profile.locked')})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <hr className={styles.sectionDivider} />

                <h3 className={styles.label} style={{ fontSize: '1rem' }}>
                  🔒 {t('profile.changePassword')}
                </h3>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="old-password">
                    {t('profile.oldPassword')}
                  </label>
                  <input
                    id="old-password"
                    type="password"
                    className={styles.input}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="new-password">
                    {t('profile.newPassword')}
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    className={styles.input}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="confirm-password">
                    {t('profile.confirmNewPassword')}
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    className={styles.input}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {passwordError ? <p className={styles.errorText}>{passwordError}</p> : null}
                </div>
              </div>

              {successMsg ? <p className={styles.successText}>{successMsg}</p> : null}

              <div className={styles.actions}>
                <Button type="submit" variant="primary" className={styles.saveButton}>
                  💾 {t('common.save')}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>Hồ sơ thi đấu</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Đây là trang cá nhân công khai của <strong>{targetUser.name}</strong>.
            </p>
          </div>
        )}
      </div>
    </PlayerShell>
  );
}
