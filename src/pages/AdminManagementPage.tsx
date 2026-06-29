import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Shield, Plus, Trash2, Eye, EyeOff, UserCog, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import type { AdminUser, AdminRole } from "@/types";

const ROLE_LABELS: Record<string, string> = {
    admin: "Admin",
    super_admin: "Super Admin",
};

export function AdminManagementPage() {
    const qc = useQueryClient();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<AdminRole>("admin");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { data: admins = [], isLoading, isError } = useQuery({
        queryKey: ["admin-users"],
        queryFn: async () => {
            const res = await api.get("/admin/users");
            return (res.data.data as any[]).map((item) => ({
                id: item.id ?? item._id,
                name: item.name,
                email: item.email,
                role: item.role,
                createdAt: item.createdAt,
            })) as (AdminUser & { createdAt?: string })[];
        },
    });

    const validate = () => {
        const e: Record<string, string> = {};
        if (!name.trim() || name.trim().length < 2) e.name = "Name must be at least 2 characters.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address.";
        if (password.length < 8) e.password = "Password must be at least 8 characters.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const createMutation = useMutation({
        mutationFn: async () => {
            await api.post("/admin/users", { name: name.trim(), email: email.trim().toLowerCase(), password, role });
        },
        onSuccess: () => {
            setName(""); setEmail(""); setPassword(""); setRole("admin"); setErrors({});
            qc.invalidateQueries({ queryKey: ["admin-users"] });
            toast.success("Admin account created.");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to create admin. Please try again.");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/admin/users/${id}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-users"] });
            toast.success("Admin account removed.");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to remove admin.");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) createMutation.mutate();
    };

    const handleDelete = (admin: AdminUser) => {
        toast.warning(`Remove ${admin.name}?`, {
            description: "This will permanently delete the admin account.",
            action: {
                label: "Delete",
                onClick: () => deleteMutation.mutate(admin.id ?? (admin as any)._id),
            },
        });
    };

    return (
        <div className="flex-col gap-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="brand-name" style={{ fontSize: "1.75rem" }}>Admin Management</h1>
                    <p className="text-xs muted font-bold uppercase tracking-wider mt-1">
                        Manage administrator accounts and roles
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                    <Shield size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                        {admins.length} Admins
                    </span>
                </div>
            </header>

            <div className="grid-2" style={{ gridTemplateColumns: "380px minmax(0,1fr)", gap: "24px" }}>
                {/* Create Admin Form */}
                <div className="card p-8 border-none bg-[var(--card-bg)]" style={{ borderRadius: "24px" }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                            <Plus size={18} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="font-black text-[var(--text-main)] text-sm uppercase tracking-wider">Create Admin</h2>
                            <p className="text-xs muted">Add a new administrator account</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-col gap-4">
                        <div className="flex-col gap-1.5">
                            <label className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Full Name *</label>
                            <div className="relative">
                                <User size={16} className="absolute text-[var(--text-muted)]" style={{ left: 14, top: "50%", transform: "translateY(-50%)" }} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="John Smith"
                                    autoComplete="name"
                                    className={`w-full bg-[var(--bg-main)] border rounded-xl px-4 py-3 text-sm ${errors.name ? "border-red-400" : "border-[var(--border-color)]"}`}
                                    style={{ paddingLeft: "40px" }}
                                />
                            </div>
                            {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
                        </div>

                        <div className="flex-col gap-1.5">
                            <label className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Email Address *</label>
                            <div className="relative">
                                <Mail size={16} className="absolute text-[var(--text-muted)]" style={{ left: 14, top: "50%", transform: "translateY(-50%)" }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="admin@a1care.com"
                                    autoComplete="email"
                                    className={`w-full bg-[var(--bg-main)] border rounded-xl px-4 py-3 text-sm ${errors.email ? "border-red-400" : "border-[var(--border-color)]"}`}
                                    style={{ paddingLeft: "40px" }}
                                />
                            </div>
                            {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email}</p>}
                        </div>

                        <div className="flex-col gap-1.5">
                            <label className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Password * (min 8 chars)</label>
                            <div className="relative">
                                <Lock size={16} className="absolute text-[var(--text-muted)]" style={{ left: 14, top: "50%", transform: "translateY(-50%)" }} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Min. 8 characters"
                                    autoComplete="new-password"
                                    className={`w-full bg-[var(--bg-main)] border rounded-xl px-4 py-3 text-sm ${errors.password ? "border-red-400" : "border-[var(--border-color)]"}`}
                                    style={{ paddingLeft: "40px", paddingRight: "44px" }}
                                />
                                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute text-[var(--text-muted)]" style={{ right: 14, top: "50%", transform: "translateY(-50%)" }}>
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password}</p>}
                        </div>

                        <div className="flex-col gap-1.5">
                            <label className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Role *</label>
                            <select
                                value={role}
                                onChange={e => setRole(e.target.value as AdminRole)}
                                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-main)]"
                            >
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="button primary w-full h-12 rounded-xl text-sm font-black uppercase tracking-widest mt-2 disabled:opacity-60"
                        >
                            {createMutation.isPending ? "Creating..." : "Create Admin"}
                        </button>
                    </form>
                </div>

                {/* Admin List */}
                <div className="card p-0 overflow-hidden border-none bg-[var(--card-bg)]" style={{ borderRadius: "24px" }}>
                    <div className="p-6 border-b border-[var(--border-color)] flex items-center gap-3">
                        <UserCog size={18} className="text-[var(--text-muted)]" />
                        <h2 className="font-black text-[var(--text-main)] text-sm uppercase tracking-wider">Current Administrators</h2>
                    </div>

                    {isLoading ? (
                        <div className="py-20 text-center">
                            <p className="text-xs muted font-bold uppercase tracking-widest">Loading administrators...</p>
                        </div>
                    ) : isError ? (
                        <div className="py-20 text-center">
                            <p className="text-sm font-bold text-red-500">Failed to load admins. Please refresh.</p>
                        </div>
                    ) : admins.length === 0 ? (
                        <div className="py-20 text-center flex-col items-center gap-3">
                            <Shield size={40} className="text-[var(--text-muted)] mx-auto" />
                            <p className="font-bold text-[var(--text-main)]">No admins found</p>
                            <p className="text-xs muted">Create the first admin account using the form.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="management-table">
                                <thead>
                                    <tr>
                                        <th style={{ paddingLeft: "24px" }}>ADMINISTRATOR</th>
                                        <th>ROLE</th>
                                        <th>JOINED</th>
                                        <th className="text-center">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admins.map(admin => (
                                        <tr key={admin.id}>
                                            <td style={{ paddingLeft: "24px" }}>
                                                <div className="font-bold text-[var(--text-main)]" style={{ fontSize: "0.9rem" }}>{admin.name}</div>
                                                <div className="text-xs muted mt-0.5 flex items-center gap-1">
                                                    <Mail size={10} /> {admin.email}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge text-xs ${admin.role === "super_admin" ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10" : "secondary"}`}>
                                                    {ROLE_LABELS[admin.role] ?? admin.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-xs muted font-medium">
                                                    {(admin as any).createdAt
                                                        ? new Date((admin as any).createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                                        : "—"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => handleDelete(admin)}
                                                        disabled={deleteMutation.isPending}
                                                        className="icon-button text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-40"
                                                        title="Remove admin"
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
            </div>
        </div>
    );
}
