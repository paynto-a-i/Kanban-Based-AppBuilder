import {
    StorageAdapter,
    Project,
    ProjectVersion
} from './types';

export class SupabaseStorageAdapter implements StorageAdapter {
    name = 'supabase';
    private userId: string | null = null;

    setUserId(userId: string) {
        this.userId = userId;
    }

    private async apiCall(action: string, data: any = {}) {
        const response = await fetch('/api/versioning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...data }),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API call failed');
        }
        
        return response.json();
    }

    async saveProject(project: Project): Promise<void> {
        if (!this.userId) {
            throw new Error('User not set');
        }
        await this.apiCall('saveProject', { project });
    }

    async getProject(projectId: string): Promise<Project | null> {
        if (!this.userId) return null;
        try {
            const result = await this.apiCall('getProject', { projectId });
            return result?.project ?? null;
        } catch (error) {
            console.error('[SupabaseAdapter] getProject failed:', error);
            return null;
        }
    }

    async listProjects(): Promise<Project[]> {
        if (!this.userId) return [];
        try {
            const result = await this.apiCall('listProjects');
            return result?.projects ?? [];
        } catch (error) {
            console.error('[SupabaseAdapter] listProjects failed:', error);
            return [];
        }
    }

    async deleteProject(projectId: string): Promise<void> {
        if (!this.userId) return;
        await this.apiCall('deleteProject', { projectId });
    }

    async saveVersion(version: ProjectVersion): Promise<void> {
        if (!this.userId) {
            throw new Error('User not set');
        }
        await this.apiCall('saveVersion', { version });
    }

    async getVersion(versionId: string): Promise<ProjectVersion | null> {
        if (!this.userId) return null;
        try {
            const result = await this.apiCall('getVersion', { versionId });
            return result?.version ?? null;
        } catch (error) {
            console.error('[SupabaseAdapter] getVersion failed:', error);
            return null;
        }
    }

    async listVersions(projectId: string): Promise<ProjectVersion[]> {
        if (!this.userId) return [];
        try {
            const result = await this.apiCall('listVersions', { projectId });
            return result?.versions ?? [];
        } catch (error) {
            console.error('[SupabaseAdapter] listVersions failed:', error);
            return [];
        }
    }

    async getLatestVersion(projectId: string): Promise<ProjectVersion | null> {
        if (!this.userId) return null;
        try {
            const result = await this.apiCall('getLatestVersion', { projectId });
            return result?.version ?? null;
        } catch (error) {
            console.error('[SupabaseAdapter] getLatestVersion failed:', error);
            return null;
        }
    }

    async deleteVersion(versionId: string): Promise<void> {
        if (!this.userId) return;
        await this.apiCall('deleteVersion', { versionId });
    }

    isAvailable(): boolean {
        return !!this.userId;
    }

    async getStorageUsed(): Promise<number> {
        if (!this.userId) return 0;
        const result = await this.apiCall('getStorageUsed');
        return result.used || 0;
    }

    async clear(): Promise<void> {
        if (!this.userId) return;
        await this.apiCall('clear');
    }
}

export const supabaseStorageAdapter = new SupabaseStorageAdapter();
