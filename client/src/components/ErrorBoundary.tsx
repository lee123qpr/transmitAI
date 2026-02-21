import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                    <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-red-100 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                            <AlertTriangle size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
                        <p className="text-slate-600 mb-6">
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors"
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-colors"
                            >
                                Go Home
                            </button>
                        </div>
                        {this.state.error && import.meta.env.DEV && (
                            <div className="mt-8 text-left bg-slate-100 p-4 rounded-lg overflow-auto max-h-48 text-xs font-mono text-red-800">
                                {this.state.error.toString()}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
