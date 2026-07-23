export function formatDate(value: string | number | Date | null | undefined): string {
    if (!value) return "N/A";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
    if (!value) return "N/A";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

export function formatTime(value: string | number | Date | null | undefined): string {
    if (!value) return "N/A";
    // If it's a raw 24h time string like "14:30"
    if (typeof value === "string" && /^\d{2}:\d{2}$/.test(value)) {
        const [hStr, mStr] = value.split(":");
        const h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
        const ampm = h >= 12 ? "PM" : "AM";
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        const minStr = mStr.padStart(2, "0");
        return `${hour12}:${minStr} ${ampm}`;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}
