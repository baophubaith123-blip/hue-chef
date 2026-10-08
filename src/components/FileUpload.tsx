import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from 'react';

import type { ChatAttachment } from '@/features/support/types';
import { useTranslation } from '@/i18n/useTranslation';
import { AppError } from '@/lib/errors';
import {
  DEFAULT_MAX_FILE_SIZE_MB,
  formatFileSize,
  readFileAsDataURL,
  validateFile,
  type FileValidationOptions,
} from '@/lib/file';

import { Button } from '@/components/Button';
import styles from '@/components/FileUpload.module.css';

interface FileUploadProps {
  label?: string;
  hint?: string;
  options?: FileValidationOptions;
  value?: ChatAttachment | null;
  onChange: (attachment: ChatAttachment | null) => void;
  onError?: (code: string, message: string) => void;
  compact?: boolean;
}

export function FileUpload({
  label,
  hint,
  options,
  value = null,
  onChange,
  onError,
  compact = false,
}: FileUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const maxSizeMB = options?.maxSizeMB ?? DEFAULT_MAX_FILE_SIZE_MB;

  const handleFile = useCallback(
    async (file: File) => {
      setLocalError(null);
      try {
        validateFile(file, options);
        const dataUrl = await readFileAsDataURL(file);
        const attachment: ChatAttachment = {
          id: `att-${crypto.randomUUID()}`,
          name: file.name,
          sizeKB: Math.round(file.size / 1024),
          type: file.type || 'application/octet-stream',
          dataUrl,
        };
        onChange(attachment);
      } catch (err) {
        let code = 'FILE_READ';
        let message = String(err instanceof Error ? err.message : err);
        if (err instanceof AppError) {
          code = err.code;
          if (code === 'FILE_TOO_LARGE') message = t('errors.fileTooLarge');
          if (code === 'INVALID_FILE_TYPE') message = t('errors.invalidFileType');
        }
        setLocalError(message);
        onError?.(code, message);
      }
    },
    [onChange, onError, options, t],
  );

  const onInputChange = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      const file = ev.target.files?.[0];
      if (file) void handleFile(file);
      if (inputRef.current) inputRef.current.value = '';
    },
    [handleFile],
  );

  const onDrop = useCallback(
    (ev: DragEvent<HTMLDivElement>) => {
      ev.preventDefault();
      setIsDragging(false);
      const file = ev.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const onDragOver = useCallback((ev: DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((ev: DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    setIsDragging(false);
  }, []);

  const triggerBrowse = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const clear = useCallback(() => {
    setLocalError(null);
    onChange(null);
  }, [onChange]);

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
      {label ? <label className={styles.label}>{label}</label> : null}
      {!value ? (
        <div
          className={`${styles.drop} ${isDragging ? styles.dragging : ''}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          role="button"
          tabIndex={0}
          onClick={triggerBrowse}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') triggerBrowse();
          }}
        >
          <p className={styles.dropHere}>{t('fileUpload.dropHere')}</p>
          <p className={styles.maxSize}>{t('fileUpload.maxSize', { mb: maxSizeMB })}</p>
          <Button type="button" variant="secondary" onClick={triggerBrowse}>
            {t('fileUpload.browse')}
          </Button>
          <input
            ref={inputRef}
            type="file"
            className={styles.input}
            onChange={onInputChange}
            accept={options?.allowedTypes?.join(',')}
          />
        </div>
      ) : (
        <div className={styles.selected}>
          <div className={styles.selectedInfo}>
            <div className={styles.selectedName}>
              {t('fileUpload.selected')}: {value.name}
            </div>
            <div className={styles.selectedMeta}>
              {formatFileSize(value.sizeKB * 1024)} · {value.type}
            </div>
          </div>
          {value.type.startsWith('image/') ? (
            <img src={value.dataUrl} alt={value.name} className={styles.previewImg} />
          ) : (
            <div className={styles.previewFallback}>{t('fileUpload.preview')}</div>
          )}
          <Button type="button" variant="ghost" onClick={clear}>
            {t('fileUpload.remove')}
          </Button>
        </div>
      )}
      {hint ? <p className={styles.hint}>{hint}</p> : null}
      {localError ? <p className={styles.error}>{localError}</p> : null}
    </div>
  );
}
