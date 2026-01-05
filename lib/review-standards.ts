export interface QualityStandard {
  id: string;
  name: string;
  description: string;
  rules: string[];
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
}

export interface ReviewConfig {
  standards: QualityStandard[];
  strictMode: boolean;
  autoFix: boolean;
}

export const DEFAULT_STANDARDS: QualityStandard[] = [
  {
    id: 'accessibility',
    name: 'Accessibility',
    description: 'WCAG 2.1 accessibility guidelines',
    rules: [
      'All images must have alt text',
      'Interactive elements must be keyboard accessible',
      'Color contrast must meet WCAG AA standards',
      'Form inputs must have associated labels',
      'Focus states must be visible',
    ],
    severity: 'error',
    enabled: true,
  },
  {
    id: 'performance',
    name: 'Performance',
    description: 'React performance best practices',
    rules: [
      'Use React.memo for expensive components',
      'Avoid inline function definitions in JSX',
      'Use useMemo/useCallback for expensive operations',
      'Lazy load large components',
      'Avoid unnecessary re-renders',
    ],
    severity: 'warning',
    enabled: true,
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Security best practices',
    rules: [
      'Never expose API keys or secrets',
      'Sanitize user input before rendering',
      'Use HTTPS for all external requests',
      'Validate data from external sources',
      'Avoid dangerouslySetInnerHTML',
    ],
    severity: 'error',
    enabled: true,
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    description: 'TypeScript best practices',
    rules: [
      'Avoid using any type',
      'Define explicit return types for functions',
      'Use interfaces for object shapes',
      'Prefer const assertions where appropriate',
      'Use strict null checks',
    ],
    severity: 'warning',
    enabled: true,
  },
  {
    id: 'react-hooks',
    name: 'React Hooks',
    description: 'React hooks rules and best practices',
    rules: [
      'Follow hooks rules (only call at top level)',
      'Include all dependencies in useEffect',
      'Use custom hooks for reusable logic',
      'Avoid stale closures in callbacks',
      'Clean up effects properly',
    ],
    severity: 'error',
    enabled: true,
  },
  {
    id: 'code-style',
    name: 'Code Style',
    description: 'Code style and formatting',
    rules: [
      'Use consistent naming conventions',
      'Keep functions small and focused',
      'Avoid deeply nested code',
      'Use meaningful variable names',
      'Document complex logic',
    ],
    severity: 'info',
    enabled: false,
  },
  {
    id: 'testing',
    name: 'Testability',
    description: 'Code testability requirements',
    rules: [
      'Components should be easily testable',
      'Separate business logic from UI',
      'Use dependency injection where possible',
      'Avoid global state mutations',
      'Make side effects explicit',
    ],
    severity: 'info',
    enabled: false,
  },
];

const CONFIG_STORAGE_KEY = 'paynto-ai:review-config';

export function loadReviewConfig(): ReviewConfig {
  if (typeof window === 'undefined') {
    return {
      standards: DEFAULT_STANDARDS,
      strictMode: false,
      autoFix: false,
    };
  }

  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }

  return {
    standards: DEFAULT_STANDARDS,
    strictMode: false,
    autoFix: false,
  };
}

export function saveReviewConfig(config: ReviewConfig): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore
  }
}

export function generateReviewPrompt(config: ReviewConfig): string {
  const enabledStandards = config.standards.filter(s => s.enabled);

  if (enabledStandards.length === 0) {
    return '';
  }

  const standardsText = enabledStandards.map(standard => {
    const rulesText = standard.rules.map(r => `  - ${r}`).join('\n');
    return `### ${standard.name} (${standard.severity} severity)\n${standard.description}\nRules:\n${rulesText}`;
  }).join('\n\n');

  return `
Additionally, enforce these quality standards:

${standardsText}

${config.strictMode ? 'STRICT MODE: Any violation of error-severity rules should fail the review.' : ''}
`;
}
