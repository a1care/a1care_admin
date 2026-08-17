import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, Search, Edit2, Trash2, MapPin, CheckCircle2, XCircle, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/context/ConfirmationContext";
import { TableSkeleton } from "@/components/ui/Skeletons";

// ── India States & Cities Data ─────────────────────────────────────────────
const INDIA_STATE_CITIES: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Kakinada", "Tirupati", "Anantapur", "Kadapa"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tezpur"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon"],
  "Delhi": ["New Delhi", "Dwarka", "Rohini", "Saket", "Lajpat Nagar", "Janakpuri", "Vasant Kunj", "Karol Bagh", "Connaught Place", "Pitampura"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh", "Anand", "Navsari"],
  "Haryana": ["Gurgaon", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"],
  "Himachal Pradesh": ["Shimla", "Dharamsala", "Manali", "Solan", "Mandi", "Kullu", "Baddi"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Kalaburagi", "Ballari", "Vijayapura", "Shivamogga", "Tumakuru"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Malappuram", "Kannur", "Kasaragod"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Ratlam", "Satna", "Murwara", "Dewas"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Amravati", "Kolhapur", "Navi Mumbai", "Thane"],
  "Manipur": ["Imphal", "Thoubal", "Bishnupur", "Churachandpur"],
  "Meghalaya": ["Shillong", "Tura", "Jowai"],
  "Mizoram": ["Aizawl", "Lunglei", "Saiha"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bhilwara", "Alwar", "Bharatpur", "Sikar"],
  "Sikkim": ["Gangtok", "Namchi", "Gyalshing"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore", "Thanjavur", "Dindigul"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet"],
  "Tripura": ["Agartala", "Udaipur", "Dharmanagar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Allahabad", "Bareilly", "Aligarh", "Moradabad"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Malda", "Bardhaman", "Kharagpur", "Haldia"],
  "Chandigarh": ["Chandigarh"],
  "Jammu & Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Sopore"],
  "Ladakh": ["Leh", "Kargil"],
  "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam"],
};

const ALL_STATES = Object.keys(INDIA_STATE_CITIES).sort();

const SELECT_STYLE = {
  width: "100%", height: 42, paddingLeft: 12, paddingRight: 32,
  background: "var(--bg-main)", border: "1.5px solid var(--border-color)",
  borderRadius: 12, fontSize: "0.875rem", color: "var(--text-main)",
  outline: "none", fontFamily: "inherit", appearance: "none" as const,
  cursor: "pointer",
};


export default function ServiceableAreasPage() {
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [city, setCity] = useState("Hyderabad");
    const [state, setState] = useState("Telangana");
    const [isActive, setIsActive] = useState(true);
    const [displayOrder, setDisplayOrder] = useState(0);

    const { data: areas, isLoading, isFetching } = useQuery({
        queryKey: ["serviceableAreasAdmin"],
        queryFn: async () => {
            const res = await api.get("/serviceable-areas/admin");
            return res.data.data;
        }
    });

    const saveMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (editingId) {
                const res = await api.patch(`/serviceable-areas/admin/${editingId}`, payload);
                return res.data;
            } else {
                const res = await api.post("/serviceable-areas/admin", payload);
                return res.data;
            }
        },
        onSuccess: () => {
            toast.success(editingId ? "Area updated successfully!" : "Area added successfully!");
            queryClient.invalidateQueries({ queryKey: ["serviceableAreasAdmin"] });
            closeModal();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to save area. Please try again.");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/serviceable-areas/admin/${id}`);
        },
        onSuccess: () => {
            toast.success("Area deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["serviceableAreasAdmin"] });
        }
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            const res = await api.patch(`/serviceable-areas/admin/${id}`, { isActive });
            return res.data;
        },
        onSuccess: (_, vars) => {
            toast.success(vars.isActive ? "Area marked Active." : "Area marked Inactive.");
            queryClient.invalidateQueries({ queryKey: ["serviceableAreasAdmin"] });
        },
        onError: () => toast.error("Failed to update status.")
    });

    const seedMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post("/serviceable-areas/admin/seed");
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(`Seeded ${data.data?.addedCount || 0} default areas successfully.`);
            queryClient.invalidateQueries({ queryKey: ["serviceableAreasAdmin"] });
        }
    });

    const openCreate = () => {
        setEditingId(null);
        setName("");
        setCity("Hyderabad");
        setState("Telangana");
        setIsActive(true);
        setDisplayOrder(0);
        setIsModalOpen(true);
    };

    const openEdit = (area: any) => {
        setEditingId(area._id);
        setName(area.name);
        setCity(area.city);
        setState(area.state);
        setIsActive(area.isActive);
        setDisplayOrder(area.displayOrder || 0);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSave = () => {
        if (!name.trim()) {
            return toast.error("Please provide an area name.");
        }
        saveMutation.mutate({ name, city, state, isActive, displayOrder });
    };

    const filtered = areas?.filter((a: any) => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.city.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6 animate-in">
            {/* ── Page Header ── */}
            <header className="flex flex-col gap-4 bg-gradient-to-br from-[var(--primary)] to-emerald-800 p-6 md:p-8 rounded-2xl shadow-lg shadow-emerald-900/10 border-0 relative overflow-hidden text-left items-start min-h-[160px]">
                {/* Decorative Blobs */}
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 w-full">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1">Serviceable Areas</h1>
                    <div className="flex items-center gap-2 mt-1 mb-4">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                        <p className="text-xs md:text-sm font-medium text-emerald-50 tracking-wide opacity-90">
                            Home • Settings • Serviceable Areas
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => seedMutation.mutate()}
                            className="flex items-center gap-1.5 h-10 px-5 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-sm font-semibold rounded-xl transition-all backdrop-blur-sm shadow-sm shrink-0"
                        >
                            <span>Seed Default Areas</span>
                        </button>
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-1.5 h-10 px-5 bg-white text-emerald-700 hover:bg-emerald-50 text-sm font-semibold rounded-xl transition-all shadow-lg shrink-0"
                        >
                            <Plus size={16} />
                            <span>Add Area</span>
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
                        placeholder="Search areas by name or city..."
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

            {/* ── Table Card ── */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MapPin size={18} className="text-blue-500" />
                        <h3 className="font-semibold text-[var(--text-main)] text-sm">All Serviceable Areas</h3>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-[var(--hover-bg)] text-[var(--text-muted)] rounded-md">
                        Total {areas?.length || 0}
                    </span>
                </div>

                {isLoading ? (
                    <div className="p-5"><TableSkeleton rows={5} columns={5} /></div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-[var(--bg-main)] rounded-full flex items-center justify-center mb-4">
                            <MapPin size={24} className="text-[var(--text-muted)]" />
                        </div>
                        <h3 className="text-base font-semibold text-[var(--text-main)] mb-1">No areas found</h3>
                        <p className="text-sm text-[var(--text-muted)] max-w-sm mb-6">
                            You haven't added any serviceable areas matching your search criteria.
                        </p>
                        <button onClick={openCreate} className="px-4 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] rounded-xl text-sm font-medium transition-colors">
                            Add your first area
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--border-color)]">
                                    <th className="py-3 px-5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Display Order</th>
                                    <th className="py-3 px-5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Name</th>
                                    <th className="py-3 px-5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Location</th>
                                    <th className="py-3 px-5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-center">Status</th>
                                    <th className="py-3 px-5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {filtered.map((area: any) => (
                                    <tr key={area._id} className="hover:bg-[var(--hover-bg)] transition-colors group">
                                        <td className="py-3 px-5 text-sm font-medium text-[var(--text-main)]">
                                            {area.displayOrder}
                                        </td>
                                        <td className="py-3 px-5">
                                            <p className="text-sm font-semibold text-[var(--text-main)]">
                                                {area.name}
                                            </p>
                                        </td>
                                        <td className="py-3 px-5">
                                            <p className="text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-main)] inline-flex items-center px-2 py-1 rounded-md border border-[var(--border-color)]">
                                                {area.city}, {area.state}
                                            </p>
                                        </td>
                                        <td className="py-3 px-5 text-center">
                                            {area.isActive ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-xs font-medium">
                                                    <CheckCircle2 size={12} /> Active
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-medium">
                                                    <XCircle size={12} /> Inactive
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Active / Inactive Toggle */}
                                                <button
                                                    onClick={() => toggleMutation.mutate({ id: area._id, isActive: !area.isActive })}
                                                    disabled={toggleMutation.isPending}
                                                    className={`h-8 px-3 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all shadow-sm ${
                                                        area.isActive
                                                            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                                                            : 'bg-red-50 border-red-200 text-red-600 hover:bg-green-50 hover:border-green-200 hover:text-green-700'
                                                    }`}
                                                    title={area.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                                                >
                                                    {area.isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                                    {area.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                                {/* Edit */}
                                                <button
                                                    onClick={() => openEdit(area)}
                                                    className="w-8 h-8 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-blue-500/50 hover:bg-blue-500/5 text-[var(--text-muted)] hover:text-blue-500 flex items-center justify-center transition-all shadow-sm"
                                                    title="Edit Area"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                {/* Delete */}
                                                <button 
                                                    onClick={async () => {
                                                        const isConfirmed = await confirm({
                                                            title: "Delete Area",
                                                            message: "Are you sure you want to delete this area?",
                                                            confirmText: "Delete",
                                                            type: "danger"
                                                        });
                                                        if (isConfirmed) {
                                                            deleteMutation.mutate(area._id);
                                                        }
                                                    }}
                                                    className="w-8 h-8 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-red-500/50 hover:bg-red-500/5 text-[var(--text-muted)] hover:text-red-500 flex items-center justify-center transition-all shadow-sm"
                                                    title="Delete Area"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-main)]/50">
                            <h2 className="text-lg font-bold text-[var(--text-main)]">
                                {editingId ? "Edit Area" : "Add Area"}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--bg-main)] hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent hover:border-[var(--border-color)] transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 flex-1 overflow-y-auto space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Area Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Safilguda"
                                    className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {/* State Dropdown */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">State *</label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={state}
                                            onChange={e => {
                                                setState(e.target.value);
                                                // Reset city to first city of new state
                                                const cities = INDIA_STATE_CITIES[e.target.value] || [];
                                                setCity(cities[0] || "");
                                            }}
                                            style={SELECT_STYLE}
                                        >
                                            <option value="">Select State</option>
                                            {ALL_STATES.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                    </div>
                                </div>
                                {/* City Dropdown */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">City *</label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={city}
                                            onChange={e => setCity(e.target.value)}
                                            style={SELECT_STYLE}
                                            disabled={!state}
                                        >
                                            <option value="">Select City</option>
                                            {(INDIA_STATE_CITIES[state] || []).map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Display Order</label>
                                <input
                                    type="number"
                                    value={displayOrder}
                                    onChange={e => setDisplayOrder(parseInt(e.target.value) || 0)}
                                    className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={isActive}
                                    onChange={e => setIsActive(e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--border-color)] text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="isActive" className="text-sm font-semibold text-[var(--text-main)] cursor-pointer select-none">
                                    Area is active
                                </label>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-main)] flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--hover-bg)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saveMutation.isPending}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
                            >
                                {saveMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                                {editingId ? "Update Area" : "Add Area"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
