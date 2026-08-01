import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format";
import { A1Drawer } from "@/components/ui/A1Drawer";
import { TableSkeleton } from "@/components/ui/Skeletons";
import { 
    Banknote, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    Search, 
    Filter, 
    ChevronLeft,
    ChevronRight,
    Loader2,
    Building2,
    User,
    CreditCard,
    X,
    TrendingUp,
    Eye,
    Check
} from "lucide-react";

interface Payout {
    _id: string;
    staffId: {
        _id: string;
        name: string;
        mobileNumber: string;
    };
    amount: number;
    status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
    bankDetails: {
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        upiId?: string;
    };
    createdAt: string;
    adminNote?: string;
}

export function PayoutsPage() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState("All"); 
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
    const [adminNote, setAdminNote] = useState("");
    const [isReconciling, setIsReconciling] = useState(false);
    const [inspectPayout, setInspectPayout] = useState<Payout | null>(null);

    const { data: payoutData, isLoading, isFetching } = useQuery({
        queryKey: ["admin_payouts", filter, page, searchQuery],
        queryFn: async () => {
            const res = await api.get(`/admin/payouts?status=${filter}&page=${page}&limit=10&search=${searchQuery}`);
            return res.data.data;
        },
        staleTime: 30000,
        refetchOnWindowFocus: false
    });

    const payouts: Payout[] = payoutData?.items || [];
    const totalPages: number = payoutData?.totalPages || 1;

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, note }: { id: string, status: string, note?: string }) => {
            return api.put(`/admin/payouts/${id}`, { status, adminNote: note });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_payouts"] });
            toast.success("Settlement record finalized");
            setSelectedPayout(null);
            setInspectPayout(null);
            setAdminNote("");
        },
        onMutate: () => setIsReconciling(true),
        onSettled: () => setIsReconciling(false)
    });

    const pendingTotal = payouts?.filter(p => p.status === "PENDING").reduce((acc, p) => acc + p.amount, 0) || 0;
    const averagePayout = payouts && payouts.length > 0 ? (payouts.reduce((acc, p) => acc + p.amount, 0) / payouts.length) : 0;

    return (
        <div className="space-y-6 animate-in">
            {/* ── Page Header ── */}
            <header className="flex flex-col gap-4 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden text-left items-start">
                <div className="relative z-10 w-full space-y-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">Partner Payouts</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">
                                Home • Payouts • Partner Payouts
                            </p>
                        </div>
                    </div>
                    {/* Status Switcher */}
                    <div className="flex flex-wrap gap-1 bg-[var(--bg-main)] border border-[var(--border-color)] p-1 rounded-xl w-fit">
                        {["All", "PENDING", "COMPLETED", "REJECTED"].map(f => (
                            <button
                                key={f}
                                onClick={() => { setFilter(f); setPage(1); }}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all
                                    ${filter === f
                                        ? "bg-[var(--card-bg)] text-blue-600 dark:text-blue-400 shadow-sm border border-[var(--border-color)]"
                                        : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                    }`}
                            >
                                {f === "PENDING" ? "Pending" : f === "COMPLETED" ? "Completed" : f === "REJECTED" ? "Rejected" : "All"}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-12 right-32 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            </header>

            {/* ── Stats Cards Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Stat 1: Pending */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-5 rounded-xl flex flex-col gap-2 relative overflow-hidden text-left">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        <Clock size={14} />
                        Pending Requests
                    </div>
                    <div className="text-2xl font-bold text-[var(--text-main)]">₹{pendingTotal.toLocaleString()}</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-1">
                        Total {payouts?.filter(p => p.status === "PENDING").length} active requests
                    </div>
                </div>

                {/* Stat 2: Average */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-5 rounded-xl flex flex-col gap-2 relative overflow-hidden text-left">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                        <TrendingUp size={14} />
                        Average Settlement
                    </div>
                    <div className="text-2xl font-bold text-[var(--text-main)]">₹{averagePayout.toLocaleString()}</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-1">
                        Calculated across loaded records
                    </div>
                </div>

                {/* Stat 3: Typical processing */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-5 rounded-xl flex flex-col gap-2 relative overflow-hidden text-left">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={14} />
                        Processing Window
                    </div>
                    <div className="text-2xl font-bold text-[var(--text-main)]">~4 Hours</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-1">
                        After administrator review
                    </div>
                </div>
            </div>

            {/* ── Search Toolbar ── */}
            <div style={{ position: "relative", width: "320px", flexShrink: 0 }}>
                {isFetching ? (
                    <Loader2 size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#3b82f6", animation: "spin 1s linear infinite", zIndex: 10 }} />
                ) : (
                    <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", zIndex: 10 }} />
                )}
                <input
                    type="text"
                    placeholder="Search by TxnID, name, phone..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    style={{
                        width: "100%", height: 42, borderRadius: 12, paddingLeft: 38, paddingRight: 14,
                        background: "var(--card-bg)", border: "1.5px solid var(--border-color)",
                        fontSize: "0.875rem", color: "var(--text-main)", outline: "none",
                        fontFamily: "inherit", boxSizing: "border-box"
                    }}
                />
            </div>

            {/* ── Payouts Table Card ── */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider w-10">#</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Partner</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Request Date</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Payment Mode</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Amount</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="p-0">
                                        <TableSkeleton columns={7} rows={5} showHeader={false} />
                                    </td>
                                </tr>
                            ) : payouts.length > 0 ? (
                                payouts.map((payout, index) => {
                                    const isPending = payout.status === "PENDING";
                                    return (
                                        <tr key={payout._id} className="hover:bg-[var(--bg-main)] transition-colors group">
                                            <td className="py-3.5 px-4 text-xs font-medium text-[var(--text-muted)]">
                                                {String((page - 1) * 10 + index + 1).padStart(2, '0')}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold shrink-0 text-xs">
                                                        {payout.staffId?.name?.charAt(0) || "P"}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-sm text-[var(--text-main)]">
                                                            {payout.staffId?.name || "Unnamed"}
                                                        </div>
                                                        <div className="text-xs text-[var(--text-muted)]">
                                                            {payout.staffId?.mobileNumber || "—"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className="text-sm text-[var(--text-main)]">
                                                    {new Date(payout.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                                                    Ref: #{payout._id.slice(-6).toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="text-sm font-semibold text-[var(--text-main)]">
                                                    {payout.bankDetails?.bankName || (payout.bankDetails?.upiId ? "UPI Mode" : "Wallet Payment")}
                                                </div>
                                                <div className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                                                    {payout.bankDetails?.accountNumber ? `•••• ${payout.bankDetails.accountNumber.slice(-4)}` : (payout.bankDetails?.upiId || "Wallet Balance")}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-[var(--text-main)]">
                                                    ₹{payout.amount.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border
                                                    ${payout.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                                      payout.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400' :
                                                      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400'}`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full
                                                        ${payout.status === 'COMPLETED' ? 'bg-emerald-400' : payout.status === 'REJECTED' ? 'bg-rose-400' : 'bg-amber-400'}`} />
                                                    {payout.status === 'COMPLETED' ? 'Settled' : payout.status === 'REJECTED' ? 'Rejected' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* VIEW details */}
                                                    <button
                                                        onClick={() => setInspectPayout(payout)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 border border-[var(--border-color)] hover:border-blue-300 transition-all"
                                                        title="View Details"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    {/* APPROVE AND REJECT */}
                                                    {isPending && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    toast.info("Confirm Settlement?", {
                                                                        description: `Approve and finalise payout of ₹${payout.amount} to this provider?`,
                                                                        action: {
                                                                            label: "Approve & Pay",
                                                                            onClick: () => updateStatusMutation.mutate({ id: payout._id, status: 'COMPLETED' })
                                                                        }
                                                                    });
                                                                }}
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center border text-[var(--text-muted)] hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-500/10 border-[var(--border-color)] hover:border-green-300 transition-all"
                                                                title="Approve & Pay"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedPayout(payout)}
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center border text-[var(--text-muted)] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 border-[var(--border-color)] hover:border-rose-300 transition-all"
                                                                title="Reject Request"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-center mx-auto text-[var(--text-muted)]">
                                                <Banknote size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--text-main)]">Payout queue reconciled</p>
                                                <p className="text-xs text-[var(--text-muted)] mt-0.5">No pending withdrawal requests found matching your query.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-color)]">
                    <p className="text-xs text-[var(--text-muted)]">
                        Page <span className="font-semibold text-[var(--text-main)]">{page}</span> of <span className="font-semibold text-[var(--text-main)]">{Math.max(1, totalPages)}</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(Math.max(1, totalPages), p + 1))}
                            disabled={page >= Math.max(1, totalPages)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Inspect Details Modal ── */}
            {inspectPayout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setInspectPayout(null)} />
                    <div className="relative w-full max-w-lg bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <div>
                                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Payout Details</p>
                                <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">
                                    Ref ID: #{inspectPayout._id.toUpperCase()}
                                </h3>
                            </div>
                            <button
                                onClick={() => setInspectPayout(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                                    <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Provider Name</p>
                                    <p className="text-sm font-semibold text-[var(--text-main)]">{inspectPayout.staffId?.name || "Unnamed Partner"}</p>
                                </div>
                                <div className="p-3 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                                    <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Mobile Contact</p>
                                    <p className="text-sm font-semibold text-[var(--text-main)]">{inspectPayout.staffId?.mobileNumber || "N/A"}</p>
                                </div>
                                <div className="p-3 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                                    <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Bank Name</p>
                                    <p className="text-sm font-semibold text-[var(--text-main)]">{inspectPayout.bankDetails?.bankName || "UPI Mode"}</p>
                                </div>
                                <div className="p-3 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                                    <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Account Holder</p>
                                    <p className="text-sm font-semibold text-[var(--text-main)]">{inspectPayout.bankDetails?.accountHolderName || "N/A"}</p>
                                </div>
                                <div className="p-3 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                                    <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Account Number</p>
                                    <p className="text-sm font-semibold text-[var(--text-main)]">{inspectPayout.bankDetails?.accountNumber || "N/A"}</p>
                                </div>
                                <div className="p-3 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                                    <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">IFSC Code</p>
                                    <p className="text-sm font-semibold text-[var(--text-main)] uppercase">{inspectPayout.bankDetails?.ifscCode || "N/A"}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                                <div>
                                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Payout Amount</p>
                                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">₹{inspectPayout.amount.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold border
                                        ${inspectPayout.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                          inspectPayout.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                          'bg-amber-50 text-amber-700 border-amber-200'}`}
                                    >
                                        {inspectPayout.status}
                                    </span>
                                </div>
                            </div>

                            {inspectPayout.adminNote && (
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl">
                                    <p className="text-[11px] font-semibold text-yellow-800 dark:text-yellow-500 uppercase tracking-wider mb-1">Admin Notes</p>
                                    <p className="text-xs font-medium text-yellow-900 dark:text-yellow-100">"{inspectPayout.adminNote}"</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-main)]">
                            {inspectPayout.status === 'PENDING' && (
                                <>
                                    <button
                                        onClick={() => {
                                            setSelectedPayout(inspectPayout);
                                        }}
                                        className="h-9 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => {
                                            toast.info("Confirm Settlement?", {
                                                description: `Approve and finalise payout of ₹${inspectPayout.amount} to this provider?`,
                                                action: {
                                                    label: "Approve & Pay",
                                                    onClick: () => updateStatusMutation.mutate({ id: inspectPayout._id, status: 'COMPLETED' })
                                                }
                                            });
                                        }}
                                        className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
                                    >
                                        Approve & Pay
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setInspectPayout(null)}
                                className="h-9 px-4 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--border-color)] transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Rejection Modal ── */}
            {selectedPayout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedPayout(null)} />
                    <div className="relative w-full max-w-lg bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <div>
                                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Settlement Protocol</p>
                                <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">Reject Payout Request</h3>
                            </div>
                            <button
                                onClick={() => setSelectedPayout(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div className="p-3 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Amount</p>
                                    <p className="text-base font-bold text-[var(--text-main)] mt-0.5">₹{selectedPayout.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Partner</p>
                                    <p className="text-sm font-semibold text-[var(--text-main)] mt-0.5">{selectedPayout.staffId?.name}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Rejection Reason</label>
                                <textarea
                                    className="w-full h-24 p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none font-semibold"
                                    placeholder="Explain why this request is being rejected (e.g. Invalid bank details)..."
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-main)]">
                            <button
                                onClick={() => setSelectedPayout(null)}
                                className="h-9 px-4 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--border-color)] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => updateStatusMutation.mutate({ id: selectedPayout._id, status: 'REJECTED', note: adminNote })}
                                disabled={updateStatusMutation.isPending}
                                className="h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
                            >
                                {updateStatusMutation.isPending ? "Syncing..." : "Confirm Rejection"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
