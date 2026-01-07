import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';

export const dynamic = 'force-dynamic';

const isUsingAIGateway = !!process.env.AI_GATEWAY_API_KEY;
const aiGatewayBaseURL = 'https://ai-gateway.vercel.sh/v1';

const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.OPENAI_API_KEY,
  baseURL: isUsingAIGateway ? aiGatewayBaseURL : process.env.OPENAI_BASE_URL,
});

const groq = createGroq({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.GROQ_API_KEY,
  baseURL: isUsingAIGateway ? aiGatewayBaseURL : undefined,
});

interface ErrorDetails {
  type: 'syntax' | 'runtime' | 'import' | 'type' | 'unknown';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
}

interface FileContent {
  path: string;
  content: string;
}

declare global {
  var sandboxState: {
    fileCache?: {
      files: Record<string, { content: string; lastModified: number }>;
      manifest?: any;
      lastSync: number;
      sandboxId: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const { error, sandboxId, attemptNumber = 1 } = await request.json();
    
    console.log('[auto-fix-error] Received error:', {
      type: error?.type,
      message: error?.message?.substring(0, 100),
      file: error?.file,
      line: error?.line,
      attemptNumber
    });
    
    if (!error || !error.message) {
      return NextResponse.json({
        success: false,
        error: 'Error details are required'
      }, { status: 400 });
    }
    
    const errorDetails: ErrorDetails = {
      type: error.type || 'unknown',
      message: error.message,
      file: error.file,
      line: error.line,
      column: error.column,
      stack: error.stack
    };
    
    const affectedFile = await getAffectedFileContent(errorDetails);
    
    if (!affectedFile) {
      console.log('[auto-fix-error] Could not find affected file content');
      return NextResponse.json({
        success: false,
        error: 'Could not locate the file with the error'
      }, { status: 404 });
    }
    
    console.log('[auto-fix-error] Found affected file:', affectedFile.path);
    
    const systemPrompt = buildFixPrompt(errorDetails, affectedFile);
    
    const useGroq = process.env.GROQ_API_KEY && attemptNumber <= 2;
    const provider = useGroq ? groq : openai;
    const modelName = useGroq ? 'moonshotai/kimi-k2-instruct-0905' : 'gpt-4-turbo';
    
    console.log(`[auto-fix-error] Using ${useGroq ? 'Groq (Kimi)' : 'OpenAI'} for fix generation`);
    
    const result = await streamText({
      model: provider(modelName),
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Fix the following error:\n\nError: ${errorDetails.message}\n\nFile: ${affectedFile.path}\nLine: ${errorDetails.line || 'unknown'}\n\nProvide the complete fixed file content.`
        }
      ],
      temperature: 0.3,
      maxTokens: 4096
    });
    
    let fixedCode = '';
    for await (const chunk of result.textStream) {
      fixedCode += chunk;
    }
    
    const parsedFix = parseFixResponse(fixedCode, affectedFile.path);
    
    if (!parsedFix) {
      console.log('[auto-fix-error] Could not parse fix response');
      return NextResponse.json({
        success: false,
        error: 'Could not generate a valid fix'
      }, { status: 500 });
    }
    
    console.log('[auto-fix-error] Successfully generated fix for:', parsedFix.path);
    
    return NextResponse.json({
      success: true,
      fix: parsedFix,
      errorType: errorDetails.type,
      attemptNumber
    });
    
  } catch (error) {
    console.error('[auto-fix-error] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

async function getAffectedFileContent(error: ErrorDetails): Promise<FileContent | null> {
  if (!error.file) {
    if (error.stack) {
      const fileMatch = error.stack.match(/\/([^\/]+\.(jsx?|tsx?|css))[:@]/);
      if (fileMatch) {
        error.file = `src/${fileMatch[1]}`;
      }
    }
    
    if (!error.file && error.message) {
      const pathMatch = error.message.match(/(?:\/home\/user\/app\/|\/vercel\/sandbox\/)?src\/([^\s:]+\.(jsx?|tsx?|css))/);
      if (pathMatch) {
        error.file = `src/${pathMatch[1]}`;
      }
    }
  }
  
  if (!error.file) {
    return null;
  }
  
  let normalizedPath = error.file
    .replace('/home/user/app/', '')
    .replace('/vercel/sandbox/', '')
    .replace(/^\//, '');
  
  if (!normalizedPath.startsWith('src/')) {
    normalizedPath = `src/${normalizedPath}`;
  }
  
  const fileCache = global.sandboxState?.fileCache?.files;
  if (!fileCache) {
    console.log('[auto-fix-error] No file cache available');
    return null;
  }
  
  const possiblePaths = [
    normalizedPath,
    normalizedPath.replace('src/', ''),
    `src/components/${normalizedPath.split('/').pop()}`,
    normalizedPath.replace('.jsx', '.tsx').replace('.js', '.ts')
  ];
  
  for (const path of possiblePaths) {
    if (fileCache[path]) {
      return {
        path,
        content: fileCache[path].content
      };
    }
  }
  
  const fileName = normalizedPath.split('/').pop()?.toLowerCase();
  if (fileName) {
    for (const [path, data] of Object.entries(fileCache)) {
      if (path.toLowerCase().endsWith(fileName)) {
        return {
          path,
          content: data.content
        };
      }
    }
  }
  
  return null;
}

function buildFixPrompt(error: ErrorDetails, file: FileContent): string {
  const errorTypeInstructions: Record<string, string> = {
    syntax: `This is a SYNTAX ERROR. Common causes:
- Missing closing brackets, parentheses, or braces
- Unterminated string literals
- Missing semicolons (in strict mode)
- Invalid JSX syntax (unclosed tags, missing />)
- Incorrect use of reserved keywords

Look for the exact line mentioned and check surrounding code for these issues.`,
    
    runtime: `This is a RUNTIME ERROR. Common causes:
- Accessing properties on undefined/null (check optional chaining ?.)
- Calling undefined functions (check imports and function definitions)
- Array index out of bounds
- Invalid function arguments

Ensure all variables are properly initialized and all function calls are valid.`,
    
    import: `This is an IMPORT ERROR. Common causes:
- Package not installed (but we'll handle that separately)
- Incorrect import path (relative vs absolute)
- Named vs default export mismatch
- Circular dependencies

Check the import statement and ensure the export exists in the source file.`,
    
    type: `This is a TYPE ERROR. Common causes:
- Calling a non-function as a function
- Wrong number/type of arguments
- Property doesn't exist on type
- Missing required props in React components

Verify the types and ensure proper prop passing.`,
    
    unknown: `Analyze the error message carefully and fix the root cause.`
  };
  
  return `You are an expert code fixer. Your job is to fix errors in React/TypeScript code.

ERROR TYPE: ${error.type}
${errorTypeInstructions[error.type]}

RULES:
1. Output ONLY the fixed file content - no explanations
2. Preserve ALL existing functionality - only fix the error
3. Use standard Tailwind CSS classes (no custom theme values like bg-background)
4. Ensure all imports are correct
5. Ensure all JSX tags are properly closed
6. The file must be syntactically valid

CURRENT FILE (${file.path}):
\`\`\`
${file.content}
\`\`\`

ERROR MESSAGE:
${error.message}
${error.line ? `Line: ${error.line}` : ''}
${error.stack ? `Stack: ${error.stack.substring(0, 500)}` : ''}

Provide the COMPLETE fixed file wrapped in <file path="${file.path}">...</file> tags.
Do NOT truncate or abbreviate any code.`;
}

function parseFixResponse(response: string, expectedPath: string): FileContent | null {
  const fileMatch = response.match(/<file path="([^"]+)">([\s\S]*?)<\/file>/);
  if (fileMatch) {
    return {
      path: fileMatch[1],
      content: fileMatch[2].trim()
    };
  }
  
  const codeBlockMatch = response.match(/```(?:jsx?|tsx?|javascript|typescript)?\n([\s\S]*?)```/);
  if (codeBlockMatch) {
    return {
      path: expectedPath,
      content: codeBlockMatch[1].trim()
    };
  }
  
  if (response.includes('import ') || response.includes('export ') || response.includes('function ')) {
    const cleanedResponse = response
      .replace(/^Here['']s the fixed.*$/gm, '')
      .replace(/^The error was.*$/gm, '')
      .replace(/^I['']ve fixed.*$/gm, '')
      .trim();
    
    if (cleanedResponse.length > 50) {
      return {
        path: expectedPath,
        content: cleanedResponse
      };
    }
  }
  
  return null;
}
