import { useRef } from 'react';

import { useFileUpload, type UseFileUploadOptions } from '@presentation/hooks';

import { Button } from './Button';

/**
 * Props for FileUpload component
 */
export interface FileUploadProps extends UseFileUploadOptions {
  /** Label text for the upload area */
  label?: string;
  /** Helper text displayed below the label */
  helperText?: string;
  /** Whether the upload is disabled */
  disabled?: boolean;
  /** Custom className for the container */
  className?: string;
}

/**
 * File upload icon
 */
function UploadIcon() {
  return (
    <svg
      className="h-12 w-12 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );
}

/**
 * File icon for displaying selected file
 */
function FileIcon() {
  return (
    <svg
      className="h-8 w-8 text-blue-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * File upload component with drag and drop support.
 * Supports CSV file uploads with validation and preview.
 */
export function FileUpload({
  label = 'Upload a file',
  helperText,
  disabled = false,
  className = '',
  accept = '.csv',
  ...options
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    file,
    error,
    isDragActive,
    isProcessing,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    clearFile,
    openFileDialog,
  } = useFileUpload({
    accept,
    ...options,
  });

  // Override inputRef with our local ref
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e);
  };

  const containerClasses = [
    'relative rounded-lg border-2 border-dashed p-6 transition-colors',
    isDragActive && !disabled
      ? 'border-blue-400 bg-blue-50'
      : error
        ? 'border-red-300 bg-red-50'
        : 'border-gray-300 hover:border-gray-400',
    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="w-full">
      <div
        className={containerClasses}
        onDrop={disabled ? undefined : handleDrop}
        onDragOver={disabled ? undefined : handleDragOver}
        onDragEnter={disabled ? undefined : handleDragEnter}
        onDragLeave={disabled ? undefined : handleDragLeave}
        onClick={disabled ? undefined : openFileDialog}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={label}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            openFileDialog();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          aria-hidden="true"
        />

        {!file ? (
          <div className="flex flex-col items-center text-center">
            <UploadIcon />
            <p className="mt-4 text-sm font-medium text-gray-900">{label}</p>
            <p className="mt-1 text-xs text-gray-500">
              {isDragActive ? 'Drop the file here' : 'Drag and drop or click to browse'}
            </p>
            {helperText && <p className="mt-2 text-xs text-gray-400">{helperText}</p>}
          </div>
        ) : (
          <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <FileIcon />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
            </div>
            <Button
              variant="ghost"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              disabled={isProcessing}
              aria-label="Remove file"
            >
              Remove
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
