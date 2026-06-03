import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    BarChart3,
    IndianRupee,
    CalendarDays,
    TrendingUp,
    Loader2,
    Users,
    Stethoscope,
} from "lucide-react";

interface Overview {
    kpis: {
        totalBookings: number;
        todayBookings: number;
        revenue: { total: number; month: number; today: number };
    };
    alerts: { openTickets: number; failedPayments: number; pendingVerifications: number };
}

interface RecentBooking {
    id: string;
    type: string;
    patient: string;
    provider: string;
    status: string;
    amount: number;
    createdAt: string;
}

interface PerformanceRow {
    id: string;
    name: string;
    mobile?: string;
    stats: { total: number; completed: number; revenue: number };
}

const statusColor = (s: string) => {
    const u = (s || "").toUpperCase();
    if (u.includes("COMPLET")) return "bg-emerald-500/10 text-emerald-600";
    if (u.includes("CANCEL")) return "bg-rose-500/10 text-rose-500";
    if (u.includes("CONFIRM") || u.includes("ACCEPT")) return "bg-blue-500/10 text-blue-600";
    return "bg-amber-500/10 text-amber-600";
};

export function ReportsPage() {
    const { data: overview, isLoading: loadingOverview } = useQuery<Overview>({
        queryKey: ["reports-overview"],
        queryFn: async () => {
            const res = await api.get("/admin/dashboard/overview");
            return res.data?.data;
        },
    });

    const { data: recent = [], isLoading: loadingRecent } = useQuery<RecentBooking[]>({
        queryKey: ["reports-recent"],
        queryFn: async () => {
            const res = await api.get("/admin/dashboard/recent-bookings", { params: { limit: 12 } });
            return res.data?.data?.items ?? [];
        },
    });

    const { data: performance = [], isLoading: loadingPerf } = useQuery<PerformanceRow[]>({
        queryKey: ["reports-performance"],
        queryFn: async () => {
            const res = await api.get("/admin/dashboard/doctor-performance", { params: { limit: 15 } });
            return res.data?.data?.items ?? [];
        },
    });

    const rev = overview?.kpis?.revenue;
    const cards: { label: string; value?: number; icon: any; color: string; money: boolean }[] = [
        { label: "Total Revenue", value: rev?.total, icon: IndianRupee, color: "emerald", money: true },
        { label: "This Month", value: rev?.month, icon: TrendingUp, color: "blue", money: true },
        { label: "Today", value: rev?.today, icon: CalendarDays, color: "violet", money: true },
        { label: "Total Bookings", value: overview?.kpis?.totalBookings, icon: Users, color: "amber", money: false },
    ];
    const colorMap: Record<string, string> = {
        emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
        violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
        amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                        <BarChart3 size={20} />
                    </span>
                    Reports
                </h1>
                <p className="text-sm text-slate-400 mt-1">Revenue, recent bookings and provider performance.</p>
            </div>

            {/* Revenue Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {cards.map((c) => (
                    <div key={c.label} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${colorMap[c.color]}`}>
                            <c.icon size={18} />
                        </div>
                        <p className="text-2xl font-black text-[var(--text-main)]">
                            {loadingOverview ? "—" : c.money === false ? (c.value ?? 0) : `₹${(c.value ?? 0).toLocaleString("en-IN")}`}
                        </p>
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mt-1">{c.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Recent Bookings */}
                <section className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center gap-2">
                        <CalendarDays size={16} className="text-blue-600" />
                        <h2 className="font-black text-[var(--text-main)]">Recent Bookings</h2>
                    </div>
                    {loadingRecent ? (
                        <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="animate-spin mr-2" size={18} /> Loading…</div>
                    ) : recent.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 font-semibold">No recent bookings</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-[var(--border-color)]">
                                        <th className="px-5 py-3">Patient</th>
                                        <th className="px-5 py-3">Provider</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent.map((b) => (
                                        <tr key={b.id} className="border-b border-[var(--border-color)] last:border-0">
                                            <td className="px-5 py-3">
                                                <div className="font-bold text-[var(--text-main)]">{b.patient}</div>
                                                <div className="text-[10px] uppercase font-black text-slate-400">{b.type}</div>
                                            </td>
                                            <td className="px-5 py-3 text-slate-500">{b.provider}</td>
                                            <td className="px-5 py-3">
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${statusColor(b.status)}`}>{b.status}</span>
                                            </td>
                                            <td className="px-5 py-3 text-right font-bold text-[var(--text-main)]">₹{b.amount ?? 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Provider Performance */}
                <section className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center gap-2">
                        <Stethoscope size={16} className="text-emerald-600" />
                        <h2 className="font-black text-[var(--text-main)]">Provider Performance</h2>
                    </div>
                    {loadingPerf ? (
                        <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="animate-spin mr-2" size={18} /> Loading…</div>
                    ) : performance.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 font-semibold">No provider data</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-[var(--border-color)]">
                                        <th className="px-5 py-3">Provider</th>
                                        <th className="px-5 py-3 text-center">Bookings</th>
                                        <th className="px-5 py-3 text-center">Completed</th>
                                        <th className="px-5 py-3 text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {performance.map((p) => (
                                        <tr key={p.id} className="border-b border-[var(--border-color)] last:border-0">
                                            <td className="px-5 py-3">
                                                <div className="font-bold text-[var(--text-main)]">{p.name || "Unnamed"}</div>
                                                {p.mobile ? <div className="text-[11px] font-mono text-slate-400">{p.mobile}</div> : null}
                                            </td>
                                            <td className="px-5 py-3 text-center text-slate-500 font-bold">{p.stats?.total ?? 0}</td>
                                            <td className="px-5 py-3 text-center text-emerald-600 font-bold">{p.stats?.completed ?? 0}</td>
                                            <td className="px-5 py-3 text-right font-bold text-[var(--text-main)]">₹{(p.stats?.revenue ?? 0).toLocaleString("en-IN")}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default ReportsPage;
