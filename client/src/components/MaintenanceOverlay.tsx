import React from 'react';
import { Hammer, RefreshCcw } from 'lucide-react';

const MaintenanceOverlay: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Hammer size={40} className="animate-bounce" />
                </div>

                <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                    Under Maintenance
                </h1>

                <p className="text-slate-600 mb-8 leading-relaxed">
                    We're currently performing some essential system upgrades to improve Transmit.AI.
                    We'll be back online shortly!
                </p>

                <div className="space-y-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                    >
                        <RefreshCcw size={18} />
                        Check Status
                    </button>

                    <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                        Protected by Transmit Guard
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceOverlay;
