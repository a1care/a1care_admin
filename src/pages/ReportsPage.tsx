import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    IndianRupee,
    CalendarDays,
    TrendingUp,
    Loader2,
    Users,
    Stethoscope,
    BarChart3
} from "lucide-react";
import { StatsSkeleton, TableSkeleton } from "@/components/ui/Skeletons";

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
    if (u.includes("COMPLET")) return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400";
    if (u.includes("CANCEL")) return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400";
    if (u.includes("CONFIRM") || u.includes("ACCEPT")) return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400";
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400";
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
    const cards = [
        { label: "Total Revenue", value: rev?.total, icon: <IndianRupee size={14} />, color: "text-emerald-600 dark:text-emerald-400", money: true },
        { label: "This Month", value: rev?.month, icon: <TrendingUp size={14} />, color: "text-blue-600 dark:text-blue-400", money: true },
        { label: "Today", value: rev?.today, icon: <CalendarDays size={14} />, color: "text-indigo-600 dark:text-indigo-400", money: true },
        { label: "Total Bookings", value: overview?.kpis?.totalBookings, icon: <Users size={14} />, color: "text-amber-600 dark:text-amber-400", money: false },
    ];

    return (
        <div className="space-y-6 animate-in">
            {/* ── Page Header ── */}
            <header className="flex flex-col gap-2 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden text-left items-start">
                <div className="relative z-10 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">Reports & Analytics</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">
                                    Home • Analytics • Reports
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-12 right-32 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            </header>

            {/* ── Revenue overview cards in a single row ── */}
            <div className="grid grid-cols-4 gap-3">
                {cards.map((c) => (
                    <div key={c.label} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 text-left">
                        <div className={`flex items-center gap-1.5 text-xs font-medium mb-2 ${c.color}`}>
                            {c.icon}
                            {c.label}
                        </div>
                        <div className="text-2xl font-bold text-[var(--text-main)]">
                            {loadingOverview ? (
                                <StatsSkeleton count={1} />
                            ) : c.money === false ? (
                                (c.value ?? 0)
                            ) : (
                                `₹${(c.value ?? 0).toLocaleString("en-IN")}`
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Recent Bookings and Performance Split ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Section 1: Recent Bookings */}
                <section className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm flex flex-col justify-between text-left">
                    <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center gap-2 bg-[var(--bg-main)]">
                        <CalendarDays size={15} className="text-blue-500" />
                        <h3 className="text-sm font-bold text-[var(--text-main)]">Recent Bookings</h3>
                    </div>

                    {loadingRecent ? (
                        <TableSkeleton columns={5} rows={5} showHeader={false} />
                    ) : recent.length === 0 ? (
                        <div className="py-20 text-center text-xs text-[var(--text-muted)]">No recent bookings found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                        <th className="py-3 px-4">Patient</th>
                                        <th className="py-3 px-4">Provider</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {recent.map((b) => (
                                        <tr key={b.id} className="hover:bg-[var(--bg-main)] transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="font-semibold text-sm text-[var(--text-main)]">{b.patient}</div>
                                                <div className="text-xs text-[var(--text-muted)] mt-0.5 uppercase tracking-wider font-semibold">{b.type}</div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-[var(--text-main)]">
                                                {b.provider}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColor(b.status)}`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right text-sm font-bold text-[var(--text-main)]">
                                                ₹{b.amount ?? 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Section 2: Provider Performance */}
                <section className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm flex flex-col justify-between text-left">
                    <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center gap-2 bg-[var(--bg-main)]">
                        <Stethoscope size={15} className="text-emerald-500" />
                        <h3 className="text-sm font-bold text-[var(--text-main)]">Provider Performance</h3>
                    </div>

                    {loadingPerf ? (
                        <TableSkeleton columns={6} rows={5} showHeader={false} />
                    ) : performance.length === 0 ? (
                        <div className="py-20 text-center text-xs text-[var(--text-muted)]">No provider metrics reported.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                        <th className="py-3 px-4">Provider</th>
                                        <th className="py-3 px-4 text-center">Bookings</th>
                                        <th className="py-3 px-4 text-center">Completed</th>
                                        <th className="py-3 px-4 text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {performance.map((p) => (
                                        <tr key={p.id} className="hover:bg-[var(--bg-main)] transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="font-semibold text-sm text-[var(--text-main)]">{p.name || "Unnamed"}</div>
                                                {p.mobile && <div className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">{p.mobile}</div>}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm font-semibold text-[var(--text-main)]">
                                                {p.stats?.total ?? 0}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                                {p.stats?.completed ?? 0}
                                            </td>
                                            <td className="py-3 px-4 text-right text-sm font-bold text-[var(--text-main)]">
                                                ₹{(p.stats?.revenue ?? 0).toLocaleString("en-IN")}
                                            </td>
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
