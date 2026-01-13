import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Header } from './layout/Header';
import { Footer } from './layout/Footer';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {

  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0E0E0E] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
          <Header />

          <div className="flex-1 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full text-center">
              <div className="mb-6">
                <div className="text-6xl font-bold text-[#B4975A] mb-4">Oops!</div>
                <h1 className="text-2xl font-bold text-[#F5F5F5] mb-2">Something went wrong</h1>
                <p className="text-[#F5F5F5]/60">
                  We're sorry, but something unexpected happened. Our team has been notified.
                </p>
              </div>

              {import.meta.env.DEV && this.state.error && (
                <div className="mb-6 p-4 bg-[#C75B5B]/10 border border-[#C75B5B]/30 rounded text-left">
                  <p className="text-[#C75B5B] text-sm font-mono break-all">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full px-6 py-3 bg-[#B4975A] text-[#0E0E0E] font-semibold rounded hover:bg-[#B4975A]/90 transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-3 border border-[#F5F5F5]/20 text-[#F5F5F5] font-semibold rounded hover:bg-[#F5F5F5]/5 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>

          <Footer />
        </div>
      );
    }

    return this.props.children;
  }
}
