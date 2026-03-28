import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

export default function PlaceholderPage({ title, subtitle, icon: Icon }: PlaceholderPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-32"
    >
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
        <Icon size={28} className="text-amber-400" />
      </div>
      <h2 className="text-2xl font-['Playfair_Display'] font-bold text-slate-100 mb-2">
        {title}
      </h2>
      <p className="text-sm font-['IBM_Plex_Sans'] text-slate-400 mb-4">
        {subtitle}
      </p>
      <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-['JetBrains_Mono']">
        COMING SOON
      </div>
    </motion.div>
  );
}
