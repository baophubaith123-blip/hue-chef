import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultPathForRole } from '@/features/auth/types';
import { AppError } from '@/lib/errors';
import {
  hasFieldErrors,
  validateLoginForm,
  type FieldErrors,
} from '@/lib/validate';

import authStyles from '@/pages/auth/AuthLayout.module.css';

function mapAuthError(error: AppError): string {
  switch (error.code) {
    case 'EMAIL_NOT_FOUND':
      return 'Email không tồn tại';
    case 'INVALID_PASSWORD':
      return 'Mật khẩu không đúng';
    case 'ACCOUNT_BANNED':
      return 'Tài khoản đã bị khóa';
    default:
      return error.message;
  }
}

export default function LoginPage() {
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
        setFormError(mapAuthError(error));
      } else {
        setFormError('Login failed. Please try again.');
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
          <p className={authStyles.brandSub}>Sign in to continue cooking</p>
        </header>
        <Card title="Login">
          <form className={authStyles.form} onSubmit={handleSubmit} noValidate>
            {formError ? <div className={authStyles.bannerError}>{formError}</div> : null}
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="email">
                Email
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
                Password
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
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className={authStyles.footer}>
            New player? <Link className={authStyles.link} to="/register">Create account</Link>
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
