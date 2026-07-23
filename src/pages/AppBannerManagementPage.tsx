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
    <div className="space-y-6 animate-in">
      {/* ── Page Header ── */}
      <header className="flex flex-col gap-2 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden text-left items-start">
        <div className="relative z-10 w-full">
          <div className="flex items-center justify-between gap-4 w-full">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">{bannerTypeLabel}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">
                  Home • Customer App Management • Visual Assets
                </p>
              </div>
            </div>
            {/* Header Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button 
                className="flex items-center gap-2 h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-60"
                onClick={() => saveMutation.mutate(undefined)}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Save Changes</span>
              </button>
              <button 
                className="flex items-center gap-1.5 h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
                onClick={addBanner}
              >
                <Plus size={16} />
                <span>Add Banner</span>
              </button>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-green-500/5 dark:bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
      </header>

      {/* ── Table Layout (Notification Log Style) ── */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={15} className="text-blue-500" />
            <h3 className="text-sm font-bold text-[var(--text-main)]">Active Campaigns</h3>
          </div>
          {status && <span className="text-xs text-[var(--text-muted)] font-semibold">{status}</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4 w-48">Banner Asset</th>
                <th className="py-3 px-4">Campaign Title</th>
                {type !== "promotional" && <th className="py-3 px-4 w-80">Deep Link Action</th>}
                <th className="py-3 px-4 w-28">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {banners.length > 0 ? (
                banners.map((banner, index) => (
                  <tr key={banner.id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                    {/* Index */}
                    <td className="py-4 px-4 text-xs font-semibold text-[var(--text-muted)]">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    {/* Image Preview & Upload */}
                    <td className="py-4 px-4">
                      <div className="relative w-40 aspect-[21/9] bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)] overflow-hidden flex items-center justify-center group shadow-sm">
                        {banner.imageUrl ? (
                          <img src={resolveAssetUrl(banner.imageUrl)} className="w-full h-full object-cover" alt="Campaign Banner" />
                        ) : (
                          <div className="text-[var(--text-muted)] flex flex-col items-center gap-1">
                            <ImageIcon size={16} className="opacity-40" />
                            <span style={{ fontSize: '8px' }} className="font-bold uppercase tracking-wider">No Image</span>
                          </div>
                        )}
                        {uploadingIndex === index ? (
                          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          </div>
                        ) : (
                          <label className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                            <span style={{ fontSize: '9px' }} className="text-white font-bold uppercase tracking-wider flex items-center gap-1">
                              <Upload size={10} />
                              Upload
                            </span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(index, e.target.files?.[0] ?? null)} />
                          </label>
                        )}
                      </div>
                    </td>
                    {/* Title */}
                    <td className="py-4 px-4">
                      <input 
                        className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 font-semibold text-xs text-[var(--text-main)] outline-none focus:border-blue-500 transition-all" 
                        placeholder="Campaign Title..."
                        value={banner.title}
                        onChange={(e) => updateBanner(index, "title", e.target.value)}
                      />
                    </td>
                    {/* Deep link Action */}
                    {type !== "promotional" && (
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Link2 size={14} className="text-[var(--text-muted)] shrink-0" />
                          <select 
                            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-2.5 py-2 font-semibold text-xs text-[var(--text-main)] outline-none focus:border-blue-500 transition-all cursor-pointer"
                            onChange={(e) => {
                              const cat = categories?.find(c => c._id === e.target.value);
                              if (cat) handleCategorySelect(index, cat.name, cat._id);
                            }}
                            value={categories?.find(c => banner.redirectUrl.includes(c._id))?._id || ""}
                          >
                            <option value="">No redirect (Display only)</option>
                            {categories?.map(cat => (
                              <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    )}
                    {/* Status visibility toggler */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => updateBanner(index, "active", !banner.active)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase transition-all ${
                          banner.active 
                            ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400" 
                            : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400"
                        }`}
                      >
                        {banner.active ? <Eye size={10} /> : <EyeOff size={10} />}
                        <span>{banner.active ? "Visible" : "Hidden"}</span>
                      </button>
                    </td>
                    {/* Actions Delete */}
                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => {
                          if (window.confirm("Remove this campaign banner? Remember to click 'Save Changes' to update configuration.")) {
                            removeBanner(index);
                          }
                        }}
                        className="w-8 h-8 rounded-lg border border-red-100 dark:border-red-950/20 bg-red-50/50 dark:bg-red-950/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all ml-auto"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={type === "promotional" ? 5 : 6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-300">
                        <Sparkles size={22} className="animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[var(--text-main)]">No Banners Created</h4>
                        <p className="text-xs text-[var(--text-muted)] font-medium mt-1">Start by adding a new campaign banner from header.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
