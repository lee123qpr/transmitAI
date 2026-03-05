import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import SEO from '../../components/SEO';

const Cancel = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-start justify-center p-4 pt-24">
            <SEO title="Payment Cancelled | Transmit.AI" />
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle size={40} />
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Cancelled</h1>
                <p className="text-slate-600 mb-8">
                    The checkout process was cancelled. No charges were made to your card.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/app')}
                        className="btn-primary w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        <ArrowLeft size={18} /> Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cancel;
