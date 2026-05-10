import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import type { FestivalBanner, ManagedAppConfig } from "@/types";
import {
  Image as ImageIcon,
  Save,
  Upload,
  Trash2,
  Plus,
  Link,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Layout
} from "lucide-react";
import { toast } from "sonner";

const createBanner = (): FestivalBanner => ({
  id: `banner_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  title: "",
  imageUrl: "",
  redirectUrl: "",
  active: true
});

export function AppBannerManagementPage() {
  const { type } = useParams<{ type: string }>();
  const appKey = "user_app"; // Banners are currently for customer app
  
  const [banners, setBanners] = useState<FestivalBanner[]>([]);
  const [status, setStatus] = useState<string>("");
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const bannerTypeLabel = 
    type === "main" ? "Offer Banners Customer" : 
    type === "knowledge" ? "Knowledge Banners" : "Promotional Banners";
  const configField = 
    type === "main" ? "mainBanners" : 
    type === "knowledge" ? "knowledgeBanners" : "promotionalBanners";

  const { data: config, isLoading, refetch } = useQuery({
    queryKey: ["app-management", appKey],
    queryFn: async () => {
      const res = await api.get(`/admin/app-management/${appKey}`);
      return res.data.data as ManagedAppConfig;
    }
  });

  useEffect(() => {
    if (config) {
      const existingBanners = (config.landing as any)[configField] || [];
      setBanners(existingBanners);
    }
  }, [config, configField]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!config) return;
      const updatedConfig = {
        ...config,
        landing: {
          ...config.landing,
          [configField]: banners
        }
      };
      const res = await api.put(`/admin/app-management/${appKey}`, updatedConfig);
      return res.data.data as ManagedAppConfig;
    },
    onSuccess: () => {
      toast.success(`${bannerTypeLabel} updated successfully.`);
      setStatus(`Last synced: ${new Date().toLocaleTimeString()}`);
      refetch();
    },
    onError: () => {
      toast.error("Failed to save changes.");
    }
  });

  const uploadAsset = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("asset", file);
    const res = await api.post("/admin/app-management/upload", form);
    return res.data?.data?.url as string;
  };

  const handleUpload = async (index: number, file: File | null) => {
    if (!file) return;
    try {
      setUploadingIndex(index);
      const url = await uploadAsset(file);
      if (!url) throw new Error("Upload failed");
      
      const newBanners = [...banners];
      newBanners[index].imageUrl = url;
      setBanners(newBanners);
      toast.success("Asset uploaded successfully.");
    } catch (err) {
      toast.error("Upload failed.");
    } finally {
      setUploadingIndex(null);
    }
  };

  const updateBanner = (index: number, key: keyof FestivalBanner, value: any) => {
    const newBanners = [...banners];
    (newBanners[index] as any)[key] = value;
    setBanners(newBanners);
  };

  const addBanner = () => {
    setBanners([...banners, createBanner()]);
  };

  const removeBanner = (index: number) => {
    setBanners(banners.filter((_, i) => i !== index));
  };

  const { data: categories } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await api.get("/services");
      return res.data.data as any[];
    }
  });

  const handleCategorySelect = (index: number, categoryName: string, categoryId: string) => {
    const deepLink = `a1care://services?category=${encodeURIComponent(categoryName)}&serviceId=${categoryId}`;
    updateBanner(index, "redirectUrl", deepLink);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[var(--card-bg)] p-10 rounded-[32px] border border-[var(--border-color)] shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
            <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">{bannerTypeLabel}</h1>
          </div>
          <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] ml-5">
            Customer App Visual Assets
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            className="h-12 px-6 bg-slate-900 text-white font-black rounded-2xl text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-lg"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Save size={18} />
            )}
            Save Changes
          </button>
          <button 
            className="h-12 px-6 bg-blue-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100"
            onClick={addBanner}
          >
            <Plus size={18} /> Add New
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto pb-32">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-[var(--card-bg)] rounded-[40px] border border-[var(--border-color)]">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="font-black text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Querying Cloud Assets...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {banners.map((banner, index) => (
              <div key={banner.id} className="relative group bg-[var(--card-bg)] rounded-[40px] p-8 border border-[var(--border-color)] hover:border-blue-200 transition-all shadow-sm">
                <button 
                  className="absolute top-6 right-6 p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  onClick={() => removeBanner(index)}
                >
                  <Trash2 size={18} />
                </button>

                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="w-full aspect-[21/9] bg-[var(--bg-main)] rounded-2xl border border-[var(--border-color)] overflow-hidden flex items-center justify-center relative">
                      {banner.imageUrl ? (
                        <img src={banner.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <div className="text-slate-300 flex flex-col items-center gap-2">
                          <ImageIcon size={32} />
                          <span className="text-[10px] font-black uppercase tracking-widest">No Asset</span>
                        </div>
                      )}
                      
                      {uploadingIndex === index ? (
                        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <label className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <span className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <Upload size={16} /> {banner.imageUrl ? "Replace" : "Upload"}
                          </span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(index, e.target.files?.[0] ?? null)} />
                        </label>
                      )}
                    </div>
                    
                    <label className="flex items-center gap-3 cursor-pointer group/check">
                      <input 
                        type="checkbox" 
                        className="w-6 h-6 rounded-lg border-[var(--border-color)] text-blue-600 focus:ring-blue-100 transition-all" 
                        checked={banner.active}
                        onChange={(e) => updateBanner(index, "active", e.target.checked)}
                      />
                      <span className="text-sm font-bold text-[var(--text-muted)] group-hover/check:text-[var(--text-main)] transition-colors">Visible in App</span>
                    </label>
                  </div>

                  <div className="lg:col-span-2 grid gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Internal Title / Alt Text</label>
                      <input 
                        className="w-full h-12 bg-[var(--bg-main)] border-none rounded-xl px-4 font-bold text-[var(--text-main)] focus:ring-2 focus:ring-blue-100" 
                        placeholder="e.g. Summer Health Campaign"
                        value={banner.title}
                        onChange={(e) => updateBanner(index, "title", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Link to Category (Auto-generates Deep Link)</label>
                      <select 
                        className="w-full h-12 bg-[var(--bg-main)] border-none rounded-xl px-4 font-bold text-[var(--text-main)] focus:ring-2 focus:ring-blue-100"
                        onChange={(e) => {
                          const cat = categories?.find(c => c._id === e.target.value);
                          if (cat) handleCategorySelect(index, cat.name, cat._id);
                        }}
                        value={categories?.find(c => banner.redirectUrl.includes(c._id))?._id || ""}
                      >
                        <option value="">Select Category...</option>
                        {categories?.map(cat => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {banners.length === 0 && (
              <div className="p-20 text-center bg-[var(--bg-main)] rounded-[40px] border-4 border-dashed border-[var(--border-color)] text-[var(--text-muted)]">
                <Sparkles size={48} className="mx-auto mb-4 opacity-40" />
                <p className="text-sm font-black uppercase tracking-[0.2em]">Launch your first banner campaign</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
