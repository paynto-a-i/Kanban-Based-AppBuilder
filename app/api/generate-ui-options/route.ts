import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { validateAIProvider } from '@/lib/api-validation';
import { appConfig } from '@/config/app.config';

export const dynamic = 'force-dynamic';

const isUsingAIGateway = !!process.env.AI_GATEWAY_API_KEY;
const aiGatewayBaseURL = 'https://ai-gateway.vercel.sh/v1';

const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.OPENAI_API_KEY,
  baseURL: isUsingAIGateway ? aiGatewayBaseURL : process.env.OPENAI_BASE_URL,
});

interface UIOption {
  id: string;
  name: string;
  description: string;
  style: string;
  vibe?: string;
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
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  layout: string;
  features: string[];
  previewPrompt: string;
}

const UI_OPTIONS_PROMPT = `You are an elite UI/UX designer and art director generating 3 stunning, visually distinct design options for a web application.

Given the user's description, create 3 DRAMATICALLY DIFFERENT design approaches. Each must be unique, creative, and push design boundaries while remaining usable and accessible.

For each option provide:
- id: "option-1", "option-2", "option-3"
- name: A memorable, evocative name for the style (e.g., "Aurora Glass", "Midnight Luxe", "Solar Burst")
- description: 3-4 rich sentences describing the visual philosophy, mood, and user experience. Paint a picture of what using this interface feels like.
- style: A short style bucket (string). Examples: modern, playful, elegant, futuristic, glassmorphic, neomorphic, brutalist, organic, retro, cyberpunk, anime
- vibe: 2-8 words describing the vibe (e.g., "sleek, premium, cinematic")
- themeKeywords: 3-8 keywords/tags that capture the aesthetic (e.g., ["anime", "kawaii", "sparkle", "pastel-neon", "sticker-ui"])
- motifs: 3-6 recurring motifs/patterns/shapes (e.g., "halftone dots", "angled panels", "soft orbs")
- typography: Object with displayFont, bodyFont, monoFont (optional), and notes (font choices should be realistic Google fonts)
- motion: Object with intensity (subtle|moderate|bold), personality (snappy|smooth|bouncy|cinematic), and notes (what animates + how)
- shapeLanguage: Object with radius (sharp|soft|pill|mixed), stroke (thin|medium|thick), and notes
- iconography: Object with style (e.g., "duotone line", "sticker icons", "pixel icons") and notes
- texture: A short description like "none", "subtle grain", "paper", "grid", "halftone"
- colorScheme: Object with primary, secondary, accent, background, text (hex colors) - use sophisticated, intentional color palettes
- layout: Detailed description of layout approach including spacing philosophy, visual hierarchy, and component arrangement
- features: Array of 5-6 specific visual features (e.g., "Soft gradient overlays", "Animated micro-interactions", "Floating card shadows", "Subtle texture patterns")
- previewPrompt: A detailed, creative prompt to generate a stunning preview image of this design

Make the 3 options DRAMATICALLY DIFFERENT:
- Option 1: Clean, sophisticated, professional - think premium SaaS, Apple-inspired minimalism
- Option 2: Bold, creative, memorable - think cutting-edge startups, unique visual identity
- Option 3: Artistic, innovative, boundary-pushing - think award-winning designs, experimental yet usable

If the user explicitly requests a theme/aesthetic (e.g., "anime", "cyberpunk", "retro", "brutalist"), ensure at least ONE option fully commits to it (not watered down).

Be creative with color palettes! Go beyond basic blues and grays. Consider:
- Rich jewel tones, earthy naturals, neon accents
- Unexpected color combinations that still work harmoniously
- Dark mode and light mode considerations

Return ONLY valid JSON:
{
  "options": [...]
}`;

export async function POST(request: NextRequest) {
  const validation = validateAIProvider();
  if (!validation.valid) {
    return validation.error;
  }

  try {
    const { prompt, context } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const modelId = appConfig.ai.defaultModel.replace('openai/', '');
    const { text } = await generateText({
      model: openai(modelId),
      messages: [
        { role: 'system', content: UI_OPTIONS_PROMPT },
        {
          role: 'user',
          content: `Generate 3 stunning, creative UI design options for: ${prompt}${context ? `\n\nAdditional context: ${context}` : ''}`
        }
      ],
      temperature: 0.8,
      maxOutputTokens: 2000,
    });

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      return NextResponse.json({ error: 'Failed to parse UI options' }, { status: 500 });
    }

    const options: UIOption[] = (parsed.options || []).map((opt: any, index: number) => ({
      id: opt.id || `option-${index + 1}`,
      name: opt.name || `Option ${index + 1}`,
      description: opt.description || '',
      style: opt.style || 'modern',
      vibe: opt.vibe || '',
      themeKeywords: opt.themeKeywords || opt.keywords || [],
      motifs: opt.motifs || [],
      typography: opt.typography || undefined,
      motion: opt.motion || undefined,
      iconography: opt.iconography || undefined,
      shapeLanguage: opt.shapeLanguage || undefined,
      texture: opt.texture || '',
      colorScheme: opt.colorScheme || {
        primary: '#3B82F6',
        secondary: '#6366F1',
        accent: '#F59E0B',
        background: '#FFFFFF',
        text: '#1F2937',
      },
      layout: opt.layout || 'Standard layout',
      features: opt.features || [],
      previewPrompt: opt.previewPrompt || '',
    }));

    return NextResponse.json({ options });
  } catch (error: any) {
    console.error('[generate-ui-options] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
