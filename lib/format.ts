export function greeting(hour: number): string {
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 22) return "Good evening";
    return "Working late";
}

// ISO 8601 week number (weeks start on Monday; week 1 contains January 4th).
export function isoWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Fixed names rather than toLocaleDateString: locale data differs between
// Node and browsers (e.g. "Sep" vs "Sept"), which would break hydration.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "Tue 06 Oct · Week 41"
export function dateLine(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    return `${WEEKDAYS[date.getDay()]} ${day} ${MONTHS[date.getMonth()]} · Week ${isoWeek(date)}`;
}

// "16 Sep"
export function shortDate(value: string | Date): string {
    const date = new Date(value);
    return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function percent(value: number): string {
    return `${Math.round(value * 100)}%`;
}

export function plural(count: number, one: string, many = `${one}s`): string {
    return `${count} ${count === 1 ? one : many}`;
}

// Language shares are heavily skewed (one language often holds most of the
// code), so radar axes use a square-root scale: order is preserved and smaller
// languages stay visible. Labels always show the real percentage.
export function radarScale(share: number, max: number): number {
    return max > 0 ? Math.sqrt(share / max) : 0;
}
