import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FileText, ShieldAlert, HelpCircle, Save, Plus, Trash2, Edit2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type AppTarget = "CUSTOMER" | "PARTNER";

export default function CMSManagementPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<"TERMS" | "PRIVACY" | "FAQ">("TERMS");
    const [targetApp, setTargetApp] = useState<AppTarget>("CUSTOMER");

    // We'll use simple textareas for HTML editing for now, unless a rich text editor is available
    const [content, setContent] = useState("");
    const [faqs, setFaqs] = useState<{ question: string; answer: string; isActive: boolean }[]>([]);

    const { data: cmsList, isLoading } = useQuery({
        queryKey: ["cmsList"],
        queryFn: async () => {
            const res = await api.get("/cms/admin");
            return res.data.data;
        },
        onSuccess: (data) => {
            loadContentIntoState(data, activeTab, targetApp);
        }
    });

    const saveMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await api.post("/cms/admin", payload);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Content saved successfully");
            queryClient.invalidateQueries(["cmsList"]);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to save content");
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

    const handleTabChange = (tab: "TERMS" | "PRIVACY" | "FAQ") => {
        setActiveTab(tab);
        if (cmsList) loadContentIntoState(cmsList, tab, targetApp);
    };

    const handleAppChange = (app: AppTarget) => {
        setTargetApp(app);
        if (cmsList) loadContentIntoState(cmsList, activeTab, app);
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
        newFaqs[index][key] = val;
        setFaqs(newFaqs);
    };
    const removeFaq = (index: number) => {
        setFaqs(faqs.filter((_, i) => i !== index));
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">Legal & FAQ Content</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Manage Terms, Privacy Policy, and Frequently Asked Questions.</p>
                </div>
                <div className="flex bg-[var(--bg-main)] p-1 rounded-xl shadow-sm border border-[var(--border-color)]">
                    {(["CUSTOMER", "PARTNER"] as AppTarget[]).map((app) => (
                        <button
                            key={app}
                            onClick={() => handleAppChange(app)}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${targetApp === app ? "bg-orange-100 text-orange-700" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
                        >
                            {app === "CUSTOMER" ? "Customer App" : "Partner App"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
                    <button
                        onClick={() => handleTabChange("TERMS")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "TERMS" ? "bg-blue-50 text-blue-700 shadow-sm" : "text-[var(--text-muted)] hover:bg-[var(--bg-main)]"}`}
                    >
                        <FileText size={18} />
                        <span className="font-semibold text-sm">Terms & Conditions</span>
                    </button>
                    <button
                        onClick={() => handleTabChange("PRIVACY")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "PRIVACY" ? "bg-purple-50 text-purple-700 shadow-sm" : "text-[var(--text-muted)] hover:bg-[var(--bg-main)]"}`}
                    >
                        <ShieldAlert size={18} />
                        <span className="font-semibold text-sm">Privacy Policy</span>
                    </button>
                    <button
                        onClick={() => handleTabChange("FAQ")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "FAQ" ? "bg-green-50 text-green-700 shadow-sm" : "text-[var(--text-muted)] hover:bg-[var(--bg-main)]"}`}
                    >
                        <HelpCircle size={18} />
                        <span className="font-semibold text-sm">FAQs</span>
                    </button>
                </div>

                {/* Editor Content */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-main)]">
                        <h2 className="font-semibold text-[var(--text-main)]">
                            {activeTab === "TERMS" ? "Terms & Conditions" : activeTab === "PRIVACY" ? "Privacy Policy" : "Frequently Asked Questions"}
                        </h2>
                        <button
                            onClick={handleSave}
                            disabled={saveMutation.isLoading}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-orange-500/20 flex items-center gap-2 disabled:opacity-70"
                        >
                            {saveMutation.isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Changes
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
                        {activeTab !== "FAQ" ? (
                            <div className="h-full flex flex-col">
                                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">HTML Content</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="flex-1 w-full bg-white border border-[var(--border-color)] rounded-xl p-4 text-sm font-mono text-[var(--text-main)] focus:outline-none focus:border-orange-500 transition-colors resize-none shadow-sm"
                                    placeholder="<p>Enter your rich text HTML here...</p>"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-3">You can use standard HTML tags like &lt;h1&gt;, &lt;p&gt;, &lt;b&gt;, &lt;ul&gt;, etc. to format this document.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {faqs.map((faq, idx) => (
                                    <div key={idx} className="bg-white p-5 rounded-xl border border-[var(--border-color)] shadow-sm relative group">
                                        <button 
                                            onClick={() => removeFaq(idx)}
                                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="pr-8 space-y-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Question</label>
                                                <input
                                                    type="text"
                                                    value={faq.question}
                                                    onChange={(e) => updateFaq(idx, "question", e.target.value)}
                                                    className="w-full bg-[#F8FAFC] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm font-semibold text-[var(--text-main)] focus:outline-none focus:border-orange-500 transition-colors"
                                                    placeholder="e.g. How do I book a service?"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Answer</label>
                                                <textarea
                                                    value={faq.answer}
                                                    onChange={(e) => updateFaq(idx, "answer", e.target.value)}
                                                    className="w-full bg-[#F8FAFC] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-orange-500 transition-colors resize-y min-h-[80px]"
                                                    placeholder="Type the answer here..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={addFaq}
                                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-semibold hover:border-orange-400 hover:text-orange-500 transition-colors flex items-center justify-center gap-2 bg-white"
                                >
                                    <Plus size={18} />
                                    Add New Question
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
