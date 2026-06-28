import { useState, useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Users, Search, ChevronLeft, ChevronRight, Phone, Mail } from "lucide-react";

const PAGE_SIZE = 50;

export function PatientsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("All");
    const deferredSearch = useDeferredValue(searchTerm);

    const { data, isLoading } = useQuery({
        queryKey: ["admin_patients_list", page, deferredSearch, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({ page: page.toString(), limit: PAGE_SIZE.toString() });
            if (deferredSearch) params.append("search", deferredSearch);
            if (statusFilter !== "All") params.append("status", statusFilter);
            const res = await api.get(`/admin/user-list/patient?${params}`);
            return res.data.data as { items: any[]; total: number };
        },
        placeholderData: (prev) => prev,
    });

    const patients = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    if (isLoading && !data) return <div className="p-4 py-20 text-center text-[var(--text-muted)] font-bold">Loading Patient Registry...</div>;

    return (
        <div className="flex-col gap-4">
            <header className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 className="brand-name" style={{ fontSize: '1.75rem' }}>Patients</h1>
                    <p className="text-xs muted font-bold uppercase tracking-wider mt-1">
                        {total} total registered patients
                    </p>
                </div>
            </header>

            <div className="card p-0 overflow-hidden" style={{ border: 'none' }}>
                <div className="p-4 border-b flex justify-between items-center gap-3 bg-[var(--card-bg)]">
                    <div className="relative" style={{ width: '320px' }}>
                        <Search className="absolute text-[var(--text-muted)]" size={16} style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            placeholder="Search by name or mobile..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                            className="w-full bg-[var(--bg-main)] border-none px-4 text-sm"
                            style={{ paddingLeft: '40px', height: '44px', borderRadius: '12px' }}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 h-11 text-sm font-bold text-[var(--text-main)]"
                    >
                        <option value="All">All Status</option>
                        <option value="Verified">Verified</option>
                        <option value="Pending">Pending</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '24px' }}>PATIENT</th>
                                <th>CONTACT</th>
                                <th>GENDER</th>
                                <th>JOINED</th>
                                <th className="text-center">STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.length > 0 ? patients.map((patient) => (
                                <tr key={patient._id}>
                                    <td style={{ paddingLeft: '24px' }}>
                                        <div className="font-bold text-[var(--text-main)]" style={{ fontSize: '0.9rem' }}>{patient.name || "Anonymous User"}</div>
                                        <div className="text-xs muted mt-1">ID: {patient._id.slice(-6).toUpperCase()}</div>
                                    </td>
                                    <td>
                                        <div className="flex-col">
                                            <div className="text-sm font-medium text-[var(--text-main)] flex items-center gap-1"><Phone size={12} className="text-[var(--text-muted)]" /> {patient.mobileNumber}</div>
                                            {patient.email && <div className="text-xs muted flex items-center gap-1"><Mail size={12} /> {patient.email}</div>}
                                        </div>
                                    </td>
                                    <td><span className="badge secondary text-xs uppercase">{patient.gender || '—'}</span></td>
                                    <td><div className="text-sm text-[var(--text-muted)] font-medium">{new Date(patient.createdAt).toLocaleDateString()}</div></td>
                                    <td>
                                        <div className="flex justify-center">
                                            <span className={`badge text-xs ${patient.isRegistered ? 'success' : 'warning'}`}>
                                                {patient.isRegistered ? 'Verified' : 'Pending'}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex-col items-center gap-2">
                                            <Users size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
                                            <p className="font-bold text-[var(--text-main)]">No patients found</p>
                                            <p className="text-xs muted">{deferredSearch ? `No results for "${deferredSearch}"` : 'No patients registered yet'}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t flex justify-between items-center bg-[var(--card-bg)] text-xs muted font-bold uppercase tracking-wider">
                        <p>Page {page} of {totalPages} — {total} patients</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="icon-button disabled:opacity-40"
                                style={{ border: '1px solid #f1f5f9', borderRadius: '8px' }}
                            ><ChevronLeft size={16} /></button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="icon-button disabled:opacity-40"
                                style={{ border: '1px solid #f1f5f9', borderRadius: '8px' }}
                            ><ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
