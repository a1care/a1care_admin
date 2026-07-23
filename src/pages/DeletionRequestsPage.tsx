import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  UserX, 
  Search, 
  Clock, 
  Trash2, 
  User, 
  Briefcase,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Phone,
  History
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface DeletionRequest {
  id: string;
  type: 'patient' | 'staff';
  name: string;
  mobileNumber: string;
  requestedAt: string;
}

export default function DeletionRequestsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-deletion-requests"],
    queryFn: async () => {
      const res = await api.get("/admin/deletion-requests");
      return res.data.data as DeletionRequest[];
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string, type: 'patient' | 'staff' }) => {
      return api.post(`/admin/deletion-approve/${id}`, { type });
    },
    onSuccess: () => {
      toast.success("Account deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-deletion-requests"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to process request");
    }
  });

  const filtered = requests?.filter(r => 
    r.name?.toLowerCase().includes(search.toLowerCase()) || 
    r.mobileNumber?.includes(search)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mr-3" />
        <span className="font-bold uppercase tracking-widest text-xs">Loading requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* ── Page Header ── */}
      <header className="flex flex-col gap-2 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden text-left items-start">
        <div className="relative z-10 w-full">
          <div className="flex items-center justify-between gap-4 w-full">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">Deletion Requests</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">
                  Home • Security • Deletion Requests
                </p>
              </div>
            </div>
            {/* Header Actions / Summary Badge */}
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 px-5 py-2.5 rounded-xl shrink-0">
              <UserX size={18} className="text-rose-600 dark:text-rose-400" />
              <div>
                <p className="text-[9px] font-black text-rose-800 dark:text-rose-300 uppercase tracking-widest leading-none">Terminations Pending</p>
                <p className="text-lg font-black text-rose-900 dark:text-rose-200 mt-1 leading-none">{requests?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      </header>

      {/* ── Search Toolbar ── */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm">
        <div style={{ position: "relative", width: "320px", flexShrink: 0 }}>
          <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", zIndex: 10 }} />
          <input 
            type="text"
            placeholder="Search by TxnID, name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
                width: "100%", height: 42, borderRadius: 12, paddingLeft: 38, paddingRight: 14,
                background: "var(--card-bg)", border: "1.5px solid var(--border-color)",
                fontSize: "0.875rem", color: "var(--text-main)", outline: "none",
                fontFamily: "inherit", boxSizing: "border-box"
            }}
          />
        </div>
      </div>

      {/* ── Table Layout (Notification Log Style) ── */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={15} className="text-rose-500" />
            <h3 className="text-sm font-bold text-[var(--text-main)]">Deletion Approval Queue</h3>
          </div>
          <span className="text-xs font-bold text-[var(--text-muted)]">
            {filtered?.length || 0} Request{filtered?.length !== 1 ? 's' : ''} listed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Account Type</th>
                <th className="py-3 px-4">Request Date</th>
                <th className="py-3 px-4 w-80">Warning Check</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filtered && filtered.length > 0 ? (
                filtered.map((req, index) => (
                  <tr key={req.id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                    <td className="py-4 px-4 text-xs font-semibold text-[var(--text-muted)]">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          req.type === 'patient' ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                        }`}>
                          {req.type === 'patient' ? <User size={18} /> : <Briefcase size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[var(--text-main)]">{req.name || "Anonymous User"}</p>
                          <span className="text-xs text-[var(--text-muted)] font-mono flex items-center gap-1 mt-0.5">
                            <Phone size={10} /> {req.mobileNumber}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                        req.type === 'patient' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      }`}>
                        {req.type}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                        <Clock size={12} className="text-[var(--text-muted)]" />
                        {new Date(req.requestedAt).toLocaleDateString()} at {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-start gap-2 p-2 bg-rose-50 dark:bg-rose-950/15 border border-rose-100/50 dark:border-rose-900/20 rounded-lg max-w-sm">
                        <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={13} />
                        <p className="text-[9px] font-bold text-rose-800 dark:text-rose-300 leading-normal uppercase tracking-wide">
                          Action irreversibly deletes health logs, orders, and wallet balance.
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm("Are you absolutely sure you want to permanently delete this account? This action cannot be undone.")) {
                            approveMutation.mutate({ id: req.id, type: req.type });
                          }
                        }}
                        disabled={approveMutation.isPending}
                        className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm disabled:opacity-50"
                      >
                        {approveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 size={13} />}
                        <span>Delete Account</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-300">
                        <CheckCircle size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[var(--text-main)]">Queue is Clear</h4>
                        <p className="text-xs text-[var(--text-muted)] font-medium mt-1">No pending account deletion requests found.</p>
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
  );
}
