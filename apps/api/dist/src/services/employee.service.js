"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class EmployeeService {
    static async getAll(tenantId) {
        return prisma.employee.findMany({
            where: { tenantId },
            include: {
                department: true,
                grade: true,
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    static async getById(id, tenantId) {
        return prisma.employee.findFirst({
            where: { id, tenantId },
            include: {
                department: true,
                grade: true,
                manager: { select: { firstName: true, lastName: true } },
                documents: true,
                advantages: { include: { advantage: true } }
            }
        });
    }
    static async generateMatricule(tenantId) {
        const count = await prisma.employee.count({ where: { tenantId } });
        return `EMP-${String(count + 1).padStart(4, '0')}`;
    }
    static async create(tenantId, performedByUserId, data) {
        if (data.cin) {
            const existingCin = await prisma.employee.findUnique({
                where: { tenantId_cin: { tenantId, cin: data.cin } }
            });
            if (existingCin)
                throw new Error('Un employé avec ce NNI/CIN existe déjà');
        }
        const matricule = await this.generateMatricule(tenantId);
        const employee = await prisma.employee.create({
            data: {
                tenantId,
                matricule,
                firstName: data.firstName,
                lastName: data.lastName,
                cin: data.cin,
                email: data.email,
                phone: data.phone,
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                gender: data.gender,
                address: data.address,
                departmentId: data.departmentId,
                position: data.position,
                gradeId: data.gradeId,
                contractType: data.contractType,
                hireDate: new Date(data.hireDate),
                contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : null,
                trialEndDate: data.trialEndDate ? new Date(data.trialEndDate) : null,
                baseSalary: data.baseSalary,
                currency: data.currency || 'MRU',
                status: data.status || 'ACTIVE',
                managerId: data.managerId,
                timeline: {
                    create: {
                        event: 'HIRED',
                        description: `Employé embauché en tant que ${data.position} (${data.contractType})`,
                        performedBy: performedByUserId
                    }
                }
            }
        });
        return employee;
    }
    static async update(id, tenantId, performedByUserId, data) {
        const existing = await this.getById(id, tenantId);
        if (!existing)
            throw new Error('Employé introuvable');
        if (data.cin && data.cin !== existing.cin) {
            const existingCin = await prisma.employee.findUnique({
                where: { tenantId_cin: { tenantId, cin: data.cin } }
            });
            if (existingCin)
                throw new Error('Un employé avec ce NNI/CIN existe déjà');
        }
        const updateData = { ...data };
        // Convert dates if provided
        if (data.dateOfBirth)
            updateData.dateOfBirth = new Date(data.dateOfBirth);
        if (data.hireDate)
            updateData.hireDate = new Date(data.hireDate);
        if (data.contractEndDate)
            updateData.contractEndDate = new Date(data.contractEndDate);
        if (data.trialEndDate)
            updateData.trialEndDate = new Date(data.trialEndDate);
        const employee = await prisma.employee.update({
            where: { id },
            data: updateData
        });
        await prisma.employeeTimeline.create({
            data: {
                employeeId: id,
                event: 'PROFILE_UPDATED',
                description: 'Mise à jour des informations de l\'employé',
                performedBy: performedByUserId
            }
        });
        return employee;
    }
}
exports.EmployeeService = EmployeeService;
