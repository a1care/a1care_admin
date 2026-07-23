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
      </header>      {/* ── Main Clean Table View ── */}
      <div className="card p-0 overflow-hidden" style={{ border: 'none', background: 'var(--card-bg)', borderRadius: 24, borderStyle: 'solid', borderWidth: 1, borderColor: 'var(--border-color)' }}>
        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", background: "var(--bg-main)" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by TxnID, name, phone..."
              style={{
                width: "100%", height: 42, borderRadius: 12, paddingLeft: 38, paddingRight: 14,
                background: "var(--card-bg)", border: "1.5px solid var(--border-color)",
                fontSize: "0.875rem", color: "var(--text-main)", outline: "none",
                fontFamily: "inherit", boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["ALL", "SUCCESS", "FAILED", "PENDING", "VERIFICATION_PENDING"].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  height: 40,
                  padding: "0 16px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  background: statusFilter === status ? "var(--text-main)" : "var(--card-bg)",
                  color: statusFilter === status ? "white" : "var(--text-muted)",
                  border: "1.5px solid var(--border-color)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap"
                }}
              >
                {status === "VERIFICATION_PENDING" ? "Verifying" : status}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: "auto", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
            {isLoading ? "Loading..." : `${orders.length} of ${total} shown`}
          </div>
        </div>

        {/* Table */}
        {isLoading && !ordersResponse ? (
          <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--text-muted)", fontWeight: 700 }}>
            <RefreshCcw size={32} className="animate-spin" style={{ margin: "0 auto 16px", opacity: 0.4 }} />
            <div>Loading Payment Registry...</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-main)" }}>
                  {["User Details", "Transaction ID", "Type", "Amount", "Status", "Date", "Actions"].map((h, i) => (
                    <th key={i} style={{
                      padding: "13px 20px",
                      fontSize: "0.7rem", fontWeight: 800,
                      color: "var(--text-muted)", textTransform: "uppercase",
                      letterSpacing: "0.08em", borderBottom: "1px solid var(--border-color)",
                      textAlign: h === "Actions" ? "right" : "left"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? orders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                  const StatusIcon = cfg.icon;
                  const userName = typeof order.userId === "object" ? order.userId?.name || "-" : "-";
                  const userPhone = typeof order.userId === "object" ? order.userId?.mobileNumber || "" : "";
                  const isSelected = selectedTxn === order.txnId;

                  return (
                    <>
                      <tr
                        key={order._id}
                        onClick={() => setSelectedTxn(isSelected ? null : order.txnId)}
                        style={{
                          borderBottom: "1px solid var(--border-color)",
                          cursor: "pointer",
                          background: isSelected ? "var(--bg-main)" : "transparent",
                          transition: "background 0.15s"
                        }}
                      >
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text-main)" }}>{userName}</div>
                          {userPhone && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>{userPhone}</div>}
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "monospace", fontWeight: 700 }}>{order.txnId}</span>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, background: "var(--bg-main)", color: "var(--text-muted)", padding: "4px 10px", borderRadius: 8, textTransform: "uppercase" }}>
                            {({'WALLET_TOPUP':'Wallet Top-up','SERVICE_BOOKING':'Service Booking','DOCTOR_BOOKING':'Doctor Booking','APPOINTMENT':'Appointment','SUBSCRIPTION':'Subscription'} as Record<string,string>)[order.type] || (order.type || '').replace(/_/g,' ')}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>INR {Number(order.amount).toFixed(2)}</span>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: cfg.bg, color: cfg.color, borderRadius: 8, padding: "3px 10px" }}>
                            <StatusIcon size={12} />
                            <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{cfg.label}</span>
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{new Date(order.createdAt).toLocaleString()}</span>
                        </td>
                        <td style={{ padding: "16px 20px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedTxn(isSelected ? null : order.txnId); }}
                            style={{
                              height: 28,
                              padding: "0 10px",
                              borderRadius: 6,
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              background: isSelected ? "var(--text-main)" : "var(--card-bg)",
                              color: isSelected ? "white" : "var(--text-muted)",
                              border: "1px solid var(--border-color)",
                              cursor: "pointer",
                              transition: "all 0.15s"
                            }}
                          >
                            {isSelected ? "Hide Logs" : "View Logs"}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable nested log row */}
                      {isSelected && (
                        <tr>
                          <td colSpan={7} style={{ padding: "20px 24px", background: "var(--bg-main)", borderBottom: "1px solid var(--border-color)" }}>
                            <div style={{
                              background: "var(--card-bg)", borderRadius: 16, border: "1px solid var(--border-color)", padding: 20,
                              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
                            }}>
                              <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent-color)", margin: "0 0 16px" }}>
                                Transaction Timeline Logs: {order.txnId}
                              </p>

                              {logsLoading ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", color: "var(--text-muted)" }}>
                                  <RefreshCcw size={14} className="animate-spin" />
                                  <span style={{ fontSize: 12, fontWeight: 600 }}>Loading timeline events...</span>
                                </div>
                              ) : logs.length === 0 ? (
                                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No log records found for this transaction.</div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                  {logs.slice(1).map(log => {
                                    const lvl = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.INFO;
                                    return (
                                      <div key={log._id} style={{ background: "var(--bg-main)", borderRadius: 12, padding: "12px 14px", borderLeft: `3.5px solid ${lvl.color}` }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                          <span style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", color: lvl.color, letterSpacing: "0.08em" }}>
                                            {log.event}
                                          </span>
                                          <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>
                                            {new Date(log.createdAt).toLocaleTimeString()}
                                          </span>
                                        </div>
                                        <p style={{ fontSize: 12, color: "var(--text-main)", margin: 0, fontWeight: 600 }}>{log.message}</p>
                                        {log.metadata && (
                                          <details style={{ marginTop: 6 }}>
                                            <summary style={{ fontSize: 10, color: "var(--text-muted)", cursor: "pointer", fontWeight: 700 }}>View payload metadata</summary>
                                            <pre style={{ fontSize: 10, marginTop: 6, overflow: "auto", background: "var(--card-bg)", padding: 10, borderRadius: 8, color: "var(--text-muted)", border: "1px solid var(--border-color)", fontFamily: "monospace" }}>
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
                          </td>
                        </tr>
                      )}
                    </>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} style={{ padding: "80px 24px", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                        <CreditCard size={40} style={{ color: "var(--text-muted)", opacity: 0.3 }} />
                        <p style={{ fontWeight: 800, color: "var(--text-main)", margin: 0 }}>No payment records found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-main)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Page {page} of {totalPages} · {total.toLocaleString()} records
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1 || isFetching}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid var(--border-color)", background: "var(--card-bg)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages || isFetching}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid var(--border-color)", background: "var(--card-bg)", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}