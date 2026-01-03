import { NextResponse } from 'next/server';
import { z } from 'zod';

export interface ValidationResult {
  valid: boolean;
  error?: NextResponse;
  missingKeys?: string[];
}

export function validateApiKeys(requiredKeys: string[]): ValidationResult {
  const missingKeys: string[] = [];
  
  for (const key of requiredKeys) {
    if (!process.env[key]) {
      missingKeys.push(key);
    }
  }
  
  if (missingKeys.length > 0) {
    return {
      valid: false,
      missingKeys,
      error: NextResponse.json(
        { 
          error: 'Missing required API configuration',
          details: `Missing environment variables: ${missingKeys.join(', ')}`,
          suggestion: 'Please configure the required API keys in your .env file'
        },
        { status: 503 }
      )
    };
  }
  
  return { valid: true };
}

export function validateAIProvider(): ValidationResult {
  const hasAIGateway = !!process.env.AI_GATEWAY_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  
  if (!hasAIGateway && !hasOpenAI && !hasAnthropic && !hasGroq && !hasGemini) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          error: 'No AI provider configured',
          details: 'At least one AI provider API key is required',
          suggestion: 'Please configure AI_GATEWAY_API_KEY or individual provider keys (OPENAI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY, GEMINI_API_KEY)'
        },
        { status: 503 }
      )
    };
  }
  
  return { valid: true };
}

export const promptSchema = z.object({
  prompt: z.string().min(1).max(10000),
  model: z.string().optional(),
  context: z.object({
    sandboxId: z.string().optional(),
    currentFiles: z.record(z.string()).optional(),
    structure: z.string().optional(),
    conversationContext: z.any().optional(),
  }).optional(),
  isEdit: z.boolean().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(1).max(100).transform(s => s.trim()),
  description: z.string().max(500).optional().transform(s => s?.trim()),
  sandboxId: z.string().optional(),
  sandboxUrl: z.string().url().optional(),
  mode: z.enum(['prompt', 'clone']).optional(),
  sourceUrl: z.string().url().optional(),
});

export const githubCommitSchema = z.object({
  repoFullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  branch: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  files: z.array(z.object({
    path: z.string().min(1),
    content: z.string(),
  })).min(1),
});

export const urlSchema = z.object({
  url: z.string().url().refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: 'Invalid URL protocol' }
  ),
});

export function sanitizeInput(input: string): string {
  return input
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

export function sanitizeFilePath(path: string): string {
  return path
    .replace(/\.\./g, '')
    .replace(/^\/+/, '')
    .replace(/[<>:"|?*\x00-\x1F]/g, '')
    .trim();
}

export function validateAndParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: NextResponse } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false,
      error: NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      ),
    };
  }
  
  return { success: true, data: result.data };
}
