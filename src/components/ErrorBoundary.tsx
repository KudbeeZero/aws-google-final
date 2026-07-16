import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white border border-rose-200 p-6 rounded-sm shadow-lg max-w-md w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-rose-100 p-2 rounded-full">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Application Error</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              We encountered an unexpected error. This might be due to a network issue or an invalid state.
            </p>
            {this.state.error && (
              <div className="bg-slate-100 p-3 rounded text-xs font-mono text-slate-700 overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-[#FF9900] hover:bg-amber-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
