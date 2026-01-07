import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ErrorInfo {
  type: 'syntax' | 'runtime' | 'import' | 'type' | 'unknown';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
}

interface FixAttempt {
  timestamp: number;
  error: ErrorInfo;
  status: 'pending' | 'fixing' | 'success' | 'failed';
  attemptNumber: number;
}

type AgentStatus = 'idle' | 'detecting' | 'fixing' | 'success' | 'failed';

interface ErrorCorrectionAgentProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  sandboxId?: string;
  enabled?: boolean;
  maxRetries?: number;
  onFixApplied?: (file: string, success: boolean) => void;
  onStatusChange?: (status: AgentStatus) => void;
}

const RETRY_DELAYS = [1000, 2000, 4000];

function parseErrorText(errorText: string, source?: string): ErrorInfo {
  let type: ErrorInfo['type'] = 'unknown';
  let file: string | undefined;
  let line: number | undefined;
  let column: number | undefined;

  if (errorText.includes('Unexpected token') || 
      errorText.includes('Unterminated') ||
      errorText.includes('SyntaxError') ||
      errorText.includes('Parse error')) {
    type = 'syntax';
  } else if (errorText.includes('Cannot read prop') ||
             errorText.includes('is not defined') ||
             errorText.includes('ReferenceError') ||
             errorText.includes('TypeError')) {
    type = 'runtime';
  } else if (errorText.includes('Failed to resolve import') ||
             errorText.includes('Module not found') ||
             errorText.includes('Cannot find module')) {
    type = 'import';
  } else if (errorText.includes('is not a function') ||
             errorText.includes('Expected') ||
             errorText.includes('Type error')) {
    type = 'type';
  }

  const fileMatch = errorText.match(/(?:\/home\/user\/app\/|\/vercel\/sandbox\/)?([^\s:]+\.(jsx?|tsx?|css)):(\d+)(?::(\d+))?/);
  if (fileMatch) {
    file = fileMatch[1];
    line = parseInt(fileMatch[3], 10);
    column = fileMatch[4] ? parseInt(fileMatch[4], 10) : undefined;
  }

  const altFileMatch = errorText.match(/in\s+([^\s]+\.(jsx?|tsx?))\s+\(line\s+(\d+)/i);
  if (!file && altFileMatch) {
    file = altFileMatch[1];
    line = parseInt(altFileMatch[3], 10);
  }

  return {
    type,
    message: errorText,
    file,
    line,
    column,
    stack: source
  };
}

export default function ErrorCorrectionAgent({
  iframeRef,
  sandboxId,
  enabled = true,
  maxRetries = 3,
  onFixApplied,
  onStatusChange
}: ErrorCorrectionAgentProps) {
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);
  const [fixAttempts, setFixAttempts] = useState<FixAttempt[]>([]);
  const [message, setMessage] = useState<string>('');
  
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const stateRef = useRef({
    fixing: false,
    lastError: '',
    attemptCount: 0,
    pendingError: null as ErrorInfo | null
  });

  const updateStatus = useCallback((newStatus: AgentStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  const cleanup = useCallback(() => {
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
  }, []);

  const resetState = useCallback(() => {
    stateRef.current = {
      fixing: false,
      lastError: '',
      attemptCount: 0,
      pendingError: null
    };
  }, []);

  const attemptFix = useCallback(async (error: ErrorInfo): Promise<void> => {
    const state = stateRef.current;
    
    if (state.fixing) {
      state.pendingError = error;
      console.log('[ErrorCorrectionAgent] Fix in progress, queuing error');
      return;
    }
    
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    
    state.attemptCount++;
    const attemptNumber = state.attemptCount;
    
    if (attemptNumber > maxRetries) {
      console.log('[ErrorCorrectionAgent] Max retries reached');
      setMessage(`Failed to fix after ${maxRetries} attempts`);
      updateStatus('failed');
      resetState();
      return;
    }
    
    state.fixing = true;
    updateStatus('fixing');
    setMessage(`Attempting fix (${attemptNumber}/${maxRetries})...`);
    
    const attempt: FixAttempt = {
      timestamp: Date.now(),
      error,
      status: 'fixing',
      attemptNumber
    };
    setFixAttempts(prev => [...prev, attempt]);
    
    try {
      console.log(`[ErrorCorrectionAgent] Attempt ${attemptNumber}: Calling auto-fix API`);
      
      const response = await fetch('/api/auto-fix-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error,
          sandboxId,
          attemptNumber
        })
      });
      
      const result = await response.json();
      
      if (!result.success || !result.fix || typeof result.fix.path !== 'string' || typeof result.fix.content !== 'string') {
        throw new Error(result.error || 'Invalid fix response');
      }
      
      console.log('[ErrorCorrectionAgent] Got fix for:', result.fix.path);
      setMessage(`Applying fix to ${result.fix.path}...`);
      
      const applyResponse = await fetch('/api/apply-ai-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: `<file path="${result.fix.path}">\n${result.fix.content}\n</file>`,
          sandboxId,
          isAutoFix: true
        })
      });
      
      const applyResult = await applyResponse.json();
      
      if (!applyResult.success) {
        throw new Error(applyResult.error || 'Failed to apply fix');
      }
      
      console.log('[ErrorCorrectionAgent] Fix applied successfully');
      
      setFixAttempts(prev => 
        prev.map(a => 
          a.timestamp === attempt.timestamp 
            ? { ...a, status: 'success' as const }
            : a
        )
      );
      
      setMessage('Fix applied! Waiting for rebuild...');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      resetState();
      updateStatus('success');
      setMessage('Error fixed successfully!');
      onFixApplied?.(result.fix.path, true);
      
      successTimeoutRef.current = setTimeout(() => {
        const pending = stateRef.current.pendingError;
        if (pending) {
          stateRef.current.pendingError = null;
          setCurrentError(pending);
          updateStatus('detecting');
          attemptFix(pending);
        } else {
          updateStatus('idle');
          setMessage('');
          setCurrentError(null);
          setFixAttempts([]);
        }
      }, 3000);
      
    } catch (err) {
      console.error('[ErrorCorrectionAgent] Fix attempt failed:', err);
      
      setFixAttempts(prev => 
        prev.map(a => 
          a.timestamp === attempt.timestamp 
            ? { ...a, status: 'failed' as const }
            : a
        )
      );
      
      state.fixing = false;
      
      if (attemptNumber < maxRetries) {
        const delay = RETRY_DELAYS[attemptNumber - 1] || 4000;
        setMessage(`Fix failed. Retrying in ${delay / 1000}s...`);
        
        retryTimeoutRef.current = setTimeout(() => {
          attemptFix(error);
        }, delay);
      } else {
        updateStatus('failed');
        setMessage(`Unable to auto-fix: ${(err as Error).message}`);
        onFixApplied?.(error.file || 'unknown', false);
        
        retryTimeoutRef.current = setTimeout(() => {
          resetState();
          const pending = stateRef.current.pendingError;
          if (pending) {
            stateRef.current.pendingError = null;
            setCurrentError(pending);
            updateStatus('detecting');
            attemptFix(pending);
          }
        }, 5000);
      }
    }
  }, [sandboxId, maxRetries, updateStatus, onFixApplied, resetState]);

  const checkForErrors = useCallback(() => {
    if (!iframeRef.current || !enabled) return;
    
    const state = stateRef.current;
    if (state.fixing) return;

    try {
      const iframeDoc = iframeRef.current.contentDocument;
      if (!iframeDoc) return;

      const viteOverlay = iframeDoc.querySelector('vite-error-overlay');
      if (viteOverlay) {
        const shadowRoot = viteOverlay.shadowRoot;
        if (shadowRoot) {
          const messageBody = shadowRoot.querySelector('.message-body');
          const fileElement = shadowRoot.querySelector('.file');
          const frameElement = shadowRoot.querySelector('.frame');
          
          let errorMessage = messageBody?.textContent || '';
          const fileInfo = fileElement?.textContent || '';
          const stackInfo = frameElement?.textContent || '';
          
          if (fileInfo) {
            errorMessage += `\n${fileInfo}`;
          }
          
          if (errorMessage && errorMessage !== state.lastError) {
            console.log('[ErrorCorrectionAgent] Detected Vite error:', errorMessage.substring(0, 100));
            state.lastError = errorMessage;
            state.attemptCount = 0;
            
            const errorInfo = parseErrorText(errorMessage, stackInfo);
            setCurrentError(errorInfo);
            updateStatus('detecting');
            attemptFix(errorInfo);
          }
        }
        return;
      }

      const errorBoundary = iframeDoc.querySelector('[data-error-boundary]');
      if (errorBoundary) {
        const errorText = errorBoundary.textContent || '';
        if (errorText && errorText !== state.lastError) {
          console.log('[ErrorCorrectionAgent] Detected React error boundary:', errorText.substring(0, 100));
          state.lastError = errorText;
          state.attemptCount = 0;
          
          const errorInfo = parseErrorText(errorText);
          setCurrentError(errorInfo);
          updateStatus('detecting');
          attemptFix(errorInfo);
        }
        return;
      }
      
      if (state.lastError && !state.fixing) {
        console.log('[ErrorCorrectionAgent] Error cleared from iframe');
        state.lastError = '';
      }

    } catch (e) {
    }
  }, [iframeRef, enabled, updateStatus, attemptFix]);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }
    
    checkForErrors();
    checkIntervalRef.current = setInterval(checkForErrors, 2000);
    
    return cleanup;
  }, [enabled, checkForErrors, cleanup]);

  useEffect(() => {
    if (!enabled || !iframeRef.current) return;
    
    const iframe = iframeRef.current;
    const handleMessage = (event: MessageEvent) => {
      try {
        const iframeOrigin = iframe.src ? new URL(iframe.src).origin : null;
        if (iframeOrigin && event.origin !== iframeOrigin) {
          return;
        }
      } catch {
      }

      if (event.data?.type === 'vite-error' || event.data?.type === 'runtime-error') {
        const state = stateRef.current;
        const message = typeof event.data.message === 'string' ? event.data.message : '';
        const errorInfo = parseErrorText(message, event.data.stack);
        
        if (errorInfo.message !== state.lastError) {
          state.lastError = errorInfo.message;
          
          if (state.fixing) {
            state.pendingError = errorInfo;
          } else {
            state.attemptCount = 0;
            setCurrentError(errorInfo);
            updateStatus('detecting');
            attemptFix(errorInfo);
          }
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [enabled, iframeRef, attemptFix, updateStatus]);

  if (!enabled || status === 'idle') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
      <div className={`px-4 py-2 flex items-center gap-2 ${
        status === 'success' ? 'bg-green-900/50' :
        status === 'failed' ? 'bg-red-900/50' :
        'bg-blue-900/50'
      }`}>
        {status === 'fixing' && <Loader2 className="w-4 h-4 animate-spin" />}
        {status === 'detecting' && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
        {status === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
        {status === 'failed' && <XCircle className="w-4 h-4 text-red-400" />}
        <span className="text-sm font-medium text-white">
          {status === 'detecting' && 'Error Detected'}
          {status === 'fixing' && 'Auto-Fixing...'}
          {status === 'success' && 'Fixed!'}
          {status === 'failed' && 'Fix Failed'}
        </span>
      </div>
      
      <div className="p-4">
        {currentError && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">
              {currentError.type.toUpperCase()} ERROR
              {currentError.file && ` in ${currentError.file}`}
              {currentError.line && `:${currentError.line}`}
            </div>
            <div className="text-gray-300 font-mono text-xs bg-gray-800 p-2 rounded max-h-20 overflow-y-auto">
              {currentError.message.substring(0, 200)}
              {currentError.message.length > 200 && '...'}
            </div>
          </div>
        )}
        
        {message && (
          <div className="text-sm text-gray-300">
            {message}
          </div>
        )}
        
        {fixAttempts.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-400 mb-2">Fix Attempts:</div>
            <div className="space-y-1">
              {fixAttempts.slice(-3).map((attempt, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {attempt.status === 'pending' && <div className="w-2 h-2 bg-gray-500 rounded-full" />}
                  {attempt.status === 'fixing' && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
                  {attempt.status === 'success' && <CheckCircle className="w-3 h-3 text-green-400" />}
                  {attempt.status === 'failed' && <XCircle className="w-3 h-3 text-red-400" />}
                  <span className="text-gray-400">
                    Attempt {attempt.attemptNumber}: {attempt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
