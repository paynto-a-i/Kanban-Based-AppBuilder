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

const inputSchema = z.object({
  message: z.string().min(1).max(4000),
  // Optional context for better ticket shaping/splitting
  blueprint: z.any().optional(),
  uiStyle: z.any().optional(),
  existingTickets: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .max(300)
    .optional(),
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
  /**
   * A stable ID for dependency wiring within this response.
   * The client will map tempIds → real ticket IDs after insertion.
   */
  tempId: z.string().min(1).max(60),
  title: z.string().min(3).max(120),
  description: z.string().min(0).max(1200),
  type: z.enum(['component', 'feature', 'layout', 'styling', 'integration', 'config', 'database']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  complexity: z.enum(['XS', 'S', 'M', 'L', 'XL']),
  estimatedFiles: z.number().int().min(1).max(20),
  /**
   * Dependencies can reference:
   * - another tempId from this same response, or
   * - an existing ticket ID (if known from context).
   */
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

const outputSchema = z.object({
  tickets: z.array(ticketDraftSchema).min(1).max(8),
  rationale: z.string().max(2000).optional(),
});

const SYSTEM_PROMPT = `You convert user requests into Kanban tickets for an AI app builder.\n\nYou MUST return structured JSON that matches the schema.\n\nGuidelines:\n- Prefer 1 ticket when feasible.\n- If the request is large, split into multiple small tickets with clear dependency ordering.\n- Keep each ticket independently buildable and testable.\n- Avoid duplicates: if the request is already covered by existing tickets, create a small refinement ticket instead.\n- Use sensible defaults for type/priority/complexity/estimatedFiles.\n- If the user request needs credentials/API keys/env vars, set requiresInput=true and add inputRequests.\n`;

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

    const { message, blueprint, uiStyle, existingTickets } = parsed.data;

    const contextBlock = [
      blueprint ? `BLUEPRINT (high-level contract):\n${JSON.stringify(blueprint, null, 2)}` : null,
      uiStyle ? `UI_STYLE (keep consistent):\n${JSON.stringify(uiStyle, null, 2)}` : null,
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
            `User message:\n${message}\n\n` +
            (contextBlock ? `${contextBlock}\n\n` : '') +
            `Return tickets for the message. If you split, ensure dependencies form a DAG and reference tempIds.`,
        },
      ],
      temperature: 0.2,
      maxOutputTokens: 1200,
    });

    return NextResponse.json({
      tickets: object.tickets,
      rationale: object.rationale,
    });
  } catch (error: any) {
    console.error('[tickets/from-chat] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate ticket(s)' }, { status: 500 });
  }
}

