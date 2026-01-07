import { SandboxProvider, SandboxProviderConfig } from './types';
import { ModalProvider } from './providers/modal-provider';

export class SandboxFactory {
  static create(config?: SandboxProviderConfig): SandboxProvider {
    console.log(`[SandboxFactory] Creating Modal sandbox`);
    return new ModalProvider(config || {});
  }
  
  static async createWithFallback(config?: SandboxProviderConfig): Promise<SandboxProvider> {
    if (!this.isProviderAvailable()) {
      throw new Error('Modal sandbox not configured. Set MODAL_TOKEN_ID and MODAL_TOKEN_SECRET environment variables.');
    }
    
    console.log(`[SandboxFactory] Creating Modal sandbox`);
    const provider = this.create(config);
    await provider.createSandbox();
    console.log(`[SandboxFactory] Successfully created Modal sandbox`);
    return provider;
  }
  
  static getAvailableProviders(): string[] {
    return this.isProviderAvailable() ? ['modal'] : [];
  }
  
  static isProviderAvailable(): boolean {
    return !!(process.env.MODAL_TOKEN_ID && process.env.MODAL_TOKEN_SECRET);
  }
}
