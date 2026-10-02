import React, { memo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  setIsFiltersMenuOpen: (value: boolean) => void;
  hasFilters: boolean;
}

const SearchBar = memo(({ searchTerm, setSearchTerm, setIsFiltersMenuOpen, hasFilters }: SearchBarProps) => {
  return (
    <div className="w-full flex justify-center pointer-events-none px-3 py-2 z-[1000] relative">
      <div className="w-full max-w-[350px] sm:max-w-[500px] md:max-w-[700px] lg:max-w-[900px] h-[28px] sm:h-[32px] pointer-events-auto relative">
        <div className="w-full h-full flex items-center justify-between rounded-full bg-[#1A1C20] border-[1.5px] border-[#336C6F] shadow-lg overflow-hidden px-4">
          {/* Lupa a la izquierda */}
          <div className="text-[#00FFCC] flex items-center justify-center">
            <Search className="w-3.5 h-3.5 sm:w-[16px] sm:h-[16px]" />
          </div>

          {/* Input centrado con placeholder y cursor parpadeante (si está vacío) */}
          <div className="flex-1 flex items-center justify-center relative h-full">
            <input
              className="w-full h-full bg-transparent text-[#D6D6D6] focus:outline-none border-none placeholder:text-transparent text-[9px] sm:text-[10px] font-sans font-bold text-center uppercase tracking-widest caret-white relative z-10"
              placeholder="¿QUE SERVICIO BUSCAS?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Custom Placeholder with Blinking Cursor */}
            {!searchTerm && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[#D6D6D6] text-[9px] sm:text-[10px] font-bold tracking-[1px] uppercase">¿QUE SERVICIO BUSCAS?</span>
                <span className="w-[1.5px] h-[12px] sm:h-[14px] bg-white ml-[6px]" style={{ animation: 'blink 0.9s infinite' }}></span>
              </div>
            )}
          </div>

          {/* Ajustes a la derecha */}
          <button
            type="button"
            className="flex items-center justify-center group relative cursor-pointer p-1.5 hover:bg-white/10 active:scale-95 transition-all rounded-full bg-[#00FFCC]/10 shadow-[0_0_8px_rgba(0,255,204,0.3)] animate-pulse"
            onClick={() => setIsFiltersMenuOpen(true)}
          >
            <SlidersHorizontal className={cn(
              "w-3.5 h-3.5 sm:w-[16px] sm:h-[16px] transition-colors color-change-icon",
            )} />
            {hasFilters && (
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#00FFFF] rounded-full shadow-[0_0_10px_#00FFFF]"></span>
            )}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes blink {
            0% { opacity: 0; }
            50% { opacity: 1; }
            100% { opacity: 0; }
        }
        @keyframes colorChange {
            0% { color: #00FFCC; filter: drop-shadow(0 0 2px #00FFCC); }
            33% { color: #00FFFF; filter: drop-shadow(0 0 2px #00FFFF); }
            66% { color: #B026FF; filter: drop-shadow(0 0 2px #B026FF); }
            100% { color: #00FFCC; filter: drop-shadow(0 0 2px #00FFCC); }
        }
        .color-change-icon {
            animation: colorChange 4s infinite;
        }
      `}</style>
    </div>
  );
});

export default SearchBar;
