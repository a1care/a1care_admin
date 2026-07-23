import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  History, User, Activity, ShieldCheck,
  ArrowRightCircle, Search,
  Download, RefreshCcw, FileText, Settings
} from "lucide-react";
import { toast } from "sonner";
import { useState, useDeferredValue } from "react";

interface AuditLog {
  _id: string;
  action: string;
  targetType: string;
  targetId?: string;
  actorAdminId?: {
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

export function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("All");
  const deferredSearch = useDeferredValue(searchTerm);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const res = await api.get("/admin/audit/logs");
      return res.data.data as AuditLog[];
    }
  });

  const filtered = (data ?? []).filter(log => {
    const matchesSearch = !deferredSearch ||
      log.action.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      log.targetType?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      log.actorAdminId?.name?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      log.targetId?.includes(deferredSearch);
    const matchesEntity = entityFilter === "All" || log.targetType === entityFilter;
    return matchesSearch && matchesEntity;
  });

  const allEntities = [...new Set((data ?? []).map(l => l.targetType).filter(Boolean))];

  const exportCSV = () => {
    if (!data?.length) { toast.error("No logs to export"); return; }
    const headers = ["Date", "Action", "Entity", "Target ID", "Admin"];
    const rows = data.map(l => [
      new Date(l.createdAt).toLocaleString('en-IN'),
      l.action, l.targetType, l.targetId ?? "", l.actorAdminId?.name ?? "System"
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `audit-logs-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit logs exported");
  };

  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('add')) {
      return <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400">Create</span>;
    }
    if (act.includes('delete') || act.includes('remove')) {
      return <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400">Delete</span>;
    }
    if (act.includes('update') || act.includes('edit')) {
      return <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">Update</span>;
    }
    if (act.includes('login') || act.includes('auth')) {
      return <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400">Auth</span>;
    }
    return <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-400">System</span>;
  };

  return (
    <div className="space-y-6 animate-in">
      {/* ── Page Header ── */}
      <header className="flex flex-col gap-2 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden text-left items-start">
        <div className="relative z-10 w-full">
          <div className="flex items-center justify-between gap-4 w-full">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">System Audit Logs</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">
                  Home • Security • Activity Log Registry
                </p>
              </div>
            </div>
            {/* Header Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button 
                className="button secondary h-10 px-4 rounded-xl gap-1.5 text-xs font-bold uppercase border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)]" 
                onClick={exportCSV}
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </header>

      {/* ── Filter Toolbar ── */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm flex items-center justify-between gap-4 flex-wrap">
        <div style={{ position: "relative", width: "320px", flexShrink: 0 }}>
          <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", zIndex: 10 }} />
          <input 
            type="text"
            placeholder="Search by TxnID, name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
                width: "100%", height: 42, borderRadius: 12, paddingLeft: 38, paddingRight: 14,
                background: "var(--card-bg)", border: "1.5px solid var(--border-color)",
                fontSize: "0.875rem", color: "var(--text-main)", outline: "none",
                fontFamily: "inherit", boxSizing: "border-box"
            }}
          />
        </div>
        <select
          value={entityFilter}
          onChange={e => setEntityFilter(e.target.value)}
          className="h-10 px-3.5 rounded-lg text-xs font-bold border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] outline-none cursor-pointer"
        >
          <option value="All">All Entities</option>
          {allEntities.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {/* ── Table Layout (Notification Log Style) ── */}
      <div className="w-full">
        {/* Left Side: Audit Table */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={15} className="text-indigo-500" />
              <h3 className="text-sm font-bold text-[var(--text-main)]">Operational Log Queue</h3>
            </div>
            <span className="text-xs font-bold text-[var(--text-muted)]">
              {filtered.length} Log Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4 w-28">Type</th>
                  <th className="py-3 px-4">Action Detail</th>
                  <th className="py-3 px-4">Actor (Admin)</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4 w-44">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCcw className="animate-spin text-indigo-500" size={24} />
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Syncing Audit Records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((log, index) => (
                    <tr key={log._id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                      {/* Index */}
                      <td className="py-4 px-4 text-xs font-semibold text-[var(--text-muted)]">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      {/* Type Badge */}
                      <td className="py-4 px-4">
                        {getActionBadge(log.action)}
                      </td>
                      {/* Action & Target ID */}
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-bold text-xs text-[var(--text-main)]">{log.action}</p>
                          {log.targetId && (
                            <span className="text-[10px] text-[var(--text-muted)] font-mono block mt-0.5">
                              ID: {log.targetId}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Actor */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-bold text-[var(--text-main)]">
                            {(log.actorAdminId?.name || "S")[0]}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-[var(--text-main)]">{log.actorAdminId?.name || "System Automated"}</p>
                            <span className="text-[9px] text-[var(--text-muted)] block">{log.actorAdminId?.email || "System Engine"}</span>
                          </div>
                        </div>
                      </td>
                      {/* Target Entity */}
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300">
                          {log.targetType || "—"}
                        </span>
                      </td>
                      {/* Timestamp */}
                      <td className="py-4 px-4">
                        <span className="text-xs font-semibold text-[var(--text-muted)]">
                          {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <History size={24} className="text-slate-300" />
                        <div>
                          <h4 className="text-xs font-bold text-[var(--text-main)]">No Audit Logs Found</h4>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Adjust filter query options or refresh system feed.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


