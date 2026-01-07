'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface ImportedFile {
  path: string;
  content: string;
  encoding: string;
  size: number;
}

interface ImportPreview {
  repoFullName: string;
  branch: string;
  totalFiles: number;
  importableFiles: number;
  files: Array<{ path: string; size: number }>;
}

interface ImportResult {
  success: boolean;
  repoFullName: string;
  branch: string;
  totalFilesInRepo: number;
  importedFiles: number;
  files: ImportedFile[];
  errors?: string[];
}

interface GitHubImportState {
  isLoading: boolean;
  preview: ImportPreview | null;
  importResult: ImportResult | null;
  error: string | null;
}

export function useGitHubImport() {
  const [state, setState] = useState<GitHubImportState>({
    isLoading: false,
    preview: null,
    importResult: null,
    error: null,
  });

  // Refs for loading guards and abort controller
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const previewImport = useCallback(async (
    repoFullName: string,
    branch: string = 'main'
  ): Promise<ImportPreview | null> => {
    // Guard against concurrent operations
    if (isLoadingRef.current) {
      console.log('[useGitHubImport] Preview already in progress, skipping');
      return null;
    }

    isLoadingRef.current = true;
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `/api/github/import?repo=${encodeURIComponent(repoFullName)}&branch=${encodeURIComponent(branch)}`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to preview import');
      }

      const preview: ImportPreview = await response.json();

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          preview,
        }));
      }

      return preview;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[useGitHubImport] Preview request aborted');
        return null;
      }
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
      }
      return null;
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  const importRepo = useCallback(async (
    repoFullName: string,
    branch: string = 'main',
    maxFiles: number = 100
  ): Promise<ImportResult | null> => {
    // Guard against concurrent operations
    if (isLoadingRef.current) {
      console.log('[useGitHubImport] Import already in progress, skipping');
      return null;
    }

    isLoadingRef.current = true;
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/github/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName, branch, maxFiles }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to import repository');
      }

      const result: ImportResult = await response.json();

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          importResult: result,
        }));
      }

      return result;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[useGitHubImport] Import request aborted');
        return null;
      }
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
      }
      return null;
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  const clearState = useCallback(() => {
    abortControllerRef.current?.abort();
    isLoadingRef.current = false;
    setState({
      isLoading: false,
      preview: null,
      importResult: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    previewImport,
    importRepo,
    clearState,
  };
}

export type { ImportedFile, ImportPreview, ImportResult, GitHubImportState };
