import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Layers } from 'lucide-react';

const QuickActions = memo(() => {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">Acciones Rápidas</h2>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/edit-profile" className="bg-surface-container/50 border border-outline-variant/50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary-container transition-colors">
          <div className="w-10 h-10 rounded-full bg-surface-highest flex items-center justify-center">
            <Wrench className="w-5 h-5 text-on-surface" />
          </div>
          <span className="text-xs font-bold text-on-surface">Editar Perfil</span>
        </Link>
        <Link to="/wallet" className="bg-surface-container/50 border border-outline-variant/50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary-container transition-colors">
          <div className="w-10 h-10 rounded-full bg-surface-highest flex items-center justify-center">
            <Layers className="w-5 h-5 text-on-surface" />
          </div>
          <span className="text-xs font-bold text-on-surface">Mi Billetera</span>
        </Link>
      </div>
    </div>
  );
});

export default QuickActions;
