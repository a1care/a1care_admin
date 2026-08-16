import { PageBanner } from "@/components/ui/PageBanner";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Star, MessageSquare, User, Search, Eye, EyeOff, ChevronLeft, ChevronRight, Loader2, Calendar, Layers } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format";
import { TableSkeleton } from "@/components/ui/Skeletons";

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  
  const {
    data: reviewsData,
    isLoading,
    isFetching
  } = useQuery({
    queryKey: ["admin-reviews", page, limit, filterStatus, searchTerm],
    queryFn: async () => {
      const res = await api.get(`/admin/reviews?page=${page}&limit=${limit}&status=${filterStatus}&search=${searchTerm}`);
      return res.data.data;
    }
  });
  
  const reviews = reviewsData?.items || [];
  const totalPages = reviewsData?.totalPages || 1;
  const totalItems = reviewsData?.total || 0;
  
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status
    }: {
      id: string;
      status: string;
    }) => {
      return await api.put(`/admin/reviews/${id}/status`, {
        status
      });
    },
    onSuccess: () => {
      toast.success("Review status updated");
      queryClient.invalidateQueries({
        queryKey: ["admin-reviews"]
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update review");
    }
  });
  
  return (
    <div className="space-y-6 animate-in">
      {/* ── Page Header ── */}
      <PageBanner 
        title="Ratings & Feedback" 
        subtitle="Monitor and moderate user reviews for platform services and partners." 
      />

      {/* ── Search & Filter Toolbar ── */}
      <div className="flex items-center gap-3 w-full max-w-2xl">
        <div style={{ position: "relative", flex: 1 }}>
          {isFetching ? (
            <Loader2 size={15} style={{
              position: "absolute",
              left: 13,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#3b82f6",
              animation: "spin 1s linear infinite",
              zIndex: 10
            }} />
          ) : (
            <Search size={15} style={{
              position: "absolute",
              left: 13,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
              zIndex: 10
            }} />
          )}
          <input type="text" placeholder="Search by TxnID, name, phone..." className="font-medium" value={searchTerm} onChange={e => {
            setSearchTerm(e.target.value);
            setPage(1);
          }} style={{
            width: "100%",
            height: 42,
            borderRadius: 12,
            paddingLeft: 38,
            paddingRight: 14,
            background: "var(--card-bg)",
            border: "1.5px solid var(--border-color)",
            fontSize: "0.875rem",
            color: "var(--text-main)",
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box"
          }} />
        </div>
        <div className="w-48 shrink-0">
          <select value={filterStatus} onChange={e => {
            setFilterStatus(e.target.value);
            setPage(1);
          }} className="w-full h-[42px] px-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl text-xs font-bold text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer uppercase tracking-wider">
            <option value="All">All Feedback</option>
            <option value="Active">Published Only</option>
            <option value="Hidden">Hidden Only</option>
          </select>
        </div>
      </div>

      {/* ── Reviews Table Card ── */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider w-12">#</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">User</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Service</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Rating</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider min-w-[200px]">Feedback</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <TableSkeleton columns={7} rows={5} showHeader={false} />
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-center mx-auto text-[var(--text-muted)]">
                        <MessageSquare size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-main)]">No reviews found</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">There are no reviews matching your filters.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : reviews.map((review: any, index: number) => (
                <tr key={review._id} className="hover:bg-[var(--bg-main)] transition-colors group">
                  <td className="py-3.5 px-4 text-xs font-semibold text-[var(--text-muted)]">
                    {String((page - 1) * limit + index + 1).padStart(2, '0')}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-sm text-[var(--text-main)] truncate max-w-[150px]">
                      {review.userId?.name || "Anonymous User"}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-[var(--text-muted)]">
                      <Calendar size={11} />
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={13} className="text-blue-500" />
                      {review.bookingType === "Doctor" ? "Doctor Consult" : "Home Service"}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={14} className={star <= review.rating ? "text-amber-400 fill-amber-400" : "text-[var(--border-color)]"} />
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-xs text-[var(--text-main)] italic truncate max-w-[300px]" title={review.comment}>
                      "{review.comment || "No comment provided."}"
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                      ${review.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400"}`}>
                      {review.status === "Active" ? "Published" : "Hidden"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex gap-1.5 justify-end">
                      {review.status === "Active" ? (
                        <button onClick={() => updateStatusMutation.mutate({
                          id: review._id,
                          status: "Hidden"
                        })} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 border border-[var(--border-color)] hover:border-rose-300 transition-colors" title="Hide Review">
                          <EyeOff size={14} />
                        </button>
                      ) : (
                        <button onClick={() => updateStatusMutation.mutate({
                          id: review._id,
                          status: "Active"
                        })} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 border border-[var(--border-color)] hover:border-emerald-300 transition-colors" title="Publish Review">
                          <Eye size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-color)] bg-[var(--card-bg)]">
            <div className="flex items-center gap-4">
              <p className="text-xs text-[var(--text-muted)]">
                Showing <span className="font-semibold text-[var(--text-main)]">{(page - 1) * limit + (reviews.length > 0 ? 1 : 0)}</span> to <span className="font-semibold text-[var(--text-main)]">{Math.min(page * limit, totalItems)}</span> of <span className="font-semibold text-[var(--text-main)]">{totalItems}</span> entries
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-semibold px-2 text-[var(--text-main)]">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--bg-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}