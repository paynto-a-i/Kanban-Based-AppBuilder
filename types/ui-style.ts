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
   * One of: modern | playful | professional | artistic | minimalist | bold | elegant | futuristic
   * (we keep this as string for flexibility / forward-compat).
   */
  style?: string;
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
}

