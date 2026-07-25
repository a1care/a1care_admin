import React, { useEffect } from "react";
import { X } from "lucide-react";

interface A1DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: "md" | "lg" | "xl" | "full";
}

export const A1Drawer: React.FC<A1DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = "md",
}) => {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const widthClasses = {
    md: "w-full max-w-md",
    lg: "w-full max-w-2xl",
    xl: "w-full max-w-4xl",
    full: "w-full max-w-[90vw]",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-[110] flex flex-col bg-white shadow-2xl transition-transform transform translate-x-0 ${widthClasses[width]}`}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </>
  );
};
