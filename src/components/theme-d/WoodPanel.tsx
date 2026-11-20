import type { ReactNode } from 'react';

import styles from '@/components/theme-d/WoodPanel.module.css';

/**
 * Hệ bảng Án A — "Bảng gỗ treo" (Bảo duyệt 2026-11-20 làm chuẩn panel
 * cho toàn game). Khung gỗ, dây thừng, biển hiệu đều là asset cắt trực
 * tiếp từ bản vẽ án A đã duyệt; chữ tiêu đề là dữ liệu thật đặt lên
 * biển trống bằng font Coiny khắc vàng. Nội dung nằm trên mặt giấy kem
 * trong lòng bảng để tương phản luôn đạt như hệ giấy hiện tại.
 */
interface WoodPanelProps {
  /** Sign text rendered over the carved blank sign. Omit for a signless board. */
  title?: ReactNode;
  /** Heading element for the sign text (a11y); visual style is identical. */
  titleLevel?: 'div' | 'h2' | 'h3';
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function WoodPanel({
  title,
  titleLevel = 'div',
  className,
  bodyClassName,
  children,
}: WoodPanelProps) {
  const TitleTag = titleLevel;
  return (
    <div className={`${styles.panel} ${className ?? ''}`}>
      <span className={`${styles.rope} ${styles.ropeL}`} aria-hidden="true" />
      <span className={`${styles.rope} ${styles.ropeR}`} aria-hidden="true" />
      {title ? (
        <div className={styles.sign}>
          <TitleTag className={styles.signText}>{title}</TitleTag>
        </div>
      ) : null}
      <div className={`${styles.body} ${title ? styles.bodyWithSign : ''} ${bodyClassName ?? ''}`}>
        {children}
      </div>
    </div>
  );
}
