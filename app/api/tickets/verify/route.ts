import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { validateAIProvider } from '@/lib/api-validation';

export const dynamic = 'force-dynamic';

// Check if we're using Vercel AI Gateway
const isUsingAIGateway = !!process.env.AI_GATEWAY_API_KEY;
const aiGatewayBaseURL = 'https://ai-gateway.vercel.sh/v1';

const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.OPENAI_API_KEY,
  baseURL: isUsingAIGateway ? aiGatewayBaseURL : process.env.OPENAI_BASE_URL,
});

const inputRequestSchema = z.object({
  id: z.string().min(1).max(80),
  type: z.enum(['api_key', 'credential', 'env_var', 'url', 'text']),
  label: z.string().min(1).max(120),
  placeholder: z.string().min(0).max(120),
  description: z.string().min(0).max(300).optional(),
  required: z.boolean(),
  sensitive: z.boolean().optional(),
});

const ticketDraftSchema = z.object({
  tempId: z.string().min(1).max(60),
  title: z.string().min(3).max(120),
  description: z.string().min(0).max(1200),
  type: z.enum(['component', 'feature', 'layout', 'styling', 'integration', 'config', 'database']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  complexity: z.enum(['XS', 'S', 'M', 'L', 'XL']),
  estimatedFiles: z.number().int().min(1).max(20),
  dependencies: z.array(z.string()).max(25).default([]),
  blueprintRefs: z
    .object({
      routeIds: z.array(z.string()).max(25).optional(),
      flowIds: z.array(z.string()).max(25).optional(),
      entityNames: z.array(z.string()).max(25).optional(),
    })
    .optional(),
  requiresInput: z.boolean().optional(),
  inputRequests: z.array(inputRequestSchema).max(20).optional(),
});

const inputSchema = z.object({
  ticket: z.object({
    id: z.string().min(1),
    title: z.string().min(1).max(120),
    description: z.string().max(4000).optional().default(''),
    type: z.string().optional(),
    priority: z.string().optional(),
    complexity: z.string().optional(),
    estimatedFiles: z.number().int().min(1).max(50).optional(),
    dependencies: z.array(z.string()).max(50).optional(),
  }),
  blueprint: z.any().optional(),
  uiStyle: z.any().optional(),
  existingTickets: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        status: z.string().optional(),
      })
    )
    .max(300)
    .optional(),
});

const outputSchema = z.discriminatedUnion('decision', [
  z.object({
    decision: z.literal('ok'),
    updates: z
      .object({
        title: z.string().min(1).max(120).optional(),
        description: z.string().max(4000).optional(),
        type: z.enum(['component', 'feature', 'layout', 'styling', 'integration', 'config', 'database']).optional(),
        priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
        complexity: z.enum(['XS', 'S', 'M', 'L', 'XL']).optional(),
        estimatedFiles: z.number().int().min(1).max(20).optional(),
        requiresInput: z.boolean().optional(),
        inputRequests: z.array(inputRequestSchema).max(20).optional(),
        blueprintRefs: z
          .object({
            routeIds: z.array(z.string()).max(25).optional(),
            flowIds: z.array(z.string()).max(25).optional(),
            entityNames: z.array(z.string()).max(25).optional(),
          })
          .optional(),
      })
      .optional(),
    warnings: z.array(z.string()).max(10).optional(),
    rationale: z.string().max(2000).optional(),
  }),
  z.object({
    decision: z.literal('split'),
    primaryTempId: z.string().min(1).max(60),
    tickets: z.array(ticketDraftSchema).min(2).max(10),
    rationale: z.string().max(2000).optional(),
  }),
  z.object({
    decision: z.literal('reject'),
    reason: z.string().min(1).max(1200),
    suggestions: z.array(z.string()).max(8).optional(),
  }),
]);

const SYSTEM_PROMPT = `You are a ticket verification and splitting agent for an AI app builder.\n\nYour job: given a backlog ticket request, decide whether it is:\n- OK as a single build ticket (possibly with improved metadata), or\n- Too large and must be split into multiple smaller tickets with dependencies, or\n- Not eligible (already done, unclear, or dangerous) and should be rejected with suggestions.\n\nRules:\n- Prefer 'ok' whenever a single ticket is feasible.\n- If splitting, include a 'primaryTempId' representing the ticket that should replace the existing ticket (same intent, first step).\n- Each split ticket must be independently implementable.\n- Use tempIds + dependencies for ordering (dependencies may reference tempIds).\n- If the ticket requires credentials/env vars, set requiresInput=true and include inputRequests.\n- Keep descriptions actionable and scoped.\n`;

export async function POST(request: NextRequest) {
  const validation = validateAIProvider();
  if (!validation.valid) return validation.error;

  try {
    const raw = await request.json().catch(() => null);
    const parsed = inputSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { ticket, blueprint, uiStyle, existingTickets } = parsed.data;

    const contextBlock = [
      blueprint ? `BLUEPRINT:\n${JSON.stringify(blueprint, null, 2)}` : null,
      uiStyle ? `UI_STYLE:\n${JSON.stringify(uiStyle, null, 2)}` : null,
      Array.isArray(existingTickets) && existingTickets.length > 0
        ? `EXISTING_TICKETS (avoid duplicates):\n${existingTickets
          .slice(0, 120)
          .map(t => `- ${t.id}: ${t.title} (${t.status || 'unknown'})`)
          .join('\n')}`
        : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    const { object } = await generateObject({
      model: openai('gpt-5-mini'),
      schema: outputSchema,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            `TICKET_TO_VERIFY:\n${JSON.stringify(ticket, null, 2)}\n\n` +
            (contextBlock ? `${contextBlock}\n\n` : '') +
            `Return decision + updates or split tickets. If split, primaryTempId must match one of the returned tickets[].tempId.`,
        },
      ],
      temperature: 0.2,
      maxOutputTokens: 1400,
    });

    return NextResponse.json(object);
  } catch (error: any) {
    console.error('[tickets/verify] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to verify ticket' }, { status: 500 });
  }
}

