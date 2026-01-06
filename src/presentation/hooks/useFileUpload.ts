import { useCallback, useRef, useState } from 'react';

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * File upload state
 */
export interface FileUploadState {
  /** Currently selected file */
  file: File | null;
  /** Whether file is being processed */
  isProcessing: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether drag is active over drop zone */
  isDragActive: boolean;
}

/**
 * File upload actions
 */
export interface FileUploadActions {
  /** Handle file selection from input */
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Handle file drop */
  handleDrop: (event: React.DragEvent<HTMLElement>) => void;
  /** Handle drag over */
  handleDragOver: (event: React.DragEvent<HTMLElement>) => void;
  /** Handle drag enter */
  handleDragEnter: (event: React.DragEvent<HTMLElement>) => void;
  /** Handle drag leave */
  handleDragLeave: (event: React.DragEvent<HTMLElement>) => void;
  /** Clear selected file */
  clearFile: () => void;
  /** Set processing state */
  setProcessing: (processing: boolean) => void;
  /** Set error message */
  setError: (error: string | null) => void;
  /** Open file dialog programmatically */
  openFileDialog: () => void;
  /** Reference to file input element */
  inputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Options for useFileUpload hook
 */
export interface UseFileUploadOptions {
  /** Accepted file types (e.g., '.csv', 'text/csv') */
  accept?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Custom validator function */
  validator?: (file: File) => FileValidationResult;
  /** Callback when file is selected */
  onFileSelect?: (file: File) => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
}

/**
 * Default file size limit (10MB)
 */
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;

/**
 * Hook for managing file upload with drag and drop support.
 *
 * @param options - File upload options
 * @returns File upload state and actions
 *
 * @example
 * const {
 *   file,
 *   error,
 *   isDragActive,
 *   handleFileSelect,
 *   handleDrop,
 *   handleDragOver,
 *   handleDragEnter,
 *   handleDragLeave,
 *   inputRef,
 *   openFileDialog,
 * } = useFileUpload({
 *   accept: '.csv',
 *   maxSize: 5 * 1024 * 1024, // 5MB
 *   onFileSelect: (file) => console.log('Selected:', file.name),
 * });
 *
 * return (
 *   <div
 *     onDrop={handleDrop}
 *     onDragOver={handleDragOver}
 *     onDragEnter={handleDragEnter}
 *     onDragLeave={handleDragLeave}
 *     className={isDragActive ? 'drag-active' : ''}
 *   >
 *     <input ref={inputRef} type="file" onChange={handleFileSelect} />
 *   </div>
 * );
 */
export function useFileUpload(
  options: UseFileUploadOptions = {}
): FileUploadState & FileUploadActions {
  const { accept, maxSize = DEFAULT_MAX_SIZE, validator, onFileSelect, onError } = options;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragCounter = useRef(0);

  const [state, setState] = useState<FileUploadState>({
    file: null,
    isProcessing: false,
    error: null,
    isDragActive: false,
  });

  const validateFile = useCallback(
    (file: File): FileValidationResult => {
      // Check file type if accept is specified
      if (accept) {
        const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase());
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        const fileMimeType = file.type.toLowerCase();

        const isAccepted = acceptedTypes.some(
          (type) =>
            type === fileExtension ||
            type === fileMimeType ||
            (type.endsWith('/*') && fileMimeType.startsWith(type.slice(0, -1)))
        );

        if (!isAccepted) {
          return {
            isValid: false,
            error: `File type not accepted. Please select a ${accept} file.`,
          };
        }
      }

      // Check file size
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        return {
          isValid: false,
          error: `File size exceeds ${maxSizeMB}MB limit.`,
        };
      }

      // Run custom validator if provided
      if (validator) {
        return validator(file);
      }

      return { isValid: true };
    },
    [accept, maxSize, validator]
  );

  const processFile = useCallback(
    (file: File) => {
      const validation = validateFile(file);

      if (!validation.isValid) {
        setState((prev) => ({ ...prev, error: validation.error || 'Invalid file' }));
        onError?.(validation.error || 'Invalid file');
        return;
      }

      setState((prev) => ({
        ...prev,
        file,
        error: null,
      }));

      onFileSelect?.(file);
    },
    [validateFile, onFileSelect, onError]
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
      // Reset input so the same file can be selected again
      event.target.value = '';
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();

      dragCounter.current = 0;
      setState((prev) => ({ ...prev, isDragActive: false }));

      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounter.current++;
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setState((prev) => ({ ...prev, isDragActive: true }));
    }
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounter.current--;
    if (dragCounter.current === 0) {
      setState((prev) => ({ ...prev, isDragActive: false }));
    }
  }, []);

  const clearFile = useCallback(() => {
    setState({
      file: null,
      isProcessing: false,
      error: null,
      isDragActive: false,
    });
  }, []);

  const setProcessing = useCallback((isProcessing: boolean) => {
    setState((prev) => ({ ...prev, isProcessing }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return {
    ...state,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    clearFile,
    setProcessing,
    setError,
    openFileDialog,
    inputRef,
  };
}
