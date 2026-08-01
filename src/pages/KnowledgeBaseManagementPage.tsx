import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BookOpen, Plus, Search, Edit2, Trash2, Save, X, Loader2, BookType, LayoutGrid, Users, CheckCircle2, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/Skeletons";

export default function KnowledgeBaseManagementPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("General");
    const [targetAudience, setTargetAudience] = useState("All");
    const [content, setContent] = useState("");
    const [isActive, setIsActive] = useState(true);

    const { data: articles, isLoading, isFetching } = useQuery({
        queryKey: ["knowledgeBaseAdmin"],
        queryFn: async () => {
            const res = await api.get("/knowledge-base/admin");
            return res.data.data;
        }
    });

    const saveMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (editingId) {
                const res = await api.put(`/knowledge-base/admin/${editingId}`, payload);
                return res.data;
            } else {
                const res = await api.post("/knowledge-base/admin", payload);
                return res.data;
            }
        },
        onSuccess: () => {
            toast.success(editingId ? "Article updated successfully!" : "Article published successfully!");
            queryClient.invalidateQueries({ queryKey: ["knowledgeBaseAdmin"] });
            closeModal();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to save article. Please try again.");
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

    const openCreate = () => {
        setEditingId(null);
        setTitle("");
        setCategory("General");
        setTargetAudience("All");
        setContent("");
        setIsActive(true);
        setIsModalOpen(true);
    };

    const openEdit = (article: any) => {
        setEditingId(article._id);
        setTitle(article.title);
        setCategory(article.category);
        setTargetAudience(article.targetAudience);
        setContent(article.content);
        setIsActive(article.isActive);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSave = () => {
        if (!title.trim() || !content.trim()) {
            return toast.error("Please provide both a Title and Content for the article.");
        }
        saveMutation.mutate({ title, category, targetAudience, content, isActive });
    };

    const filtered = articles?.filter((a: any) => 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.category.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6 animate-in">
            {/* ── Page Header ── */}
            <header className="flex flex-col gap-2 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden text-left items-start">
                <div className="relative z-10 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">Knowledge Base</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">
                                    Home • Resources • Knowledge Base Management
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-1.5 h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shrink-0"
                        >
                            <Plus size={16} />
                            <span>Create Article</span>
                        </button>
                    </div>
                </div>
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-12 right-32 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
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
                                    <tr key={article._id} className="hover:bg-[var(--bg-main)] transition-colors group">
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
                                                    onClick={() => openEdit(article)} 
                                                    className="w-8 h-8 flex items-center justify-center text-blue-600 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-600 hover:text-white rounded-lg transition-colors shadow-sm"
                                                    title="Edit Article"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if(window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) deleteMutation.mutate(article._id);
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

            {/* ── Edit/Create Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--border-color)]">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-main)]">
                            <div>
                                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Knowledge Base Editor</p>
                                <h2 className="text-xl font-black text-[var(--text-main)]">
                                    {editingId ? "Edit Resource Article" : "Create New Resource"}
                                </h2>
                            </div>
                            <button onClick={closeModal} className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--border-color)] hover:text-[var(--text-main)] transition-colors shadow-sm">
                                <X size={18} />
                            </button>
                        </div>
                        
                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            
                            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 flex gap-3 text-left">
                                <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={18} />
                                <div>
                                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">Content Formatting</h4>
                                    <p className="text-xs text-blue-700 dark:text-blue-400/80 mt-1 font-medium leading-relaxed">
                                        Use HTML or Markdown for the article body. The content will be rendered natively in the partner apps. Ensure any embedded links are valid and properly structured.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Article Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-semibold text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                                        placeholder="e.g. Navigating the Wallet Dashboard"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Category Section</label>
                                        <div className="relative">
                                            <LayoutGrid size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                                            <input
                                                type="text"
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-3 text-sm font-semibold text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                                                placeholder="e.g. Booking, Wallet, Profile"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Target Audience</label>
                                        <div className="relative">
                                            <Users size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                                            <select
                                                value={targetAudience}
                                                onChange={(e) => setTargetAudience(e.target.value)}
                                                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-3 text-sm font-semibold text-[var(--text-main)] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm appearance-none cursor-pointer"
                                            >
                                                <option value="All">All Partners & Users</option>
                                                <option value="Doctor">Doctors Only</option>
                                                <option value="Nurse">Nurses Only</option>
                                                <option value="Ambulance">Ambulance Providers</option>
                                                <option value="Rental">Equipment Rentals</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                                        Body Content
                                    </label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="w-full h-72 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 text-sm font-mono font-medium text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-y shadow-sm leading-relaxed"
                                        placeholder="<h2>How to receive payments</h2>&#10;<p>Start writing the comprehensive guide here...</p>"
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-5 border-t border-[var(--border-color)] bg-[var(--bg-main)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-[var(--card-bg)] rounded-lg transition-colors border border-transparent hover:border-[var(--border-color)]">
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
                                    <span className="text-sm font-bold text-[var(--text-main)]">{isActive ? 'Published State' : 'Draft State'}</span>
                                    <span className="text-[10px] font-semibold text-[var(--text-muted)]">{isActive ? 'Visible to target audience' : 'Hidden from end users'}</span>
                                </div>
                            </label>

                            <div className="flex gap-3 shrink-0">
                                <button 
                                    onClick={closeModal} 
                                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-[var(--text-main)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] transition-all uppercase tracking-wider shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saveMutation.isPending}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 min-w-[140px]"
                                >
                                    {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {editingId ? "Update Article" : "Publish Article"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
