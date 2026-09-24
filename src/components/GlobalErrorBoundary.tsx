import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error logged in GlobalErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          id="global-error-boundary-fallback"
          className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100" 
          dir="rtl"
        >
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl text-center space-y-4 backdrop-blur-sm">
            <div className="w-16 h-16 bg-red-950/60 border border-red-500/40 rounded-2xl flex items-center justify-center mx-auto text-red-400 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-red-400">حدث استثناء غير متوقع</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                تم احتواء الخلل بنجاح لمنع انهيار الواجهة وتأمين بياناتك.
              </p>
              {this.state.error?.message && (
                <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 text-left overflow-x-auto max-h-24">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                id="btn-error-retry"
                type="button"
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة محاولة التشغيل
              </button>

              <button
                id="btn-error-reload"
                type="button"
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                تحديث الصفحة
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
