import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    TrendingUp,
    IndianRupee,
    Users,
    Percent,
    ChevronLeft,
    ChevronRight,
    Download,
    Calendar,
    Loader2,
    BarChart3,
    ArrowUpDown,
    Wallet,
    Building2,
    RefreshCw,
} from "lucide-react";

interface CommissionRow {
    _id: string;
    bookingType: string;
    partnerName: string;
    grossAmount: number;
    commissionPct: number;
    commissionAmount: number;
    partnerEarning: number;
    createdAt: string;
}

interface CommissionSummary {
    totalGross: number;
    totalCommission: number;
    totalPartnerEarning: number;
    totalBookings: number;
}

interface CommissionReportData {
    summary: CommissionSummary;
    items: CommissionRow[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const fmt = (n: number) =>
    "₹" + (n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function CommissionReportPage() {
    const [page, setPage] = useState(1);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [sortField, setSortField] = useState<"createdAt" | "commissionAmount" | "grossAmount">("createdAt");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    const params = new URLSearchParams({ 
        page: String(page), 
        limit: "25",
        sortBy: sortField,
        sortDir: sortDir 
    });
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);

    const { data, isLoading, isFetching, refetch } = useQuery<CommissionReportData>({
        queryKey: ["admin-commission-report", page, fromDate, toDate, sortField, sortDir],
        queryFn: async () => {
            const res = await api.get(`/admin/commission/report?${params.toString()}`);
            return res.data.data;
        },
        staleTime: 30000,
        refetchOnWindowFocus: false,
    });

    const summary = data?.summary;
    const items = data?.items || [];
    const totalPages = data?.totalPages || 1;

    // Backend provides sorted items now
    const sorted = items;

    function toggleSort(field: typeof sortField) {
        if (sortField === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
        else { setSortField(field); setSortDir("desc"); }
    }

    // CSV export
    function exportCSV() {
        const header = ["#", "Date", "Partner", "Booking Type", "Gross Amount", "Commission %", "Platform Commission", "Partner Earning"];
        const rows = sorted.map((r, i) => [
            i + 1,
            formatDate(r.createdAt),
            r.partnerName,
            r.bookingType,
            r.grossAmount.toFixed(2),
            r.commissionPct + "%",
            r.commissionAmount.toFixed(2),
            r.partnerEarning.toFixed(2),
        ]);
        const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `commission_report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    }

    const commissionRate = summary && summary.totalGross > 0
        ? ((summary.totalCommission / summary.totalGross) * 100).toFixed(1)
        : "0.0";

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            {/* ── Page Header ── */}
            <header className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden">
                {/* Gradient accent */}
                <div className="absolute inset-0 pointer-events-none opacity-40"
                    style={{ background: "radial-gradient(ellipse at top right, rgba(99,102,241,0.15) 0%, transparent 60%)" }} />

                <div className="relative z-10 text-left">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-md mb-2">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Live Revenue Intelligence</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)]">Platform Commission Report</h1>
                    <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
                        Home • Payouts • Commission Report &nbsp;|&nbsp; Per-booking breakdown of gross revenue, platform fee & partner payout
                    </p>
                </div>

                <div className="relative z-10 flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        className="h-9 px-4 flex items-center gap-2 border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-indigo-600 hover:border-indigo-400 transition-all"
                    >
                        <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Refresh
                    </button>
                    <button
                        onClick={exportCSV}
                        className="h-9 px-4 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                    >
                        <Download size={13} /> Export CSV
                    </button>
                </div>
            </header>

            {/* ── Summary KPI Cards ── */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    {
                        label: "Total Gross Revenue",
                        value: fmt(summary?.totalGross ?? 0),
                        sub: `From ${summary?.totalBookings ?? 0} bookings`,
                        icon: IndianRupee,
                        color: "text-emerald-600 dark:text-emerald-400",
                        bg: "bg-emerald-50 dark:bg-emerald-500/10",
                        border: "border-emerald-100 dark:border-emerald-500/20",
                    },
                    {
                        label: "Platform Commission Earned",
                        value: fmt(summary?.totalCommission ?? 0),
                        sub: `Avg ${commissionRate}% per booking`,
                        icon: Building2,
                        color: "text-indigo-600 dark:text-indigo-400",
                        bg: "bg-indigo-50 dark:bg-indigo-500/10",
                        border: "border-indigo-100 dark:border-indigo-500/20",
                    },
                    {
                        label: "Partner Earnings (80%)",
                        value: fmt(summary?.totalPartnerEarning ?? 0),
                        sub: "Paid / to be paid to partners",
                        icon: Wallet,
                        color: "text-blue-600 dark:text-blue-400",
                        bg: "bg-blue-50 dark:bg-blue-500/10",
                        border: "border-blue-100 dark:border-blue-500/20",
                    },
                    {
                        label: "Effective Commission Rate",
                        value: `${commissionRate}%`,
                        sub: `Across ${summary?.totalBookings ?? 0} transactions`,
                        icon: Percent,
                        color: "text-amber-600 dark:text-amber-400",
                        bg: "bg-amber-50 dark:bg-amber-500/10",
                        border: "border-amber-100 dark:border-amber-500/20",
                    },
                ].map((kpi) => (
                    <div key={kpi.label} className={`bg-[var(--card-bg)] border ${kpi.border} rounded-2xl p-5 flex flex-col gap-3 shadow-sm`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                            <kpi.icon size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-black tracking-tight text-[var(--text-main)]">{kpi.value}</p>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">{kpi.label}</p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{kpi.sub}</p>
                        </div>
                    </div>
                ))}
            </section>

            {/* ── Revenue Split Visual ── */}
            {summary && summary.totalGross > 0 && (
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center">
                            <BarChart3 size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-[var(--text-main)]">Revenue Split Breakdown</h2>
                            <p className="text-[10px] text-[var(--text-muted)]">Platform Commission vs Partner Earnings</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {/* Gross bar */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Platform Commission (Admin)</span>
                                <span className="text-xs font-bold text-indigo-600">{fmt(summary.totalCommission)} ({commissionRate}%)</span>
                            </div>
                            <div className="h-3 bg-[var(--bg-main)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-700"
                                    style={{ width: `${(summary.totalCommission / summary.totalGross) * 100}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Partner Earnings</span>
                                <span className="text-xs font-bold text-emerald-600">{fmt(summary.totalPartnerEarning)} ({(100 - parseFloat(commissionRate)).toFixed(1)}%)</span>
                            </div>
                            <div className="h-3 bg-[var(--bg-main)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                                    style={{ width: `${(summary.totalPartnerEarning / summary.totalGross) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[var(--border-color)]">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500" />
                            <span className="text-[10px] font-semibold text-[var(--text-muted)]">Platform Fee → Super Admin</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-semibold text-[var(--text-muted)]">Partner Payout → Service Provider</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Filters ── */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-5 py-4 flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">From Date</label>
                    <div className="relative">
                        <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                            className="h-9 pl-9 pr-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-semibold text-[var(--text-main)] outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">To Date</label>
                    <div className="relative">
                        <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                            className="h-9 pl-9 pr-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-semibold text-[var(--text-main)] outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>
                {(fromDate || toDate) && (
                    <button
                        onClick={() => { setFromDate(""); setToDate(""); setPage(1); }}
                        className="h-9 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-semibold text-[var(--text-muted)] hover:text-rose-600 hover:border-rose-400 transition-all"
                    >
                        Clear Filters
                    </button>
                )}
                <div className="ml-auto text-right">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Records</p>
                    <p className="text-lg font-black text-[var(--text-main)]">{data?.total ?? 0}</p>
                </div>
            </div>

            {/* ── Commission Table ── */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center">
                            <TrendingUp size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-[var(--text-main)]">Per-Booking Commission Ledger</h2>
                            <p className="text-[10px] text-[var(--text-muted)]">Industry-level breakdown: Gross → Platform Fee → Partner Payout</p>
                        </div>
                    </div>
                    {isFetching && <Loader2 size={16} className="animate-spin text-indigo-500" />}
                </div>

                {isLoading ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <Loader2 size={28} className="animate-spin text-indigo-500" />
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Loading Commission Data...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[900px]">
                            <thead>
                                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                    <th className="py-3 px-4 w-10">#</th>
                                    <th className="py-3 px-4">
                                        <button onClick={() => toggleSort("createdAt")} className="flex items-center gap-1 hover:text-[var(--text-main)] transition-colors">
                                            Date <ArrowUpDown size={11} />
                                        </button>
                                    </th>
                                    <th className="py-3 px-4">Partner</th>
                                    <th className="py-3 px-4">Booking Type</th>
                                    <th className="py-3 px-4 text-right">
                                        <button onClick={() => toggleSort("grossAmount")} className="flex items-center gap-1 ml-auto hover:text-[var(--text-main)] transition-colors">
                                            Gross Amount <ArrowUpDown size={11} />
                                        </button>
                                    </th>
                                    <th className="py-3 px-4 text-center">Commission %</th>
                                    <th className="py-3 px-4 text-right">
                                        <button onClick={() => toggleSort("commissionAmount")} className="flex items-center gap-1 ml-auto hover:text-[var(--text-main)] transition-colors">
                                            Platform Fee <ArrowUpDown size={11} />
                                        </button>
                                    </th>
                                    <th className="py-3 px-4 text-right">Partner Payout</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {sorted.map((row, idx) => {
                                    const commPct = row.commissionPct || 20;
                                    return (
                                        <tr key={row._id} className="hover:bg-[var(--bg-main)] transition-colors group">
                                            <td className="py-3 px-4 text-[10px] font-mono text-[var(--text-muted)]">
                                                {(page - 1) * 50 + idx + 1}
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-xs font-semibold text-[var(--text-main)]">{formatDate(row.createdAt)}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                                                        {row.partnerName?.[0] || "P"}
                                                    </div>
                                                    <span className="text-xs font-semibold text-[var(--text-main)]">{row.partnerName}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                                                    {row.bookingType}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className="text-sm font-black text-[var(--text-main)]">{fmt(row.grossAmount)}</span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded-full text-[10px] font-bold">
                                                    <Percent size={9} /> {commPct}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{fmt(row.commissionAmount)}</span>
                                                    <div className="w-16 h-1 bg-[var(--bg-main)] rounded-full mt-1 overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-400 rounded-full"
                                                            style={{ width: `${commPct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{fmt(row.partnerEarning)}</span>
                                                    <div className="w-16 h-1 bg-[var(--bg-main)] rounded-full mt-1 overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-400 rounded-full"
                                                            style={{ width: `${100 - commPct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {sorted.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                                                <TrendingUp size={28} className="opacity-30" />
                                                <p className="text-xs font-semibold">No commission records found for the selected period.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {/* ── Footer Totals ── */}
                            {sorted.length > 0 && (
                                <tfoot>
                                    <tr className="border-t-2 border-[var(--border-color)] bg-[var(--bg-main)]">
                                        <td className="py-3 px-4" colSpan={4}>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                                Page Subtotal ({sorted.length} rows)
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right text-sm font-black text-[var(--text-main)]">
                                            {fmt(sorted.reduce((s, r) => s + r.grossAmount, 0))}
                                        </td>
                                        <td className="py-3 px-4" />
                                        <td className="py-3 px-4 text-right text-sm font-black text-indigo-600">
                                            {fmt(sorted.reduce((s, r) => s + r.commissionAmount, 0))}
                                        </td>
                                        <td className="py-3 px-4 text-right text-sm font-black text-emerald-600">
                                            {fmt(sorted.reduce((s, r) => s + r.partnerEarning, 0))}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                )}

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div className="px-5 py-3.5 border-t border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-main)]">
                        <p className="text-xs text-[var(--text-muted)] font-semibold">
                            Page <span className="text-[var(--text-main)] font-bold">{page}</span> / {totalPages}
                            &nbsp;·&nbsp; {data?.total} total records
                        </p>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="w-8 h-8 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-indigo-600 hover:border-indigo-400 transition-all disabled:opacity-30"
                            >
                                <ChevronLeft size={15} />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="w-8 h-8 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-indigo-600 hover:border-indigo-400 transition-all disabled:opacity-30"
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
