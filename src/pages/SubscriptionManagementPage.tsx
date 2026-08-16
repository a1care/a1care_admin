import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    Plus, Settings2, Crown, Trash2, CheckCircle2, X, Loader2,
    Sparkles, Zap, Shield, Star, Gift, TrendingUp, Clock,
    Users, BadgeCheck, ChevronRight, RefreshCw, Filter
} from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/context/ConfirmationContext";
import { CardSkeleton, StatsSkeleton } from "@/components/ui/Skeletons";

type SubscriptionTier = "Basic" | "Standard" | "Premium";

interface Plan {
    _id?: string;
    name: string;
    category: string;
    price: number;
    validityDays: number;
    commissionPercentage: number;
    tier: SubscriptionTier;
    features: string[];
    isActive: boolean;
    isFree?: boolean;
    maxBookingsPerDay?: number;
    description?: string;
}

const TIER_CONFIG: Record<SubscriptionTier, {
    gradient: string; border: string; badge: string;
    accent: string; button: string; icon: React.ReactElement; glow: string;
}> = {
    Basic: {
        gradient: "from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-900/60",
        border: "border-slate-200 dark:border-slate-700",
        badge: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
        accent: "text-slate-600 dark:text-slate-400",
        button: "bg-slate-700 hover:bg-slate-800 dark:bg-slate-600",
        icon: <Shield size={20} />,
        glow: ""
    },
    Standard: {
        gradient: "from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30",
        border: "border-blue-200 dark:border-blue-700",
        badge: "bg-blue-100 text-blue-700 dark:bg-blue-800/50 dark:text-blue-300",
        accent: "text-blue-600 dark:text-blue-400",
        button: "bg-blue-600 hover:bg-blue-700",
        icon: <Star size={20} />,
        glow: "shadow-blue-100 dark:shadow-blue-900/20"
    },
    Premium: {
        gradient: "from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-yellow-900/20",
        border: "border-amber-300 dark:border-amber-600",
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-800/50 dark:text-amber-300",
        accent: "text-amber-600 dark:text-amber-400",
        button: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
        icon: <Crown size={20} />,
        glow: "shadow-amber-100 dark:shadow-amber-900/20"
    }
};

const TIER_ORDER: Record<SubscriptionTier, number> = { Basic: 0, Standard: 1, Premium: 2 };

export function SubscriptionManagementPage() {
    const qc = useQueryClient();
    const confirm = useConfirm();
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [selectedTierFilter, setSelectedTierFilter] = useState<string>("All");
    const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);
    const [featureInput, setFeatureInput] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [search, setSearch] = useState("");

    // ── Dynamic categories from DB ──
    const { data: dbCategories = [], isLoading: catsLoading } = useQuery({
        queryKey: ["subscription-categories"],
        queryFn: async () => {
            const res = await api.get("/subscription/plans/categories");
            return res.data.data as string[];
        }
    });
    const allCategories = ["All", ...dbCategories];

    // ── Dynamic tiers from DB (derived) ──
    const { data: allPlans = [], isLoading } = useQuery({
        queryKey: ["all-subscription-plans", selectedCategory, showInactive],
        queryFn: async () => {
            const params: any = { all: showInactive ? "true" : undefined };
            if (selectedCategory !== "All") params.category = selectedCategory;
            const res = await api.get("/subscription/plans", { params });
            return res.data.data as Plan[];
        }
    });

    // Derive unique tiers from current plans
    const availableTiers = useMemo(() => {
        const tiers = [...new Set(allPlans.map(p => p.tier))];
        return ["All", ...tiers.sort((a, b) => TIER_ORDER[a as SubscriptionTier] - TIER_ORDER[b as SubscriptionTier])];
    }, [allPlans]);

    // Client-side filter + search
    const filteredPlans = useMemo(() => {
        return allPlans
            .filter(p => selectedTierFilter === "All" || p.tier === selectedTierFilter)
            .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
    }, [allPlans, selectedTierFilter, search]);

    // ── Mutations ──
    const saveMutation = useMutation({
        mutationFn: async (plan: Partial<Plan>) => {
            if (plan._id) return api.put(`/subscription/plans/${plan._id}`, plan);
            return api.post("/subscription/plans", plan);
        },
        onSuccess: () => {
            setEditingPlan(null); setFeatureInput("");
            qc.invalidateQueries({ queryKey: ["all-subscription-plans"] });
            qc.invalidateQueries({ queryKey: ["subscription-categories"] });
            toast.success("Plan saved successfully.");
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to save plan.")
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/subscription/plans/${id}`),
        onSuccess: () => {
            setEditingPlan(null);
            qc.invalidateQueries({ queryKey: ["all-subscription-plans"] });
            qc.invalidateQueries({ queryKey: ["subscription-categories"] });
            toast.success("Plan deleted.");
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete plan.")
    });

    const toggleActive = (plan: Plan) => {
        saveMutation.mutate({ ...plan, isActive: !plan.isActive });
    };

    const openCreate = () => {
        setFeatureInput("");
        setEditingPlan({
            name: "",
            category: selectedCategory === "All" ? "" : selectedCategory,
            price: 0,
            validityDays: 30,
            commissionPercentage: 15,
            tier: "Basic",
            features: [],
            isActive: true,
            isFree: false,
            maxBookingsPerDay: 5,
            description: ""
        });
    };

    const openEdit = (plan: Plan) => {
        setFeatureInput("");
        setEditingPlan({ ...plan });
    };

    const addFeature = () => {
        if (!featureInput.trim()) return;
        const parts = featureInput.split(",").map(f => f.trim()).filter(Boolean);
        setEditingPlan(prev => ({ ...prev!, features: [...(prev?.features || []), ...parts] }));
        setFeatureInput("");
    };

    const removeFeature = (i: number) =>
        setEditingPlan(prev => ({ ...prev!, features: (prev?.features || []).filter((_, idx) => idx !== i) }));

    // Stats
    const stats = useMemo(() => ({
        total: allPlans.length,
        active: allPlans.filter(p => p.isActive).length,
        premium: allPlans.filter(p => p.tier === "Premium").length,
        free: allPlans.filter(p => p.isFree || p.price === 0).length,
    }), [allPlans]);

    return (
        <div className="space-y-6 animate-in">
            {/* ── Hero Header ── */}
            <header className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 rounded-2xl p-8 text-white shadow-xl">
                <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <Crown size={16} className="text-yellow-300" />
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-100">Partner Subscriptions</p>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Plan Management</h1>
                        <p className="text-sm text-blue-100 font-medium max-w-md">
                            Configure tiered subscription models, commissions, and feature access per plan — all live and dynamic.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { qc.invalidateQueries({ queryKey: ["all-subscription-plans"] }); qc.invalidateQueries({ queryKey: ["subscription-categories"] }); }}
                            className="h-9 px-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                        >
                            <RefreshCw size={13} /> Refresh
                        </button>
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 h-9 px-5 bg-white text-blue-700 font-bold text-sm rounded-xl hover:bg-blue-50 transition-all shadow-lg"
                        >
                            <Plus size={16} /> New Plan
                        </button>
                    </div>
                </div>

                {/* ── Category tabs (dynamic from DB) ── */}
                <div className="relative z-10 mt-6">
                    <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest mb-2">Filter by Category</p>
                    {catsLoading ? (
                        <div className="mt-4"><StatsSkeleton count={4} /></div>
                    ) : (
                        <div className="flex flex-wrap gap-1.5 bg-white/10 backdrop-blur-sm p-1.5 rounded-xl w-fit">
                            {allCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                        selectedCategory === cat
                                            ? "bg-white text-blue-700 shadow-md"
                                            : "text-blue-100 hover:text-white hover:bg-white/10"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-violet-400/20 rounded-full blur-2xl pointer-events-none" />
            </header>

            {/* ── Stats Strip ── */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Total Plans", value: stats.total, icon: <Sparkles size={16} />, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-500/10" },
                    { label: "Active Plans", value: stats.active, icon: <CheckCircle2 size={16} />, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                    { label: "Premium Tiers", value: stats.premium, icon: <Crown size={16} />, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10" },
                    { label: "Free Plans", value: stats.free, icon: <Gift size={16} />, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10" },
                ].map(s => (
                    <div key={s.label} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>{s.icon}</div>
                        <div>
                            <p className="text-2xl font-black text-[var(--text-main)]">{s.value}</p>
                            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                    <input
                        className="w-full h-9 pl-9 pr-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl text-sm font-semibold text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                        placeholder="Search plans..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                </div>

                {/* Tier filter (dynamic from DB data) */}
                <div className="flex flex-wrap gap-1 bg-[var(--card-bg)] border border-[var(--border-color)] p-1 rounded-xl">
                    {availableTiers.map(tier => (
                        <button
                            key={tier}
                            onClick={() => setSelectedTierFilter(tier)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                                selectedTierFilter === tier
                                    ? "bg-[var(--bg-main)] text-blue-600 shadow-sm border border-[var(--border-color)]"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                            }`}
                        >
                            {tier === "All" ? "All Tiers" : tier}
                        </button>
                    ))}
                </div>

                {/* Show inactive toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-[var(--text-muted)]">
                    <div
                        onClick={() => setShowInactive(v => !v)}
                        className={`w-9 h-5 rounded-full transition-colors cursor-pointer ${showInactive ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`}
                    >
                        <div className={`w-3.5 h-3.5 bg-white rounded-full shadow m-0.5 transition-transform ${showInactive ? "translate-x-4" : "translate-x-0"}`} />
                    </div>
                    Show Inactive
                </label>
            </div>

            {/* ── Plan Cards Grid ── */}
            {isLoading ? (
                <div className="mt-8">
                    <CardSkeleton count={3} />
                </div>
            ) : filteredPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 bg-[var(--card-bg)] border border-dashed border-[var(--border-color)] rounded-2xl">
                    <Crown size={32} className="text-[var(--text-muted)] opacity-30" />
                    <p className="text-sm font-bold text-[var(--text-muted)]">
                        {search || selectedTierFilter !== "All" ? "No plans match your filter" : "No plans configured"}
                    </p>
                    <button onClick={openCreate} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                        <Plus size={12} /> Create your first plan
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredPlans.map(plan => {
                        const cfg = TIER_CONFIG[plan.tier] ?? TIER_CONFIG.Basic;
                        const isUnlimited = !plan.maxBookingsPerDay || plan.maxBookingsPerDay === -1 || plan.maxBookingsPerDay === 0;
                        return (
                            <div
                                key={plan._id}
                                className={`relative flex flex-col bg-gradient-to-br ${cfg.gradient} border-2 ${cfg.border} rounded-2xl p-6 shadow-lg ${cfg.glow} hover:shadow-xl transition-all duration-300 group overflow-hidden ${!plan.isActive ? "opacity-60" : ""}`}
                            >
                                {/* Top row */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-10 h-10 rounded-xl ${cfg.badge} flex items-center justify-center`}>
                                            {cfg.icon}
                                        </div>
                                        <div>
                                            <p className="font-black text-[var(--text-main)] text-base leading-tight">{plan.name}</p>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.accent}`}>{plan.tier} · {plan.category}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => openEdit(plan)} className="w-8 h-8 rounded-lg bg-white/60 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 flex items-center justify-center text-[var(--text-muted)] hover:text-blue-600 transition-all border border-white/40">
                                        <Settings2 size={14} />
                                    </button>
                                </div>

                                {/* Price */}
                                <div className="mb-5">
                                    <div className="flex items-baseline gap-1">
                                        {plan.isFree || plan.price === 0 ? (
                                            <span className="text-4xl font-black text-[var(--text-main)]">FREE</span>
                                        ) : (
                                            <>
                                                <span className="text-xl font-bold text-[var(--text-muted)]">₹</span>
                                                <span className="text-4xl font-black text-[var(--text-main)]">{plan.price.toLocaleString()}</span>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-[var(--text-muted)] font-semibold mt-0.5">
                                        per {plan.validityDays} day{plan.validityDays !== 1 ? "s" : ""}
                                    </p>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-2 gap-2 mb-5">
                                    {[
                                        { icon: <TrendingUp size={11} />, label: "Commission", value: `${plan.commissionPercentage}%` },
                                        { icon: <Clock size={11} />, label: "Validity", value: `${plan.validityDays}d` },
                                        { icon: <Users size={11} />, label: "Bookings/Day", value: isUnlimited ? "∞ Unlimited" : `${plan.maxBookingsPerDay}/day` },
                                        { icon: <BadgeCheck size={11} />, label: "Status", value: plan.isActive ? "Active" : "Inactive" },
                                    ].map(m => (
                                        <div key={m.label} className="bg-white/50 dark:bg-white/5 rounded-lg px-3 py-2 flex items-center gap-1.5">
                                            <span className={cfg.accent}>{m.icon}</span>
                                            <div>
                                                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{m.label}</p>
                                                <p className="text-xs font-black text-[var(--text-main)]">{m.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Features */}
                                <div className="flex-1 space-y-1.5 mb-5">
                                    {(plan.features || []).slice(0, 5).map((f, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <CheckCircle2 size={13} className={`${cfg.accent} mt-0.5 shrink-0`} />
                                            <span className="text-[11px] font-semibold text-[var(--text-main)]">{f}</span>
                                        </div>
                                    ))}
                                    {(plan.features || []).length > 5 && (
                                        <p className={`text-[10px] font-bold ${cfg.accent} pl-5`}>+{plan.features.length - 5} more benefits</p>
                                    )}
                                    {(plan.features || []).length === 0 && (
                                        <p className="text-[11px] text-[var(--text-muted)] italic">No features listed</p>
                                    )}
                                </div>

                                {/* Action row */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEdit(plan)}
                                        className={`flex-1 h-9 ${cfg.button} text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md`}
                                    >
                                        Configure <ChevronRight size={13} />
                                    </button>
                                    <button
                                        onClick={() => toggleActive(plan)}
                                        title={plan.isActive ? "Deactivate" : "Activate"}
                                        className={`h-9 px-3 rounded-xl text-xs font-bold transition-all border ${
                                            plan.isActive
                                                ? "border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                        }`}
                                    >
                                        {plan.isActive ? "Deactivate" : "Activate"}
                                    </button>
                                </div>

                                {/* Badges */}
                                {(plan.isFree || plan.price === 0) && (
                                    <div className="absolute top-3 right-14 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">FREE</div>
                                )}
                                {!plan.isActive && (
                                    <div className="absolute top-3 left-3 bg-slate-400 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">INACTIVE</div>
                                )}
                            </div>
                        );
                    })}

                    {/* Add New card */}
                    <button
                        onClick={openCreate}
                        className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[var(--border-color)] rounded-2xl p-8 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all group min-h-[280px]"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus size={22} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-[var(--text-main)]">Add New Plan</p>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">Configure a new subscription tier</p>
                        </div>
                    </button>
                </div>
            )}

            {/* ── Modal ── */}
            {editingPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingPlan(null)} />
                    <div className="relative w-full max-w-2xl bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Tier accent bar */}
                        <div className={`h-1.5 w-full ${
                            editingPlan.tier === "Premium" ? "bg-gradient-to-r from-amber-400 to-orange-500" :
                            editingPlan.tier === "Standard" ? "bg-gradient-to-r from-blue-500 to-indigo-500" :
                            "bg-gradient-to-r from-slate-400 to-slate-500"
                        }`} />

                        {/* Header */}
                        <div className="flex items-center justify-between px-7 py-5 border-b border-[var(--border-color)]">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${TIER_CONFIG[editingPlan.tier || "Basic"].badge}`}>
                                    {TIER_CONFIG[editingPlan.tier || "Basic"].icon}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                                        {editingPlan._id ? "Edit Plan" : "Create New Plan"}
                                    </p>
                                    <h3 className="text-base font-black text-[var(--text-main)]">{editingPlan.name || "Untitled Plan"}</h3>
                                </div>
                            </div>
                            <button onClick={() => setEditingPlan(null)} className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-main)] border border-[var(--border-color)] transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate({ ...editingPlan, features: editingPlan.features || [] }); }}>
                            <div className="p-7 space-y-5 max-h-[65vh] overflow-y-auto">

                                {/* Row 1 — Name & Tier */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Plan Name *</label>
                                        <input
                                            className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-semibold text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                            placeholder="e.g. Standard Plan"
                                            value={editingPlan.name || ""}
                                            onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Plan Tier *</label>
                                        <select
                                            className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-semibold text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                            value={editingPlan.tier || "Basic"}
                                            onChange={e => setEditingPlan({ ...editingPlan, tier: e.target.value as SubscriptionTier })}
                                        >
                                            <option value="Basic">🛡️ Basic</option>
                                            <option value="Standard">⭐ Standard</option>
                                            <option value="Premium">👑 Premium</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Category — dynamic input with datalist */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Category *</label>
                                    <input
                                        list="cat-options"
                                        className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-semibold text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                        placeholder="Type or pick a category (e.g. nurse, lab)"
                                        value={editingPlan.category || ""}
                                        onChange={e => setEditingPlan({ ...editingPlan, category: e.target.value })}
                                        required
                                    />
                                    <datalist id="cat-options">
                                        {dbCategories.map(c => <option key={c} value={c} />)}
                                        <option value="All" />
                                        <option value="doctor" />
                                        <option value="nurse" />
                                        <option value="lab" />
                                        <option value="ambulance" />
                                        <option value="rental" />
                                        <option value="physiotherapy" />
                                        <option value="caretaker" />
                                    </datalist>
                                    <p className="text-[9px] text-[var(--text-muted)] font-semibold">Type a new category or pick an existing one. Use "All" to apply to every category.</p>
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Description</label>
                                    <input
                                        className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-semibold text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                        placeholder="Short description shown to partners"
                                        value={editingPlan.description || ""}
                                        onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                                    />
                                </div>

                                {/* Row 3 — Price, Validity, Commission */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { label: "Price (₹)", key: "price", prefix: "₹", min: 0 },
                                        { label: "Validity (Days)", key: "validityDays", prefix: "📅", min: 1 },
                                        { label: "Commission (%)", key: "commissionPercentage", prefix: "%", min: 0 },
                                    ].map(f => (
                                        <div key={f.key} className="space-y-1.5">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{f.label}</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-[var(--text-muted)]">{f.prefix}</span>
                                                <input
                                                    type="number"
                                                    min={f.min}
                                                    className="w-full h-11 pl-8 pr-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                                    value={(editingPlan as any)[f.key] ?? 0}
                                                    onChange={e => setEditingPlan({ ...editingPlan, [f.key]: Number(e.target.value) })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Row 4 — Max bookings & Toggles */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Max Bookings / Day</label>
                                        <input
                                            type="number"
                                            className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                            placeholder="-1 for unlimited"
                                            value={editingPlan.maxBookingsPerDay ?? 5}
                                            onChange={e => setEditingPlan({ ...editingPlan, maxBookingsPerDay: Number(e.target.value) })}
                                        />
                                        <p className="text-[9px] text-[var(--text-muted)] font-semibold">Set -1 for unlimited</p>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {[
                                            { key: "isFree", label: "Free Plan", desc: "No payment required" },
                                            { key: "isActive", label: "Active", desc: "Visible to partners" },
                                        ].map(sw => (
                                            <label key={sw.key} className="flex items-center justify-between bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 cursor-pointer hover:border-blue-400 transition-all">
                                                <div>
                                                    <p className="text-xs font-bold text-[var(--text-main)]">{sw.label}</p>
                                                    <p className="text-[9px] text-[var(--text-muted)] font-semibold">{sw.desc}</p>
                                                </div>
                                                <div
                                                    onClick={() => setEditingPlan({ ...editingPlan, [sw.key]: !(editingPlan as any)[sw.key] })}
                                                    className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${(editingPlan as any)[sw.key] ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm m-0.5 transition-transform ${(editingPlan as any)[sw.key] ? "translate-x-5" : "translate-x-0"}`} />
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Features chips */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                                        <Sparkles size={11} /> Plan Benefits & Features
                                    </label>
                                    {(editingPlan.features || []).length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl">
                                            {(editingPlan.features || []).map((f, i) => (
                                                <span key={i} className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                                                    <CheckCircle2 size={9} /> {f}
                                                    <button type="button" onClick={() => removeFeature(i)} className="ml-0.5 text-blue-400 hover:text-red-500 transition-colors">
                                                        <X size={10} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 h-10 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-semibold text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                            placeholder='Type a benefit and press Add or Enter'
                                            value={featureInput}
                                            onChange={e => setFeatureInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                                        />
                                        <button
                                            type="button"
                                            onClick={addFeature}
                                            className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                                        >
                                            <Plus size={13} /> Add
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-[var(--text-muted)] font-semibold">Paste comma-separated values to add multiple at once</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-7 py-4 border-t border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-main)]">
                                <div>
                                    {editingPlan._id && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const isConfirmed = await confirm({
                                                    title: "Delete Plan",
                                                    message: "Permanently delete this plan?",
                                                    confirmText: "Delete",
                                                    type: "danger"
                                                });
                                                if (isConfirmed) deleteMutation.mutate(editingPlan._id!);
                                            }}
                                            className="h-9 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                                        >
                                            <Trash2 size={13} /> Delete
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingPlan(null)}
                                        className="h-9 px-5 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold rounded-xl hover:bg-[var(--border-color)] transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saveMutation.isPending}
                                        className="h-9 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-blue-200 dark:shadow-blue-900/30 disabled:opacity-60"
                                    >
                                        {saveMutation.isPending ? <><Loader2 size={12} className="animate-spin" /> Saving...</> : <><Zap size={12} /> Save Plan</>}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
