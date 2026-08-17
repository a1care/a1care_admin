import { PageBanner } from "@/components/ui/PageBanner";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, resolveAssetUrl } from "@/lib/api";
import { Plus, Trash2, ChevronRight, Layers, X, Search, ChevronLeft, Filter, Image, UploadCloud, CheckCircle2, Stethoscope, Syringe, FlaskConical, Ambulance, Edit2, Bell, History } from "lucide-react";
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
  const {
    data: categories
  } = useQuery({
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
    const matchedCategory = categories.find(cat => {
      const categoryNames = [cat.name, cat.title, cleanName(cat.name)].filter(Boolean).map(value => String(value).trim().toLowerCase());
      return categoryNames.includes(normalizedParam);
    });
    if (matchedCategory) {
      setSelectedCatId(matchedCategory._id);
    }
  }, [categories, initialCatName, selectedCatId]);
  const {
    data: subServices,
    isLoading
  } = useQuery({
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
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        return res.data;
      } else {
        if (!selectedCatId) throw new Error("Category Required");
        const res = await api.post(`/subservice/create/${selectedCatId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin_subservices", selectedCatId]
      });
      setIsModalOpen(false);
      setEditingSub(null);
      setName("");
      setDesc("");
      setFile(null);
      setPreview(null);
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
      queryClient.invalidateQueries({
        queryKey: ["admin_subservices", selectedCatId]
      });
      setDeleteId(null);
      toast.success("Sub-service deleted");
    }
  });
  const filtered = subServices?.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
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
    <div className="space-y-6 animate-in">
        {/* ── Page Header ── */}
        <PageBanner 
            title={currentCategory ? `${currentCategory.name} Subcategories` : "Subcategories"} 
            subtitle="Manage specialized subdivisions within healthcare sectors."
            onBack={() => navigate("/service-categories")}
        >
            <button disabled={!selectedCatId} onClick={() => {
                setEditingSub(null);
                setName("");
                setDesc("");
                setFile(null);
                setPreview(null);
                setIsModalOpen(true);
            }} className="flex items-center gap-2 h-9 px-4 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-semibold rounded-xl transition-all backdrop-blur-sm shrink-0 disabled:opacity-50">
                <Plus size={15} />
                <span>Add Subcategory</span>
            </button>
        </PageBanner>

        {/* ── Main Catalog Subcategory Table Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Left filter side */}
            <aside className="lg:col-span-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm text-left">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--border-color)]">
                        <Filter size={14} className="text-blue-600" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Select Category</span>
                    </div>
                    <div className="space-y-1">
                        {categories?.map(cat => <button key={cat._id} onClick={() => setSelectedCatId(cat._id)} className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all border ${selectedCatId === cat._id ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-100 dark:border-blue-500/20" : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] border-transparent"}`}>
                                {cleanName(cat.name)}
                            </button>)}
                    </div>
                </aside>

                {/* Right table side */}
                <main className="lg:col-span-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
                    {selectedCatId && <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between gap-3">
                            <div style={{
            position: "relative",
            width: "320px",
            flexShrink: 0
          }}>
                                <Search size={15} style={{
              position: "absolute",
              left: 13,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
              zIndex: 10
            }} />
                                <input placeholder="Search by TxnID, name, phone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{
              width: "100%",
              height: 42,
              borderRadius: 12,
              paddingLeft: 38,
              paddingRight: 14,
              background: "var(--card-bg)",
              border: "1.5px solid var(--border-color)",
              fontSize: "0.875rem",
              color: "var(--text-main)",
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box"
            }} />
                            </div>
                            <span className="text-xs font-bold text-[var(--text-muted)]">
                                {filtered?.length || 0} Subcategories
                            </span>
                        </div>}

                    {!selectedCatId ? <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                            <Layers size={36} className="text-slate-300" />
                            <div>
                                <h4 className="text-sm font-bold text-[var(--text-main)]">Select Category</h4>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">Please choose a category from the sidebar filter first.</p>
                            </div>
                        </div> : <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                        <th className="py-3 px-4 w-12">#</th>
                                        <th className="py-3 px-4 w-20">Icon</th>
                                        <th className="py-3 px-4">Subcategory Name</th>
                                        <th className="py-3 px-4">Description</th>
                                        <th className="py-3 px-4">Direct Link</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {filtered && filtered.length > 0 ? filtered.map((sub, index) => <tr key={sub._id} className="hover:bg-[var(--bg-main)]/50 transition-colors group cursor-pointer" onClick={() => navigate(`/service-child-services?subServiceId=${sub._id}&categoryId=${selectedCatId}`)}>
                                                {/* Index */}
                                                <td className="py-4 px-4 text-xs font-semibold text-[var(--text-muted)]">
                                                    {String(index + 1).padStart(2, '0')}
                                                </td>
                                                {/* Icon */}
                                                <td className="py-4 px-4">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 overflow-hidden border border-blue-100/50 dark:border-blue-500/10">
                                                        {sub.imageUrl ? <img src={resolveAssetUrl(sub.imageUrl)} alt={sub.name} className="w-full h-full object-cover" /> : (() => {
                      const SubIcon = getSubIcon(sub);
                      return <SubIcon size={18} />;
                    })()}
                                                    </div>
                                                </td>
                                                {/* Name */}
                                                <td className="py-4 px-4">
                                                    <h4 className="font-bold text-sm text-[var(--text-main)] group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                                        {cleanName(sub.name)}
                                                    </h4>
                                                </td>
                                                {/* Description */}
                                                <td className="py-4 px-4 text-xs text-[var(--text-muted)] max-w-xs truncate font-medium">
                                                    {sub.description || "—"}
                                                </td>
                                                {/* Direct Link click */}
                                                <td className="py-4 px-4">
                                                    <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider group-hover:text-blue-600 transition-colors flex items-center gap-1">
                                                        Manage Services <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                                    </span>
                                                </td>
                                                {/* Actions */}
                                                <td className="py-4 px-4 text-right" onClick={e => e.stopPropagation()}>
                                                    <div className="flex gap-2 justify-end">
                                                        <button onClick={() => {
                      setEditingSub(sub);
                      setName(sub.name);
                      setDesc(sub.description || "");
                      setPreview(resolveAssetUrl(sub.imageUrl) || null);
                      setIsModalOpen(true);
                    }} className="w-8 h-8 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] flex items-center justify-center hover:bg-[var(--bg-main)] hover:text-blue-600 transition-all">
                                                            <Edit2 size={13} />
                                                        </button>
                                                        <button onClick={() => setDeleteId(sub._id)} className="w-8 h-8 rounded-lg border border-red-100 dark:border-red-950/20 bg-red-50/50 dark:bg-red-950/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>) : <tr>
                                            <td colSpan={6} className="py-16 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <Layers size={24} className="text-slate-300" />
                                                    <div>
                                                        <h4 className="text-sm font-bold text-[var(--text-main)]">No Subcategories Found</h4>
                                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Try adding a new subcategory to this sector.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>}
                                </tbody>
                            </table>
                        </div>}
                </main>
            </div>

            {/* Create Modal */}
            {isModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
                        <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex justify-between items-center">
                            <div>
                                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Healthcare Catalog</p>
                                <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">{editingSub ? 'Edit Sub-Service' : 'New Sub-Service'}</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all">
                                <X size={16} />
                            </button>
                        </div>
                        <form className="p-6 space-y-4" onSubmit={e => {
          e.preventDefault();
          const fd = new FormData();
          fd.append("name", name);
          fd.append("description", desc || "Unit description");
          if (file) fd.append("image", file);
          submitMutation.mutate(fd);
        }}>
                            <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Subcategory Name</label>
                                <input className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500 transition-all font-semibold" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. General Medicine" required />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Description</label>
                                <textarea className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] px-3 py-2 rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-500 transition-all font-semibold min-h-[100px]" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe the clinical focus..." />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider font-bold">Icon Visual</label>
                                <label className={`flex items-center gap-4 w-full h-16 px-4 rounded-xl border-2 border-dashed transition-all cursor-pointer ${preview ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20" : "bg-[var(--bg-main)] border-[var(--border-color)] hover:border-indigo-400"}`}>
                                    <div className={`relative group w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden ${preview ? "bg-white shadow-sm" : "bg-slate-200 text-slate-500"}`}>
                                        {preview ? <img src={preview} className="w-full h-full object-cover" /> : <UploadCloud size={16} />}
                                        {preview && <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <UploadCloud size={12} className="text-white" />
                                            </div>}
                                    </div>
                                    <div className="flex-1 overflow-hidden text-left">
                                        <p className={`text-xs font-bold truncate ${preview ? "text-indigo-700 dark:text-indigo-400" : "text-slate-400"}`}>
                                            {file ? file.name : editingSub ? "Update visual asset..." : "Select unit icon..."}
                                        </p>
                                    </div>
                                    <input type="file" className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  setPreview(URL.createObjectURL(f));
                }
              }} />
                                </label>
                            </div>
                            <div className="pt-2">
                                <button disabled={submitMutation.isPending} className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm disabled:opacity-50">
                                    {submitMutation.isPending ? "Integrating..." : editingSub ? "Save Changes" : "Create Sub-Service"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>}

            {/* Delete Modal */}
            {deleteId && <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
                    <div className="relative w-full max-w-md bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
                        <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Catalog Security</p>
                            <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">Remove Node?</h3>
                        </div>
                        <div className="p-6 text-center space-y-4">
                            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto border border-red-200">
                                <Trash2 size={20} />
                            </div>
                            <p className="text-sm text-[var(--text-muted)] font-semibold">All service items under this sub-service will also be removed. This action is terminal.</p>
                        </div>
                        <div className="px-6 py-4 border-t border-[var(--border-color)] flex gap-2 bg-[var(--bg-main)]">
                            <button className="flex-1 h-9 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--bg-main)] transition-all" onClick={() => setDeleteId(null)}>Abort</button>
                            <button className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors" onClick={() => deleteMutation.mutate(deleteId)}>Delete</button>
                        </div>
                    </div>
                </div>}
    </div>
  );
}
