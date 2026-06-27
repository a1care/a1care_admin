import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { DashboardOverview, DoctorPerformance, RecentActivity } from "@/types";
import {
  Users,
  Stethoscope,
  Calendar,
  Activity,
  ShieldCheck,
  TrendingUp,
  Search,
  AlertCircle,
  Eye,
  ArrowUpDown,
  Filter,
  CreditCard,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  XCircle,
  FileText
} from "lucide-react";

export function DashboardPage() {
  const navigate = useNavigate();
  const [performanceSearch, setPerformanceSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"appointments" | "services">("appointments");
  const [sortField, setSortField] = useState<string>("stats.total");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activityPage, setActivityPage] = useState(1);
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
      const res = await api.get(`/admin/dashboard/doctor-performance?page=${performancePage}&limit=50&search=${performanceSearch}`);
      return res.data.data;
    },
    placeholderData: keepPreviousData
  });

  const performance = Array.isArray(performanceData) ? performanceData : (performanceData?.items || []);
  const performanceTotalPages = performanceData?.totalPages || 1;

  const { data: activityData, isLoading: isActivityLoading, isFetching: isActivityFetching } = useQuery({
    queryKey: ["admin-recent-activity", activityPage],
    queryFn: async () => {
      const res = await api.get(`/admin/dashboard/recent-bookings?page=${activityPage}&limit=5`);
      if (Array.isArray(res.data.data)) {
        return { items: res.data.data, total: res.data.data.length, page: 1, totalPages: 1 };
      }
      return res.data.data;
    },
    placeholderData: keepPreviousData
  });

  const activity = Array.isArray(activityData) ? activityData : (activityData?.items || []);
  const activityTotalPages = activityData?.totalPages || 1;

  if (isOverviewLoading || isPerformanceLoading || (!activityData && isActivityLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="font-medium text-slate-500">Loading workspace...</p>
      </div>
    );
  }

  const kpis = overview?.kpis;
  const bookings = overview?.bookings;
  const alerts = overview?.alerts;

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

  const PERFORMANCE_LIMIT = 50;
  const paginatedPerformance = sortedPerformance;

  const statusLabel = (status: string) => {
    const s = (status || "").toUpperCase();
    if (["COMPLETED", "RESOLVED", "CONFIRMED", "ACCEPTED"].includes(s)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (["PENDING", "BROADCASTED"].includes(s)) return "bg-amber-50 text-amber-700 border-amber-200";
    if (["CANCELLED", "CLOSED", "FAILED"].includes(s)) return "bg-red-50 text-red-700 border-red-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <header className="flex items-center justify-between gap-6 pt-2 pb-2">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-md">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">System Operational</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 font-medium">Monitor network activity, performance, and incoming alerts.</p>
        </div>

        <div className="flex items-center gap-4 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
          <Calendar className="text-slate-400" size={18} />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Today's Date</span>
            <span className="text-sm font-semibold text-slate-700 leading-none">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      {/* KPI Intelligence Cluster */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <StatCard title="Total Patients" value={kpis?.patients} icon={Users} color="blue" onClick={() => navigate("/manage-patients")} />
        <StatCard title="Active Staff" value={kpis?.activeStaff} icon={Stethoscope} color="indigo" onClick={() => navigate("/manage-doctors")} />
        <StatCard title="Pending KYC" value={kpis?.pendingVerifications} icon={ShieldCheck} color="amber" onClick={() => navigate("/kyc-verification")} />
        <StatCard title="Total Bookings" value={kpis?.totalBookings} icon={Activity} color="sky" onClick={() => navigate("/bookings")} />
        <StatCard title="Today's Revenue" value={kpis?.revenue?.today ? `₹${kpis.revenue.today.toLocaleString()}` : "₹0"} icon={TrendingUp} color="emerald" onClick={() => navigate("/payment-logs")} />
        <StatCard title="Monthly Revenue" value={kpis?.revenue?.month ? `₹${kpis.revenue.month.toLocaleString()}` : "₹0"} icon={CreditCard} color="blue" onClick={() => navigate("/payment-logs")} />
        <StatCard title="Total Revenue" value={kpis?.revenue?.total ? `₹${kpis.revenue.total.toLocaleString()}` : "₹0"} icon={Activity} color="slate" onClick={() => navigate("/payment-logs")} />
      </section>

      {/* Commission Intelligence — net A1Care economics, not gross booking volume */}
      <section>
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3">Commission Intelligence</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Commission Earned" value={`₹${(kpis?.commission?.earned ?? 0).toLocaleString()}`} icon={TrendingUp} color="emerald" onClick={() => navigate("/payouts")} />
          <StatCard title="Payouts Settled" value={`₹${(kpis?.commission?.payoutsSettled ?? 0).toLocaleString()}`} icon={CreditCard} color="blue" onClick={() => navigate("/payouts")} />
          <StatCard title="Pending Payouts" value={kpis?.commission?.pendingPayouts ?? 0} icon={ShieldCheck} color="amber" onClick={() => navigate("/payouts")} />
          <StatCard title="Net Retained" value={`₹${(kpis?.commission?.netRetained ?? 0).toLocaleString()}`} icon={Activity} color="indigo" onClick={() => navigate("/payouts")} />
        </div>
      </section>

      <div className="space-y-4">

        {/* Booking Overview */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden transition-all duration-500">
          <div className="px-10 py-8 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-gradient-to-br from-white via-white to-blue-50/30">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200 rotate-3 transition-transform hover:rotate-0">
                <LayoutGrid size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Booking Intelligence</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                  <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-[0.2em]">Real-time Status Feed</p>
                </div>
              </div>
            </div>
            
            <div className="flex p-2 bg-slate-100/60 backdrop-blur-xl rounded-2xl border border-slate-200/40 self-start xl:self-center shadow-inner">
              <button
                onClick={() => setActiveTab("appointments")}
                className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all duration-500 uppercase tracking-[0.15em] ${activeTab === 'appointments' ? 'bg-white shadow-xl text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Appointments
              </button>
              <button
                onClick={() => setActiveTab("services")}
                className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all duration-500 uppercase tracking-[0.15em] ${activeTab === 'services' ? 'bg-white shadow-xl text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Services
              </button>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {((activeTab === "appointments" ? bookings?.appointments : bookings?.services) || [])?.map((status: any) => (
              <div
                key={status._id}
                onClick={() => navigate(activeTab === "appointments" ? `/op-bookings?status=${status._id}` : `/bookings?status=${status._id}`)}
                className="p-5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-blue-600 transition-colors">
                  {({'PENDING':'Pending','Pending':'Pending','BROADCASTED':'Finding Partner','ACCEPTED':'Partner Assigned','Confirmed':'Confirmed','IN_PROGRESS':'In Progress','COMPLETED':'Completed','Completed':'Completed','CANCELLED':'Cancelled','Cancelled':'Cancelled','RETURNED_TO_ADMIN':'Needs Reassignment'} as Record<string,string>)[status._id] || status._id || 'New'}
                </div>
                <div className="text-2xl font-bold text-slate-900">{status.count}</div>
              </div>
            ))}
            {(!(activeTab === "appointments" ? bookings?.appointments : bookings?.services)?.length) && (
              <div className="col-span-full py-8 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText size={20} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">No data available at this time.</p>
              </div>
            )}
          </div>
        </div>


      </div>

      {/* Doctor Performance Productivity Table */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Stethoscope size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Doctor Performance</h2>
              <p className="text-sm text-slate-500 mt-0.5">Performance analytics and booking volume per provider.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} /> */}
              <input
                type="text"
                placeholder="Search provider..."
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={performanceSearch}
                onChange={(e) => { setPerformanceSearch(e.target.value); setPerformancePage(1); }}
              />
            </div>
            <button
              onClick={() => { setPerformanceSearch(""); setPerformancePage(1); }}
              className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 transition-all"
              title="Reset Filters"
            >
              <Filter size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <button onClick={() => handleSort('name')} className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">
                    Provider Detail <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                  <button onClick={() => handleSort('stats.total')} className="flex items-center gap-1.5 mx-auto hover:text-slate-900 transition-colors">
                    Total Bookings <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Pending</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Confirmed</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Completed</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Cancelled</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  <button onClick={() => handleSort('stats.revenue')} className="flex items-center justify-end gap-1.5 ml-auto hover:text-slate-900 transition-colors">
                    Revenue <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPerformance?.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm">
                        {doc.name?.[0] || 'D'}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900">{doc.name || 'Unknown Doctor'}</div>
                        <div className="text-xs text-slate-500 mt-0.5">ID: {doc.id.substring(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-slate-900">{doc.stats.total}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">{doc.stats.pending}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">{doc.stats.confirmed}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">{doc.stats.completed}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">{doc.stats.cancelled}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-900 text-sm">₹{doc.stats.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/manage-doctors?search=${encodeURIComponent(doc.name || "")}`)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedPerformance?.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-500">No performance data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {performanceTotalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <p className="text-xs font-medium text-slate-500">
              Page {performancePage} of {performanceTotalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPerformancePage((p) => Math.max(1, p - 1))}
                disabled={performancePage === 1}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPerformancePage((p) => Math.min(performanceTotalPages, p + 1))}
                disabled={performancePage === performanceTotalPages}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, onClick }: { title: string, value: any, icon: any, color: string, onClick?: () => void }) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    sky: "bg-sky-50 text-sky-600",
    slate: "bg-slate-50 text-slate-600"
  };

  return (
    <article
      onClick={onClick}
      className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`w-10 h-10 ${colors[color]} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
          <Icon size={20} strokeWidth={2} />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : (value || "0")}
        </h2>
        <p className="text-xs font-medium text-slate-500 mt-1">{title}</p>
      </div>
    </article>
  );
}

function AlertItem({ title, count, icon: Icon, description, color, link }: { title: string, count: number, icon: any, description: string, color: string, link: string }) {
  const navigate = useNavigate();
  const colors: any = {
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    red: "bg-red-50 text-red-600 border-red-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100"
  };

  return (
    <button
      onClick={() => navigate(link)}
      className={`w-full text-left p-3 rounded-xl transition-all group flex items-start gap-3 hover:bg-slate-50 border border-transparent hover:border-slate-200 ${count === 0 ? 'opacity-50 grayscale' : ''}`}
    >
      <div className={`w-10 h-10 shrink-0 ${colors[color]} border rounded-full flex items-center justify-center`}>
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm text-slate-900">{title}</span>
          {count > 0 && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[color]} border-none`}>{count}</span>}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </button>
  );
}
