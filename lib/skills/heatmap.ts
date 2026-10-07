import { MONTHS } from "@/lib/format";

export interface HeatCell {
    date: string;
    count: number;
    // 0 (none) to 4 (busiest)
    level: number;
    week: number;
    weekday: number;
}

// Lays a contribution calendar out as GitHub does: one column per week,
// Sunday at the top. Levels split the active days into quartiles, so one
// huge day doesn't wash every other day out.
export function heatmapLayout(days: { date: string; count: number }[]) {
    const active = days.map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b);
    const quartile = (q: number) => active[Math.min(active.length - 1, Math.floor(q * active.length))] ?? 0;
    const thresholds = [quartile(0.25), quartile(0.5), quartile(0.75)];
    const level = (count: number) => (count <= 0 ? 0 : 1 + thresholds.filter((t) => count > t).length);

    const firstWeekday = days.length ? new Date(`${days[0].date}T00:00:00Z`).getUTCDay() : 0;
    const cells: HeatCell[] = days.map((d, i) => {
        const offset = firstWeekday + i;
        return { date: d.date, count: d.count, level: level(d.count), week: Math.floor(offset / 7), weekday: offset % 7 };
    });

    // A month label over the first week that starts in that month
    const months: { week: number; label: string }[] = [];
    let lastMonth = -1;
    for (const cell of cells) {
        if (cell.weekday !== 0 && cell !== cells[0]) continue;
        const month = new Date(`${cell.date}T00:00:00Z`).getUTCMonth();
        if (month !== lastMonth) {
            months.push({ week: cell.week, label: MONTHS[month] });
            lastMonth = month;
        }
    }
    const weeks = cells.length ? cells[cells.length - 1].week + 1 : 0;
    // Drop labels that would be squeezed against the next one at the start,
    // or cut off at the end
    if (months.length > 1 && months[1].week - months[0].week < 3) months.shift();
    while (months.length > 1 && weeks - months[months.length - 1].week < 2) months.pop();

    return { cells, months, weeks };
}
