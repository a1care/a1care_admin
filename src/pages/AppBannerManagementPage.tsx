import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api, resolveAssetUrl } from "@/lib/api";
import type { FestivalBanner, ManagedAppConfig } from "@/types";
import {
  Image as ImageIcon,
  Save,
  Upload,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  History,
  Link2,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { CardSkeleton } from "@/components/ui/Skeletons";

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
    type === "main" ? "Offer Banners" :
    type === "knowledge" ? "Knowledge Base" : "Promotional Banners";
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
    mutationFn: async (overrideBanners?: typeof banners) => {
      if (!config) return;
      const bannersToSave = overrideBanners ?? banners;
      const updatedConfig = {
        ...config,
        landing: {
          ...config.landing,
          [configField]: bannersToSave
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
    if (key === "active") {
      saveMutation.mutate(newBanners);
    }
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
    <div className="space-y-6 animate-in pb-10">
      {/* ── Page Header ── */}
      <header className="flex flex-col gap-2 bg-[var(--card-bg)] p-6 md:p-8 rounded-3xl shadow-sm border border-[var(--border-color)] relative overflow-hidden text-left items-start">
        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">
                App Control
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">{bannerTypeLabel}</h1>
            <p className="text-sm font-medium text-[var(--text-muted)] tracking-wide">
              Manage and organize visual assets for the customer application
            </p>
          </div>
          {/* Header Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              className="flex items-center gap-2 h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              onClick={() => saveMutation.mutate(undefined)}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>Save Configuration</span>
            </button>
            <button 
              className="flex items-center gap-1.5 h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              onClick={addBanner}
            >
              <Plus size={18} />
              <span>New Banner</span>
            </button>
          </div>
        </div>
        <div className="absolute -bottom-24 -right-12 w-72 h-72 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </header>

      {/* ── Status Bar ── */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <History size={15} className="text-[var(--text-muted)]" />
          <h3 className="text-sm font-bold text-[var(--text-main)]">Active Campaigns ({banners.length})</h3>
        </div>
        {status && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full">{status}</span>}
      </div>

      {/* ── Grid Layout ── */}
      {isLoading ? (
        <div className="mt-6"><CardSkeleton count={3} /></div>
      ) : banners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {banners.map((banner, index) => (
            <div key={banner.id} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              
              {/* Image Preview & Upload Header */}
              <div className="relative w-full aspect-[21/9] bg-slate-50 dark:bg-white/5 border-b border-[var(--border-color)] flex items-center justify-center overflow-hidden">
                {banner.imageUrl ? (
                  <img src={resolveAssetUrl(banner.imageUrl)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Campaign Banner" />
                ) : (
                  <div className="text-[var(--text-muted)] flex flex-col items-center gap-2">
                    <ImageIcon size={24} className="opacity-40" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No Image Asset</span>
                  </div>
                )}

                {/* Upload Overlay */}
                {uploadingIndex === index ? (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                    <span className="text-[10px] text-white font-bold uppercase tracking-widest">Uploading...</span>
                  </div>
                ) : (
                  <label className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md">
                      <Upload size={16} />
                    </div>
                    <span className="text-[10px] text-white font-bold uppercase tracking-widest">
                      {banner.imageUrl ? "Change Asset" : "Upload Asset"}
                    </span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(index, e.target.files?.[0] ?? null)} />
                  </label>
                )}
                
                {/* Index Badge */}
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded-md">
                  #{String(index + 1).padStart(2, '0')}
                </div>
              </div>

              {/* Banner Details Form */}
              <div className="p-5 flex-1 flex flex-col gap-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Campaign Title</label>
                  <input 
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 font-semibold text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" 
                    placeholder="E.g., Diwali Health Checkup Offer"
                    value={banner.title}
                    onChange={(e) => updateBanner(index, "title", e.target.value)}
                  />
                </div>

                {/* Deep link Action */}
                {type !== "promotional" && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">On-Click Action (Deep Link)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Link2 size={14} className="text-[var(--text-muted)]" />
                      </div>
                      <select 
                        className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl pl-9 pr-8 py-2.5 font-semibold text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: `right 0.5rem center`,
                            backgroundSize: `1.2em 1.2em`,
                            backgroundRepeat: `no-repeat`,
                        }}
                        onChange={(e) => {
                          const cat = categories?.find(c => c._id === e.target.value);
                          if (cat) handleCategorySelect(index, cat.name, cat._id);
                          else updateBanner(index, "redirectUrl", "");
                        }}
                        value={categories?.find(c => banner.redirectUrl.includes(c._id))?._id || ""}
                      >
                        <option value="">None (Display Only)</option>
                        {categories?.map(cat => (
                          <option key={cat._id} value={cat._id}>Open: {cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-4 border-t border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between mt-auto">
                {/* Visibility Toggle */}
                <button
                  onClick={() => updateBanner(index, "active", !banner.active)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)] ${
                    banner.active ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span className="sr-only">Toggle visibility</span>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      banner.active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className={`text-xs font-bold uppercase tracking-wider ${banner.active ? "text-blue-600" : "text-[var(--text-muted)]"} mr-auto ml-3`}>
                  {banner.active ? "Visible" : "Hidden"}
                </span>

                {/* Delete Button */}
                <button 
                  onClick={() => {
                    if (window.confirm("Remove this campaign banner? Remember to click 'Save Configuration' to deploy changes.")) {
                      removeBanner(index);
                    }
                  }}
                  className="w-8 h-8 rounded-lg text-red-400 flex items-center justify-center hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-all"
                  title="Delete Banner"
                >
                  <Trash2 size={16} />
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        /* ── Empty State ── */
        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-[var(--border-color)] rounded-3xl bg-[var(--card-bg)]">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/5 rounded-full flex items-center justify-center text-blue-500 mb-6 relative">
            <Sparkles size={32} />
            <div className="absolute top-0 right-0 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[var(--card-bg)] flex items-center justify-center animate-bounce">
              <Plus size={10} className="text-white" />
            </div>
          </div>
          <h2 className="text-xl font-black tracking-tight text-[var(--text-main)] mb-2 text-center">No Active Banners</h2>
          <p className="text-sm text-[var(--text-muted)] font-medium max-w-sm text-center leading-relaxed">
            Your {bannerTypeLabel.toLowerCase()} space is currently empty. Click 'New Banner' to start designing your campaign layout.
          </p>
          <button 
            className="mt-8 flex items-center gap-2 h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-md dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            onClick={addBanner}
          >
            <Plus size={18} />
            <span>Create First Banner</span>
          </button>
        </div>
      )}
    </div>
  );
}
