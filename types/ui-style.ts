export interface UIStyle {
  /**
   * Human friendly label (e.g. "Modern Minimal", "Bold & Vibrant").
   */
  name: string;
  /**
   * 1-2 sentence description of the visual approach.
   */
  description?: string;
  /**
   * High-level style bucket. Keep this flexible (forward compatible).
   *
   * Common values include:
   * modern | playful | professional | artistic | minimalist | bold | elegant | futuristic
   * glassmorphic | neomorphic | brutalist | organic | retro | cyberpunk | anime
   * (we keep this as string for flexibility / forward-compat).
   */
  style?: string;
  /**
   * 2-8 words describing the "feel" (e.g., "sleek, premium, cinematic").
   * Useful for keeping UI consistent across many tickets.
   */
  vibe?: string;
  colorScheme?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  /**
   * Brief layout description (e.g., "Centered hero with asymmetric sections").
   */
  layout?: string;
  /**
   * 3-6 visual features (e.g., "Glassmorphism cards", "Gradient backgrounds").
   */
  features?: string[];

  /**
   * Optional creative direction helpers for "go all out" themes.
   * These are intentionally loose so the generator can interpret them.
   */
  themeKeywords?: string[];
  motifs?: string[];
  typography?: {
    displayFont?: string;
    bodyFont?: string;
    monoFont?: string;
    notes?: string;
  };
  motion?: {
    intensity?: 'subtle' | 'moderate' | 'bold';
    personality?: 'snappy' | 'smooth' | 'bouncy' | 'cinematic';
    notes?: string;
  };
  iconography?: {
    style?: string;
    notes?: string;
  };
  shapeLanguage?: {
    radius?: 'sharp' | 'soft' | 'pill' | 'mixed';
    stroke?: 'thin' | 'medium' | 'thick';
    notes?: string;
  };
  texture?: string;
  references?: string[];
  avoid?: string[];
}

