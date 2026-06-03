import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    Gift,
    Users,
    CheckCircle2,
    IndianRupee,
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

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
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    const { data, isLoading } = useQuery<ReferralStats>({
        queryKey: ["admin-referrals", page],
        queryFn: async () => {
            const res = await api.get("/admin/referrals", { params: { page, limit: 50 } });
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
        { label: "Total Referrals", value: data?.total ?? 0, icon: Users, color: "blue" },
        { label: "Rewarded", value: data?.rewarded ?? 0, icon: CheckCircle2, color: "emerald" },
        { label: "Pending", value: Math.max(0, (data?.total ?? 0) - (data?.rewarded ?? 0)), icon: Gift, color: "amber" },
        { label: "Total Reward Paid", value: `₹${data?.totalRewardPaid ?? 0}`, icon: IndianRupee, color: "violet" },
    ];

    const colorMap: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
        emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
        amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
        violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center">
                        <Gift size={20} />
                    </span>
                    Referrals
                </h1>
                <p className="text-sm text-slate-400 mt-1">Track referral activity and rewards paid out to customers.</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map((c) => (
                    <div key={c.label} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${colorMap[c.color]}`}>
                            <c.icon size={18} />
                        </div>
                        <p className="text-2xl font-black text-[var(--text-main)]">{c.value}</p>
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mt-1">{c.label}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative mb-5 max-w-md">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by code, name or mobile…"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
            </div>

            {/* Table */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400">
                        <Loader2 className="animate-spin mr-2" size={20} /> Loading referrals…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Gift size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-400 font-semibold">No referrals yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--border-color)] text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="px-5 py-4">Referrer</th>
                                    <th className="px-5 py-4">Referred Friend</th>
                                    <th className="px-5 py-4">Code</th>
                                    <th className="px-5 py-4">Reward</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r) => (
                                    <tr key={r._id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-blue-500/5 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-bold text-[var(--text-main)]">{partyName(r.referrerId)}</div>
                                            <div className="text-xs font-mono text-slate-400">{partyMobile(r.referrerId)}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-bold text-[var(--text-main)]">{partyName(r.refereeId)}</div>
                                            <div className="text-xs font-mono text-slate-400">{partyMobile(r.refereeId)}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="font-black tracking-wide text-[var(--text-main)] bg-slate-500/10 px-2.5 py-1 rounded-lg text-xs">
                                                {r.referralCode || "—"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 font-bold text-[var(--text-main)]">₹{r.rewardAmount ?? 0}</td>
                                        <td className="px-5 py-4">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${r.status === "REWARDED" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                                                {r.status || "PENDING"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-slate-500 text-xs">
                                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {(data?.totalPages ?? 1) > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="w-10 h-10 rounded-xl border border-[var(--border-color)] flex items-center justify-center text-[var(--text-main)] disabled:opacity-40 hover:bg-slate-500/10 transition-all"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-bold text-[var(--text-main)]">
                        Page {page} of {data?.totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(data?.totalPages ?? 1, p + 1))}
                        disabled={page >= (data?.totalPages ?? 1)}
                        className="w-10 h-10 rounded-xl border border-[var(--border-color)] flex items-center justify-center text-[var(--text-main)] disabled:opacity-40 hover:bg-slate-500/10 transition-all"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default ReferralsPage;
