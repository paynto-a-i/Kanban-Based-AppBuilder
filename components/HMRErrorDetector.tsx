import { useEffect, useRef, useCallback } from 'react';

export interface DetectedError {
  type: 'npm-missing' | 'syntax' | 'runtime' | 'type' | 'import' | 'unknown';
  message: string;
  package?: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
}

interface HMRErrorDetectorProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onErrorDetected: (errors: DetectedError[]) => void;
  enableAutoFix?: boolean;
}

const MAX_REPORTED_ERRORS = 25;

export default function HMRErrorDetector({ 
  iframeRef, 
  onErrorDetected,
  enableAutoFix = false 
}: HMRErrorDetectorProps) {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastErrorRef = useRef<string>('');
  const reportedErrorsRef = useRef<Set<string>>(new Set());
  const lastCleanupRef = useRef<number>(Date.now());

  const parseErrorType = useCallback((errorText: string): DetectedError['type'] => {
    if (errorText.includes('Failed to resolve import') || 
        errorText.includes('Module not found') ||
        errorText.includes('Cannot find module')) {
      const importMatch = errorText.match(/Failed to resolve import "([^"]+)"/);
      if (importMatch && !importMatch[1].startsWith('.')) {
        return 'npm-missing';
      }
      return 'import';
    }
    
    if (errorText.includes('Unexpected token') ||
        errorText.includes('Unterminated') ||
        errorText.includes('SyntaxError') ||
        errorText.includes('Parse error') ||
        errorText.includes('Expected')) {
      return 'syntax';
    }
    
    if (errorText.includes('Cannot read prop') ||
        errorText.includes('is not defined') ||
        errorText.includes('ReferenceError') ||
        errorText.includes('null') ||
        errorText.includes('undefined')) {
      return 'runtime';
    }
    
    if (errorText.includes('is not a function') ||
        errorText.includes('TypeError') ||
        errorText.includes('Type error')) {
      return 'type';
    }
    
    return 'unknown';
  }, []);

  const extractFileInfo = useCallback((errorText: string, frameText?: string): { file?: string; line?: number; column?: number } => {
    const patterns = [
      /(?:\/home\/user\/app\/|\/vercel\/sandbox\/)?([^\s:]+\.(jsx?|tsx?|css)):(\d+)(?::(\d+))?/,
      /at\s+([^\s]+\.(jsx?|tsx?))\s*:\s*(\d+)(?::(\d+))?/,
      /in\s+([^\s]+\.(jsx?|tsx?))\s+\(line\s+(\d+)/i,
      /File:\s*([^\s]+\.(jsx?|tsx?|css))/i
    ];
    
    const searchText = frameText ? `${errorText}\n${frameText}` : errorText;
    
    for (const pattern of patterns) {
      const match = searchText.match(pattern);
      if (match) {
        return {
          file: match[1],
          line: match[3] ? parseInt(match[3], 10) : undefined,
          column: match[4] ? parseInt(match[4], 10) : undefined
        };
      }
    }
    
    return {};
  }, []);

  const extractPackageName = useCallback((errorText: string): string | undefined => {
    const importMatch = errorText.match(/Failed to resolve import "([^"]+)"/);
    if (importMatch) {
      const packageName = importMatch[1];
      if (!packageName.startsWith('.')) {
        if (packageName.startsWith('@')) {
          const parts = packageName.split('/');
          return parts.length >= 2 ? parts.slice(0, 2).join('/') : packageName;
        }
        return packageName.split('/')[0];
      }
    }
    return undefined;
  }, []);

  useEffect(() => {
    const checkForHMRErrors = () => {
      if (!iframeRef.current) return;

      try {
        const iframeDoc = iframeRef.current.contentDocument;
        if (!iframeDoc) return;

        const errors: DetectedError[] = [];

        const errorOverlay = iframeDoc.querySelector('vite-error-overlay');
        if (errorOverlay) {
          const shadowRoot = errorOverlay.shadowRoot;
          if (shadowRoot) {
            const messageElement = shadowRoot.querySelector('.message-body');
            const fileElement = shadowRoot.querySelector('.file');
            const frameElement = shadowRoot.querySelector('.frame');
            const tipElement = shadowRoot.querySelector('.tip');
            
            let errorText = messageElement?.textContent || '';
            const fileInfo = fileElement?.textContent || '';
            const frameText = frameElement?.textContent || '';
            const tipText = tipElement?.textContent || '';
            
            if (fileInfo) {
              errorText = `${errorText}\n${fileInfo}`;
            }
            
            if (errorText) {
              const errorKey = errorText.substring(0, 200);
              
              if (errorKey !== lastErrorRef.current && !reportedErrorsRef.current.has(errorKey)) {
                lastErrorRef.current = errorKey;
                reportedErrorsRef.current.add(errorKey);
                
                const now = Date.now();
                if (reportedErrorsRef.current.size > MAX_REPORTED_ERRORS || now - lastCleanupRef.current > 60000) {
                  const entries = Array.from(reportedErrorsRef.current);
                  reportedErrorsRef.current = new Set(entries.slice(-MAX_REPORTED_ERRORS));
                  lastCleanupRef.current = now;
                }
                
                const errorType = parseErrorType(errorText);
                const { file, line, column } = extractFileInfo(errorText, frameText);
                const packageName = extractPackageName(errorText);
                
                const detectedError: DetectedError = {
                  type: errorType,
                  message: errorText.trim(),
                  file,
                  line,
                  column,
                  stack: frameText || undefined,
                  package: packageName
                };
                
                errors.push(detectedError);
                
                console.log('[HMRErrorDetector] Detected error:', {
                  type: errorType,
                  file,
                  line,
                  message: errorText.substring(0, 100)
                });
                
                if (enableAutoFix && errorType !== 'npm-missing') {
                  reportErrorForAutoFix(detectedError);
                }
              }
            }
          }
        }

        const consoleErrors = iframeDoc.querySelectorAll('.error, [data-error], .console-error');
        consoleErrors.forEach((el) => {
          const errorText = el.textContent || '';
          if (errorText && !reportedErrorsRef.current.has(errorText.substring(0, 200))) {
            const errorType = parseErrorType(errorText);
            const { file, line, column } = extractFileInfo(errorText);
            
            errors.push({
              type: errorType,
              message: errorText.trim(),
              file,
              line,
              column
            });
          }
        });

        if (errors.length > 0) {
          onErrorDetected(errors);
        }
        
      } catch {
      }
    };

    checkForHMRErrors();
    checkIntervalRef.current = setInterval(checkForHMRErrors, 2000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [iframeRef, onErrorDetected, parseErrorType, extractFileInfo, extractPackageName, enableAutoFix]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'vite-error' || 
          event.data?.type === 'runtime-error' ||
          event.data?.type === 'console-error') {
        
        const errorText = event.data.message || event.data.error || '';
        const errorKey = errorText.substring(0, 200);
        
        if (!reportedErrorsRef.current.has(errorKey)) {
          reportedErrorsRef.current.add(errorKey);
          
          const errorType = parseErrorType(errorText);
          const { file, line, column } = extractFileInfo(errorText, event.data.stack);
          const packageName = extractPackageName(errorText);
          
          const detectedError: DetectedError = {
            type: errorType,
            message: errorText,
            file: file || event.data.file,
            line: line || event.data.line,
            column: column || event.data.column,
            stack: event.data.stack,
            package: packageName
          };
          
          onErrorDetected([detectedError]);
          
          if (enableAutoFix && errorType !== 'npm-missing') {
            reportErrorForAutoFix(detectedError);
          }
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onErrorDetected, parseErrorType, extractFileInfo, extractPackageName, enableAutoFix]);

  return null;
}

async function reportErrorForAutoFix(error: DetectedError): Promise<void> {
  try {
    await fetch('/api/report-vite-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        file: error.file,
        type: error.type,
        line: error.line,
        column: error.column,
        stack: error.stack,
        autoFix: true
      })
    });
  } catch (e) {
    console.error('[HMRErrorDetector] Failed to report error for auto-fix:', e);
  }
}