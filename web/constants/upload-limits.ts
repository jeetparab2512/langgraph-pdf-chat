/** Shared PDF upload constraints for API routes and the UI. */
export const UPLOAD_LIMITS = {
  maxFiles: 5,
  maxFileSizeBytes: 100 * 1024 * 1024,
  allowedMimeTypes: ['application/pdf'] as const,
} as const;

export function formatMaxFileSize(): string {
  return `${UPLOAD_LIMITS.maxFileSizeBytes / (1024 * 1024)}MB`;
}
