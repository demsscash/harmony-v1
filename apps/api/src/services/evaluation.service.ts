import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EvaluationService {
    // ─── CAMPAIGNS ────────────────────────────────────────

    static async getCampaigns(tenantId: string) {
        return prisma.evaluationCampaign.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { evaluations: true } },
            },
        });
    }

    static async getCampaignById(tenantId: string, id: string) {
        return prisma.evaluationCampaign.findFirst({
            where: { id, tenantId },
            include: {
                evaluations: {
                    include: {
                        employee: { select: { id: true, firstName: true, lastName: true, position: true, department: { select: { name: true } } } },
                        evaluator: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
            },
        });
    }

    static async createCampaign(tenantId: string, data: {
        title: string;
        description?: string;
        startDate: string;
        endDate: string;
        criteria: { name: string; weight: number; description?: string }[];
    }) {
        // Validate weights sum to 100
        const totalWeight = data.criteria.reduce((sum, c) => sum + c.weight, 0);
        if (totalWeight !== 100) {
            throw new Error('La somme des poids des critères doit être 100');
        }

        return prisma.evaluationCampaign.create({
            data: {
                tenantId,
                title: data.title,
                description: data.description,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                criteria: data.criteria as any,
            },
        });
    }

    static async updateCampaign(tenantId: string, id: string, data: {
        title?: string;
        description?: string;
        startDate?: string;
        endDate?: string;
        criteria?: { name: string; weight: number; description?: string }[];
    }) {
        const campaign = await prisma.evaluationCampaign.findFirst({ where: { id, tenantId } });
        if (!campaign) throw new Error('Campagne non trouvée');

        if (data.criteria) {
            const totalWeight = data.criteria.reduce((sum, c) => sum + c.weight, 0);
            if (totalWeight !== 100) throw new Error('La somme des poids des critères doit être 100');
        }

        return prisma.evaluationCampaign.update({
            where: { id },
            data: {
                ...(data.title !== undefined && { title: data.title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.startDate && { startDate: new Date(data.startDate) }),
                ...(data.endDate && { endDate: new Date(data.endDate) }),
                ...(data.criteria && { criteria: data.criteria as any }),
            },
        });
    }

    static async launchCampaign(tenantId: string, campaignId: string, employeeIds: string[]) {
        const campaign = await prisma.evaluationCampaign.findFirst({
            where: { id: campaignId, tenantId },
        });
        if (!campaign) throw new Error('Campagne non trouvée');
        if (campaign.status === 'CLOSED') throw new Error('Campagne clôturée');

        // Create evaluations for selected employees
        const existing = await prisma.evaluation.findMany({
            where: { campaignId, employeeId: { in: employeeIds } },
            select: { employeeId: true },
        });
        const existingIds = new Set(existing.map(e => e.employeeId));
        const newIds = employeeIds.filter(id => !existingIds.has(id));

        if (newIds.length > 0) {
            // Assign evaluator as the employee's manager (if any)
            const employees = await prisma.employee.findMany({
                where: { id: { in: newIds }, tenantId },
                select: { id: true, managerId: true },
            });

            await prisma.evaluation.createMany({
                data: employees.map(emp => ({
                    tenantId,
                    campaignId,
                    employeeId: emp.id,
                    evaluatorId: emp.managerId || null,
                })),
            });
        }

        // Mark campaign as ACTIVE
        if (campaign.status === 'DRAFT') {
            await prisma.evaluationCampaign.update({
                where: { id: campaignId },
                data: { status: 'ACTIVE' },
            });
        }

        return { created: newIds.length, skipped: existingIds.size };
    }

    static async closeCampaign(tenantId: string, campaignId: string) {
        const campaign = await prisma.evaluationCampaign.findFirst({
            where: { id: campaignId, tenantId },
        });
        if (!campaign) throw new Error('Campagne non trouvée');

        return prisma.evaluationCampaign.update({
            where: { id: campaignId },
            data: { status: 'CLOSED' },
        });
    }

    static async deleteCampaign(tenantId: string, campaignId: string) {
        const campaign = await prisma.evaluationCampaign.findFirst({
            where: { id: campaignId, tenantId },
        });
        if (!campaign) throw new Error('Campagne non trouvée');
        if (campaign.status === 'ACTIVE') throw new Error('Impossible de supprimer une campagne active');

        return prisma.evaluationCampaign.delete({ where: { id: campaignId } });
    }

    // ─── EVALUATIONS ──────────────────────────────────────

    static async getEvaluations(tenantId: string, filters: { campaignId?: string; employeeId?: string; status?: string }) {
        return prisma.evaluation.findMany({
            where: {
                tenantId,
                ...(filters.campaignId && { campaignId: filters.campaignId }),
                ...(filters.employeeId && { employeeId: filters.employeeId }),
                ...(filters.status && { status: filters.status as any }),
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, position: true, department: { select: { name: true } } } },
                evaluator: { select: { id: true, firstName: true, lastName: true } },
                campaign: { select: { id: true, title: true, criteria: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async getEvaluationById(tenantId: string, id: string) {
        return prisma.evaluation.findFirst({
            where: { id, tenantId },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, position: true, department: { select: { name: true } } } },
                evaluator: { select: { id: true, firstName: true, lastName: true } },
                campaign: { select: { id: true, title: true, criteria: true, status: true } },
            },
        });
    }

    static async submitEvaluation(tenantId: string, evaluationId: string, data: {
        scores: { criterionName: string; score: number; comment?: string }[];
        strengths?: string;
        improvements?: string;
        objectives?: string;
    }) {
        const evaluation = await prisma.evaluation.findFirst({
            where: { id: evaluationId, tenantId },
            include: { campaign: true },
        });
        if (!evaluation) throw new Error('Évaluation non trouvée');
        if (evaluation.status === 'COMPLETED') throw new Error('Évaluation déjà finalisée');
        if (evaluation.campaign.status === 'CLOSED') throw new Error('Campagne clôturée');

        const criteria = evaluation.campaign.criteria as any[];

        // Calculate weighted overall score
        let overallScore = 0;
        for (const score of data.scores) {
            const criterion = criteria.find((c: any) => c.name === score.criterionName);
            if (criterion) {
                overallScore += (score.score / 10) * criterion.weight;
            }
        }
        overallScore = Math.round(overallScore) / 10; // scale 0-10

        return prisma.evaluation.update({
            where: { id: evaluationId },
            data: {
                scores: data.scores as any,
                overallScore,
                strengths: data.strengths,
                improvements: data.improvements,
                objectives: data.objectives,
                status: 'COMPLETED',
                completedAt: new Date(),
            },
        });
    }

    static async updateEvaluationStatus(tenantId: string, evaluationId: string, status: string) {
        const evaluation = await prisma.evaluation.findFirst({ where: { id: evaluationId, tenantId } });
        if (!evaluation) throw new Error('Évaluation non trouvée');

        return prisma.evaluation.update({
            where: { id: evaluationId },
            data: { status: status as any },
        });
    }

    // ─── STATISTICS ───────────────────────────────────────

    static async getCampaignStats(tenantId: string, campaignId: string) {
        const evaluations = await prisma.evaluation.findMany({
            where: { campaignId, tenantId },
            include: {
                employee: { select: { department: { select: { name: true } } } },
            },
        });

        const total = evaluations.length;
        const completed = evaluations.filter(e => e.status === 'COMPLETED').length;
        const pending = evaluations.filter(e => e.status === 'PENDING').length;
        const inProgress = evaluations.filter(e => e.status === 'IN_PROGRESS').length;

        const completedEvals = evaluations.filter(e => e.status === 'COMPLETED' && e.overallScore);
        const avgScore = completedEvals.length > 0
            ? completedEvals.reduce((sum, e) => sum + Number(e.overallScore), 0) / completedEvals.length
            : 0;

        // By department
        const byDepartment: Record<string, { count: number; totalScore: number }> = {};
        for (const e of completedEvals) {
            const dept = e.employee?.department?.name || 'Sans département';
            if (!byDepartment[dept]) byDepartment[dept] = { count: 0, totalScore: 0 };
            byDepartment[dept].count++;
            byDepartment[dept].totalScore += Number(e.overallScore);
        }

        const departments = Object.entries(byDepartment).map(([name, data]) => ({
            department: name,
            avgScore: +(data.totalScore / data.count).toFixed(2),
            count: data.count,
        }));

        return { total, completed, pending, inProgress, avgScore: +avgScore.toFixed(2), departments };
    }
}
