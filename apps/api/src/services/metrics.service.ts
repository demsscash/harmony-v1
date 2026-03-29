interface RequestEntry {
    timestamp: number;
    method: string;
    path: string;
    statusCode: number;
    responseTimeMs: number;
    tenantId: string | null;
}

const MAX_ENTRIES = 50_000;
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

class MetricsStore {
    private buffer: RequestEntry[] = [];
    private startTime = Date.now();

    record(entry: RequestEntry) {
        this.buffer.push(entry);
        // Evict old entries periodically
        if (this.buffer.length > MAX_ENTRIES) {
            const cutoff = Date.now() - TTL_MS;
            this.buffer = this.buffer.filter(e => e.timestamp > cutoff);
        }
    }

    private getRecent(lastMinutes: number): RequestEntry[] {
        const cutoff = Date.now() - lastMinutes * 60 * 1000;
        return this.buffer.filter(e => e.timestamp > cutoff);
    }

    getRequestsPerMinute(lastMinutes = 5): number {
        const entries = this.getRecent(lastMinutes);
        return Math.round(entries.length / lastMinutes);
    }

    getErrorRate(lastMinutes = 60): number {
        const entries = this.getRecent(lastMinutes);
        if (entries.length === 0) return 0;
        const errors = entries.filter(e => e.statusCode >= 400).length;
        return Math.round((errors / entries.length) * 10000) / 100; // 2 decimal %
    }

    getAvgResponseTime(lastMinutes = 60): number {
        const entries = this.getRecent(lastMinutes);
        if (entries.length === 0) return 0;
        const total = entries.reduce((sum, e) => sum + e.responseTimeMs, 0);
        return Math.round(total / entries.length);
    }

    getTopSlowEndpoints(limit = 10): Array<{ path: string; method: string; avgMs: number; count: number }> {
        const entries = this.getRecent(60 * 24); // last 24h
        const map = new Map<string, { totalMs: number; count: number; method: string }>();

        for (const e of entries) {
            const key = `${e.method} ${e.path}`;
            const existing = map.get(key);
            if (existing) {
                existing.totalMs += e.responseTimeMs;
                existing.count++;
            } else {
                map.set(key, { totalMs: e.responseTimeMs, count: 1, method: e.method });
            }
        }

        return Array.from(map.entries())
            .map(([path, data]) => ({
                path: path.replace(`${data.method} `, ''),
                method: data.method,
                avgMs: Math.round(data.totalMs / data.count),
                count: data.count,
            }))
            .sort((a, b) => b.avgMs - a.avgMs)
            .slice(0, limit);
    }

    getRequestsOverTime(intervalMinutes = 60, lastHours = 24): Array<{ time: string; requests: number; errors: number; avgMs: number }> {
        const now = Date.now();
        const intervalMs = intervalMinutes * 60 * 1000;
        const totalIntervals = Math.ceil((lastHours * 60) / intervalMinutes);
        const result: Array<{ time: string; requests: number; errors: number; avgMs: number }> = [];

        for (let i = totalIntervals - 1; i >= 0; i--) {
            const start = now - (i + 1) * intervalMs;
            const end = now - i * intervalMs;
            const entries = this.buffer.filter(e => e.timestamp >= start && e.timestamp < end);

            const errors = entries.filter(e => e.statusCode >= 400).length;
            const totalMs = entries.reduce((sum, e) => sum + e.responseTimeMs, 0);

            result.push({
                time: new Date(end).toISOString(),
                requests: entries.length,
                errors,
                avgMs: entries.length > 0 ? Math.round(totalMs / entries.length) : 0,
            });
        }

        return result;
    }

    getStatusCodeDistribution(lastMinutes = 60): Record<string, number> {
        const entries = this.getRecent(lastMinutes);
        const dist: Record<string, number> = {};
        for (const e of entries) {
            const group = `${Math.floor(e.statusCode / 100)}xx`;
            dist[group] = (dist[group] || 0) + 1;
        }
        return dist;
    }

    getTotalRequests24h(): number {
        return this.getRecent(60 * 24).length;
    }

    getUptime(): number {
        return Math.round((Date.now() - this.startTime) / 1000);
    }

    getSnapshot() {
        return {
            requestsPerMinute: this.getRequestsPerMinute(),
            errorRate: this.getErrorRate(),
            avgResponseTime: this.getAvgResponseTime(),
            totalRequests24h: this.getTotalRequests24h(),
            topSlowEndpoints: this.getTopSlowEndpoints(),
            requestsOverTime: this.getRequestsOverTime(),
            statusCodeDistribution: this.getStatusCodeDistribution(),
            uptime: this.getUptime(),
        };
    }
}

export const metricsStore = new MetricsStore();
