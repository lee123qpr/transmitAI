import { useState, useEffect } from 'react';
import { Rocket, FileText, Download, CheckCircle, ArrowRight } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

const WelcomeModal = () => {
    const { user } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);

    useEffect(() => {
        if (!user) return;

        // Check local storage specific to this user
        const hasSeenWelcome = localStorage.getItem(`hasSeenWelcome_${user.id}`);

        // If not seen, show it
        if (!hasSeenWelcome) {
            setIsOpen(true);
        }
    }, [user]);

    const handleClose = () => {
        setIsOpen(false);
        if (user) {
            localStorage.setItem(`hasSeenWelcome_${user.id}`, 'true');
        }
    };

    const nextStep = () => {
        if (step < 3) setStep(step + 1);
        else handleClose();
    };

    const steps = [
        {
            title: "Welcome to Transmit.AI! 🚀",
            content: "We're excited to have you on board. Transmit.AI helps you automatically extract data from your construction documents, drawings, and transmittals.",
            icon: <Rocket size={48} className="text-blue-600 mb-4" />
        },
        {
            title: "1. Upload Documents",
            content: "Start by uploading your PDF, Word, Excel, or image files. You can drag & drop multiple files at once. Group them by transmittal package for better organisation.",
            icon: <FileText size={48} className="text-indigo-600 mb-4" />
        },
        {
            title: "2. Extract & Export",
            content: "Our AI will automatically extract document numbers, revisions, titles, and dates. Review the data, then export to Excel or PDF in one click.",
            icon: <Download size={48} className="text-green-600 mb-4" />
        }
    ];

    const currentStep = steps[step - 1];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300 relative">

                {/* Progress Bar */}
                <div className="h-1.5 bg-slate-100 w-full flex">
                    <div
                        className="h-full bg-blue-600 transition-all duration-300 ease-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                <div className="p-8 text-center">
                    <div className="flex justify-center">
                        <div className="p-4 bg-blue-50 rounded-full mb-2 animate-bounce-subtle">
                            {currentStep.icon}
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 mb-3 md:min-h-[2rem]">
                        {currentStep.title}
                    </h2>

                    <p className="text-slate-600 mb-8 leading-relaxed md:min-h-[4.5rem]">
                        {currentStep.content}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex gap-2">
                            {[1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className={`w-2.5 h-2.5 rounded-full transition-colors ${i === step ? 'bg-blue-600 scale-110' : 'bg-slate-200'}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={nextStep}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-blue-200"
                        >
                            {step === 3 ? "Let's Get Started" : "Next"}
                            {step === 3 ? <CheckCircle size={18} /> : <ArrowRight size={18} />}
                        </button>
                    </div>
                </div>

                {/* Skip button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xs font-medium uppercase tracking-wider"
                >
                    Skip
                </button>
            </div>
        </div>
    );
};

export default WelcomeModal;
