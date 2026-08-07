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
      <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--color-primary)] mb-4" />
        <h2 className="text-2xl font-bold text-[var(--text-main)]">Loading Wallet Data...</h2>
        <p className="text-lg text-[var(--text-muted)]">Gathering financial reports from the server.</p>
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
    <div className="flex-1 bg-[var(--bg-main)] min-h-screen">
      {/* ── Header ── */}
      <div className="bg-[var(--card-bg)] border-b border-[var(--border-color)] px-8 py-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-7xl mx-auto">
          <div>
            <h1 className="text-4xl font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Wallet size={32} />
              </div>
              Super Admin Wallet
            </h1>
            <p className="text-xl text-[var(--text-muted)] mt-2 font-medium">
              A comprehensive ledger of all money flowing through A1Care.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="px-6 py-4 bg-white border-2 border-[var(--border-color)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-[var(--text-main)] font-bold rounded-xl text-lg flex items-center gap-3 transition-all shadow-sm"
          >
            <RefreshCcw size={24} className={isRefetching ? "animate-spin" : ""} />
            {isRefetching ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* ── Key Metrics Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Net Revenue (Profit) */}
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-bold text-emerald-800 uppercase tracking-wide">Net Platform Profit</p>
                <p className="text-sm font-semibold text-emerald-600 mt-1">Total Commission + Subscriptions (minus Rewards)</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                <TrendingUp size={28} />
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-5xl font-black text-emerald-700">₹{data.netRevenue.toLocaleString()}</h3>
            </div>
          </div>

          {/* Card 2: Total Commission */}
          <div className="bg-[var(--card-bg)] border-2 border-[var(--border-color)] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-bold text-[var(--text-main)] uppercase tracking-wide">Total Commission</p>
                <p className="text-sm font-semibold text-[var(--text-muted)] mt-1">A1Care's cut from all bookings</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                <Building size={28} />
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-4xl font-black text-[var(--text-main)]">₹{data.totalCommission.toLocaleString()}</h3>
            </div>
          </div>

          {/* Card 3: GMV */}
          <div className="bg-[var(--card-bg)] border-2 border-[var(--border-color)] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-bold text-[var(--text-main)] uppercase tracking-wide">Gross Volume</p>
                <p className="text-sm font-semibold text-[var(--text-muted)] mt-1">Total money spent by customers</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600 border border-purple-100">
                <ArrowUpRight size={28} />
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-4xl font-black text-[var(--text-main)]">₹{data.grossVolume.toLocaleString()}</h3>
            </div>
          </div>

          {/* Card 4: Pending Liabilities */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-bold text-orange-800 uppercase tracking-wide">Pending Payouts</p>
                <p className="text-sm font-semibold text-orange-600 mt-1">Money sitting in bank owed to partners</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                <Clock size={28} />
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-4xl font-black text-orange-700">₹{data.pendingPayouts.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* ── Sub Metrics ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wide">Subscription Revenue</p>
              <h4 className="text-2xl font-extrabold text-[var(--text-main)] mt-1">₹{data.subscriptionRevenue.toLocaleString()}</h4>
            </div>
            <Receipt className="text-blue-500 opacity-50" size={32} />
          </div>
          
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wide">Referral Rewards Paid</p>
              <h4 className="text-2xl font-extrabold text-[var(--text-main)] mt-1">₹{data.totalReferralRewards.toLocaleString()}</h4>
            </div>
            <Gift className="text-pink-500 opacity-50" size={32} />
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wide">Total Payouts Paid Out</p>
              <h4 className="text-2xl font-extrabold text-[var(--text-main)] mt-1">₹{data.paidPayouts.toLocaleString()}</h4>
            </div>
            <ArrowDownRight className="text-emerald-500 opacity-50" size={32} />
          </div>
        </div>

        {/* ── Ledger Table ── */}
        <div className="bg-[var(--card-bg)] border-2 border-[var(--border-color)] rounded-2xl shadow-sm overflow-hidden mt-8">
          <div className="px-6 py-5 border-b-2 border-[var(--border-color)] bg-gray-50">
            <h2 className="text-2xl font-extrabold text-[var(--text-main)]">Recent Transactions Ledger</h2>
            <p className="text-base text-[var(--text-muted)] font-medium mt-1">A timeline of money moving through the system.</p>
          </div>
          
          {data.recentLedger.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-xl font-bold text-[var(--text-muted)]">No recent transactions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Date & Time</th>
                    <th className="py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Description</th>
                    <th className="py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-sm font-bold text-gray-700 uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-[var(--border-color)]">
                  {currentLedgerPage.map((entry, idx) => (
                    <tr key={`${entry.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap text-base font-semibold text-[var(--text-muted)]">
                        {new Date(entry.date).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-bold border
                          ${entry.type === "CREDIT" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                            entry.type === "CREDIT_GMV" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-orange-50 text-orange-700 border-orange-200"}`}
                        >
                          {entry.type === "DEBIT" ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                          {entry.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-base font-bold text-[var(--text-main)]">
                        {entry.title}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
                          {entry.status}
                        </span>
                      </td>
                      <td className={`py-4 px-6 text-right text-lg font-black whitespace-nowrap
                        ${entry.type === "DEBIT" ? "text-orange-600" : "text-emerald-600"}`}
                      >
                        {entry.type === "DEBIT" ? "-" : "+"} ₹{entry.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t-2 border-[var(--border-color)] bg-white">
              <span className="text-sm font-semibold text-gray-600">
                Showing page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
