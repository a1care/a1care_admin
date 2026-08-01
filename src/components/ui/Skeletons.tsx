import React from "react";
import { A1Skeleton } from "./A1Skeleton";

export const TableSkeleton = ({ columns = 5, rows = 5, showHeader = true }: { columns?: number, rows?: number, showHeader?: boolean }) => {
    return (
        <div className="w-full">
            {/* Header */}
            {showHeader && (
                <div className="flex items-center gap-4 py-3 px-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                    {Array.from({ length: columns }).map((_, i) => (
                        <A1Skeleton key={`th-${i}`} className="h-4 w-24 bg-gray-300/60 dark:bg-gray-700/60" />
                    ))}
                </div>
            )}
            {/* Body */}
            <div className="divide-y divide-[var(--border-color)]">
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={`tr-${r}`} className="flex items-center gap-4 py-4 px-4 bg-[var(--card-bg)]">
                        {Array.from({ length: columns }).map((_, c) => (
                            <div key={`td-${r}-${c}`} className="flex-1">
                                <A1Skeleton className="h-5 w-3/4 mb-2 bg-gray-200 dark:bg-gray-800" />
                                {c === 1 && <A1Skeleton className="h-3 w-1/2 bg-gray-100 dark:bg-gray-900" />}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const StatsSkeleton = ({ count = 4 }: { count?: number }) => {
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-4`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <A1Skeleton className="h-4 w-20 bg-gray-200 dark:bg-gray-800" />
                        <A1Skeleton className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-900" />
                    </div>
                    <A1Skeleton className="h-8 w-32 mb-2 bg-gray-300 dark:bg-gray-700" />
                    <A1Skeleton className="h-3 w-24 bg-gray-100 dark:bg-gray-900" />
                </div>
            ))}
        </div>
    );
};

export const CardSkeleton = ({ count = 1 }: { count?: number }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <A1Skeleton className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-800" />
                        <div className="flex-1">
                            <A1Skeleton className="h-5 w-3/4 mb-2 bg-gray-300 dark:bg-gray-700" />
                            <A1Skeleton className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <A1Skeleton className="h-4 w-full bg-gray-100 dark:bg-gray-900" />
                        <A1Skeleton className="h-4 w-5/6 bg-gray-100 dark:bg-gray-900" />
                        <A1Skeleton className="h-4 w-4/6 bg-gray-100 dark:bg-gray-900" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export const FormSkeleton = () => {
    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 max-w-4xl mx-auto w-full">
            <A1Skeleton className="h-8 w-1/3 mb-2 bg-gray-300 dark:bg-gray-700" />
            <A1Skeleton className="h-4 w-1/2 mb-8 bg-gray-200 dark:bg-gray-800" />
            
            <div className="space-y-6">
                <div>
                    <A1Skeleton className="h-3 w-24 mb-2 bg-gray-200 dark:bg-gray-800" />
                    <A1Skeleton className="h-12 w-full rounded-xl bg-gray-100 dark:bg-gray-900" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <A1Skeleton className="h-3 w-32 mb-2 bg-gray-200 dark:bg-gray-800" />
                        <A1Skeleton className="h-12 w-full rounded-xl bg-gray-100 dark:bg-gray-900" />
                    </div>
                    <div>
                        <A1Skeleton className="h-3 w-24 mb-2 bg-gray-200 dark:bg-gray-800" />
                        <A1Skeleton className="h-12 w-full rounded-xl bg-gray-100 dark:bg-gray-900" />
                    </div>
                </div>
                <div>
                    <A1Skeleton className="h-3 w-40 mb-2 bg-gray-200 dark:bg-gray-800" />
                    <A1Skeleton className="h-32 w-full rounded-xl bg-gray-100 dark:bg-gray-900" />
                </div>
                <div className="flex justify-end gap-4 mt-8">
                    <A1Skeleton className="h-12 w-32 rounded-xl bg-gray-200 dark:bg-gray-800" />
                    <A1Skeleton className="h-12 w-40 rounded-xl bg-gray-300 dark:bg-gray-700" />
                </div>
            </div>
        </div>
    );
};
