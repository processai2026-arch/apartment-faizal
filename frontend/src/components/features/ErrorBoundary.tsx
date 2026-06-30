import React from 'react';

interface State {
  hasError: boolean;
  error?: Error;
}

interface Props {
  children: React.ReactNode;
  /** Custom fallback UI to show when an error is caught. */
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-slate-500">
            <span className="text-2xl" aria-hidden="true">
              ⚠️
            </span>
            <p className="text-sm">Something went wrong. Please refresh.</p>
            <button
              className="text-xs text-indigo-600 underline hover:text-indigo-800"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
