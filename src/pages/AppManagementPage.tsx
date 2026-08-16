import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, resolveAssetUrl } from "@/lib/api";
import { PageBanner } from "@/components/ui/PageBanner";
import type { FestivalBanner, ManagedAppConfig, ManagedAppKey } from "@/types";
import {
  Globe, Palette, Phone, Layout, Image as ImageIcon,
  Save, AlertCircle, CheckCircle2, Upload, Trash2, Plus,
  Monitor, Smartphone, Link, ChevronRight, Sparkles,
  Activity, Loader2
} from "lucide-react";

const createDefaultConfig = (appKey: ManagedAppKey): ManagedAppConfig => {
  const label = appKey === "user_app" ? "User App" : "Provider App";
  return {
    appKey,
    env: {
      apiBaseUrl: "",
      websiteBaseUrl: "",
      cmsBaseUrl: "",
      assetsBaseUrl: ""
    },
    branding: {
      appName: `A1Care ${label}`,
      logoUrl: "",
      splashImageUrl: "",
      primaryColor: "#1d4ed8",
      secondaryColor: "#0f172a",
      accentColor: "#22c55e"
    },
    contact: {
      supportEmail: "",
      supportPhone: "",
      whatsappNumber: "",
      address: "",
      website: "",
      faq: "",
      privacyPolicy: "",
      termsAndConditions: ""
    },
    landing: {
      headline: "",
      subHeadline: "",
      playStoreUrl: "",
      appStoreUrl: "",
      festivalBanners: []
    },
    updatedAt: ""
  };
};

const createBanner = (): FestivalBanner => ({
  id: `banner_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  title: "",
  imageUrl: "",
  redirectUrl: "",
  active: true
});

type SectionKey = "env" | "branding" | "contact" | "landing" | "banners";

const sections: Array<{ key: SectionKey; label: string; icon: any }> = [
  { key: "env", label: "Gateways", icon: Globe },
  { key: "branding", label: "Branding", icon: Palette },
  { key: "contact", label: "Contact", icon: Phone },
  { key: "landing", label: "Landing", icon: Layout },
  { key: "banners", label: "Banners", icon: ImageIcon },
  { key: "system" as any, label: "System", icon: Monitor }
];

type Props = {
  appKey: ManagedAppKey;
};

export function AppManagementPage({ appKey }: Props) {
  const [formState, setFormState] = useState<ManagedAppConfig>(createDefaultConfig(appKey));
  const [status, setStatus] = useState<string>("");
  const [activeSection, setActiveSection] = useState<SectionKey>("env");
  const [uploadingTarget, setUploadingTarget] = useState<string>("");

  const title = useMemo(
    () => (appKey === "user_app" ? "User Application" : "Provider Application"),
    [appKey]
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["app-management", appKey],
    queryFn: async () => {
      const res = await api.get(`/admin/app-management/${appKey}`);
      return res.data.data as ManagedAppConfig;
    }
  });

  useEffect(() => {
    if (data) {
      setFormState(data);
    }
  }, [data]);

  useEffect(() => {
    setFormState(createDefaultConfig(appKey));
    setStatus("");
    setActiveSection("env");
  }, [appKey]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put(`/admin/app-management/${appKey}`, formState);
      return res.data.data as ManagedAppConfig;
    },
    onSuccess: (next) => {
      setFormState(next);
      setStatus(`Configuration synced successfully at ${new Date(next.updatedAt).toLocaleTimeString()}`);
      setTimeout(() => setStatus(""), 5000);
    },
    onError: () => {
      setStatus("Sync failed. Critical error while writing to configuration store.");
    }
  });

  const updatePath = (path: string, value: string) => {
    setFormState((prev) => {
      const next = structuredClone(prev) as any;
      const parts = path.split(".");
      let current = next;
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const updateBanner = (index: number, key: keyof FestivalBanner, value: string | boolean) => {
    setFormState((prev) => {
      const next = structuredClone(prev);
      (next.landing.festivalBanners[index] as any)[key] = value;
      return next;
    });
  };

  const uploadAsset = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("asset", file);
    const res = await api.post("/admin/app-management/upload", form);
    return res.data?.data?.url as string;
  };

  const handleUploadToPath = async (path: string, file: File | null, targetLabel: string) => {
    if (!file) return;
    try {
      setUploadingTarget(targetLabel);
      const url = await uploadAsset(file);
      if (!url) throw new Error("URL missing in response");
      updatePath(path, url);
      setStatus(`${targetLabel} asset uploaded and linked.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Upload failed";
      setStatus(`Asset upload error: ${msg}`);
    } finally {
      setUploadingTarget("");
    }
  };

  const handleBannerImageUpload = async (index: number, file: File | null) => {
    if (!file) return;
    try {
      setUploadingTarget(`Banner #${index + 1}`);
      const url = await uploadAsset(file);
      if (!url) throw new Error("URL missing in response");
      updateBanner(index, "imageUrl", url);
      setStatus(`Banner #${index + 1} synchronized.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Upload failed";
      setStatus(`Banner asset error: ${msg}`);
    } finally {
      setUploadingTarget("");
    }
  };

  const addBanner = () => {
    setFormState((prev) => ({
      ...prev,
      landing: {
        ...prev.landing,
        festivalBanners: [...prev.landing.festivalBanners, createBanner()]
      }
    }));
  };

  const removeBanner = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      landing: {
        ...prev.landing,
        festivalBanners: prev.landing.festivalBanners.filter((_, idx) => idx !== index)
      }
    }));
  };

  return (
    <div className="space-y-6 animate-in">
      {/* ── Page Header ── */}
      <PageBanner 
          title={`${title} Config`} 
          subtitle="Config Control Center"
      >
          <div className="flex items-center gap-2 relative z-10 shrink-0">
            <button
              type="button"
              className="h-9 px-4 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm disabled:opacity-60 transition-all backdrop-blur-sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              <span>Save Settings</span>
            </button>
          </div>
      </PageBanner>

      {/* ── Main Layout Grid (Left Tabs, Right Panel Content) ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Sidebar Tab Navigation Card */}
        <div className="md:col-span-1 space-y-2">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-3 shadow-sm space-y-1.5 flex flex-col">
            <div className="px-3 py-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-color)] mb-1 text-left">
              App Sections
            </div>
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left w-full ${activeSection === section.key ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 border border-blue-100 dark:border-blue-500/20" : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] border border-transparent"}`}
                onClick={() => setActiveSection(section.key)}
              >
                <section.icon size={15} className={activeSection === section.key ? "text-blue-500" : ""} />
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Content Panel Column */}
        <div className="md:col-span-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] space-y-4 shadow-sm">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider animate-pulse">Querying Platform Store...</p>
            </div>
          ) : (
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 md:p-8 shadow-sm">
              {activeSection === "env" && (
                <section className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4 text-left">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                      <Globe size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-main)]">API Endpoints</h3>
                      <p className="text-xs text-[var(--text-muted)]">Manage critical API and asset cluster endpoints.</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">API Base URL</label>
                      <input className="w-full h-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-4 text-[var(--text-main)] font-semibold text-xs outline-none focus:border-blue-500 transition-all" placeholder="e.g. https://api.a1care.247/v1" value={formState.env.apiBaseUrl} onChange={(e) => updatePath("env.apiBaseUrl", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Assets Base URL</label>
                      <input className="w-full h-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-4 text-[var(--text-main)] font-semibold text-xs outline-none focus:border-blue-500 transition-all" placeholder="e.g. https://cdn.a1care.247/uploads" value={formState.env.assetsBaseUrl} onChange={(e) => updatePath("env.assetsBaseUrl", e.target.value)} />
                    </div>
                  </div>
                </section>
              )}

              {activeSection === "branding" && (
                <section className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4 text-left">
                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center">
                      <Palette size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-main)]">Identity & Theme</h3>
                      <p className="text-xs text-[var(--text-muted)]">Visual brand identity and application color tokens.</p>
                    </div>
                  </div>

                  <div className="space-y-6 text-left">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Logo URL</label>
                        <div className="flex gap-2">
                          <input className="flex-1 h-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-4 text-[var(--text-main)] font-semibold text-xs outline-none focus:border-blue-500 transition-all" placeholder="Path to SVG/PNG logo" value={formState.branding.logoUrl} onChange={(e) => updatePath("branding.logoUrl", e.target.value)} />
                          <label className="h-10 px-4 bg-slate-900 text-white rounded-lg flex items-center justify-center cursor-pointer active:scale-95 transition-all">
                            <Upload size={16} />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadToPath("branding.logoUrl", e.target.files?.[0] ?? null, "Branding Logo")} />
                          </label>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Splash Art URL</label>
                        <div className="flex gap-2">
                          <input className="flex-1 h-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-4 text-[var(--text-main)] font-semibold text-xs outline-none focus:border-blue-500 transition-all" placeholder="Path to Launch image" value={formState.branding.splashImageUrl} onChange={(e) => updatePath("branding.splashImageUrl", e.target.value)} />
                          <label className="h-10 px-4 bg-slate-900 text-white rounded-lg flex items-center justify-center cursor-pointer active:scale-95 transition-all">
                            <Upload size={16} />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadToPath("branding.splashImageUrl", e.target.files?.[0] ?? null, "Splash Art")} />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-6 pt-2">
                      {[
                        { label: "Primary Tint", path: "branding.primaryColor", value: formState.branding.primaryColor },
                        { label: "Secondary", path: "branding.secondaryColor", value: formState.branding.secondaryColor },
                        { label: "Accent", path: "branding.accentColor", value: formState.branding.accentColor },
                      ].map((theme) => (
                        <div key={theme.path} className="flex items-center gap-3 bg-[var(--bg-main)] p-2.5 rounded-lg border border-[var(--border-color)]">
                          <label className="w-9 h-9 rounded-lg border-2 border-[var(--border-color)] cursor-pointer shrink-0 shadow-sm overflow-hidden relative" style={{ backgroundColor: theme.value || "#cccccc" }}>
                            <input type="color" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" value={theme.value} onChange={(e) => updatePath(theme.path, e.target.value)} />
                          </label>
                          <div className="text-left">
                            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{theme.label}</p>
                            <p className="text-xs font-mono font-bold text-[var(--text-main)]">{theme.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {activeSection === "contact" && (
                <section className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4 text-left">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                      <Phone size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-main)]">Support & Contact</h3>
                      <p className="text-xs text-[var(--text-muted)]">Manage customer care, email, and social help desks.</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Support Email</label>
                      <input className="w-full h-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-4 text-[var(--text-main)] font-semibold text-xs outline-none focus:border-blue-500 transition-all" value={formState.contact.supportEmail} onChange={(e) => updatePath("contact.supportEmail", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Support Phone</label>
                      <input className="w-full h-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-4 text-[var(--text-main)] font-semibold text-xs outline-none focus:border-blue-500 transition-all" value={formState.contact.supportPhone} onChange={(e) => updatePath("contact.supportPhone", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">WhatsApp Hotline</label>
                      <input className="w-full h-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-4 text-[var(--text-main)] font-semibold text-xs outline-none focus:border-blue-500 transition-all" value={formState.contact.whatsappNumber} onChange={(e) => updatePath("contact.whatsappNumber", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Official Website</label>
                      <input className="w-full h-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-4 text-[var(--text-main)] font-semibold text-xs outline-none focus:border-blue-500 transition-all" value={formState.contact.website} onChange={(e) => updatePath("contact.website", e.target.value)} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Office Address</label>
                      <input className="w-full h-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-4 text-[var(--text-main)] font-semibold text-xs outline-none focus:border-blue-500 transition-all" value={formState.contact.address} onChange={(e) => updatePath("contact.address", e.target.value)} />
                    </div>
                  </div>
                </section>
              )}

              {activeSection === "landing" && (
                <section className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4 text-left">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                      <Layout size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-main)]">Marketing Landing</h3>
                      <p className="text-xs text-[var(--text-muted)]">Configure copy headlines and links to application stores.</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">App Headline Title</label>
                      <input className="w-full h-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-4 text-[var(--text-main)] font-semibold text-xs outline-none focus:border-blue-500 transition-all" value={formState.landing.headline} onChange={(e) => updatePath("landing.headline", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Play Store URL</label>
                      <input className="w-full h-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-4 text-[var(--text-main)] font-semibold text-xs outline-none focus:border-blue-500 transition-all" value={formState.landing.playStoreUrl} onChange={(e) => updatePath("landing.playStoreUrl", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">App Store URL</label>
                      <input className="w-full h-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-4 text-[var(--text-main)] font-semibold text-xs outline-none focus:border-blue-500 transition-all" value={formState.landing.appStoreUrl} onChange={(e) => updatePath("landing.appStoreUrl", e.target.value)} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Sub-headline Description</label>
                      <textarea className="w-full h-24 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-4 text-[var(--text-main)] font-semibold text-xs outline-none focus:border-blue-500 transition-all" value={formState.landing.subHeadline} onChange={(e) => updatePath("landing.subHeadline", e.target.value)} />
                    </div>
                  </div>
                </section>
              )}

              {activeSection === "banners" && (
                <section className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center">
                        <ImageIcon size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[var(--text-main)]">Festival Banners</h3>
                        <p className="text-xs text-[var(--text-muted)]">Configure seasonal app dashboard banners.</p>
                      </div>
                    </div>
                    <button type="button" onClick={addBanner} className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all">
                      <Plus size={12} /> Add Banner
                    </button>
                  </div>

                  <div className="grid gap-6">
                    {formState.landing.festivalBanners.map((banner, index) => (
                      <div key={banner.id} className="relative bg-[var(--bg-main)] rounded-xl p-5 border border-[var(--border-color)] space-y-4 text-left">
                        <button type="button" onClick={() => removeBanner(index)} className="absolute top-4 right-4 w-7 h-7 rounded-lg border border-red-200 bg-red-50/50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                          <Trash2 size={13} />
                        </button>

                        <div className="grid sm:grid-cols-3 gap-5">
                          <div className="space-y-3">
                            <div className="w-full aspect-[21/9] bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)] overflow-hidden flex items-center justify-center relative">
                              {banner.imageUrl ? (
                                <img src={resolveAssetUrl(banner.imageUrl)} className="w-full h-full object-cover" alt="Preview" />
                              ) : (
                                <ImageIcon size={24} className="text-[var(--text-muted)] opacity-35" />
                              )}
                              <label className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                <span className="text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                  <Upload size={12} /> Upload
                                </span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleBannerImageUpload(index, e.target.files?.[0] ?? null)} />
                              </label>
                            </div>
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" className="w-4 h-4 rounded border-[var(--border-color)] text-blue-600 focus:ring-blue-500/20 transition-all" checked={banner.active} onChange={(e) => updateBanner(index, "active", e.target.checked)} />
                              <span className="text-[10px] font-bold text-[var(--text-muted)]">Active Visually</span>
                            </label>
                          </div>

                          <div className="sm:col-span-2 space-y-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Alt text / Title</label>
                              <input className="w-full h-9 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg px-3 text-xs font-semibold text-[var(--text-main)] outline-none focus:border-blue-500 transition-all" placeholder="Alt Title text" value={banner.title} onChange={(e) => updateBanner(index, "title", e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Deep Link redirect</label>
                              <input className="w-full h-9 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg px-3 text-xs font-semibold text-[var(--text-main)] outline-none focus:border-blue-500 transition-all" placeholder="a1care://redirect-url" value={banner.redirectUrl} onChange={(e) => updateBanner(index, "redirectUrl", e.target.value)} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {formState.landing.festivalBanners.length === 0 && (
                      <div className="py-12 text-center bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] flex flex-col items-center gap-2">
                        <Sparkles size={28} className="opacity-40" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">No active festival banners</span>
                      </div>
                    )}
                  </div>
                </section>
              )}



              {activeSection === ("system" as any) && (
                <SystemSettingsSection />
              )}
            </div>
          )}
        </div>
      </div>

      {status && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border border-white/10 text-xs font-bold">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{status}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SystemSettingsSection() {
  const [status, setStatus] = useState<string>("");

  const { data: system, refetch } = useQuery({
    queryKey: ["system-config"],
    queryFn: async () => {
      const res = await api.get("/admin/system-config");
      return res.data.data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.put("/admin/system-config", payload);
      return res.data.data;
    },
    onSuccess: () => {
      setStatus("Global system state synchronized.");
      refetch();
      setTimeout(() => setStatus(""), 5000);
    }
  });

  if (!system) return null;

  return (
    <section className="space-y-6 text-left animate-in fade-in zoom-in-95">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 dark:bg-red-500/10 text-red-650 rounded-lg flex items-center justify-center">
            <Monitor size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)]">System Control</h3>
            <p className="text-xs text-[var(--text-muted)]">Global network override and maintenance protocols.</p>
          </div>
        </div>

        {status && (
          <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-wider rounded-lg border border-emerald-100 flex items-center gap-1.5">
            <CheckCircle2 size={12} /> {status}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="p-6 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] space-y-4">
          <div className="space-y-1">
             <h4 className="text-sm font-bold text-[var(--text-main)]">Maintenance Command</h4>
             <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed">Activating this will block all patient and provider traffic, returning a 503 Maintenance response globally.</p>
          </div>

          <div 
            onClick={() => updateMutation.mutate({ maintenanceMode: !system.maintenanceMode })}
            className={`h-16 px-5 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-350 border ${system.maintenanceMode ? 'bg-red-600 border-red-500 shadow-sm' : 'bg-[var(--card-bg)] border-[var(--border-color)] hover:border-blue-400'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${system.maintenanceMode ? 'bg-white/20 text-white' : 'bg-[var(--bg-main)] text-[var(--text-muted)]'}`}>
                <AlertCircle size={16} />
              </div>
              <div>
                <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${system.maintenanceMode ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>System Status</p>
                <p className={`text-xs font-black ${system.maintenanceMode ? 'text-white' : 'text-[var(--text-main)]'}`}>{system.maintenanceMode ? "OFFLINE / MAINTENANCE" : "OPERATIONAL"}</p>
              </div>
            </div>
            
            <div className={`w-10 h-5 rounded-full relative transition-colors ${system.maintenanceMode ? 'bg-white/20' : 'bg-[var(--border-color)]'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${system.maintenanceMode ? 'right-0.5' : 'left-0.5'}`}></div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-950 rounded-xl text-white space-y-6 relative overflow-hidden text-left">
           <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-xl"></div>
           <div className="flex items-center gap-2">
             <Activity size={16} className="text-blue-400" />
             <h4 className="font-bold uppercase tracking-wider text-[10px] opacity-60">System Health Stream</h4>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold opacity-45 uppercase tracking-wider">Global Uptime</p>
                <p className="text-lg font-black">99.98%</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold opacity-45 uppercase tracking-wider">Avg Latency</p>
                <p className="text-lg font-black">12ms</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold opacity-45 uppercase tracking-wider">Active Threads</p>
                <p className="text-lg font-black">1024</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold opacity-45 uppercase tracking-wider">Auto Scale</p>
                <p className="text-lg font-black text-emerald-400 uppercase tracking-tighter">Enabled</p>
              </div>
           </div>

           <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">Connected to HK-Cluster-7</span>
              </div>
              <button onClick={() => refetch()} className="text-[9px] font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors">Hard Re-sync</button>
           </div>
        </div>
      </div>
    </section>
  );
}
