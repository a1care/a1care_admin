import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FileText, ShieldAlert, HelpCircle, Save, Plus, Trash2, Edit2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link, useParams } from "react-router-dom";
import JoditEditor from 'jodit-react';
import { FormSkeleton } from "@/components/ui/Skeletons";
import { PageBanner } from "@/components/ui/PageBanner";

type AppTarget = "CUSTOMER" | "PARTNER";

export default function CMSManagementPage() {
    const queryClient = useQueryClient();
    const { type } = useParams<{ type: string }>();
    const activeTab = type === "privacy" ? "PRIVACY" : type === "faq" ? "FAQ" : "TERMS";
    const [targetApp, setTargetApp] = useState<AppTarget>("CUSTOMER");

    const [content, setContent] = useState("");
    const [faqs, setFaqs] = useState<{ question: string; answer: string; isActive: boolean }[]>([]);
    const [isAddFaqOpen, setIsAddFaqOpen] = useState(false);
    const [newFaq, setNewFaq] = useState({ question: "", answer: "", isActive: true });

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
    const openAddFaqModal = () => {
        setNewFaq({ question: "", answer: "", isActive: true });
        setIsAddFaqOpen(true);
    };

    const handleAddFaqSubmit = () => {
        if (!newFaq.question.trim() || !newFaq.answer.trim()) {
            toast.error("Please fill in both question and answer");
            return;
        }
        setFaqs([...faqs, { ...newFaq }]);
        setIsAddFaqOpen(false);
    };
    const updateFaq = (index: number, key: "question" | "answer" | "isActive", val: string | boolean) => {
        const newFaqs = [...faqs];
        if (key === "question") newFaqs[index].question = val as string;
        if (key === "answer") newFaqs[index].answer = val as string;
        if (key === "isActive") newFaqs[index].isActive = val as boolean;
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
            <PageBanner 
                title={titleMap[activeTab as keyof typeof titleMap]} 
                subtitle="Content Management System"
            />

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
                            
                            <div className="bg-white rounded-2xl border-2 border-gray-200 focus-within:border-blue-400 transition-all shadow-sm overflow-hidden" style={{ minHeight: '600px' }}>
                                <JoditEditor
                                    value={content}
                                    config={{
                                        readonly: false,
                                        height: 600,
                                        toolbarAdaptive: false,
                                        buttons: "bold,italic,underline,strikethrough,ul,ol,font,fontsize,paragraph,lineHeight,superscript,subscript,classSpan,file,image,video,spellcheck,cut,copy,paste,selectall,copyformat,align,undo,redo,hr,eraser,copyformat,symbol,fullsize,print,source"
                                    }}
                                    onBlur={newContent => setContent(newContent)}
                                    onChange={newContent => setContent(newContent)}
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
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                                        {faqs.length} {faqs.length === 1 ? 'Question' : 'Questions'}
                                    </span>
                                    <button
                                        onClick={openAddFaqModal}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
                                    >
                                        <Plus size={16} />
                                        Add FAQ
                                    </button>
                                </div>
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
                                        <select
                                            value={faq.isActive ? "true" : "false"}
                                            onChange={(e) => updateFaq(idx, "isActive" as any, e.target.value === "true" as any)}
                                            className="text-xs font-bold px-2 py-1 rounded-md border border-gray-200 bg-gray-50 outline-none"
                                        >
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </select>
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
                        </div>
                    )}
                </div>
            </div>
            
            <style>{`
                .jodit-toolbar__box {
                    border-bottom: 1px solid #e5e7eb !important;
                    background: #f8fafc !important;
                    padding: 8px !important;
                }
                .jodit-workplace {
                    font-size: 0.95rem;
                }
                .jodit-wysiwyg {
                    padding: 2rem !important;
                    min-height: 400px;
                    line-height: 1.7;
                    color: #374151;
                }
            `}</style>

            {/* Add FAQ Modal */}
            {isAddFaqOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-2xl bg-[#F4F9F7] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
                            <h2 className="text-xl font-bold text-gray-900">Add FAQ</h2>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-900">Question</label>
                                <textarea 
                                    rows={3}
                                    placeholder="Enter question"
                                    value={newFaq.question}
                                    onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                                    className="w-full p-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white shadow-sm resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-900">Answer</label>
                                <textarea 
                                    rows={5}
                                    placeholder="Enter answer"
                                    value={newFaq.answer}
                                    onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                                    className="w-full p-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white shadow-sm resize-y"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-900">Status</label>
                                <select 
                                    value={newFaq.isActive ? "true" : "false"}
                                    onChange={(e) => setNewFaq({ ...newFaq, isActive: e.target.value === "true" })}
                                    className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white shadow-sm appearance-none"
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="px-6 md:px-8 py-4 border-t border-gray-200/60 bg-[#F4F9F7] flex justify-end gap-3">
                            <button 
                                onClick={() => setIsAddFaqOpen(false)}
                                className="px-6 py-2.5 rounded-lg bg-[#1F2937] hover:bg-[#111827] text-white text-sm font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleAddFaqSubmit}
                                className="px-6 py-2.5 rounded-lg bg-[#CCA65B] hover:bg-[#B9924B] text-white text-sm font-bold transition-colors shadow-sm"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
