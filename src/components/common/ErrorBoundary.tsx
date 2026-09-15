import React, { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Anchor, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Maritime Dispatch Error Boundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      // Safe reload or reset
      window.location.hash = '';
    }
  };

  private handleHardReload = () => {
    try {
      // Preserve essential preferences while clearing corrupted session data
      const theme = localStorage.getItem('ferryflow_theme_mode');
      const lang = localStorage.getItem('ferryflow_interface_lang');
      localStorage.clear();
      if (theme) localStorage.setItem('ferryflow_theme_mode', theme);
      if (lang) localStorage.setItem('ferryflow_interface_lang', lang);
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[500px] flex items-center justify-center p-6 bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
          <div className="max-w-lg w-full bg-slate-900 border border-cyan-800/60 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800/60">
                Maritime Dispatch System Recovery
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Temporary Interface Disruption Intercepted
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {this.props.fallbackMessage ||
                  'The view encountered an unexpected state variation. Fleet telemetry and navigation transponders remain operational.'}
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-left">
                <p className="text-[11px] font-mono text-red-400 font-semibold truncate">
                  {this.state.error.name}: {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-cyan-950/40"
              >
                <Home className="w-4 h-4" />
                Return to Safe Home View
              </button>
              <button
                type="button"
                onClick={this.handleHardReload}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-medium text-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Reset System State
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Anchor className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mumbai Maritime Board — Fail-Safe Automated Guard</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
