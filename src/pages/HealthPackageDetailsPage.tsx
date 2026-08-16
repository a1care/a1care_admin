import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { 
    ChevronLeft, Package, CheckCircle2,
    Calendar, Check, ShieldAlert, Zap, Pencil, Trash2
} from "lucide-react";
import { toast } from "sonner";

interface HealthPackage {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  imageUrl?: string;
  badge?: string;
  color: string;
  testsIncluded: string[];
  validityDays: number;
  allowedRoleIds?: string[];
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  createdAt: string;
}

export function HealthPackageDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { data: packages, isLoading } = useQuery<HealthPackage[]>({
        queryKey: ["admin_health_packages"],
        queryFn: async () => {
            const res = await api.get("/health-packages/admin/all");
            return res.data?.data || [];
        }
    });

    const pkg = packages?.find(p => p._id === id);

    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/health-packages/admin/delete/${id}`),
        onSuccess: () => {
            toast.success("Package deleted");
            navigate("/health-packages");
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to delete package"),
    });

    if (isLoading || !pkg) {
        return (
            <div className="space-y-6 animate-in">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors shadow-sm">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="h-10 w-48 bg-[var(--card-bg)] rounded-lg animate-pulse border border-[var(--border-color)]"></div>
                </div>
                <div className="h-[400px] bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
            </div>
        );
    }

    const discount = pkg.originalPrice > pkg.price 
        ? Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100) 
        : 0;

    return (
        <div className="space-y-6 animate-in pb-10">
            {/* Header Navigation */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-blue-600 hover:border-blue-400 transition-all shadow-sm"
                >
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-black text-[var(--text-main)] tracking-tight">Package Details</h1>
                    <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">Detailed view for {pkg.name}</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="w-full bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden flex flex-col">
                {/* Hero Header */}
                <div className="relative h-32 sm:h-40 shrink-0" style={{ backgroundColor: pkg.color }}>
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>

                <div className="px-6 sm:px-8 pb-8 pt-0 relative flex-1 flex flex-col">
                    {/* Profile Overlap Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-16 mb-8 relative z-10 w-full">
                        <div className="flex items-end justify-start gap-5 w-full sm:w-auto text-left">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-[var(--card-bg)] p-1.5 shadow-xl shrink-0">
                                <div className="w-full h-full rounded-xl flex items-center justify-center overflow-hidden border border-[var(--border-color)]" style={{ backgroundColor: pkg.color + '1A', color: pkg.color }}>
                                    <Package size={48} />
                                </div>
                            </div>
                            <div className="pb-1 sm:pb-3 flex-1 text-left">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] tracking-tight">{pkg.name}</h2>
                                    {pkg.badge && (
                                        <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                                            {pkg.badge}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${pkg.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${pkg.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                        {pkg.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    {pkg.isFeatured && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20">
                                            <Zap size={10} /> Featured
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pb-1 sm:pb-3 mt-4 sm:mt-0 w-full sm:w-auto">
                            <button
                                onClick={() => navigate(`/health-packages?edit=${pkg._id}`)}
                                className="h-9 px-4 rounded-lg bg-[var(--bg-main)] hover:bg-blue-50 text-[var(--text-muted)] hover:text-blue-600 text-xs font-bold uppercase tracking-wider transition-colors border border-[var(--border-color)] flex items-center gap-2"
                            >
                                <Pencil size={14} /> Edit
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="h-9 px-4 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors border border-red-200 flex items-center gap-2"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left Column: Details */}
                        <section className="md:col-span-2 space-y-8">
                            <div>
                                <h3 className="text-sm font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
                                    <ShieldAlert size={16} className="text-blue-500" />
                                    Package Overview
                                </h3>
                                <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                                    <p className="text-sm font-medium text-[var(--text-main)] leading-relaxed">{pkg.description}</p>
                                </div>
                            </div>

                            <hr className="border-[var(--border-color)]" />

                            <div>
                                <h3 className="text-sm font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    Included Tests
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {pkg.testsIncluded.map((test: string, i: number) => (
                                        <div key={i} className="p-3 bg-[var(--bg-main)] rounded-xl flex items-center gap-3 border border-[var(--border-color)]">
                                            <div className="w-6 h-6 rounded bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            <span className="text-xs font-bold text-[var(--text-main)]">{test}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Right Column: Cost & Settings */}
                        <section className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
                                    <Package size={16} className="text-violet-500" />
                                    Pricing & Validity
                                </h3>
                                
                                <div className="p-5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Selling Price</p>
                                        <div className="flex items-end gap-2 mt-1">
                                            <span className="text-2xl font-black text-emerald-600">₹{pkg.price}</span>
                                            {discount > 0 && (
                                                <>
                                                    <span className="text-sm font-semibold text-[var(--text-muted)] line-through pb-1">₹{pkg.originalPrice}</span>
                                                    <span className="text-[10px] font-black text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded pb-1 mb-1">
                                                        -{discount}%
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <hr className="border-[var(--border-color)]" />
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                                            <Calendar size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Validity Period</p>
                                            <p className="text-sm font-bold text-[var(--text-main)] mt-0.5">{pkg.validityDays} Days</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="relative w-full max-w-md bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
                        <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider font-bold">Catalog Security</p>
                            <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">Delete Health Package?</h3>
                        </div>
                        <div className="p-6 text-center space-y-4">
                            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto border border-red-200">
                                <Trash2 size={20} />
                            </div>
                            <p className="text-sm text-[var(--text-muted)] font-semibold">This action cannot be undone. This package will be permanently removed from the catalog.</p>
                        </div>
                        <div className="px-6 py-4 border-t border-[var(--border-color)] flex gap-2 bg-[var(--bg-main)]">
                            <button className="flex-1 h-9 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--bg-main)] transition-all" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                            <button className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
                                {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
