import { useState, type FormEvent, type ReactNode } from 'react';

import { GoldButton } from '@/components/theme-d/GoldButton';
import { KraftCard } from '@/components/theme-d/KraftCard';
import { WoodButton } from '@/components/theme-d/WoodButton';
import type { OnlineSession } from '@/features/online/components/useOnlineSession';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/online/components/OnlineGate.module.css';

interface OnlineGateProps {
  session: OnlineSession;
  children: ReactNode;
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

/** "HH:MM dd/mm/yyyy" for sync stamps. */
function formatStamp(timestamp: number): string {
  const d = new Date(timestamp);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/**
 * Shared shell of every online page (Gói H9, lát B): explains the
 * unconfigured state, hosts the sign-in / sign-up form while signed
 * out, and — once linked — shows the sync status bar above the page
 * content. Children render only in the linked state.
 */
export function OnlineGate({ session, children }: OnlineGateProps) {
  const { dict } = useTranslation();
  const o = dict.online;

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [signUpDone, setSignUpDone] = useState(false);

  if (!session.configured) {
    return (
      <KraftCard as="section" className={styles.noticeCard}>
        <h2 className={styles.noticeTitle}>{o.unconfiguredTitle}</h2>
        <p className={styles.noticeBody}>{o.unconfiguredBody}</p>
      </KraftCard>
    );
  }

  const { link } = session;

  if (!link) {
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setAuthError(false);
      setSignUpDone(false);
      if (mode === 'signIn') {
        const ok = await session.signIn(email.trim(), password);
        if (!ok) setAuthError(true);
      } else {
        const result = await session.signUp(displayName.trim(), email.trim(), password);
        if (!result.ok) {
          setAuthError(true);
        } else if (result.needsConfirmation) {
          setSignUpDone(true);
        }
      }
    };

    return (
      <KraftCard as="section" className={styles.authCard}>
        <h2 className={styles.noticeTitle}>{o.signedOutTitle}</h2>
        <p className={styles.noticeBody}>{o.signedOutBody}</p>

        <h3 className={styles.formTitle}>{mode === 'signIn' ? o.signInTitle : o.signUpTitle}</h3>

        {signUpDone ? (
          <p className={styles.doneNote} role="status">
            {o.signUpDone}
          </p>
        ) : null}
        {authError ? (
          <p className={styles.errorNote} role="alert">
            {o.authFailed}
          </p>
        ) : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'signUp' ? (
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{o.displayNameLabel}</span>
              <input
                className={styles.input}
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="nickname"
                required
              />
            </label>
          ) : null}
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{o.emailLabel}</span>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{o.passwordLabel}</span>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              required
            />
          </label>

          <div className={styles.formActions}>
            <GoldButton type="submit" loading={session.busy}>
              {mode === 'signIn' ? o.signInBtn : o.signUpBtn}
            </GoldButton>
            <WoodButton
              onClick={() => {
                setMode(mode === 'signIn' ? 'signUp' : 'signIn');
                setAuthError(false);
                setSignUpDone(false);
              }}
            >
              {mode === 'signIn' ? o.toSignUp : o.toSignIn}
            </WoodButton>
          </div>
        </form>
      </KraftCard>
    );
  }

  const lastSyncAt =
    session.syncResult?.status === 'synced' ? session.syncResult.at : link.lastSyncAt;
  const syncText = session.busy
    ? o.syncing
    : session.syncResult?.status === 'error'
      ? o.syncError
      : lastSyncAt
        ? o.syncDone(formatStamp(lastSyncAt))
        : o.syncIdle;

  return (
    <div className={styles.wrap}>
      <KraftCard className={styles.statusBar}>
        <div className={styles.statusText}>
          <p className={styles.signedInAs}>{o.signedInAs(link.email)}</p>
          <p className={styles.syncText}>{syncText}</p>
        </div>
        <div className={styles.statusActions}>
          <GoldButton onClick={() => void session.runSync()} loading={session.busy}>
            {session.busy ? o.syncing : o.syncNow}
          </GoldButton>
          <WoodButton onClick={() => void session.signOut()} disabled={session.busy}>
            {o.signOut}
          </WoodButton>
        </div>
      </KraftCard>
      {children}
    </div>
  );
}
