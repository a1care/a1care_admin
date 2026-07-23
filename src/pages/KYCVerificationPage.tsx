import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import {
    Search,
    FileText,
    Eye,
    CheckCircle,
    XCircle,
    Loader2,
    ShieldCheck,
    Phone,
    X,
    ExternalLink,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { toast } from "sonner";

interface Doctor {
    _id: string;
    name: string;
    mobileNumber: string;
    gender: string;
    startExperience: string;
    specialization: string[];
    status: "Pending" | "Active" | "Rejected";
    consultationFee: number;
    documents?: { type: string; url: string }[];
}

export default function KYCVerificationPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [viewingDoc, setViewingDoc] = useState<{ type: string; url: string } | null>(null);
    const [rejectingDoctor, setRejectingDoctor] = useState<Doctor | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const { data: kycData, isLoading, isFetching } = useQuery({
        queryKey: ["admin_staff_kyc", page, searchQuery],
        queryFn: async () => {
            const res = await api.get(`/admin/doctors?page=${page}&limit=50&search=${searchQuery}`);
            const data = res.data.data;
            const items = data.items || [];
            return {
                ...data,
                items: items.filter((d: any) => {
                    const s = String(d?.status || "").toLowerCase();
                    return s === "pending" || s === "rejected" || s === "inactive";
                })
            };
        }
    });

    const staff: Doctor[] = kycData?.items || [];
    const totalPages: number = kycData?.totalPages || 1;

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, rejectionReason }: { id: string, status: string, rejectionReason?: string }) => {
            return api.put(`/admin/users/doctor/${id}/status`, { status, isRegistered: status === 'Active', rejectionReason });
        },
        onSuccess: () => {
            toast.success("Provider status updated successfully");
            queryClient.invalidateQueries({ queryKey: ["admin_staff_kyc"] });
            queryClient.invalidateQueries({ queryKey: ["admin-dashboard-overview"] });
            setSelectedDoctor(null);
            setRejectingDoctor(null);
            setRejectReason("");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Verification failed");
        }
    });

    const submitReject = () => {
        if (!rejectingDoctor?._id) return;
        if (!rejectReason.trim()) {
            toast.error("Rejection reason is required");
            return;
        }
        updateStatusMutation.mutate({
            id: rejectingDoctor._id,
            status: "Rejected",
            rejectionReason: rejectReason.trim()
        });
    };

    return (
        <div className="space-y-6 animate-in">
            {/* ── Page Header ── */}
            <header className="flex flex-col gap-4 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden text-left items-start">
                <div className="relative z-10 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">KYC Verification</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">
                                    Home • Verification • KYC Verification
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 px-4 py-2 rounded-xl shrink-0 self-start sm:self-auto">
                            <ShieldCheck className="text-amber-500" size={16} />
                            <div>
                                <p className="text-[10px] font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Pending Verification</p>
                                <p className="text-sm font-bold text-amber-900 dark:text-amber-200 mt-0.5 leading-none">{staff?.filter(s => s.status === 'Pending').length || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-12 right-32 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            </header>

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

            {/* ── KYC Cards Grid ── */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl">
                    <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
                    <p className="text-sm text-[var(--text-muted)]">Reconciling partner credentials...</p>
                </div>
            ) : staff.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staff.map((doctor) => (
                        <div key={doctor._id} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm flex flex-col justify-between text-left hover:shadow-md transition-all duration-200">
                            <div className="p-5 space-y-4">
                                {/* Top Identity */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex gap-3 items-center min-w-0">
                                        <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                                            {doctor.name?.charAt(0) || 'P'}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-semibold text-[var(--text-main)] truncate leading-snug">{doctor.name || "Provider"}</h3>
                                            <div className="flex items-center gap-1 mt-0.5 text-xs text-[var(--text-muted)] font-mono">
                                                <Phone size={12} />
                                                <span>{doctor.mobileNumber}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                        ${doctor.status === 'Pending' ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400" : "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400"}`}
                                    >
                                        {doctor.status}
                                    </span>
                                </div>

                                {/* Qualifications Info */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-[var(--bg-main)] p-2.5 rounded-lg border border-[var(--border-color)]">
                                        <p className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Expertise</p>
                                        <p className="text-xs font-semibold text-[var(--text-main)] truncate mt-0.5">{doctor.specialization?.join(', ') || "N/A"}</p>
                                    </div>
                                    <div className="bg-[var(--bg-main)] p-2.5 rounded-lg border border-[var(--border-color)]">
                                        <p className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Tenure</p>
                                        <p className="text-xs font-semibold text-[var(--text-main)] truncate mt-0.5">
                                            {doctor.startExperience ? `${new Date().getFullYear() - new Date(doctor.startExperience).getFullYear()} Years` : "N/A"}
                                        </p>
                                    </div>
                                </div>

                                {/* Submitted Documents List */}
                                <div className="space-y-1.5 pt-2 border-t border-[var(--border-color)]">
                                    <h4 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                        <FileText size={12} />
                                        Submitted Documents
                                    </h4>
                                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                        {Array.isArray(doctor.documents) && doctor.documents.map((doc, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg hover:border-blue-300 transition-colors">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <FileText size={14} className="text-[var(--text-muted)] shrink-0" />
                                                    <p className="text-xs text-[var(--text-main)] truncate font-semibold">{doc.type}</p>
                                                </div>
                                                <button onClick={() => setViewingDoc(doc)} className="text-[var(--text-muted)] hover:text-blue-500 p-1 transition-colors">
                                                    <Eye size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {(!doctor.documents || doctor.documents.length === 0) && (
                                            <div className="text-center py-4 bg-[var(--bg-main)] rounded-lg border border-dashed border-[var(--border-color)]">
                                                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">No Documents Uploaded</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="p-5 bg-[var(--bg-main)]/50 border-t border-[var(--border-color)] flex gap-2">
                                <button
                                    onClick={() => updateStatusMutation.mutate({ id: doctor._id, status: 'Active' })}
                                    className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                    <CheckCircle size={14} /> Approve
                                </button>
                                <button
                                    onClick={() => {
                                        setRejectingDoctor(doctor);
                                        setRejectReason("");
                                    }}
                                    className="h-9 px-4 border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl">
                    <ShieldCheck size={48} className="mx-auto text-[var(--text-muted)] mb-3" />
                    <h3 className="text-sm font-semibold text-[var(--text-main)]">Audit queue clear</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">All partner KYC applications have been reviewed.</p>
                </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-sm">
                    <p className="text-xs text-[var(--text-muted)]">
                        Page <span className="font-semibold text-[var(--text-main)]">{page}</span> of <span className="font-semibold text-[var(--text-main)]">{totalPages}</span>
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
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Document Viewer Modal ── */}
            {viewingDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewingDoc(null)} />
                    <div className="relative w-full max-w-5xl h-[85vh] bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <div>
                                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Credential Verification</p>
                                <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">{viewingDoc.type}</h3>
                            </div>
                            <button
                                onClick={() => setViewingDoc(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 bg-[var(--bg-main)]/50 p-6 overflow-auto flex items-center justify-center">
                            {viewingDoc.url.toLowerCase().endsWith('.pdf') ? (
                                <iframe src={viewingDoc.url} className="w-full h-full rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]" />
                            ) : (
                                <img src={viewingDoc.url} alt={viewingDoc.type} className="max-w-full max-h-full object-contain rounded-xl shadow-md" />
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-main)]">
                            <a
                                href={viewingDoc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                                <ExternalLink size={14} /> Open in New Tab
                            </a>
                            <button
                                onClick={() => setViewingDoc(null)}
                                className="h-9 px-4 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--border-color)] transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Rejection Modal ── */}
            {rejectingDoctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRejectingDoctor(null)} />
                    <div className="relative w-full max-w-lg bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <div>
                                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Credential Verification</p>
                                <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">Reject Application</h3>
                            </div>
                            <button
                                onClick={() => setRejectingDoctor(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div className="p-3 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Target Provider</p>
                                <p className="text-sm font-semibold text-[var(--text-main)] mt-0.5">{rejectingDoctor.name || "Provider"}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Rejection Reason</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Explain clearly what credentials or documents need to be re-uploaded..."
                                    className="w-full h-24 p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none font-semibold"
                                    required
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-main)]">
                            <button
                                onClick={() => setRejectingDoctor(null)}
                                className="h-9 px-4 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--border-color)] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitReject}
                                disabled={updateStatusMutation.isPending}
                                className="h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
                            >
                                {updateStatusMutation.isPending ? "Submitting..." : "Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
