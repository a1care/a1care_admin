import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Star,
  MessageSquare,
  User,
  Search,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Layers
} from "lucide-react";
import { toast } from "sonner";

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: reviewsData, isLoading, isFetching } = useQuery({
    queryKey: ["admin-reviews", page, filterStatus, searchTerm],
    queryFn: async () => {
      const res = await api.get(`/admin/reviews?page=${page}&limit=60&status=${filterStatus}&search=${searchTerm}`);
      return res.data.data;
    }
  });

  const reviews = reviewsData?.items || [];
  const totalPages = reviewsData?.totalPages || 1;

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await api.put(`/admin/reviews/${id}/status`, { status });
    },
    onSuccess: () => {
      toast.success("Review status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update review");
    }
  });

  return (
    <div className="space-y-6 animate-in">
      {/* ── Page Header ── */}
      <header className="flex flex-col gap-2 bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl shadow-sm border border-[var(--border-color)] relative overflow-hidden text-left items-start">
        <div className="relative z-10 w-full">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-main)] mb-1">User Reviews</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <p className="text-xs md:text-sm font-medium text-[var(--text-muted)] tracking-wide">
                  Home • Engagement • User Reviews
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-12 right-32 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
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
            placeholder="Search by TxnID, name, phone..."
            className="font-medium"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            style={{
                width: "100%", height: 42, borderRadius: 12, paddingLeft: 38, paddingRight: 14,
                background: "var(--card-bg)", border: "1.5px solid var(--border-color)",
                fontSize: "0.875rem", color: "var(--text-main)", outline: "none",
                fontFamily: "inherit", boxSizing: "border-box"
            }}
          />
        </div>
        <div className="w-48 shrink-0">
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="w-full h-9 px-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg text-xs font-bold text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer uppercase tracking-wider"
          >
            <option value="All">All Feedback</option>
            <option value="Active">Published Only</option>
            <option value="Hidden">Hidden Only</option>
          </select>
        </div>
      </div>

      {/* ── Reviews Cards Grid ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl">
          <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
          <p className="text-sm text-[var(--text-muted)]">Moderating feedback...</p>
        </div>
      ) : reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review: any) => (
            <div key={review._id} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm flex flex-col justify-between text-left hover:shadow-md transition-all duration-200">
              <div className="p-5 space-y-4">
                {/* Header: Identity */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
                      <User size={16} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-[var(--text-main)] truncate leading-snug">{review.userId?.name || "Anonymous User"}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[var(--text-muted)]">
                        <Calendar size={12} />
                        <span>{new Date(review.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                    ${review.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400"}`}
                  >
                    {review.status === "Active" ? "Published" : "Hidden"}
                  </span>
                </div>

                {/* Rating stars */}
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={15}
                      className={star <= review.rating ? "text-amber-400 fill-amber-400" : "text-[var(--border-color)]"}
                    />
                  ))}
                </div>

                {/* Comment area */}
                <div className="bg-[var(--bg-main)] p-3 rounded-lg border border-[var(--border-color)] min-h-[90px]">
                  <p className="text-xs text-[var(--text-main)] leading-relaxed italic">
                    "{review.comment || "No comment provided."}"
                  </p>
                </div>
              </div>

              {/* Card Footer: Metadata and publish action button */}
              <div className="p-5 bg-[var(--bg-main)]/50 border-t border-[var(--border-color)] flex items-center justify-between gap-3">
                <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={13} className="text-blue-500" />
                  {review.bookingType === "Doctor" ? "Doctor Consult" : "Home Service"}
                </div>
                <div className="flex gap-1.5">
                  {review.status === "Active" ? (
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: review._id, status: "Hidden" })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 border border-[var(--border-color)] hover:border-rose-300 transition-colors"
                      title="Hide Review"
                    >
                      <EyeOff size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: review._id, status: "Active" })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 border border-[var(--border-color)] hover:border-emerald-300 transition-colors"
                      title="Publish Review"
                    >
                      <Eye size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl">
          <MessageSquare size={48} className="mx-auto text-[var(--text-muted)] mb-3" />
          <h3 className="text-sm font-semibold text-[var(--text-main)]">No reviews match filters</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Reviews log matches the specified filter queries.</p>
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-sm">
          <p className="text-xs text-[var(--text-muted)]">
            Page <span className="font-semibold text-[var(--text-main)]">{page}</span> of <span className="font-semibold text-[var(--text-main)]">{totalPages}</span>
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
  );
}
