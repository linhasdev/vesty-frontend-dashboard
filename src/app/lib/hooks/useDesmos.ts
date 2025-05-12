import { useRef, useEffect } from 'react';

// Define the Desmos calculator type
interface DesmosCalculator {
  destroy: () => void;
  setExpression: (options: { id: string; latex: string }) => void;
  resize: () => void;
}

// Define options for the Desmos calculator
interface DesmosOptions {
  expressions?: boolean;
  keypad?: boolean;
  graphpaper?: boolean;
  settingsMenu?: boolean;
  zoomButtons?: boolean;
  expressionsTopbar?: boolean;
  border?: boolean;
  lockViewport?: boolean;
  [key: string]: any;
}

/**
 * Hook to initialize and manage a Desmos calculator instance
 * @param options - Configuration options for the Desmos calculator
 * @returns Object containing the container ref and calculator instance
 */
export function useDesmos(options: DesmosOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<DesmosCalculator | null>(null);
  const scriptLoadedRef = useRef(false);

  // Default options
  const calculatorOptions: DesmosOptions = {
    expressions: true,
    keypad: true,
    graphpaper: true,
    settingsMenu: true,
    zoomButtons: true,
    expressionsTopbar: true,
    border: true,
    ...options
  };

  // Load Desmos calculator script
  const loadScript = () => {
    // Check if Desmos is already loaded in window
    if (scriptLoadedRef.current || typeof window !== 'undefined' && 'Desmos' in window) {
      scriptLoadedRef.current = true;
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://www.desmos.com/api/v1.10/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        resolve();
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  // Initialize the calculator
  const initializeCalculator = async () => {
    if (!containerRef.current) return;
    
    try {
      await loadScript();
      
      // Clean up previous instance if it exists
      if (calculatorRef.current) {
        calculatorRef.current.destroy();
      }
      
      // Create new calculator instance with TS casting to handle typing issues
      const Desmos = (window as any).Desmos;
      if (Desmos && Desmos.GraphingCalculator) {
        calculatorRef.current = Desmos.GraphingCalculator(
          containerRef.current,
          calculatorOptions
        ) as DesmosCalculator;
      } else {
        console.error('Desmos is not available');
      }
    } catch (error) {
      console.error('Failed to initialize Desmos calculator:', error);
    }
  };

  // Handle resize events
  useEffect(() => {
    const handleResize = () => {
      if (calculatorRef.current) {
        calculatorRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Clean up calculator on unmount
  useEffect(() => {
    return () => {
      if (calculatorRef.current) {
        calculatorRef.current.destroy();
      }
    };
  }, []);

  return {
    containerRef,
    calculator: calculatorRef,
    initialize: initializeCalculator
  };
} 