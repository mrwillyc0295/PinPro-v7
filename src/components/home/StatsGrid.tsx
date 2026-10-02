import React, { memo } from 'react';
import { TrendingUp, Star } from 'lucide-react';

interface StatsGridProps {
  earnings?: number;
  rating?: number;
  reviewsCount?: number;
}

const StatsGrid = memo(({ earnings = 450, rating = 4.9, reviewsCount = 15 }: StatsGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-surface-container/50 border border-outline-variant/50 p-4 rounded-2xl flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary-container" />
          </div>
          <span className="text-xs font-bold text-[#00FF00]">+12%</span>
        </div>
        <div>
          <p className="text-2xl font-black text-on-surface">${earnings}</p>
          <p className="text-xs text-on-surface-variant font-medium">Ingresos este mes</p>
        </div>
      </div>
      <div className="bg-surface-container/50 border border-outline-variant/50 p-4 rounded-2xl flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-full bg-[#B026FF]/20 flex items-center justify-center">
            <Star className="w-4 h-4 text-[#B026FF]" />
          </div>
          <span className="text-xs font-bold text-on-surface-variant">{reviewsCount} reseñas</span>
        </div>
        <div>
          <p className="text-2xl font-black text-on-surface">{rating.toFixed(1)}</p>
          <p className="text-xs text-on-surface-variant font-medium">Calificación</p>
        </div>
      </div>
    </div>
  );
});

export default StatsGrid;
