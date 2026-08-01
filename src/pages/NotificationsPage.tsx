import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TableSkeleton } from "@/components/ui/Skeletons";
import {
  Send,
  Users,
  User,
  Bell,
  CheckCircle2,
  Search,
  X,
  Info,
  History,
  Calendar,
  UserSearch as UserSearchIcon,
  ShieldCheck,
  Trash2,
  Loader2,
  Plus,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

type Audience = "all" | "patients" | "partners" | "admins" | "individual";

interface NotificationHistoryItem {
  _id: string;
  title: string;
  body: string;
  recipientType: string;
  refType?: string;
  fcmStatus: string;
  createdAt: string;
}

interface UserSummary {
  _id: string;
  name: string;
  mobileNumber: string;
  email?: string;
  category?: string;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [audience, setAudience] = useState<Audience>("all");
  const [targetScope, setTargetScope] = useState<"all" | "specific">("all");
  const [recipientId, setRecipientId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientType, setRecipientType] = useState<"patient" | "partner" | "admin" | "all">("patient");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dataPayload, setDataPayload] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"broadcast" | "intelligence">("broadcast");

  const [historyPage, setHistoryPage] = useState(1);
  const [alertsPage, setAlertsPage] = useState(1);

  // 1. History Query
  const { data: historyData, refetch: refetchHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["notifications-history", historyPage],
    queryFn: async () => {
      const res = await api.get(`/admin/notifications?page=${historyPage}&limit=10`);
      return res.data.data;
    }
  });
  const history = historyData?.notifications || historyData || [];
  const historyTotal = historyData?.total || 0;

  // 2. User Search Query
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ["user-search", userSearchTerm, recipientType],
    queryFn: async () => {
      if (userSearchTerm.length < 3) return [];
      
      const res = await api.get(`/admin/user-list/${recipientType}`, {
        params: { search: userSearchTerm }
      });
      const payload = res.data?.data;
      if (Array.isArray(payload)) {
        return payload as UserSummary[];
      }
      if (payload && Array.isArray(payload.items)) {
        return payload.items as UserSummary[];
      }
      return [];
    },
    enabled: isSearchOpen && userSearchTerm.length >= 3
  });

  // 3. Send Mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      let data = {};
      try {
        if (dataPayload.trim()) {
          data = JSON.parse(dataPayload);
        }
      } catch (e) {
        throw new Error("Payload configuration error: Invalid JSON structure.");
      }

      const isSpecific = targetScope === "specific" || audience === "individual";

      const res = await api.post("/admin/notifications/broadcast", {
        title,
        body,
        audience: isSpecific ? "individual" : audience,
        recipientId: isSpecific ? recipientId : undefined,
        recipientType: isSpecific ? recipientType : undefined,
        data
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Announcement dispatched successfully!");
      setTitle("");
      setBody("");
      setDataPayload("");
      setRecipientId("");
      setRecipientName("");
      setIsComposeOpen(false);
      refetchHistory();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err.message || "Broadcast sync failure";
      toast.error(msg);
    }
  });

  // 4. Intelligence Query
  const { data: alertsData, refetch: refetchAlerts, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ["admin-system-intelligence", alertsPage],
    queryFn: async () => {
      const res = await api.get(`/admin/notifications?recipientType=admin&page=${alertsPage}&limit=10`);
      return res.data.data;
    }
  });
  const alerts = alertsData?.notifications || alertsData || [];
  const alertsTotal = alertsData?.total || 0;

  const clearAlertsMutation = useMutation({
    mutationFn: async () => api.delete("/admin/notifications/clear"),
    onSuccess: () => {
      toast.success("Intelligence hub cleared.");
      refetchAlerts();
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      refetchHistory();
      toast.success("Notification deleted.");
    },
    onError: () => toast.error("Failed to delete notification."),
  });

  const selectUser = (u: UserSummary) => {
    setRecipientId(u._id);
    setRecipientName(u.name);
    setIsSearchOpen(false);
    setUserSearchTerm("");
  };

  const handleAlertClick = (refType?: string) => {
    const type = String(refType || "").toLowerCase();
    if (type === "servicerequest" || type === "servicerequests" || type.includes("service")) {
      navigate("/bookings");
    } else if (type === "partner" || type === "doctor" || type.includes("partner") || type.includes("doctor")) {
      navigate("/kyc-verification");
    } else if (type === "ticket" || type === "supportticket" || type.includes("ticket")) {
      navigate("/support-tickets");
    } else if (type.includes("deletion") || type.includes("delete")) {
      navigate("/deletion-requests");
    } else if (type.includes("payment")) {
      navigate("/payment-logs");
    }
  };

  const handleAudienceChange = (aud: Audience) => {
    setAudience(aud);
    setRecipientId("");
    setRecipientName("");
      if (aud === "individual") {
        setTargetScope("specific");
        setRecipientType("all");
      } else if (aud === "patients") {
        setTargetScope("all");
        setRecipientType("patient");
      } else if (aud === "partners") {
        setTargetScope("all");
        setRecipientType("partner");
      } else if (aud === "admins") {
        setTargetScope("all");
        setRecipientType("admin");
      } else {
        setTargetScope("all");
      }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* ── Page Header ── */}
      <header className="flex flex-col gap-2 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden text-left items-start">
        <div className="relative z-10 w-full">
          <div className="flex items-center justify-between gap-4 w-full">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">Push Notifications</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">
                  Home • Communication • Push Notifications
                </p>
              </div>
            </div>
            {/* Header Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  setAudience("all");
                  setTargetScope("all");
                  setRecipientId("");
                  setRecipientName("");
                  setIsComposeOpen(true);
                }}
                className="flex items-center gap-1.5 h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
              >
                <Plus size={16} />
                <span>Send Notification</span>
              </button>
              <div className="flex gap-1 bg-[var(--bg-main)] border border-[var(--border-color)] p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('broadcast')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all
                    ${activeTab === 'broadcast'
                      ? "bg-[var(--card-bg)] text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                >
                  Notification Log
                </button>
                <button
                  onClick={() => setActiveTab('intelligence')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all
                    ${activeTab === 'intelligence'
                      ? "bg-[var(--card-bg)] text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                >
                  System Alerts
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-12 right-32 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
      </header>

      {/* ── Search User Modal ── */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-lg bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
              <div>
                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Recipient Target</p>
                <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">Find Subscriber User</h3>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-10" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search by name or mobile number..."
                  className="w-full h-10 pl-10 pr-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {searching ? (
                  <div className="flex items-center justify-center py-8 text-blue-500 gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-xs font-semibold">Searching Database...</span>
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => selectUser(user)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] hover:border-blue-500 hover:bg-[var(--card-bg)] transition-all text-left"
                    >
                      <div>
                        <p className="font-semibold text-sm text-[var(--text-main)]">{user.name}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">{user.mobileNumber}</p>
                      </div>
                      <CheckCircle2 size={16} className="text-blue-600" />
                    </button>
                  ))
                ) : userSearchTerm.length >= 3 ? (
                  <div className="text-center py-8 text-[var(--text-muted)]">
                    <UserSearchIcon size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">No matching subscribers found</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--text-muted)]">
                    <Search size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">Enter 3 or more characters to trigger search</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end bg-[var(--bg-main)]">
              <button
                onClick={() => setIsSearchOpen(false)}
                className="h-9 px-4 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--border-color)] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Compose Announcement Modal ── */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsComposeOpen(false)} />
          <div className="relative w-full max-w-xl bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
              <div>
                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Broadcast Tool</p>
                <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">Compose Announcement</h3>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Target Audience</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "all", label: "Everyone", icon: Users },
                    { id: "patients", label: "Patients", icon: User },
                    { id: "partners", label: "Partners", icon: User },
                    { id: "admins", label: "Admins", icon: ShieldCheck },
                    { id: "individual", label: "Individual", icon: Search },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAudienceChange(item.id as Audience)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-1 cursor-pointer
                        ${audience === item.id
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                          : "bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-blue-400 hover:text-[var(--text-main)]"
                        }`}
                    >
                      <item.icon size={15} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient/Partner/Admin specific selector toggle */}
              {(audience === "patients" || audience === "partners" || audience === "admins") && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Target Group Scope</label>
                  <div className="flex bg-[var(--bg-main)] border border-[var(--border-color)] p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => { setTargetScope("all"); setRecipientId(""); setRecipientName(""); }}
                      className={`flex-1 py-1 text-xs font-semibold uppercase tracking-wider rounded-md transition-all
                        ${targetScope === "all" ? "bg-blue-600 text-white shadow-sm" : "text-[var(--text-muted)]"}`}
                    >
                      {audience === "patients" ? "All Patients" : audience === "partners" ? "All Partners" : "All Admins"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetScope("specific")}
                      className={`flex-1 py-1 text-xs font-semibold uppercase tracking-wider rounded-md transition-all
                        ${targetScope === "specific" ? "bg-blue-600 text-white shadow-sm" : "text-[var(--text-muted)]"}`}
                    >
                      {audience === "patients" ? "Specific Patient" : audience === "partners" ? "Specific Partner" : "Specific Admin"}
                    </button>
                  </div>
                </div>
              )}

              {/* Target Search Box */}
              {targetScope === "specific" && (
                <div className="space-y-1.5 p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)] animate-in fade-in">
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase">Select Target {recipientType === "patient" ? "Patient" : recipientType === "partner" ? "Partner" : recipientType === "admin" ? "Admin" : "User"}</label>
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className="w-full h-9 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg px-3 flex items-center justify-between text-xs hover:border-blue-500 transition-colors"
                  >
                    <span className="font-semibold text-[var(--text-main)] truncate">
                      {recipientName || `Search for a specific ${recipientType}...`}
                    </span>
                    <Search size={14} className="text-[var(--text-muted)]" />
                  </button>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Notification Title</label>
                <input
                  className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                  placeholder="e.g. Special health checkup discount alert"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Message Body</label>
                <textarea
                  className="w-full h-24 p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none font-semibold"
                  placeholder="Enter message text..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-main)]">
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="h-9 px-4 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--border-color)] transition-all"
              >
                Cancel
              </button>
              <button
                disabled={sendMutation.isPending || !title || !body || (targetScope === 'specific' && !recipientId)}
                onClick={() => sendMutation.mutate()}
                className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {sendMutation.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <>
                    <Send size={13} />
                    <span>Send Announcement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'broadcast' ? (
        /* Notification Log List full screen */
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={15} className="text-blue-500" />
              <h3 className="text-sm font-bold text-[var(--text-main)]">Sent Notifications Log</h3>
            </div>
            <button
              onClick={() => refetchHistory()}
              className="text-xs text-blue-500 hover:underline font-semibold"
            >
              Refresh Log
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">FCM Dispatch</th>
                  <th className="py-3 px-4">Date Dispatched</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {isLoadingHistory ? (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <TableSkeleton columns={6} rows={5} showHeader={false} />
                      </td>
                    </tr>
                  ) : history.length > 0 ? (
                  history.map((item: any, index: number) => (
                    <tr key={item._id} className="hover:bg-[var(--bg-main)] transition-colors">
                      <td className="py-3.5 px-4 text-xs font-semibold text-[var(--text-muted)]">
                        {String((historyPage - 1) * 10 + index + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-sm text-[var(--text-main)]">{item.title}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1 max-w-sm" title={item.body}>{item.body}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                          {(item.recipientType || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border
                          ${item.fcmStatus === 'sent' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            item.fcmStatus === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          {item.fcmStatus || 'unknown'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => deleteNotificationMutation.mutate(item._id)}
                          disabled={deleteNotificationMutation.isPending}
                          className="w-8 h-8 rounded-lg border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white inline-flex items-center justify-center transition-colors"
                          title="Delete history log"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-center mx-auto text-[var(--text-muted)]">
                          <Bell size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-main)]">No sent log history</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">Use the "+ Send Notification" tool to launch alerts.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* History Pagination */}
          {history.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--card-bg)] border-t border-[var(--border-color)] shadow-sm">
              <div className="flex items-center gap-4">
                <p className="text-xs text-[var(--text-muted)]">
                  Showing <span className="font-semibold text-[var(--text-main)]">{(historyPage - 1) * 10 + (history.length > 0 ? 1 : 0)}</span> to <span className="font-semibold text-[var(--text-main)]">{historyTotal > 0 ? Math.min(historyPage * 10, historyTotal) : (historyPage - 1) * 10 + history.length}</span> {historyTotal > 0 && <>of <span className="font-semibold text-[var(--text-main)]">{historyTotal}</span></>} entries
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  disabled={historyPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setHistoryPage(p => p + 1)}
                  disabled={history.length < 10}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Intelligence log section */
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-[var(--card-bg)] border border-[var(--border-color)] p-5 rounded-xl shadow-sm">
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                <Info size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-[var(--text-main)]">System Alert Log</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Real-time alerts for service requests, KYC verification audits, and booking schedules.</p>
              </div>
            </div>
            <button
              onClick={() => clearAlertsMutation.mutate()}
              className="h-9 px-4 border border-[var(--border-color)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-200 text-xs font-bold uppercase tracking-wider rounded-lg transition-all shrink-0"
            >
              Clear All Alerts
            </button>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm text-left">
            <div className="p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      <th className="py-3 px-4 w-12">#</th>
                      <th className="py-3 px-4 w-12">Type</th>
                      <th className="py-3 px-4">Alert Details</th>
                      <th className="py-3 px-4">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {isLoadingAlerts ? (
                        <tr>
                          <td colSpan={4} className="p-0">
                            <TableSkeleton columns={4} rows={5} showHeader={false} />
                          </td>
                        </tr>
                      ) : alerts.length > 0 ? (
                      alerts.map((alert: any, index: number) => (
                        <tr
                          key={alert._id}
                          onClick={() => handleAlertClick(alert.refType)}
                          className="hover:bg-[var(--bg-main)] transition-colors cursor-pointer group"
                          title="Click to inspect this item"
                        >
                          <td className="py-3.5 px-4 text-xs font-semibold text-[var(--text-muted)]">
                            {String((alertsPage - 1) * 10 + index + 1).padStart(2, '0')}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="w-8 h-8 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)]">
                              {alert.refType === 'ServiceRequest' ? <Calendar size={15} className="text-blue-500" /> :
                               alert.refType === 'Partner' ? <ShieldCheck size={15} className="text-emerald-500" /> :
                               <Bell size={15} className="text-amber-500" />}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                {(alert.refType || 'System').replace(/([a-z])([A-Z])/g, '$1 $2')}
                              </span>
                            </div>
                            <div className="font-semibold text-sm text-[var(--text-main)] mt-0.5">{alert.title}</div>
                            <div className="text-xs text-[var(--text-muted)] mt-0.5">{alert.body}</div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
                            {new Date(alert.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-center mx-auto text-[var(--text-muted)]">
                              <CheckCircle2 size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--text-main)]">System alert log clear</p>
                              <p className="text-xs text-[var(--text-muted)] mt-0.5">There are no pending system intelligence alerts.</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alerts Pagination */}
            {alerts.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 bg-[var(--card-bg)] border-t border-[var(--border-color)] shadow-sm">
                <div className="flex items-center gap-4">
                  <p className="text-xs text-[var(--text-muted)]">
                    Showing <span className="font-semibold text-[var(--text-main)]">{(alertsPage - 1) * 10 + (alerts.length > 0 ? 1 : 0)}</span> to <span className="font-semibold text-[var(--text-main)]">{alertsTotal > 0 ? Math.min(alertsPage * 10, alertsTotal) : (alertsPage - 1) * 10 + alerts.length}</span> {alertsTotal > 0 && <>of <span className="font-semibold text-[var(--text-main)]">{alertsTotal}</span></>} entries
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setAlertsPage(p => Math.max(1, p - 1))}
                    disabled={alertsPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setAlertsPage(p => p + 1)}
                    disabled={alerts.length < 10}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
