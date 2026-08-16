import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  TrendingUp,
  Receipt,
  Gift,
  Clock,
  Loader2,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { StatsSkeleton, TableSkeleton } from "@/components/ui/Skeletons";
import { PageBanner } from "@/components/ui/PageBanner";

function KPICard({ title, value, icon, loading }: { title: string, value: string, icon: React.ReactNode, loading?: boolean }) {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-3 flex flex-col justify-between transition-all hover:shadow-md min-h-[90px] overflow-hidden">
      <div className="flex justify-between items-start mb-1.5">
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider pr-2 leading-tight">{title}</span>
        <div className="shrink-0 p-1 rounded-md bg-[var(--bg-main)] text-[var(--text-main)]">
          {icon}
        </div>
      </div>
      <div className="text-lg sm:text-xl font-bold text-[var(--text-main)] truncate">{loading ? "..." : value}</div>
    </div>
  );
}

interface LedgerEntry {
  id: string;
  type: "CREDIT" | "CREDIT_GMV" | "DEBIT";
  title: string;
  amount: number;
  date: string;
  status: string;
}

interface WalletData {
  grossVolume: number;
  subscriptionRevenue: number;
  totalCommission: number;
  pendingPayouts: number;
  paidPayouts: number;
  totalReferralRewards: number;
  netRevenue: number;
  recentLedger: LedgerEntry[];
}

export function SuperAdminWalletPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<WalletData>({
    queryKey: ["super-admin-wallet"],
    queryFn: async () => {
      const res = await api.get("/admin/super-admin-wallet");
      return res.data.data;
    },
  });

  const totalPages = data ? Math.ceil(data.recentLedger.length / itemsPerPage) : 1;
  const currentLedgerPage = data ? data.recentLedger.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in pb-12">
        <StatsSkeleton count={4} />
        <TableSkeleton columns={5} rows={5} showHeader={false} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-red-700 mb-4">Error Loading Wallet</h2>
          <p className="text-xl text-red-600 mb-6">We could not load the financial data. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-lg flex items-center gap-2 mx-auto"
          >
            <RefreshCcw size={24} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* ── Page Header ── */}
      <PageBanner 
          title="Super Admin Wallet" 
          subtitle="A comprehensive ledger of all money flowing through A1Care."
      >
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2 h-9 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shrink-0 backdrop-blur-sm"
          >
            <RefreshCcw size={14} className={isRefetching ? "animate-spin" : ""} />
            <span>{isRefetching ? "Refreshing..." : "Refresh Data"}</span>
          </button>
      </PageBanner>

      {/* ── Stats Rows ── */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
        <div className="flex sm:grid sm:grid-cols-7 gap-3 min-w-[900px] sm:min-w-0">
        <KPICard title="Net Profit" value={`₹${data.netRevenue.toLocaleString()}`} icon={<TrendingUp size={14} className="text-emerald-500" />} loading={isRefetching} />
        <KPICard title="Total Commission" value={`₹${data.totalCommission.toLocaleString()}`} icon={<Building size={14} className="text-blue-500" />} loading={isRefetching} />
        <KPICard title="Gross Volume" value={`₹${data.grossVolume.toLocaleString()}`} icon={<ArrowUpRight size={14} className="text-purple-500" />} loading={isRefetching} />
        <KPICard title="Pending Payouts" value={`₹${data.pendingPayouts.toLocaleString()}`} icon={<Clock size={14} className="text-orange-500" />} loading={isRefetching} />
        <KPICard title="Subscription Revenue" value={`₹${data.subscriptionRevenue.toLocaleString()}`} icon={<Receipt size={14} className="text-blue-500" />} loading={isRefetching} />
        <KPICard title="Referral Rewards" value={`₹${data.totalReferralRewards.toLocaleString()}`} icon={<Gift size={14} className="text-pink-500" />} loading={isRefetching} />
        <KPICard title="Payouts Paid Out" value={`₹${data.paidPayouts.toLocaleString()}`} icon={<ArrowDownRight size={14} className="text-emerald-500" />} loading={isRefetching} />
      </div>
      </div>

      {/* ── Ledger Table ── */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider w-10">#</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Txn ID</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider min-w-[180px]">Description</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Date & Time</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {data.recentLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-sm font-medium text-[var(--text-muted)]">
                    No recent transactions found.
                  </td>
                </tr>
              ) : (
                currentLedgerPage.map((entry, idx) => (
                  <tr key={`${entry.id}-${idx}`} className="hover:bg-[var(--bg-main)] transition-colors group">
                    <td className="py-3.5 px-4 text-xs font-medium text-[var(--text-muted)]">
                      {String((currentPage - 1) * 10 + idx + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded">
                        #{entry.id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-sm font-medium text-[var(--text-main)] truncate block max-w-[250px]">
                        {entry.title}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border
                        ${entry.type === "CREDIT" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : 
                          entry.type === "CREDIT_GMV" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
                          "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20"}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full
                          ${entry.type === "CREDIT" ? "bg-emerald-400" : entry.type === "CREDIT_GMV" ? "bg-blue-400" : "bg-orange-400"}
                        `} />
                        {entry.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[var(--text-main)]">
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">
                        {new Date(entry.date).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border
                          ${entry.status === "COMPLETED" || entry.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : 
                            entry.status === "PENDING" ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20" : 
                            "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20"}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full
                          ${entry.status === "COMPLETED" || entry.status === "SUCCESS" ? "bg-emerald-400" : entry.status === "PENDING" ? "bg-orange-400" : "bg-slate-400"}
                        `} />
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className={`text-sm font-semibold ${entry.type === "DEBIT" ? "text-[var(--text-main)]" : "text-emerald-600 dark:text-emerald-400"}`}>
                        ₹{entry.amount.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {entry.status}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-color)] bg-[var(--bg-main)]">
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                Showing page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] hover:text-[var(--text-main)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] hover:text-[var(--text-main)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
