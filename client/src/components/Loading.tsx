import { Layers } from 'lucide-react';

const Loading = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Layers size={20} className="text-blue-600" />
                </div>
            </div>
            <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading Transmit.AI...</p>
        </div>
    );
};

export default Loading;
