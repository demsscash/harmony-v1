import { PrismaClient, UserRole } from '@prisma/client';
import { CreateEmployeeInput, UpdateEmployeeInput } from '@harmony/shared/schemas/employee.schema';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class EmployeeService {
    static async getAll(tenantId: string) {
        return prisma.employee.findMany({
            where: { tenantId },
            include: {
                department: true,
                grade: true,
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getById(id: string, tenantId: string) {
        return prisma.employee.findFirst({
            where: { id, tenantId },
            include: {
                department: true,
                grade: true,
                manager: { select: { firstName: true, lastName: true, position: true } },
                documents: true,
                advantages: { include: { advantage: true } },
                leaves: {
                    include: { leaveType: true },
                    orderBy: { createdAt: 'desc' }
                },
                payslips: {
                    include: { payroll: { select: { month: true, year: true } } },
                    orderBy: { createdAt: 'desc' }
                },
                timeline: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    }

    static async generateMatricule(tenantId: string) {
        const count = await prisma.employee.count({ where: { tenantId } });
        return `EMP-${String(count + 1).padStart(4, '0')}`;
    }

    static async create(tenantId: string, performedByUserId: string, data: CreateEmployeeInput) {
        if (data.cin) {
            const existingCin = await prisma.employee.findUnique({
                where: { tenantId_cin: { tenantId, cin: data.cin } }
            });
            if (existingCin) throw new Error('Un employé avec ce NNI/CIN existe déjà');
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

    static async update(id: string, tenantId: string, performedByUserId: string, data: UpdateEmployeeInput) {
        const existing = await this.getById(id, tenantId);
        if (!existing) throw new Error('Employé introuvable');

        if (data.cin && data.cin !== existing.cin) {
            const existingCin = await prisma.employee.findUnique({
                where: { tenantId_cin: { tenantId, cin: data.cin } }
            });
            if (existingCin) throw new Error('Un employé avec ce NNI/CIN existe déjà');
        }

        const updateData: any = { ...data };

        // Convert dates if provided
        if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);
        if (data.hireDate) updateData.hireDate = new Date(data.hireDate);
        if (data.contractEndDate) updateData.contractEndDate = new Date(data.contractEndDate);
        if (data.trialEndDate) updateData.trialEndDate = new Date(data.trialEndDate);

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

    static async terminate(id: string, tenantId: string, performedByUserId: string, data: {
        terminationDate: string;
        terminationReason: string;
        terminationNotes?: string;
    }) {
        const employee = await prisma.employee.findFirst({ where: { id, tenantId } });
        if (!employee) throw new Error('Employé introuvable');
        if (employee.status === 'TERMINATED') throw new Error('Cet employé est déjà licencié');

        // Update employee status
        const updated = await prisma.employee.update({
            where: { id },
            data: {
                status: 'TERMINATED',
                terminationDate: new Date(data.terminationDate),
                terminationReason: data.terminationReason as any,
                terminationNotes: data.terminationNotes || null,
            },
        });

        // Log in timeline
        await prisma.employeeTimeline.create({
            data: {
                employeeId: id,
                event: 'TERMINATED',
                description: `Fin de contrat : ${data.terminationReason}${data.terminationNotes ? ' — ' + data.terminationNotes : ''}`,
                oldValue: 'ACTIVE',
                newValue: 'TERMINATED',
                performedBy: performedByUserId,
            },
        });

        // Disable user account if exists
        await prisma.user.updateMany({
            where: { employeeId: id },
            data: { isActive: false },
        });

        return updated;
    }

    static async reinstate(id: string, tenantId: string, performedByUserId: string) {
        const employee = await prisma.employee.findFirst({ where: { id, tenantId } });
        if (!employee) throw new Error('Employé introuvable');
        if (employee.status !== 'TERMINATED') throw new Error('Cet employé n\'est pas licencié');

        const updated = await prisma.employee.update({
            where: { id },
            data: {
                status: 'ACTIVE',
                terminationDate: null,
                terminationReason: null,
                terminationNotes: null,
            },
        });

        await prisma.employeeTimeline.create({
            data: {
                employeeId: id,
                event: 'REINSTATED',
                description: 'Réintégration de l\'employé',
                oldValue: 'TERMINATED',
                newValue: 'ACTIVE',
                performedBy: performedByUserId,
            },
        });

        // Reactivate user account if exists
        await prisma.user.updateMany({
            where: { employeeId: id },
            data: { isActive: true },
        });

        return updated;
    }

    static async createAccount(employeeId: string, tenantId: string, passwordRaw: string) {
        const employee = await this.getById(employeeId, tenantId);
        if (!employee) throw new Error('Employé introuvable');
        if (!employee.email) throw new Error('Cet employé n\'a pas d\'adresse email configurée.');

        // Check if employee already has an account
        const existingAccountByEmp = await prisma.user.findUnique({
            where: { employeeId: employee.id }
        });
        if (existingAccountByEmp) throw new Error('Cet employé possède déjà un compte.');

        // Check if email is already taken by another user in this tenant
        const existingEmail = await prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email: employee.email } }
        });
        if (existingEmail) throw new Error('Cet email est déjà utilisé par un autre utilisateur.');

        // Hash password
        const passwordHash = await bcrypt.hash(passwordRaw, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                tenantId,
                email: employee.email,
                passwordHash,
                role: UserRole.EMPLOYEE,
                employeeId: employee.id
            }
        });

        // Add to timeline
        await prisma.employeeTimeline.create({
            data: {
                employeeId: employee.id,
                event: 'ACCOUNT_CREATED',
                description: 'Accès portail Self-Service généré',
                performedBy: 'SYSTEM' // Or pass the admin user ID
            }
        });

        return user;
    }
}
