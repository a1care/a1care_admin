import { PageBanner } from "@/components/ui/PageBanner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { Search, FileText, Eye, CheckCircle, XCircle, Loader2, ShieldCheck, Phone, X, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/Skeletons";
interface Doctor {
  _id: string;
  name: string;
  mobileNumber: string;
  gender: string;
  startExperience: string;
  specialization: string[];
  status: "Pending" | "Active" | "Rejected";
  consultationFee: number;
  documents?: {
    type: string;
    url: string;
  }[];
}
export default function KYCVerificationPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{
    type: string;
    url: string;
  } | null>(null);
  const [viewingDocsListFor, setViewingDocsListFor] = useState<Doctor | null>(null);
  const [rejectingDoctor, setRejectingDoctor] = useState<Doctor | null>(null);
  const [approvingDoctor, setApprovingDoctor] = useState<Doctor | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const {
    data: kycData,
    isLoading,
    isFetching
  } = useQuery({
    queryKey: ["admin_staff_kyc", page, searchQuery],
    queryFn: async () => {
      const res = await api.get(`/admin/doctors?page=${page}&limit=10&search=${searchQuery}&status=Pending`);
      return res.data.data;
    }
  });
  const staff: Doctor[] = kycData?.items || [];
  const totalPages: number = kycData?.totalPages || 1;
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      rejectionReason
    }: {
      id: string;
      status: string;
      rejectionReason?: string;
    }) => {
      return api.put(`/admin/users/doctor/${id}/status`, {
        status,
        isRegistered: status === 'Active',
        rejectionReason
      });
    },
    onSuccess: () => {
      toast.success("Provider status updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["admin_staff_kyc"]
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-dashboard-overview"]
      });
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
  return <div className="space-y-6 animate-in">
            {/* ── Page Header ── */}
            <PageBanner title="Identity Verification" subtitle="Review and approve partner KYC documentation.">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl shrink-0">
                    <ShieldCheck className="text-amber-300" size={16} />
                    <div>
                        <p className="text-[10px] font-semibold text-white uppercase tracking-wider">Pending Verification</p>
                        <p className="text-sm font-bold text-amber-300 mt-0.5 leading-none">{staff?.filter(s => s.status === 'Pending').length || 0}</p>
                    </div>
                </div>
            </PageBanner>

            {/* ── Search Toolbar ── */}
            <div style={{
      position: "relative",
      width: "320px",
      flexShrink: 0
    }}>
                {isFetching ? <Loader2 size={15} style={{
        position: "absolute",
        left: 13,
        top: "50%",
        transform: "translateY(-50%)",
        color: "#3b82f6",
        animation: "spin 1s linear infinite",
        zIndex: 10
      }} /> : <Search size={15} style={{
        position: "absolute",
        left: 13,
        top: "50%",
        transform: "translateY(-50%)",
        color: "var(--text-muted)",
        pointerEvents: "none",
        zIndex: 10
      }} />}
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

            {/* ── Data Table ── */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider w-10">#</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Provider</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Role & Expertise</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Experience</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Documents</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {isLoading ? <tr>
                                    <td colSpan={7} className="p-0">
                                        <TableSkeleton columns={7} rows={5} showHeader={false} />
                                    </td>
                                </tr> : staff.length > 0 ? staff.map((doctor, index) => <tr key={doctor._id} className="hover:bg-[var(--bg-main)] transition-colors group">
                                        <td className="py-3.5 px-4 text-xs font-medium text-[var(--text-muted)]">
                                            {String((page - 1) * 10 + index + 1).padStart(2, '0')}
                                        </td>
                                        
                                        {/* Provider Identity */}
                                        <td className="py-3.5 px-4">
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
                                        </td>

                                        {/* Expertise */}
                                        <td className="py-3.5 px-4">
                                            <p className="text-xs font-semibold text-[var(--text-main)] truncate max-w-[150px]">
                                                {doctor.specialization && doctor.specialization.length > 0 ? doctor.specialization.join(', ') : (doctor as any).role?.name ? String((doctor as any).role.name).charAt(0).toUpperCase() + String((doctor as any).role.name).slice(1) : (doctor as any).roleId?.name ? String((doctor as any).roleId.name).charAt(0).toUpperCase() + String((doctor as any).roleId.name).slice(1) : "N/A"}
                                            </p>
                                        </td>

                                        {/* Experience */}
                                        <td className="py-3.5 px-4">
                                            <p className="text-xs font-semibold text-[var(--text-muted)]">
                                                {doctor.startExperience ? new Date().getFullYear() - new Date(doctor.startExperience).getFullYear() === 0 ? "< 1 Year" : `${new Date().getFullYear() - new Date(doctor.startExperience).getFullYear()} Years` : "N/A"}
                                            </p>
                                        </td>

                                        {/* Documents */}
                                        <td className="py-3.5 px-4">
                                            {doctor.documents && doctor.documents.length > 0 ? <button onClick={() => setViewingDocsListFor(doctor)} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 rounded-md text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                                                    <FileText size={13} />
                                                    View Docs ({doctor.documents.length})
                                                </button> : <span className="text-xs text-[var(--text-muted)] italic">None</span>}
                                        </td>

                                        {/* Status */}
                                        <td className="py-3.5 px-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                                ${doctor.status === 'Pending' ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400" : "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400"}`}>
                                                {doctor.status}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                  onClick={() => setApprovingDoctor(doctor)}
                                                  disabled={updateStatusMutation.isPending}
                                                  title="Approve"
                                                  className="w-8 h-8 flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors border border-emerald-200 dark:border-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                                    <CheckCircle size={16} />
                                                </button>
                                                <button onClick={() => {
                    setRejectingDoctor(doctor);
                    setRejectReason("");
                  }} title="Reject" className="w-8 h-8 flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-colors border border-rose-200 dark:border-rose-500/20">
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>) : <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <ShieldCheck size={48} className="mx-auto text-[var(--text-muted)] mb-3" />
                                        <h3 className="text-sm font-semibold text-[var(--text-main)]">Audit queue clear</h3>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">All partner KYC applications have been reviewed.</p>
                                    </td>
                                </tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && <div className="flex items-center justify-between px-4 py-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-sm">
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

            {/* ── Document Viewer Modal ── */}
            {viewingDoc && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewingDoc(null)} />
                    <div className="relative w-full max-w-5xl h-[85vh] bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <div>
                                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Credential Verification</p>
                                <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">{viewingDoc.type}</h3>
                            </div>
                            <button onClick={() => setViewingDoc(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 bg-[var(--bg-main)]/50 p-6 overflow-auto flex items-center justify-center">
                            {viewingDoc.url.toLowerCase().endsWith('.pdf') ? <iframe src={viewingDoc.url} className="w-full h-full rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]" /> : <img src={viewingDoc.url} alt={viewingDoc.type} className="max-w-full max-h-full object-contain rounded-xl shadow-md" />}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-main)]">
                            <a href={viewingDoc.url} target="_blank" rel="noopener noreferrer" className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm">
                                <ExternalLink size={14} /> Open in New Tab
                            </a>
                            <button onClick={() => setViewingDoc(null)} className="h-9 px-4 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--border-color)] transition-all">
                                Close
                            </button>
                        </div>
                    </div>
                </div>}

            {/* ── Document List Modal ── */}
            {viewingDocsListFor && <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewingDocsListFor(null)} />
                    <div className="relative w-full max-w-md bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <div>
                                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">KYC Documents</p>
                                <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">{viewingDocsListFor.name}</h3>
                            </div>
                            <button onClick={() => setViewingDocsListFor(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-6 space-y-2 max-h-[60vh] overflow-y-auto">
                            {viewingDocsListFor.documents?.map((doc, idx) => <div key={idx} className="flex items-center justify-between p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl hover:border-blue-300 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                                            <FileText size={16} />
                                        </div>
                                        <p className="text-sm text-[var(--text-main)] truncate font-semibold">{doc.type}</p>
                                    </div>
                                    <button onClick={() => setViewingDoc(doc)} className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm">
                                        <Eye size={12} /> View
                                    </button>
                                </div>)}
                            {(!viewingDocsListFor.documents || viewingDocsListFor.documents.length === 0) && <div className="text-center py-8">
                                    <p className="text-sm font-medium text-[var(--text-muted)]">No documents uploaded.</p>
                                </div>}
                        </div>
                    </div>
                </div>}

            {/* ── Approve Confirmation Modal ── */}
            {approvingDoctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setApprovingDoctor(null)} />
                    <div className="relative w-full max-w-sm bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                        <div className="px-6 py-5 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <h3 className="text-base font-bold text-[var(--text-main)]">Approve KYC</h3>
                            <p className="text-xs text-[var(--text-muted)] mt-1">This will activate the partner account and allow them to receive bookings.</p>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-sm text-[var(--text-main)] font-semibold">{approvingDoctor.name}</p>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">{approvingDoctor.mobileNumber}</p>
                        </div>
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={() => { updateStatusMutation.mutate({ id: approvingDoctor._id, status: 'Active' }); setApprovingDoctor(null); }}
                                disabled={updateStatusMutation.isPending}
                                className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                {updateStatusMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />} Approve & Activate
                            </button>
                            <button onClick={() => setApprovingDoctor(null)} className="h-9 px-4 border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] rounded-xl hover:bg-[var(--bg-main)] transition-all">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Rejection Modal ── */}
            {rejectingDoctor && <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRejectingDoctor(null)} />
                    <div className="relative w-full max-w-lg bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <div>
                                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Credential Verification</p>
                                <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">Reject Application</h3>
                            </div>
                            <button onClick={() => setRejectingDoctor(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all">
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
                                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain clearly what credentials or documents need to be re-uploaded..." className="w-full h-24 p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none font-semibold" required />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-main)]">
                            <button onClick={() => setRejectingDoctor(null)} className="h-9 px-4 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--border-color)] transition-all">
                                Cancel
                            </button>
                            <button onClick={submitReject} disabled={updateStatusMutation.isPending} className="h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all">
                                {updateStatusMutation.isPending ? "Submitting..." : "Reject"}
                            </button>
                        </div>
                    </div>
                </div>}
        </div>;
}