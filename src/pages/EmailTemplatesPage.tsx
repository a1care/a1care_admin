import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import {
    Mail, Search, CheckCircle2,
    X, Loader2, Edit3, Settings2,
    Eye
} from "lucide-react";
import JoditEditor from 'jodit-react';

interface EmailTemplate {
    _id: string;
    name: string;
    code: string;
    subject: string;
    htmlBody: string;
    availableVariables: string[];
    updatedAt: string;
}

export function EmailTemplatesPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [editSubject, setEditSubject] = useState("");
    const [editHtml, setEditHtml] = useState("");

    const { data: templates = [], isLoading } = useQuery({
        queryKey: ["admin_email_templates"],
        queryFn: async () => {
            const res = await api.get("/admin/email-templates");
            return res.data.data;
        }
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!editingTemplate) return;
            const res = await api.put(`/admin/email-templates/${editingTemplate._id}`, {
                subject: editSubject,
                htmlBody: editHtml
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_email_templates"] });
            toast.success("Email template updated successfully");
            setEditingTemplate(null);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to update template");
        }
    });

    const handleEdit = (template: EmailTemplate) => {
        setEditingTemplate(template);
        setEditSubject(template.subject);
        setEditHtml(template.htmlBody);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate();
    };

    const filteredTemplates = templates.filter((t: EmailTemplate) => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Page Header */}
            <header className="flex items-center justify-between gap-4 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1 flex items-center gap-3">
                        <Mail className="text-blue-500" size={28} />
                        Email Templates
                    </h1>
                    <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">
                        Home • Communication • Email Templates
                    </p>
                </div>
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            </header>

            {/* List View */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between gap-3">
                    <div style={{ position: "relative", width: "320px" }}>
                        <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: "100%", height: 42, borderRadius: 12, paddingLeft: 38, paddingRight: 14,
                                background: "var(--card-bg)", border: "1.5px solid var(--border-color)",
                                fontSize: "0.875rem", color: "var(--text-main)", outline: "none"
                            }}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                <th className="py-3 px-4 w-12">#</th>
                                <th className="py-3 px-4">Template Name</th>
                                <th className="py-3 px-4">Subject Line</th>
                                <th className="py-3 px-4">Last Updated</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Loading templates...</p>
                                    </td>
                                </tr>
                            ) : filteredTemplates.length > 0 ? (
                                filteredTemplates.map((template: EmailTemplate, idx: number) => (
                                    <tr key={template._id} className="hover:bg-[var(--bg-main)] transition-colors">
                                        <td className="py-3.5 px-4 text-xs font-semibold text-[var(--text-muted)]">{idx + 1}</td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-semibold text-sm text-[var(--text-main)]">{template.name}</div>
                                            <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{template.code}</div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="text-sm font-medium text-[var(--text-main)] truncate max-w-sm" title={template.subject}>
                                                {template.subject}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="text-xs text-[var(--text-muted)]">
                                                {new Date(template.updatedAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <button
                                                onClick={() => handleEdit(template)}
                                                className="h-8 px-3 rounded-lg text-xs font-semibold border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all inline-flex items-center gap-1.5"
                                            >
                                                <Edit3 size={13} /> Edit HTML
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-sm font-semibold text-[var(--text-muted)]">
                                        No templates found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
                    <form onSubmit={handleSave} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[24px] shadow-2xl w-full max-w-[1400px] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-[90vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Settings2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight text-[var(--text-main)] mb-0.5">{editingTemplate.name}</h3>
                                    <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Template Editor & Live Preview</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingTemplate(null)}
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-slate-100 hover:text-slate-900 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body - Split View */}
                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[var(--bg-main)]">
                            {/* Editor Column */}
                            <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-[var(--border-color)] bg-[var(--card-bg)] relative">
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                    <div>
                                        <label className="block text-[11px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Email Subject Line</label>
                                        <input
                                            type="text"
                                            required
                                            value={editSubject}
                                            onChange={(e) => setEditSubject(e.target.value)}
                                            className="w-full h-12 px-4 bg-[var(--bg-main)] border-2 border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-main)] outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>

                                    <div className="flex flex-col flex-1 min-h-[500px]">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[11px] font-black text-[var(--text-muted)] uppercase tracking-wider">Rich Text Body</label>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg">
                                                Available Variables: {editingTemplate.availableVariables.join(', ')}
                                            </div>
                                        </div>
                                        <div className="flex-1 relative rounded-xl overflow-hidden border-2 border-[var(--border-color)] bg-white focus-within:border-blue-500 transition-colors">
                                            <JoditEditor
                                                value={editHtml}
                                                config={{
                                                    readonly: false,
                                                    height: 450,
                                                    toolbarAdaptive: false,
                                                    buttons: "bold,italic,underline,strikethrough,ul,ol,font,fontsize,paragraph,lineHeight,superscript,subscript,classSpan,file,image,video,spellcheck,cut,copy,paste,selectall,copyformat,align,undo,redo,hr,eraser,copyformat,symbol,fullsize,print,source"
                                                }}
                                                onBlur={newContent => setEditHtml(newContent)}
                                                onChange={newContent => setEditHtml(newContent)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview Column */}
                            <div className="w-full lg:w-1/2 bg-slate-100 dark:bg-slate-900/50 flex flex-col relative">
                                <div className="absolute top-4 right-6 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center gap-2 z-10">
                                    <Eye size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Final Output Preview</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar flex items-start justify-center">
                                    {/* Simulated Email Client View */}
                                    <div className="w-full max-w-[600px] bg-white rounded-[32px] shadow-2xl overflow-hidden pointer-events-none scale-[0.85] origin-top">
                                        <div style={{ background: "linear-gradient(135deg, #0D2E6E 0%, #1A6FDB 100%)", padding: "60px 40px", textAlign: "center" }}>
                                            <h1 style={{ color: "#ffffff", margin: 0, fontSize: "32px", fontWeight: 900, letterSpacing: "-0.03em" }}>
                                                A1Care <span style={{ color: "#7FCFFF" }}>24/7</span>
                                            </h1>
                                            <div style={{ height: "2px", width: "40px", backgroundColor: "rgba(255,255,255,0.2)", margin: "20px auto" }}></div>
                                            <p style={{ color: "rgba(255,255,255,0.8)", margin: 0, fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                                                Premium Healthcare at Home
                                            </p>
                                        </div>
                                        <div 
                                            style={{ padding: "60px 40px", color: "#1E293B", lineHeight: "1.8", minHeight: "200px" }}
                                            dangerouslySetInnerHTML={{ __html: editHtml }}
                                        />
                                        <div style={{ backgroundColor: "#F8FAFC", padding: "40px", textAlign: "center", borderTop: "1px solid #E2E8F0" }}>
                                            <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0, lineHeight: "20px" }}>
                                                © {new Date().getFullYear()} A1Care 24/7. All rights reserved.<br/>
                                                📍 Hitech City, Hyderabad, India
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--card-bg)] flex justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setEditingTemplate(null)}
                                className="h-12 px-6 rounded-xl text-sm font-black text-[var(--text-muted)] hover:bg-slate-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={updateMutation.isPending}
                                className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black tracking-wide flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 hover:scale-105 active:scale-95"
                            >
                                {updateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                Save Template
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
