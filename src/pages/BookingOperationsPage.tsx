import { useState, useDeferredValue } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Clock, CheckCircle2, XCircle, User, Calendar, MapPin, CreditCard, Briefcase, ChevronLeft, ChevronRight, Search, Filter, Eye, Check, CheckCheck, X, RefreshCw, Loader2, Stethoscope, Truck, Package } from "lucide-react";
import { toast } from "sonner";

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

export function BookingOperationsPage() {
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<"doctors" | "services" | "hospital">("services");
    const [serviceCategory, setServiceCategory] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState("");

    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "All");
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    
    // Defer search to prevent lag
    const deferredSearch = useDeferredValue(searchQuery);

    // Advanced Filters State
    const [showFilters, setShowFilters] = useState(false);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("All");
    const [departmentFilter, setDepartmentFilter] = useState("All");
    const [serviceFilter, setServiceFilter] = useState("All");
    const [subServiceFilter, setSubServiceFilter] = useState("All");
    const DOCTOR_STATUS_UI_TO_API: Record<string, string> = {
        All: "All",
        PENDING: "Pending",
        CONFIRMED: "Confirmed",
        COMPLETED: "Completed",
        CANCELLED: "Cancelled",
    };

    const normalizeBookingPayload = (payload: any) => {
        if (Array.isArray(payload)) {
            return {
                items: payload,
                total: payload.length,
                page: 1,
                totalPages: 1,
                stats: {
                    all: payload.length,
                    pending: 0,
                    confirmed: 0,
                    completed: 0,
                    cancelled: 0,
                },
            };
        }
        return payload || { items: [], total: 0, page: 1, totalPages: 1, stats: { all: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 } };
    };

    // Fetching Bookings
    const { data: doctorData, isLoading: loadingDocs } = useQuery({
        queryKey: ["admin_doctor_bookings", activeTab, page, statusFilter, deferredSearch, dateFrom, dateTo, paymentFilter, subServiceFilter],
        queryFn: async () => {
            if (activeTab !== "doctors") return null;
            const params = new URLSearchParams({ page: page.toString(), limit: "55" });
            if (statusFilter !== "All") params.append("status", DOCTOR_STATUS_UI_TO_API[statusFilter] || statusFilter);
            if (deferredSearch) params.append("search", deferredSearch);
            if (dateFrom) params.append("dateFrom", dateFrom);
            if (dateTo) params.append("dateTo", dateTo);
            if (paymentFilter !== "All") params.append("payment", paymentFilter);
            if (subServiceFilter !== "All") params.append("subService", subServiceFilter);
            const res = await api.get(`/admin/bookings/doctors?${params.toString()}`);
            return normalizeBookingPayload(res.data.data);
        },
        placeholderData: (prev) => prev
    });

    const { data: serviceData, isLoading: loadingServices } = useQuery({
        queryKey: ["admin_service_bookings", activeTab, page, statusFilter, deferredSearch, dateFrom, dateTo, paymentFilter, serviceFilter, departmentFilter, serviceCategory],
        queryFn: async () => {
            if (activeTab !== "services") return null;
            const params = new URLSearchParams({ page: page.toString(), limit: "55" });
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
        placeholderData: (prev) => prev
    });

    const { data: hospitalData, isLoading: loadingHospital } = useQuery({
        queryKey: ["admin_hospital_bookings", activeTab, page, statusFilter, deferredSearch, dateFrom, dateTo, paymentFilter],
        queryFn: async () => {
            if (activeTab !== "hospital") return null;
            const params = new URLSearchParams({ page: page.toString(), limit: "55" });
            if (statusFilter !== "All") params.append("status", statusFilter);
            if (deferredSearch) params.append("search", deferredSearch);
            if (dateFrom) params.append("dateFrom", dateFrom);
            if (dateTo) params.append("dateTo", dateTo);
            if (paymentFilter !== "All") params.append("payment", paymentFilter);
            const res = await api.get(`/admin/bookings/hospital?${params.toString()}`);
            return normalizeBookingPayload(res.data.data);
        },
        placeholderData: (prev) => prev
    });

    const { data: categories } = useQuery({
        queryKey: ["admin_categories"],
        queryFn: async () => {
            const res = await api.get("/services");
            return res.data.data as { _id: string, name: string, type?: string }[];
        }
    });

    const { data: doctorsList } = useQuery({
        queryKey: ["admin_doctors_list"],
        queryFn: async () => {
            const res = await api.get("/admin/doctors?status=Active&limit=500");
            const payload = res.data?.data;
            if (Array.isArray(payload)) return payload as DoctorListItem[];
            if (Array.isArray(payload?.items)) return payload.items as DoctorListItem[];
            return [];
        }
    });
    const normalizedDoctorsList: DoctorListItem[] = Array.isArray(doctorsList)
        ? doctorsList
        : Array.isArray((doctorsList as any)?.items)
            ? (doctorsList as any).items
            : [];

    const doctorCategory = categories?.find(c => c.type === 'doctor' || c.name.toLowerCase().includes('doctor'));

    const { data: doctorSubServices } = useQuery({
        queryKey: ["admin_subservices", doctorCategory?._id],
        queryFn: async () => {
            if (!doctorCategory?._id) return [];
            const res = await api.get(`/subservice/${doctorCategory._id}`);
            return res.data.data as { _id: string, name: string }[];
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
            return normalizedDoctorsList.filter((d) => d.status === "Active");
        }
        const allowed = new Set(allowedRoleIds.map((id: any) => String(id?._id || id)));
        return normalizedDoctorsList.filter((d) => d.status === "Active" && allowed.has(getProviderRoleId(d)));
    };

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, type, status, assignedProviderId }: { id: string, type: "doctor" | "service", status: string; assignedProviderId?: string }) => {
            const endpoint = type === "doctor" ? `/admin/bookings/doctors/${id}/status` : `/admin/bookings/services/${id}/status`;
            const body: { status: string; assignedProviderId?: string } = { status };
            if (assignedProviderId) body.assignedProviderId = assignedProviderId;
            const res = await api.put(endpoint, body);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_doctor_bookings"] });
            queryClient.invalidateQueries({ queryKey: ["admin_service_bookings"] });
            queryClient.invalidateQueries({ queryKey: ["admin_hospital_bookings"] });
            setAcceptServiceModal(null);
            setSelectedHospitalId("");
            toast.success("Booking updated successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to update booking. Please try again.");
        }
    });

    const handleUpdateStatus = (id: string, type: "doctor" | "service", status: string, assignedProviderId?: string) => {
        updateStatusMutation.mutate({ id, type, status, assignedProviderId });
    };

    const handleAcceptServiceWithHospital = () => {
        if (!acceptServiceModal || !selectedHospitalId) return;
        handleUpdateStatus(acceptServiceModal.bookingId, "service", "ACCEPTED", selectedHospitalId);
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
    
    // Frontend Filter Fallback (Ensures tabs work even if backend hasn't been deployed/updated)
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

    const statsCards = [
        { label: "All", count: stats.all || 0, value: "All" },
        { label: "Pending", count: stats.pending || 0, value: "PENDING" },
        { label: "Assigned", count: stats.confirmed || 0, value: "CONFIRMED" },
        { label: "Completed", count: stats.completed || 0, value: "COMPLETED" },
        { label: "Cancelled", count: stats.cancelled || 0, value: "CANCELLED" },
    ];
    const ITEMS_PER_PAGE = 55;

    return (
        <div className="w-full space-y-6 animate-in text-left items-start px-4">
            <header className="w-full bg-[var(--card-bg)] p-10 rounded-[32px] shadow-sm border border-[var(--border-color)]">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex flex-col items-start text-left gap-3">
                        <h1 className="text-5xl font-black tracking-tighter text-[var(--text-main)]">Service Orders</h1>
                        <div className="flex items-center gap-2.5 px-4 py-1.5 bg-green-50 dark:bg-green-500/10 rounded-full border border-green-100 dark:border-green-500/20">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
                            <p className="text-[11px] font-black text-green-700 dark:text-green-400 uppercase tracking-[0.25em]">Live Operations Desk</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-nowrap overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
                        <div className="flex items-center bg-[var(--bg-main)] p-1.5 rounded-[20px] border border-[var(--border-color)] shadow-inner shrink-0">
                            <div className="relative group min-w-[300px]">
                                <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-blue-600 transition-all duration-300 z-10" />
                                <input
                                    type="text"
                                    placeholder="Search Patient name, ID or Mobile..."
                                    className="w-full bg-transparent border-none text-sm font-bold pr-6 h-12 outline-none focus:ring-0 text-[var(--text-main)] placeholder:text-slate-400"
                                    style={{ paddingLeft: '80px' }}
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                />
                            </div>
                            <button 
                                className="h-10 px-5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 shrink-0"
                                onClick={() => toast.success(`Intelligence scan: "${searchQuery}"`)}
                            >
                                Search
                            </button>
                        </div>

                        <div className="flex bg-[var(--bg-main)] p-1.5 rounded-[20px] shadow-inner shrink-0">
                            <button
                                onClick={() => { setActiveTab("services"); setPage(1); }}
                                className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeTab === "services" ? "bg-[var(--card-bg)] text-blue-600 dark:text-blue-400 shadow-md scale-105" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
                            >
                                Service Requests
                            </button>
                            <button
                                onClick={() => { setActiveTab("doctors"); setPage(1); }}
                                className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeTab === "doctors" ? "bg-[var(--card-bg)] text-blue-600 dark:text-blue-400 shadow-md scale-105" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
                            >
                                Doctor Consult
                            </button>
                            <button
                                onClick={() => { setActiveTab("hospital"); setPage(1); }}
                                className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeTab === "hospital" ? "bg-[var(--card-bg)] text-blue-600 dark:text-blue-400 shadow-md scale-105" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
                            >
                                Hospital Bookings
                            </button>
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`h-14 px-6 flex items-center justify-center gap-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all shadow-sm shrink-0 ${showFilters ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-[var(--border-color)]'}`}
                        >
                            <Filter size={18} />
                            <span>Filters</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm animate-in slide-in-from-top-4 fade-in duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)]">Advanced Filters</h3>
                        <button
                            onClick={() => {
                                setDateFrom(""); setDateTo(""); setPaymentFilter("All");
                                setDepartmentFilter("All"); setServiceFilter("All");
                                setSubServiceFilter("All");
                            }}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                            <RefreshCw size={12} /> Reset All
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Date Range */}
                        <div className="col-span-1 lg:col-span-2 grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5 ml-1">From Date</label>
                                <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 text-[var(--text-main)]" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5 ml-1">To Date</label>
                                <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 text-[var(--text-main)]" />
                            </div>
                        </div>

                        {/* Payment Status */}
                        <div>
                            <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5 ml-1">Payment</label>
                            <select value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(1); }} className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 text-[var(--text-main)]">
                                <option value="All">All Statuses</option>
                                <option value="COMPLETED">Paid</option>
                                <option value="PENDING">Pending</option>
                                <option value="FAILED">Failed</option>
                            </select>
                        </div>

                        {activeTab === "doctors" && (
                            <div>
                                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5 ml-1">Sub-Specialization</label>
                                <select value={subServiceFilter} onChange={e => { setSubServiceFilter(e.target.value); setPage(1); }} className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 text-[var(--text-main)]">
                                    <option value="All">All Specializations</option>
                                    {doctorSubServices?.map(sub => (
                                        <option key={sub._id} value={sub.name}>{sub.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {activeTab === "services" && (
                            <div>
                                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5 ml-1">Service Node</label>
                                <select value={serviceFilter} onChange={e => { setServiceFilter(e.target.value); setPage(1); }} className="w-full h-11 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 text-[var(--text-main)]">
                                    <option value="All">All Services</option>
                                    {categories?.map(c => (
                                        <option key={c._id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Stat Cards Row */}
            <div className="flex flex-wrap gap-4">
                {statsCards.map((stat) => (
                    <button
                        key={stat.value}
                        onClick={() => { setStatusFilter(stat.value); setPage(1); }}
                        className={`group flex-1 min-w-[140px] flex flex-col items-center justify-center py-5 px-4 rounded-2xl border transition-all duration-300 ${statusFilter === stat.value
                            ? "bg-[var(--card-bg)] border-[var(--text-main)] shadow-md ring-1 ring-[var(--text-main)] scale-[1.02]"
                            : "bg-[var(--card-bg)] border-[var(--border-color)] hover:border-[var(--text-muted)] shadow-sm"
                            }`}
                    >
                        <span className={`text-[32px] md:text-[40px] leading-none font-black mb-1 transition-colors ${statusFilter === stat.value ? "text-[var(--text-main)]" : "text-[var(--text-main)]"}`}>
                            {stat.count}
                        </span>
                        <span className={`text-xs font-semibold capitalize tracking-wide ${statusFilter === stat.value ? "text-[var(--text-main)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-main)]"}`}>
                            {stat.label}
                        </span>
                    </button>
                ))}
            </div>

            {activeTab === "services" && (
                <div className="flex flex-wrap gap-3 mb-6">
                    {[
                        { id: "All", label: "All Services", icon: <Filter size={14} /> },
                        { id: "Nurse", label: "Nursing Services", icon: <Stethoscope size={14} /> },
                        { id: "Ambulance", label: "Ambulance", icon: <Truck size={14} /> },
                        { id: "Rental", label: "Medical Equipment", icon: <Package size={14} /> }
                    ].map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => { setServiceCategory(cat.id); setPage(1); }}
                            className={`h-11 px-5 flex items-center gap-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${serviceCategory === cat.id 
                                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20 scale-105" 
                                : "bg-[var(--card-bg)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50"}`}
                        >
                            {cat.icon}
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-[var(--bg-main)] border-b border-[var(--border-color)] text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-black">
                                <th className="py-5 px-6 whitespace-nowrap w-[60px]">Sl No</th>
                                <th className="py-5 px-6 whitespace-nowrap">Order ID</th>
                                <th className="py-5 px-6 whitespace-nowrap min-w-[200px]">
                                    {activeTab === "doctors" ? "Doctor" : activeTab === "services" ? "Service" : "Hospital Task"}
                                </th>
                                <th className="py-5 px-6 whitespace-nowrap">Patient Name</th>
                                <th className="py-5 px-6 whitespace-nowrap">Date & Time</th>
                                <th className="py-5 px-6 whitespace-nowrap">Status</th>
                                <th className="py-5 px-6 whitespace-nowrap">Amount</th>
                                <th className="py-5 px-6 whitespace-nowrap text-center">Acceptance</th>
                                <th className="py-5 px-6 whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {((activeTab === "doctors" && loadingDocs) || (activeTab === "services" && loadingServices) || (activeTab === "hospital" && loadingHospital)) ? (
                                <tr>
                                    <td colSpan={9} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Operations Desk...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedData.length > 0 ? (
                                paginatedData.map((booking: any, index: number) => {
                                    const isPending = booking.status?.toUpperCase() === "PENDING" || booking.status?.toUpperCase() === "RETURNED_TO_ADMIN";
                                    const isConfirmed = booking.status?.toUpperCase() === "CONFIRMED" || booking.status?.toUpperCase() === "ACCEPTED";
                                    return (
                                        <tr key={booking._id} className="hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-colors group">
                                            <td className="py-5 px-6 text-sm font-black text-[var(--text-muted)]">
                                                {String((page - 1) * ITEMS_PER_PAGE + index + 1).padStart(2, '0')}
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded inline-block">
                                                    #{booking._id.slice(-8).toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="text-sm font-bold text-[var(--text-main)] truncate max-w-[250px]">
                                                    {getBookingDisplayName(booking)}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="text-sm font-semibold text-[var(--text-main)]">
                                                    {booking.patientId?.name || booking.patientId?.mobile || "Anonymous Member"}
                                                </div>
                                                <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                                                    {booking.patientId?.mobile || "N/A"}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="text-sm font-medium text-[var(--text-main)] whitespace-nowrap">
                                                    {new Date(booking.date || booking.createdAt).toLocaleDateString()}
                                                </div>
                                                <div className="text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)] mt-0.5 whitespace-nowrap">
                                                    {booking.startingTime || new Date(booking.createdAt).toLocaleTimeString()}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest
                                                    ${booking.status?.toUpperCase() === 'PENDING' ? 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-500/10' : ''}
                                                    ${booking.status?.toUpperCase() === 'RETURNED_TO_ADMIN' ? 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20' : ''}
                                                    ${booking.status?.toUpperCase() === 'CONFIRMED' ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10' : ''}
                                                    ${booking.status?.toUpperCase() === 'COMPLETED' ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10' : ''}
                                                    ${booking.status?.toUpperCase() === 'CANCELLED' ? 'text-[var(--text-muted)] bg-[var(--bg-main)]' : ''}
                                                `}>
                                                    {booking.status?.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className={`text-sm font-black whitespace-nowrap ${booking.paymentStatus === 'COMPLETED' ? 'text-green-600 dark:text-green-400' : 'text-[var(--text-main)]'}`}>
                                                    ₹{booking.totalAmount}
                                                </div>
                                                <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider mt-0.5">
                                                    {booking.paymentStatus}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-center">
                                                {activeTab === "services" && (isPending || isConfirmed) ? (
                                                    <button
                                                        onClick={() => setAcceptServiceModal({ bookingId: booking._id, booking })}
                                                        className={`h-9 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-xs font-bold mx-auto text-white ${isConfirmed ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700 animate-soft-glow"}`}
                                                    >
                                                        <CheckCircle2 size={14} />
                                                        {isConfirmed ? "Re-assign" : "Assign Provider"}
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled={!isPending || activeTab === "services"}
                                                        onClick={() => handleUpdateStatus(booking.bookingId || booking._id, (booking as any).bookingType || (activeTab === "doctors" ? "doctor" : "service"), "Confirmed")}
                                                        className={`h-9 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-xs font-bold mx-auto 
                                                            ${isPending && activeTab !== "services"
                                                                ? "bg-blue-600 text-white hover:bg-blue-700 animate-soft-glow"
                                                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700 shadow-none"
                                                            }`}
                                                    >
                                                        <CheckCircle2 size={14} />
                                                        Accept
                                                    </button>
                                                )}
                                            </td>
                                            <td className="py-5 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => { setSelectedBooking({ ...booking, tab: activeTab }); setViewModalOpen(true); }}
                                                        className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white flex items-center justify-center transition-all border border-blue-200 dark:border-blue-500/20" title="View Details">
                                                        <Eye size={16} />
                                                    </button>



                                                    <button
                                                        disabled={booking.status?.toUpperCase() === "CANCELLED" || booking.status?.toUpperCase() === "COMPLETED"}
                                                        onClick={() => handleUpdateStatus(booking.bookingId || booking._id, (booking as any).bookingType || (activeTab === "doctors" ? "doctor" : "service"), "CANCELLED")}
                                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border 
                                                            ${(booking.status?.toUpperCase() === "CANCELLED" || booking.status?.toUpperCase() === "COMPLETED")
                                                                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border-slate-200 dark:border-slate-700"
                                                                : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white border-red-200 dark:border-red-500/20 shadow-sm"
                                                            }`}
                                                        title="Cancel Booking"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={9} className="py-24 text-center">
                                        <div className="w-20 h-20 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                                            <Calendar size={32} className="text-[var(--text-muted)]" />
                                        </div>
                                        <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">No active bookings found</h3>
                                        <p className="text-[var(--text-muted)]">There are currently no active bookings matching your criteria in this segment.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)] shadow-sm">
                    <p className="text-sm font-semibold text-[var(--text-muted)]">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {viewModalOpen && selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setViewModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl bg-[var(--card-bg)] rounded-[32px] border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-8 border-b border-[var(--border-color)]">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Order Details</span>
                                <h3 className="text-xl font-black text-[var(--text-main)] flex items-center gap-3">
                                    #{selectedBooking._id.slice(-12).toUpperCase()}
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest
                                        ${selectedBooking.status?.toUpperCase() === 'PENDING' ? 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-500/10' : ''}
                                        ${selectedBooking.status?.toUpperCase() === 'CONFIRMED' ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10' : ''}
                                        ${selectedBooking.status?.toUpperCase() === 'COMPLETED' ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10' : ''}
                                        ${selectedBooking.status?.toUpperCase() === 'CANCELLED' ? 'text-slate-500 bg-slate-50' : ''}
                                    `}>
                                        {selectedBooking.status}
                                    </span>
                                </h3>
                            </div>
                            <button onClick={() => setViewModalOpen(false)} className="w-10 h-10 rounded-full bg-[var(--bg-main)] hover:bg-[var(--border-color)] flex items-center justify-center transition-colors">
                                <X size={20} className="text-[var(--text-muted)]" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                            {/* Entity Info Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-color)]">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                        <User size={12} className="text-blue-500" /> Patient Profile
                                    </h4>
                                    <div className="space-y-1">
                                        <p className="text-[var(--text-main)] font-bold text-lg leading-tight">{selectedBooking.patientId?.name || selectedBooking.patientId?.mobile || "Guest User"}</p>
                                        <p className="text-[var(--text-muted)] font-mono text-xs">{selectedBooking.patientId?.mobile || "No mobile available"}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                        <Briefcase size={12} className="text-blue-500" />
                                        {selectedBooking.tab === "doctors" ? "Medical Expert" : "Service Info"}
                                    </h4>
                                    <div className="space-y-1">
                                        <p className="text-[var(--text-main)] font-bold text-lg leading-tight">
                                            {selectedBooking.tab === "doctors" ? selectedBooking.doctorId?.name : selectedBooking.tab === "services" ? selectedBooking.serviceId?.name : selectedBooking.serviceName}
                                        </p>
                                        <p className="text-[var(--text-muted)] text-sm font-medium">
                                            {selectedBooking.tab === "doctors" ? selectedBooking.doctorId?.specialization?.join(", ") : "Hospital Facility Token"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Scheduling & Payment */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                        <Calendar size={12} /> Appointment
                                    </h4>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-[var(--text-main)]">{new Date(selectedBooking.date || selectedBooking.createdAt).toLocaleDateString()}</p>
                                        <p className="text-xs font-medium text-[var(--text-muted)]">{selectedBooking.startingTime || new Date(selectedBooking.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                        <CreditCard size={12} /> Billing
                                    </h4>
                                    <div className="space-y-1">
                                        <p className="text-lg font-black text-[var(--text-main)]">₹{selectedBooking.totalAmount}</p>
                                        <span className={`text-[9px] font-black uppercase tracking-widest 
                                            ${selectedBooking.paymentStatus === 'COMPLETED' ? 'text-green-600' : 'text-orange-600'}`}>
                                            {selectedBooking.paymentStatus}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                        <Clock size={12} /> Created On
                                    </h4>
                                    <p className="text-sm font-bold text-[var(--text-main)]">{new Date(selectedBooking.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Additional Details */}
                            {selectedBooking.notes && (
                                <div className="space-y-3 p-5 bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/10">
                                    <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Medical Notes / Requirements</h4>
                                    <p className="text-sm text-[var(--text-main)] leading-relaxed italic">"{selectedBooking.notes}"</p>
                                </div>
                            )}

                            {selectedBooking.tab === "services" && selectedBooking.location && (
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                        <MapPin size={12} /> Service Location
                                    </h4>
                                    <p className="text-sm font-medium text-[var(--text-main)] p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                                        {selectedBooking.location}
                                    </p>
                                </div>
                            )}

                            {/* Assigned Provider */}
                            {selectedBooking.assignedProviderId && (() => {
                                const assignedId = typeof selectedBooking.assignedProviderId === "object"
                                    ? selectedBooking.assignedProviderId?._id
                                    : selectedBooking.assignedProviderId;
                                const provider = normalizedDoctorsList.find((d) => d._id === assignedId);
                                const providerName = provider?.name
                                    || (typeof selectedBooking.assignedProviderId === "object" ? selectedBooking.assignedProviderId?.name : null)
                                    || "Assigned Provider";
                                return (
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle2 size={12} /> Assigned Provider
                                        </h4>
                                        <div className="flex items-center gap-3 p-4 bg-emerald-50/60 dark:bg-emerald-500/5 rounded-xl border border-emerald-100 dark:border-emerald-500/10">
                                            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                                                {providerName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[var(--text-main)]">{providerName}</p>
                                                {provider?.mobileNumber && <p className="text-xs font-mono text-[var(--text-muted)]">{provider.mobileNumber}</p>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-[var(--border-color)] flex justify-end">
                            <button
                                onClick={() => setViewModalOpen(false)}
                                className="px-10 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-md active:scale-95"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign service to provider modal */}
            {acceptServiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setAcceptServiceModal(null); setSelectedHospitalId(""); }}></div>
                    <div className="relative w-full max-w-md bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl p-6">
                        <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">Assign Provider</h3>
                        <p className="text-sm text-[var(--text-muted)] mb-4">Choose an active provider eligible for this service. The booking will move to assigned work.</p>
                        <select
                            value={selectedHospitalId}
                            onChange={(e) => setSelectedHospitalId(e.target.value)}
                            className="w-full h-12 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-main)] mb-4"
                        >
                            <option value="">Choose provider...</option>
                            {getEligibleProvidersForBooking(acceptServiceModal.booking).map((d) => (
                                <option key={d._id} value={d._id}>
                                    {d.name} {d.specialization?.length ? `- ${d.specialization.join(", ")}` : ""} {d.mobileNumber ? `(${d.mobileNumber})` : ""}
                                </option>
                            ))}
                        </select>
                        {getEligibleProvidersForBooking(acceptServiceModal.booking).length === 0 && (
                            <p className="text-xs font-bold text-rose-600 mb-4">No active matching providers found for this service.</p>
                        )}
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => { setAcceptServiceModal(null); setSelectedHospitalId(""); }} className="px-5 h-11 rounded-xl border border-[var(--border-color)] font-bold text-[var(--text-main)]">Cancel</button>
                            <button onClick={handleAcceptServiceWithHospital} disabled={!selectedHospitalId || updateStatusMutation.isPending} className="px-5 h-11 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50">Assign</button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
