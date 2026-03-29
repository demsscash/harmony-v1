import { PrismaClient } from '@prisma/client';
import { metricsStore } from './metrics.service';

const prisma = new PrismaClient();

export class MonitoringService {
    static async getHealthCheck() {
        let dbStatus = 'ok';
        try {
            await prisma.$queryRaw`SELECT 1`;
        } catch {
            dbStatus = 'error';
        }

        const mem = process.memoryUsage();

        return {
            status: dbStatus === 'ok' ? 'healthy' : 'degraded',
            db: dbStatus,
            memory: {
                rss: Math.round(mem.rss / 1024 / 1024),
                heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
                heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
            },
            uptime: metricsStore.getUptime(),
            requestStats: {
                requestsPerMinute: metricsStore.getRequestsPerMinute(),
                errorRate: metricsStore.getErrorRate(),
                avgResponseTime: metricsStore.getAvgResponseTime(),
                totalRequests24h: metricsStore.getTotalRequests24h(),
            },
            timestamp: new Date().toISOString(),
        };
    }

    static getMetrics() {
        return metricsStore.getSnapshot();
    }

    static async getAuditLogs(filters: {
        tenantId?: string;
        userId?: string;
        action?: string;
        from?: string;
        to?: string;
        page?: number;
        limit?: number;
    }) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (filters.tenantId) where.tenantId = filters.tenantId;
        if (filters.userId) where.userId = filters.userId;
        if (filters.action) where.action = filters.action;
        if (filters.from || filters.to) {
            where.createdAt = {};
            if (filters.from) where.createdAt.gte = new Date(filters.from);
            if (filters.to) where.createdAt.lte = new Date(filters.to);
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    tenant: { select: { name: true, subdomain: true } },
                },
            }),
            prisma.auditLog.count({ where }),
        ]);

        return {
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    static async getTenantsHealth() {
        const tenants = await prisma.tenant.findMany({
            include: {
                _count: { select: { users: true, employees: true } },
                users: {
                    select: { lastLogin: true },
                    orderBy: { lastLogin: 'desc' },
                    take: 1,
                },
            },
        });

        return tenants.map(t => ({
            id: t.id,
            name: t.name,
            subdomain: t.subdomain,
            isActive: t.isActive,
            employeeCount: t._count.employees,
            userCount: t._count.users,
            lastActivity: t.users[0]?.lastLogin || null,
            createdAt: t.createdAt,
        }));
    }
}
