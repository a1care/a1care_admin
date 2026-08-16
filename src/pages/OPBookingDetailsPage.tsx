import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ChevronLeft, User, Calendar, CreditCard, Stethoscope, 
  Phone, Mail, CheckCircle2, AlertCircle, Hash, MapPin, 
  Activity
} from "lucide-react";
import { formatDateTime } from "@/lib/format";

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  Pending: { label: "Pending", dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  Confirmed: { label: "Confirmed", dot: "bg-blue-400", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  Completed: { label: "Completed", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Cancelled: { label: "Cancelled", dot: "bg-slate-400", badge: "bg-slate-50 text-slate-600 border-slate-200" },
  "Needs Reassignment": { label: "Needs Review", dot: "bg-rose-400", badge: "bg-rose-50 text-rose-700 border-rose-200" },
};

function InfoCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">{label}</p>
        <div className="text-sm font-semibold text-[var(--text-main)] break-words">{value}</div>
        {sub && <p className="text-xs text-[var(--text-muted)] mt-1 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 px-1">
      <div className="text-blue-600 dark:text-blue-400">{icon}</div>
      <h2 className="text-[13px] font-bold uppercase tracking-wider text-[var(--text-main)]">{title}</h2>
    </div>
  );
}

export function OPBookingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['doctorBooking', id],
    queryFn: async () => {
      const res = await api.get(`/admin/bookings/doctors/${id}`);
      return res.data.data;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4 text-[var(--text-muted)]">
          <div className="w-8 h-8 border-4 border-[var(--border-color)] border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (isError || !response) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center p-8 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-200 dark:border-rose-500/20">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 mb-2">Booking Not Found</h3>
          <p className="text-sm text-rose-600/80 dark:text-rose-400/80 mb-6">The booking you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => navigate("/op-bookings")}
            className="px-6 py-2.5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl text-sm font-medium hover:bg-[var(--bg-main)] transition-colors shadow-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const booking = response;
  const isServiceReq = booking.isServiceRequest;
  const statusConfig = STATUS_CONFIG[booking.mappedStatus] || STATUS_CONFIG['Pending'];

  return (
    <div className="space-y-6 animate-in pb-24">
      {/* -- Header -- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/op-bookings")}
            className="w-10 h-10 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)] transition-all shadow-sm"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)]">
                {isServiceReq ? "Hospital OP Token" : "Doctor Consultation"}
              </h1>
              <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusConfig.badge} flex items-center gap-1.5`}>
                <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </div>
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-1 font-medium">
              ID: <span className="font-mono text-[var(--text-main)] bg-[var(--bg-main)] px-1.5 py-0.5 rounded ml-1">{booking._id}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* -- Left Column: Primary Details -- */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          
          {/* Appointment Block */}
          <section className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6">
              <SectionHeading icon={<Activity size={18} />} title="Booking Snapshot" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoCard
                  icon={<Calendar size={16} />}
                  label="Date & Time"
                  value={formatDateTime(booking.createdAt)}
                  sub={isServiceReq ? "Token Generation Date" : "Booking Date"}
                />
                
                {isServiceReq ? (
                  <>
                    <InfoCard
                      icon={<Hash size={16} />}
                      label="Token Number"
                      value={booking.tokenNumber || "Generating..."}
                    />
                    <InfoCard
                      icon={<CheckCircle2 size={16} />}
                      label="Check-In PIN"
                      value={<span className="font-mono tracking-widest text-lg">{booking.checkInPin || "N/A"}</span>}
                    />
                  </>
                ) : (
                  <>
                    <InfoCard
                      icon={<Stethoscope size={16} />}
                      label="Consultation Type"
                      value={booking.consultationType || "OP"}
                    />
                    <InfoCard
                      icon={<Activity size={16} />}
                      label="Service"
                      value={booking.serviceName || (booking.doctorId?.specialization?.[0] || "Consultation")}
                    />
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Partner Details Block (The Doctor/Hospital) */}
          <section className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-[var(--border-color)]">
              <SectionHeading icon={<Stethoscope size={18} />} title={isServiceReq ? "Department / Queue" : "Partner (Doctor) Details"} />
              {isServiceReq ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoCard
                    icon={<Activity size={16} />}
                    label="Department"
                    value={booking.doctorId?.name?.replace("OP Token (", "").replace(")", "") || "OP"}
                  />
                  <InfoCard
                    icon={<MapPin size={16} />}
                    label="Hospital Name"
                    value={"Sri Siddartha Hospital"}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoCard
                    icon={<User size={16} />}
                    label="Doctor Name"
                    value={booking.doctorId?.name || "Unassigned"}
                    sub={booking.doctorId?.specialization?.join(", ") || "Specialization N/A"}
                  />
                  <InfoCard
                    icon={<Phone size={16} />}
                    label="Doctor Contact"
                    value={booking.doctorId?.mobileNumber || "N/A"}
                    sub={booking.doctorId?.email || ""}
                  />
                  {booking.doctorId?.hospitalName && (
                     <InfoCard
                      icon={<MapPin size={16} />}
                      label="Hospital Affiliation"
                      value={booking.doctorId.hospitalName}
                    />
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* -- Right Column: Patient & Payment -- */}
        <div className="space-y-6 lg:space-y-8">
          
          {/* Patient Details */}
          <section className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[var(--border-color)]">
              <SectionHeading icon={<User size={18} />} title="Patient Details" />
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
                  {booking.patientId?.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[var(--text-main)] truncate">{booking.patientId?.name || "Unknown Patient"}</p>
                  <p className="text-sm text-[var(--text-muted)] truncate">{booking.patientId?.mobile || booking.patientId?.mobileNumber || "No Mobile"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                  <Mail size={14} className="shrink-0" />
                  <span className="truncate">{booking.patientId?.email || "No email"}</span>
                </div>
                {(booking.patientId?.gender || booking.patientId?.age) && (
                  <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                    <User size={14} className="shrink-0" />
                    <span>{booking.patientId?.gender || "Unknown"} • {booking.patientId?.age ? `${booking.patientId.age} yrs` : "Unknown age"}</span>
                  </div>
                )}
                {booking.patientId?.address?.addressLine && (
                  <div className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
                    <MapPin size={14} className="shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{booking.patientId.address.addressLine}, {booking.patientId.address.city}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Payment Info */}
          <section className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
            <div className="p-5">
              <SectionHeading icon={<CreditCard size={18} />} title="Payment Information" />
              <div className="bg-[var(--bg-main)] rounded-xl p-4 border border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--border-color)]">
                  <span className="text-sm text-[var(--text-muted)]">Total Amount</span>
                  <span className="font-black text-lg text-[var(--text-main)]">₹{booking.totalAmount || booking.price || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Status</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                    booking.paymentStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                  }`}>
                    {booking.paymentStatus || 'PENDING'}
                  </span>
                </div>
                {booking.paymentMode && (
                   <div className="flex items-center justify-between mt-3">
                     <span className="text-sm text-[var(--text-muted)]">Mode</span>
                     <span className="text-sm font-medium text-[var(--text-main)] capitalize">{String(booking.paymentMode).toLowerCase()}</span>
                   </div>
                )}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
