import { useState, useDeferredValue } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Clock, CheckCircle2, Calendar, Search, Eye, Check, CheckCheck, X, Filter, ChevronDown, RefreshCw, Loader2, TrendingUp, AlertCircle, ChevronLeft, ChevronRight, Stethoscope, Ticket } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/context/ConfirmationContext";
import { formatDate, formatDateTime, formatTime } from "@/lib/format";
import { TableSkeleton } from "@/components/ui/Skeletons";

interface ServiceBooking {
    _id: string;
    patientId: { name: string; mobile: string };
    doctorId?: { name?: string; specialization?: string[]; mobileNumber?: string };
    serviceId: { name: string };
    status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
    paymentStatus: "PENDING" | "COMPLETED" | "FAILED";
    totalAmount: number;
    createdAt: string;
    fulfillmentMode: "HOME_VISIT" | "HOSPITAL_VISIT" | "VIRTUAL";
    date?: string;
    startingTime?: string;
    notes?: string;
    tokenNumber?: string;
    checkInPin?: string;
    assignedProviderId?: any;
    acceptedBy?: any;
    partnerId?: any;
    hospitalId?: any;
    providerId?: any;
}

export function OPBookingsPage() {
    const [searchParams] = useSearchParams();
    const [page, setPage] = useState(1);
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "PENDING");
    // 'doctor' = Doctor OP Consultations | 'token' = Hospital OP Tokens
    const [bookingType, setBookingType] = useState<'doctor' | 'token'>('doctor');

    // Advanced Filters State
    const [showFilters, setShowFilters] = useState(false);
    const todayStr = new Date().toISOString().split('T')[0];
    const [dateFrom, setDateFrom] = useState(todayStr);
    const [dateTo, setDateTo] = useState(todayStr);
    const [paymentFilter, setPaymentFilter] = useState("All");
    const [sourceFilter, setSourceFilter] = useState("All");
    const [patientTypeFilter, setPatientTypeFilter] = useState("All");
    const [doctorFilter, setDoctorFilter] = useState("All");
    const [departmentFilter, setDepartmentFilter] = useState("All");
    const [slotFilter, setSlotFilter] = useState("All");
    const STATUS_UI_TO_API: Record<string, string> = {
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
    const deferredSearch = useDeferredValue(searchQuery);

    const { data: serviceData, isLoading: loadingServices, isFetching: fetchingServices } = useQuery({
        queryKey: ["admin_service_bookings", page, deferredSearch, statusFilter, dateFrom, dateTo, paymentFilter, sourceFilter, patientTypeFilter, doctorFilter, departmentFilter, slotFilter],
        queryFn: async () => {
            const params = new URLSearchParams({ page: page.toString(), limit: "10" });
            if (deferredSearch) params.append("search", deferredSearch);
            if (dateFrom) params.append("dateFrom", dateFrom);
            if (dateTo) params.append("dateTo", dateTo);
            if (paymentFilter !== "All") params.append("payment", paymentFilter);
            if (sourceFilter !== "All") params.append("source", sourceFilter);
            if (departmentFilter !== "All") params.append("department", departmentFilter);
            if (doctorFilter !== "All") params.append("doctor", doctorFilter);
            if (slotFilter !== "All") params.append("slot", slotFilter);
            if (patientTypeFilter !== "All") params.append("patientType", patientTypeFilter);
            if (statusFilter !== "All") params.append("status", STATUS_UI_TO_API[statusFilter] || statusFilter);
            params.append("consultationType", "OP,VIRTUAL");

            const res = await api.get(`/admin/bookings/doctors?${params.toString()}`);
            const payload = normalizeBookingPayload(res.data.data);
            const items = Array.isArray(payload.items) ? payload.items : [];
            const normalizedItems = items.map((item: any) => {
                const specialization = item?.serviceName || (Array.isArray(item?.doctorId?.specialization) ? item.doctorId.specialization[0] : "");
                const fallbackName = item?.serviceId?.name || item?.doctorId?.name || "Doctor Consultation";
                return {
                    ...item,
                    serviceId: { ...(item?.serviceId || {}), name: specialization || fallbackName },
                };
            });
            return { ...payload, items: normalizedItems };
        },
        placeholderData: (prev) => prev
    });

    const allBookings = serviceData?.items || [];
    // Split into two types based on the isServiceRequest flag set by the backend
    const doctorBookings = allBookings.filter((b: any) => !b.isServiceRequest);
    const tokenBookings  = allBookings.filter((b: any) =>  b.isServiceRequest);
    const serviceBookings = bookingType === 'doctor' ? doctorBookings : tokenBookings;
    const stats = serviceData?.stats || { all: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    const totalPages = serviceData?.totalPages || 1;

    const { data: categories } = useQuery({
        queryKey: ["admin_categories"],
        queryFn: async () => {
            const res = await api.get("/services");
            return res.data.data as { _id: string, name: string, type?: string }[];
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const endpoint = `/admin/bookings/doctors/${id}/status`;
            const statusMap: Record<string, string> = {
                CONFIRMED: "Confirmed",
                COMPLETED: "Completed",
                CANCELLED: "Cancelled",
            };
            const res = await api.put(endpoint, { status: statusMap[status] || status });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_service_bookings"] });
        }
    });

    const verifyPinMutation = useMutation({
        mutationFn: async ({ id, pin }: { id: string, pin: string }) => {
            const res = await api.post(`/service-bookings/verify-pin/${id}`, { pin });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_service_bookings"] });
        },
        onError: (err: any) => {
            alert(err?.response?.data?.message || "Invalid PIN or Verification Failed");
        }
    });

    const handleUpdateStatus = (id: string, status: string) => {
        updateStatusMutation.mutate({ id, status });
    };

    const handleVerifyPin = (id: string) => {
        const pin = window.prompt("Enter the 4-digit check-in PIN provided by the patient:");
        if (pin && pin.trim().length === 4) {
            verifyPinMutation.mutate({ id, pin: pin.trim() });
        } else if (pin !== null) {
            alert("Please enter a valid 4-digit PIN.");
        }
    };

    const getStatusLabel = (status: string): string => {
        const map: Record<string, string> = {
            PENDING: 'Pending',
            BROADCASTED: 'Finding Partner',
            ACCEPTED: 'Partner Assigned',
            IN_PROGRESS: 'In Progress',
            COMPLETED: 'Completed',
            CANCELLED: 'Cancelled',
            RETURNED_TO_ADMIN: 'Needs Reassignment',
            Pending: 'Pending',
            Confirmed: 'Confirmed',
            Completed: 'Completed',
            Cancelled: 'Cancelled',
        };
        return map[status] || status.replace(/_/g, ' ');
    };

    const filteredTokens = serviceBookings;

    const STAT_CARDS = [
        { label: "Total",     value: "All",       count: stats.all || 0,       color: "text-slate-700 dark:text-slate-300", icon: <TrendingUp size={14} /> },
        { label: "Pending",   value: "PENDING",   count: stats.pending || 0,   color: "text-amber-600 dark:text-amber-400", icon: <Clock size={14} /> },
        { label: "Confirmed", value: "CONFIRMED", count: stats.confirmed || 0, color: "text-blue-600 dark:blue-400",   icon: <CheckCircle2 size={14} /> },
        { label: "Completed", value: "COMPLETED", count: stats.completed || 0, color: "text-emerald-600 dark:emerald-400", icon: <CheckCircle2 size={14} /> },
        { label: "Cancelled", value: "CANCELLED", count: stats.cancelled || 0, color: "text-slate-500 dark:text-slate-400", icon: <AlertCircle size={14} /> },
    ];

    return (
        <div className="space-y-6 animate-in">
            {/* ── Page Header ── */}
            <header className="flex flex-col gap-2 bg-gradient-to-br from-[var(--primary)] to-emerald-800 p-6 md:p-8 rounded-2xl shadow-lg shadow-emerald-900/10 border-0 relative overflow-hidden text-left items-start min-h-[160px] md:min-h-[180px]">
                {/* Decorative Blobs */}
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative z-10 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1">OP & Virtual Bookings</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                <p className="text-xs md:text-sm font-medium text-emerald-50 tracking-wide opacity-90">
                                    Home • Bookings • Doctor Appointments &nbsp;•&nbsp; Auto-refreshes every 15s
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-12 right-32 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            </header>

            {/* ── Booking Type Selector Cards ── */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => { setBookingType('doctor'); setPage(1); setStatusFilter('All'); }}
                    className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-lg group
                        ${bookingType === 'doctor'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-md ring-1 ring-blue-500/20'
                            : 'border-[var(--border-color)] bg-[var(--card-bg)] hover:border-blue-300'
                        }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors
                        ${bookingType === 'doctor' ? 'bg-blue-600 text-white shadow-sm' : 'bg-[var(--bg-main)] text-[var(--text-muted)] group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                        <Stethoscope size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold mb-0.5 ${bookingType === 'doctor' ? 'text-blue-700 dark:text-blue-300' : 'text-[var(--text-main)]'}`}>
                            Doctor OP Consultations
                        </p>
                        <p className="text-xs text-[var(--text-muted)] leading-snug">Doctor appointments booked via doctor profile</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className={`text-2xl font-black ${bookingType === 'doctor' ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-main)]'}`}>
                            {doctorBookings.length}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] font-medium">bookings</p>
                    </div>
                    {bookingType === 'doctor' && <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                </button>

                <button
                    onClick={() => { setBookingType('token'); setPage(1); setStatusFilter('All'); }}
                    className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-lg group
                        ${bookingType === 'token'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-md ring-1 ring-emerald-500/20'
                            : 'border-[var(--border-color)] bg-[var(--card-bg)] hover:border-emerald-300'
                        }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors
                        ${bookingType === 'token' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[var(--bg-main)] text-[var(--text-muted)] group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                        <Ticket size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold mb-0.5 ${bookingType === 'token' ? 'text-emerald-700 dark:text-emerald-300' : 'text-[var(--text-main)]'}`}>
                            Hospital OP Tokens
                        </p>
                        <p className="text-xs text-[var(--text-muted)] leading-snug">Queue tokens booked for hospital departments</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className={`text-2xl font-black ${bookingType === 'token' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-main)]'}`}>
                            {tokenBookings.length}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] font-medium">tokens</p>
                    </div>
                    {bookingType === 'token' && <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
                </button>
            </div>

            {/* ── Stats Row ── */}
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {STAT_CARDS.map(s => (
                    <button
                        key={s.value}
                        onClick={() => { setStatusFilter(s.value); setPage(1); }}
                        className={`flex-1 min-w-[140px] bg-[var(--card-bg)] border rounded-xl p-4 text-left transition-all duration-200 hover:shadow-md
                            ${statusFilter === s.value
                                ? bookingType === 'doctor' ? "border-blue-500 shadow-sm ring-1 ring-blue-500/30" : "border-emerald-500 shadow-sm ring-1 ring-emerald-500/30"
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

{/* -- Toolbar -- */}
                <div className="flex flex-row flex-wrap items-center gap-3 p-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                    <div style={{ position: "relative", width: "320px", flexShrink: 0 }}>
                        {fetchingServices ? (
                            <Loader2 size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#3b82f6", animation: "spin 1s linear infinite", zIndex: 10 }} />
                        ) : (
                            <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", zIndex: 10 }} />
                        )}
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

                    <div className="flex items-center xl:justify-end gap-3 flex-1 flex-wrap">
                        <div className="flex items-center gap-2">
                            <label className="text-[11px] font-medium text-[var(--text-muted)] whitespace-nowrap">From:</label>
                            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                                className="h-10 px-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg text-xs font-semibold text-[var(--text-main)] outline-none focus:border-blue-500" />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-[11px] font-medium text-[var(--text-muted)] whitespace-nowrap">To:</label>
                            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
                                className="h-10 px-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg text-xs font-semibold text-[var(--text-main)] outline-none focus:border-blue-500" />
                        </div>
                        {(dateFrom || dateTo) && (
                            <button
                                onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
                                className="flex items-center gap-1 h-10 px-3 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                            >
                                <RefreshCw size={11} /> Reset
                            </button>
                        )}
                    </div>
                </div>

                
            {/* ── Data Table ── */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider w-10">#</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Order</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider min-w-[180px]">Service / specialty</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Patient</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Date & Time</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Amount</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {loadingServices ? (
                                <tr>
                                    <td colSpan={8} className="p-0">
                                        <TableSkeleton columns={8} rows={5} showHeader={false} />
                                    </td>
                                </tr>
                            ) : Array.isArray(filteredTokens) && filteredTokens.length > 0 ? (
                                filteredTokens.map((booking, index) => {
                                    const isPending = booking.status?.toUpperCase() === "PENDING" || booking.status?.toUpperCase() === "RETURNED_TO_ADMIN";
                                    const isConfirmed = booking.status?.toUpperCase() === "CONFIRMED";
                                    return (
                                        <tr key={booking._id} className="hover:bg-[var(--bg-main)] transition-colors group">
                                            <td className="py-3.5 px-4 text-xs font-medium text-[var(--text-muted)]">
                                                {String((page - 1) * 10 + index + 1).padStart(2, '0')}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded">
                                                    {bookingType === 'token' && booking.tokenNumber ? booking.tokenNumber : `#${booking._id.slice(-8).toUpperCase()}`}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="text-sm font-medium text-[var(--text-main)] truncate max-w-[200px]" title={booking.serviceId?.name}>
                                                    {bookingType === 'token'
                                                        ? (booking.doctorId?.name || 'Hospital OP Token')
                                                        : (booking.serviceName || booking.serviceId?.name || "Doctor Consult")}
                                                </div>
                                                {bookingType === 'doctor' && booking.doctorId?.name && (
                                                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                                                        Dr. {booking.doctorId.name}
                                                    </div>
                                                )}
                                                {bookingType === 'token' && booking.notes && (
                                                    <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                                                        {booking.notes.replace('[Auto-Accepted for Hospital OP Queue]', '').trim()}
                                                    </div>
                                                )}
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
                                                    {new Date(booking.date || booking.createdAt).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                                                    {booking.startingTime || new Date(booking.createdAt).toLocaleTimeString()}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border
                                                    ${booking.status?.toUpperCase() === 'PENDING' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' : ''}
                                                    ${booking.status?.toUpperCase() === 'RETURNED_TO_ADMIN' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' : ''}
                                                    ${booking.status?.toUpperCase() === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : ''}
                                                    ${booking.status?.toUpperCase() === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : ''}
                                                    ${booking.status?.toUpperCase() === 'CANCELLED' ? 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20' : ''}
                                                `}>
                                                    <span className={`w-1.5 h-1.5 rounded-full
                                                        ${booking.status?.toUpperCase() === 'PENDING' ? 'bg-orange-400' : ''}
                                                        ${booking.status?.toUpperCase() === 'RETURNED_TO_ADMIN' ? 'bg-rose-400' : ''}
                                                        ${booking.status?.toUpperCase() === 'CONFIRMED' ? 'bg-blue-400' : ''}
                                                        ${booking.status?.toUpperCase() === 'COMPLETED' ? 'bg-emerald-400' : ''}
                                                        ${booking.status?.toUpperCase() === 'CANCELLED' ? 'bg-slate-400' : ''}
                                                    `} />
                                                    {getStatusLabel(booking.status || '')}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className={`text-sm font-semibold ${booking.paymentStatus === 'COMPLETED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-main)]'}`}>
                                                    ₹{booking.totalAmount}
                                                </div>
                                                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                                    {booking.paymentStatus === 'COMPLETED' ? 'Paid' : booking.paymentStatus === 'PENDING' ? 'Unpaid' : (booking.paymentStatus || '—')}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => navigate(`/op-bookings/${booking._id}`)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 border border-[var(--border-color)] hover:border-blue-300 dark:hover:border-blue-500/30 transition-all"
                                                        title="View Details"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    
{bookingType === 'token' ? (
                                                        booking.fulfillmentMode === "HOSPITAL_VISIT" && (isConfirmed || booking.status?.toUpperCase() === "CONFIRMED") ? (
                                                            <button
                                                                onClick={() => handleVerifyPin(booking._id)}
                                                                className="w-[76px] shrink-0 h-8 rounded-lg flex items-center justify-center border text-[var(--text-muted)] hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 border-[var(--border-color)] hover:border-indigo-300 transition-all text-[11px] font-bold"
                                                                title="Verify Arrival PIN"
                                                            >
                                                                Verify PIN
                                                            </button>
                                                        ) : (
                                                            <div className="w-[76px] shrink-0" />
                                                        )
                                                    ) : null}

                                                    {bookingType === 'token' && (
                                                        <>
                                                            <button
                                                                disabled={!isPending}
                                                                onClick={() => handleUpdateStatus(booking._id, "CONFIRMED")}
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all 
                                                                    ${isPending 
                                                                        ? "text-[var(--text-muted)] hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10 dark:hover:text-amber-400 border-[var(--border-color)] hover:border-amber-300" 
                                                                        : "text-[var(--text-muted)] border-[var(--border-color)] cursor-not-allowed opacity-40"
                                                                    }`}
                                                                title="Confirm Appointment"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                            <button
                                                                disabled={!(isConfirmed || isPending)}
                                                                onClick={() => handleUpdateStatus(booking._id, "COMPLETED")}
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all 
                                                                    ${(isConfirmed || isPending) 
                                                                        ? "text-[var(--text-muted)] hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-500/10 dark:hover:text-green-400 border-[var(--border-color)] hover:border-green-300" 
                                                                        : "text-[var(--text-muted)] border-[var(--border-color)] cursor-not-allowed opacity-40"
                                                                    }`}
                                                                title="Mark as Completed"
                                                            >
                                                                <CheckCheck size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                    
                                                    <button
                                                        disabled={booking.status?.toUpperCase() === "CANCELLED" || booking.status?.toUpperCase() === "COMPLETED"}
                                                        onClick={async () => {
                                                            const isConfirmed = await confirm({
                                                                title: "Cancel Appointment",
                                                                message: `Cancel this appointment for ${booking.patientId?.name || 'this patient'}?`,
                                                                confirmText: "Cancel",
                                                                type: "danger"
                                                            });
                                                            if (!isConfirmed) return;
                                                            handleUpdateStatus(booking._id, "CANCELLED");
                                                        }}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all
                                                            ${(booking.status?.toUpperCase() !== "CANCELLED" && booking.status?.toUpperCase() !== "COMPLETED")
                                                                ? "text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 border-[var(--border-color)] hover:border-red-300"
                                                                : "text-[var(--text-muted)] border-[var(--border-color)] cursor-not-allowed opacity-40"
                                                            }`}
                                                        title="Cancel Appointment"
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
                                    <td colSpan={8} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-center mx-auto text-[var(--text-muted)]">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--text-main)]">No appointments found</p>
                                                <p className="text-xs text-[var(--text-muted)] mt-0.5">Try adjusting your filters or search query.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-color)]">
                    <p className="text-xs text-[var(--text-muted)]">
                        Page <span className="font-semibold text-[var(--text-main)]">{page}</span> of <span className="font-semibold text-[var(--text-main)]">{Math.max(1, totalPages)}</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(Math.max(1, totalPages), p + 1))}
                            disabled={page >= Math.max(1, totalPages)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
