import { motion } from 'framer-motion';

const LogoImage = ({ src, alt }: { src: string; alt: string }) => (
    <div className="flex items-center justify-center h-16 w-48 text-slate-400 grayscale hover:grayscale-0 hover:scale-105 transition-all duration-300 cursor-pointer mx-10">
        <img src={src} alt={alt} className="max-h-full max-w-full object-contain opacity-70 hover:opacity-100 transition-opacity" />
    </div>
);

const TrustedByStrip = () => {
    // List of uploaded partner logos
    const partners = [
        { src: "/partners/ConstructionHub.png", alt: "Construction Hub" },
        { src: "/partners/DextrickNew.png", alt: "Dextrick" },
        { src: "/partners/EngTecGreyscale.png", alt: "EngTec" },
        { src: "/partners/HertsCSGreyscale.png", alt: "Herts CS" },
        { src: "/partners/Salford Ltd1.png", alt: "Salford Ltd" },
        { src: "/partners/Untitled design.png", alt: "Partner" }
    ];

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
                    {partners.map((partner, i) => (
                        <LogoImage key={`set1-${i}`} src={partner.src} alt={partner.alt} />
                    ))}

                    {/* Second Set (Duplicate) */}
                    {partners.map((partner, i) => (
                        <LogoImage key={`set2-${i}`} src={partner.src} alt={partner.alt} />
                    ))}

                    {/* Third Set (Duplicate for safety) */}
                    {partners.map((partner, i) => (
                        <LogoImage key={`set3-${i}`} src={partner.src} alt={partner.alt} />
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default TrustedByStrip;
