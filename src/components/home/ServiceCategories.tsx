import React, { memo } from 'react';
import { X, Search, Grid, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { serviceCategories } from '../../constants/serviceCategories';
import { getProfessionIcon } from '../../lib/professionIcons';

interface ServiceCategoriesProps {
  isOpen: boolean;
  onClose: () => void;
  menuSearchTerm: string;
  setMenuSearchTerm: (value: string) => void;
  expandedCategory: string | null;
  setExpandedCategory: (value: string | null) => void;
  handleServiceSelect: (service: string) => void;
}

const ServiceCategories = memo(({
  isOpen,
  onClose,
  menuSearchTerm,
  setMenuSearchTerm,
  expandedCategory,
  setExpandedCategory,
  handleServiceSelect
}: ServiceCategoriesProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] bg-surface-lowest flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-300">
      {/* Menu Header */}
      <div className="sticky top-0 z-10 bg-surface-lowest/90 backdrop-blur-xl border-b border-outline-variant/30 px-5 pt-10 pb-4 flex items-center justify-between relative">
        <div className="w-10 h-10 rounded-xl bg-primary-container/10 flex items-center justify-center border border-primary-container/30 shadow-[0_0_10px_rgba(0,255,255,0.1)] absolute left-5">
          <Grid className="w-5 h-5 text-primary-container" />
        </div>

        <div className="flex-1 text-center flex flex-col items-center justify-center z-10 pointer-events-none">
          <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none">Servicios</h2>
          <p className="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-[0.2em] mt-1">Explorar catálogo</p>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-highest text-on-surface-variant transition-all active:scale-90 absolute right-5 z-20"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Menu Search */}
      <div className="px-5 py-3">
        <div className="flex w-full items-stretch rounded-2xl h-12 bg-surface-container/70 border border-outline-variant/30 focus-within:border-primary-container group transition-all duration-300 shadow-lg">
          <div className="text-on-surface-variant flex items-center justify-center pl-4 group-focus-within:text-primary-container transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input
            className="flex w-full min-w-0 flex-1 bg-transparent text-on-surface focus:outline-none border-none h-full placeholder:text-on-surface-variant/60 px-3 text-base font-bold"
            placeholder="¿Qué servicio buscas hoy?"
            value={menuSearchTerm}
            onChange={(e) => setMenuSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Categories List */}
      <div className="flex-1 overflow-y-auto px-5 pb-10 hide-scrollbar">
        <div className="flex flex-col gap-4">
          {serviceCategories.map((category, idx) => {
            const filteredServices = category.services.filter(s =>
              s.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
              category.title.toLowerCase().includes(menuSearchTerm.toLowerCase())
            );

            const isExpanded = expandedCategory === category.title || (menuSearchTerm && filteredServices.length > 0);

            if (menuSearchTerm && filteredServices.length === 0) return null;

            return (
              <div key={idx} className="flex flex-col gap-1.5">
                {/* Category Header (Accordion Toggle) */}
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category.title ? null : category.title)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-[28px] border transition-all duration-500 active:scale-[0.98]",
                    isExpanded
                      ? "bg-primary-container/20 border-primary-container/40 shadow-[0_10px_20px_-10px_rgba(0,255,255,0.3)]"
                      : "bg-surface-lowest border-outline-variant/20 hover:border-primary-container/30"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-[16px] flex items-center justify-center text-xl transition-all duration-700",
                      isExpanded ? "bg-primary-container/30 scale-110 shadow-lg" : "bg-surface-highest"
                    )}>
                      {category.icon}
                    </div>
                    <div className="flex flex-col items-start">
                      <h3 className={cn(
                        "text-base font-black tracking-tight leading-none mb-1 transition-colors",
                        isExpanded ? "text-primary-container" : "text-on-surface"
                      )}>
                        {category.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-on-surface-variant font-black uppercase tracking-[0.1em]">
                        {category.services.length} Categorías
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-on-surface-variant/40 transition-transform duration-500",
                    isExpanded && "rotate-180 text-primary-container"
                  )} />
                </button>

                {/* Services Sub-menu (Expanded Content) */}
                {isExpanded && (
                  <div className="flex flex-col gap-2 mt-0.5 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 gap-2 px-1">
                      {filteredServices.map((service, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleServiceSelect(service)}
                          className="flex items-center justify-between p-4 rounded-2xl bg-surface-container/30 border border-outline-variant/10 hover:border-primary-container/50 hover:bg-primary-container/10 transition-all group text-left relative overflow-hidden backdrop-blur-sm active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-surface-highest flex items-center justify-center text-on-surface-variant group-hover:text-primary-container group-hover:bg-primary-container/20 transition-all duration-500 shadow-inner border border-outline-variant/5">
                              <div className="w-5 h-5 group-hover:scale-110 transition-transform duration-500">
                                {getProfessionIcon(service)}
                              </div>
                            </div>
                            <span className="text-base font-bold text-on-surface-variant group-hover:text-on-surface transition-colors tracking-tight">
                              {service}
                            </span>
                          </div>

                          <div className="w-8 h-8 rounded-full bg-surface-highest/50 flex items-center justify-center group-hover:bg-primary-container group-hover:text-surface-lowest transition-all duration-500 relative z-10 border border-outline-variant/10">
                            <ChevronDown className="w-4 h-4 -rotate-90" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default ServiceCategories;
