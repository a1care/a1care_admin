import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ChevronDown, Check, Loader2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { PageBanner } from "@/components/ui/PageBanner";

interface HealthPackage {
    _id: string;
    name: string;
    description: string;
    price: number;
    originalPrice: number;
    imageUrl?: string;
    badge?: string;
    color: string;
    testsIncluded: string[];
    validityDays: number;
    allowedRoleIds?: string[];
    isActive: boolean;
    isFeatured: boolean;
    order: number;
    createdAt: string;
}

interface RoleOption {
    _id: string;
    name: string;
    title?: string;
}

const PRESET_COLORS = [
    { label: "Blue", value: "#2F80ED" },
    { label: "Purple", value: "#9B51E0" },
    { label: "Emerald", value: "#10B981" },
    { label: "Rose", value: "#F43F5E" },
    { label: "Amber", value: "#F59E0B" },
    { label: "Indigo", value: "#6366F1" },
    { label: "Cyan", value: "#06B6D4" },
    { label: "Pink", value: "#EC4899" },
];

const emptyForm = {
    name: "", description: "", price: "", originalPrice: "",
    badge: "", color: PRESET_COLORS[0].value, testsIncluded: "",
    validityDays: "30", order: "0"
};

export function HealthPackageFormPage() {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [form, setForm] = useState({ ...emptyForm });
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
    const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
    const servicesDropdownRef = useRef<HTMLDivElement | null>(null);
    const [initialized, setInitialized] = useState(false);

    // Click outside handler for dropdown
    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (!servicesDropdownRef.current) return;
            if (!servicesDropdownRef.current.contains(event.target as Node)) {
                setServicesDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    // Fetch existing package if in edit mode
    const { data: packages, isLoading: isFetchingPkg } = useQuery<HealthPackage[]>({
        queryKey: ["admin_health_packages"],
        queryFn: async () => {
            const res = await api.get("/health-packages/admin/all");
            return res.data?.data || [];
        },
        enabled: isEdit,
    });

    const existingPkg = isEdit ? packages?.find(p => p._id === id) : null;

    // Populate form when data arrives
    useEffect(() => {
        if (isEdit && existingPkg && !initialized) {
            setForm({
                name: existingPkg.name,
                description: existingPkg.description,
                price: String(existingPkg.price),
                originalPrice: String(existingPkg.originalPrice),
                badge: existingPkg.badge || "",
                color: existingPkg.color,
                testsIncluded: existingPkg.testsIncluded.join(", "),
                validityDays: String(existingPkg.validityDays),
                order: String(existingPkg.order),
            });
            setSelectedRoleIds(Array.isArray(existingPkg.allowedRoleIds) ? existingPkg.allowedRoleIds : []);
            setInitialized(true);
        }
    }, [isEdit, existingPkg, initialized]);

    const { data: roles, isLoading: isRolesLoading } = useQuery({
        queryKey: ["admin_services_for_packages"],
        queryFn: async () => {
            const res = await api.get("/roles/admin/roles");
            return res.data.data.filter((r: RoleOption) => r.name !== "patient" && r.name !== "super_admin");
        }
    });

    const field = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [key]: e.target.value }));

    const toggleRole = (roleId: string) => {
        setSelectedRoleIds((prev) => prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]);
    };

    const saveMutation = useMutation({
        mutationFn: (e: React.FormEvent) => {
            e.preventDefault();
            const data = {
                ...form,
                price: Number(form.price),
                originalPrice: Number(form.originalPrice),
                validityDays: Number(form.validityDays),
                order: Number(form.order),
                testsIncluded: form.testsIncluded.split(",").map(t => t.trim()).filter(Boolean),
                allowedRoleIds: selectedRoleIds
            };
            if (isEdit) {
                return api.put(`/health-packages/admin/update/${id}`, data);
            } else {
                return api.post("/health-packages/admin/create", data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_health_packages"] });
            if (isEdit) {
                queryClient.invalidateQueries({ queryKey: ["health_package_details", id] });
            }
            toast.success(isEdit ? "Package updated successfully" : "Package created successfully");
            navigate("/health-packages");
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to save package"),
    });

    if (isEdit && isFetchingPkg) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
                <Loader2 className="animate-spin mb-4 text-blue-500" size={32} />
                <p className="text-sm font-semibold">Loading Package Data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-1 w-full">
                    <button onClick={() => navigate("/health-packages")} className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1 hover:text-blue-500 transition-colors w-fit mb-1">
                        <ChevronLeft size={12} /> Back to Catalog
                    </button>
                    <PageBanner title={isEdit ? "Edit Health Package" : "Create Health Package"} subtitle={isEdit ? `Update details for ${existingPkg?.name}` : "Configure a new diagnostic bundle for users."} />
                </div>
            </div>

            <div className="w-full max-w-4xl bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                <div className="px-6 sm:px-8 py-5 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                    <h3 className="text-base font-bold text-[var(--text-main)]">Package Configuration</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Fill in all the required details to {isEdit ? "update" : "publish"} the package.</p>
                </div>

                <form onSubmit={saveMutation.mutate} className="p-6 sm:p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-[var(--text-main)]">Package Name <span className="text-red-500">*</span></label>
                        <input className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] outline-none focus:border-blue-500 transition-all font-medium" value={form.name} onChange={field("name")} placeholder="e.g. Comprehensive Full Body Checkup" required />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-[var(--text-main)]">Description <span className="text-red-500">*</span></label>
                        <textarea
                            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] px-4 py-3 rounded-xl text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-500 transition-all font-medium min-h-[100px] resize-y"
                            value={form.description} onChange={field("description") as any}
                            placeholder="Brief description shown in the app highlighting the benefits..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-[var(--text-main)]">Sale Price (₹) <span className="text-red-500">*</span></label>
                            <input type="number" className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] outline-none focus:border-blue-500 transition-all font-medium" value={form.price} onChange={field("price")} placeholder="999" required />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-[var(--text-main)]">Original Price (₹) <span className="text-red-500">*</span></label>
                            <input type="number" className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] outline-none focus:border-blue-500 transition-all font-medium" value={form.originalPrice} onChange={field("originalPrice")} placeholder="1499" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-[var(--text-main)]">Badge Label</label>
                            <input className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] outline-none focus:border-blue-500 transition-all font-medium" value={form.badge} onChange={field("badge")} placeholder="e.g. BEST VALUE, POPULAR" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-[var(--text-main)]">Validity (Days)</label>
                            <input type="number" className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] outline-none focus:border-blue-500 transition-all font-medium" value={form.validityDays} onChange={field("validityDays")} placeholder="30" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-[var(--text-main)]">Tests Included (comma-separated)</label>
                        <textarea
                            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] px-4 py-3 rounded-xl text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-500 transition-all font-medium min-h-[80px]"
                            value={form.testsIncluded} onChange={field("testsIncluded") as any}
                            placeholder="CBC, Blood Sugar Fasting, Lipid Profile, Thyroid, ECG..."
                        />
                        <p className="text-[11px] text-[var(--text-muted)]">Separate each test name with a comma.</p>
                    </div>

                    <div className="space-y-2 relative">
                        <label className="block text-xs font-semibold text-[var(--text-main)]">Applicable Services <span className="text-red-500">*</span></label>
                        <div ref={servicesDropdownRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setServicesDropdownOpen((v) => !v)}
                                className={`w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-medium text-left flex items-center justify-between ${servicesDropdownOpen ? "border-blue-500 ring-4 ring-blue-500/10" : ""}`}
                            >
                                <span className={selectedRoleIds.length ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}>
                                    {selectedRoleIds.length
                                        ? `${selectedRoleIds.length} service${selectedRoleIds.length > 1 ? "s" : ""} selected`
                                        : "Select target services..."}
                                </span>
                                <ChevronDown size={16} className={`text-[var(--text-muted)] transition-transform duration-250 ${servicesDropdownOpen ? "rotate-180" : ""}`} />
                            </button>
                            {servicesDropdownOpen && (
                                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl max-h-64 overflow-y-auto z-30 shadow-xl p-2 space-y-1 animate-in fade-in slide-in-from-top-2">
                                    {isRolesLoading ? (
                                        <div className="p-4 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                                            <Loader2 size={14} className="animate-spin" /> Loading services...
                                        </div>
                                    ) : (roles || []).map((role: RoleOption) => {
                                        const checked = selectedRoleIds.includes(role._id);
                                        return (
                                            <button
                                                key={role._id}
                                                type="button"
                                                onClick={() => toggleRole(role._id)}
                                                className={`w-full border-none text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors ${checked ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" : "text-[var(--text-main)] hover:bg-[var(--bg-main)]"}`}
                                            >
                                                <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-blue-600 border-blue-600 text-white" : "bg-transparent border-[var(--border-color)]"}`}>
                                                    {checked && <Check size={14} strokeWidth={3} />}
                                                </div>
                                                <span>{role.title || role.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="block text-xs font-semibold text-[var(--text-main)]">Card Visual Color</label>
                            <div className="flex gap-3 flex-wrap">
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c.value} type="button"
                                        onClick={() => setForm(f => ({ ...f, color: c.value }))}
                                        className="w-10 h-10 rounded-full border-4 transition-all cursor-pointer hover:scale-110 active:scale-95"
                                        style={{
                                            backgroundColor: c.value,
                                            borderColor: form.color === c.value ? "var(--text-main)" : "transparent",
                                            outlineOffset: '2px'
                                        }}
                                        title={c.label}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-[var(--text-main)]">Display Priority Order</label>
                            <input type="number" className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] outline-none focus:border-blue-500 transition-all font-medium" value={form.order} onChange={field("order")} placeholder="0" />
                        </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-[var(--border-color)] flex justify-end gap-3">
                        <button type="button" className="h-11 px-6 rounded-xl border border-[var(--border-color)] text-[var(--text-main)] font-semibold text-sm hover:bg-[var(--bg-main)] transition-colors" onClick={() => navigate("/health-packages")}>
                            Cancel
                        </button>
                        <button type="submit" className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2" disabled={saveMutation.isPending}>
                            {saveMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                            {isEdit ? "Update Package" : "Create Package"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
