import { type Result } from '@shared/types';

/**
 * File upload error codes
 */
export type FileUploadErrorCode =
  | 'INVALID_TYPE'
  | 'FILE_TOO_LARGE'
  | 'EMPTY_FILE'
  | 'READ_ERROR'
  | 'ENCODING_ERROR'
  | 'CANCELLED';

/**
 * File upload error with code and message
 */
export interface FileUploadError {
  code: FileUploadErrorCode;
  message: string;
}

/**
 * Metadata about an uploaded file
 */
export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
}

/**
 * Options for reading a file
 */
export interface ReadOptions {
  /** Character encoding for reading the file. Default: 'UTF-8' */
  encoding?: string;
  /** Maximum file size in bytes. Default: 10MB */
  maxSizeBytes?: number;
}

/**
 * Result of a file read operation
 */
export interface FileReadResult {
  content: string;
  metadata: FileMetadata;
}

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: number) => void;

/**
 * Default options
 */
const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const DEFAULT_ENCODING = 'UTF-8';

/**
 * Accepted CSV MIME types
 */
const ACCEPTED_MIME_TYPES = ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'];

/**
 * File Upload Handler for CSV files.
 * Validates file type and size, reads content, and provides progress tracking.
 */
export class FileUploadHandler {
  /**
   * Validate a file before reading
   */
  validateFile(file: File, options?: ReadOptions): Result<FileMetadata, FileUploadError> {
    const maxSize = options?.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;

    // Check if file is empty
    if (file.size === 0) {
      return {
        success: false,
        error: {
          code: 'EMPTY_FILE',
          message: 'File is empty',
        },
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`,
        },
      };
    }

    // Check file type
    const isValidType = this.isValidFileType(file);
    if (!isValidType) {
      return {
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'File must be a CSV file',
        },
      };
    }

    return {
      success: true,
      value: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified),
      },
    };
  }

  /**
   * Read a file and return its content
   */
  async readFile(file: File, options?: ReadOptions): Promise<Result<FileReadResult, FileUploadError>> {
    // Validate first
    const validation = this.validateFile(file, options);
    if (!validation.success) {
      return validation;
    }

    const encoding = options?.encoding ?? DEFAULT_ENCODING;

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content === null || content === undefined) {
          resolve({
            success: false,
            error: {
              code: 'READ_ERROR',
              message: 'Failed to read file content',
            },
          });
          return;
        }

        resolve({
          success: true,
          value: {
            content,
            metadata: validation.value,
          },
        });
      };

      reader.onerror = () => {
        resolve({
          success: false,
          error: {
            code: 'READ_ERROR',
            message: 'Failed to read file',
          },
        });
      };

      reader.readAsText(file, encoding);
    });
  }

  /**
   * Read a file with progress updates
   */
  async readFileWithProgress(
    file: File,
    onProgress: ProgressCallback,
    options?: ReadOptions
  ): Promise<Result<FileReadResult, FileUploadError>> {
    // Validate first
    const validation = this.validateFile(file, options);
    if (!validation.success) {
      return validation;
    }

    const encoding = options?.encoding ?? DEFAULT_ENCODING;

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };

      reader.onload = (event) => {
        onProgress(100);
        const content = event.target?.result as string;
        if (content === null || content === undefined) {
          resolve({
            success: false,
            error: {
              code: 'READ_ERROR',
              message: 'Failed to read file content',
            },
          });
          return;
        }

        resolve({
          success: true,
          value: {
            content,
            metadata: validation.value,
          },
        });
      };

      reader.onerror = () => {
        resolve({
          success: false,
          error: {
            code: 'READ_ERROR',
            message: 'Failed to read file',
          },
        });
      };

      reader.readAsText(file, encoding);
    });
  }

  /**
   * Check if a file has a valid CSV type
   */
  private isValidFileType(file: File): boolean {
    // Check MIME type
    if (ACCEPTED_MIME_TYPES.includes(file.type)) {
      return true;
    }

    // Check file extension as fallback
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension === 'csv';
  }
}
