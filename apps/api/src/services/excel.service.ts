import * as ExcelJS from 'exceljs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ExcelService {

    /**
     * Export all employees for a tenant to an Excel file.
     */
    static async exportEmployees(tenantId: string): Promise<Buffer> {
        const employees = await prisma.employee.findMany({
            where: { tenantId },
            include: { department: true, grade: true },
            orderBy: { lastName: 'asc' }
        });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Employés');

        // Styles
        const headerFill: ExcelJS.Fill = {
            type: 'pattern', pattern: 'solid',
            fgColor: { argb: 'FF1E293B' }
        };
        const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

        sheet.columns = [
            { header: 'Matricule', key: 'matricule', width: 14 },
            { header: 'Prénom', key: 'firstName', width: 18 },
            { header: 'Nom', key: 'lastName', width: 18 },
            { header: 'Email', key: 'email', width: 28 },
            { header: 'Téléphone', key: 'phone', width: 16 },
            { header: 'Poste', key: 'position', width: 22 },
            { header: 'Département', key: 'department', width: 20 },
            { header: 'Grade', key: 'grade', width: 16 },
            { header: 'Type Contrat', key: 'contractType', width: 14 },
            { header: 'Date d\'Embauche', key: 'hireDate', width: 16 },
            { header: 'Fin Contrat', key: 'contractEndDate', width: 16 },
            { header: 'Salaire Base (MRU)', key: 'baseSalary', width: 20 },
            { header: 'Statut', key: 'status', width: 12 },
        ];

        // Style header row
        sheet.getRow(1).eachCell(cell => {
            cell.fill = headerFill;
            cell.font = headerFont;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        sheet.getRow(1).height = 28;

        // Add data rows
        employees.forEach((emp, idx) => {
            const row = sheet.addRow({
                matricule: emp.matricule,
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: emp.email || '',
                phone: emp.phone || '',
                position: emp.position,
                department: emp.department?.name || '',
                grade: (emp as any).grade?.name || '',
                contractType: emp.contractType,
                hireDate: emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('fr-FR') : '',
                contractEndDate: emp.contractEndDate ? new Date(emp.contractEndDate).toLocaleDateString('fr-FR') : '',
                baseSalary: Number(emp.baseSalary),
                status: emp.status,
            });
            // Alternate row color
            if (idx % 2 === 0) {
                row.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                });
            }
        });

        // Add auto-filter on headers
        sheet.autoFilter = { from: 'A1', to: 'M1' };

        const raw = await workbook.xlsx.writeBuffer();
        return Buffer.from(raw) as Buffer;
    }

    /**
     * Generate an import template Excel file.
     */
    static async generateImportTemplate(): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Import Employés');

        sheet.columns = [
            { header: 'Prénom *', key: 'firstName', width: 18 },
            { header: 'Nom *', key: 'lastName', width: 18 },
            { header: 'Email', key: 'email', width: 28 },
            { header: 'Téléphone', key: 'phone', width: 16 },
            { header: 'Poste *', key: 'position', width: 22 },
            { header: 'Département', key: 'department', width: 20 },
            { header: 'Type Contrat * (CDI/CDD/STAGE)', key: 'contractType', width: 30 },
            { header: 'Date Embauche * (YYYY-MM-DD)', key: 'hireDate', width: 26 },
            { header: 'Fin Contrat (YYYY-MM-DD)', key: 'contractEndDate', width: 24 },
            { header: 'Salaire Base (MRU) *', key: 'baseSalary', width: 20 },
            { header: 'Genre (MALE/FEMALE)', key: 'gender', width: 20 },
            { header: 'Date Naissance (YYYY-MM-DD)', key: 'dateOfBirth', width: 26 },
        ];

        // Style header
        sheet.getRow(1).eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        sheet.getRow(1).height = 32;

        // Add an example row
        sheet.addRow({
            firstName: 'Ahmed',
            lastName: 'Ould Mohamed',
            email: 'ahmed@example.com',
            phone: '+222 20000001',
            position: 'Développeur Senior',
            department: 'Informatique',
            contractType: 'CDI',
            hireDate: '2024-01-15',
            contractEndDate: '',
            baseSalary: 250000,
            gender: 'MALE',
            dateOfBirth: '1990-06-20',
        });

        const raw = await workbook.xlsx.writeBuffer();
        return Buffer.from(raw) as Buffer;
    }

    /**
     * Parse an uploaded Excel file and create employees.
     */
    static async importEmployees(tenantId: string, inputBuffer: Buffer): Promise<any[]> {
        const workbook = new ExcelJS.Workbook();
        // ExcelJS expects a Buffer (Node.js), ensure we have one
        const buf: Buffer = Buffer.isBuffer(inputBuffer) ? inputBuffer : Buffer.from(inputBuffer as unknown as ArrayBuffer);
        await workbook.xlsx.load(buf as unknown as ArrayBuffer);
        const sheet = workbook.getWorksheet(1);
        if (!sheet) throw new Error('Feuille Excel introuvable');

        const results: any[] = [];
        const rows: ExcelJS.Row[] = [];
        sheet.eachRow((row, rowNum) => {
            if (rowNum > 1) rows.push(row); // Skip header
        });

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2;

            const get = (col: number) => {
                const cell = row.getCell(col);
                return cell.text?.toString().trim() || '';
            };

            const firstName = get(1);
            const lastName = get(2);
            const email = get(3) || null;
            const phone = get(4) || null;
            const position = get(5);
            const departmentName = get(6);
            const contractType = get(7).toUpperCase() as any;
            const hireDateStr = get(8);
            const contractEndDateStr = get(9);
            const baseSalaryStr = get(10);
            const gender = get(11) as any || null;
            const dateOfBirthStr = get(12);

            const name = `${firstName} ${lastName}`.trim();

            if (!firstName || !lastName || !position || !contractType || !hireDateStr || !baseSalaryStr) {
                results.push({ success: false, row: rowNum, name: name || `Ligne ${rowNum}`, error: 'Champs obligatoires manquants' });
                continue;
            }

            try {
                // Resolve department
                let departmentId: string | null = null;
                if (departmentName) {
                    let dept = await prisma.department.findFirst({ where: { name: { equals: departmentName, mode: 'insensitive' }, tenantId } });
                    if (!dept) dept = await prisma.department.create({ data: { name: departmentName, tenantId } });
                    departmentId = dept.id;
                }

                // Generate matricule
                const count = await prisma.employee.count({ where: { tenantId } });
                const matricule = `EMP-${String(count + 1 + i).padStart(4, '0')}`;

                await prisma.employee.create({
                    data: {
                        tenantId,
                        matricule,
                        firstName,
                        lastName,
                        email,
                        phone,
                        position,
                        departmentId,
                        contractType: ['CDI', 'CDD', 'STAGE', 'PRESTATION'].includes(contractType) ? contractType : 'CDI',
                        hireDate: new Date(hireDateStr),
                        contractEndDate: contractEndDateStr ? new Date(contractEndDateStr) : null,
                        baseSalary: parseFloat(baseSalaryStr.replace(',', '.')),
                        gender: gender && ['MALE', 'FEMALE'].includes(gender) ? gender : null,
                        dateOfBirth: dateOfBirthStr ? new Date(dateOfBirthStr) : null,
                    }
                });

                results.push({ success: true, row: rowNum, name });
            } catch (err: any) {
                results.push({ success: false, row: rowNum, name, error: err.message });
            }
        }

        return results;
    }
}
