import {
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';

import styles from '@/components/Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
}

interface RippleEffect {
  x: number;
  y: number;
  size: number;
  id: number;
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  type = 'button',
  onClick,
  ...rest
}: ButtonProps) {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (rest.disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple: RippleEffect = {
      x,
      y,
      size,
      id: Date.now() + Math.random(),
    };

    setRipples((prev) => [...prev, newRipple]);

    if (onClick) {
      onClick(e);
    }
  };

  const handleAnimationEnd = (id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  };

  const classes = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} onClick={handleClick} {...rest}>
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className={styles.ripple}
          style={{
            top: ripple.y,
            left: ripple.x,
            width: ripple.size,
            height: ripple.size,
          }}
          onAnimationEnd={() => handleAnimationEnd(ripple.id)}
        />
      ))}
    </button>
  );
}
