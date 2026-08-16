import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BookOpen, Plus, Search, Edit2, Trash2, Loader2, BookType, LayoutGrid, Users, CheckCircle2, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/context/ConfirmationContext";
import { TableSkeleton } from "@/components/ui/Skeletons";

export default function KnowledgeBaseManagementPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const confirm = useConfirm();
    const [searchTerm, setSearchTerm] = useState("");

    const { data: articles, isLoading, isFetching } = useQuery({
        queryKey: ["knowledgeBaseAdmin"],
        queryFn: async () => {
            const res = await api.get("/knowledge-base/admin");
            return res.data.data;
        }
    });



    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/knowledge-base/admin/${id}`);
        },
        onSuccess: () => {
            toast.success("Article removed from knowledge base.");
            queryClient.invalidateQueries({ queryKey: ["knowledgeBaseAdmin"] });
        }
    });

    const filtered = articles?.filter((a: any) =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6 animate-in">
            {/* ── Page Header ── */}
            <header className="flex flex-col gap-2 bg-gradient-to-br from-[var(--primary)] to-emerald-800 p-6 md:p-8 rounded-2xl shadow-lg shadow-emerald-900/10 border-0 relative overflow-hidden text-left items-start">
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1">Knowledge Base</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                <p className="text-xs md:text-sm font-medium text-emerald-50 tracking-wide opacity-90">
                                    Home &bull; Resources &bull; Knowledge Base Management
                                </p>
                            </div>
                        </div>
                        <button onClick={() => navigate("/knowledge-base/create")} className="flex items-center gap-1.5 h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shrink-0">
                            <Plus size={16} />
                            <span>Create Article</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Search & Filter Toolbar ── */}
            <div className="flex items-center gap-3 w-full max-w-2xl">
                <div style={{ position: "relative", flex: 1 }}>
                    {isFetching ? (
                        <Loader2 size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#3b82f6", animation: "spin 1s linear infinite", zIndex: 10 }} />
                    ) : (
                        <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", zIndex: 10 }} />
                    )}
                    <input
                        type="text"
                        placeholder="Search articles by title or category..."
                        className="font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: "100%", height: 42, borderRadius: 12, paddingLeft: 38, paddingRight: 14,
                            background: "var(--card-bg)", border: "1.5px solid var(--border-color)",
                            fontSize: "0.875rem", color: "var(--text-main)", outline: "none",
                            fontFamily: "inherit", boxSizing: "border-box"
                        }}
                    />
                </div>
            </div>

            {/* ── Articles Table Card ── */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookType size={16} className="text-blue-500" />
                        <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">Published Resources</h3>
                    </div>
                    <div className="text-xs font-semibold text-[var(--text-muted)] bg-[var(--card-bg)] px-2.5 py-1 rounded-lg border border-[var(--border-color)]">
                        {filtered.length} {filtered.length === 1 ? 'Article' : 'Articles'} Found
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                <th className="py-3 px-5">Article Title</th>
                                <th className="py-3 px-5">Category</th>
                                <th className="py-3 px-5">Audience Target</th>
                                <th className="py-3 px-5">Status</th>
                                <th className="py-3 px-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-0">
                                        <TableSkeleton columns={5} rows={5} showHeader={false} />
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center mx-auto text-[var(--text-muted)] shadow-sm">
                                                <BookOpen size={24} />
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-[var(--text-main)]">No articles found</p>
                                                <p className="text-sm font-medium text-[var(--text-muted)] mt-1">Try adjusting your search or create a new article.</p>
                                            </div>
                                            {searchTerm && (
                                                <button 
                                                    onClick={() => setSearchTerm("")}
                                                    className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider"
                                                >
                                                    Clear Search Filters
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((article: any) => (
                                    <tr key={article._id} className="hover:bg-[var(--bg-main)] transition-colors group cursor-pointer" onClick={() => navigate(`/knowledge-base/${article._id}`)}>
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-[var(--text-main)] leading-snug">{article.title}</div>
                                                    <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                                                        ID: {article._id.substring(0, 8)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-1.5">
                                                <LayoutGrid size={14} className="text-[var(--text-muted)]" />
                                                <span className="text-xs font-bold text-[var(--text-main)]">{article.category}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg text-xs font-semibold shadow-sm">
                                                <Users size={12} className="text-blue-500" />
                                                {article.targetAudience}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm
                                                ${article.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${article.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                {article.isActive ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 text-right">
                                            <div className="flex justify-end gap-2 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/knowledge-base/${article._id}`); }}
                                                    className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--card-bg)] hover:text-blue-600 rounded-lg transition-colors shadow-sm"
                                                    title="View Article"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/knowledge-base/edit/${article._id}`); }} 
                                                    className="w-8 h-8 flex items-center justify-center text-blue-600 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-600 hover:text-white rounded-lg transition-colors shadow-sm"
                                                    title="Edit Article"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button 
                                                    onClick={async (e) => { 
                                                        e.stopPropagation(); 
                                                        if(await confirm({ title: "Delete Article", message: "Are you sure you want to delete this article? This action cannot be undone.", confirmText: "Delete", type: "danger" })) {
                                                            deleteMutation.mutate(article._id); 
                                                        }
                                                    }} 
                                                    className="w-8 h-8 flex items-center justify-center text-rose-600 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-600 hover:text-white rounded-lg transition-colors shadow-sm"
                                                    title="Delete Article"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
