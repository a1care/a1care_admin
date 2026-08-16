import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ChevronLeft, Save, Loader2, AlertCircle, LayoutGrid, Users } from "lucide-react";
import { toast } from "sonner";

interface KBArticle {
    _id: string;
    title: string;
    category: string;
    targetAudience: string;
    content: string;
    isActive: boolean;
}

export default function KnowledgeBaseFormPage() {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("General");
    const [targetAudience, setTargetAudience] = useState("All");
    const [content, setContent] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [initialized, setInitialized] = useState(false);

    const { data: articles, isLoading: isFetching } = useQuery<KBArticle[]>({
        queryKey: ["knowledgeBaseAdmin"],
        queryFn: async () => {
            const res = await api.get("/knowledge-base/admin");
            return res.data.data;
        },
        enabled: isEdit,
    });

    const existingArticle = isEdit ? articles?.find((a) => a._id === id) : null;

    useEffect(() => {
        if (isEdit && existingArticle && !initialized) {
            setTitle(existingArticle.title);
            setCategory(existingArticle.category);
            setTargetAudience(existingArticle.targetAudience);
            setContent(existingArticle.content);
            setIsActive(existingArticle.isActive);
            setInitialized(true);
        }
    }, [isEdit, existingArticle, initialized]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const payload = { title, category, targetAudience, content, isActive };
            if (isEdit) {
                const res = await api.put(`/knowledge-base/admin/${id}`, payload);
                return res.data;
            } else {
                const res = await api.post("/knowledge-base/admin", payload);
                return res.data;
            }
        },
        onSuccess: () => {
            toast.success(isEdit ? "Article updated successfully!" : "Article published successfully!");
            queryClient.invalidateQueries({ queryKey: ["knowledgeBaseAdmin"] });
            navigate("/knowledge-base");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to save article. Please try again.");
        },
    });

    const handleSave = () => {
        if (!title.trim() || !content.trim()) {
            return toast.error("Please provide both a Title and Content for the article.");
        }
        saveMutation.mutate();
    };

    if (isEdit && isFetching && !initialized) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-[var(--text-muted)]">
                <Loader2 className="animate-spin mb-4 text-blue-500" size={32} />
                <p className="text-sm font-semibold">Loading Article...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Banner */}
            <header className="flex flex-col gap-2 bg-gradient-to-br from-[var(--primary)] to-emerald-800 p-6 md:p-8 rounded-2xl shadow-lg shadow-emerald-900/10 border-0 relative overflow-hidden text-left items-start">
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 w-full">
                    <button
                        onClick={() => navigate("/knowledge-base")}
                        className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors mb-3"
                    >
                        <ChevronLeft size={12} /> Back to Knowledge Base
                    </button>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1">
                        {isEdit ? "Edit Article" : "Create Article"}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                        <p className="text-xs md:text-sm font-medium text-emerald-50 tracking-wide opacity-90">
                            Home &bull; Resources &bull; Knowledge Base &bull; {isEdit ? "Edit" : "New Article"}
                        </p>
                    </div>
                </div>
            </header>

            {/* Form Card */}
            <div className="w-full max-w-4xl bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                <div className="px-6 sm:px-8 py-5 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                    <h3 className="text-base font-bold text-[var(--text-main)]">Article Configuration</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Fill in the details below to {isEdit ? "update" : "publish"} this knowledge base article.
                    </p>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                    {/* Info Banner */}
                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 flex gap-3">
                        <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={18} />
                        <div>
                            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">Content Formatting</h4>
                            <p className="text-xs text-blue-700 dark:text-blue-400/80 mt-1 font-medium leading-relaxed">
                                Use HTML or Markdown for the article body. The content will be rendered natively in the partner apps. Ensure any embedded links are valid and properly structured.
                            </p>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-[var(--text-main)]">
                            Article Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            placeholder="e.g. Navigating the Wallet Dashboard"
                        />
                    </div>

                    {/* Category + Audience */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-[var(--text-main)]">Category Section</label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                placeholder="e.g. Booking, Wallet, Profile"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-[var(--text-main)]">Target Audience</label>
                            <select
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                            >
                                <option value="All">All Partners &amp; Users</option>
                                <option value="Doctor">Doctors Only</option>
                                <option value="Nurse">Nurses Only</option>
                                <option value="Ambulance">Ambulance Providers</option>
                                <option value="Rental">Equipment Rentals</option>
                            </select>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-[var(--text-main)]">
                            Body Content <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-80 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 text-sm font-mono font-medium text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-y leading-relaxed"
                            placeholder={"<h2>How to receive payments</h2>\n<p>Start writing the comprehensive guide here...</p>"}
                        />
                        <p className="text-[11px] text-[var(--text-muted)]">Supports HTML tags for rich formatting.</p>
                    </div>

                    {/* Publish Toggle + Actions */}
                    <div className="pt-6 mt-2 border-t border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-[var(--bg-main)] rounded-xl transition-colors border border-transparent hover:border-[var(--border-color)]">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                                <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-[var(--text-main)]">{isActive ? "Published State" : "Draft State"}</span>
                                <span className="text-[10px] font-semibold text-[var(--text-muted)]">{isActive ? "Visible to target audience" : "Hidden from end users"}</span>
                            </div>
                        </label>

                        <div className="flex gap-3 shrink-0">
                            <button
                                onClick={() => navigate("/knowledge-base")}
                                className="h-11 px-6 rounded-xl border border-[var(--border-color)] text-[var(--text-main)] font-semibold text-sm hover:bg-[var(--bg-main)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saveMutation.isPending}
                                className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                            >
                                {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {isEdit ? "Update Article" : "Publish Article"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
