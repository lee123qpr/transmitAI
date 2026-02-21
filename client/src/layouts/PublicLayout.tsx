import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PublicLayout = () => {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
            <Header />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default PublicLayout;
