import { motion } from 'motion/react';
import { Eye, Smartphone } from 'lucide-react';

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-gradient-to-br from-sky-50 via-sky-100 to-white p-6 relative overflow-hidden select-none">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-sky-300/30 rounded-full blur-3xl pulse-slow"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl pulse-slow"></div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Animated Icon Frame */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.6, 1.1, 1], opacity: 1 }}
          transition={{ duration: 0.8, cubicBezier: [0.16, 1, 0.3, 1] }}
          className="relative mb-6"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-blue-400 rounded-2xl blur opacity-75 animate-pulse"></div>
          <div className="relative w-20 h-20 bg-white border border-sky-100 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="font-display text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-sky-500">
              J
            </span>
            <Smartphone className="absolute right-2 bottom-2 w-4 h-4 text-sky-500" />
          </div>
        </motion.div>

        {/* Brand Text Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl font-display font-extrabold tracking-tight text-slate-800 mb-2">
            J<span className="text-sky-600">cash</span>
          </h1>
          <p className="text-slate-600 text-sm max-w-[250px] font-medium leading-relaxed">
            The Premium Filipino Digital Finance Wallet
          </p>
        </motion.div>

        {/* Micro Loader */}
        <motion.div 
          className="mt-12 w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div 
            className="h-full bg-gradient-to-r from-sky-450 to-blue-550 rounded-full bg-sky-500"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            onAnimationComplete={onComplete}
          />
        </motion.div>
      </div>

      {/* Safety Badges Footer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="flex flex-col items-center gap-2 mb-4"
      >
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <Eye className="w-3.5 h-3.5 text-sky-500" />
          <span>SECURED BY SUPABASE SHIELD</span>
        </div>
        <p className="text-[10px] text-slate-500 font-mono">APP v1.2.0 • BANGKO SENTRAL COMPLIANT</p>
      </motion.div>
    </div>
  );
}
