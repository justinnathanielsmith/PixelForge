
import React, { ErrorInfo, ReactNode, Component } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary catches JavaScript errors anywhere in their child component tree.
 */
// Fix: Explicitly declare state and props to ensure the TypeScript compiler recognizes them on the class instance.
export class ErrorBoundary extends Component<Props, State> {
  public state: State;
  public props: Props;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    // Use this.state for access to the class component state
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0c0a09] text-[#d6d3d1] flex items-center justify-center p-4 font-serif">
          <div className="max-w-md w-full bg-[#1c1917] border-2 border-red-900/50 p-6 shadow-[0_0_20px_rgba(127,29,29,0.3)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-800 to-transparent"></div>
            
            <div className="text-center space-y-4">
              <div className="text-4xl">💥</div>
              <h1 className="text-xl font-bold text-red-500 uppercase tracking-widest" style={{ fontFamily: 'Cinzel, serif' }}>
                Magical Backfire
              </h1>
              <p className="text-stone-500 text-sm">
                The spell structure has collapsed. The mana weave was too complex for this reality layer.
              </p>
              
              <div className="bg-black/50 p-3 rounded border border-red-900/30 text-left overflow-auto max-h-32">
                <code className="text-[10px] text-red-400 font-mono">
                  {this.state.error?.message || "Unknown anomaly detected."}
                </code>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-red-900/20 border border-red-800 text-red-400 hover:bg-red-900/40 hover:text-red-200 transition-all text-xs font-bold uppercase tracking-wider"
              >
                Reconstruct Reality
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Use this.props for access to the class component props
    return this.props.children;
  }
}
