import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { A1Card } from "@/components/ui/A1Card";
import type { DashboardOverview } from "@/types";
import {
  Users,
  Stethoscope,
  Calendar,
  Activity,
  ShieldCheck,
  TrendingUp,
  Search,
  Eye,
  ArrowUpDown,
  Filter,
  CreditCard,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  FileText,
  BadgeCheck,
  IndianRupee
} from "lucide-react";

export function DashboardPage() {
  const navigate = useNavigate();
  const [performanceSearch, setPerformanceSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"appointments" | "services">("appointments");
  const [sortField, setSortField] = useState<string>("stats.total");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [performancePage, setPerformancePage] = useState(1);

  // --- Data Fetching ---
  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ["admin-dashboard-overview"],
    queryFn: async () => {
      const res = await api.get("/admin/dashboard/overview");
      return res.data.data as DashboardOverview;
    },
    select: (data: any) => ({
      ...data,
      bookings: {
        appointments: Array.isArray(data?.bookings?.appointments) ? data.bookings.appointments : [],
        services: Array.isArray(data?.bookings?.services) ? data.bookings.services : []
      }
    })
  });

  const { data: performanceData, isLoading: isPerformanceLoading } = useQuery({
    queryKey: ["admin-doctor-performance", performancePage, performanceSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(performancePage), limit: "50" });
      if (performanceSearch) params.set("search", performanceSearch);
      const res = await api.get(`/admin/dashboard/doctor-performance?${params}`);
      return res.data.data;
    },
    placeholderData: keepPreviousData
  });

  const performance = Array.isArray(performanceData) ? performanceData : (performanceData?.items || []);
  const performanceTotalPages = performanceData?.totalPages || 1;

  if (isOverviewLoading || isPerformanceLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Syncing Dashboard Workspace...</p>
      </div>
    );
  }

  const kpis = overview?.kpis;
  const bookings = overview?.bookings;

  // --- Performance Table Logic ---
  const sortedPerformance = [...performance].sort((a, b) => {
    const getVal = (obj: any, path: string) => path.split('.').reduce((o, i) => o[i], obj);
    const valA = getVal(a, sortField) || 0;
    const valB = getVal(b, sortField) || 0;
    return sortOrder === "desc" ? valB - valA : valA - valB;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const paginatedPerformance = sortedPerformance;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* ── Page Header ── */}
      <A1Card className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:p-8">
        <div className="relative z-10 text-left">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-md">
            <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-success uppercase tracking-wider">System Operational</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mt-2 mb-1">Admin Dashboard</h1>
          <p className="text-xs md:text-sm font-medium text-slate-500 tracking-wide">Monitor network activity, performance, and incoming alerts.</p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
          <Calendar className="text-slate-500" size={18} />
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Today's Date</span>
            <span className="text-xs font-semibold text-slate-900 leading-none">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </A1Card>

      {/* ── Primary KPI Cluster (Unified row structure) ── */}
      <section className="grid grid-cols-7 gap-4">
        {[
          { title: "Total Patients", value: kpis?.patients, icon: Users, colorClass: "text-blue-600", bgClass: "bg-blue-50 dark:bg-blue-500/10", route: "/manage-patients" },
          { title: "Active Staff", value: kpis?.activeStaff, icon: Stethoscope, colorClass: "text-indigo-600", bgClass: "bg-indigo-50 dark:bg-indigo-500/10", route: "/manage-doctors" },
          { title: "Pending KYC", value: kpis?.pendingVerifications, icon: ShieldCheck, colorClass: "text-amber-600", bgClass: "bg-amber-50 dark:bg-amber-500/10", route: "/kyc-verification" },
          { title: "Total Bookings", value: kpis?.totalBookings, icon: Activity, colorClass: "text-sky-600", bgClass: "bg-sky-50 dark:bg-sky-500/10", route: "/bookings" },
          { title: "Today's Revenue", value: kpis?.revenue?.today ? `₹${kpis.revenue.today.toLocaleString()}` : "₹0", icon: TrendingUp, colorClass: "text-emerald-600", bgClass: "bg-emerald-50 dark:bg-emerald-500/10", route: "/payment-logs" },
          { title: "Monthly Revenue", value: kpis?.revenue?.month ? `₹${kpis.revenue.month.toLocaleString()}` : "₹0", icon: CreditCard, colorClass: "text-blue-600", bgClass: "bg-blue-50 dark:bg-blue-500/10", route: "/payment-logs" },
          { title: "Total Revenue", value: kpis?.revenue?.total ? `₹${kpis.revenue.total.toLocaleString()}` : "₹0", icon: IndianRupee, colorClass: "text-slate-600", bgClass: "bg-slate-50 dark:bg-slate-500/10", route: "/payment-logs" }
        ].map((kpi) => (
          <A1Card
            key={kpi.title}
            onClick={() => navigate(kpi.route)}
            className="flex flex-col gap-3 text-left cursor-pointer hover:border-blue-400"
            noPadding={false}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${kpi.bgClass} ${kpi.colorClass}`}>
              <kpi.icon size={18} />
            </div>
            <div>
              <p className="text-xl font-black text-[var(--text-main)] tracking-tight">{kpi.value?.toLocaleString() ?? kpi.value}</p>
              <p className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-1">{kpi.title}</p>
            </div>
          </A1Card>
        ))}
      </section>

      {/* ── Commission Intelligence ── */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] text-left">Commission Intelligence</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { title: "Commission Earned", value: `₹${(kpis?.commission?.earned ?? 0).toLocaleString()}`, icon: TrendingUp, colorClass: "text-emerald-600", bgClass: "bg-emerald-50 dark:bg-emerald-500/10" },
            { title: "Payouts Settled", value: `₹${(kpis?.commission?.payoutsSettled ?? 0).toLocaleString()}`, icon: CreditCard, colorClass: "text-blue-600", bgClass: "bg-blue-50 dark:bg-blue-500/10" },
            { title: "Pending Payouts", value: kpis?.commission?.pendingPayouts ?? 0, icon: ShieldCheck, colorClass: "text-amber-600", bgClass: "bg-amber-50 dark:bg-amber-500/10" },
            { title: "Net Retained", value: `₹${(kpis?.commission?.netRetained ?? 0).toLocaleString()}`, icon: IndianRupee, colorClass: "text-indigo-600", bgClass: "bg-indigo-50 dark:bg-indigo-500/10" }
          ].map((kpi) => (
            <div
              key={kpi.title}
              onClick={() => navigate("/payouts")}
              className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-3 text-left cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${kpi.bgClass} ${kpi.colorClass}`}>
                <kpi.icon size={18} />
              </div>
              <div>
                <p className="text-xl font-black text-[var(--text-main)] tracking-tight">{kpi.value}</p>
                <p className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-1">{kpi.title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Booking Intelligence Card ── */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
        {/* Header Block */}
        <div className="px-6 py-5 border-b border-[var(--border-color)] flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-[var(--bg-main)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <LayoutGrid size={20} />
            </div>
            <div className="text-left">
              <h2 className="text-base font-bold text-[var(--text-main)]">Booking Intelligence</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                <p className="text-[10px] font-bold text-blue-600/80 dark:text-blue-400/80 uppercase tracking-wider">Real-time Status Feed</p>
              </div>
            </div>
          </div>

          <div className="flex p-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shrink-0 self-start xl:self-center">
            <button
              onClick={() => setActiveTab("appointments")}
              className={`px-5 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider ${activeTab === 'appointments' ? 'bg-blue-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              Appointments
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`px-5 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider ${activeTab === 'services' ? 'bg-blue-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              Services
            </button>
          </div>
        </div>

        {/* Dynamic Grid list */}
        <div className="p-6 flex flex-row items-center gap-3 overflow-x-auto w-full">
          {((activeTab === "appointments" ? bookings?.appointments : bookings?.services) || [])?.map((status: any) => (
            <div
              key={status._id}
              onClick={() => navigate(activeTab === "appointments" ? `/op-bookings?status=${status._id}` : `/bookings?status=${status._id}`)}
              className="p-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl hover:border-blue-400 transition-all cursor-pointer text-left group flex-1 min-w-[120px]"
            >
              <p className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wider truncate">
                {({'PENDING':'Pending','Pending':'Pending','BROADCASTED':'Finding Partner','ACCEPTED':'Partner Assigned','Confirmed':'Confirmed','IN_PROGRESS':'In Progress','COMPLETED':'Completed','Completed':'Completed','CANCELLED':'Cancelled','Cancelled':'Cancelled','RETURNED_TO_ADMIN':'Needs Reassignment'} as Record<string,string>)[status._id] || status._id || 'New'}
              </p>
              <h4 className="text-xl font-black text-[var(--text-main)] tracking-tight mt-1">{status.count}</h4>
            </div>
          ))}
          {(!(activeTab === "appointments" ? bookings?.appointments : bookings?.services)?.length) && (
            <div className="col-span-full py-8 text-center">
              <div className="w-10 h-10 bg-[var(--bg-main)] rounded-xl flex items-center justify-center mx-auto mb-2 text-[var(--text-muted)]">
                <FileText size={18} />
              </div>
              <p className="text-xs text-[var(--text-muted)]">No data available at this time.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Doctor Performance Card ── */}
      <section className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
              <Stethoscope size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-main)]">Doctor Performance</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Performance analytics and booking volume per provider.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search provider..."
                className="w-full sm:w-60 h-9 pl-9 pr-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-500 transition-all font-semibold"
                value={performanceSearch}
                onChange={(e) => { setPerformanceSearch(e.target.value); setPerformancePage(1); }}
              />
            </div>
            <button
              onClick={() => { setPerformanceSearch(""); setPerformancePage(1); }}
              className="h-9 px-3 border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-blue-600 hover:border-blue-400 rounded-lg text-xs font-semibold transition-all shrink-0"
              title="Reset Filters"
            >
              <Filter size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="py-3 px-4">
                  <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-[var(--text-main)] transition-colors">
                    Provider Detail <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="py-3 px-4 text-center">
                  <button onClick={() => handleSort('stats.total')} className="flex items-center justify-center gap-1 mx-auto hover:text-[var(--text-main)] transition-colors">
                    Total Bookings <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="py-3 px-4 text-center">Pending</th>
                <th className="py-3 px-4 text-center">Confirmed</th>
                <th className="py-3 px-4 text-center">Completed</th>
                <th className="py-3 px-4 text-center">Cancelled</th>
                <th className="py-3 px-4 text-right">
                  <button onClick={() => handleSort('stats.revenue')} className="flex items-center justify-end gap-1 ml-auto hover:text-[var(--text-main)] transition-colors">
                    Revenue <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="py-3 px-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {paginatedPerformance?.map((doc) => (
                <tr key={doc.id} className="hover:bg-[var(--bg-main)] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                        {doc.name?.[0] || 'D'}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[var(--text-main)]">{doc.name || 'Unknown Doctor'}</div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">#{doc.id.substring(0, 8).toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-sm font-semibold text-[var(--text-main)]">{doc.stats.total}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">{doc.stats.pending}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">{doc.stats.confirmed}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">{doc.stats.completed}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">{doc.stats.cancelled}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-[var(--text-main)] text-sm">₹{doc.stats.revenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigate(`/manage-doctors?search=${encodeURIComponent(doc.name || "")}`)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-[var(--border-color)] transition-all"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedPerformance?.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[var(--text-muted)] font-semibold">No performance data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {performanceTotalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-main)]">
            <p className="text-xs text-[var(--text-muted)] font-semibold">
              Page <span className="text-[var(--text-main)] font-bold">{performancePage}</span> / {performanceTotalPages}
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPerformancePage((p) => Math.max(1, p - 1))}
                disabled={performancePage === 1}
                className="w-8 h-8 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-blue-600 hover:border-blue-400 transition-all disabled:opacity-30"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPerformancePage((p) => Math.min(performanceTotalPages, p + 1))}
                disabled={performancePage === performanceTotalPages}
                className="w-8 h-8 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-blue-600 hover:border-blue-400 transition-all disabled:opacity-30"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
