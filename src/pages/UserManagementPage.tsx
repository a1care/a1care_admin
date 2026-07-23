import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
    Users, Search, Plus,
    ChevronLeft, ChevronRight, Phone, Mail,
    ShieldCheck, CheckCircle2, Clock,
    BarChart3, UserCheck, UserPlus, Users2,
    X, Trash2, Eye,
    FileText, CreditCard, Filter
} from "lucide-react";

interface CategoryStats {
    total: number;
    active: number;
    inactive: number;
    today: number;
    week: number;
    month: number;
}

export function UserManagementPage({ category }: { category: string }) {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewingDocument, setViewingDocument] = useState<any | null>(null);
    const [deleteConfig, setDeleteConfig] = useState<{ id: string, type: 'patient' | 'doctor' | 'nurse' | 'ambulance' | 'rental' } | null>(null);

    const confirmGenericDelete = () => {
        if (!deleteConfig) return;
        const { id, type } = deleteConfig;
        api.delete(`/admin/users/${type}/${id}`).then(() => {
            queryClient.invalidateQueries({ queryKey: ["category_users"] });
            queryClient.invalidateQueries({ queryKey: ["category_stats"] });
            setSelectedUser(null);
            setDeleteConfig(null);
            toast.success("Member record deleted.");
        }).catch((err: any) => {
            toast.error(err?.response?.data?.message || "Failed to delete record.");
        });
    };

    // Add User Form State
    const [newName, setNewName] = useState("");
    const [newMobile, setNewMobile] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newSpecialization, setNewSpecialization] = useState("");

    const isAnyModalOpen = !!selectedUser || isAddModalOpen || !!viewingDocument;

    useEffect(() => {
        if (!isAnyModalOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isAnyModalOpen]);

    const { data: categories } = useQuery({
        queryKey: ["admin_categories_list"],
        queryFn: async () => {
            const res = await api.get("/services");
            return res.data.data as any[];
        }
    });

    const { data: stats } = useQuery({
        queryKey: ["category_stats", category],
        queryFn: async () => {
            const res = await api.get(`/admin/user-stats/${category}`);
            return res.data.data as CategoryStats;
        }
    });

    const { data: usersData, isLoading } = useQuery({
        queryKey: ["category_users", category, page, searchTerm, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(page), limit: "50", status: statusFilter });
            if (searchTerm) params.set("search", searchTerm);
            const res = await api.get(`/admin/user-list/${category}?${params}`);
            const payload = res.data?.data;

            // Support both response shapes:
            // 1) { items, total, totalPages, page }
            // 2) [] (plain array)
            if (Array.isArray(payload)) {
                return {
                    items: payload,
                    total: payload.length,
                    totalPages: 1,
                    page: 1,
                };
            }

            return payload;
        }
    });

    const users = usersData?.items || [];
    useEffect(() => {
        if (usersData?.totalPages) {
            setTotalPages(usersData.totalPages);
        }
    }, [usersData]);

    const statusMutation = useMutation({
        mutationFn: async ({ id, status, isRegistered }: { id: string, status?: string, isRegistered?: boolean }) => {
            const res = await api.put(`/admin/users/${category}/${id}/status`, { status, isRegistered });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["category_users", category] });
            queryClient.invalidateQueries({ queryKey: ["category_stats", category] });
            if (selectedUser) {
                queryClient.invalidateQueries({ queryKey: ["user_details", category, selectedUser._id] });
            }
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post(`/admin/users/${category}/create`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["category_users", category] });
            queryClient.invalidateQueries({ queryKey: ["category_stats", category] });
            setIsAddModalOpen(false);
            setNewName("");
            setNewMobile("");
            setNewEmail("");
            toast.success(`${category} record created successfully.`);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || `Failed to create ${category}.`);
        }
    });

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newMobile) return toast.error("Required fields missing.");
        if (!/^\d{10}$/.test(newMobile.replace(/\D/g, ''))) return toast.error("Enter a valid 10-digit phone number.");
        if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return toast.error("Enter a valid email address.");
        createMutation.mutate({
            name: newName,
            mobileNumber: newMobile,
            email: newEmail,
            specialization: newSpecialization ? [newSpecialization] : []
        });
    };

    const filteredUsers = users;

    useEffect(() => {
        setPage(1);
    }, [searchTerm, statusFilter, category]);

    const getRawTitle = () => {
        if (category === 'patient') return "Patients";
        if (category === 'doctor') return "Doctors";
        if (category === 'nurse') return "Nurses";
        if (category === 'ambulance') return "Ambulances";
        if (category === 'rental') return "Medical Rentals";
        if (category === 'lab') return "Diagnostic Labs";
        if (category === 'service') return "Extra Services";
        return category;
    };

    const title = getRawTitle();

    const statCards = [
        { label: "Total Registered", value: stats?.total || 0, icon: Users2, colorClass: "text-blue-600", bgClass: "bg-blue-50 dark:bg-blue-500/10", filter: "All" },
        { label: "Active", value: stats?.active || 0, icon: UserCheck, colorClass: "text-emerald-600", bgClass: "bg-emerald-50 dark:bg-emerald-500/10", filter: category === 'patient' ? "Verified" : "Active" },
        { label: "Inactive", value: stats?.inactive || 0, icon: Clock, colorClass: "text-slate-500", bgClass: "bg-slate-50 dark:bg-slate-500/10", filter: category === 'patient' ? "Pending" : "Inactive" },
        { label: "This Week", value: stats?.week || 0, icon: BarChart3, colorClass: "text-violet-600", bgClass: "bg-violet-50 dark:bg-violet-500/10", filter: "All" },
        { label: "This Month", value: stats?.month || 0, icon: CheckCircle2, colorClass: "text-pink-600", bgClass: "bg-pink-50 dark:bg-pink-500/10", filter: "All" },
    ];

    return (
        <div className="space-y-6 animate-in">
            {/* ── Page Header ── */}
            <header className="flex items-center justify-between gap-4 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">{title} Registry</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">Home • User Directory • {title}</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="relative z-10 flex items-center gap-2 h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shrink-0"
                >
                    <UserPlus size={16} />
                    <span>Add {title.slice(0, -1)}</span>
                </button>
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-12 right-32 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            </header>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-5 gap-4">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        onClick={() => { if (stat.filter) { setStatusFilter(stat.filter); setPage(1); } }}
                        className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-3 text-left cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all"
                    >
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
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "100%", height: 42, borderRadius: 12, paddingLeft: 38, paddingRight: 14,
                                background: "var(--card-bg)", border: "1.5px solid var(--border-color)",
                                fontSize: "0.875rem", color: "var(--text-main)", outline: "none",
                                fontFamily: "inherit", boxSizing: "border-box"
                            }}
                        />
                    </div>

                    {/* Status Segment Pills */}
                    <div className="flex items-center gap-1.5 p-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg">
                        {(category === 'patient'
                            ? [{ label: "All", value: "All" }, { label: "Verified", value: "Verified" }, { label: "Pending", value: "Pending" }]
                            : [{ label: "All", value: "All" }, { label: "Active", value: "Active" }, { label: "Pending", value: "Pending" }, { label: "Inactive", value: "Inactive" }]
                        ).map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => { setStatusFilter(opt.value); setPage(1); }}
                                className={`h-7 px-3 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                                    statusFilter === opt.value
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)]"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                <th className="py-3 px-4 w-12">#</th>
                                <th className="py-3 px-4">Member Name</th>
                                <th className="py-3 px-4">Contact Info</th>
                                {category !== 'patient' && <th className="py-3 px-4">Specialization</th>}
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Reg. Date</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Syncing Registry...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : Array.isArray(filteredUsers) && filteredUsers.length > 0 ? (
                                filteredUsers.map((user: any, index: number) => (
                                    <tr
                                        key={user._id}
                                        onClick={() => setSelectedUser(user)}
                                        className="hover:bg-[var(--bg-main)] transition-colors cursor-pointer group"
                                    >
                                        <td className="py-3.5 px-4 text-xs font-semibold text-[var(--text-muted)]">
                                            {((page - 1) * 50 + index + 1).toString().padStart(2, '0')}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 font-black text-xs shrink-0 overflow-hidden">
                                                    {user.profileImage ? (
                                                        <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        user.name?.charAt(0) || "U"
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm text-[var(--text-main)]">{user.name || "Anonymous Member"}</div>
                                                    <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">#{user._id.slice(-8).toUpperCase()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="space-y-1">
                                                <div className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                                                    <Phone size={11} className="text-blue-500" /> {user.mobileNumber}
                                                </div>
                                                {user.email && (
                                                    <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5">
                                                        <Mail size={10} className="opacity-50" /> {user.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        {category !== 'patient' && (
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {(user.specialization || []).slice(0, 2).map((s: string) => (
                                                        <span key={s} className="px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)]">{s}</span>
                                                    ))}
                                                    {(user.specialization || []).length > 2 && (
                                                        <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">+{user.specialization.length - 2}</span>
                                                    )}
                                                    {!(user.specialization || []).length && (
                                                        <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)] opacity-40">—</span>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        <td className="py-3.5 px-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border
                                                ${(category === 'patient' ? user.isRegistered : user.status === 'Active')
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                                    : user.status === 'Pending'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${(category === 'patient' ? user.isRegistered : user.status === 'Active') ? 'bg-emerald-500' : user.status === 'Pending' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                                {category === 'patient' ? (user.isRegistered ? 'Verified' : 'Pending') : user.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
                                            {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {(category !== 'patient' && user.status === 'Pending') && (
                                                    <button
                                                        className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white inline-flex items-center justify-center transition-colors border border-emerald-200 dark:border-emerald-500/20"
                                                        onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ id: user._id, status: 'Active', isRegistered: true }); }}
                                                        title="Approve Member"
                                                    >
                                                        <ShieldCheck size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    className="w-8 h-8 rounded-lg bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 inline-flex items-center justify-center transition-colors border border-[var(--border-color)]"
                                                    title="View Profile"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={category === 'patient' ? 6 : 7} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-center text-[var(--text-muted)]">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--text-main)]">No members found</p>
                                                <p className="text-xs text-[var(--text-muted)] mt-0.5">No records match your current filters.</p>
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
                            Total: <span className="text-[var(--text-main)] font-bold">{usersData?.total || 0}</span>
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

            {/* ── User Detail Modal ── */}
            {selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
                    <div
                        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl flex flex-col animate-in zoom-in-95 duration-150"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shrink-0 overflow-hidden">
                                    {selectedUser.profileImage ? (
                                        <img src={selectedUser.profileImage} alt={selectedUser.name} className="w-full h-full object-cover" />
                                    ) : (
                                        selectedUser.name?.charAt(0) || "U"
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-bold text-base text-[var(--text-main)]">{selectedUser.name || "Member Profile"}</h2>
                                    <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">ID: {selectedUser._id}</p>
                                </div>
                            </div>
                            <button
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-main)] border border-[var(--border-color)] transition-all"
                                onClick={() => setSelectedUser(null)}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Personal Details */}
                            <section>
                                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Personal Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                                    {[
                                        { label: "Mobile Number", value: selectedUser.mobileNumber },
                                        { label: "Email Address", value: selectedUser.email || "No Email" },
                                        { label: "Gender", value: selectedUser.gender || "Unspecified" },
                                        { label: "Verification Status", value: category === 'patient' ? (selectedUser.isRegistered ? "Verified" : "Unverified") : selectedUser.status }
                                    ].map(item => (
                                        <div key={item.label}>
                                            <dt className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{item.label}</dt>
                                            <dd className="mt-1 text-sm text-[var(--text-main)] font-semibold break-words">{item.value}</dd>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <WalletSection user={selectedUser} category={category} />

                            {/* KYC Documents */}
                            <section>
                                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">KYC Documents</h3>
                                <div className="space-y-2">
                                    {(selectedUser.documents || []).length > 0 ? (
                                        Array.isArray(selectedUser.documents) && selectedUser.documents.map((doc: any, i: number) => (
                                            <div key={i} className="p-3 bg-[var(--bg-main)] rounded-lg flex items-center justify-between border border-[var(--border-color)]">
                                                <span className="text-xs font-semibold text-[var(--text-main)] uppercase">{doc.type}</span>
                                                <button
                                                    className="text-[10px] font-semibold text-blue-600 hover:underline uppercase"
                                                    onClick={() => setViewingDocument(doc)}
                                                >
                                                    View
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-[var(--text-muted)] font-semibold bg-[var(--bg-main)] p-3 rounded-lg border border-[var(--border-color)]">No documents uploaded.</p>
                                    )}
                                </div>
                            </section>

                            {/* Account Management */}
                            <section>
                                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-rose-500 mb-3">Account Management</h3>
                                <button
                                    className="w-full h-10 rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider border border-rose-200 dark:border-rose-500/20 transition-all flex items-center justify-center gap-2"
                                    onClick={() => setDeleteConfig({ id: selectedUser._id, type: category as any })}
                                >
                                    <Trash2 size={13} />
                                    Delete Account
                                </button>
                            </section>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add User Modal ── */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}>
                    <div
                        className="relative w-full max-w-lg bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <div>
                                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">User Directory</p>
                                <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">Add New {title.slice(0, -1)}</h3>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form className="p-6 space-y-4" onSubmit={handleAddUser}>
                            <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Full Name <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="e.g. John Doe"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Mobile Number <span className="text-rose-500">*</span></label>
                                <input
                                    type="tel"
                                    className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                                    value={newMobile}
                                    onChange={e => setNewMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="10-digit mobile number"
                                    maxLength={10}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                    placeholder="john@example.com"
                                />
                            </div>
                            {category === 'service' && (
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Service Specialization <span className="text-rose-500">*</span></label>
                                    <select
                                        className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 transition-all font-semibold cursor-pointer"
                                        value={newSpecialization}
                                        onChange={e => setNewSpecialization(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Service...</option>
                                        {categories?.filter(c => c.type === 'service').map(c => (
                                            <option key={c._id} value={c.name.replace(/SELECT|ASSIGN/g, "").trim()}>{c.name.replace(/SELECT|ASSIGN/g, "").trim()}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="pt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 h-9 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--bg-main)] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                                >
                                    <Plus size={13} />
                                    {createMutation.isPending ? "Saving..." : "Create Record"}
                                </button>
                            </div>
                        </form>
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
        </div>
    );
}

function WalletSection({ user, category }: { user: any, category: string }) {
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
        <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Wallet Management</h3>
            <div className="p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Available Balance</p>
                    <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-blue-500" />
                        <h4 className="text-2xl font-black text-[var(--text-main)]">
                            {isLoading ? "---" : `₹${wallet?.balance || 0}`}
                        </h4>
                    </div>
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
                            type="number"
                            placeholder="Enter amount..."
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full h-9 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-500 transition-all font-semibold"
                        />
                        <input
                            placeholder="Memo (e.g. Bonus, Refund)..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full h-9 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-500 transition-all font-semibold"
                        />
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => adjustMutation.mutate('Credit')}
                                disabled={adjustMutation.isPending}
                                className="flex-1 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 transition-colors"
                            >Credit (+)</button>
                            <button
                                onClick={() => adjustMutation.mutate('Debit')}
                                disabled={adjustMutation.isPending}
                                className="flex-1 h-8 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 transition-colors"
                            >Debit (-)</button>
                            <button
                                onClick={() => setIsAdjusting(false)}
                                className="w-8 h-8 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
