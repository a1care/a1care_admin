import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useConfirm } from "@/context/ConfirmationContext";
import { TableSkeleton } from "@/components/ui/Skeletons";
import {
    Users, Search, Filter, Plus,
    ChevronLeft, ChevronRight,
    ShieldCheck, Phone, Clock,
    CheckCircle2, CheckCircle, FileText,
    ExternalLink, X, Loader2, UserPlus, Eye,
    XCircle, CreditCard as WalletIcon,
    ArrowUpCircle, ArrowDownCircle,
    CalendarClock, Stethoscope, Activity, BadgeCheck,
    Trash2, RefreshCw, AlertTriangle
} from "lucide-react";

interface Doctor {
    _id: string;
    name: string;
    mobileNumber: string;
    gender: string;
    startExperience: string;
    specialization: string[];
    status: "Pending" | "Active" | "Rejected";
    rejectionReason?: string;
    consultationFee: number;
    documents?: { type: string; url: string }[];
    profileImage?: string;
    imageUrl?: string;
}

export function DoctorStaffManagementPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const confirm = useConfirm();
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get("search") || "";

    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [statusFilter, setStatusFilter] = useState("All");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [slotDoctor, setSlotDoctor] = useState<Doctor | null>(null);
    const [weekDays, setWeekDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
    const [startingTime, setStartingTime] = useState("09:00");
    const [endingTime, setEndingTime] = useState("18:00");
    const [slotDuration, setSlotDuration] = useState("30");

    // Add Provider Form
    const [newName, setNewName] = useState("");
    const [newMobile, setNewMobile] = useState("");
    const [newEmail, setNewEmail] = useState("");

    const [reasonModal, setReasonModal] = useState<{
        isOpen: boolean;
        title: string;
        submitLabel: string;
        onSubmit: (reason: string) => void;
    } | null>(null);
    const [reasonInput, setReasonInput] = useState("");

    useEffect(() => {
        if (initialSearch) setSearchQuery(initialSearch);
    }, [initialSearch]);

    const normalizeDoctorsPayload = (payload: any) => {
        if (Array.isArray(payload)) {
            return { items: payload, total: payload.length, totalPages: 1, page: 1 };
        }
        return payload || { items: [], total: 0, totalPages: 1, page: 1 };
    };

    const { data: staffData, isLoading } = useQuery({
        queryKey: ["admin_staff", page, searchQuery, statusFilter],
        queryFn: async () => {
            const res = await api.get(`/admin/doctors?page=${page}&limit=10&search=${searchQuery}&status=${statusFilter}`);
            return normalizeDoctorsPayload(res.data.data);
        }
    });

    const staff = staffData?.items || [];
    useEffect(() => {
        if (staffData?.totalPages) setTotalPages(staffData.totalPages);
    }, [staffData]);

    const filteredStaff = staff;

    // Derived stats
    const totalDoctors = staffData?.total || 0;
    const activeDoctors = staff.filter((d: Doctor) => d.status === 'Active').length;
    const pendingDoctors = staff.filter((d: Doctor) => d.status === 'Pending').length;
    const rejectedDoctors = staff.filter((d: Doctor) => d.status === 'Rejected').length;

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, rejectionReason }: { id: string, status: string, rejectionReason?: string }) => {
            const res = await api.put(`/admin/users/doctor/${id}/status`, { status, rejectionReason });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_staff"] });
            toast.success("Provider credentials updated.");
            setSelectedDoctor(null);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Status synchronization failed.");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async ({ id, type }: { id: string, type: 'soft' | 'hard' | 'restore' }) => {
            if (type === 'soft') return await api.put(`/admin/doctors/${id}/soft-delete`);
            if (type === 'restore') return await api.put(`/admin/doctors/${id}/restore`);
            return await api.delete(`/admin/doctors/${id}/hard-delete`);
        },
        onSuccess: (res, vars) => {
            queryClient.invalidateQueries({ queryKey: ["admin_staff"] });
            if (vars.type === 'soft') toast.success("Provider archived (Soft Delete).");
            if (vars.type === 'restore') toast.success("Provider restored to active.");
            if (vars.type === 'hard') toast.success("Provider permanently deleted.");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Action failed.");
        }
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post("/admin/doctors", { name: newName, mobileNumber: newMobile, email: newEmail });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_staff"] });
            toast.success("Doctor successfully registered to network.");
            setIsAddModalOpen(false);
            setNewName(""); setNewMobile(""); setNewEmail("");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Registration failed.");
        }
    });

    const availabilityMutation = useMutation({
        mutationFn: async () => {
            if (!slotDoctor) return;
            const res = await api.post("/admin/slots", {
                doctorId: slotDoctor._id, weekDays, startingTime, endingTime,
                slotDuration: parseInt(slotDuration)
            });
            return res.data;
        },
        onSuccess: () => {
            toast.success("Availability slots populated.");
            setSlotDoctor(null);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Slot population failed.");
        }
    });

    const handleAddProvider = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate();
    };

    const toggleWeekDay = (day: number) => {
        setWeekDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort());
    };

    const openSlotModal = (doc: Doctor) => setSlotDoctor(doc);

    const statCards = [
        { label: "Total Doctors", value: totalDoctors, icon: Stethoscope, colorClass: "text-blue-600", bgClass: "bg-blue-50 dark:bg-blue-500/10" },
        { label: "Active", value: activeDoctors, icon: BadgeCheck, colorClass: "text-emerald-600", bgClass: "bg-emerald-50 dark:bg-emerald-500/10" },
        { label: "Pending Review", value: pendingDoctors, icon: Clock, colorClass: "text-amber-600", bgClass: "bg-amber-50 dark:bg-amber-500/10" },
        { label: "Rejected", value: rejectedDoctors, icon: XCircle, colorClass: "text-rose-600", bgClass: "bg-rose-50 dark:bg-rose-500/10" },
        { label: "Network Slots", value: totalDoctors, icon: Activity, colorClass: "text-violet-600", bgClass: "bg-violet-50 dark:bg-violet-500/10" },
    ];

    // ── Verification Detail Modal ──
    function VerificationModal({ doctor }: { doctor: Doctor }) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shrink-0 overflow-hidden">
                                {doctor.profileImage || doctor.imageUrl ? (
                                    <img src={doctor.profileImage || doctor.imageUrl} alt={doctor.name} className="w-full h-full object-cover" />
                                ) : doctor.name?.charAt(0) || "D"}
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Credential Audit</p>
                                <h3 className="text-base font-bold text-[var(--text-main)]">{doctor.name || "Provider Detail"}</h3>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedDoctor(null)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                                { icon: <Phone size={13} />, label: "Mobile", value: doctor.mobileNumber },
                                { icon: <Stethoscope size={13} />, label: "Specialization", value: doctor.specialization?.join(', ') || "General" },
                                { icon: <Clock size={13} />, label: "Experience", value: doctor.startExperience ? `${new Date().getFullYear() - new Date(doctor.startExperience).getFullYear()} Years` : "N/A" },
                                { icon: <WalletIcon size={13} />, label: "Consultation Fee", value: `₹${doctor.consultationFee || 0}` },
                                { icon: <Users size={13} />, label: "Gender", value: doctor.gender || "Not specified" },
                                { icon: <CheckCircle2 size={13} />, label: "Status", value: doctor.status, color: doctor.status === 'Active' ? '#10b981' : doctor.status === 'Pending' ? '#f59e0b' : '#ef4444' },
                            ].map(item => (
                                <div key={item.label} className="bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-color)]">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <span style={{ color: (item as any).color || '#1A7FD4' }}>{item.icon}</span>
                                        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{item.label}</p>
                                    </div>
                                    <p className="text-sm font-semibold text-[var(--text-main)] leading-tight truncate">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* KYC Documents */}
                        {doctor.documents && doctor.documents.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">KYC Documents</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {doctor.documents.map((doc, idx) => (
                                        <a
                                            key={idx}
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-3 bg-[var(--bg-main)] hover:bg-[var(--border-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold text-[var(--text-main)] transition-colors group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <FileText size={13} className="text-[var(--text-muted)]" />
                                                <span className="truncate">{doc.type || `Document #${idx + 1}`}</span>
                                            </div>
                                            <ExternalLink size={13} className="text-[var(--text-muted)] group-hover:text-blue-500 shrink-0 transition-colors" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <DoctorWalletSection doctor={doctor} />
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-main)]">
                        {doctor.status !== 'Active' ? (
                            <button
                                onClick={() => updateStatusMutation.mutate({ id: doctor._id, status: 'Active' })}
                                disabled={updateStatusMutation.isPending}
                                className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-60"
                            >
                                {updateStatusMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                Approve Provider
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setReasonInput("Violation of terms");
                                    setReasonModal({
                                        isOpen: true, title: "Restrict Access", submitLabel: "Restrict",
                                        onSubmit: (reason) => updateStatusMutation.mutate({ id: doctor._id, status: 'Rejected', rejectionReason: reason })
                                    });
                                }}
                                disabled={updateStatusMutation.isPending}
                                className="h-9 px-5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 text-rose-600 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all border border-rose-200 dark:border-rose-500/20"
                            >
                                <XCircle size={14} /> Restrict Access
                            </button>
                        )}
                        {doctor.status === 'Pending' && (
                            <button
                                onClick={() => {
                                    setReasonInput("");
                                    setReasonModal({
                                        isOpen: true, title: "Reject Provider", submitLabel: "Reject",
                                        onSubmit: (reason) => updateStatusMutation.mutate({ id: doctor._id, status: 'Rejected', rejectionReason: reason })
                                    });
                                }}
                                disabled={updateStatusMutation.isPending}
                                className="h-9 px-5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all border border-red-200 dark:border-red-500/20"
                            >
                                <XCircle size={14} /> Reject
                            </button>
                        )}
                        <button
                            onClick={() => setSelectedDoctor(null)}
                            className="h-9 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--border-color)] transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in">
            {selectedDoctor && <VerificationModal doctor={selectedDoctor} />}

            {/* ── Page Header ── */}
            <header className="flex items-center justify-between gap-4 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">Doctor Registry</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">Home • User Directory • Doctors</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="relative z-10 flex items-center gap-2 h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shrink-0"
                >
                    <UserPlus size={16} />
                    <span>Add Doctor</span>
                </button>
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-12 right-32 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            </header>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-5 gap-4">
                {statCards.map((stat) => (
                    <div key={stat.label} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-3 text-left hover:border-blue-400 hover:shadow-sm transition-all">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.bgClass} ${stat.colorClass}`}>
                            <stat.icon size={18} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-[var(--text-main)] tracking-tight">{stat.value}</p>
                            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-1">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main Table Card ── */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
                {/* Toolbar */}
                <div className="px-5 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex flex-row items-center justify-between gap-3">
                    {/* Search Input */}
                    <div style={{ position: "relative", width: "320px", flexShrink: 0 }}>
                        <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", zIndex: 10 }} />
                        <input
                            type="text"
                            placeholder="Search by TxnID, name, phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: "100%", height: 42, borderRadius: 12, paddingLeft: 38, paddingRight: 14,
                                background: "var(--card-bg)", border: "1.5px solid var(--border-color)",
                                fontSize: "0.875rem", color: "var(--text-main)", outline: "none",
                                fontFamily: "inherit", boxSizing: "border-box"
                            }}
                        />
                    </div>
                    
                    <select
                        value={statusFilter}
                        onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
                        className="h-[42px] px-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl text-sm font-semibold text-[var(--text-main)] outline-none"
                    >
                        <option value="All">All Providers</option>
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Archived">Archived (Trash)</option>
                    </select>

                    {/* Network badge */}
                    <div className="flex items-center gap-1.5 h-8 px-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100 dark:border-blue-500/20 whitespace-nowrap tracking-wider uppercase">
                        <Users size={12} />
                        <span>{staffData?.total || 0} Network Slots</span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                <th className="py-3 px-4 w-12">#</th>
                                <th className="py-3 px-4">Provider Identity</th>
                                <th className="py-3 px-4">Specialization</th>
                                <th className="py-3 px-4">Tenure</th>
                                <th className="py-3 px-4">Base Fee</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="p-0">
                                        <TableSkeleton columns={7} rows={5} showHeader={false} />
                                    </td>
                                </tr>
                            ) : Array.isArray(filteredStaff) && filteredStaff.length > 0 ? (
                                filteredStaff.map((doc: Doctor, index: number) => (
                                    <tr key={doc._id} className="hover:bg-[var(--bg-main)] transition-colors cursor-pointer group" onClick={() => setSelectedDoctor(doc)}>
                                        <td className="py-3.5 px-4 text-xs font-semibold text-[var(--text-muted)]">
                                            {((page - 1) * 50 + index + 1).toString().padStart(2, '0')}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 font-black text-xs shrink-0 overflow-hidden">
                                                    {doc.profileImage || doc.imageUrl ? (
                                                        <img src={doc.profileImage || doc.imageUrl} alt={doc.name} className="w-full h-full object-cover" />
                                                    ) : doc.name?.charAt(0) || "D"}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm text-[var(--text-main)]">{doc.name || "Unnamed"}</div>
                                                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                                                        <Phone size={10} className="text-blue-400" /> {doc.mobileNumber}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex flex-wrap gap-1">
                                                {doc.specialization?.slice(0, 2).map((s: string) => (
                                                    <span key={s} className="px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)]">{s}</span>
                                                ))}
                                                {doc.specialization?.length > 2 && (
                                                    <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">+{doc.specialization.length - 2}</span>
                                                )}
                                                {!doc.specialization?.length && (
                                                    <span className="text-[9px] font-semibold text-[var(--text-muted)] opacity-40">General</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-[var(--text-main)]">
                                                {doc.startExperience
                                                    ? `${new Date().getFullYear() - new Date(doc.startExperience).getFullYear()}y Clinical`
                                                    : "5y+ Clinical"}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-[var(--text-main)]">₹{doc.consultationFee || 0}</div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border
                                                ${doc.status === 'Active'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                                    : doc.status === 'Pending'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${doc.status === 'Active' ? 'bg-emerald-400' : doc.status === 'Pending' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                                                {doc.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1.5">
                                                {statusFilter === "Archived" ? (
                                                    <>
                                                        <button
                                                            onClick={async () => (await confirm({ title: "Restore Provider", message: "Restore this provider to the active directory?", confirmText: "Restore", type: "info" })) && deleteMutation.mutate({ id: doc._id, type: 'restore' })}
                                                            className="h-8 px-3 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 transition-all flex items-center gap-1"
                                                        >
                                                            <RefreshCw size={12} /> Restore
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (await confirm({ title: "Permanent Delete", message: "WARNING: PERMANENT DELETE.\n\nThis will completely erase the provider from the database. This action CANNOT be undone.\n\nNote: If this provider has any past bookings, this operation will be blocked by the system.\n\nAre you absolutely sure?", confirmText: "Delete Permanently", type: "danger" })) {
                                                                    deleteMutation.mutate({ id: doc._id, type: 'hard' });
                                                                }
                                                            }}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20 transition-all"
                                                            title="Permanent Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => setSelectedDoctor(doc)}
                                                            className="h-8 px-3 rounded-lg text-xs font-semibold border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-all"
                                                        >
                                                            {doc.status === 'Pending' ? 'Review' : 'View'}
                                                        </button>
                                                        <button
                                                            onClick={() => openSlotModal(doc)}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-[var(--border-color)] transition-all"
                                                            title="Manage Slots"
                                                        >
                                                            <CalendarClock size={14} />
                                                        </button>
                                                        <button
                                                            onClick={async () => (await confirm({ title: "Archive Provider", message: "Archive this provider? They will be removed from the active directory but their history will be preserved.", confirmText: "Archive", type: "warning" })) && deleteMutation.mutate({ id: doc._id, type: 'soft' })}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-[var(--border-color)] transition-all"
                                                            title="Archive (Soft Delete)"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-center text-[var(--text-muted)]">
                                                <Search size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--text-main)]">No doctors found</p>
                                                <p className="text-xs text-[var(--text-muted)] mt-0.5">Try adjusting your filters or search query.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-5 py-3.5 border-t border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-main)]">
                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-semibold">
                        <span className="px-2.5 py-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg">
                            Page <span className="text-[var(--text-main)] font-bold">{page}</span> / {totalPages}
                        </span>
                        <span className="px-2.5 py-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg">
                            Total: <span className="text-[var(--text-main)] font-bold">{staffData?.total || 0}</span>
                        </span>
                    </div>
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="w-8 h-8 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-blue-600 hover:border-blue-400 transition-all disabled:opacity-30"
                        >
                            <ChevronLeft size={15} />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="w-8 h-8 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-blue-600 hover:border-blue-400 transition-all disabled:opacity-30"
                        >
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Manage Slots Modal ── */}
            {slotDoctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSlotDoctor(null)} />
                    <div className="relative w-full max-w-lg bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <div>
                                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Availability Slots</p>
                                <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">{slotDoctor.name}</h3>
                            </div>
                            <button
                                onClick={() => setSlotDoctor(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Working Days</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => toggleWeekDay(d)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                                                ${weekDays.includes(d)
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--border-color)]'
                                                }`}
                                        >
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Start Time</label>
                                    <input type="time" value={startingTime} onChange={e => setStartingTime(e.target.value)}
                                        className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">End Time</label>
                                    <input type="time" value={endingTime} onChange={e => setEndingTime(e.target.value)}
                                        className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Slot Duration (Minutes)</label>
                                <input type="number" min="5" step="5" value={slotDuration} onChange={e => setSlotDuration(e.target.value)}
                                    className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-main)]">
                            <button
                                type="button"
                                onClick={() => setSlotDoctor(null)}
                                className="h-9 px-4 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--border-color)] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => availabilityMutation.mutate()}
                                disabled={availabilityMutation.isPending}
                                className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-60"
                            >
                                {availabilityMutation.isPending ? 'Saving...' : 'Save Slots'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add Doctor Modal ── */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                        <form onSubmit={handleAddProvider}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                                <div>
                                    <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Medical Network Registry</p>
                                    <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">Register New Doctor</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Full Name <span className="text-rose-500">*</span></label>
                                    <input
                                        className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                                        value={newName} onChange={e => setNewName(e.target.value)}
                                        placeholder="e.g. Dr. Sarah Jenkins" required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Phone Number <span className="text-rose-500">*</span></label>
                                    <input
                                        className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                                        value={newMobile} onChange={e => setNewMobile(e.target.value)}
                                        placeholder="e.g. 9876543210" required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                                        value={newEmail} onChange={e => setNewEmail(e.target.value)}
                                        placeholder="sarah.j@a1care.com"
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-main)]">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="h-9 px-4 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--border-color)] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                                >
                                    <Plus size={14} />
                                    {createMutation.isPending ? "Registering..." : "Register Doctor"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Rejection / Restriction Reason Modal ── */}
            {reasonModal?.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setReasonModal(null)} />
                    <div className="relative w-full max-w-md bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <h3 className="text-base font-bold text-[var(--text-main)]">{reasonModal.title}</h3>
                            <button
                                onClick={() => { setReasonModal(null); setReasonInput(""); }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Reason Details</label>
                                <textarea
                                    placeholder="Enter the reason here..."
                                    value={reasonInput}
                                    onChange={(e) => setReasonInput(e.target.value)}
                                    className="w-full h-24 p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-main)]">
                            <button
                                onClick={() => { setReasonModal(null); setReasonInput(""); }}
                                className="h-9 px-4 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--border-color)] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (!reasonInput.trim()) { toast.error("Reason is required."); return; }
                                    reasonModal.onSubmit(reasonInput.trim());
                                    setReasonModal(null);
                                    setReasonInput("");
                                }}
                                className="h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
                            >
                                {reasonModal.submitLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DoctorWalletSection({ doctor }: { doctor: Doctor }) {
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [isAdjusting, setIsAdjusting] = useState(false);

    const { data: wallet, isLoading } = useQuery({
        queryKey: ["user_wallet", doctor._id],
        queryFn: async () => {
            try {
                const res = await api.get(`/admin/users/doctor/${doctor._id}/wallet-balance`);
                return res.data.data;
            } catch (err: any) {
                if (err?.response?.status === 404) {
                    await api.post(`/admin/users/doctor/${doctor._id}/wallet-adjust`, {
                        amount: 0, description: "Auto-create wallet", type: "Credit"
                    });
                    const res = await api.get(`/admin/users/doctor/${doctor._id}/wallet-balance`);
                    return res.data.data;
                }
                throw err;
            }
        }
    });

    const adjustMutation = useMutation({
        mutationFn: async (type: 'Credit' | 'Debit') => {
            const res = await api.post(`/admin/users/doctor/${doctor._id}/wallet-adjust`, {
                amount: parseFloat(amount), description, type
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user_wallet", doctor._id] });
            toast.success("Wallet balance updated.");
            setAmount(""); setDescription(""); setIsAdjusting(false);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Adjustment failed.");
        }
    });

    return (
        <section className="space-y-4">
            <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Wallet Management</h3>
                <div className="p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">Wallet Balance</p>
                        <h4 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-1.5">
                            <WalletIcon size={16} className="text-blue-500" />
                            {isLoading ? "..." : `₹${wallet?.balance || 0}`}
                        </h4>
                    </div>

                    {!isAdjusting ? (
                        <button
                            onClick={() => setIsAdjusting(true)}
                            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shrink-0"
                        >
                            Adjust Balance
                        </button>
                    ) : (
                        <div className="w-full sm:w-[280px] space-y-2 p-3 bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)]">
                            <input
                                type="number" placeholder="Amount in ₹" value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full h-9 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 transition-all"
                            />
                            <input
                                placeholder="Reason (e.g., Adjustment)" value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full h-9 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 transition-all"
                            />
                            <div className="flex gap-1.5">
                                <button onClick={() => adjustMutation.mutate('Credit')} disabled={adjustMutation.isPending}
                                    className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-1 disabled:opacity-50 transition-colors">
                                    <ArrowUpCircle size={12} /> Credit
                                </button>
                                <button onClick={() => adjustMutation.mutate('Debit')} disabled={adjustMutation.isPending}
                                    className="flex-1 h-8 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-1 disabled:opacity-50 transition-colors">
                                    <ArrowDownCircle size={12} /> Debit
                                </button>
                                <button onClick={() => setIsAdjusting(false)}
                                    className="w-8 h-8 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center hover:bg-[var(--border-color)] transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction & Earnings History Table */}
            <div className="space-y-2">
                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Earning & Transaction History</p>
                <div className="border border-[var(--border-color)] rounded-xl overflow-hidden bg-[var(--card-bg)]">
                    <div className="max-h-[220px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                    <th className="py-2.5 px-3">Date</th>
                                    <th className="py-2.5 px-3">Description / Source</th>
                                    <th className="py-2.5 px-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {wallet?.transactions && wallet.transactions.length > 0 ? (
                                    [...wallet.transactions]
                                        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map((tx: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-[var(--bg-main)] transition-colors">
                                                <td className="py-2 px-3 text-[var(--text-muted)]">
                                                    {new Date(tx.date).toLocaleDateString("en-IN", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric"
                                                    })}
                                                </td>
                                                <td className="py-2 px-3 font-medium text-[var(--text-main)]">
                                                    {tx.description || "Consultation Fee / Adjustment"}
                                                </td>
                                                <td className={`py-2 px-3 text-right font-bold ${tx.type === "Credit" ? "text-emerald-600" : "text-rose-600"}`}>
                                                    {tx.type === "Credit" ? "+" : "-"}₹{tx.amount}
                                                </td>
                                            </tr>
                                        ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="py-6 text-center text-[var(--text-muted)] opacity-60">
                                            No transaction records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}

const CreditCard = WalletIcon;
