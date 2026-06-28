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
    Ambulance
} from "lucide-react";
import { toast } from "sonner";
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

function SortableCard({ c, index, onEdit, onDelete, onNavigate, getCategoryIcon, cleanName }: {
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
        <article
            ref={setNodeRef}
            style={style}
            className="group bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-5 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer overflow-hidden relative flex flex-col text-left items-start"
            onClick={() => onNavigate(c._id)}
        >
            {/* Top bar: grip+priority on left, actions on right */}
            <div className="flex items-center justify-between w-full mb-4">
                <div className="flex items-center gap-2">
                    {/* Drag handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 cursor-grab active:cursor-grabbing transition-all"
                        title="Drag to reorder"
                    >
                        <GripVertical size={16} />
                    </div>
                    {/* Priority badge */}
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[11px] font-black shadow">
                        {index + 1}
                    </div>
                </div>

                {/* Edit / Delete */}
                <div className="flex gap-1.5">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(c); }}
                        className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all"
                    >
                        <Edit2 size={15} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(c._id); }}
                        className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform overflow-hidden">
                {c.imageUrl ? (
                    <img src={resolveAssetUrl(c.imageUrl)} alt={c.title} className="w-full h-full object-cover" />
                ) : (
                    <CategoryIcon size={24} />
                )}
            </div>

            <div className="space-y-1 mb-4 flex-1 text-left items-start">
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600/60 mb-1 block">{c.type || "General Service"}</span>
                <h3 className="text-base font-bold text-[var(--text-main)] group-hover:text-blue-600 transition-colors uppercase tracking-tight">{cleanName(c.name)}</h3>
            </div>

            <div className="pt-4 border-t border-[var(--border-color)] w-full flex items-center justify-between">
                <span className="text-[9px] font-black text-blue-600/40 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Manage Subcategories</span>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
        </article>
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
        <div className="space-y-8 animate-in text-left items-start">
            <header className="flex items-center justify-between gap-6 bg-[var(--card-bg)] p-8 rounded-3xl border border-[var(--border-color)] shadow-sm">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tighter text-[var(--text-main)]">
                        {filterType ? `${filterType.charAt(0).toUpperCase() + filterType.slice(1)} Categories` : "Categories"}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-[var(--text-main)] placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/40 w-56"
                    />
                    {filterType && (
                        <button
                            onClick={() => setSearchParams({})}
                            className="h-12 px-6 rounded-xl bg-slate-100 dark:bg-slate-800 text-[var(--text-muted)] font-black text-[10px] uppercase hover:bg-slate-200 transition-all"
                        >
                            Clear Filter
                        </button>
                    )}
                    <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center gap-3 shadow-xl shadow-blue-500/20 transition-all active:scale-95 font-black text-[11px] uppercase tracking-[0.15em]">
                        <Plus size={20} />
                        <span>Add Category</span>
                    </button>
                </div>
            </header>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredCategories.map(c => c._id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCategories.map((c, index) => (
                            <SortableCard
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
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {isLoading && <div className="p-20 text-center muted font-bold animate-pulse">Synchronizing sector data...</div>}

            {/* Create Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <div className="p-8 border-b flex justify-between items-center">
                            <div>
                                <h2 className="brand-name">{editingCategory ? "Edit Category" : "Create New Category"}</h2>
                                <p className="text-xs muted font-bold uppercase tracking-widest mt-1">{editingCategory ? "Update category details" : "Enter category details"}</p>
                            </div>
                            <button onClick={() => { setIsModalOpen(false); setEditingCategory(null); }} className="logout-btn"><X size={24} /></button>
                        </div>
                        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <form className="p-8 flex flex-col gap-6" onSubmit={(e) => {
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
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="input-group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">System Reference (Database ID)</label>
                                        <input className="w-full h-14 bg-slate-50 border-none px-5 rounded-2xl font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. medical_consult" required />
                                    </div>
                                    <div className="input-group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Category Name (Public Display)</label>
                                        <input className="w-full h-14 bg-slate-50 border-none px-5 rounded-2xl font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Consult a Doctor" required />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="input-group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Category Type</label>
                                        <select className="w-full h-14 bg-slate-50 border-none px-5 rounded-2xl font-bold" value={type} onChange={(e) => setType(e.target.value)}>
                                            {availableTypes.map(t => (
                                                <option key={t.id} value={t.id}>{t.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Display Order (1 = First)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            className="w-full h-14 bg-slate-50 border-none px-5 rounded-2xl font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                            value={priority + 1}
                                            onChange={(e) => setPriority(Math.max(0, Number(e.target.value) - 1))}
                                            placeholder="e.g. 1"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="input-group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Category Icon</label>
                                        <label className={`relative flex flex-col items-center justify-center gap-2 w-full h-32 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${file ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-100 hover:border-blue-200"}`}>
                                            <div className="w-full h-full flex items-center justify-center bg-white shadow-sm">
                                                {previewUrl ? (
                                                    <img src={previewUrl} className="w-full h-full object-cover" />
                                                ) : editingCategory?.imageUrl ? (
                                                    <img src={resolveAssetUrl(editingCategory.imageUrl)} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <UploadCloud size={24} className="text-slate-400" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Icon</p>
                                                    </div>
                                                )}
                                            </div>
                                            {(previewUrl || editingCategory?.imageUrl) && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white">Change Icon</p>
                                                </div>
                                            )}
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>

                                    <div className="input-group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Category Banner</label>
                                        <label className={`relative flex flex-col items-center justify-center gap-2 w-full h-32 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${bannerFile ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-100 hover:border-blue-200"}`}>
                                            <div className="w-full h-full flex items-center justify-center bg-white shadow-sm">
                                                {bannerPreviewUrl ? (
                                                    <img src={bannerPreviewUrl} className="w-full h-full object-cover" />
                                                ) : editingCategory?.bannerUrl ? (
                                                    <img src={editingCategory.bannerUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Image size={24} className="text-slate-400" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Banner</p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {(bannerPreviewUrl || editingCategory?.bannerUrl) && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white">Change Banner</p>
                                                </div>
                                            )}
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button type="button" className="flex-1 h-14 rounded-2xl bg-white border border-slate-100 text-slate-400 font-black uppercase text-[10px]" onClick={() => { setIsModalOpen(false); setEditingCategory(null); }}>Abort</button>
                                    <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-black uppercase text-[10px] shadow-xl shadow-blue-100">
                                        {createMutation.isPending || updateMutation.isPending ? "Processing..." : (editingCategory ? "Update Category" : "Create Category")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteId && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center', padding: '40px' }}>
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="brand-name text-2xl">Delete Category?</h3>
                        <p className="muted font-medium mt-2">All sub-services and catalog items within this category will be inaccessible. This action is terminal.</p>
                        <div className="flex gap-4 mt-10">
                            <button className="button secondary flex-1 h-14 rounded-2xl font-black uppercase text-[10px]" onClick={() => setDeleteId(null)}>Cancel</button>
                            <button className="button primary flex-1 h-14 rounded-2xl font-black uppercase text-[10px] !bg-red-500" onClick={() => deleteMutation.mutate(deleteId)}>Delete Category</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

