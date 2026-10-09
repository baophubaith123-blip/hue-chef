import styles from './AchievementIcon.module.css';

interface AchievementIconProps {
  badgeId: string;
  category?: 'bun' | 'com' | 'banh' | 'che' | 'nem' | 'special' | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  locked?: boolean;
  className?: string;
}

export function AchievementIcon({
  badgeId,
  category = 'special',
  size = 'md',
  locked = false,
  className,
}: AchievementIconProps) {
  const getCategoryClass = () => {
    switch (category) {
      case 'bun':
        return styles.catBun;
      case 'com':
        return styles.catCom;
      case 'banh':
        return styles.catBanh;
      case 'che':
        return styles.catChe;
      case 'nem':
        return styles.catNem;
      case 'special':
      default:
        return styles.catSpecial;
    }
  };

  const renderSvgPath = () => {
    switch (badgeId) {
      case 'first-cook':
        // Chef Hat
        return (
          <path
            fill="currentColor"
            d="M12 2C9.24 2 7 4.24 7 7c-1.66 0-3 1.34-3 3 0 1.29.82 2.39 1.97 2.81C5.35 13.9 5 14.91 5 16h14c0-1.09-.35-2.1-.97-3.19C19.18 12.39 20 11.29 20 10c0-1.66-1.34-3-3-3 0-2.76-2.24-5-5-5zm-5 16h10v2H7v-2z"
          />
        );
      case 'bun-master':
        // Noodle Bowl
        return (
          <path
            fill="currentColor"
            d="M22 9.5c0-.83-.67-1.5-1.5-1.5H3.5C2.67 8 2 8.67 2 9.5c0 4.97 3.58 9.09 8.35 9.88L9 21h6l-1.35-1.62C18.42 18.59 22 14.47 22 9.5zM6.5 6h11V4h-11v2z"
          />
        );
      case 'com-master':
        // Rice Bowl
        return (
          <path
            fill="currentColor"
            d="M12 4C7.03 4 3 7.03 3 11h18c0-3.97-4.03-7-9-7zm-9 9c0 3.87 3.13 7 7 7h4c3.87 0 7-3.13 7-7H3z"
          />
        );
      case 'banh-master':
        // Dumpling
        return (
          <path
            fill="currentColor"
            d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 21l7.03-3.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9zm0 3c2.21 0 4.1.9 5.48 2.35L12 11.5 6.52 8.35C7.9 6.9 9.79 6 12 6z"
          />
        );
      case 'che-master':
        // Dessert Cup / Drink
        return (
          <path
            fill="currentColor"
            d="M19 3H5v2l2 4v8c0 1.66 1.34 3 3 3h4c1.66 0 3-1.34 3-3V9l2-4V3zm-4 14h-6v-6h6v6zm1.5-8h-9L6.1 5h11.8l-1.4 4z"
          />
        );
      case 'nem-master':
        // Skewer / Flame
        return (
          <path
            fill="currentColor"
            d="M13.5 2C13.5 2 13 4 11.5 5.5C10 7 8 7 8 10c0 2.21 1.79 4 4 4s4-1.79 4-4c0-3.5-2.5-6-2.5-6zM12 22l-1-4h2l-1 4zm-7-8h14v2H5v-2z"
          />
        );
      case 'perfect-score':
        // 5 Star Medal
        return (
          <path
            fill="currentColor"
            d="M12 2l2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 14.24l-4.8 2.52.92-5.34L4.24 7.64l5.36-.78L12 2zm0 14.5l3.5 1.84-.67-3.89 2.83-2.76-3.9-.57L12 7.6 10.24 11.1l-3.9.57 2.83 2.76-.67 3.89L12 16.5z"
          />
        );
      case 'no-mistake':
        // Shield Check
        return (
          <path
            fill="currentColor"
            d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"
          />
        );
      case 'all-categories':
        // Trophy
        return (
          <path
            fill="currentColor"
            d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V18H8v2h8v-2h-3v-2.1c1.73-.37 3.07-1.79 3.61-3.56C19.08 12.03 21 9.95 21 7.4V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"
          />
        );
      case 'high-score':
        // Diamond Gem
        return (
          <path
            fill="currentColor"
            d="M12 2L4.5 9 12 22l7.5-13L12 2zm-4.32 7l3.32-4.65V9H7.68zm5.32 0V4.35L16.32 9h-3.32zM12 18.25L7.8 10h8.4L12 18.25z"
          />
        );
      case 'level-5':
        // Level Up Badge
        return (
          <path
            fill="currentColor"
            d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"
          />
        );
      case 'all-recipes':
      default:
        // Royal Crown
        return (
          <path
            fill="currentColor"
            d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1h14v1z"
          />
        );
    }
  };

  return (
    <div
      className={[
        styles.badgeContainer,
        styles[size],
        getCategoryClass(),
        locked ? styles.locked : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      title={locked ? 'LOCKED' : 'UNLOCKED'}
    >
      <svg
        className={styles.svgIcon}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        {renderSvgPath()}
      </svg>
    </div>
  );
}
