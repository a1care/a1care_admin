import { PageBanner } from "@/components/ui/PageBanner";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { RefreshCcw, Search, CheckCircle, XCircle, AlertTriangle, Clock, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { TableSkeleton } from "@/components/ui/Skeletons";
import { useNavigate } from "react-router-dom";

interface PaymentOrder {
  _id: string;
  txnId: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "VERIFICATION_PENDING";
  type: "WALLET_TOPUP" | "BOOKING" | "SUBSCRIPTION";
  userId: {
    name?: string;
    email?: string;
    mobileNumber?: string;
  } | string;
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
  SUCCESS: {
    color: "#22c55e",
    bg: "#f0fdf4",
    icon: CheckCircle,
    label: "Success"
  },
  FAILED: {
    color: "#ef4444",
    bg: "#fef2f2",
    icon: XCircle,
    label: "Failed"
  },
  PENDING: {
    color: "#f59e0b",
    bg: "#fffbeb",
    icon: Clock,
    label: "Pending"
  },
  CANCELLED: {
    color: "#94a3b8",
    bg: "#f8fafc",
    icon: XCircle,
    label: "Cancelled"
  },
  VERIFICATION_PENDING: {
    color: "#6366f1",
    bg: "#eef2ff",
    icon: AlertTriangle,
    label: "Verifying"
  }
};
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
export function PaymentLogsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);
  const {
    data: ordersResponse,
    isLoading,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["payment-orders", page, statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        status: statusFilter
      });
      if (search.trim()) params.set("search", search.trim());
      const res = await api.get(`/admin/payments/orders?${params.toString()}`);
      return res.data.data as PaymentOrdersResponse;
    },
    placeholderData: previousData => previousData
  });
  const orders = ordersResponse?.items || [];
  const total = ordersResponse?.total || 0;
  const totalPages = ordersResponse?.totalPages || 1;
  return <div className="flex flex-col gap-6">
      <PageBanner 
          title="Payment Logs" 
          subtitle="System Configuration • Payment Logs"
      >
        <button className="flex items-center gap-2 h-9 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shrink-0 backdrop-blur-sm group" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw size={14} className={isFetching ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
          <span>Refresh</span>
        </button>
      </PageBanner>      {/* ── Main Clean Table View ── */}
      <div className="card p-0 overflow-hidden" style={{
      border: 'none',
      background: 'var(--card-bg)',
      borderRadius: 24,
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: 'var(--border-color)'
    }}>
        {/* Toolbar */}
        <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
        background: "var(--bg-main)"
      }}>
          <div style={{
          position: "relative",
          flex: 1,
          minWidth: 220
        }}>
            <Search size={15} style={{
            position: "absolute",
            left: 13,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none"
          }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by TxnID, name, phone..." style={{
            width: "100%",
            height: 42,
            borderRadius: 12,
            paddingLeft: 38,
            paddingRight: 14,
            background: "var(--card-bg)",
            border: "1.5px solid var(--border-color)",
            fontSize: "0.875rem",
            color: "var(--text-main)",
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box"
          }} />
          </div>

          <div style={{
          display: "flex",
          gap: 8,
          alignItems: "center"
        }}>
            {["ALL", "SUCCESS", "FAILED", "PENDING", "VERIFICATION_PENDING"].map(status => <button key={status} onClick={() => setStatusFilter(status)} style={{
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
          }}>
                {status === "VERIFICATION_PENDING" ? "Verifying" : status}
              </button>)}
          </div>

          <div style={{
          marginLeft: "auto",
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          whiteSpace: "nowrap"
        }}>
            {isLoading ? "Loading..." : `${orders.length} of ${total} shown`}
          </div>
        </div>

        {/* Table */}
        {isLoading && !ordersResponse ? <div className="p-4"><TableSkeleton columns={7} rows={10} showHeader={true} /></div> : <div style={{
        overflowX: "auto"
      }}>
            <table style={{
          width: "100%",
          borderCollapse: "collapse"
        }}>
              <thead>
                <tr style={{
              background: "var(--bg-main)"
            }}>
                  {["User Details", "Transaction ID", "Type", "Amount", "Status", "Date", "Actions"].map((h, i) => <th key={i} style={{
                padding: "13px 20px",
                fontSize: "0.7rem",
                fontWeight: 800,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                borderBottom: "1px solid var(--border-color)",
                textAlign: h === "Actions" ? "right" : "left"
              }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {isLoading || isFetching ? Array.from({
            length: 5
          }).map((_, i) => <tr key={i}>
                    <td colSpan={7} style={{
                padding: "16px 24px"
              }}>
                      <TableSkeleton rows={1} columns={7} />
                    </td>
                  </tr>) : orders.length > 0 ? orders.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = cfg.icon;
              const userName = typeof order.userId === "object" ? order.userId?.name || "-" : "-";
              const userPhone = typeof order.userId === "object" ? order.userId?.mobileNumber || "" : "";
              return <tr key={order._id} style={{
                  borderBottom: "1px solid var(--border-color)",
                  background: "transparent",
                  transition: "background 0.15s"
                }}>
                        <td style={{
                    padding: "16px 20px"
                  }}>
                          <div style={{
                      fontWeight: 800,
                      fontSize: "0.9rem",
                      color: "var(--text-main)"
                    }}>{userName}</div>
                          {userPhone && <div style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginTop: 2
                    }}>{userPhone}</div>}
                        </td>
                        <td style={{
                    padding: "16px 20px"
                  }}>
                          <span style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      fontFamily: "monospace",
                      fontWeight: 700
                    }}>{order.txnId}</span>
                        </td>
                        <td style={{
                    padding: "16px 20px"
                  }}>
                          <span style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: "var(--bg-main)",
                      color: "var(--text-muted)",
                      padding: "4px 10px",
                      borderRadius: 8,
                      textTransform: "uppercase"
                    }}>
                            {({
                        'WALLET_TOPUP': 'Wallet Top-up',
                        'SERVICE_BOOKING': 'Service Booking',
                        'DOCTOR_BOOKING': 'Doctor Booking',
                        'APPOINTMENT': 'Appointment',
                        'SUBSCRIPTION': 'Subscription'
                      } as Record<string, string>)[order.type] || (order.type || '').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{
                    padding: "16px 20px"
                  }}>
                          <span style={{
                      fontWeight: 800,
                      fontSize: "0.95rem"
                    }}>INR {Number(order.amount).toFixed(2)}</span>
                        </td>
                        <td style={{
                    padding: "16px 20px"
                  }}>
                          <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: cfg.bg,
                      color: cfg.color,
                      borderRadius: 8,
                      padding: "3px 10px"
                    }}>
                            <StatusIcon size={12} />
                            <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: "uppercase"
                      }}>{cfg.label}</span>
                          </div>
                        </td>
                        <td style={{
                    padding: "16px 20px"
                  }}>
                          <span style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      fontWeight: 600
                    }}>{new Date(order.createdAt).toLocaleString()}</span>
                        </td>
                        <td style={{
                    padding: "16px 20px",
                    textAlign: "right"
                  }}>
                          <button type="button" onClick={e => {
                      e.stopPropagation();
                      navigate(`/payment-logs/${order.txnId}`);
                    }} style={{
                      height: 28,
                      padding: "0 10px",
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      background: "var(--card-bg)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border-color)",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}>
                            View Logs
                          </button>
                        </td>
                      </tr>
            }) : <tr>
                    <td colSpan={7} style={{
                padding: "80px 24px",
                textAlign: "center"
              }}>
                      <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12
                }}>
                        <CreditCard size={40} style={{
                    color: "var(--text-muted)",
                    opacity: 0.3
                  }} />
                        <p style={{
                    fontWeight: 800,
                    color: "var(--text-main)",
                    margin: 0
                  }}>No payment records found</p>
                      </div>
                    </td>
                  </tr>}
              </tbody>
            </table>
          </div>}

        {/* Pagination */}
        {totalPages > 1 && <div style={{
        padding: "14px 24px",
        borderTop: "1px solid var(--border-color)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "var(--bg-main)"
      }}>
            <span style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.07em"
        }}>
              Page {page} of {totalPages} · {total.toLocaleString()} records
            </span>
            <div style={{
          display: "flex",
          gap: 8
        }}>
              <button onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page === 1 || isFetching} style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "1.5px solid var(--border-color)",
            background: "var(--card-bg)",
            cursor: page === 1 ? "not-allowed" : "pointer",
            opacity: page === 1 ? 0.4 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)"
          }}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(prev => Math.min(totalPages, prev + 1))} disabled={page >= totalPages || isFetching} style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "1.5px solid var(--border-color)",
            background: "var(--card-bg)",
            cursor: page >= totalPages ? "not-allowed" : "pointer",
            opacity: page >= totalPages ? 0.4 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)"
          }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>}
      </div>
    </div>;
}