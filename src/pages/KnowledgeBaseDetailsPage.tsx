import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    ChevronLeft, BookOpen, LayoutGrid, Users, FileText,
    Edit2, Trash2, CheckCircle2, XCircle, Calendar, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface KBArticle {
    _id: string;
    title: string;
    category: string;
    targetAudience: string;
    content: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

export default function KnowledgeBaseDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const { data: articles, isLoading } = useQuery<KBArticle[]>({
        queryKey: ["knowledgeBaseAdmin"],
        queryFn: async () => {
            const res = await api.get("/knowledge-base/admin");
            return res.data.data;
        },
    });

    const article = articles?.find((a) => a._id === id);

    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/knowledge-base/admin/${id}`),
        onSuccess: () => {
            toast.success("Article deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["knowledgeBaseAdmin"] });
            navigate("/knowledge-base");
        },
        onError: () => toast.error("Failed to delete article."),
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-[var(--text-muted)]">
                <Loader2 className="animate-spin mb-4 text-blue-500" size={32} />
                <p className="text-sm font-semibold">Loading Article...</p>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-[var(--text-muted)]">
                <div className="w-16 h-16 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center">
                    <BookOpen size={28} />
                </div>
                <p className="text-base font-bold text-[var(--text-main)]">Article Not Found</p>
                <button onClick={() => navigate("/knowledge-base")} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                    <ChevronLeft size={12} /> Back to Knowledge Base
                </button>
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

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1 leading-snug max-w-2xl">
                                {article.title}
                            </h1>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                <p className="text-xs md:text-sm font-medium text-emerald-50 tracking-wide opacity-90">
                                    Home &bull; Resources &bull; Knowledge Base &bull; Article Detail
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => navigate(`/knowledge-base/edit/${article._id}`)}
                                className="flex items-center gap-1.5 h-9 px-4 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all"
                            >
                                <Edit2 size={13} /> Edit
                            </button>
                            <button
                                onClick={() => setConfirmDelete(true)}
                                className="flex items-center gap-1.5 h-9 px-4 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all"
                            >
                                <Trash2 size={13} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Meta Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        <LayoutGrid size={12} className="text-blue-500" /> Category
                    </div>
                    <p className="text-sm font-bold text-[var(--text-main)]">{article.category}</p>
                </div>
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        <Users size={12} className="text-blue-500" /> Audience
                    </div>
                    <p className="text-sm font-bold text-[var(--text-main)]">{article.targetAudience}</p>
                </div>
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        <FileText size={12} className="text-blue-500" /> Status
                    </div>
                    <div className={`inline-flex items-center gap-1.5 text-sm font-bold ${article.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {article.isActive ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                        {article.isActive ? "Published" : "Draft"}
                    </div>
                </div>
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        <Calendar size={12} className="text-blue-500" /> Created
                    </div>
                    <p className="text-sm font-bold text-[var(--text-main)]">
                        {new Date(article.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                </div>
            </div>

            {/* Article Content */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex items-center gap-2">
                    <BookOpen size={16} className="text-blue-500" />
                    <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">Article Content</h3>
                </div>
                <div className="p-6 sm:p-8">
                    {article.content ? (
                        <div
                            className="prose prose-sm dark:prose-invert max-w-none text-[var(--text-main)] leading-relaxed font-medium text-sm"
                            dangerouslySetInnerHTML={{ __html: article.content }}
                        />
                    ) : (
                        <p className="text-sm text-[var(--text-muted)] italic">No content available for this article.</p>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDelete(false)} />
                    <div className="relative w-full max-w-sm bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Confirm Deletion</p>
                            <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">Delete Article?</h3>
                        </div>
                        <div className="p-6 text-center space-y-4">
                            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto border border-red-200">
                                <Trash2 size={20} />
                            </div>
                            <p className="text-sm text-[var(--text-muted)] font-medium">
                                This will permanently remove <strong className="text-[var(--text-main)]">"{article.title}"</strong> from the knowledge base.
                            </p>
                        </div>
                        <div className="px-6 py-4 border-t border-[var(--border-color)] flex gap-2 bg-[var(--bg-main)]">
                            <button className="flex-1 h-9 border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[var(--bg-main)] transition-all" onClick={() => setConfirmDelete(false)}>Cancel</button>
                            <button
                                className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                disabled={deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate()}
                            >
                                {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
