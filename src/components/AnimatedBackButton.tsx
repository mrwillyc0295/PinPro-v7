import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface AnimatedBackButtonProps {
  className?: string;
  to?: string;
  onClick?: () => void;
}

export const AnimatedBackButton: React.FC<AnimatedBackButtonProps> = ({ className, to, onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-7 h-7 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] active:scale-90 transition-all group",
        className
      )}
    >
      <motion.div
        animate={{
          color: ["#00FFFF", "#FF00FF", "#00FF00", "#FFFF00", "#00FFFF"],
          filter: [
            "drop-shadow(0 0 5px rgba(0,255,255,0.8))",
            "drop-shadow(0 0 10px rgba(255,0,255,0.8))",
            "drop-shadow(0 0 5px rgba(0,255,0,0.8))",
            "drop-shadow(0 0 10px rgba(255,255,0,0.8))",
            "drop-shadow(0 0 5px rgba(0,255,255,0.8))"
          ]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <ArrowLeft className="w-5 h-5" />
      </motion.div>

      {/* Outer Glow Ring */}
      <div className="absolute inset-0 rounded-full border-2 border-white/5 group-hover:border-white/20 transition-colors"></div>
    </button>
  );
};
