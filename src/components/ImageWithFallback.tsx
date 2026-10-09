import { useState } from 'react';
import styles from './ImageWithFallback.module.css';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  loading?: 'lazy' | 'eager';
}

export function ImageWithFallback({
  src,
  alt,
  className,
  fallbackTitle,
  loading = 'lazy',
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  const titleToShow = fallbackTitle || alt || 'Món ăn Huế';

  if (error || !src) {
    return (
      <div className={`${styles.fallback} ${className ?? ''}`} aria-label={titleToShow}>
        <span className={styles.fallbackIcon} aria-hidden>
          🍲
        </span>
        <span className={styles.fallbackTitle}>{titleToShow}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className ?? styles.img}
      loading={loading}
      onError={() => setError(true)}
    />
  );
}
