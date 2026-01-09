import { SandboxProvider, SandboxProviderConfig } from './types';
import { ModalProvider } from './providers/modal-provider';
import { VercelProvider } from './providers/vercel-provider';

export class SandboxFactory {
  static create(config?: SandboxProviderConfig): SandboxProvider {
    const resolvedConfig = config || {};

    if (this.isModalConfigured(resolvedConfig)) {
      console.log(`[SandboxFactory] Creating Modal sandbox`);
      return new ModalProvider(resolvedConfig);
    }

    if (this.isVercelConfigured(resolvedConfig)) {
      console.log(`[SandboxFactory] Creating Vercel sandbox`);
      return new VercelProvider(resolvedConfig);
    }

    // Default to Modal (will fail with a helpful error upstream)
    console.log(`[SandboxFactory] No sandbox provider configured; defaulting to Modal provider instance`);
    return new ModalProvider(resolvedConfig);
  }
  
  static async createWithFallback(config?: SandboxProviderConfig): Promise<SandboxProvider> {
    if (!this.isProviderAvailable()) {
      throw new Error(
        'No sandbox provider configured. Set MODAL_TOKEN_ID/MODAL_TOKEN_SECRET (Modal) or VERCEL_OIDC_TOKEN (or VERCEL_TOKEN + VERCEL_TEAM_ID + VERCEL_PROJECT_ID).'
      );
    }
    
    const provider = this.create(config);
    await provider.createSandbox();
    console.log(`[SandboxFactory] Successfully created sandbox`);
    return provider;
  }
  
  static getAvailableProviders(): string[] {
    const providers: string[] = [];
    if (this.isModalConfigured()) providers.push('modal');
    if (this.isVercelConfigured()) providers.push('vercel');
    return providers;
  }
  
  static isProviderAvailable(): boolean {
    return this.isModalConfigured() || this.isVercelConfigured();
  }

  private static isModalConfigured(_config?: SandboxProviderConfig): boolean {
    return !!(process.env.MODAL_TOKEN_ID && process.env.MODAL_TOKEN_SECRET);
  }

  private static isVercelConfigured(_config?: SandboxProviderConfig): boolean {
    // Support either OIDC or token+team+project for Vercel Sandboxes
    if (process.env.VERCEL_OIDC_TOKEN) return true;
    return !!(process.env.VERCEL_TOKEN && process.env.VERCEL_TEAM_ID && process.env.VERCEL_PROJECT_ID);
  }
}
