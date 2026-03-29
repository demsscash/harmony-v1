import { Tenant, UserRole } from '@prisma/client';

declare global {
    namespace Express {
        interface Request {
            tenant?: Tenant;
            user?: {
                userId: string;
                tenantId: string;
                role: UserRole;
                employeeId?: string | null;
            };
        }
    }
}
