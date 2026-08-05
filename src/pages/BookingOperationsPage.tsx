import { useState, useDeferredValue } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    Clock, CheckCircle2, User, Calendar, MapPin, CreditCard,
    Briefcase, ChevronLeft, ChevronRight, Search, Filter, Eye,
    X, RefreshCw, Loader2, Stethoscope, Truck, Package,
    Activity, TrendingUp, AlertCircle, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatDateTime, formatTime } from "@/lib/format";
import { A1Drawer } from "@/components/ui/A1Drawer";
import { TableSkeleton } from "@/components/ui/Skeletons";

interface BaseBooking {
    _id: string;
    patientId: { name: string; mobile: string };
    status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
    paymentStatus: "PENDING" | "COMPLETED" | "FAILED";
    totalAmount: number;
    createdAt: string;
    notes?: string;
}

interface DoctorBooking extends BaseBooking {
    doctorId: { name: string; specialization: string[] };
    startingTime: string;
    date: string;
}

interface ServiceBooking extends BaseBooking {
    serviceId: { name: string };
    fulfillmentMode: "HOME_VISIT" | "HOSPITAL_VISIT" | "VIRTUAL";
    location?: string;
}

interface HospitalBooking extends BaseBooking {
    bookingType: 'doctor' | 'service';
    serviceName: string;
}

interface DoctorListItem {
    _id: string;
    name: string;
    mobileNumber?: string;
    roleId?: string | { _id?: string; name?: string };
    status?: string;
    specialization?: string[];
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
    PENDING:           { label: "Pending",        dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
    BROADCASTED:       { label: "Broadcasting",   dot: "bg-purple-400",  badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20" },
    ACCEPTED:          { label: "Accepted",        dot: "bg-blue-400",    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" },
    IN_PROGRESS:       { label: "In Progress",    dot: "bg-cyan-400",    badge: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20" },
    COMPLETED:         { label: "Completed",      dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" },
    CANCELLED:         { label: "Cancelled",      dot: "bg-slate-400",   badge: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20" },
    RETURNED_TO_ADMIN: { label: "Needs Review",   dot: "bg-rose-400",    badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20" },
    Pending:           { label: "Pending",        dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
    Confirmed:         { label: "Confirmed",      dot: "bg-blue-400",    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" },
    Completed:         { label: "Completed",      dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" },
    Cancelled:         { label: "Cancelled",      dot: "bg-slate-400",   badge: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20" },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || { label: status, dot: "bg-slate-400", badge: "bg-slate-50 text-slate-600 border-slate-200" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${cfg.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

export function BookingOperationsPage() {
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<"doctors" | "services" | "hospital">("services");
    const [serviceCategory, setServiceCategory] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "RETURNED_TO_ADMIN");
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const deferredSearch = useDeferredValue(searchQuery);

    const [showFilters, setShowFilters] = useState(false);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("All");
    const [departmentFilter, setDepartmentFilter] = useState("All");
    const [serviceFilter, setServiceFilter] = useState("All");
    const [subServiceFilter, setSubServiceFilter] = useState("All");

    const DOCTOR_STATUS_UI_TO_API: Record<string, string> = {
        All: "All", PENDING: "Pending", CONFIRMED: "Confirmed", COMPLETED: "Completed", CANCELLED: "Cancelled",
    };

    const normalizeBookingPayload = (payload: any) => {
        if (Array.isArray(payload)) {
            return { items: payload, total: payload.length, page: 1, totalPages: 1, stats: { all: payload.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0 } };
        }
        return payload || { items: [], total: 0, page: 1, totalPages: 1, stats: { all: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 } };
    };

    const { data: doctorData, isLoading: loadingDocs } = useQuery({
        queryKey: ["admin_doctor_bookings", activeTab, page, statusFilter, deferredSearch, dateFrom, dateTo, paymentFilter, subServiceFilter],
        queryFn: async () => {
            if (activeTab !== "doctors") return null;
            const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
            if (statusFilter !== "All") params.append("status", DOCTOR_STATUS_UI_TO_API[statusFilter] || statusFilter);
            if (deferredSearch) params.append("search", deferredSearch);
            if (dateFrom) params.append("dateFrom", dateFrom);
            if (dateTo) params.append("dateTo", dateTo);
            if (paymentFilter !== "All") params.append("payment", paymentFilter);
            if (subServiceFilter !== "All") params.append("subService", subServiceFilter);
            const res = await api.get(`/admin/bookings/doctors?${params.toString()}`);
            return normalizeBookingPayload(res.data.data);
        },
        placeholderData: (prev) => prev,
        enabled: activeTab === "doctors",
        refetchInterval: 15000,
        refetchIntervalInBackground: true,
    });

    const { data: serviceData, isLoading: loadingServices } = useQuery({
        queryKey: ["admin_service_bookings", activeTab, page, statusFilter, deferredSearch, dateFrom, dateTo, paymentFilter, serviceFilter, departmentFilter, serviceCategory],
        queryFn: async () => {
            if (activeTab !== "services") return null;
            const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
            if (statusFilter !== "All") params.append("status", statusFilter);
            if (deferredSearch) params.append("search", deferredSearch);
            if (dateFrom) params.append("dateFrom", dateFrom);
            if (dateTo) params.append("dateTo", dateTo);
            if (paymentFilter !== "All") params.append("payment", paymentFilter);
            if (serviceFilter !== "All") params.append("service", serviceFilter);
            if (departmentFilter !== "All") params.append("department", departmentFilter);
            if (serviceCategory !== "All") params.append("serviceType", serviceCategory.toLowerCase());
            const res = await api.get(`/admin/bookings/services?${params.toString()}`);
            return normalizeBookingPayload(res.data.data);
        },
        placeholderData: (prev) => prev,
        enabled: activeTab === "services",
        refetchInterval: 15000,
        refetchIntervalInBackground: true,
    });

    const { data: hospitalData, isLoading: loadingHospital } = useQuery({
        queryKey: ["admin_hospital_bookings", activeTab, page, statusFilter, deferredSearch, dateFrom, dateTo, paymentFilter],
        queryFn: async () => {
            if (activeTab !== "hospital") return null;
            const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
            if (statusFilter !== "All") params.append("status", statusFilter);
            if (deferredSearch) params.append("search", deferredSearch);
            if (dateFrom) params.append("dateFrom", dateFrom);
            if (dateTo) params.append("dateTo", dateTo);
            if (paymentFilter !== "All") params.append("payment", paymentFilter);
            const res = await api.get(`/admin/bookings/hospital?${params.toString()}`);
            return normalizeBookingPayload(res.data.data);
        },
        placeholderData: (prev) => prev,
        enabled: activeTab === "hospital",
        refetchInterval: 15000,
        refetchIntervalInBackground: true,
    });

    const { data: categories } = useQuery({
        queryKey: ["admin_categories"],
        queryFn: async () => {
            const res = await api.get("/services");
            return res.data.data as { _id: string; name: string; type?: string }[];
        }
    });

    const { data: doctorsList } = useQuery({
        queryKey: ["admin_doctors_list"],
        queryFn: async () => {
            const res = await api.get("/admin/doctors?limit=500");
            const payload = res.data?.data;
            if (Array.isArray(payload)) return payload as DoctorListItem[];
            if (Array.isArray(payload?.items)) return payload.items as DoctorListItem[];
            return [];
        }
    });

    const normalizedDoctorsList: DoctorListItem[] = Array.isArray(doctorsList)
        ? doctorsList
        : Array.isArray((doctorsList as any)?.items) ? (doctorsList as any).items : [];

    const doctorCategory = categories?.find(c => c.type === 'doctor' || c.name.toLowerCase().includes('doctor'));

    const { data: doctorSubServices } = useQuery({
        queryKey: ["admin_subservices", doctorCategory?._id],
        queryFn: async () => {
            if (!doctorCategory?._id) return [];
            const res = await api.get(`/subservice/${doctorCategory._id}`);
            return res.data.data as { _id: string; name: string }[];
        },
        enabled: !!doctorCategory?._id
    });

    const [acceptServiceModal, setAcceptServiceModal] = useState<{ bookingId: string; booking: any } | null>(null);
    const [selectedHospitalId, setSelectedHospitalId] = useState("");

    const getProviderRoleId = (provider: DoctorListItem) =>
        typeof provider.roleId === "string" ? provider.roleId : provider.roleId?._id || "";

    const getEligibleProvidersForBooking = (booking: any) => {
        const allowedRoleIds = booking?.serviceId?.allowedRoleIds || booking?.childServiceId?.allowedRoleIds || [];
        if (!Array.isArray(allowedRoleIds) || allowedRoleIds.length === 0) {
            return normalizedDoctorsList.filter((d) => String(d.status || '').toLowerCase() === "active");
        }
        const allowed = new Set(allowedRoleIds.map((id: any) => String(id?._id || id)));
        const filtered = normalizedDoctorsList.filter((d) => String(d.status || '').toLowerCase() === "active" && allowed.has(getProviderRoleId(d)));
        // Fallback: If no strict role matches found, return all active providers to avoid empty dropdown
        if (filtered.length === 0) {
            return normalizedDoctorsList.filter((d) => String(d.status || '').toLowerCase() === "active");
        }
        return filtered;
    };

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, type, status, assignedProviderId, booking }: { id: string; type: "doctor" | "service"; status: string; assignedProviderId?: string; booking?: any }) => {
            const endpoint = type === "doctor" ? `/admin/bookings/doctors/${id}/status` : `/admin/bookings/services/${id}/status`;
            const body: { status: string; assignedProviderId?: string } = { status };
            if (assignedProviderId) body.assignedProviderId = assignedProviderId;
            const res = await api.put(endpoint, body);
            return res.data;
        },
        onSuccess: async (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["admin_doctor_bookings"] });
            queryClient.invalidateQueries({ queryKey: ["admin_service_bookings"] });
            queryClient.invalidateQueries({ queryKey: ["admin_hospital_bookings"] });
            setAcceptServiceModal(null);
            setSelectedHospitalId("");
            const { status, type, booking } = variables;
            const wasPaid = booking?.paymentStatus === "COMPLETED" && (booking?.paymentMode === "WALLET" || booking?.paymentMode === "ONLINE");
            if (status === "CANCELLED" && wasPaid && type === "service") {
                toast.success("Booking cancelled and refund processed.");
            } else {
                toast.success("Booking updated successfully");
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to update booking.");
        }
    });

    const handleUpdateStatus = (id: string, type: "doctor" | "service", status: string, assignedProviderId?: string) => {
        updateStatusMutation.mutate({ id, type, status, assignedProviderId });
    };

    const handleAcceptServiceWithHospital = () => {
        if (!acceptServiceModal || !selectedHospitalId) return;
        handleUpdateStatus(acceptServiceModal.bookingId, "service", "PARTNER_ASSIGNED", selectedHospitalId);
    };

    const getBookingDisplayName = (booking: any) => {
        const notes = String(booking?.notes || "").trim();
        if (notes.startsWith("Symptom:")) return notes.replace("Symptom:", "").trim();
        if (notes.startsWith("Dept:")) return notes.replace("Dept:", "").trim();
        if (activeTab === "doctors") {
            const spec = booking.serviceName || (Array.isArray(booking.doctorId?.specialization) ? booking.doctorId.specialization[0] : null);
            return spec || booking.doctorId?.name || "Doctor Consult";
        }
        if (activeTab === "services") return booking.serviceId?.name || "Service Request";
        return booking.serviceName || "Hospital Task";
    };

    const activeDataset = activeTab === "doctors" ? doctorData : activeTab === "services" ? serviceData : hospitalData;
    const rawItems = activeDataset?.items || [];

    const paginatedData = activeTab === "services" && serviceCategory !== "All"
        ? rawItems.filter((item: any) => {
            const serviceName = (item.serviceId?.name || "").toLowerCase();
            const category = serviceCategory.toLowerCase();
            if (category === "nurse") return serviceName.includes("nurse") || serviceName.includes("shift") || serviceName.includes("care");
            if (category === "ambulance") return serviceName.includes("ambulance");
            if (category === "rental") return serviceName.includes("rental") || serviceName.includes("equipment") || serviceName.includes("medical");
            return true;
        })
        : rawItems;

    const totalPages = activeDataset?.totalPages || 1;
    const stats = activeDataset?.stats || { all: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };

    const isLoading = (activeTab === "doctors" && loadingDocs) || (activeTab === "services" && loadingServices) || (activeTab === "hospital" && loadingHospital);

    const TAB_CONFIG = [
        { id: "services", label: "Service Requests", icon: <Activity size={14} /> },
        { id: "doctors", label: "Doctor Consult", icon: <Stethoscope size={14} /> },
        { id: "hospital", label: "Hospital Bookings", icon: <Briefcase size={14} /> },
    ];

    const STAT_CARDS = [
        { label: "Total",     value: "All",       count: stats.all || 0,       color: "text-slate-700 dark:text-slate-300", icon: <TrendingUp size={14} /> },
        { label: "Pending",   value: "PENDING",   count: stats.pending || 0,   color: "text-amber-600 dark:text-amber-400", icon: <Clock size={14} /> },
        { label: "Assigned",  value: "CONFIRMED", count: stats.confirmed || 0, color: "text-blue-600 dark:text-blue-400",   icon: <CheckCircle2 size={14} /> },
        { label: "Completed", value: "COMPLETED", count: stats.completed || 0, color: "text-emerald-600 dark:text-emerald-400", icon: <CheckCircle2 size={14} /> },
        { label: "Cancelled", value: "CANCELLED", count: stats.cancelled || 0, color: "text-slate-500 dark:text-slate-400", icon: <AlertCircle size={14} /> },
    ];

    return (
        <div className="space-y-6 animate-in">

            {/* ── Page Header ── */}
            <header className="flex flex-col gap-2 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden text-left items-start">
                <div className="relative z-10 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">Service Orders</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">
                                    Home • Bookings • Service Orders &nbsp;•&nbsp; Auto-refreshes every 15s
                                </p>
                            </div>
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex items-center bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-1 gap-0.5 self-start">
                            {TAB_CONFIG.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id as any); setPage(1); setStatusFilter("All"); }}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap
                                        ${activeTab === tab.id
                                            ? "bg-[var(--card-bg)] text-blue-600 dark:text-blue-400 shadow-sm"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-12 right-32 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            </header>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-5 gap-3">
                {STAT_CARDS.map(s => (
                    <button
                        key={s.value}
                        onClick={() => { setStatusFilter(s.value); setPage(1); }}
                        className={`bg-[var(--card-bg)] border rounded-xl p-4 text-left transition-all duration-200 hover:shadow-md
                            ${statusFilter === s.value
                                ? "border-blue-500 shadow-sm ring-1 ring-blue-500/30"
                                : "border-[var(--border-color)] hover:border-[var(--text-muted)]"
                            }`}
                    >
                        <div className={`flex items-center gap-1.5 text-xs font-medium mb-2 ${s.color}`}>
                            {s.icon}
                            {s.label}
                        </div>
                        <div className="text-2xl font-bold text-[var(--text-main)]">{s.count}</div>
                    </button>
                ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                {/* Search */}
                <div style={{ position: "relative", width: "100%", maxWidth: "320px", flexShrink: 0 }}>
                    <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", zIndex: 10 }} />
                    <input
                        type="text"
                        placeholder="Search by TxnID, name, phone..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        style={{
                            width: "100%", height: 42, borderRadius: 12, paddingLeft: 38, paddingRight: 14,
                            background: "var(--card-bg)", border: "1.5px solid var(--border-color)",
                            fontSize: "0.875rem", color: "var(--text-main)", outline: "none",
                            fontFamily: "inherit", boxSizing: "border-box"
                        }}
                    />
                </div>

                <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
                    {/* Status Filter Dropdown */}
                    <div className="flex items-center bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 gap-2 shrink-0 shadow-sm transition-all hover:border-[var(--text-muted)] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30">
                        <Filter size={14} className="text-[var(--text-muted)]" />
                        <select 
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="bg-transparent text-xs font-semibold text-[var(--text-main)] outline-none cursor-pointer appearance-none pr-4"
                            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%234A6E8A%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', backgroundSize: '8px auto' }}
                        >
                            <option value="All">All Statuses</option>
                            <option value="RETURNED_TO_ADMIN">Needs Review</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Assigned / Confirmed</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>

                    {/* Service Category Pills (services tab only) */}
                    {activeTab === "services" && (
                        <div className="flex items-center gap-1.5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-1 shrink-0">
                            {[
                                { id: "All", label: "All" },
                                { id: "Nurse", label: "Nursing", icon: <Stethoscope size={11} /> },
                                { id: "Ambulance", label: "Ambulance", icon: <Truck size={11} /> },
                                { id: "Rental", label: "Equipment", icon: <Package size={11} /> },
                            ].map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => { setServiceCategory(cat.id); setPage(1); }}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                                        ${serviceCategory === cat.id
                                            ? "bg-[var(--card-bg)] text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/20"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)]"
                                        }`}
                                >
                                    {cat.icon}
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>



            {/* ── Data Table ── */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider w-10">#</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Order</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider min-w-[180px]">
                                    {activeTab === "doctors" ? "Service / Specialty" : activeTab === "services" ? "Service" : "Task"}
                                </th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Patient</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Date & Time</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Amount</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-center">Assign</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="p-0">
                                        <TableSkeleton columns={9} rows={5} showHeader={false} />
                                    </td>
                                </tr>
                            ) : paginatedData.length > 0 ? (
                                paginatedData.map((booking: any, index: number) => {
                                    const isPending = booking.status?.toUpperCase() === "PENDING" || booking.status?.toUpperCase() === "RETURNED_TO_ADMIN" || booking.status?.toUpperCase() === "BROADCASTED";
                                    const isConfirmed = booking.status?.toUpperCase() === "CONFIRMED" || booking.status?.toUpperCase() === "ACCEPTED";
                                    const isFinal = booking.status?.toUpperCase() === "CANCELLED" || booking.status?.toUpperCase() === "COMPLETED";
                                    return (
                                        <tr key={booking._id} className="hover:bg-[var(--bg-main)] transition-colors group">
                                            <td className="py-3.5 px-4 text-xs font-medium text-[var(--text-muted)]">
                                                {String((page - 1) * limit + index + 1).padStart(2, '0')}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded">
                                                    #{booking._id.slice(-8).toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="text-sm font-medium text-[var(--text-main)] truncate block max-w-[200px]">
                                                    {getBookingDisplayName(booking)}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="text-sm font-medium text-[var(--text-main)]">
                                                    {booking.patientId?.name || booking.patientId?.mobile || "Anonymous"}
                                                </div>
                                                <div className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                                                    {booking.patientId?.mobile || "—"}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-[var(--text-main)]">
                                                    {formatDate(booking.date || booking.createdAt)}
                                                </div>
                                                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                                                    {formatTime(booking.startingTime || booking.createdAt)}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <StatusBadge status={booking.status || ''} />
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className={`text-sm font-semibold ${booking.paymentStatus === 'COMPLETED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-main)]'}`}>
                                                    ₹{booking.totalAmount}
                                                </div>
                                                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                                    {booking.paymentStatus === 'COMPLETED' ? 'Paid' : booking.paymentStatus === 'PENDING' ? 'Unpaid' : (booking.paymentStatus || '—')}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                {activeTab === "services" && (isPending || isConfirmed) ? (
                                                    <button
                                                        onClick={() => setAcceptServiceModal({ bookingId: booking._id, booking })}
                                                        className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 text-white shadow-sm
                                                            ${isConfirmed ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"}`}
                                                    >
                                                        <CheckCircle2 size={12} />
                                                        {isConfirmed ? "Re-assign" : "Assign"}
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled={!isPending || activeTab === "services"}
                                                        onClick={() => handleUpdateStatus(booking.bookingId || booking._id, (booking as any).bookingType || (activeTab === "doctors" ? "doctor" : "service"), "Confirmed")}
                                                        className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all
                                                            ${isPending && activeTab !== "services"
                                                                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                                                : "bg-[var(--bg-main)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-color)]"
                                                            }`}
                                                    >
                                                        <CheckCircle2 size={12} />
                                                        Accept
                                                    </button>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => { setSelectedBooking({ ...booking, tab: activeTab }); setViewModalOpen(true); }}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 border border-[var(--border-color)] hover:border-blue-300 dark:hover:border-blue-500/30 transition-all"
                                                        title="View Details"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        disabled={isFinal}
                                                        onClick={() => {
                                                            if (!window.confirm(`Cancel booking for ${booking.patientId?.name || 'this patient'}?`)) return;
                                                            const id = booking.bookingId || booking._id;
                                                            const type = (booking as any).bookingType || (activeTab === "doctors" ? "doctor" : "service");
                                                            updateStatusMutation.mutate({ id, type, status: "CANCELLED", booking });
                                                        }}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all
                                                            ${isFinal
                                                                ? "text-[var(--text-muted)] border-[var(--border-color)] cursor-not-allowed opacity-40"
                                                                : "text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 border-[var(--border-color)] hover:border-red-300 dark:hover:border-red-500/30"
                                                            }`}
                                                        title="Cancel Booking"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={9} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-center">
                                                <Calendar size={20} className="text-[var(--text-muted)]" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--text-main)]">No bookings found</p>
                                                <p className="text-xs text-[var(--text-muted)] mt-0.5">Try adjusting your filters or search query.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-color)] bg-[var(--card-bg)]">
                        <div className="flex items-center gap-4">
                            <p className="text-xs text-[var(--text-muted)]">
                                Showing <span className="font-semibold text-[var(--text-main)]">{(page - 1) * limit + (paginatedData.length > 0 ? 1 : 0)}</span> to <span className="font-semibold text-[var(--text-main)]">{Math.min(page * limit, activeDataset?.total || 0)}</span> of <span className="font-semibold text-[var(--text-main)]">{activeDataset?.total || 0}</span> entries
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-[var(--text-muted)]">Rows per page:</span>
                                <select 
                                    value={limit} 
                                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                    className="h-7 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-md px-1 text-[var(--text-main)] outline-none cursor-pointer"
                                >
                                    {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="text-xs font-semibold px-2 text-[var(--text-main)]">Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── View Details Drawer ── */}
            <A1Drawer
                isOpen={viewModalOpen && !!selectedBooking}
                onClose={() => setViewModalOpen(false)}
                title={selectedBooking ? `Booking #${selectedBooking._id.slice(-12).toUpperCase()}` : "Booking Details"}
                width="lg"
            >
                {selectedBooking && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <StatusBadge status={selectedBooking.status || ''} />
                        </div>

                        {/* Patient & Service */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                    <User size={12} className="text-blue-500" /> Patient
                                </p>
                                <p className="text-sm font-semibold text-slate-900">{selectedBooking.patientId?.name || "Anonymous"}</p>
                                <p className="text-xs font-mono text-slate-500 mt-0.5">{selectedBooking.patientId?.mobile || "—"}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                    <Briefcase size={12} className="text-blue-500" />
                                    {selectedBooking.tab === "doctors" ? "Doctor" : "Service"}
                                </p>
                                <p className="text-sm font-semibold text-slate-900">
                                    {selectedBooking.tab === "doctors"
                                        ? selectedBooking.doctorId?.name
                                        : selectedBooking.tab === "services"
                                            ? selectedBooking.serviceId?.name
                                            : selectedBooking.serviceName
                                    }
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {selectedBooking.tab === "doctors"
                                        ? selectedBooking.doctorId?.specialization?.join(", ")
                                        : "—"
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Scheduling & Billing */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                    <Calendar size={12} /> Date
                                </p>
                                <p className="text-sm font-semibold text-slate-900">{formatDate(selectedBooking.date || selectedBooking.createdAt)}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{formatTime(selectedBooking.startingTime || selectedBooking.createdAt)}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                    <CreditCard size={12} /> Billing
                                </p>
                                <p className="text-base font-bold text-slate-900">₹{selectedBooking.totalAmount}</p>
                                <p className={`text-[11px] font-semibold mt-0.5 ${selectedBooking.paymentStatus === 'COMPLETED' ? 'text-success' : 'text-warning'}`}>
                                    {selectedBooking.paymentStatus}
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                    <Clock size={12} /> Created
                                </p>
                                <p className="text-sm font-medium text-slate-900">{formatDateTime(selectedBooking.createdAt)}</p>
                            </div>
                        </div>

                        {/* Notes */}
                        {selectedBooking.notes && (
                            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-1.5">Notes</p>
                                <p className="text-sm text-slate-900 leading-relaxed">"{selectedBooking.notes}"</p>
                            </div>
                        )}

                        {/* Location */}
                        {selectedBooking.tab === "services" && selectedBooking.location && (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                <MapPin size={16} className="text-slate-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Service Location</p>
                                    <p className="text-sm text-slate-900">{selectedBooking.location}</p>
                                </div>
                            </div>
                        )}

                        {/* Assigned Provider */}
                        {selectedBooking.assignedProviderId && (() => {
                            const assignedId = typeof selectedBooking.assignedProviderId === "object"
                                ? selectedBooking.assignedProviderId?._id
                                : selectedBooking.assignedProviderId;
                            const provider = normalizedDoctorsList.find(d => d._id === assignedId);
                            const providerName = provider?.name
                                || (typeof selectedBooking.assignedProviderId === "object" ? selectedBooking.assignedProviderId?.name : null)
                                || "Assigned Provider";
                            return (
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                                        {providerName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider mb-0.5">Assigned Provider</p>
                                        <p className="text-sm font-semibold text-slate-900">{providerName}</p>
                                        {provider?.mobileNumber && <p className="text-xs font-mono text-slate-500">{provider.mobileNumber}</p>}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </A1Drawer>

            {/* ── Assign Provider Modal ── */}
            {acceptServiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setAcceptServiceModal(null); setSelectedHospitalId(""); }} />
                    <div className="relative w-full max-w-sm bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl animate-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                            <h3 className="text-base font-bold text-[var(--text-main)]">Assign Provider</h3>
                            <button onClick={() => { setAcceptServiceModal(null); setSelectedHospitalId(""); }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-main)] border border-[var(--border-color)] transition-all">
                                <X size={14} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-[var(--text-muted)]">Select an active provider eligible for this service booking.</p>
                            <div>
                                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Provider</label>
                                <select
                                    value={selectedHospitalId}
                                    onChange={e => setSelectedHospitalId(e.target.value)}
                                    className="w-full h-10 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-blue-500"
                                >
                                    <option value="">Select provider...</option>
                                    {getEligibleProvidersForBooking(acceptServiceModal.booking).map(d => (
                                        <option key={d._id} value={d._id}>
                                            {d.name}{d.specialization?.length ? ` — ${d.specialization.join(", ")}` : ""}{d.mobileNumber ? ` (${d.mobileNumber})` : ""}
                                        </option>
                                    ))}
                                </select>
                                {getEligibleProvidersForBooking(acceptServiceModal.booking).length === 0 && (
                                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-2">No active matching providers found.</p>
                                )}
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => { setAcceptServiceModal(null); setSelectedHospitalId(""); }}
                                    className="flex-1 h-9 rounded-lg border border-[var(--border-color)] text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAcceptServiceWithHospital}
                                    disabled={!selectedHospitalId || updateStatusMutation.isPending}
                                    className="flex-1 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {updateStatusMutation.isPending ? "Assigning..." : "Assign"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
