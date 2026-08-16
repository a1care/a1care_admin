import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type ConfirmationType = 'danger' | 'warning' | 'info';

export interface ConfirmationOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: ConfirmationType;
}

interface ConfirmationContextValue {
    confirm: (options: ConfirmationOptions | string) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

export function useConfirm() {
    const context = useContext(ConfirmationContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmationProvider');
    }
    return context.confirm;
}

interface ConfirmationProviderProps {
    children: ReactNode;
}

export function ConfirmationProvider({ children }: ConfirmationProviderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmationOptions>({ message: '' });
    const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null);

    const confirm = useCallback((opts: ConfirmationOptions | string): Promise<boolean> => {
        const parsedOptions: ConfirmationOptions = typeof opts === 'string' ? { message: opts } : opts;
        
        setOptions({
            title: parsedOptions.title || 'Are you sure?',
            message: parsedOptions.message,
            confirmText: parsedOptions.confirmText || 'Confirm',
            cancelText: parsedOptions.cancelText || 'Cancel',
            type: parsedOptions.type || 'danger',
        });
        
        setIsOpen(true);
        
        return new Promise((resolve) => {
            setResolver({ resolve });
        });
    }, []);

    const handleConfirm = () => {
        setIsOpen(false);
        if (resolver) resolver.resolve(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        if (resolver) resolver.resolve(false);
    };

    const getIcon = () => {
        switch (options.type) {
            case 'danger': return <AlertCircle className="w-6 h-6 text-red-600" />;
            case 'warning': return <AlertTriangle className="w-6 h-6 text-amber-600" />;
            case 'info': return <Info className="w-6 h-6 text-blue-600" />;
            default: return <AlertCircle className="w-6 h-6 text-red-600" />;
        }
    };

    const getButtonClass = () => {
        switch (options.type) {
            case 'danger': return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            case 'warning': return 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400';
            case 'info': return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
            default: return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
        }
    };

    return (
        <ConfirmationContext.Provider value={{ confirm }}>
            {children}
            
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex gap-4">
                                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                                    options.type === 'danger' ? 'bg-red-100' :
                                    options.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                                }`}>
                                    {getIcon()}
                                </div>
                                <div className="flex-1 mt-1">
                                    <h3 className="text-lg font-bold text-gray-900">{options.title}</h3>
                                    <p className="mt-2 text-sm text-gray-500 whitespace-pre-wrap">{options.message}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                {options.cancelText}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`px-4 py-2 text-sm font-bold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${getButtonClass()}`}
                            >
                                {options.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmationContext.Provider>
    );
}
