import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    Plus,
    Trash2,
    Edit2,
    X,
    Ticket,
    Percent,
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/Skeletons";

interface Coupon {
    _id: string;
    code: string;
    description?: string;
    discountType: "PERCENTAGE" | "FLAT";
    discountValue: number;
    maxDiscountAmount?: number;
    minOrderAmount?: number;
    usageLimit?: number;
    usagePerUser?: number;
    usedCount?: number;
    validFrom?: string;
    validTo?: string;
    isActive?: boolean;
    applicableTo?: "ALL" | "SERVICE" | "DOCTOR";
    createdAt?: string;
}

type CouponForm = {
    code: string;
    description: string;
    discountType: "PERCENTAGE" | "FLAT";
    discountValue: number;
    maxDiscountAmount: number;
    minOrderAmount: number;
    usageLimit: number;
    usagePerUser: number;
    validFrom: string;
    validTo: string;
    isActive: boolean;
    applicableTo: "ALL" | "SERVICE" | "DOCTOR";
};

const emptyForm: CouponForm = {
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: 0,
    maxDiscountAmount: 0,
    minOrderAmount: 0,
    usageLimit: 0,
    usagePerUser: 1,
    validFrom: "",
    validTo: "",
    isActive: true,
    applicableTo: "ALL",
};

const toDateInput = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

export function CouponsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CouponForm>(emptyForm);

    const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
        queryKey: ["admin-coupons"],
        queryFn: async () => {
            const res = await api.get("/admin/coupons", { params: { limit: 200 } });
            const data = res.data?.data ?? res.data;
            return Array.isArray(data) ? data : (data?.items ?? []);
        },
    });

    const saveMutation = useMutation({
        mutationFn: async (payload: CouponForm) => {
            const body: any = {
                ...payload,
                code: payload.code.trim().toUpperCase(),
                validFrom: payload.validFrom || undefined,
                validTo: payload.validTo || undefined,
            };
            if (editingId) return api.put(`/admin/coupons/${editingId}`, body);
            return api.post("/admin/coupons", body);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
            toast.success(editingId ? "Coupon updated" : "Coupon created");
            closeModal();
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to save coupon");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/admin/coupons/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
            toast.success("Coupon deleted");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to delete coupon");
        },
    });

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setModalOpen(true);
    };

    const openEdit = (c: Coupon) => {
        setEditingId(c._id);
        setForm({
            code: c.code || "",
            description: c.description || "",
            discountType: c.discountType || "PERCENTAGE",
            discountValue: c.discountValue || 0,
            maxDiscountAmount: c.maxDiscountAmount || 0,
            minOrderAmount: c.minOrderAmount || 0,
            usageLimit: c.usageLimit || 0,
            usagePerUser: c.usagePerUser || 1,
            validFrom: toDateInput(c.validFrom),
            validTo: toDateInput(c.validTo),
            isActive: c.isActive ?? true,
            applicableTo: c.applicableTo || "ALL",
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingId(null);
        setForm(emptyForm);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.code.trim()) return toast.error("Coupon code is required");
        if (form.discountValue <= 0) return toast.error("Discount value must be greater than 0");
        saveMutation.mutate(form);
    };

    const handleDelete = (c: Coupon) => {
        if (window.confirm(`Delete coupon "${c.code}"?`)) {
            deleteMutation.mutate(c._id);
        }
    };

    const filtered = coupons.filter((c) =>
        c.code?.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
    );

    const num = (v: string) => (v === "" ? 0 : Number(v));

    return (
        <div className="space-y-6 animate-in">
            {/* ── Page Header ── */}
            <header className="flex flex-col gap-2 bg-gradient-to-br from-[var(--primary)] to-emerald-800 p-6 md:p-8 rounded-2xl shadow-lg shadow-emerald-900/10 border-0 relative overflow-hidden text-left items-start min-h-[160px]">
                {/* Decorative Blobs */}
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 w-full">
                    <div className="flex items-center justify-between gap-4 w-full">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1">Coupons</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                <p className="text-xs md:text-sm font-medium text-emerald-50 tracking-wide opacity-90">
                                    Home • Campaigns • Coupons
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={openCreate}
                                className="flex items-center gap-1.5 h-10 px-5 bg-white text-emerald-700 hover:bg-emerald-50 text-sm font-semibold rounded-xl transition-all shadow-lg"
                            >
                                <Plus size={16} />
                                <span>New Coupon</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Search Toolbar ── */}
            <div style={{ position: "relative", width: "320px", flexShrink: 0 }}>
                <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", zIndex: 10 }} />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by TxnID, name, phone..."
                    style={{
                        width: "100%", height: 42, borderRadius: 12, paddingLeft: 38, paddingRight: 14,
                        background: "var(--card-bg)", border: "1.5px solid var(--border-color)",
                        fontSize: "0.875rem", color: "var(--text-main)", outline: "none",
                        fontFamily: "inherit", boxSizing: "border-box"
                    }}
                />
            </div>

            {/* ── Coupons Table Card ── */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider w-12">#</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Coupon Code</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Discount</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Min Order / Cap</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Usage Info</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Applies To</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Validity</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="p-0">
                                        <TableSkeleton columns={9} rows={5} showHeader={false} />
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-center mx-auto text-[var(--text-muted)]">
                                                <Ticket size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--text-main)]">No active coupons found</p>
                                                <button onClick={openCreate} className="text-xs text-blue-500 font-semibold mt-1 hover:underline">
                                                    Initialize your first coupon template
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((c, index) => (
                                    <tr key={c._id} className="hover:bg-[var(--bg-main)] transition-colors group">
                                        <td className="py-3.5 px-4 text-xs font-medium text-[var(--text-muted)]">
                                            {String(index + 1).padStart(2, '0')}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-semibold text-sm text-[var(--text-main)] tracking-wide">{c.code}</div>
                                            {c.description && <div className="text-xs text-[var(--text-muted)] mt-0.5 truncate max-w-[200px]" title={c.description}>{c.description}</div>}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-[var(--text-main)]">
                                                {c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `₹${c.discountValue}`}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-[var(--text-main)]">
                                            <div>Min: ₹{c.minOrderAmount || 0}</div>
                                            {c.discountType === "PERCENTAGE" && c.maxDiscountAmount ? <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Cap: ₹{c.maxDiscountAmount}</div> : null}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-[var(--text-main)]">
                                            <div>Used: {c.usedCount || 0}{c.usageLimit ? ` / ${c.usageLimit}` : " / ∞"}</div>
                                            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">User Limit: {c.usagePerUser || 1}</div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 dark:bg-slate-850 dark:text-slate-400 border border-[var(--border-color)]">
                                                {c.applicableTo || "ALL"}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
                                            {c.validTo ? `Expires ${new Date(c.validTo).toLocaleDateString()}` : "No Expiry"}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border
                                                ${c.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400"}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? "bg-emerald-400" : "bg-rose-400"}`} />
                                                {c.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => openEdit(c)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 border border-[var(--border-color)] hover:border-blue-300 transition-all"
                                                    title="Configure Coupon"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 border border-[var(--border-color)] hover:border-red-300 transition-all"
                                                    title="Delete Coupon"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Create / Edit Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative w-full max-w-lg bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <div>
                                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Campaign Registry</p>
                                <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">
                                    {editingId ? "Modify Coupon Profile" : "Initialize New Coupon"}
                                </h3>
                            </div>
                            <button
                                onClick={closeModal}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Coupon Code *</label>
                                        <input
                                            value={form.code}
                                            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                            placeholder="e.g. SAVE50"
                                            className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold uppercase"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Applicable To</label>
                                        <select
                                            value={form.applicableTo}
                                            onChange={(e) => setForm({ ...form, applicableTo: e.target.value as CouponForm["applicableTo"] })}
                                            className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                                        >
                                            <option value="ALL">All Bookings</option>
                                            <option value="SERVICE">Service Only</option>
                                            <option value="DOCTOR">Doctor Only</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Description</label>
                                    <input
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="e.g. Save flat ₹50 on doctor consult bookings"
                                        className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Discount Type</label>
                                        <select
                                            value={form.discountType}
                                            onChange={(e) => setForm({ ...form, discountType: e.target.value as CouponForm["discountType"] })}
                                            className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                                        >
                                            <option value="PERCENTAGE">Percentage (%)</option>
                                            <option value="FLAT">Flat Rate (₹)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                            {form.discountType === "PERCENTAGE" ? "Discount %" : "Discount Value (₹)"}
                                        </label>
                                        <input
                                            type="number"
                                            value={form.discountValue || ""}
                                            onChange={(e) => setForm({ ...form, discountValue: num(e.target.value) })}
                                            className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Min Order (₹)</label>
                                        <input
                                            type="number"
                                            value={form.minOrderAmount || ""}
                                            onChange={(e) => setForm({ ...form, minOrderAmount: num(e.target.value) })}
                                            className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Discount Cap (₹)</label>
                                        <input
                                            type="number"
                                            value={form.maxDiscountAmount || ""}
                                            onChange={(e) => setForm({ ...form, maxDiscountAmount: num(e.target.value) })}
                                            disabled={form.discountType === "FLAT"}
                                            className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold disabled:opacity-40"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total Usage Limit</label>
                                        <input
                                            type="number"
                                            value={form.usageLimit || ""}
                                            onChange={(e) => setForm({ ...form, usageLimit: num(e.target.value) })}
                                            className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                                            placeholder="0 = Unlimited"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Usage Limit Per User</label>
                                        <input
                                            type="number"
                                            value={form.usagePerUser || ""}
                                            onChange={(e) => setForm({ ...form, usagePerUser: num(e.target.value) })}
                                            className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Valid From</label>
                                        <input
                                            type="date"
                                            value={form.validFrom}
                                            onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                                            className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Valid To</label>
                                        <input
                                            type="date"
                                            value={form.validTo}
                                            onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                                            className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={form.isActive}
                                            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                        />
                                        <span className="text-xs font-semibold text-[var(--text-main)]">Enable coupon template for immediate use</span>
                                    </label>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-main)]">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="h-9 px-4 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--border-color)] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saveMutation.isPending}
                                    className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                    {saveMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                                    {editingId ? "Save Changes" : "Create Coupon"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CouponsPage;
