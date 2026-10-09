import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AchievementIcon } from '@/components/AchievementIcon';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { SEED_ACHIEVEMENTS } from '@/data/achievements';
import { findUserById, loadUsers } from '@/features/auth/store';
import { useTranslation } from '@/i18n/useTranslation';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { id } = useParams<{ id?: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser, updateProfile } = useAuth();

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

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAvatarError('');
    setSuccessMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError(t('profile.invalidImageType'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError(t('profile.maxAvatarSize'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setAvatar(event.target.result);
      }
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

    const patch: any = {
      name: name.trim(),
      avatar,
      equippedAchievementId: equippedBadgeId,
    };

    if (finalPassword) {
      patch.password = finalPassword;
    }

    const updated = updateProfile(patch);
    if (updated) {
      setSuccessMsg(t('profile.saveSuccess'));
      setTimeout(() => {
        navigate('/');
      }, 400);
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
                  size="xs"
                />
              </div>
            ) : null}
          </div>

          <h2 className={styles.userName}>{isOwnProfile ? name || targetUser.name : targetUser.name}</h2>
          <p className={styles.userEmail}>{targetUser.email}</p>

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
          </div>

          <div style={{ width: '100%', textAlign: 'left', marginTop: '0.5rem' }}>
            <span className={styles.label}>Thành tích đã mở khoá ({unlockedBadges.length}/12)</span>
            <div className={styles.badgeShowcase}>
              {SEED_ACHIEVEMENTS.map((b) => {
                const isUnlocked = unlockedBadges.includes(b.id);
                return (
                  <AchievementIcon
                    key={b.id}
                    badgeId={b.id}
                    category={b.category}
                    size="sm"
                    locked={!isUnlocked}
                  />
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
                  <label htmlFor="avatar-file" className={styles.fileUploadBtn}>
                    📷 {t('profile.uploadAvatar')}
                  </label>
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
                    {SEED_ACHIEVEMENTS.map((b) => {
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
                <Button type="submit" variant="primary">
                  {t('common.save')}
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
