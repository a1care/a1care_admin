import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
    ChevronLeft, Phone, Mail,
    Users2, Calendar, FileText,
    Trash2, Eye, X, CreditCard, ShieldOff, ShieldCheck, Loader2
} from "lucide-react";
import { PageBanner } from "@/components/ui/PageBanner";

export function UserDetailsPage({ category }: { category: string }) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const [viewingDocument, setViewingDocument] = useState<any | null>(null);
    const [deleteConfig, setDeleteConfig] = useState<{ id: string, type: string } | null>(null);
    const [suspendConfirm, setSuspendConfirm] = useState(false);

    const { data: user, isLoading } = useQuery({
        queryKey: ["user_details", category, id],
        queryFn: async () => {
            const res = await api.get(`/admin/users/${category}/${id}`);
            return res.data.data;
        }
    });

    const confirmGenericDelete = () => {
        if (!deleteConfig) return;
        const { id: deleteId, type } = deleteConfig;
        api.delete(`/admin/users/${type}/${deleteId}`).then(() => {
            queryClient.invalidateQueries({ queryKey: ["category_users"] });
            queryClient.invalidateQueries({ queryKey: ["category_stats"] });
            setDeleteConfig(null);
            toast.success("Member record deleted.");
            navigate(-1);
        }).catch((err: any) => {
            toast.error(err?.response?.data?.message || "Failed to delete record.");
        });
    };

    const suspendMutation = useMutation({
        mutationFn: (newStatus: "Suspended" | "Active") =>
            api.put(`/admin/users/${category}/${id}/status`, { status: newStatus }),
        onSuccess: () => {
            setSuspendConfirm(false);
            queryClient.invalidateQueries({ queryKey: ["user_details", category, id] });
            toast.success("Account status updated.");
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || "Action failed"),
    });

    if (isLoading || !user) {
        return (
            <div className="space-y-6 animate-in">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors shadow-sm">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="h-10 w-48 bg-[var(--card-bg)] rounded-lg animate-pulse border border-[var(--border-color)]"></div>
                </div>
                <div className="h-[400px] bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
            </div>
        );
    }

    const initials = user.name ? user.name.charAt(0).toUpperCase() : "U";
    const statusLabel = category === 'patient' ? (user.isRegistered ? "Verified" : "Pending") : user.status;
    const isStatusGood = statusLabel === "Verified" || statusLabel === "Active";

    return (
        <div className="space-y-6 animate-in pb-10">
            {/* Header Navigation */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-blue-600 hover:border-blue-400 transition-all shadow-sm"
                >
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-black text-[var(--text-main)] tracking-tight">Member Profile</h1>
                    <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">Detailed view for {user.name || "Member"}</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="w-full bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden flex flex-col">
                {/* Hero Header */}
                <div className="relative h-32 sm:h-40 bg-gradient-to-r from-emerald-500 to-teal-600 shrink-0">
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>

                <div className="px-6 sm:px-8 pb-8 pt-0 relative flex-1 flex flex-col">
                    {/* Profile Overlap Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-16 mb-8 relative z-10 w-full">
                        <div className="flex items-end justify-start gap-5 w-full sm:w-auto text-left">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-[var(--card-bg)] p-1.5 shadow-xl shrink-0">
                                <div className="w-full h-full rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center overflow-hidden border border-[var(--border-color)]">
                                    {user.profileImage ? (
                                        <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400">{initials}</span>
                                    )}
                                </div>
                            </div>
                            <div className="pb-1 sm:pb-3 flex-1 text-left">
                                <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] tracking-tight">{user.name || "Anonymous Member"}</h2>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-main)] px-2 py-0.5 rounded-md border border-[var(--border-color)]">
                                        ID: {user._id}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border
                                        ${isStatusGood
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                            : statusLabel === 'Pending'
                                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${isStatusGood ? 'bg-emerald-500' : statusLabel === 'Pending' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                        {statusLabel}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="shrink-0 mt-4 sm:mt-0 flex flex-col gap-2 items-end">
                            <WalletAction user={user} category={category} />
                            {/* Suspend / Activate — partners only */}
                            {category !== 'patient' && (
                                user.status === "Suspended" ? (
                                    <button
                                        onClick={() => suspendMutation.mutate("Active")}
                                        disabled={suspendMutation.isPending}
                                        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 transition-all disabled:opacity-50"
                                    >
                                        {suspendMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                                        Restore Account
                                    </button>
                                ) : suspendConfirm ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-[var(--text-muted)]">Suspend account?</span>
                                        <button
                                            onClick={() => suspendMutation.mutate("Suspended")}
                                            disabled={suspendMutation.isPending}
                                            className="h-7 px-3 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-all disabled:opacity-50"
                                        >
                                            {suspendMutation.isPending ? "..." : "Confirm"}
                                        </button>
                                        <button onClick={() => setSuspendConfirm(false)} className="h-7 px-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)]">Cancel</button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setSuspendConfirm(true)}
                                        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-bold hover:bg-orange-100 transition-all"
                                    >
                                        <ShieldOff size={13} /> Suspend Account
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Profile Details Grid */}
                        <section>
                            <h3 className="text-sm font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
                                <Users2 size={16} className="text-blue-500" />
                                Member Identity
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                                        <Phone size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Mobile Number</p>
                                        <p className="text-sm font-semibold text-[var(--text-main)] mt-0.5">{user.mobileNumber}</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                                        <Mail size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Email Address</p>
                                        <p className="text-sm font-semibold text-[var(--text-main)] mt-0.5">{user.email || "Not Provided"}</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 shrink-0">
                                        <Users2 size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Gender</p>
                                        <p className="text-sm font-semibold text-[var(--text-main)] mt-0.5 capitalize">{user.gender || "Unspecified"}</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                                        <Calendar size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Registration Date</p>
                                        <p className="text-sm font-semibold text-[var(--text-main)] mt-0.5">
                                            {new Date(user.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                {user.specialization && (
                                    <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
                                            <Users2 size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Specialization</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {(Array.isArray(user.specialization) ? user.specialization : [user.specialization]).map((s: string) => (
                                                    <span key={s} className="px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--border-color)]">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {user.startExperience && (
                                    <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                                            <Calendar size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Experience</p>
                                            <p className="text-sm font-semibold text-[var(--text-main)] mt-0.5">
                                                {new Date().getFullYear() - new Date(user.startExperience).getFullYear()} Years Clinical
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {user.consultationFee !== undefined && (
                                    <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                                            <Users2 size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Base Fee</p>
                                            <p className="text-sm font-semibold text-[var(--text-main)] mt-0.5">₹{user.consultationFee}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        <hr className="border-[var(--border-color)]" />



                        {/* Documents Section */}
                        <section>
                            <h3 className="text-sm font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
                                <FileText size={16} className="text-orange-500" />
                                KYC & Documents
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(user.documents || []).length > 0 ? (
                                    Array.isArray(user.documents) && user.documents.map((doc: any, i: number) => (
                                        <div key={i} className="p-3 bg-[var(--bg-main)] rounded-xl flex items-center justify-between border border-[var(--border-color)] group hover:border-orange-300 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600">
                                                    <FileText size={14} />
                                                </div>
                                                <span className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wide">{doc.type}</span>
                                            </div>
                                            <button
                                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-blue-600 hover:border-blue-400 transition-all shadow-sm"
                                                onClick={() => setViewingDocument(doc)}
                                                title="View Document"
                                            >
                                                <Eye size={14} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full p-6 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] border-dashed text-center">
                                        <div className="w-10 h-10 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] mx-auto mb-2">
                                            <FileText size={16} />
                                        </div>
                                        <p className="text-xs font-bold text-[var(--text-main)]">No Documents Available</p>
                                        <p className="text-[10px] font-semibold text-[var(--text-muted)] mt-1">This member has not uploaded any KYC documents.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <hr className="border-[var(--border-color)]" />

                        {/* Danger Zone */}
                        <section>
                            <div className="p-5 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                                            <Trash2 size={16} />
                                            Danger Zone
                                        </h3>
                                        <p className="text-xs font-semibold text-rose-600/70 dark:text-rose-400/70 mt-1">
                                            Permanently delete this account and all associated data.
                                        </p>
                                    </div>
                                    <button
                                        className="h-10 px-5 rounded-lg bg-white dark:bg-slate-800 text-rose-600 text-xs font-bold uppercase tracking-wider border border-rose-200 hover:bg-rose-600 hover:text-white transition-all shadow-sm shrink-0"
                                        onClick={() => setDeleteConfig({ id: user._id, type: category })}
                                    >
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* ── Document Viewer Modal ── */}
            {viewingDocument && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setViewingDocument(null)}>
                    <div
                        className="relative w-full max-w-3xl max-h-[90vh] bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <h2 className="font-bold text-base text-[var(--text-main)]">{viewingDocument.type}</h2>
                            <button
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all"
                                onClick={() => setViewingDocument(null)}
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center bg-[var(--bg-main)]">
                            {viewingDocument.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                <img src={viewingDocument.url} className="w-full h-auto rounded-xl" alt="Preview" />
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl flex items-center justify-center mx-auto text-[var(--text-muted)]">
                                        <FileText size={28} />
                                    </div>
                                    <p className="text-sm font-semibold text-[var(--text-main)]">Document File</p>
                                    <a
                                        href={viewingDocument.url}
                                        target="_blank"
                                        className="inline-flex items-center gap-2 h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                                    >
                                        <Eye size={14} /> Open Document
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ── */}
            {deleteConfig && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="relative w-full max-w-md bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
                        <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Account Management</p>
                            <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">Delete Member Record?</h3>
                        </div>
                        <div className="p-6 text-center space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center mx-auto text-rose-600">
                                <Trash2 size={20} />
                            </div>
                            <p className="text-sm text-[var(--text-muted)] font-semibold">This will permanently delete this member record. This action cannot be undone.</p>
                        </div>
                        <div className="px-6 py-4 border-t border-[var(--border-color)] flex gap-2 bg-[var(--bg-main)]">
                            <button
                                className="flex-1 h-9 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--bg-main)] transition-all"
                                onClick={() => setDeleteConfig(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                                onClick={confirmGenericDelete}
                            >
                                Delete Record
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function WalletAction({ user, category }: { user: any, category: string }) {
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [isAdjusting, setIsAdjusting] = useState(false);

    const { data: wallet, isLoading } = useQuery({
        queryKey: ["user_wallet", user._id],
        queryFn: async () => {
            const res = await api.get(`/admin/users/${category}/${user._id}/wallet-balance`);
            return res.data.data;
        }
    });

    const adjustMutation = useMutation({
        mutationFn: async (type: 'Credit' | 'Debit') => {
            const res = await api.post(`/admin/users/${category}/${user._id}/wallet-adjust`, {
                amount: parseFloat(amount),
                description,
                type
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user_wallet", user._id] });
            toast.success("Wallet balance updated.");
            setAmount("");
            setDescription("");
            setIsAdjusting(false);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Wallet update failed.");
        }
    });

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-[var(--card-bg)] p-3 rounded-2xl shadow-xl border border-[var(--border-color)]">
            <div className="flex flex-col items-center sm:items-end px-3">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Wallet Balance</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {isLoading ? "---" : `₹${wallet?.balance || 0}`}
                </span>
            </div>
            <button
                onClick={() => setIsAdjusting(true)}
                className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 w-full sm:w-auto flex items-center gap-2"
            >
                <CreditCard size={14} />
                Manage Wallet
            </button>

            {/* Wallet Adjustment Modal */}
            {isAdjusting && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsAdjusting(false)}>
                    <div 
                        className="relative w-full max-w-md bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-left"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <div>
                                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Wallet Operations</p>
                                <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">Adjust Member Balance</h3>
                            </div>
                            <button
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all"
                                onClick={() => setIsAdjusting(false)}
                            >
                                <X size={16} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Amount (₹)</label>
                                <input
                                    type="number"
                                    placeholder="Enter amount..."
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-emerald-500 transition-all font-semibold"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Memo / Reason</label>
                                <input
                                    placeholder="e.g. Refund, Bonus..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-emerald-500 transition-all font-semibold"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-[var(--bg-main)] border-t border-[var(--border-color)] flex gap-3">
                            <button
                                onClick={() => adjustMutation.mutate('Debit')}
                                disabled={adjustMutation.isPending || !amount}
                                className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-colors"
                            >
                                Debit (-)
                            </button>
                            <button
                                onClick={() => adjustMutation.mutate('Credit')}
                                disabled={adjustMutation.isPending || !amount}
                                className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-colors"
                            >
                                Credit (+)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
