import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    overlay?: boolean;
    message?: string;
}

const LoadingSpinner = ({ size = 'medium', overlay = false, message }: LoadingSpinnerProps) => {
    const sizes = {
        small: 'w-4 h-4',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    };

    const spinner = (
        <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className={`${sizes[size]} animate-spin text-blue-600`} />
            {message && (
                <p className="text-sm font-medium text-slate-600">{message}</p>
            )}
        </div>
    );

    if (overlay) {
        return (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[9998]">
                <div className="bg-white rounded-2xl p-8 shadow-2xl">
                    {spinner}
                </div>
            </div>
        );
    }

    return spinner;
};

export default LoadingSpinner;
