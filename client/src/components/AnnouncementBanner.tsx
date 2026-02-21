import React from 'react';
import { useDocumentStore } from '../services/store';
import { X, Info, AlertTriangle } from 'lucide-react';

const AnnouncementBanner: React.FC = () => {
    const { announcements } = useDocumentStore();
    const [visibleIdx, setVisibleIdx] = React.useState(0);
    const [dismissed, setDismissed] = React.useState<string[]>([]);

    const activeList = announcements.filter(a => !dismissed.includes(a.id));

    if (activeList.length === 0) return null;

    const current = activeList[visibleIdx % activeList.length];

    const getColors = (type: string) => {
        switch (type) {
            case 'warning': return 'bg-amber-500 text-white';
            case 'error': return 'bg-red-600 text-white';
            case 'success': return 'bg-green-600 text-white';
            default: return 'bg-blue-600 text-white';
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle size={16} />;
            default: return <Info size={16} />;
        }
    };

    return (
        <div className={`relative w-full ${getColors(current.type)} px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium transition-all`}>
            {getIcon(current.type)}
            <span>{current.message}</span>
            {activeList.length > 1 && (
                <button
                    onClick={() => setVisibleIdx(prev => prev + 1)}
                    className="ml-4 text-xs underline opacity-80 hover:opacity-100"
                >
                    Next ({visibleIdx + 1}/{activeList.length})
                </button>
            )}
            <button
                onClick={() => setDismissed(prev => [...prev, current.id])}
                className="absolute right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
                title="Dismiss"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default AnnouncementBanner;
