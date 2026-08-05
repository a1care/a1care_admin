import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, resolveAssetUrl } from "@/lib/api";
import {
    Plus,
    Trash2,
    Tag,
    X,
    Search,
    ChevronLeft,
    Star,
    LayoutGrid,
    CheckCircle2,
    Image,
    UploadCloud,
    Stethoscope,
    Syringe,
    FlaskConical,
    Ambulance,
    Edit2,
    Bell,
    History
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

interface ChildService {
    _id: string;
    name: string;
    serviceId: string;
    subServiceId: string;
    price: number;
    isFeatured: boolean;
    isActive: boolean;
    rating: number;
    completed: number;
    fulfillmentMode?: "HOME_VISIT" | "HOSPITAL_VISIT" | "VIRTUAL";
    description?: string;
    imageUrl?: string;
}

interface SubService {
    _id: string;
    name: string;
    serviceId: string;
}

export function ServiceChildServicesPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialSubId = searchParams.get("subServiceId") || "";
    const categoryId = searchParams.get("categoryId") || "";

    const [selectedSubId, setSelectedSubId] = useState(initialSubId);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [desc, setDesc] = useState("");
    const [fulfillment, setFulfillment] = useState("HOME_VISIT");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<ChildService | null>(null);

    const { data: categories } = useQuery({
        queryKey: ["admin_categories"],
        queryFn: async () => {
            const res = await api.get("/services");
            return res.data.data as any[];
        }
    });

    const [activeCatId, setActiveCatId] = useState(categoryId || "");

    const { data: subServices } = useQuery({
        queryKey: ["admin_subservices", activeCatId],
        queryFn: async () => {
            if (!activeCatId) return [];
            const res = await api.get(`/subservice/${activeCatId}`);
            return res.data.data as SubService[];
        },
        enabled: !!activeCatId
    });

    const { data: childServices, isLoading } = useQuery({
        queryKey: ["admin_childservices", selectedSubId],
        queryFn: async () => {
            if (!selectedSubId) return [];
            const res = await api.get(`/childService/${selectedSubId}`);
            return res.data.data as ChildService[];
        },
        enabled: !!selectedSubId
    });

    const submitMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            if (editingItem) {
                const res = await api.put(`/childService/${editingItem._id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                return res.data;
            } else {
                if (!selectedSubId || !activeCatId) throw new Error("Hierarchy context missing");
                const res = await api.post(`/childService/create/${activeCatId}/${selectedSubId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                return res.data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_childservices", selectedSubId] });
            setIsModalOpen(false);
            setEditingItem(null);
            setName(""); setPrice(""); setDesc(""); setFile(null); setPreview(null);
            toast.success(editingItem ? "Service item updated" : "Service item created");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Operation failed");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/childService/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_childservices", selectedSubId] });
            setDeleteId(null);
            toast.success("Service item deleted from catalog");
        }
    });

    const toggleFeaturedMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await api.patch(`/childService/featured/toggle/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_childservices", selectedSubId] });
            toast.success("Recognition status updated");
        }
    });

    const filtered = childServices?.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const cleanName = (name: string) => name.replace(/SELECT|ASSIGN/g, "").trim();

    const getChildIcon = (child: ChildService) => {
        const name = child.name.toLowerCase();
        const cat = categories?.find(c => c._id === activeCatId);
        const catName = cat?.name.toLowerCase() || "";

        if (name.includes('doctor') || catName.includes('doctor')) return Stethoscope;
        if (name.includes('nurse') || name.includes('care') || catName.includes('nurse')) return Syringe;
        if (name.includes('lab') || name.includes('diagnost') || catName.includes('lab')) return FlaskConical;
        if (name.includes('ambul') || name.includes('emergen') || catName.includes('ambulance')) return Ambulance;
        return Tag;
    };

    return (
        <div className="space-y-6 animate-in">
            {/* ── Page Header ── */}
            <header className="flex flex-col gap-2 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden text-left items-start">
                <div className="relative z-10 w-full flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate(`/service-subcategories?categoryId=${activeCatId}`)} 
                            className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all border border-blue-100 dark:border-blue-500/20"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">Child Categories</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">
                                    Home • Healthcare Catalog • Child Services
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        disabled={!selectedSubId}
                        onClick={() => {
                            setEditingItem(null);
                            setName(""); setPrice(""); setDesc(""); setFile(null); setPreview(null);
                            setFulfillment("HOME_VISIT");
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shrink-0 disabled:opacity-50"
                    >
                        <Plus size={16} />
                        <span>Add Child Category</span>
                    </button>
                </div>
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            </header>

            {/* ── Main Layout (Left sidebar filter / Right Table listing) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                <aside className="lg:col-span-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm text-left space-y-5">
                    {/* Category Selector dropdown */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Select Category</label>
                        <select
                            className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-bold outline-none cursor-pointer"
                            value={activeCatId}
                            onChange={(e) => {
                                setActiveCatId(e.target.value);
                                setSelectedSubId("");
                            }}
                        >
                            <option value="">Choose...</option>
                            {categories?.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name.replace(/SELECT|ASSIGN/g, "")}</option>
                            ))}
                        </select>
                    </div>

                    {/* Subcategory selectors list */}
                    <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                        <div className="flex items-center gap-2 mb-1">
                            <Tag size={14} className="text-emerald-600" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Subcategory Selection</span>
                        </div>
                        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                            {!activeCatId && <p className="text-[10px] text-[var(--text-muted)] italic">Choose a category above</p>}
                            {subServices?.map(sub => (
                                <button
                                    key={sub._id}
                                    onClick={() => setSelectedSubId(sub._id)}
                                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all border ${selectedSubId === sub._id ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-500/20" : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] border-transparent"}`}
                                >
                                    {sub.name.replace(/SELECT|ASSIGN/g, "")}
                                </button>
                            ))}
                            {activeCatId && subServices?.length === 0 && <p className="text-[10px] text-[var(--text-muted)] italic">No subcategories found</p>}
                        </div>
                    </div>
                </aside>

                <main className="lg:col-span-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
                    {selectedSubId && (
                        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between gap-3">
                            <div style={{ position: "relative", width: "320px", flexShrink: 0 }}>
                                <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", zIndex: 10 }} />
                                <input
                                    placeholder="Search by TxnID, name, phone..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{
                                        width: "100%", height: 42, borderRadius: 12, paddingLeft: 38, paddingRight: 14,
                                        background: "var(--card-bg)", border: "1.5px solid var(--border-color)",
                                        fontSize: "0.875rem", color: "var(--text-main)", outline: "none",
                                        fontFamily: "inherit", boxSizing: "border-box"
                                    }}
                                />
                            </div>
                            <span className="text-xs font-bold text-[var(--text-muted)]">
                                {filtered?.length || 0} Child Services
                            </span>
                        </div>
                    )}

                    {!selectedSubId ? (
                        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                            <Tag size={36} className="text-slate-300 animate-pulse" />
                            <div>
                                <h4 className="text-sm font-bold text-[var(--text-main)]">Select Subcategory</h4>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">Please select category and subcategory to load entries.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[750px]">
                                <thead>
                                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                        <th className="py-3 px-4 w-12">#</th>
                                        <th className="py-3 px-4 w-20">Icon</th>
                                        <th className="py-3 px-4">Service Item Name</th>
                                        <th className="py-3 px-4">Base Cost</th>
                                        <th className="py-3 px-4">Fulfillment Mode</th>
                                        <th className="py-3 px-4 text-center">Fame Status</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {filtered && filtered.length > 0 ? (
                                        filtered.map((child, index) => (
                                            <tr key={child._id} className="hover:bg-[var(--bg-main)]/50 transition-colors group">
                                                {/* Index */}
                                                <td className="py-4 px-4 text-xs font-semibold text-[var(--text-muted)]">
                                                    {String(index + 1).padStart(2, '0')}
                                                </td>
                                                {/* Icon */}
                                                <td className="py-4 px-4">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 overflow-hidden border border-blue-100/50 dark:border-blue-500/10">
                                                        {child.imageUrl ? (
                                                            <img src={resolveAssetUrl(child.imageUrl)} alt={child.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            (() => {
                                                                const ChildIcon = getChildIcon(child);
                                                                return <ChildIcon size={18} />;
                                                            })()
                                                        )}
                                                    </div>
                                                </td>
                                                {/* Name / Desc */}
                                                <td className="py-4 px-4">
                                                    <div>
                                                        <h4 className="font-bold text-sm text-[var(--text-main)] uppercase tracking-tight">{cleanName(child.name)}</h4>
                                                        {child.description && (
                                                            <p className="text-[10px] text-[var(--text-muted)] max-w-xs truncate mt-0.5">{child.description}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                {/* Price */}
                                                <td className="py-4 px-4 font-bold text-xs text-[var(--text-main)]">
                                                    ₹{child.price}
                                                </td>
                                                {/* Fulfillment */}
                                                <td className="py-4 px-4 text-xs text-[var(--text-muted)] font-semibold uppercase">
                                                    {child.fulfillmentMode?.replace("_", " ") || "Home Visit"}
                                                </td>
                                                {/* Fame Status toggle */}
                                                <td className="py-4 px-4 text-center">
                                                    <button
                                                        onClick={() => toggleFeaturedMutation.mutate(child._id)}
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase transition-all ${
                                                            child.isFeatured 
                                                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400" 
                                                                : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
                                                        }`}
                                                    >
                                                        <Star size={10} fill={child.isFeatured ? "currentColor" : "none"} />
                                                        <span>{child.isFeatured ? "Popular" : "Standard"}</span>
                                                    </button>
                                                </td>
                                                {/* Actions */}
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => {
                                                                setEditingItem(child);
                                                                setName(child.name);
                                                                setPrice(String(child.price));
                                                                setDesc(child.description || "");
                                                                setFulfillment(child.fulfillmentMode || "HOME_VISIT");
                                                                setPreview(resolveAssetUrl(child.imageUrl) || null);
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="w-8 h-8 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] flex items-center justify-center hover:bg-[var(--bg-main)] hover:text-blue-600 transition-all"
                                                        >
                                                            <Edit2 size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteId(child._id)}
                                                            className="w-8 h-8 rounded-lg border border-red-100 dark:border-red-950/20 bg-red-50/50 dark:bg-red-950/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="py-16 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <Tag size={24} className="text-slate-300" />
                                                    <div>
                                                        <h4 className="text-sm font-bold text-[var(--text-main)]">No Services Found</h4>
                                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Try adding a new child service item to this branch.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
                        <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex justify-between items-center">
                            <div>
                                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Healthcare Catalog</p>
                                <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">{editingItem ? 'Edit Service' : 'New Service Item'}</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all">
                                <X size={16} />
                            </button>
                        </div>
                        <form className="p-6 space-y-4" onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData();
                            fd.append("name", name);
                            fd.append("price", price);
                            fd.append("description", desc || "Item details");
                            fd.append("fulfillmentMode", fulfillment);
                            fd.append("selectionType", "SELECT");
                            if (file) fd.append("image", file);
                            submitMutation.mutate(fd);
                        }}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Service Name</label>
                                    <input className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 transition-all font-semibold" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Blood Sample Collection" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Base Cost (INR)</label>
                                    <input type="number" className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 transition-all font-semibold" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" required />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Fulfillment Mode</label>
                                <select className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 transition-all font-semibold cursor-pointer" value={fulfillment} onChange={(e) => setFulfillment(e.target.value)}>
                                    <option value="HOME_VISIT">Home Visit</option>
                                    <option value="HOSPITAL_VISIT">Medical Center Visit</option>
                                    <option value="VIRTUAL">Virtual Consultation</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Description</label>
                                <textarea
                                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] px-3 py-2 rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-500 transition-all font-semibold min-h-[80px]"
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                    placeholder="Outline the service scope..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider font-bold">Service Image</label>
                                <label className={`flex items-center gap-4 w-full h-16 px-4 rounded-xl border-2 border-dashed transition-all cursor-pointer ${preview ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20" : "bg-[var(--bg-main)] border-[var(--border-color)] hover:border-emerald-400"}`}>
                                    <div className={`relative group w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden ${preview ? "bg-white shadow-sm" : "bg-slate-200 text-slate-500"}`}>
                                        {preview ? <img src={preview} className="w-full h-full object-cover" /> : <UploadCloud size={16} />}
                                        {preview && (
                                            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <UploadCloud size={12} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden text-left">
                                        <p className={`text-xs font-bold truncate ${preview ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400"}`}>
                                            {file ? file.name : (editingItem ? "Update Service Image..." : "Select Service Image...")}
                                        </p>
                                    </div>
                                    <input type="file" className="hidden" onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) {
                                            setFile(f);
                                            setPreview(URL.createObjectURL(f));
                                        }
                                    }} />
                                </label>
                            </div>
                            <div className="pt-2">
                                <button disabled={submitMutation.isPending} className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm disabled:opacity-50">
                                    {submitMutation.isPending ? "Integrating..." : (editingItem ? "Save Changes" : "Create Service Item")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
                    <div className="relative w-full max-w-md bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
                        <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider font-bold">Catalog Security</p>
                            <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">Wipe Catalog Item?</h3>
                        </div>
                        <div className="p-6 text-center space-y-4">
                            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto border border-red-200">
                                <Trash2 size={20} />
                            </div>
                            <p className="text-sm text-[var(--text-muted)] font-semibold">This service item will be permanently deleted.</p>
                        </div>
                        <div className="px-6 py-4 border-t border-[var(--border-color)] flex gap-2 bg-[var(--bg-main)]">
                            <button className="flex-1 h-9 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--bg-main)] transition-all" onClick={() => setDeleteId(null)}>Cancel</button>
                            <button className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors" onClick={() => deleteMutation.mutate(deleteId)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

