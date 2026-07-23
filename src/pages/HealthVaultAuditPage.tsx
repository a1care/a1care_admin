import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  ShieldAlert, Database, FileText, ClipboardList, 
  Search, Calendar, ArrowRight, User, Phone, Clock, Loader2,
  Lock
} from "lucide-react";
import { useState } from "react";

export function HealthVaultAuditPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["health-vault-audit"],
    queryFn: async () => {
      const res = await api.get("/admin/audit/health-vault");
      return res.data.data;
    }
  });

  const { totalRecords = 0, newToday = 0, stats = {}, recentRecords = [] } = data ?? {};

  const filteredRecords = recentRecords.filter((record: any) => {
    if (!searchTerm.trim()) return true;
    const name = record.patientId?.name?.toLowerCase() || "";
    const phone = record.patientId?.mobileNumber || "";
    const term = searchTerm.toLowerCase();
    return name.includes(term) || phone.includes(term);
  });

  return (
    <div className="space-y-6 animate-in">
      {/* ── Page Header ── */}
      <header className="flex items-center justify-between gap-4 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden">
        <div className="relative z-10 text-left">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">
            Health Vault Audit
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">Home • Security Audits • Secure Storage Monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <div className="flex items-center gap-1.5 h-9 px-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-lg text-[10px] font-bold border border-indigo-100 dark:border-indigo-500/20 whitespace-nowrap tracking-wider uppercase">
            <Lock size={12} />
            <span>AES-256 Encrypted</span>
          </div>
        </div>
        <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-12 right-32 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
      </header>

      {/* ── Stats Metric Cards Row ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Vault Records", value: totalRecords, icon: Database, colorClass: "text-indigo-600", bgClass: "bg-indigo-50 dark:bg-indigo-500/10" },
          { label: "New Records Today", value: newToday, icon: Calendar, colorClass: "text-emerald-600", bgClass: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Total Prescriptions", value: stats.totalPrescriptions || 0, icon: ClipboardList, colorClass: "text-blue-600", bgClass: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Total Lab Reports", value: stats.totalLabReports || 0, icon: FileText, colorClass: "text-purple-600", bgClass: "bg-purple-50 dark:bg-purple-500/10" },
        ].map((kpi, i) => (
          <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-3 text-left">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${kpi.bgClass} ${kpi.colorClass}`}>
              <kpi.icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-black text-[var(--text-main)] tracking-tight">{isLoading ? "---" : kpi.value.toLocaleString()}</p>
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-1">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Section Layout Grid ── */}
      <div className="w-full">
        {/* Left Side: Recent Activity Audit Logs Card */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
          {/* Toolbar */}
          <div className="px-5 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex flex-row items-center justify-between gap-3">
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
          </div>

          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Scanning Secure Vault Clusters...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="py-3 px-5">Patient Details</th>
                    <th className="py-3 px-5">Vault Payload</th>
                    <th className="py-3 px-5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record: any) => (
                      <tr key={record._id} className="hover:bg-[var(--bg-main)] transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0 border border-indigo-100 dark:border-indigo-500/10">
                              {record.patientId?.name?.[0] || "P"}
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-sm text-[var(--text-main)]">{record.patientId?.name || "Anonymous Patient"}</p>
                              <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{record.patientId?.mobileNumber || "No Contact"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex flex-wrap gap-1.5 justify-start">
                            {record.prescriptions?.length > 0 && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 text-[10px] font-semibold rounded">
                                {record.prescriptions.length} Prescriptions
                              </span>
                            )}
                            {record.labReports?.length > 0 && (
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20 text-[10px] font-semibold rounded">
                                {record.labReports.length} Lab Reports
                              </span>
                            )}
                            {!(record.prescriptions?.length || record.labReports?.length) && (
                              <span className="text-[10px] font-bold text-[var(--text-muted)]">No files linked</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-left">
                          <div className="text-xs font-semibold text-[var(--text-main)]">
                            {new Date(record.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            {new Date(record.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Database size={32} className="text-[var(--text-muted)] opacity-30" />
                          <p className="text-sm font-semibold text-[var(--text-main)]">No audit entries match</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
