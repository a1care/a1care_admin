
import React from "react";

interface PageBannerProps {
  title: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageBanner({ title, subtitle, children }: PageBannerProps) {
  return (
    <header className="flex flex-col gap-2 bg-gradient-to-br from-[var(--primary)] to-emerald-800 p-6 md:p-8 rounded-2xl shadow-lg shadow-emerald-900/10 border-0 relative overflow-hidden text-left items-start mb-6 min-h-[160px] md:min-h-[180px]">
      <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 w-full">
        <div className="flex flex-col items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1">{title}</h1>
            
            {subtitle && (
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)] shrink-0" />
                <div className="text-xs md:text-sm font-medium text-emerald-50 tracking-wide opacity-90">
                  {subtitle}
                </div>
              </div>
            )}
          </div>
          
          {children && (
             <div className="flex flex-wrap items-center gap-2 shrink-0 mt-2">
               {children}
             </div>
          )}
        </div>
      </div>
    </header>
  );
}

