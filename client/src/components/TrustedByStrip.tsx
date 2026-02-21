import { motion } from 'framer-motion';
import { Building2, Component, HardHat, Landmark, Mountain, Triangle } from 'lucide-react';

const LogoItem = ({ icon: Icon, name, fontStyle = "font-bold" }: { icon: React.ElementType, name: string, fontStyle?: string }) => (
    <div className="flex items-center gap-3 text-slate-400 grayscale hover:grayscale-0 hover:text-slate-800 transition-all duration-300 cursor-pointer mx-10">
        <Icon size={36} strokeWidth={1.5} />
        <span className={`text-xl tracking-tight ${fontStyle}`}>{name}</span>
    </div>
);

const TrustedByStrip = () => {
    return (
        <section className="py-12 bg-white border-b border-slate-100 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-8 text-center">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                    Trusted by industry leaders
                </p>
            </div>

            <div className="flex relative items-center overflow-hidden py-4">
                {/* Gradient Masks */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />

                {/* Marquee Track - Duplicated for infinite loop */}
                <motion.div
                    className="flex whitespace-nowrap"
                    animate={{ x: [0, -1200] }}
                    transition={{
                        repeat: Infinity,
                        duration: 40,
                        ease: "linear"
                    }}
                >
                    {/* First Set */}
                    <LogoItem icon={Building2} name="STRATTON & CO" fontStyle="font-serif font-bold" />
                    <LogoItem icon={Triangle} name="Vanguard Engineering" fontStyle="font-semibold uppercase" />
                    <LogoItem icon={Landmark} name="Meridian Infrastructure" fontStyle="font-medium" />
                    <LogoItem icon={HardHat} name="HELIX CONTRUCTORS" fontStyle="font-black tracking-tighter" />
                    <LogoItem icon={Component} name="Nexus Consultants" fontStyle="font-semibold" />
                    <LogoItem icon={Mountain} name="Summit Group" fontStyle="font-serif font-bold italic" />

                    {/* Second Set (Duplicate) */}
                    <LogoItem icon={Building2} name="STRATTON & CO" fontStyle="font-serif font-bold" />
                    <LogoItem icon={Triangle} name="Vanguard Engineering" fontStyle="font-semibold uppercase" />
                    <LogoItem icon={Landmark} name="Meridian Infrastructure" fontStyle="font-medium" />
                    <LogoItem icon={HardHat} name="HELIX CONTRUCTORS" fontStyle="font-black tracking-tighter" />
                    <LogoItem icon={Component} name="Nexus Consultants" fontStyle="font-semibold" />
                    <LogoItem icon={Mountain} name="Summit Group" fontStyle="font-serif font-bold italic" />

                    {/* Third Set (Duplicate for safety) */}
                    <LogoItem icon={Building2} name="STRATTON & CO" fontStyle="font-serif font-bold" />
                    <LogoItem icon={Triangle} name="Vanguard Engineering" fontStyle="font-semibold uppercase" />
                    <LogoItem icon={Landmark} name="Meridian Infrastructure" fontStyle="font-medium" />
                    <LogoItem icon={HardHat} name="HELIX CONTRUCTORS" fontStyle="font-black tracking-tighter" />
                    <LogoItem icon={Component} name="Nexus Consultants" fontStyle="font-semibold" />
                    <LogoItem icon={Mountain} name="Summit Group" fontStyle="font-serif font-bold italic" />
                </motion.div>
            </div>
        </section>
    );
};

export default TrustedByStrip;
