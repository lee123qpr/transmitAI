import { twMerge } from 'tailwind-merge';
import { CircleCheck as CheckCircle, CircleAlert as AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message?: string;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'info' | 'danger' | 'success' | 'warning';
    isLoading?: boolean;
    children?: React.ReactNode;
    className?: string;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    onConfirm,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = 'info',
    isLoading = false,
    children,
    className = ""
}) => {
    if (!isOpen) return null;

    const icons = {
        success: <CheckCircle size={24} className="text-green-600" />,
        danger: <AlertCircle size={24} className="text-red-600" />,
        warning: <AlertTriangle size={24} className="text-amber-600" />,
        info: <Info size={24} className="text-blue-600" />
    };

    const titleColors = {
        success: 'text-green-600',
        danger: 'text-red-600',
        warning: 'text-amber-600',
        info: 'text-slate-800'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
            <div className={twMerge("bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]", className)}>
                <div className="shrink-0 px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
                    <div className="shrink-0">{icons[type]}</div>
                    <h3 className={`font-semibold text-lg flex-1 ${titleColors[type]}`}>
                        {title}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {message && <p className="text-slate-600 leading-relaxed mb-4">{message}</p>}
                    {children}
                </div>

                <div className="shrink-0 px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    {onConfirm ? (
                        <>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => { if (!isLoading && onConfirm) { onConfirm(); onClose(); } }}
                                disabled={isLoading}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm flex items-center gap-2
                                    ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
                                    ${type === 'danger'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : type === 'warning'
                                            ? 'bg-amber-600 hover:bg-amber-700'
                                            : type === 'success'
                                                ? 'bg-green-600 hover:bg-green-700'
                                                : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {isLoading && <LoadingSpinner size="small" />}
                                {confirmText}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;
