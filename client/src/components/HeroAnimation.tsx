import { motion } from 'framer-motion';
import { FileText, FileSpreadsheet, CheckCircle, FileCode, FileImage } from 'lucide-react';

interface FileItemProps {
    icon: React.ElementType;
    name: string;
    color: string;
    index: number;
}

const FileItem = ({ icon: Icon, name, color, index }: FileItemProps) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.2 }}
        className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-100 shadow-sm mb-1.5 relative overflow-hidden group"
    >
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0`}>
            <Icon size={16} />
        </div>
        <div className="text-[11px] font-medium text-slate-700 truncate">{name}</div>

        {/* Processing Highlight */}
        <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{
                duration: 1.5,
                delay: index * 0.2 + 0.5,
                repeat: Infinity,
                repeatDelay: 2
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"
        />
    </motion.div>
);

interface MetadataRowProps {
    id: string;
    name: string;
    rev: string;
    title: string;
    index: number;
}

const MetadataRow = ({ id, name, rev, title, index }: MetadataRowProps) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 + (index * 0.2) }}
        className="grid grid-cols-12 gap-2 text-[10px] p-2 border-b border-slate-50 items-center hover:bg-slate-50 transition-colors"
    >
        <div className="col-span-1 font-mono text-slate-400">{id}</div>
        <div className="col-span-3 font-medium text-slate-700 truncate">{name}</div>
        <div className="col-span-1 text-center">
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold">{rev}</span>
        </div>
        <div className="col-span-6 text-slate-500 truncate">{title}</div>
        <div className="col-span-1 text-right text-green-500">
            <CheckCircle size={12} />
        </div>
    </motion.div>
);

const HeroAnimation = () => {
    return (
        <div className="relative w-full max-w-5xl mx-auto h-auto md:h-[400px] flex flex-col md:flex-row items-stretch gap-6 md:gap-8 px-4 scale-95 origin-center pb-8 md:pb-0">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Left Panel: Raw Files */}
            <div className="flex-1 flex flex-col z-10 min-w-0">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Input Files</div>
                <div className="flex-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col p-3 relative">
                    {/* Decorative subtle header line to match right side feeling */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-50 border-b border-slate-100" />

                    <div className="mt-2 space-y-1.5">
                        <FileItem icon={FileText} name="A-101_Ground_Floor.pdf" color="bg-red-100 text-red-600" index={0} />
                        <FileItem icon={FileCode} name="S-205_Steel_Details.dwg" color="bg-blue-100 text-blue-600" index={1} />
                        <FileItem icon={FileImage} name="E-301_Schematic.png" color="bg-purple-100 text-purple-600" index={2} />
                        <FileItem icon={FileText} name="M-402_HVAC_Layout.pdf" color="bg-red-100 text-red-600" index={3} />
                        <FileItem icon={FileText} name="A-202_Elevations.pdf" color="bg-red-100 text-red-600" index={4} />
                        <FileItem icon={FileSpreadsheet} name="Project_Schedule.xlsx" color="bg-green-100 text-green-600" index={5} />
                    </div>
                </div>
            </div>

            {/* Middle: Data Stream Animation */}
            <div className="hidden md:flex items-center justify-center gap-2 z-10 opacity-80 shrink-0 self-center w-12">
                <div className="relative w-full h-1 bg-slate-100/50 rounded-full overflow-hidden">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: "-100%", opacity: 0 }}
                            animate={{ x: "300%", opacity: [0, 1, 1, 0] }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.4,
                                ease: "linear"
                            }}
                            className="absolute top-0 left-0 w-3 h-full bg-blue-500 rounded-full blur-[1px]"
                        />
                    ))}
                </div>
            </div>

            {/* Right Panel: Extracted Metadata */}
            <div className="flex-1 flex flex-col z-10 min-w-0">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Auto Generated Transmittal Sheets</div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col"
                >
                    {/* Table Header */}
                    <div className="bg-slate-50 border-b border-slate-100 p-2.5 grid grid-cols-12 gap-2 text-[9px] font-bold text-slate-400 uppercase">
                        <div className="col-span-1">ID</div>
                        <div className="col-span-3">Dwg No</div>
                        <div className="col-span-1 text-center">Rev</div>
                        <div className="col-span-6">Title</div>
                        <div className="col-span-1"></div>
                    </div>

                    {/* Table Rows */}
                    <div className="bg-white flex-1 overflow-hidden">
                        <MetadataRow id="001" name="A-101" rev="C" title="Ground Floor GA Plan" index={0} />
                        <MetadataRow id="002" name="S-205" rev="A" title="Structural Steel Details" index={1} />
                        <MetadataRow id="003" name="E-301" rev="B" title="Electrical Schematics L2" index={2} />
                        <MetadataRow id="004" name="M-402" rev="0" title="HVAC Ductwork Layout" index={3} />
                        <MetadataRow id="005" name="A-202" rev="C" title="Building Elevations (North)" index={4} />
                        <MetadataRow id="006" name="SCH-1" rev="-" title="Project Master Schedule" index={5} />
                    </div>

                    {/* Export Buttons */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="p-3 flex gap-3 justify-center bg-slate-50/50 border-t border-slate-100 mt-auto"
                    >
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-100 text-green-700 rounded-md text-[10px] font-bold border border-green-200 shadow-sm hover:scale-105 transition-transform cursor-default">
                            <FileSpreadsheet size={12} />
                            <span>Export Excel</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-100 text-red-700 rounded-md text-[10px] font-bold border border-red-200 shadow-sm hover:scale-105 transition-transform cursor-default">
                            <FileText size={12} />
                            <span>Export PDF</span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default HeroAnimation;
