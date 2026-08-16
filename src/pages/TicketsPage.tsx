import { PageBanner } from "@/components/ui/PageBanner";
import { useState, useEffect } from "react";
import { Search, Info, MessageSquare, AlertCircle, CheckCircle2, Ticket, Send, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/Skeletons";
interface Ticket {
  _id: string;
  staffId?: {
    _id: string;
    name: string;
    mobileNumber: string;
    roleId: string;
    status: string;
  };
  userId?: {
    _id: string;
    name: string;
    mobileNumber: string;
    profileImage?: string;
  };
  subject: string;
  description: string;
  status: "Pending" | "In Progress" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High";
  createdAt: string;
}
interface Message {
  _id: string;
  senderType: "User" | "Staff";
  message: string;
  createdAt: string;
}
export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshQueue, setRefreshQueue] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Chat State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyMsg, setReplyMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [fetchingMessages, setFetchingMessages] = useState(false);
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '10');
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (statusFilter !== 'All') params.set('status', statusFilter);
    api.get(`/tickets/all?${params.toString()}`).then(res => {
      const payload = res?.data?.data;
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.tickets) ? payload.tickets : Array.isArray(payload?.results) ? payload.results : [];
      const pages = Number(payload?.totalPages ?? payload?.pages ?? payload?.pageCount ?? payload?.meta?.totalPages ?? 1);
      setTickets(items);
      setTotalPages(Number.isFinite(pages) && pages > 0 ? pages : 1);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load tickets', err);
      toast.error(err?.response?.data?.message || 'Failed to load tickets');
      setTickets([]);
      setTotalPages(1);
      setLoading(false);
    });
  }, [refreshQueue, page, searchQuery, statusFilter]);
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await api.put(`/tickets/status/${id}`, {
        status: newStatus
      });
      if (res.status === 200) {
        setRefreshQueue(prev => prev + 1);
        toast.success("Ticket status updated");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };
  const fetchMessages = async (ticketId: string) => {
    setFetchingMessages(true);
    try {
      const res = await api.get(`/tickets/messages/admin/${ticketId}`);
      const rawMessages = res.data.data;
      setMessages(Array.isArray(rawMessages) ? rawMessages : []);
    } catch (err) {
      toast.error("Failed to fetch messages");
    } finally {
      setFetchingMessages(false);
    }
  };
  const handleSendMessage = async () => {
    if (!replyMsg.trim() || !selectedTicket) return;
    setSending(true);
    try {
      await api.post("/tickets/messages/admin/send", {
        ticketId: selectedTicket._id,
        message: replyMsg
      });
      setReplyMsg("");
      fetchMessages(selectedTicket._id);
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };
  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket._id);
      const interval = setInterval(() => fetchMessages(selectedTicket._id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedTicket]);
  const openCount = tickets.filter(t => t.status?.toLowerCase() !== 'resolved' && t.status?.toLowerCase() !== 'closed').length;
  const resolvedCount = tickets.filter(t => t.status?.toLowerCase() === 'resolved').length;

  return (
    <div className="space-y-6 animate-in">
        {/* ── Page Header ── */}
        <PageBanner 
            title="Support Tickets" 
            subtitle="Manage customer and partner support requests efficiently." 
        />

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-3 gap-3">
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 text-left">
                <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
                    <Ticket size={14} />
                    Total Tickets
                </div>
                <div className="text-2xl font-bold text-[var(--text-main)]">{tickets.length}</div>
            </div>
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 text-left">
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">
                    <AlertCircle size={14} />
                    Open Tickets
                </div>
                <div className="text-2xl font-bold text-[var(--text-main)]">{openCount}</div>
            </div>
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 text-left">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">
                    <CheckCircle2 size={14} />
                    Resolved Tickets
                </div>
                <div className="text-2xl font-bold text-[var(--text-main)]">{resolvedCount}</div>
            </div>
        </div>

            {/* ── Search & Filter Toolbar ── */}
            <div className="flex items-center justify-between gap-3 w-full">
                <div style={{
        position: "relative",
        width: "320px",
        flexShrink: 0
      }}>
                    <Search size={15} style={{
          position: "absolute",
          left: 13,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-muted)",
          pointerEvents: "none",
          zIndex: 10
        }} />
                    <input type="text" placeholder="Search by TxnID, name, phone..." value={searchQuery} onChange={e => {
          setSearchQuery(e.target.value);
          setPage(1);
        }} style={{
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
                <div className="flex items-center bg-[var(--card-bg)] border border-[var(--border-color)] p-1 rounded-xl shrink-0">
                    {['All', 'Pending', 'In Progress', 'Resolved'].map(s => <button key={s} onClick={() => {
          setStatusFilter(s);
          setPage(1);
        }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all
                                ${statusFilter === s ? 'bg-[var(--bg-main)] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
                            {s}
                        </button>)}
                </div>
            </div>

            {/* ── Tickets Table Card ── */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider w-12">#</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Submitted By</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Subject & details</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {loading ? <tr>
                                    <td colSpan={5} className="p-0">
                                        <TableSkeleton columns={5} rows={5} showHeader={false} />
                                    </td>
                                </tr> : tickets.length > 0 ? tickets.map((t, index) => <tr key={t._id} className="hover:bg-[var(--bg-main)] transition-colors group">
                                        <td className="py-3.5 px-4 text-xs font-semibold text-[var(--text-muted)]">
                                            {String((page - 1) * 50 + index + 1).padStart(2, '0')}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center font-bold text-blue-600 text-xs">
                                                    {t.staffId?.name?.charAt(0) || t.userId?.name?.charAt(0) || "U"}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-[var(--text-main)]">
                                                        {t.staffId?.name || t.userId?.name || "Unknown Sender"}
                                                    </p>
                                                    <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                                                        {t.staffId?.mobileNumber || t.userId?.mobileNumber || "—"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <h4 className="font-semibold text-sm text-[var(--text-main)]">{t.subject}</h4>
                                            <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-xs truncate" title={t.description}>
                                                {t.description}
                                            </p>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border
                                                ${t.status?.toLowerCase() === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400' : t.status?.toLowerCase() === 'in progress' ? 'bg-blue-50 text-[#1A7FD4] border-blue-200 dark:bg-blue-500/10 dark:text-blue-400' : t.status?.toLowerCase() === 'closed' ? 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full
                                                    ${t.status?.toLowerCase() === 'resolved' ? 'bg-emerald-400' : t.status?.toLowerCase() === 'in progress' ? 'bg-blue-400 animate-pulse' : t.status?.toLowerCase() === 'closed' ? 'bg-slate-400' : 'bg-amber-400 animate-bounce'}`} />
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => setSelectedTicket(t)} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#64748B] hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 border border-[#E2E8F0] hover:border-blue-300 transition-all" title="Reply to Ticket">
                                                    <MessageSquare size={14} />
                                                </button>
                                                <select value={t.status} onChange={e => updateStatus(t._id, e.target.value)} className="py-1.5 pl-3 pr-8 bg-[var(--bg-main)] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#1E293B] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer uppercase tracking-wider appearance-none" style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: `right 0.4rem center`,
                    backgroundSize: `1.2em 1.2em`,
                    backgroundRepeat: `no-repeat`
                  }}>
                                                    <option value="Pending">PENDING</option>
                                                    <option value="In Progress">IN PROGRESS</option>
                                                    <option value="Resolved">RESOLVED</option>
                                                    <option value="Closed">CLOSED</option>
                                                </select>
                                            </div>
                                        </td>
                                    </tr>) : <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-center mx-auto text-[var(--text-muted)]">
                                                <MessageSquare size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--text-main)]">No support tickets found</p>
                                                <p className="text-xs text-[var(--text-muted)] mt-0.5">The support inquiries queue is currently empty.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-color)]">
                        <p className="text-xs text-[var(--text-muted)]">
                            Page <span className="font-semibold text-[var(--text-main)]">{page}</span> of <span className="font-semibold text-[var(--text-main)]">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                <ChevronLeft size={14} />
                            </button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>}
            </div>

            {/* ── Chat Intervention Modal ── */}
            {selectedTicket && <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedTicket(null)} />
                    <div className="relative w-full max-w-2xl h-[80vh] bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <MessageSquare size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--text-main)] leading-snug line-clamp-1">{selectedTicket.subject}</h3>
                                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                                        Support Ticket • {selectedTicket.staffId?.name || selectedTicket.userId?.name || "Patient"}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body / Chat Thread */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[var(--bg-main)]/30">
                            {fetchingMessages && messages.length === 0 ? <div className="flex flex-col items-center justify-center h-full gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                    <p className="text-xs text-[var(--text-muted)] font-semibold">Syncing thread...</p>
                                </div> : <>
                                    <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 rounded-xl p-4 text-center">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Original Inquiry</p>
                                        <p className="text-xs font-semibold text-[var(--text-main)] italic">"{selectedTicket.description}"</p>
                                    </div>

                                    {Array.isArray(messages) && messages.map(m => {
              const isMe = m.senderType === 'User';
              return <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] p-4 rounded-xl shadow-sm border ${isMe ? 'bg-blue-600 text-white border-blue-600 rounded-tr-none' : 'bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-main)] rounded-tl-none'}`}>
                                                    <p className="text-xs font-semibold leading-relaxed">{m.message}</p>
                                                    <p className={`text-[8px] mt-1.5 font-bold uppercase tracking-wider ${isMe ? 'text-blue-200' : 'text-[var(--text-muted)]'}`}>
                                                        {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                                                    </p>
                                                </div>
                                            </div>;
            })}
                                    {messages.length === 0 && <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] py-10 gap-2">
                                            <Info size={32} />
                                            <p className="text-xs font-semibold">No active conversation thread yet</p>
                                        </div>}
                                </>}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-[var(--card-bg)] border-t border-[var(--border-color)]">
                            <div className="relative">
                                <textarea className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 pr-16 text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none min-h-[70px] font-semibold" placeholder="Type your response..." value={replyMsg} onChange={e => setReplyMsg(e.target.value)} onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }} />
                                <button disabled={sending || !replyMsg.trim()} onClick={handleSendMessage} className="absolute right-3.5 bottom-3.5 w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50">
                                    {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={15} />}
                                </button>
                            </div>
                            <p className="text-[9px] font-semibold text-[var(--text-muted)] mt-3 uppercase tracking-wider text-center">Press Enter to send response • Esc to close</p>
                        </div>
                    </div>
                </div>}
        </div>
    );
}
export default TicketsPage;