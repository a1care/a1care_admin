import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, resolveAssetUrl } from "@/lib/api";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    rectSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Plus,
    Trash2,
    ChevronRight,
    LayoutGrid,
    X,
    GripVertical,
    Image,
    UploadCloud,
    Edit2,
    Stethoscope,
    Syringe,
    FlaskConical,
    Ambulance,
    Search,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/Skeletons";
import { useNavigate, useSearchParams } from "react-router-dom";

interface Category {
    _id: string;
    name: string;
    title: string;
    type?: string;
    imageUrl?: string;
    bannerUrl?: string;
    priority?: number;
}



function SortableRow({ c, index, onEdit, onDelete, onNavigate, getCategoryIcon, cleanName }: {
    c: Category; index: number;
    onEdit: (c: Category) => void;
    onDelete: (id: string) => void;
    onNavigate: (id: string) => void;
    getCategoryIcon: (c: Category) => any;
    cleanName: (name: string) => string;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c._id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
    };
    const CategoryIcon = getCategoryIcon(c);

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className="hover:bg-[var(--bg-main)]/50 transition-colors group cursor-pointer"
            onClick={() => onNavigate(c._id)}
        >
            {/* Drag Handle */}
            <td className="py-4 px-4 w-12" onClick={(e) => e.stopPropagation()}>
                <div
                    {...attributes}
                    {...listeners}
                    className="p-1 text-[var(--text-muted)] hover:text-blue-500 hover:bg-[var(--bg-main)] rounded-lg cursor-grab active:cursor-grabbing transition-all inline-flex"
                    title="Drag to reorder"
                >
                    <GripVertical size={14} />
                </div>
            </td>
            
            {/* Display Order / Rank */}
            <td className="py-4 px-4 text-xs font-semibold text-[var(--text-muted)]">
                {String(index + 1).padStart(2, '0')}
            </td>

            {/* Category Icon / Thumbnail */}
            <td className="py-4 px-4 w-20">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 overflow-hidden border border-blue-100/50 dark:border-blue-500/10">
                    {c.imageUrl ? (
                        <img src={resolveAssetUrl(c.imageUrl)} alt={c.title} className="w-full h-full object-cover" />
                    ) : (
                        <CategoryIcon size={18} />
                    )}
                </div>
            </td>

            {/* Category Name / ID */}
            <td className="py-4 px-4">
                <div>
                    <h4 className="font-bold text-sm text-[var(--text-main)] group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                        {cleanName(c.name)}
                    </h4>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] block mt-0.5">
                        Ref: {c.name}
                    </span>
                </div>
            </td>

            {/* Vertical / Type */}
            <td className="py-4 px-4">
                <span className="px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">
                    {c.type || "General"}
                </span>
            </td>

            {/* Manage Redirect Details */}
            <td className="py-4 px-4">
                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider group-hover:text-blue-600 transition-colors flex items-center gap-1">
                    Manage Subcategories <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
            </td>

            {/* Actions */}
            <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => onEdit(c)}
                        className="w-8 h-8 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] flex items-center justify-center hover:bg-[var(--bg-main)] hover:text-blue-600 transition-all"
                        title="Edit Category"
                    >
                        <Edit2 size={13} />
                    </button>
                    <button
                        onClick={() => onDelete(c._id)}
                        className="w-8 h-8 rounded-lg border border-red-100 dark:border-red-950/20 bg-red-50/50 dark:bg-red-950/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                        title="Delete Category"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

export function ServiceCategoriesPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const filterType = searchParams.get("type");
    const [searchTerm, setSearchTerm] = useState("");

    const [availableTypes, setAvailableTypes] = useState<{ id: string, title: string }[]>([
        { id: "doctor", title: "Doctor" },
        { id: "nurse", title: "Nurse" },
        { id: "lab", title: "Lab" },
        { id: "ambulance", title: "Ambulance" },
        { id: "rental", title: "Rental" },
        { id: "service", title: "Service" }
    ]);

    useEffect(() => {
        const saved = localStorage.getItem("a1care_custom_verticals");
        if (saved) {
            const parsed = JSON.parse(saved);
            const customMapped = parsed.map((p: any) => ({ id: p.id, title: p.title }));
            setAvailableTypes(prev => {
                const existingIds = prev.map(p => p.id);
                const filtered = customMapped.filter((m: any) => !existingIds.includes(m.id));
                return [...prev, ...filtered];
            });
        }
    }, []);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [title, setTitle] = useState("");
    const [type, setType] = useState(filterType || "doctor");
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
    const [priority, setPriority] = useState<number>(0);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    useEffect(() => {
        if (!bannerFile) {
            setBannerPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(bannerFile);
        setBannerPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [bannerFile]);

    const { data: categories, isLoading } = useQuery({
        queryKey: ["admin_categories"],
        queryFn: async () => {
            const res = await api.get("/services");
            return res.data.data as Category[];
        }
    });

    const createMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const res = await api.post("/services/create", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_categories"] });
            setIsModalOpen(false);
            resetForm();
            toast.success("Category published");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to publish category");
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, formData }: { id: string, formData: FormData }) => {
            const res = await api.put(`/services/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_categories"] });
            setIsModalOpen(false);
            resetForm();
            toast.success("Category updated");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to update category");
        }
    });

    const resetForm = () => {
        setName("");
        setTitle("");
        setType(filterType || "doctor");
        setPriority(0);
        setFile(null);
        setBannerFile(null);
        setEditingCategory(null);
    };

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/services/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_categories"] });
            setDeleteId(null);
            toast.success("Category deleted");
        }
    });

    const [orderedCategories, setOrderedCategories] = useState<Category[]>([]);

    useEffect(() => {
        if (categories) {
            const sorted = [...categories].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
            setOrderedCategories(sorted);
        }
    }, [categories]);

    const reorderMutation = useMutation({
        mutationFn: async (items: { id: string; priority: number }[]) => {
            await api.post("/services/reorder", items);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_categories"] });
            toast.success("Order saved");
        },
        onError: () => toast.error("Failed to save order"),
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = orderedCategories.findIndex(c => c._id === active.id);
        const newIndex = orderedCategories.findIndex(c => c._id === over.id);
        const reordered = arrayMove(orderedCategories, oldIndex, newIndex);
        setOrderedCategories(reordered);
        reorderMutation.mutate(reordered.map((c, i) => ({ id: c._id, priority: i })));
    };

    const filteredCategories = orderedCategories.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !filterType || c.type === filterType;
        return matchesSearch && matchesType;
    });

    const cleanName = (name: string) => name.replace(/SELECT|ASSIGN/g, "").trim();

    const getCategoryIcon = (category: Category) => {
        const name = category.name.toLowerCase();
        const type = category.type?.toLowerCase() || "";

        if (name.includes('doctor') || type.includes('doctor')) return Stethoscope;
        if (name.includes('nurse') || name.includes('care') || type.includes('nurse')) return Syringe;
        if (name.includes('lab') || name.includes('diagnost') || type.includes('lab')) return FlaskConical;
        if (name.includes('ambul') || name.includes('emergen') || type.includes('ambulance')) return Ambulance;
        return LayoutGrid;
    };

    return (
        <div className="space-y-6 animate-in">
            {/* ── Page Header ── */}
            <header className="flex flex-col gap-2 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden text-left items-start">
                <div className="relative z-10 w-full">
                    <div className="flex items-center justify-between gap-4 w-full">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">
                                {filterType ? `${filterType.charAt(0).toUpperCase() + filterType.slice(1)} Categories` : "Categories"}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">
                                    Home • Healthcare Catalog • Sector Categories
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => { resetForm(); setIsModalOpen(true); }}
                            className="relative z-10 flex items-center gap-1.5 h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shrink-0"
                        >
                            <Plus size={16} />
                            <span>Add Category</span>
                        </button>
                    </div>
                </div>
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            </header>

            {/* ── Main Catalog Table Log Card ── */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
                {/* Search / Filter Toolbar */}
                <div className="flex flex-row items-center justify-between gap-3 p-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
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
                    {filterType && (
                        <button
                            onClick={() => setSearchParams({})}
                            className="h-10 px-4 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
                        >
                            Clear Filter
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="pt-4"><TableSkeleton columns={6} rows={5} showHeader={true} /></div>
                    ) : (
                        <table className="w-full text-left min-w-[800px]">
                            <thead>
                                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                    <th className="py-3 px-4 w-12">Drag</th>
                                    <th className="py-3 px-4 w-12">#</th>
                                    <th className="py-3 px-4 w-20">Icon</th>
                                    <th className="py-3 px-4">Category Name</th>
                                    <th className="py-3 px-4">Vertical Type</th>
                                    <th className="py-3 px-4">Direct Link</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={filteredCategories.map(c => c._id)}>
                                    <tbody className="divide-y divide-[var(--border-color)]">
                                        {filteredCategories.length > 0 ? (
                                            filteredCategories.map((c, index) => (
                                                <SortableRow
                                                    key={c._id}
                                                    c={c}
                                                    index={index}
                                                    getCategoryIcon={getCategoryIcon}
                                                    cleanName={cleanName}
                                                    onEdit={(cat) => {
                                                        setEditingCategory(cat);
                                                        setName(cat.name);
                                                        setTitle(cat.title);
                                                        setType(cat.type || "doctor");
                                                        setPriority(cat.priority ?? 0);
                                                        setIsModalOpen(true);
                                                    }}
                                                    onDelete={(id) => setDeleteId(id)}
                                                    onNavigate={(id) => navigate(`/service-subcategories?categoryId=${id}`)}
                                                />
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="py-16 text-center">
                                                    <div className="flex flex-col items-center justify-center space-y-2">
                                                        <LayoutGrid size={24} className="text-slate-300" />
                                                        <div>
                                                            <h4 className="text-sm font-bold text-[var(--text-main)]">No Categories Found</h4>
                                                            <p className="text-xs text-[var(--text-muted)] mt-0.5">Try searching another query or add a category.</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </SortableContext>
                            </DndContext>
                        </table>
                    )}
                </div>
            </div>

            {/* ── Add/Edit Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); setEditingCategory(null); }} />
                    <div className="relative w-full max-w-lg bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData();
                            fd.append("name", name);
                            fd.append("title", title);
                            fd.append("type", type);
                            fd.append("priority", String(priority));
                            if (file) fd.append("image", file);
                            if (bannerFile) fd.append("banner", bannerFile);

                            if (editingCategory) {
                                updateMutation.mutate({ id: editingCategory._id, formData: fd });
                            } else {
                                createMutation.mutate(fd);
                            }
                        }}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                                <div>
                                    <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Healthcare Catalog</p>
                                    <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">{editingCategory ? "Edit Category" : "Add New Category"}</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setEditingCategory(null); }}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">System Reference ID</label>
                                    <input className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 transition-all font-semibold" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. medical_consult" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Display Name</label>
                                    <input className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 transition-all font-semibold" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Consult a Doctor" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Type</label>
                                        <select className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 transition-all font-semibold cursor-pointer" value={type} onChange={(e) => setType(e.target.value)}>
                                            {availableTypes.map(t => (
                                                <option key={t.id} value={t.id}>{t.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Display Order</label>
                                        <input
                                            type="number"
                                            min={1}
                                            className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 transition-all font-semibold"
                                            value={priority + 1}
                                            onChange={(e) => setPriority(Math.max(0, Number(e.target.value) - 1))}
                                            placeholder="e.g. 1"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider font-bold">Category Icon</label>
                                        <label className={`relative flex flex-col items-center justify-center gap-2 w-full h-28 rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${file ? "bg-blue-50 border-blue-200" : "bg-[var(--bg-main)] border-[var(--border-color)] hover:border-blue-400"}`}>
                                            <div className="w-full h-full flex items-center justify-center">
                                                {previewUrl ? (
                                                    <img src={previewUrl} className="w-full h-full object-cover" />
                                                ) : editingCategory?.imageUrl ? (
                                                    <img src={resolveAssetUrl(editingCategory.imageUrl)} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1.5 text-center">
                                                        <UploadCloud size={20} className="text-[var(--text-muted)]" />
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Upload Icon</span>
                                                    </div>
                                                )}
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider font-bold">Category Banner</label>
                                        <label className={`relative flex flex-col items-center justify-center gap-2 w-full h-28 rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${bannerFile ? "bg-blue-50 border-blue-200" : "bg-[var(--bg-main)] border-[var(--border-color)] hover:border-blue-400"}`}>
                                            <div className="w-full h-full flex items-center justify-center">
                                                {bannerPreviewUrl ? (
                                                    <img src={bannerPreviewUrl} className="w-full h-full object-cover" />
                                                ) : editingCategory?.bannerUrl ? (
                                                    <img src={editingCategory.bannerUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1.5 text-center">
                                                        <Image size={20} className="text-[var(--text-muted)]" />
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Upload Banner</span>
                                                    </div>
                                                )}
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-main)]">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setEditingCategory(null); }}
                                    className="h-9 px-4 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--border-color)] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {createMutation.isPending || updateMutation.isPending ? "Processing..." : (editingCategory ? "Update Category" : "Create Category")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ── */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
                    <div className="relative w-full max-w-md bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
                        <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Catalog Security</p>
                            <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">Delete Category?</h3>
                        </div>
                        <div className="p-6 text-center space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center mx-auto text-rose-600">
                                <Trash2 size={20} />
                            </div>
                            <p className="text-sm text-[var(--text-muted)] font-semibold">All sub-services and catalog items within this category will be inaccessible. This action is terminal.</p>
                        </div>
                        <div className="px-6 py-4 border-t border-[var(--border-color)] flex gap-2 bg-[var(--bg-main)]">
                            <button
                                className="flex-1 h-9 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--bg-main)] transition-all"
                                onClick={() => setDeleteId(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                                onClick={() => deleteMutation.mutate(deleteId)}
                            >
                                Delete Category
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
