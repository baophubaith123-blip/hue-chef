import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultPathForRole } from '@/features/auth/types';
import { AppError } from '@/lib/errors';
import {
  hasFieldErrors,
  validateRegisterForm,
  type FieldErrors,
} from '@/lib/validate';

import authStyles from '@/pages/auth/AuthLayout.module.css';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={getDefaultPathForRole(user.role)} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const errors = validateRegisterForm(name, email, password, confirmPassword);
    setFieldErrors(errors);
    if (hasFieldErrors(errors)) {
      return;
    }
    setSubmitting(true);
    try {
      const created = await register(name, email, password);
      navigate(getDefaultPathForRole(created.role), { replace: true });
    } catch (error) {
      if (error instanceof AppError) {
        setFormError(error.message);
      } else {
        setFormError('Registration failed. Please try again.');
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
          <p className={authStyles.brandSub}>Create a player account</p>
        </header>
        <Card title="Register">
          <form className={authStyles.form} onSubmit={handleSubmit} noValidate>
            {formError ? <div className={authStyles.bannerError}>{formError}</div> : null}
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="name">
                Display name
              </label>
              <input
                id="name"
                className={authStyles.input}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              {fieldErrors.name ? <p className={authStyles.error}>{fieldErrors.name}</p> : null}
            </div>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="reg-email">
                Email
              </label>
              <input
                id="reg-email"
                className={authStyles.input}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              {fieldErrors.email ? <p className={authStyles.error}>{fieldErrors.email}</p> : null}
            </div>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="reg-password">
                Password
              </label>
              <input
                id="reg-password"
                className={authStyles.input}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {fieldErrors.password ? (
                <p className={authStyles.error}>{fieldErrors.password}</p>
              ) : null}
            </div>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="confirm-password">
                Confirm password
              </label>
              <input
                id="confirm-password"
                className={authStyles.input}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              {fieldErrors.confirmPassword ? (
                <p className={authStyles.error}>{fieldErrors.confirmPassword}</p>
              ) : null}
            </div>
            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
          <p className={authStyles.footer}>
            Already have an account?{' '}
            <Link className={authStyles.link} to="/login">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
