import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, resolveAssetUrl } from "@/lib/api";
import {
    Plus,
    Trash2,
    ChevronRight,
    Layers,
    X,
    Search,
    ChevronLeft,
    Filter,
    Image,
    UploadCloud,
    CheckCircle2,
    Stethoscope,
    Syringe,
    FlaskConical,
    Ambulance,
    Edit2
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

interface SubService {
    _id: string;
    name: string;
    serviceId: string;
    description?: string;
    imageUrl?: string;
}

interface Category {
    _id: string;
    name: string;
    title?: string;
}

export function ServiceSubServicesPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialCatId = searchParams.get("categoryId") || "";
    const initialCatName = searchParams.get("category") || "";

    const [selectedCatId, setSelectedCatId] = useState(initialCatId);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editingSub, setEditingSub] = useState<SubService | null>(null);

    const { data: categories } = useQuery({
        queryKey: ["admin_categories"],
        queryFn: async () => {
            const res = await api.get("/services");
            return res.data.data as Category[];
        }
    });

    const cleanName = (name: string) => name.replace(/SELECT|ASSIGN/g, "").trim();

    useEffect(() => {
        if (selectedCatId || !initialCatName || !categories?.length) return;

        const normalizedParam = initialCatName.trim().toLowerCase();
        const matchedCategory = categories.find((cat) => {
            const categoryNames = [cat.name, cat.title, cleanName(cat.name)]
                .filter(Boolean)
                .map((value) => String(value).trim().toLowerCase());
            return categoryNames.includes(normalizedParam);
        });

        if (matchedCategory) {
            setSelectedCatId(matchedCategory._id);
        }
    }, [categories, initialCatName, selectedCatId]);

    const { data: subServices, isLoading } = useQuery({
        queryKey: ["admin_subservices", selectedCatId],
        queryFn: async () => {
            if (!selectedCatId) return [];
            const res = await api.get(`/subservice/${selectedCatId}`);
            return res.data.data as SubService[];
        },
        enabled: !!selectedCatId
    });

    const submitMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            if (editingSub) {
                const res = await api.put(`/subservice/${editingSub._id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                return res.data;
            } else {
                if (!selectedCatId) throw new Error("Category Required");
                const res = await api.post(`/subservice/create/${selectedCatId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                return res.data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_subservices", selectedCatId] });
            setIsModalOpen(false);
            setEditingSub(null);
            setName(""); setDesc(""); setFile(null); setPreview(null);
            toast.success(editingSub ? "Sub-service updated" : "Sub-service integrated");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Operation failed");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/subservice/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_subservices", selectedCatId] });
            setDeleteId(null);
            toast.success("Sub-service deleted");
        }
    });

    const filtered = subServices?.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentCategory = categories?.find(c => c._id === selectedCatId);

    const getSubIcon = (sub: SubService) => {
        const name = sub.name.toLowerCase();
        const catName = currentCategory?.name.toLowerCase() || "";

        if (name.includes('doctor') || catName.includes('doctor')) return Stethoscope;
        if (name.includes('nurse') || name.includes('care') || catName.includes('nurse')) return Syringe;
        if (name.includes('lab') || name.includes('diagnost') || catName.includes('lab')) return FlaskConical;
        if (name.includes('ambul') || name.includes('emergen') || catName.includes('ambulance')) return Ambulance;
        return Layers;
    };

    return (
        <div className="flex-col gap-6 space-y-6">
            <header className="flex justify-between items-center bg-[var(--card-bg)] p-8 rounded-3xl border border-[var(--border-color)] shadow-sm">
                <div className="flex items-center gap-5">
                    <button 
                        onClick={() => navigate("/service-categories")} 
                        className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm shadow-blue-500/10"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tighter text-[var(--text-main)]">Subcategories</h1>
                    </div>
                </div>
                <button
                    disabled={!selectedCatId}
                    onClick={() => {
                        setEditingSub(null);
                        setName(""); setDesc(""); setFile(null); setPreview(null);
                        setIsModalOpen(true);
                    }}
                    className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center gap-3 shadow-xl shadow-blue-500/20 transition-all active:scale-95 font-black text-[11px] uppercase tracking-[0.15em] disabled:opacity-50"
                >
                    <Plus size={20} />
                    <span>Add Subcategory</span>
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <aside className="lg:col-span-1 flex-col gap-4">
                    <div className="card p-6 border-none shadow-sm" style={{ borderRadius: '24px' }}>
                        <div className="flex items-center gap-2 mb-6">
                            <Filter size={14} className="text-blue-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category Selection</span>
                        </div>
                        <div className="flex-col gap-2">
                            {categories?.map(cat => (
                                <button
                                    key={cat._id}
                                    onClick={() => setSelectedCatId(cat._id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${selectedCatId === cat._id ? "bg-blue-600 text-white shadow-lg" : "hover:bg-slate-50 text-slate-600"}`}
                                >
                                    {cleanName(cat.name)}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="lg:col-span-3 flex-col gap-6">
                    {selectedCatId && (
                        <div className="relative mb-2">
                            <Search className="absolute text-slate-400" size={16} style={{ left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                placeholder="Search sub-services..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl text-sm font-medium"
                                style={{ paddingLeft: 40, height: 44 }}
                            />
                        </div>
                    )}
                    {!selectedCatId ? (
                        <div className="p-20 text-center card-ghost">
                            <Layers size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-bold text-slate-400">Select a category to view sub-services</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filtered?.map((sub) => (
                                <article
                                    key={sub._id}
                                    className="card flex-col gap-4 group cursor-pointer hover:scale-[1.01] transition-all border-none shadow-sm"
                                    onClick={() => navigate(`/service-child-services?subServiceId=${sub._id}&categoryId=${selectedCatId}`)}
                                    style={{ borderRadius: '28px', padding: '24px' }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="icon-box overflow-hidden" style={{ width: '52px', height: '52px', borderRadius: '18px', background: '#f5f3ff', color: '#7c3aed' }}>
                                            {sub.imageUrl ? (
                                                <img src={resolveAssetUrl(sub.imageUrl)} alt={sub.name} className="w-full h-full object-cover" />
                                            ) : (
                                                (() => {
                                                    const SubIcon = getSubIcon(sub);
                                                    return <SubIcon size={22} />;
                                                })()
                                            )}
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingSub(sub);
                                                    setName(sub.name);
                                                    setDesc(sub.description || "");
                                                    setPreview(resolveAssetUrl(sub.imageUrl) || null);
                                                    setIsModalOpen(true);
                                                }}
                                                className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDeleteId(sub._id); }}
                                                className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-col gap-2">
                                        <h3 className="font-black text-slate-800 text-lg">{cleanName(sub.name)}</h3>
                                        {sub.description && (
                                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                                {sub.description}
                                            </p>
                                        )}
                                        <p className="text-[9px] text-blue-600 font-black uppercase tracking-[0.2em] mt-1"></p>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                                        <span className="text-[10px] font-black text-blue-600/40 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Manage Services</span>
                                        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1" />
                                    </div>
                                </article>
                            ))}
                            {filtered?.length === 0 && !isLoading && (
                                <div className="col-span-2 text-center py-20 opacity-50 font-bold">No sub-services found.</div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {isLoading && <div className="p-20 text-center font-bold animate-pulse">Accessing unit registry...</div>}

            {/* Create Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="p-8 border-b flex justify-between items-center">
                            <div>
                                <h2 className="brand-name">{editingSub ? 'Edit Sub-Service' : 'New Sub-Service'}</h2>
                                <p className="text-xs muted font-bold uppercase tracking-widest mt-1">{editingSub ? `Updating ${editingSub.name}` : `Expanding ${cleanName(currentCategory?.name || "")}`}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="logout-btn"><X size={24} /></button>
                        </div>
                        <form className="p-8 flex-col gap-5" onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData();
                            fd.append("name", name);
                            fd.append("description", desc || "Unit description");
                            if (file) fd.append("image", file);
                            submitMutation.mutate(fd);
                        }}>
                            <div className="input-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Sub-Service Name</label>
                                <input className="w-full h-14 bg-slate-50 border-none px-5 rounded-2xl font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., General Medicine" required />
                            </div>
                            <div className="input-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Description</label>
                                <textarea
                                    className="w-full bg-slate-50 border-none px-5 py-4 rounded-2xl font-bold min-h-[100px] placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                    placeholder="Describe the clinical focus..."
                                />
                            </div>
                            <div className="input-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Identity Visual (Icon)</label>
                                <label className={`flex items-center gap-4 w-full h-16 px-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${preview ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-100 hover:border-indigo-200"}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden ${preview ? "bg-white shadow-sm" : "bg-slate-200 text-slate-500"}`}>
                                        {preview ? <img src={preview} className="w-full h-full object-cover" /> : <UploadCloud size={20} />}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className={`text-xs font-bold truncate ${preview ? "text-indigo-700" : "text-slate-400"}`}>
                                            {file ? file.name : (editingSub ? "Update visual asset..." : "Select unit icon...")}
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
                            <button disabled={submitMutation.isPending} className="button primary h-14 w-full rounded-2xl mt-4 font-black uppercase tracking-widest text-xs">
                                {submitMutation.isPending ? "Integrating..." : (editingSub ? "Save Changes" : "Create Sub-Service")}
                            </button>
                        </form>
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
                        <h3 className="brand-name text-2xl">Remove Node?</h3>
                        <p className="muted font-medium mt-2">All service items under this sub-service will also be removed. This action is final.</p>
                        <div className="flex gap-4 mt-10">
                            <button className="button secondary flex-1 h-14 rounded-2xl font-black uppercase text-[10px]" onClick={() => setDeleteId(null)}>Abort</button>
                            <button className="button primary flex-1 h-14 rounded-2xl font-black uppercase text-[10px] !bg-red-500" onClick={() => deleteMutation.mutate(deleteId)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

