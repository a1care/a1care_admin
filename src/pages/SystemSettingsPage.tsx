import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SystemConfig, MobileFirebaseClient } from "@/types";
import {
    Flame, Globe, Smartphone, Save, CheckCircle2, AlertCircle,
    ChevronRight, Eye, EyeOff, RefreshCw, Shield, Cpu, CreditCard, Mail, Server, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { FormSkeleton } from "@/components/ui/Skeletons";

// ─── Default (hardcoded fallback) ────────────────────────────────────────────
const DEFAULT_CONFIG: SystemConfig = {
    website: {
        apiKey: "",
        authDomain: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: "",
        measurementId: "",
    },
    projectNumber: "",
    projectId: "",
    storageBucket: "",
    clients: [],
    firebase: {
        clientEmail: "",
        privateKey: ""
    },
    googleMapsApiKey: "",
    easebuzz: {
        merchantKey: "",
        salt: "",
        env: "test"
    },
    email: {
        user: "",
        pass: "",
        host: "smtp.gmail.com",
        port: 587,
        from: ""
    },
    twilio: {
        accountSid: "",
        authToken: "",
        verifyServiceSid: ""
    },
    aws: {
        accessKeyId: "",
        secretAccessKey: "",
        region: "ap-south-1",
        bucketName: "a1-care"
    },
    redis: {
        url: "",
        host: "",
        port: 6379,
        pass: ""
    },
    zego: {
        appId: 0,
        serverSecret: ""
    },
    updatedAt: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PLATFORM_LABELS: Record<string, string> = {
    android: "Android",
    ios: "iOS",
};

const APP_LABELS: Record<string, string> = {
    customer: "Customer App",
    partner: "Partner App",
};


function MaskedInput({ value, onChange, placeholder, id }: {
    value: string; onChange: (v: string) => void; placeholder?: string; id: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative flex items-center">
            <input
                id={id}
                type={show ? "text" : "password"}
                className="w-full h-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-4 pr-12 text-[var(--text-main)] font-mono text-xs font-semibold placeholder:text-[var(--text-muted)]/70 outline-none focus:border-orange-500 transition-all"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
            <button
                type="button"
                className="absolute right-4 text-[var(--text-muted)] hover:text-orange-500 transition-colors"
                onClick={() => setShow((s) => !s)}
            >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
        </div>
    );
}

function FieldRow({ label, value, onChange, masked = false, id, note, type = "text" }: {
    label: string; value: string | number; onChange: (v: string) => void;
    masked?: boolean; id: string; note?: string; type?: string;
}) {
    return (
        <div className="space-y-1.5 text-left">
            <label htmlFor={id} className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">
                {label}
            </label>
            {masked ? (
                <MaskedInput id={id} value={value?.toString() ?? ""} onChange={onChange} placeholder={`Enter ${label}`} />
            ) : (
                <input
                    id={id}
                    type={type}
                    className="w-full h-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-4 text-[var(--text-main)] font-mono text-xs font-semibold placeholder:text-[var(--text-muted)]/70 outline-none focus:border-orange-500 transition-all"
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={`Enter ${label}`}
                />
            )}
            {note && <p className="text-[10px] text-[var(--text-muted)]/80 ml-0.5">{note}</p>}
        </div>
    );
}

export function SystemSettingsPage() {
    const [form, setForm] = useState<SystemConfig>(DEFAULT_CONFIG);
    const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
    const [activeTab, setActiveTab] = useState<"website" | "project" | "clients" | "firebase" | "maps" | "easebuzz" | "email" | "twilio" | "aws" | "redis">("website");

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["system-config"],
        queryFn: async () => {
            const res = await api.get("/admin/system-config");
            return res.data.data as SystemConfig;
        },
    });

    useEffect(() => {
        if (data) setForm(data);
    }, [data]);

    const mutation = useMutation({
        mutationFn: async () => {
            const res = await api.put("/admin/system-config", form);
            return res.data.data as SystemConfig;
        },
        onSuccess: (next) => {
            setForm(next);
            toast.success("System credentials synced successfully!");
            setStatus({ ok: true, msg: `Synced at ${new Date(next.updatedAt).toLocaleTimeString()}` });
            setTimeout(() => setStatus(null), 5000);
        },
        onError: () => {
            toast.error("Save credentials failed.");
            setStatus({ ok: false, msg: "Save failed — check backend logs." });
        },
    });

    const setWebsite = (key: keyof SystemConfig["website"], val: string) =>
        setForm((p) => ({ ...p, website: { ...p.website, [key]: val } }));

    const setClient = (idx: number, key: keyof MobileFirebaseClient, val: string) =>
        setForm((p) => {
            const clients = [...p.clients];
            clients[idx] = { ...clients[idx], [key]: val } as MobileFirebaseClient;
            return { ...p, clients };
        });

    const setEasebuzz = (key: keyof SystemConfig["easebuzz"], val: string) =>
        setForm(p => ({ ...p, easebuzz: { ...p.easebuzz, [key]: val } }));

    const setEmail = (key: keyof SystemConfig["email"], val: string | number) =>
        setForm(p => ({ ...p, email: { ...p.email, [key]: val } }));

    const setTwilio = (key: keyof SystemConfig["twilio"], val: string) =>
        setForm(p => ({ ...p, twilio: { ...p.twilio, [key]: val } }));

    const setAWS = (key: keyof SystemConfig["aws"], val: string) =>
        setForm(p => ({ ...p, aws: { ...p.aws, [key]: val } }));

    const setRedis = (key: keyof SystemConfig["redis"], val: string | number) =>
        setForm(p => ({ ...p, redis: { ...p.redis, [key]: val } }));

    const tabs = [
        { key: "website" as const, label: "Firebase Web", icon: Globe },
        { key: "project" as const, label: "Firebase Project", icon: Cpu },
        { key: "clients" as const, label: "Mobile Apps", icon: Smartphone },
        { key: "firebase" as const, label: "FCM Console", icon: Shield },
        { key: "maps" as const, label: "Google Maps", icon: Globe },
        { key: "easebuzz" as const, label: "Easebuzz", icon: CreditCard },
        { key: "email" as const, label: "Email (SMTP)", icon: Mail },
        { key: "twilio" as const, label: "Twilio SMS", icon: Mail },
        { key: "aws" as const, label: "AWS S3 Cloud", icon: Server },
        { key: "redis" as const, label: "Redis Cache", icon: RefreshCw },
    ];

    return (
        <div className="space-y-6 animate-in">
            {/* ── Page Header ── */}
            <header className="flex flex-col gap-2 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden text-left items-start">
                <div className="relative z-10 w-full">
                    <div className="flex items-center justify-between gap-4 w-full">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">
                                System Credentials
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">
                                    Home • System Configurations • API & Key Registry
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => {
                                    if (window.confirm('Save these settings to production? This will affect all running services immediately.')) {
                                        mutation.mutate();
                                    }
                                }}
                                disabled={mutation.isPending}
                                className="h-10 px-5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm disabled:opacity-60 transition-all"
                            >
                                {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                <span>Save Settings</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            </header>

            {/* ── Main Layout (Left tabs list, Right configuration panels) ── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Left Side Tab Navigation Column */}
                <div className="md:col-span-1 space-y-2">
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-3 shadow-sm space-y-1.5 flex flex-col">
                        <div className="px-3 py-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-color)] mb-1 text-left">
                            Service Credentials
                        </div>
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left w-full ${activeTab === t.key ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 border border-orange-100 dark:border-orange-500/20" : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] border border-transparent"}`}
                                onClick={() => setActiveTab(t.key)}
                            >
                                <t.icon size={15} className={activeTab === t.key ? "text-orange-500" : ""} />
                                <span>{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Side Tab Panel Content Column */}
                <div className="md:col-span-3">
                    {isLoading ? (
                        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6">
                            <FormSkeleton />
                        </div>
                    ) : (
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 md:p-8 shadow-sm">
                            {/* ── Website / JS SDK ── */}
                            {activeTab === "website" && (
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4 text-left">
                                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                                            <Globe size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-[var(--text-main)]">Firebase Web SDK</h3>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                Synchronized with JS clients and Admin Panel.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <FieldRow id="ws-apiKey" label="API Key" value={form.website.apiKey} onChange={(v) => setWebsite("apiKey", v)} masked />
                                        <FieldRow id="ws-authDomain" label="Auth Domain" value={form.website.authDomain} onChange={(v) => setWebsite("authDomain", v)} />
                                        <FieldRow id="ws-projectId" label="Project ID" value={form.website.projectId} onChange={(v) => setWebsite("projectId", v)} />
                                        <FieldRow id="ws-storageBucket" label="Storage Bucket" value={form.website.storageBucket} onChange={(v) => setWebsite("storageBucket", v)} />
                                        <FieldRow id="ws-messagingSenderId" label="Messaging Sender ID" value={form.website.messagingSenderId} onChange={(v) => setWebsite("messagingSenderId", v)} />
                                        <FieldRow id="ws-appId" label="App ID" value={form.website.appId} onChange={(v) => setWebsite("appId", v)} masked />
                                        <FieldRow id="ws-measurementId" label="Measurement ID" value={form.website.measurementId} onChange={(v) => setWebsite("measurementId", v)}
                                            note="Optional — required for Analytics" />
                                    </div>
                                </section>
                            )}

                            {/* ── Project Info ── */}
                            {activeTab === "project" && (
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4 text-left">
                                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center">
                                            <Cpu size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-[var(--text-main)]">Project Hierarchy</h3>
                                            <p className="text-xs text-[var(--text-muted)]">Core identifiers for Firebase server-side operations.</p>
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <FieldRow id="proj-number" label="Project Number (Sender ID)" value={form.projectNumber} onChange={(v) => setForm((p) => ({ ...p, projectNumber: v }))} />
                                        <FieldRow id="proj-id" label="Project ID" value={form.projectId} onChange={(v) => setForm((p) => ({ ...p, projectId: v }))} />
                                        <FieldRow id="proj-storage" label="Cloud Storage Bucket" value={form.storageBucket} onChange={(v) => setForm((p) => ({ ...p, storageBucket: v }))} />
                                    </div>
                                </section>
                            )}

                            {/* ── Mobile Clients ── */}
                            {activeTab === "clients" && (
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4 text-left">
                                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                                            <Smartphone size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-[var(--text-main)]">Mobile Application Registry</h3>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                Operational keys for Android and iOS clients.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-6">
                                        {form.clients.map((client, idx) => {
                                            const isAndroid = client.platform === "android";
                                            return (
                                                <div key={idx} className="bg-[var(--bg-main)] rounded-xl p-5 border border-[var(--border-color)] space-y-4 text-left">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${isAndroid ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"}`}>
                                                            {PLATFORM_LABELS[client.platform]}
                                                        </span>
                                                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--border-color)]`}>
                                                            {APP_LABELS[client.appLabel] ?? client.appLabel}
                                                        </span>
                                                    </div>

                                                    <div className="grid sm:grid-cols-2 gap-4">
                                                        <FieldRow id={`client-${idx}-appId`} label="App ID (Native)" value={client.appId} onChange={(v) => setClient(idx, "appId", v)} masked />
                                                        <FieldRow id={`client-${idx}-apiKey`} label="API Key" value={client.apiKey} onChange={(v) => setClient(idx, "apiKey", v)} masked />
                                                        <FieldRow id={`client-${idx}-pkgName`} label={isAndroid ? "Package Name" : "Bundle ID"} value={client.packageName} onChange={(v) => setClient(idx, "packageName", v)} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* ── Firebase Service Account ── */}
                            {activeTab === "firebase" && (
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4 text-left">
                                        <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center">
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-[var(--text-main)]">FCM Service Account (Server-side)</h3>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                Found in Firebase Console → Project Settings → Service Accounts.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 text-left">
                                        <FieldRow 
                                            id="fb-email" 
                                            label="Client Email" 
                                            value={form.firebase?.clientEmail || ""} 
                                            onChange={(v) => setForm(p => ({ ...p, firebase: { ...p.firebase!, clientEmail: v } }))} 
                                            note="e.g. firebase-adminsdk-xxxxx@project.iam.gserviceaccount.com"
                                        />
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Private Key</label>
                                            <textarea 
                                                className="w-full h-40 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-4 text-[var(--text-main)] font-mono text-[11px] font-semibold outline-none focus:border-orange-500 transition-all"
                                                value={form.firebase?.privateKey || ""}
                                                onChange={(e) => setForm(p => ({ ...p, firebase: { ...p.firebase!, privateKey: e.target.value } }))}
                                                placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                                            />
                                            <p className="text-[10px] text-[var(--text-muted)]/80 ml-0.5 font-medium">Paste the ENTIRE private_key string from your service account JSON file.</p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* ── Google Maps ── */}
                            {activeTab === "maps" && (
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4 text-left">
                                        <div className="w-10 h-10 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center">
                                            <Globe size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-[var(--text-main)]">Google Location Services</h3>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                Keys for Places, Geocoding, and Directions APIs.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4">
                                        <FieldRow id="maps-apiKey" label="Google Cloud API Key" value={form.googleMapsApiKey} onChange={(v) => setForm(p => ({ ...p, googleMapsApiKey: v }))} masked note="Ensure 'Restrictions' in Google Console allow Bundle IDs and Web Domains." />
                                    </div>
                                </section>
                            )}

                            {/* ── Easebuzz ── */}
                            {activeTab === "easebuzz" && (
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4 text-left">
                                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                                            <CreditCard size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-[var(--text-main)]">Easebuzz Payment Gateway</h3>
                                            <p className="text-xs text-[var(--text-muted)]">Configuration for integrated UPI and Card payments.</p>
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <FieldRow id="eb-merchant" label="Merchant Key" value={form.easebuzz.merchantKey} onChange={(v) => setEasebuzz("merchantKey", v)} masked />
                                        <FieldRow id="eb-salt" label="Salt Key" value={form.easebuzz.salt} onChange={(v) => setEasebuzz("salt", v)} masked />
                                        <div className="space-y-1.5 sm:col-span-2 text-left">
                                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Environment</label>
                                            <div className="flex gap-2">
                                                {["test", "prod"].map(env => (
                                                    <button key={env} type="button" onClick={() => setForm(p => ({ ...p, easebuzz: { ...p.easebuzz, env: env as any } }))}
                                                        className={`px-6 h-10 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${form.easebuzz.env === env ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)]"}`}>
                                                        {env}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* ── Email ── */}
                            {activeTab === "email" && (
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4 text-left">
                                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-[var(--text-main)]">SMTP Email Delivery</h3>
                                            <p className="text-xs text-[var(--text-muted)]">Credential vault for transaction and notification emails.</p>
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <FieldRow id="email-host" label="SMTP Host" value={form.email.host} onChange={(v) => setEmail("host", v)} />
                                        <FieldRow id="email-port" label="SMTP Port" value={form.email.port} onChange={(v) => setEmail("port", parseInt(v) || 587)} type="number" />
                                        <FieldRow id="email-user" label="Username / Email" value={form.email.user} onChange={(v) => setEmail("user", v)} />
                                        <FieldRow id="email-pass" label="Password / App Key" value={form.email.pass} onChange={(v) => setEmail("pass", v)} masked />
                                        <FieldRow id="email-from" label="Display 'From' Address" value={form.email.from} onChange={(v) => setEmail("from", v)} note="e.g. A1Care <noreply@a1care247.com>" />
                                    </div>
                                </section>
                            )}

                            {/* ── Twilio ── */}
                            {activeTab === "twilio" && (
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4 text-left">
                                        <div className="w-10 h-10 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center">
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-[var(--text-main)]">Twilio SMS & OTP</h3>
                                            <p className="text-xs text-[var(--text-muted)]">Communications platform for OTP verification.</p>
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <FieldRow id="tw-sid" label="Account SID" value={form.twilio.accountSid} onChange={(v) => setTwilio("accountSid", v)} />
                                        <FieldRow id="tw-token" label="Auth Token" value={form.twilio.authToken} onChange={(v) => setTwilio("authToken", v)} masked />
                                        <FieldRow id="tw-v-sid" label="Verify Service SID" value={form.twilio.verifyServiceSid} onChange={(v) => setTwilio("verifyServiceSid", v)} />
                                    </div>
                                </section>
                            )}

                            {/* ── AWS ── */}
                            {activeTab === "aws" && (
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4 text-left">
                                        <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center">
                                            <Server size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-[var(--text-main)]">AWS S3 Infrastructure</h3>
                                            <p className="text-xs text-[var(--text-muted)]">Object storage for reports, profiles, and service assets.</p>
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <FieldRow id="aws-key" label="Access Key ID" value={form.aws.accessKeyId} onChange={(v) => setAWS("accessKeyId", v)} />
                                        <FieldRow id="aws-secret" label="Secret Access Key" value={form.aws.secretAccessKey} onChange={(v) => setAWS("secretAccessKey", v)} masked />
                                        <FieldRow id="aws-region" label="Region" value={form.aws.region} onChange={(v) => setAWS("region", v)} />
                                        <FieldRow id="aws-bucket" label="Bucket Name" value={form.aws.bucketName} onChange={(v) => setAWS("bucketName", v)} />
                                    </div>
                                </section>
                            )}

                            {/* ── Redis ── */}
                            {activeTab === "redis" && (
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4 text-left">
                                        <div className="w-10 h-10 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center">
                                            <RefreshCw size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-[var(--text-main)]">Redis Caching & Queue</h3>
                                            <p className="text-xs text-[var(--text-muted)]">Performance layer for distributed sessions and locks.</p>
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <FieldRow id="redis-url" label="Public URL" value={form.redis.url} onChange={(v) => setRedis("url", v)} note="e.g. redis://default:pass@host:port" masked />
                                        <div className="grid grid-cols-2 gap-4 sm:col-span-2">
                                            <FieldRow id="redis-host" label="Hostname" value={form.redis.host} onChange={(v) => setRedis("host", v)} />
                                            <FieldRow id="redis-port" label="Port" value={form.redis.port} onChange={(v) => setRedis("port", parseInt(v) || 6379)} type="number" />
                                        </div>
                                        <FieldRow id="redis-pass" label="Auth Password" value={form.redis.pass} onChange={(v) => setRedis("pass", v)} masked />
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
