import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    Gift,
    Users,
    CheckCircle2,
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Clock,
    AlertCircle,
    Settings,
    Save
} from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/Skeletons";

interface PartyRef {
    _id?: string;
    name?: string;
    mobileNumber?: string;
}

interface Referral {
    _id: string;
    referrerId?: PartyRef | string;
    refereeId?: PartyRef | string;
    referralCode?: string;
    status?: "PENDING" | "REWARDED";
    rewardAmount?: number;
    createdAt?: string;
}

interface ReferralStats {
    items: Referral[];
    total: number;
    rewarded: number;
    totalRewardPaid: number;
    page: number;
    totalPages: number;
}

const partyName = (p?: PartyRef | string) =>
    p && typeof p === "object" ? p.name || p.mobileNumber || "Unknown" : "Unknown";
const partyMobile = (p?: PartyRef | string) =>
    p && typeof p === "object" ? p.mobileNumber || "" : "";

export function ReferralsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");

    // Configuration state
    const [customerReward, setCustomerReward] = useState("100");
    const [partnerReward, setPartnerReward] = useState("100");

    const { data: configData, refetch: refetchConfig } = useQuery({
        queryKey: ["referral-config"],
        queryFn: async () => {
            const res = await api.get("/referral/config");
            return res.data?.data;
        }
    });

    // Populate local state when config is fetched
    useEffect(() => {
        if (configData) {
            if (configData.customerRewardAmount !== undefined) setCustomerReward(String(configData.customerRewardAmount));
            if (configData.partnerRewardAmount !== undefined) setPartnerReward(String(configData.partnerRewardAmount));
        }
    }, [configData]);

    const updateConfigMutation = useMutation({
        mutationFn: async (payload: { customerRewardAmount: number, partnerRewardAmount: number }) => {
            await api.put("/referral/config", payload);
        },
        onSuccess: () => {
            toast.success("Configuration updated successfully!");
            refetchConfig();
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to update configuration");
        }
    });

    const approveReferralMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.put(`/admin/referral/${id}/approve`);
        },
        onSuccess: () => {
            toast.success("Referral reward credited successfully!");
            queryClient.invalidateQueries({ queryKey: ["admin-referrals"] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to approve referral");
        }
    });

    const handleSaveConfig = () => {
        const cReward = Number(customerReward);
        const pReward = Number(partnerReward);
        if (isNaN(cReward) || isNaN(pReward) || cReward < 0 || pReward < 0) {
            toast.error("Invalid amounts entered");
            return;
        }
        updateConfigMutation.mutate({ customerRewardAmount: cReward, partnerRewardAmount: pReward });
    };

    const { data, isLoading } = useQuery<ReferralStats>({
        queryKey: ["admin-referrals", page],
        queryFn: async () => {
            const res = await api.get("/admin/referrals", { params: { page, limit } });
            const d = res.data?.data ?? res.data;
            return {
                items: d?.items ?? [],
                total: d?.total ?? 0,
                rewarded: d?.rewarded ?? 0,
                totalRewardPaid: d?.totalRewardPaid ?? 0,
                page: d?.page ?? 1,
                totalPages: d?.totalPages ?? 1,
            };
        },
    });

    const items = data?.items ?? [];
    const filtered = items.filter((r) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            r.referralCode?.toLowerCase().includes(q) ||
            partyName(r.referrerId).toLowerCase().includes(q) ||
            partyName(r.refereeId).toLowerCase().includes(q) ||
            partyMobile(r.referrerId).includes(q) ||
            partyMobile(r.refereeId).includes(q)
        );
    });

    const statCards = [
        { label: "Total Referrals", value: data?.total ?? 0, icon: <Users size={14} />, color: "text-blue-600 dark:text-blue-400" },
        { label: "Rewarded", value: data?.rewarded ?? 0, icon: <CheckCircle2 size={14} />, color: "text-emerald-600 dark:text-emerald-400" },
        { label: "Pending", value: Math.max(0, (data?.total ?? 0) - (data?.rewarded ?? 0)), icon: <Clock size={14} />, color: "text-amber-600 dark:text-amber-400" },
        { label: "Total Paid", value: `₹${data?.totalRewardPaid ?? 0}`, icon: <TrendingUp size={14} />, color: "text-indigo-600 dark:text-indigo-400" },
    ];

    const totalPages = data?.totalPages || 1;

    return (
        <div className="space-y-6 animate-in">
            {/* ── Page Header ── */}
            <header className="flex flex-col gap-2 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden text-left items-start">
                <div className="relative z-10 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">Referral Campaigns</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">
                                    Home • Campaigns • Referrals
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-12 right-32 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            </header>

            {/* ── Configuration Section (Table Layout) ── */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex items-center gap-2">
                    <Settings size={16} className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">Referral Rewards Configuration</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] bg-[var(--card-bg)]">
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider w-1/2">Customer Reward (₹)</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider w-1/2">Partner Reward (₹)</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            <tr className="hover:bg-[var(--bg-main)] transition-colors">
                                <td className="py-3.5 px-4">
                                    <div className="relative max-w-[200px]">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-semibold">₹</span>
                                        <input 
                                            type="number"
                                            value={customerReward}
                                            onChange={e => setCustomerReward(e.target.value)}
                                            className="w-full h-9 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg pl-7 pr-3 text-sm font-bold text-[var(--text-main)] outline-none focus:border-blue-500 transition-all shadow-sm"
                                            placeholder="100"
                                        />
                                    </div>
                                </td>
                                <td className="py-3.5 px-4">
                                    <div className="relative max-w-[200px]">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-semibold">₹</span>
                                        <input 
                                            type="number"
                                            value={partnerReward}
                                            onChange={e => setPartnerReward(e.target.value)}
                                            className="w-full h-9 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg pl-7 pr-3 text-sm font-bold text-[var(--text-main)] outline-none focus:border-blue-500 transition-all shadow-sm"
                                            placeholder="100"
                                        />
                                    </div>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                    <button 
                                        onClick={handleSaveConfig}
                                        disabled={updateConfigMutation.isPending}
                                        className="h-9 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm ml-auto whitespace-nowrap disabled:opacity-70"
                                    >
                                        {updateConfigMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        Save Config
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-4 gap-3">
                {statCards.map(s => (
                    <div
                        key={s.label}
                        className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 text-left"
                    >
                        <div className={`flex items-center gap-1.5 text-xs font-medium mb-2 ${s.color}`}>
                            {s.icon}
                            {s.label}
                        </div>
                        <div className="text-2xl font-bold text-[var(--text-main)]">{s.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Search Toolbar ── */}
            <div style={{ position: "relative", width: "320px", flexShrink: 0 }}>
                <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", zIndex: 10 }} />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by TxnID, name, phone..."
                    style={{
                        width: "100%", height: 42, borderRadius: 12, paddingLeft: 38, paddingRight: 14,
                        background: "var(--card-bg)", border: "1.5px solid var(--border-color)",
                        fontSize: "0.875rem", color: "var(--text-main)", outline: "none",
                        fontFamily: "inherit", boxSizing: "border-box"
                    }}
                />
            </div>

            {/* ── Referrals Table Card ── */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider w-12">#</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Referrer</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Referred Friend</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Referral Code</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Reward Amount</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Date Created</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="p-0">
                                        <TableSkeleton columns={8} rows={5} showHeader={false} />
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-center mx-auto text-[var(--text-muted)]">
                                                <Gift size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--text-main)]">No referrals yet</p>
                                                <p className="text-xs text-[var(--text-muted)] mt-0.5">Referrals registry is currently empty.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((r, index) => (
                                    <tr key={r._id} className="hover:bg-[var(--bg-main)] transition-colors group">
                                        <td className="py-3.5 px-4 text-xs font-semibold text-[var(--text-muted)]">
                                            {String((page - 1) * limit + index + 1).padStart(2, '0')}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-semibold text-sm text-[var(--text-main)]">
                                                {partyName(r.referrerId)}
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] mt-0.5">
                                                {partyMobile(r.referrerId)}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-semibold text-sm text-[var(--text-main)]">
                                                {partyName(r.refereeId)}
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] mt-0.5">
                                                {partyMobile(r.refereeId)}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded">
                                                {r.referralCode || "—"}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap text-sm font-bold text-[var(--text-main)]">
                                            ₹{r.rewardAmount ?? 0}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border
                                                ${r.status === "REWARDED" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400"}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${r.status === "REWARDED" ? "bg-emerald-400" : "bg-amber-400"}`} />
                                                {r.status || "PENDING"}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
                                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            {r.status === "PENDING" && (
                                                <button
                                                    onClick={() => {
                                                        if (confirm("Are you sure you want to credit this reward to the referrer's wallet?")) {
                                                            approveReferralMutation.mutate(r._id);
                                                        }
                                                    }}
                                                    disabled={approveReferralMutation.isPending}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                                                >
                                                    {approveReferralMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Gift size={12} />}
                                                    Credit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                {totalPages > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-color)] bg-[var(--card-bg)]">
                        <div className="flex items-center gap-4">
                            <p className="text-xs text-[var(--text-muted)]">
                                Showing <span className="font-semibold text-[var(--text-main)]">{(page - 1) * limit + (filtered.length > 0 ? 1 : 0)}</span> to <span className="font-semibold text-[var(--text-main)]">{Math.min(page * limit, data?.total || 0)}</span> of <span className="font-semibold text-[var(--text-main)]">{data?.total || 0}</span> entries
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-[var(--text-muted)]">Rows per page:</span>
                                <select 
                                    value={limit} 
                                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                    className="h-7 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-md px-1 text-[var(--text-main)] outline-none cursor-pointer"
                                >
                                    {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="text-xs font-semibold px-2 text-[var(--text-main)]">Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReferralsPage;
