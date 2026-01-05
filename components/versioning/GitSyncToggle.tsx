'use client';

import { useState, useEffect } from 'react';
import { isGitHubConnected, fetchUserRepos } from '@/lib/versioning/github';
import { GitHubRepo } from '@/lib/versioning/types';

interface GitSyncToggleProps {
  isEnabled: boolean;
  isSyncing: boolean;
  lastCommitSha?: string | null;
  lastCommitUrl?: string | null;
  error?: string | null;
  onEnable: (repoFullName: string, branch: string) => boolean;
  onDisable: () => void;
  className?: string;
}

export default function GitSyncToggle({
  isEnabled,
  isSyncing,
  lastCommitSha,
  lastCommitUrl,
  error,
  onEnable,
  onDisable,
  className = '',
}: GitSyncToggleProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [branch, setBranch] = useState<string>('main');
  const [isLoading, setIsLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const connected = isGitHubConnected();

  useEffect(() => {
    if (showConfig && connected) {
      loadRepos();
    }
  }, [showConfig, connected]);

  const loadRepos = async () => {
    setIsLoading(true);
    setConfigError(null);
    try {
      const userRepos = await fetchUserRepos();
      setRepos(userRepos);
      if (userRepos.length > 0 && !selectedRepo) {
        setSelectedRepo(userRepos[0].fullName);
        setBranch(userRepos[0].defaultBranch);
      }
    } catch (err: any) {
      setConfigError(err.message || 'Failed to load repositories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable = () => {
    if (!selectedRepo) {
      setConfigError('Please select a repository');
      return;
    }
    const success = onEnable(selectedRepo, branch);
    if (success) {
      setShowConfig(false);
    }
  };

  if (!connected) {
    return (
      <div className={`flex items-center gap-2 text-xs text-gray-500 ${className}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Connect GitHub to enable auto-sync</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => isEnabled ? onDisable() : setShowConfig(true)}
          className={`
            relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
            ${isEnabled ? 'bg-orange-500' : 'bg-gray-200'}
          `}
        >
          <span
            className={`
              pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 
              transition duration-200 ease-in-out
              ${isEnabled ? 'translate-x-4' : 'translate-x-0'}
            `}
          />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700">
            Auto-sync to GitHub
          </span>
          
          {isSyncing && (
            <div className="flex items-center gap-1 text-orange-500">
              <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px]">Syncing...</span>
            </div>
          )}

          {isEnabled && lastCommitSha && !isSyncing && (
            <a
              href={lastCommitUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {lastCommitSha.slice(0, 7)}
            </a>
          )}

          {error && (
            <span className="text-[10px] text-red-500">{error}</span>
          )}
        </div>
      </div>

      {showConfig && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Configure Git Sync</h3>
            <button
              onClick={() => setShowConfig(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Repository</label>
                <select
                  value={selectedRepo}
                  onChange={(e) => {
                    setSelectedRepo(e.target.value);
                    const repo = repos.find(r => r.fullName === e.target.value);
                    if (repo) setBranch(repo.defaultBranch);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs text-gray-700 bg-white rounded border border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {repos.map((repo) => (
                    <option key={repo.id} value={repo.fullName}>
                      {repo.fullName} {repo.private ? '🔒' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs text-gray-700 bg-white rounded border border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="main"
                />
              </div>

              {configError && (
                <p className="text-xs text-red-500">{configError}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowConfig(false)}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnable}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded hover:bg-orange-600 transition-colors"
                >
                  Enable Sync
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
