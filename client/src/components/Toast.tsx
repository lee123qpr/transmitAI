/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (message: string, type?: ToastType, duration?: number, action?: Toast['action']) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showToast = useCallback((
        message: string,
        type: ToastType = 'info',
        duration: number = 5000,
        action?: Toast['action']
    ) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: Toast = { id, type, message, duration, action };

        setToasts(prev => [...prev, newToast]);

        if (duration && duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) => {
    return (
        <div className="fixed bottom-4 right-4 z-[99999] flex flex-col gap-2 max-w-md">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const ToastItem = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
    const icons = {
        success: <CheckCircle size={20} className="text-green-600" />,
        error: <AlertCircle size={20} className="text-red-600" />,
        warning: <AlertCircle size={20} className="text-amber-600" />,
        info: <Info size={20} className="text-blue-600" />
    };

    const styles = {
        success: 'bg-green-50 border-green-200 text-green-900',
        error: 'bg-red-50 border-red-200 text-red-900',
        warning: 'bg-amber-50 border-amber-200 text-amber-900',
        info: 'bg-blue-50 border-blue-200 text-blue-900'
    };

    return (
        <div
            className={`
                flex items-start gap-3 p-4 rounded-lg border shadow-lg
                animate-in slide-in-from-right duration-300
                ${styles[toast.type]}
            `}
        >
            <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
                {toast.action && (
                    <button
                        onClick={toast.action.onClick}
                        className="mt-2 text-sm font-semibold underline hover:no-underline"
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>
            <button
                onClick={onClose}
                className="shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};
