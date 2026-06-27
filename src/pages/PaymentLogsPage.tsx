import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { RefreshCcw, Search, CheckCircle, XCircle, AlertTriangle, Clock, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";

interface PaymentOrder {
  _id: string;
  txnId: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "VERIFICATION_PENDING";
  type: "WALLET_TOPUP" | "BOOKING" | "SUBSCRIPTION";
  userId: { name?: string; email?: string; mobileNumber?: string } | string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentLog {
  _id: string;
  txnId: string;
  event: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  metadata?: any;
  createdAt: string;
}

interface PaymentOrdersResponse {
  items: PaymentOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 50;

const STATUS_CONFIG = {
  SUCCESS: { color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle, label: "Success" },
  FAILED: { color: "#ef4444", bg: "#fef2f2", icon: XCircle, label: "Failed" },
  PENDING: { color: "#f59e0b", bg: "#fffbeb", icon: Clock, label: "Pending" },
  CANCELLED: { color: "#94a3b8", bg: "#f8fafc", icon: XCircle, label: "Cancelled" },
  VERIFICATION_PENDING: { color: "#6366f1", bg: "#eef2ff", icon: AlertTriangle, label: "Verifying" },
};

const LEVEL_CONFIG = {
  INFO: { color: "#3b82f6", bg: "#eff6ff" },
  WARN: { color: "#f59e0b", bg: "#fffbeb" },
  ERROR: { color: "#ef4444", bg: "#fef2f2" },
};

export function PaymentLogsPage() {
  const [search, setSearch] = useState("");
  const [selectedTxn, setSelectedTxn] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const { data: ordersResponse, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["payment-orders", page, statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        status: statusFilter,
      });
      if (search.trim()) params.set("search", search.trim());
      const res = await api.get(`/admin/payments/orders?${params.toString()}`);
      return res.data.data as PaymentOrdersResponse;
    },
    placeholderData: (previousData) => previousData,
  });

  const orders = ordersResponse?.items || [];
  const total = ordersResponse?.total || 0;
  const totalPages = ordersResponse?.totalPages || 1;

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["payment-logs", selectedTxn],
    queryFn: async () => {
      if (!selectedTxn) return [];
      const res = await api.get(`/admin/payments/logs/${selectedTxn}`);
      return res.data.data as PaymentLog[];
    },
    enabled: !!selectedTxn,
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-row items-center justify-between gap-4 bg-[var(--card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden text-left">
        <div className="relative z-10 text-left">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">Payment Logs</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">Home • System Configuration • Payment Logs</p>
          </div>
        </div>
        <button className="relative z-10 button secondary shadow-sm h-12 px-6 rounded-2xl group active:scale-95 transition-all uppercase tracking-widest text-[10px] font-black gap-2 border border-[var(--border-color)]"
          onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw size={16} className={isFetching ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
          <span>Refresh</span>
        </button>
        <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card" style={{ padding: 12, borderRadius: 16 }}>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by TxnID, name, phone..."
                style={{ width: "100%", paddingLeft: 40, paddingRight: 16, height: 40, borderRadius: 12, background: "var(--bg-main)", border: "none", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {["ALL", "SUCCESS", "FAILED", "PENDING", "VERIFICATION_PENDING"].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 12,
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  background: statusFilter === status ? "var(--text-main)" : "var(--bg-main)",
                  color: statusFilter === status ? "white" : "var(--text-muted)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap"
                }}
              >
                {status === "VERIFICATION_PENDING" ? "Verifying" : status}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <RefreshCcw size={32} className="animate-spin" style={{ color: "var(--text-muted)", margin: "0 auto" }} />
            </div>
          ) : orders.length === 0 ? (
            <div className="card" style={{ padding: 60, textAlign: "center", borderRadius: 24 }}>
              <CreditCard size={40} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
              <p className="muted text-xs font-black uppercase tracking-widest">No payment records found</p>
            </div>
          ) : (
            orders.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = cfg.icon;
              const userName = typeof order.userId === "object" ? order.userId?.name || "-" : "-";
              const userPhone = typeof order.userId === "object" ? order.userId?.mobileNumber || "" : "";
              const isSelected = selectedTxn === order.txnId;

              return (
                <div
                  key={order._id}
                  onClick={() => setSelectedTxn(isSelected ? null : order.txnId)}
                  className="card"
                  style={{
                    padding: "16px 20px", borderRadius: 20, cursor: "pointer",
                    border: isSelected ? "2px solid #3b82f6" : "1px solid var(--border-color)",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-main)" }}>{userName}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{order.txnId}</span>
                      {userPhone && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{userPhone}</span>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: 16 }}>INR {Number(order.amount).toFixed(2)}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, background: cfg.bg, color: cfg.color, borderRadius: 8, padding: "3px 10px" }}>
                        <StatusIcon size={12} />
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{cfg.label}</span>
                      </div>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        {new Date(order.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, background: "var(--bg-main)", color: "var(--text-muted)", padding: "2px 8px", borderRadius: 6, textTransform: "uppercase" }}>
                      {({'WALLET_TOPUP':'Wallet Top-up','SERVICE_BOOKING':'Service Booking','DOCTOR_BOOKING':'Doctor Booking','APPOINTMENT':'Appointment','SUBSCRIPTION':'Subscription'} as Record<string,string>)[order.type] || (order.type || '').replace(/_/g,' ')}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          <div className="card" style={{ padding: '20px 24px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--card-bg)', border: '1px solid var(--border-color)', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Page <span style={{ color: 'var(--text-main)', marginLeft: '4px' }}>{page} / {totalPages}</span>
              </div>
              <div style={{ padding: '8px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Total Records <span style={{ color: 'var(--text-main)', marginLeft: '4px' }}>{total}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="button secondary"
                style={{ height: '44px', width: '44px', padding: 0, borderRadius: '14px', border: '1px solid var(--border-color)' }}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1 || isFetching}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="button secondary"
                style={{ height: '44px', width: '44px', padding: 0, borderRadius: '14px', border: '1px solid var(--border-color)' }}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages || isFetching}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20, borderRadius: 24, position: "sticky", top: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: 16 }}>
            {selectedTxn ? `Event Log - ${selectedTxn}` : "Select a transaction"}
          </p>

          {!selectedTxn ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
              <CreditCard size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ fontSize: 12, fontWeight: 600 }}>Click any order to view its event trail</p>
            </div>
          ) : logsLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <RefreshCcw size={24} className="animate-spin" style={{ color: "var(--text-muted)", margin: "0 auto" }} />
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
              <p style={{ fontSize: 12 }}>No logs for this transaction</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 600, overflowY: "auto" }}>
              {logs.map(log => {
                const lvl = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.INFO;
                return (
                  <div key={log._id} style={{ background: "var(--bg-main)", borderRadius: 12, padding: "12px 14px", borderLeft: `3px solid ${lvl.color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: lvl.color, letterSpacing: "0.1em" }}>
                        {log.event}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-main)", margin: 0 }}>{log.message}</p>
                    {log.metadata && (
                      <details style={{ marginTop: 6 }}>
                        <summary style={{ fontSize: 10, color: "var(--text-muted)", cursor: "pointer" }}>View metadata</summary>
                        <pre style={{ fontSize: 10, marginTop: 4, overflow: "auto", background: "var(--card-bg)", padding: 8, borderRadius: 8, color: "var(--text-muted)" }}>
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}