import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FileText, ShieldAlert, HelpCircle, Save, Plus, Trash2, Edit2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link, useParams } from "react-router-dom";
import ReactQuill from 'react-quill-new';
import { FormSkeleton } from "@/components/ui/Skeletons";
import 'react-quill-new/dist/quill.snow.css';

type AppTarget = "CUSTOMER" | "PARTNER";

export default function CMSManagementPage() {
    const queryClient = useQueryClient();
    const { type } = useParams<{ type: string }>();
    const activeTab = type === "privacy" ? "PRIVACY" : type === "faq" ? "FAQ" : "TERMS";
    const [targetApp, setTargetApp] = useState<AppTarget>("CUSTOMER");

    const [content, setContent] = useState("");
    const [faqs, setFaqs] = useState<{ question: string; answer: string; isActive: boolean }[]>([]);

    const { data: cmsList, isLoading } = useQuery({
        queryKey: ["cmsList", activeTab],
        queryFn: async () => {
            const endpoint = activeTab === "PRIVACY" ? "/cms/admin/privacy" 
                           : activeTab === "TERMS" ? "/cms/admin/terms" 
                           : "/cms/admin/faq";
            const res = await api.get(endpoint);
            return res.data.data;
        }
    });

    // Helper to extract content for the active tab
    const loadContentIntoState = (allData: any[], tab: string, app: AppTarget) => {
        const item = allData?.find((d: any) => d.type === tab && d.targetApp === app);
        if (item) {
            setContent(item.content || "");
            setFaqs(item.faqs || []);
        } else {
            setContent("");
            setFaqs([]);
        }
    };

    useEffect(() => {
        if (cmsList) {
            loadContentIntoState(cmsList, activeTab, targetApp);
        }
    }, [cmsList, activeTab, targetApp]);

    const saveMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await api.post("/cms/admin", payload);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Content saved successfully", {
                description: `Your ${activeTab === 'FAQ' ? 'FAQs' : 'Legal Document'} have been updated for the ${targetApp === 'CUSTOMER' ? 'Customer' : 'Partner'} App.`,
            });
            queryClient.invalidateQueries({ queryKey: ["cmsList"] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to save content");
        }
    });

    const handleAppChange = (app: AppTarget) => {
        setTargetApp(app);
    };

    const handleSave = () => {
        saveMutation.mutate({
            type: activeTab,
            targetApp,
            content: activeTab !== "FAQ" ? content : undefined,
            faqs: activeTab === "FAQ" ? faqs : undefined
        });
    };

    // FAQ Handlers
    const addFaq = () => {
        setFaqs([...faqs, { question: "", answer: "", isActive: true }]);
    };
    const updateFaq = (index: number, key: "question" | "answer", val: string) => {
        const newFaqs = [...faqs];
        if (key === "question") newFaqs[index].question = val;
        if (key === "answer") newFaqs[index].answer = val;
        setFaqs(newFaqs);
    };
    const removeFaq = (index: number) => {
        setFaqs(faqs.filter((_, i) => i !== index));
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-[var(--bg-main)] p-8">
                <FormSkeleton />
            </div>
        );
    }

    const titleMap = {
        TERMS: "Terms & Conditions",
        PRIVACY: "Privacy Policy",
        FAQ: "Frequently Asked Questions"
    };

    const iconMap = {
        TERMS: <FileText className="text-blue-500" size={24} />,
        PRIVACY: <ShieldAlert className="text-purple-500" size={24} />,
        FAQ: <HelpCircle className="text-green-500" size={24} />
    };

    return (
        <div className="w-full py-8 px-4 sm:px-6 lg:px-8 min-h-full flex flex-col space-y-6 animate-in">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/50 relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center border border-gray-100 shrink-0">
                        {iconMap[activeTab as keyof typeof iconMap]}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Content Management System
                            </p>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                            {titleMap[activeTab as keyof typeof titleMap]}
                        </h1>
                    </div>
                </div>

                <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 left-20 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />
            </header>

            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col relative z-10">
                <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                            <Edit2 size={14} className="text-blue-600" />
                        </div>
                        <h2 className="font-bold text-gray-800 tracking-wide text-sm">
                            Editing <span className="text-blue-600">{targetApp === "CUSTOMER" ? "Customer" : "Partner"}</span> Version
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex bg-gray-100/80 p-1 rounded-xl shadow-inner border border-gray-200/60">
                            {(["CUSTOMER", "PARTNER"] as AppTarget[]).map((app) => (
                                <button
                                    key={app}
                                    onClick={() => handleAppChange(app)}
                                    className={`relative px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
                                        targetApp === app 
                                            ? "text-blue-700 shadow-sm" 
                                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                                    }`}
                                >
                                    {targetApp === app && (
                                        <span className="absolute inset-0 bg-white rounded-lg shadow-sm border border-gray-200/50" style={{ zIndex: -1 }} />
                                    )}
                                    {app === "CUSTOMER" ? "Customer App" : "Partner App"}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saveMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 disabled:opacity-70 disabled:hover:bg-blue-600 min-w-[160px] justify-center"
                        >
                            {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {saveMutation.isPending ? "Saving..." : "Publish Changes"}
                        </button>
                    </div>
                </div>

                <div className="p-8 bg-[#FAFBFC]">
                    {activeTab !== "FAQ" ? (
                        <div className="h-full flex flex-col w-full">
                            <div className="flex items-center justify-between mb-4">
                                <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                    <FileText size={14} />
                                    Document Editor
                                </label>
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                    Rich Text Mode Active
                                </span>
                            </div>
                            
                            <div className="bg-white rounded-2xl border border-gray-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-400/10 transition-all shadow-sm" style={{ minHeight: '600px' }}>
                                <ReactQuill 
                                    theme="snow" 
                                    value={content} 
                                    onChange={setContent}
                                    className="border-none"
                                    style={{ border: 'none' }}
                                    modules={{
                                        toolbar: [
                                            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                                            ['bold', 'italic', 'underline', 'strike'],
                                            [{ 'color': [] }, { 'background': [] }],
                                            ['blockquote', 'code-block'],
                                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                            [{ 'align': [] }],
                                            ['link', 'image'],
                                            ['clean']
                                        ]
                                    }}
                                />
                            </div>
                            <div className="flex items-center gap-2 mt-4 text-gray-400">
                                <ShieldAlert size={14} />
                                <p className="text-xs font-semibold">Changes made here will instantly reflect on the native mobile applications.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-8 pb-10">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 tracking-tight">Manage Questions</h3>
                                    <p className="text-sm font-medium text-gray-500 mt-1">Add, edit, or remove frequently asked questions.</p>
                                </div>
                                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                                    {faqs.length} {faqs.length === 1 ? 'Question' : 'Questions'}
                                </span>
                            </div>

                            {faqs.map((faq, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative group hover:border-blue-300 hover:shadow-md transition-all">
                                    <button 
                                        onClick={() => removeFaq(idx)}
                                        className="absolute -top-3 -right-3 w-8 h-8 bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                                        title="Delete Question"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-black text-sm flex items-center justify-center border border-blue-100">
                                            Q{idx + 1}
                                        </div>
                                        <div className="h-px flex-1 bg-gray-100"></div>
                                    </div>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Question Title</label>
                                            <input
                                                type="text"
                                                value={faq.question}
                                                onChange={(e) => updateFaq(idx, "question", e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:font-medium placeholder:text-gray-400"
                                                placeholder="e.g. How do I reset my password?"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Detailed Answer</label>
                                            <textarea
                                                value={faq.answer}
                                                onChange={(e) => updateFaq(idx, "answer", e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-y min-h-[120px] placeholder:font-medium placeholder:text-gray-400 leading-relaxed"
                                                placeholder="Provide a clear and concise answer here..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            <button
                                onClick={addFaq}
                                className="w-full py-5 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={18} />
                                Add New Question Block
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <style>{`
                .quill {
                    display: block;
                }
                .ql-toolbar.ql-snow {
                    border: none !important;
                    border-bottom: 1px solid #e5e7eb !important;
                    background: #f8fafc;
                    padding: 12px 16px !important;
                    font-family: inherit;
                    border-top-left-radius: 1rem;
                    border-top-right-radius: 1rem;
                }
                .ql-container.ql-snow {
                    border: none !important;
                    font-family: inherit;
                    font-size: 0.95rem;
                }
                .ql-editor {
                    padding: 2rem !important;
                    min-height: 400px;
                    height: auto;
                    line-height: 1.7;
                    color: #374151;
                }
                .ql-editor h1, .ql-editor h2, .ql-editor h3 {
                    color: #111827;
                    font-weight: 800;
                    margin-top: 1.5rem;
                    margin-bottom: 1rem;
                }
                .ql-editor p {
                    margin-bottom: 1rem;
                }
            `}</style>
        </div>
    );
}
