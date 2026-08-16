import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageBanner } from "@/components/ui/PageBanner";
import { ChevronLeft, RefreshCcw, LayoutList, Database } from "lucide-react";

interface PaymentLog {
  _id: string;
  txnId: string;
  event: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  metadata?: any;
  createdAt: string;
}

const LEVEL_CONFIG = {
  INFO: {
    color: "#3b82f6",
    bg: "#eff6ff"
  },
  WARN: {
    color: "#f59e0b",
    bg: "#fffbeb"
  },
  ERROR: {
    color: "#ef4444",
    bg: "#fef2f2"
  }
};

const renderMetadataValue = (value: any): React.ReactNode => {
  if (value === null) return <span className="text-[var(--text-muted)] italic">null</span>;
  if (typeof value === "boolean") return <span className="text-purple-500 font-medium">{value ? "true" : "false"}</span>;
  if (typeof value === "number") return <span className="text-amber-500 font-medium">{value}</span>;
  if (typeof value === "string") return <span className="text-green-600 font-medium whitespace-nowrap">"{value}"</span>;
  
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-col gap-2 mt-1">
        {value.map((item, idx) => (
          <div key={idx} className="pl-3 border-l-2 border-[var(--border-color)]">
            {renderMetadataValue(item)}
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    const keys = Object.keys(value);
    return (
      <div className="w-full mt-1 rounded-md border border-[var(--border-color)] overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/30">
              {keys.map((k) => (
                <th key={k} className="px-3 py-2 font-bold text-sky-600 align-top whitespace-nowrap border-b border-r border-[var(--border-color)] last:border-r-0">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white dark:bg-transparent">
              {keys.map((k) => (
                <td key={k} className="px-3 py-2 align-top border-r border-[var(--border-color)] last:border-r-0">
                  {renderMetadataValue(value[k])}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return <span>{String(value)}</span>;
};

export default function PaymentLogDetailsPage() {
  const { id: txnId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["payment-logs", txnId],
    queryFn: async () => {
      const res = await api.get(`/admin/payments/logs/${txnId}`);
      return res.data.data as PaymentLog[];
    },
    enabled: !!txnId
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <header className="flex flex-col gap-2 bg-gradient-to-br from-[var(--primary)] to-emerald-800 p-6 md:p-8 rounded-2xl shadow-lg shadow-emerald-900/10 border-0 relative overflow-hidden text-left items-start">
          <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 w-full">
              <button
                  onClick={() => navigate("/payment-logs")}
                  className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors mb-3"
              >
                  <ChevronLeft size={12} /> Back to Orders
              </button>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1">
                  Transaction Timeline
              </h1>
              <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  <p className="text-xs md:text-sm font-medium text-emerald-50 tracking-wide opacity-90 truncate max-w-full">
                      ID: {txnId}
                  </p>
              </div>
          </div>
      </header>

      <div className="w-full max-w-4xl bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <LayoutList size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)]">Execution Logs</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Step-by-step history of this transaction's lifecycle.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
              <RefreshCcw size={32} className="animate-spin mb-4 text-blue-500" />
              <span className="text-sm font-semibold">Fetching timeline events...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center text-[var(--text-muted)] text-sm font-medium border border-dashed border-[var(--border-color)] rounded-xl">
              No log records found for this transaction.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-main)]">
                    <th className="p-4 font-bold text-[10px] text-[var(--text-muted)] uppercase tracking-wider border-y border-[var(--border-color)] whitespace-nowrap">Date & Time</th>
                    <th className="p-4 font-bold text-[10px] text-[var(--text-muted)] uppercase tracking-wider border-y border-[var(--border-color)] whitespace-nowrap">Event</th>
                    <th className="p-4 font-bold text-[10px] text-[var(--text-muted)] uppercase tracking-wider border-y border-[var(--border-color)]">Message</th>
                  </tr>
                </thead>
                {logs.map((log) => {
                  const lvl = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.INFO;
                  const hasMeta = log.metadata && Object.keys(log.metadata).length > 0;
                  return (
                    <tbody key={log._id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <tr>
                        <td className="p-4 text-xs font-semibold text-[var(--text-muted)] whitespace-nowrap align-top pt-5 w-48">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 align-top pt-5 w-32">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md" style={{ color: lvl.color, backgroundColor: `${lvl.color}15`, border: `1px solid ${lvl.color}30` }}>
                            {log.event}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-bold text-[var(--text-main)] align-top pt-5 w-full">
                          {log.message}
                        </td>
                      </tr>
                      {hasMeta && (
                        <tr>
                          <td colSpan={3} className="p-4 pt-2 pb-6">
                            <div className="w-full">
                              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Payload Metadata</span>
                              {renderMetadataValue(log.metadata)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })}
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
