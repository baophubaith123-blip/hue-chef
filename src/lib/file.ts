import { AppError } from '@/lib/errors';

export const DEFAULT_MAX_FILE_SIZE_MB = 5;

export interface FileValidationOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export interface FileValidationResult {
  ok: true;
  sizeKB: number;
}

export function validateFileSize(
  file: File,
  maxSizeMB: number = DEFAULT_MAX_FILE_SIZE_MB,
): FileValidationResult {
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new AppError(
      `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB > ${maxSizeMB}MB`,
      'FILE_TOO_LARGE',
    );
  }
  return { ok: true, sizeKB: Math.round(file.size / 1024) };
}

export function validateFileType(file: File, allowedTypes: string[]): void {
  if (allowedTypes.length === 0) return;
  const mimeOk = allowedTypes.some((t) => file.type === t || file.type.startsWith(`${t.split('/')[0]}/`));
  const extOk = allowedTypes.some((t) => {
    if (!t.startsWith('.')) return false;
    return file.name.toLowerCase().endsWith(t.toLowerCase());
  });
  if (!mimeOk && !extOk) {
    throw new AppError(`File type "${file.type}" is not allowed`, 'INVALID_FILE_TYPE');
  }
}

export function validateFile(file: File, options: FileValidationOptions = {}): FileValidationResult {
  const sizeResult = validateFileSize(file, options.maxSizeMB);
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    validateFileType(file, options.allowedTypes);
  }
  return sizeResult;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new AppError('Failed to read file', 'FILE_READ'));
    reader.readAsDataURL(file);
  });
}
