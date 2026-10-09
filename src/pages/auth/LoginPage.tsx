import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultPathForRole } from '@/features/auth/types';
import { AppError } from '@/lib/errors';
import { useTranslation } from '@/i18n/useTranslation';
import {
  hasFieldErrors,
  validateLoginForm,
  type FieldErrors,
} from '@/lib/validate';

import authStyles from '@/pages/auth/AuthLayout.module.css';

export default function LoginPage() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={getDefaultPathForRole(user.role)} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const errors = validateLoginForm(email, password);
    setFieldErrors(errors);
    if (hasFieldErrors(errors)) {
      return;
    }
    setSubmitting(true);
    try {
      const loggedIn = await login(email, password);
      navigate(getDefaultPathForRole(loggedIn.role), { replace: true });
    } catch (error) {
      if (error instanceof AppError) {
        switch (error.code) {
          case 'EMAIL_NOT_FOUND':
            setFormError(t('auth.emailNotFound'));
            break;
          case 'INVALID_PASSWORD':
            setFormError(t('auth.invalidPassword'));
            break;
          case 'ACCOUNT_BANNED':
            setFormError(t('auth.accountBanned'));
            break;
          default:
            setFormError(error.message);
        }
      } else {
        setFormError(t('auth.invalidPassword'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={authStyles.page}>
      <div className={authStyles.panel}>
        <header className={authStyles.brand}>
          <h1 className={authStyles.brandTitle}>{import.meta.env.VITE_APP_NAME}</h1>
          <p className={authStyles.brandSub}>{t('auth.loginTitle')}</p>
        </header>
        <Card title={t('auth.loginTitle')}>
          <form className={authStyles.form} onSubmit={handleSubmit} noValidate>
            {formError ? <div className={authStyles.bannerError}>{formError}</div> : null}
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="email">
                {t('auth.email')}
              </label>
              <input
                id="email"
                className={authStyles.input}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              {fieldErrors.email ? (
                <p className={authStyles.error}>{fieldErrors.email}</p>
              ) : null}
            </div>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="password">
                {t('auth.password')}
              </label>
              <input
                id="password"
                className={authStyles.input}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {fieldErrors.password ? (
                <p className={authStyles.error}>{fieldErrors.password}</p>
              ) : null}
            </div>
            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? t('common.loading') : t('auth.login')}
            </Button>
          </form>
          <p className={authStyles.footer}>
            {t('auth.noAccount')} <Link className={authStyles.link} to="/register">{t('auth.register')}</Link>
          </p>
          <p className={authStyles.hint}>
            Demo: player@hue.vn / player123 · support@hue.vn / support123 · editor@hue.vn /
            editor123 · admin@hue.vn / admin123
          </p>
        </Card>
      </div>
    </div>
  );
}
