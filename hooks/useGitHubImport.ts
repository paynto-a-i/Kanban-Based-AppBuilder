'use client';

import { useState, useCallback } from 'react';
import { getGitHubConnection } from '@/lib/versioning/github';

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

  const getAuthHeaders = () => {
    const connection = getGitHubConnection();
    return connection?.accessToken ? { Authorization: `Bearer ${connection.accessToken}` } : {};
  };

  const previewImport = useCallback(async (
    repoFullName: string,
    branch: string = 'main'
  ): Promise<ImportPreview | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `/api/github/import?repo=${encodeURIComponent(repoFullName)}&branch=${encodeURIComponent(branch)}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to preview import');
      }

      const preview: ImportPreview = await response.json();

      setState(prev => ({
        ...prev,
        isLoading: false,
        preview,
      }));

      return preview;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      return null;
    }
  }, []);

  const importRepo = useCallback(async (
    repoFullName: string,
    branch: string = 'main',
    maxFiles: number = 100
  ): Promise<ImportResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/github/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ repoFullName, branch, maxFiles }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to import repository');
      }

      const result: ImportResult = await response.json();

      setState(prev => ({
        ...prev,
        isLoading: false,
        importResult: result,
      }));

      return result;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      throw error;
    }
  }, []);

  const clearState = useCallback(() => {
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
