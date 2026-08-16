import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    Plus, Trash2, Star, X, Package, ToggleLeft, ToggleRight,
    Loader2, Pencil, Sparkles, Eye, CheckCircle2, ChevronDown, Check
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
interface RoleOption {
    _id: string;
    name: string;
    title?: string;
}

const PRESET_COLORS = [
    { label: "Blue", value: "#2F80ED" },
    { label: "Purple", value: "#9B51E0" },
    { label: "Pink", value: "#D63384" },
    { label: "Red", value: "#EB5757" },
    { label: "Orange", value: "#F2994A" },
    { label: "Green", value: "#27AE60" },
    { label: "Teal", value: "#11998E" },
];

export function HealthPackagesPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    // ── Fetch ──
    const { data: packages, isLoading } = useQuery<HealthPackage[]>({
        queryKey: ["admin_health_packages"],
        queryFn: async () => {
            const res = await api.get("/health-packages/admin/all");
            return res.data?.data || [];
        }
    });
    const { data: roles } = useQuery({
        queryKey: ["admin_services_for_packages"],
        queryFn: async () => {
            const res = await api.get("/services");
            return (res.data?.data || []) as RoleOption[];
        },
    });

    // ── Mutations ──
    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/health-packages/admin/delete/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin_health_packages"] }); toast.success("Package deleted"); },
        onError: () => toast.error("Failed to delete"),
    });

    const toggleActiveMutation = useMutation({
        mutationFn: (id: string) => api.patch(`/health-packages/admin/toggle-active/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin_health_packages"] }); },
        onError: () => toast.error("Failed to toggle"),
    });

    const toggleFeaturedMutation = useMutation({
        mutationFn: (id: string) => api.patch(`/health-packages/admin/toggle-featured/${id}`),
        onSuccess: (res, id) => {
            queryClient.invalidateQueries({ queryKey: ["admin_health_packages"] });
            // Read from API response (post-mutation state), not pre-mutation pkg state
            const nowFeatured = res?.data?.data?.isFeatured;
            toast.success(nowFeatured ? "Now featured in user app" : "Removed from featured");
        },
        onError: () => toast.error("Failed to toggle featured"),
    });

    const seedMutation = useMutation({
        mutationFn: () => api.post("/health-packages/admin/seed"),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["admin_health_packages"] });
            toast.success(res.data.message);
        },
        onError: () => toast.error("Seed failed"),
    });


    const discount = (orig: number, price: number) => orig > price ? Math.round(((orig - price) / orig) * 100) : 0;

    return (
        <div className="space-y-6 animate-in">
            {/* ── Page Header ── */}
            <header className="flex flex-col gap-2 bg-gradient-to-br from-[var(--primary)] to-emerald-800 p-6 md:p-8 rounded-2xl shadow-lg shadow-emerald-900/10 border-0 relative overflow-hidden text-left items-start">
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 w-full flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1">Health Packages</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                            <p className="text-xs md:text-sm font-medium text-emerald-50 tracking-wide">
                                Home • Healthcare Catalog • Checkup Packages
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {(!packages || packages.length === 0) && (
                            <button
                                className="button secondary h-10 px-4 rounded-xl gap-1.5 text-xs font-bold uppercase border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)]"
                                onClick={() => seedMutation.mutate()}
                                disabled={seedMutation.isPending}
                            >
                                {seedMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                <span>Seed Defaults</span>
                            </button>
                        )}
                        <button 
                            className="flex items-center gap-1.5 h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shrink-0" 
                            onClick={() => navigate("/health-packages/create")}
                        >
                            <Plus size={16} />
                            <span>Add Package</span>
                        </button>
                    </div>
                </div>
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            </header>

            {/* ── Stats Bar widgets ── */}
            {packages && packages.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: "Total Packages", value: packages.length, icon: Package, color: "text-blue-500" },
                        { label: "Active Packages", value: packages.filter(p => p.isActive).length, icon: CheckCircle2, color: "text-emerald-500" },
                        { label: "Featured Showcase", value: packages.filter(p => p.isFeatured).length, icon: Star, color: "text-amber-500" },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 flex items-center gap-4 shadow-sm text-left">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-[var(--text-main)] border border-[var(--border-color)]">
                                <Icon size={18} className={color} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
                                <p className="text-xl font-black text-[var(--text-main)] mt-0.5">{value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Main Catalog Table Listing ── */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--text-main)]">Checkup Packages Directory</h3>
                    <span className="text-xs font-bold text-[var(--text-muted)]">{packages?.length || 0} Registered Bundles</span>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="py-20 text-center flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin text-blue-500" size={24} />
                            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Syncing health packages...</span>
                        </div>
                    ) : packages && packages.length > 0 ? (
                        <table className="w-full text-left min-w-[850px]">
                            <thead>
                                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                    <th className="py-3 px-4 w-12">#</th>
                                    <th className="py-3 px-4">Package Identity</th>
                                    <th className="py-3 px-4">Cost (INR)</th>
                                    <th className="py-3 px-4">Validity</th>
                                    <th className="py-3 px-4">Tests Included</th>
                                    <th className="py-3 px-4 text-center">Featured</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {packages.map((pkg, index) => (
                                    <tr key={pkg._id} className="hover:bg-[var(--bg-main)]/50 transition-colors group cursor-pointer" onClick={() => navigate('/health-packages/' + pkg._id)}>
                                        {/* Index */}
                                        <td className="py-4 px-4 text-xs font-semibold text-[var(--text-muted)]">
                                            {String(index + 1).padStart(2, '0')}
                                        </td>
                                        {/* Identity (Color label dot & name) */}
                                        <td className="py-4 px-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pkg.color }} />
                                                    <span className="font-bold text-sm text-[var(--text-main)] uppercase tracking-tight">{pkg.name}</span>
                                                    {pkg.badge && (
                                                        <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400">
                                                            {pkg.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-[var(--text-muted)] max-w-xs truncate mt-0.5">{pkg.description}</p>
                                            </div>
                                        </td>
                                        {/* Cost */}
                                        <td className="py-4 px-4">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="font-bold text-xs text-[var(--text-main)]">₹{pkg.price}</span>
                                                {discount(pkg.originalPrice, pkg.price) > 0 && (
                                                    <span className="text-[10px] text-[var(--text-muted)] text-decoration-line-through">₹{pkg.originalPrice}</span>
                                                )}
                                                {discount(pkg.originalPrice, pkg.price) > 0 && (
                                                    <span className="text-[9px] font-bold text-green-600 bg-green-50 dark:bg-green-950/20 px-1.5 py-0.5 rounded">
                                                        -{discount(pkg.originalPrice, pkg.price)}%
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {/* Validity */}
                                        <td className="py-4 px-4 text-xs font-semibold text-[var(--text-muted)]">
                                            {pkg.validityDays} Days
                                        </td>
                                        {/* Tests Included */}
                                        <td className="py-4 px-4">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {pkg.testsIncluded.slice(0, 2).map((test) => (
                                                    <span key={test} className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-50 dark:bg-white/5 text-[var(--text-muted)] border border-[var(--border-color)]">
                                                        {test}
                                                    </span>
                                                ))}
                                                {pkg.testsIncluded.length > 2 && (
                                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-white/10 text-[var(--text-muted)]">
                                                        +{pkg.testsIncluded.length - 2} more
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {/* Featured toggle */}
                                        <td className="py-4 px-4 text-center">
                                            <button
                                                title={pkg.isFeatured ? "Remove from featured" : "Mark as featured"}
                                                onClick={(e) => { e.stopPropagation(); toggleFeaturedMutation.mutate(pkg._id); }}
                                                className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-all ${
                                                    pkg.isFeatured 
                                                        ? "bg-amber-100 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400" 
                                                        : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                                                }`}
                                            >
                                                <Star size={14} fill={pkg.isFeatured ? "currentColor" : "none"} />
                                            </button>
                                        </td>
                                        {/* Active Status toggle */}
                                        <td className="py-4 px-4 text-center">
                                            <button
                                                title={pkg.isActive ? "Deactivate" : "Activate"}
                                                onClick={(e) => { e.stopPropagation(); toggleActiveMutation.mutate(pkg._id); }}
                                                className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-all ${
                                                    pkg.isActive 
                                                        ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" 
                                                        : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                                                }`}
                                            >
                                                {pkg.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                            </button>
                                        </td>
                                        {/* Actions */}
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate('/health-packages/' + pkg._id); }}
                                                    className="w-8 h-8 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] flex items-center justify-center hover:bg-[var(--bg-main)] hover:text-emerald-600 transition-all"
                                                    title="View Package Details"
                                                >
                                                    <Eye size={13} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/health-packages/edit/${pkg._id}`); }}
                                                    className="w-8 h-8 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] flex items-center justify-center hover:bg-[var(--bg-main)] hover:text-blue-600 transition-all"
                                                    title="Edit Package"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setDeleteTargetId(pkg._id); }}
                                                    className="w-8 h-8 rounded-lg border border-red-100 dark:border-red-950/20 bg-red-50/50 dark:bg-red-950/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                                    title="Delete Package"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-16 text-center">
                            <div className="flex flex-col items-center justify-center space-y-3">
                                <Package size={24} className="text-slate-300" />
                                <div>
                                    <h4 className="text-sm font-bold text-[var(--text-main)]">No Health Packages Yet</h4>
                                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Seed packages or add a new health package bundle.</p>
                                </div>
                                <button className="button primary h-10 px-6 rounded-xl flex items-center gap-2 shadow-sm font-bold text-sm tracking-wide" onClick={() => navigate("/health-packages/create")}>
                                    <Plus size={16} /> Add Package
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Delete Confirmation Modal */}
            {deleteTargetId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTargetId(null)} />
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
                            <button className="flex-1 h-9 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--bg-main)] transition-all" onClick={() => setDeleteTargetId(null)}>Cancel</button>
                            <button className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors" disabled={deleteMutation.isPending} onClick={() => { if (deleteTargetId) deleteMutation.mutate(deleteTargetId); setDeleteTargetId(null); }}>
                                {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

