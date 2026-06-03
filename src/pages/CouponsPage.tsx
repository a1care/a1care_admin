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
    IndianRupee,
    Search,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";

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
            // Supports both the paginated shape ({ items, total, ... }) and a raw array.
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
        if (window.confirm(`Delete coupon "${c.code}"? This cannot be undone.`)) {
            deleteMutation.mutate(c._id);
        }
    };

    const filtered = coupons.filter((c) =>
        c.code?.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
    );

    const num = (v: string) => (v === "" ? 0 : Number(v));

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                            <Ticket size={20} />
                        </span>
                        Coupons
                    </h1>
                    <p className="text-sm text-slate-400 mt-1 ml-13">Create and manage discount coupons for bookings.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl transition-all shadow-lg shadow-blue-600/20"
                >
                    <Plus size={18} /> New Coupon
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-5 max-w-md">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by code or description…"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
            </div>

            {/* Table */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400">
                        <Loader2 className="animate-spin mr-2" size={20} /> Loading coupons…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Ticket size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-400 font-semibold">No coupons found</p>
                        <button onClick={openCreate} className="text-blue-600 text-sm font-bold mt-2 hover:underline">
                            Create your first coupon
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--border-color)] text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="px-5 py-4">Code</th>
                                    <th className="px-5 py-4">Discount</th>
                                    <th className="px-5 py-4">Min / Cap</th>
                                    <th className="px-5 py-4">Usage</th>
                                    <th className="px-5 py-4">Applies To</th>
                                    <th className="px-5 py-4">Validity</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c) => (
                                    <tr key={c._id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-blue-500/5 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-black text-[var(--text-main)] tracking-wide">{c.code}</div>
                                            {c.description && <div className="text-xs text-slate-400 mt-0.5 max-w-[180px] truncate">{c.description}</div>}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1 font-bold text-[var(--text-main)]">
                                                {c.discountType === "PERCENTAGE" ? <Percent size={13} className="text-emerald-500" /> : <IndianRupee size={13} className="text-emerald-500" />}
                                                {c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `₹${c.discountValue}`}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-slate-500 text-xs">
                                            <div>Min ₹{c.minOrderAmount || 0}</div>
                                            {c.discountType === "PERCENTAGE" && c.maxDiscountAmount ? <div>Cap ₹{c.maxDiscountAmount}</div> : null}
                                        </td>
                                        <td className="px-5 py-4 text-slate-500 text-xs">
                                            <div>{c.usedCount || 0}{c.usageLimit ? ` / ${c.usageLimit}` : " used"}</div>
                                            <div className="text-[10px] text-slate-400">{c.usagePerUser || 1}/user</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-500/10 text-slate-500">
                                                {c.applicableTo || "ALL"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-slate-500 text-xs">
                                            {c.validTo ? `Till ${new Date(c.validTo).toLocaleDateString()}` : "No expiry"}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${c.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-500"}`}>
                                                {c.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex gap-1.5 justify-end">
                                                <button
                                                    onClick={() => openEdit(c)}
                                                    className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c)}
                                                    className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
                    <div
                        className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-color)] sticky top-0 bg-[var(--card-bg)] z-10">
                            <h2 className="text-lg font-black text-[var(--text-main)]">{editingId ? "Edit Coupon" : "New Coupon"}</h2>
                            <button onClick={closeModal} className="w-9 h-9 rounded-xl hover:bg-slate-500/10 flex items-center justify-center text-slate-400">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Coupon Code *">
                                    <input
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        placeholder="WELCOME50"
                                        className="input-base uppercase font-black tracking-wide"
                                    />
                                </Field>
                                <Field label="Applicable To">
                                    <select
                                        value={form.applicableTo}
                                        onChange={(e) => setForm({ ...form, applicableTo: e.target.value as CouponForm["applicableTo"] })}
                                        className="input-base"
                                    >
                                        <option value="ALL">All Bookings</option>
                                        <option value="SERVICE">Service Only</option>
                                        <option value="DOCTOR">Doctor Only</option>
                                    </select>
                                </Field>
                            </div>

                            <Field label="Description">
                                <input
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="50% off on your first booking"
                                    className="input-base"
                                />
                            </Field>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Discount Type">
                                    <select
                                        value={form.discountType}
                                        onChange={(e) => setForm({ ...form, discountType: e.target.value as CouponForm["discountType"] })}
                                        className="input-base"
                                    >
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        <option value="FLAT">Flat (₹)</option>
                                    </select>
                                </Field>
                                <Field label={form.discountType === "PERCENTAGE" ? "Discount %" : "Discount ₹"}>
                                    <input
                                        type="number"
                                        value={form.discountValue}
                                        onChange={(e) => setForm({ ...form, discountValue: num(e.target.value) })}
                                        className="input-base"
                                    />
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Min Order Amount (₹)">
                                    <input
                                        type="number"
                                        value={form.minOrderAmount}
                                        onChange={(e) => setForm({ ...form, minOrderAmount: num(e.target.value) })}
                                        className="input-base"
                                    />
                                </Field>
                                <Field label="Max Discount Cap (₹) — 0 = no cap">
                                    <input
                                        type="number"
                                        value={form.maxDiscountAmount}
                                        onChange={(e) => setForm({ ...form, maxDiscountAmount: num(e.target.value) })}
                                        disabled={form.discountType === "FLAT"}
                                        className="input-base disabled:opacity-40"
                                    />
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Total Usage Limit — 0 = unlimited">
                                    <input
                                        type="number"
                                        value={form.usageLimit}
                                        onChange={(e) => setForm({ ...form, usageLimit: num(e.target.value) })}
                                        className="input-base"
                                    />
                                </Field>
                                <Field label="Usage Per User">
                                    <input
                                        type="number"
                                        value={form.usagePerUser}
                                        onChange={(e) => setForm({ ...form, usagePerUser: num(e.target.value) })}
                                        className="input-base"
                                    />
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Valid From">
                                    <input
                                        type="date"
                                        value={form.validFrom}
                                        onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                                        className="input-base"
                                    />
                                </Field>
                                <Field label="Valid To">
                                    <input
                                        type="date"
                                        value={form.validTo}
                                        onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                                        className="input-base"
                                    />
                                </Field>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                    className="w-5 h-5 rounded accent-blue-600"
                                />
                                <span className="text-sm font-semibold text-[var(--text-main)]">Active (available to customers)</span>
                            </label>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-3 rounded-2xl border border-[var(--border-color)] text-[var(--text-main)] font-bold hover:bg-slate-500/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saveMutation.isPending}
                                    className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                                >
                                    {saveMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                                    {editingId ? "Save Changes" : "Create Coupon"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .input-base {
                    width: 100%;
                    padding: 0.7rem 0.9rem;
                    border-radius: 0.9rem;
                    background: var(--input-bg, rgba(120,120,120,0.05));
                    border: 1px solid var(--border-color);
                    color: var(--text-main);
                    font-size: 0.875rem;
                    outline: none;
                }
                .input-base:focus { box-shadow: 0 0 0 2px rgba(59,130,246,0.4); }
            `}</style>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">{label}</label>
            {children}
        </div>
    );
}

export default CouponsPage;
