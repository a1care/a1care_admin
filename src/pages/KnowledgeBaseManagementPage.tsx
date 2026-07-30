import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BookOpen, Plus, Search, Edit2, Trash2, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

    const { data: articles, isLoading } = useQuery({
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
            toast.success(editingId ? "Article updated" : "Article created");
            queryClient.invalidateQueries(["knowledgeBaseAdmin"]);
            closeModal();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to save article");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/knowledge-base/admin/${id}`);
        },
        onSuccess: () => {
            toast.success("Article deleted");
            queryClient.invalidateQueries(["knowledgeBaseAdmin"]);
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
            return toast.error("Title and Content are required");
        }
        saveMutation.mutate({ title, category, targetAudience, content, isActive });
    };

    const filtered = articles?.filter((a: any) => 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.category.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">Knowledge Base</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Manage guides and tutorials for partners.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-orange-500/20 flex items-center gap-2"
                >
                    <Plus size={18} />
                    New Article
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden flex flex-col flex-1">
                <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#F8FAFC] sticky top-0 z-10 border-b border-[var(--border-color)]">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Title</th>
                                <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Audience</th>
                                <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)]">
                                        <BookOpen size={40} className="mx-auto mb-3 opacity-20" />
                                        <p>No articles found.</p>
                                    </td>
                                </tr>
                            ) : filtered.map((article: any) => (
                                <tr key={article._id} className="hover:bg-[#F8FAFC] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-[var(--text-main)] text-sm">{article.title}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">{article.category}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100">{article.targetAudience}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${article.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {article.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(article)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if(window.confirm('Delete this article?')) deleteMutation.mutate(article._id);
                                                }} 
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-main)]">
                            <h2 className="text-xl font-bold text-[var(--text-main)]">
                                {editingId ? "Edit Article" : "Create New Article"}
                            </h2>
                            <button onClick={closeModal} className="text-[var(--text-muted)] hover:text-gray-800 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">Article Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-white border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 shadow-sm"
                                    placeholder="e.g. How to use the wallet"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">Category</label>
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-white border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 shadow-sm"
                                        placeholder="e.g. General, Booking, Wallet"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">Target Audience</label>
                                    <select
                                        value={targetAudience}
                                        onChange={(e) => setTargetAudience(e.target.value)}
                                        className="w-full bg-white border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 shadow-sm"
                                    >
                                        <option value="All">All Partners</option>
                                        <option value="Doctor">Doctors Only</option>
                                        <option value="Nurse">Nurses Only</option>
                                        <option value="Ambulance">Ambulance Only</option>
                                        <option value="Rental">Rentals Only</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5 flex justify-between">
                                    <span>Content (HTML/Markdown)</span>
                                </label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full h-64 bg-white border border-[var(--border-color)] rounded-xl p-4 text-sm font-mono text-[var(--text-main)] focus:outline-none focus:border-orange-500 resize-y shadow-sm"
                                    placeholder="<h2>Heading</h2><p>Write your article here...</p>"
                                />
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                </div>
                                <span className="text-sm font-semibold text-[var(--text-main)]">Article is Active</span>
                            </label>
                        </div>

                        <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-main)] flex justify-end gap-3">
                            <button onClick={closeModal} className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saveMutation.isLoading}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors shadow-sm shadow-orange-500/20 flex items-center gap-2"
                            >
                                {saveMutation.isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Article
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
