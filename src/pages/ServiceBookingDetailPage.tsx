import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    ChevronLeft, User, Calendar, CreditCard, MapPin,
    Phone, Mail, Clock, Briefcase, CheckCircle2, AlertCircle,
    Package, Activity, RefreshCw, XCircle, CheckSquare, Loader2, DollarSign
} from "lucide-react";
import { formatDate, formatDateTime, formatTime } from "@/lib/format";

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
    PENDING:           { label: "Pending",        dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200" },
    BROADCASTED:       { label: "Broadcasting",   dot: "bg-purple-400",  badge: "bg-purple-50 text-purple-700 border-purple-200" },
    ACCEPTED:          { label: "Accepted",        dot: "bg-blue-400",    badge: "bg-blue-50 text-blue-700 border-blue-200" },
    PARTNER_ASSIGNED:  { label: "Partner Assigned",dot: "bg-blue-400",   badge: "bg-blue-50 text-blue-700 border-blue-200" },
    IN_PROGRESS:       { label: "In Progress",     dot: "bg-cyan-400",    badge: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    COMPLETED:         { label: "Completed",       dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    CANCELLED:         { label: "Cancelled",       dot: "bg-slate-400",   badge: "bg-slate-50 text-slate-600 border-slate-200" },
    RETURNED_TO_ADMIN: { label: "Needs Review",    dot: "bg-rose-400",    badge: "bg-rose-50 text-rose-700 border-rose-200" },
};

function InfoCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
    return (
        <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] shrink-0 mt-0.5">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">{label}</p>
                <div className="text-sm font-semibold text-[var(--text-main)]">{value}</div>
                {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

export function ServiceBookingDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [confirmAction, setConfirmAction] = useState<"cancel" | "complete" | null>(null);
    const [refundOpen, setRefundOpen] = useState(false);
    const [refundAmount, setRefundAmount] = useState("");
    const [refundReason, setRefundReason] = useState("");

    const invalidate = () => qc.invalidateQueries({ queryKey: ["service_booking_detail", id] });

    const statusMutation = useMutation({
        mutationFn: (status: string) => api.put(`/admin/bookings/services/${id}/status`, { status }),
        onSuccess: () => { setConfirmAction(null); invalidate(); },
    });

    const rebroadcastMutation = useMutation({
        mutationFn: () => api.post(`/admin/bookings/services/${id}/rebroadcast`),
        onSuccess: invalidate,
    });

    const refundMutation = useMutation({
        mutationFn: () => api.post(`/admin/bookings/services/${id}/refund`, { amount: Number(refundAmount), reason: refundReason }),
        onSuccess: () => { setRefundOpen(false); setRefundAmount(""); setRefundReason(""); invalidate(); },
    });

    const isAnyActionPending = statusMutation.isPending || rebroadcastMutation.isPending || refundMutation.isPending;

    const { data: booking, isLoading, isError } = useQuery({
        queryKey: ["service_booking_detail", id],
        queryFn: async () => {
            const res = await api.get(`/admin/bookings/services/${id}`);
            return res.data.data;
        },
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)]">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="h-8 w-56 bg-[var(--card-bg)] rounded-lg animate-pulse border border-[var(--border-color)]" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-28 bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (isError || !booking) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 flex items-center justify-center text-rose-500">
                    <AlertCircle size={28} />
                </div>
                <p className="text-sm font-bold text-[var(--text-main)]">Booking not found</p>
                <button onClick={() => navigate(-1)} className="h-9 px-5 bg-[var(--card-bg)] border border-[var(--border-color)] text-sm font-semibold text-[var(--text-main)] rounded-xl hover:bg-[var(--bg-main)] transition-all">
                    ← Go Back
                </button>
            </div>
        );
    }

    const status = booking.status || "PENDING";
    const cfg = STATUS_CONFIG[status] || { label: status, dot: "bg-slate-400", badge: "bg-slate-50 text-slate-600 border-slate-200" };
    const partner = booking.assignedProviderId;
    const patient = booking.patientId;
    const address = booking.addressId;

    const fulfillmentLabel: Record<string, string> = {
        HOME_VISIT: "Home Visit",
        HOSPITAL_VISIT: "Hospital Visit",
        VIRTUAL: "Virtual / Online",
    };

    return (
        <div className="space-y-6 animate-in pb-12">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-blue-600 hover:border-blue-400 transition-all shadow-sm"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Service Booking</p>
                    <h1 className="text-xl font-black text-[var(--text-main)] tracking-tight font-mono">
                        #{String(booking._id).slice(-12).toUpperCase()}
                    </h1>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${cfg.badge}`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                </span>
            </div>

            {/* Standalone Refund Panel — available on paid completed bookings */}
            {booking?.paymentStatus === "COMPLETED" && (
                <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Refund</p>
                    {refundOpen ? (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Amount (₹)"
                                    value={refundAmount}
                                    onChange={e => setRefundAmount(e.target.value)}
                                    className="w-32 h-9 px-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-sm font-semibold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Reason (optional)"
                                    value={refundReason}
                                    onChange={e => setRefundReason(e.target.value)}
                                    className="flex-1 h-9 px-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => refundMutation.mutate()}
                                    disabled={!refundAmount || Number(refundAmount) <= 0 || refundMutation.isPending}
                                    className="h-8 px-4 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-1"
                                >
                                    {refundMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : null} Issue Refund
                                </button>
                                <button onClick={() => setRefundOpen(false)} className="h-8 px-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">
                                    Cancel
                                </button>
                            </div>
                            {refundMutation.isError && (
                                <p className="text-xs text-rose-600 font-semibold">{(refundMutation.error as any)?.response?.data?.message || "Refund failed — please try again"}</p>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => setRefundOpen(true)}
                            disabled={isAnyActionPending}
                            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                        >
                            <DollarSign size={13} /> Issue Goodwill / Partial Refund
                        </button>
                    )}
                </div>
            )}

            {/* Admin Actions */}
            {!["COMPLETED", "CANCELLED"].includes(status) && (
                <div className="flex flex-wrap gap-3 p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] shadow-sm">
                    <p className="w-full text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Admin Actions</p>

                    {/* Re-broadcast */}
                    <button
                        onClick={() => rebroadcastMutation.mutate()}
                        disabled={isAnyActionPending}
                        className="flex items-center gap-2 h-9 px-4 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-all disabled:opacity-50"
                    >
                        {rebroadcastMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        Re-broadcast to Partners
                    </button>

                    {/* Mark Complete */}
                    {["ACCEPTED", "IN_PROGRESS", "PARTNER_ASSIGNED"].includes(status) && (
                        confirmAction === "complete" ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-[var(--text-muted)]">Mark complete?</span>
                                <button
                                    onClick={() => statusMutation.mutate("COMPLETED")}
                                    disabled={statusMutation.isPending}
                                    className="h-7 px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-1"
                                >
                                    {statusMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : null} Confirm
                                </button>
                                <button onClick={() => setConfirmAction(null)} className="h-7 px-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirmAction("complete")}
                                disabled={isAnyActionPending}
                                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                            >
                                <CheckSquare size={13} /> Mark Completed
                            </button>
                        )
                    )}

                    {/* Cancel */}
                    {confirmAction === "cancel" ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--text-muted)]">
                                Cancel booking{booking?.paymentStatus === "COMPLETED" ? " + refund?" : "?"}
                            </span>
                            <button
                                onClick={() => statusMutation.mutate("CANCELLED")}
                                disabled={statusMutation.isPending}
                                className="h-7 px-3 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all disabled:opacity-50 flex items-center gap-1"
                            >
                                {statusMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : null} Confirm Cancel
                            </button>
                            <button onClick={() => setConfirmAction(null)} className="h-7 px-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">
                                Keep
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmAction("cancel")}
                            disabled={isAnyActionPending}
                            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all ml-auto disabled:opacity-50"
                        >
                            <XCircle size={13} />
                            Cancel Booking{booking?.paymentStatus === "COMPLETED" ? " + Refund" : ""}
                        </button>
                    )}

                    {/* Error display */}
                    {(statusMutation.isError || rebroadcastMutation.isError) && (
                        <p className="w-full text-xs text-rose-600 font-semibold mt-1">
                            Action failed — {((statusMutation.error || rebroadcastMutation.error) as any)?.response?.data?.message || "please try again"}
                        </p>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* ── Left Column: Booking Details ── */}
                <div className="xl:col-span-2 space-y-6">

                    {/* Service Info */}
                    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex items-center gap-2">
                            <Briefcase size={15} className="text-blue-500" />
                            <h2 className="text-sm font-bold text-[var(--text-main)]">Service Details</h2>
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoCard
                                icon={<Package size={15} />}
                                label="Service"
                                value={booking.serviceId?.name || "Unknown Service"}
                            />
                            <InfoCard
                                icon={<Activity size={15} />}
                                label="Fulfillment Mode"
                                value={fulfillmentLabel[booking.fulfillmentMode] || booking.fulfillmentMode}
                            />
                            <InfoCard
                                icon={<Calendar size={15} />}
                                label="Scheduled Slot"
                                value={booking.scheduledSlot?.startTime
                                    ? formatDate(booking.scheduledSlot.startTime)
                                    : formatDate(booking.createdAt)}
                                sub={booking.scheduledSlot?.startTime
                                    ? `${formatTime(booking.scheduledSlot.startTime)} — ${formatTime(booking.scheduledSlot.endTime)}`
                                    : formatTime(booking.createdAt)}
                            />
                            <InfoCard
                                icon={<Clock size={15} />}
                                label="Booked On"
                                value={formatDateTime(booking.createdAt)}
                            />
                            <InfoCard
                                icon={<Activity size={15} />}
                                label="Booking Type"
                                value={booking.bookingType || "—"}
                            />
                            <InfoCard
                                icon={<AlertCircle size={15} />}
                                label="Urgency"
                                value={
                                    <span className={`font-bold ${
                                        booking.urgency === "CRITICAL" ? "text-rose-600" :
                                        booking.urgency === "URGENT" ? "text-amber-600" : "text-emerald-600"
                                    }`}>{booking.urgency || "NORMAL"}</span>
                                }
                            />
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex items-center gap-2">
                            <CreditCard size={15} className="text-emerald-500" />
                            <h2 className="text-sm font-bold text-[var(--text-main)]">Payment Details</h2>
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] col-span-full sm:col-span-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Total Amount</p>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{booking.totalAmount || booking.price || 0}</p>
                            </div>
                            <InfoCard
                                icon={<CheckCircle2 size={15} />}
                                label="Payment Status"
                                value={<span className={booking.paymentStatus === "COMPLETED" ? "text-emerald-600" : "text-amber-600"}>{booking.paymentStatus}</span>}
                            />
                            <InfoCard
                                icon={<CreditCard size={15} />}
                                label="Payment Mode"
                                value={booking.paymentMode || "ONLINE"}
                            />
                            {booking.commissionAmount > 0 && (
                                <InfoCard
                                    icon={<Activity size={15} />}
                                    label="Commission"
                                    value={`₹${booking.commissionAmount} (${booking.commissionPercentage}%)`}
                                    sub={`Partner Earning: ₹${booking.partnerEarning || 0}`}
                                />
                            )}
                            {booking.discountAmount > 0 && (
                                <InfoCard
                                    icon={<Activity size={15} />}
                                    label="Discount"
                                    value={`₹${booking.discountAmount}`}
                                    sub={booking.couponCode ? `Coupon: ${booking.couponCode}` : undefined}
                                />
                            )}
                        </div>
                    </div>

                    {/* Location */}
                    {(address || booking.location) && (
                        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex items-center gap-2">
                                <MapPin size={15} className="text-rose-500" />
                                <h2 className="text-sm font-bold text-[var(--text-main)]">Service Location</h2>
                            </div>
                            <div className="p-5">
                                {address ? (
                                    <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                                        <p className="text-sm font-semibold text-[var(--text-main)]">
                                            {[address.addressLine1, address.addressLine2, address.city, address.state, address.pincode]
                                                .filter(Boolean).join(", ")}
                                        </p>
                                    </div>
                                ) : booking.location ? (
                                    <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                                        <p className="text-xs font-mono text-[var(--text-muted)]">
                                            Lat: {booking.location.lat}, Lng: {booking.location.lng}
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {booking.notes && (
                        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1.5">Notes</p>
                            <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">"{booking.notes}"</p>
                        </div>
                    )}
                </div>

                {/* ── Right Column: Patient + Partner ── */}
                <div className="space-y-6">
                    {/* Patient Card */}
                    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex items-center gap-2">
                            <User size={15} className="text-blue-500" />
                            <h2 className="text-sm font-bold text-[var(--text-main)]">Patient</h2>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center font-black text-xl text-blue-600 dark:text-blue-400 shrink-0">
                                    {(patient?.name || "?").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-base font-bold text-[var(--text-main)]">{patient?.name || "Unknown"}</p>
                                    <p className="text-xs text-[var(--text-muted)] font-mono">{patient?.mobile || "—"}</p>
                                </div>
                            </div>
                            {patient?.email && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
                                    <Mail size={13} className="text-[var(--text-muted)] shrink-0" />
                                    <span className="text-xs font-semibold text-[var(--text-main)] truncate">{patient.email}</span>
                                </div>
                            )}
                            {patient?.mobile && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
                                    <Phone size={13} className="text-[var(--text-muted)] shrink-0" />
                                    <span className="text-xs font-semibold text-[var(--text-main)] font-mono">{patient.mobile}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Partner Card */}
                    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                        {/* Header — green only when partner assigned */}
                        <div className={`px-5 py-4 flex items-center gap-2 ${partner ? "bg-emerald-600" : "border-b border-[var(--border-color)] bg-[var(--bg-main)]"}`}>
                            {partner
                                ? <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                                : <User size={15} className="text-[var(--text-muted)]" />
                            }
                            <h2 className={`text-sm font-bold ${partner ? "text-white" : "text-[var(--text-main)]"}`}>
                                {partner ? "Accepted Partner" : "Assigned Partner"}
                            </h2>
                        </div>
                        {partner ? (
                            <div className="p-5 space-y-4">
                                {/* Avatar + Name */}
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-md">
                                        {(partner.name || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-bold text-[var(--text-main)] truncate">{partner.name}</p>
                                        {partner.status && (
                                            <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                                                String(partner.status).toLowerCase() === "active"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                                    : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20"
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${String(partner.status).toLowerCase() === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                                                {partner.status}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Details */}
                                <div className="space-y-2">
                                    {partner.mobileNumber && (
                                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                                            <Phone size={13} className="text-emerald-500 shrink-0" />
                                            <span className="text-sm font-semibold text-[var(--text-main)] font-mono">{partner.mobileNumber}</span>
                                        </div>
                                    )}
                                    {partner.email && (
                                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                                            <Mail size={13} className="text-emerald-500 shrink-0" />
                                            <span className="text-sm font-semibold text-[var(--text-main)] truncate">{partner.email}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Partner ID */}
                                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Partner ID</p>
                                    <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 break-all">
                                        #{String(partner._id || "").slice(-12).toUpperCase()}
                                    </p>
                                </div>

                                {/* Specialization */}
                                {Array.isArray(partner.specialization) && partner.specialization.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Specialization</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {partner.specialization.map((s: string) => (
                                                <span key={s} className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-8 flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)]">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[var(--text-main)]">No Partner Assigned</p>
                                    <p className="text-xs text-[var(--text-muted)] mt-0.5">This booking hasn't been accepted yet.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
