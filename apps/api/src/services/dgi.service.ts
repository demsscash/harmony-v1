import { PrismaClient } from '@prisma/client';
import * as ExcelJS from 'exceljs';

const prisma = new PrismaClient();

export class DgiService {

    /**
     * Génère la déclaration ITS mensuelle au format Excel DGI
     */
    static async generateITS(tenantId: string, month: number, year: number) {
        const payrolls = await prisma.payroll.findMany({
            where: { tenantId, month, year },
            include: { payslips: true }
        });

        if (!payrolls.length || !payrolls[0].payslips.length) {
            throw new Error(`Aucune paie clôturée trouvée pour la période ${month}/${year}`);
        }

        const payslips = payrolls.flatMap(p => p.payslips);

        // Aggrégation des valeurs
        const totalEmployees = payslips.length;
        const totalGross = payslips.reduce((sum, p) => sum + Number(p.grossSalary), 0);
        const totalAdvantages = payslips.reduce((sum, p) => sum + Number(p.totalAdvantages), 0);
        const totalITS = payslips.reduce((sum, p) => sum + Number(p.itsAmount), 0);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Déclaration ITS');

        // Style et formatage des colonnes
        sheet.getColumn(1).width = 45;
        sheet.getColumn(2).width = 30;
        sheet.getColumn(3).width = 40;

        // Entête officiel
        sheet.addRow(['REPUBLIQUE ISLAMIQUE DE MAURITANIE', '', 'الجمهورية الاسلامية الموريتانية']);
        sheet.addRow(['MINISTERE DES FINANCES', '', 'وزارة المالية']);
        sheet.addRow(['DIRECTION GENERALE DES IMPOTS', '', 'المديرية العامة للضرائب']);
        sheet.addRow([]);

        // Titre
        sheet.addRow([`Déclaration Afférente au Mois de: ${month}/${year}`, '', `التصريح المتعلق بشهر: ${month}/${year}`]);
        sheet.addRow([]);
        sheet.addRow(['IMPOT SUR LES TRAITEMENTS ET SALAIRES (ITS)', '', 'الضريبة على الاجور و المرتبات']).font = { bold: true };
        sheet.addRow([]);

        // Section 1 L'entreprise (Laissée vide à remplir par l'utilisateur ou pré-remplie si info dispo)
        sheet.addRow(['I. IDENTIFICATION DU CONTRIBUABLE']).font = { bold: true, underline: true };
        sheet.addRow(['Nom ou Raison Sociale:', '(A compléter)']);
        sheet.addRow(['Activité Principale:', '(A compléter)']);
        sheet.addRow(['Numéro d\'Identification Fiscal (NIF):', '(A compléter)']);
        sheet.addRow([]);

        // Section 2 Calcul
        sheet.addRow(['II. CALCUL DE L’IMPOT']).font = { bold: true, underline: true };
        sheet.addRow(['a) Nombre de salariés rémunérés:', totalEmployees]);
        sheet.addRow(['b) Rémunérations brutes mensuelles (MRU):', totalGross]);
        sheet.addRow(['c) Avantages en Natures (MRU):', totalAdvantages]);

        const abattements = totalEmployees * 600; // 6000 UM = 600 MRU
        sheet.addRow(['d) Abattements forfaitaires (600 MRU par salarié):', abattements]);

        const ri = totalGross + totalAdvantages - abattements;
        sheet.addRow(['e) Rémunérations imposables au titre du mois:', Math.max(0, ri)]).font = { bold: true };
        sheet.addRow([]);

        // Section 3 Retenues
        sheet.addRow(['III. MONTANT DES RETENUES OPEREES']).font = { bold: true, underline: true };
        sheet.addRow(['Montant total des retenues opérées (ITS calculé) :', totalITS]).font = { bold: true, color: { argb: 'FF0000' } };
        sheet.addRow([]);
        sheet.addRow(['Fait à Nouakchott, le :', new Date().toLocaleDateString('fr-FR')]);

        // Retourner le buffer binaire
        return workbook.xlsx.writeBuffer();
    }

    /**
     * Génère la Déclaration Annuelle des Salaires (DAS) format Excel DGI
     */
    static async generateDAS(tenantId: string, year: number) {
        const payrolls = await prisma.payroll.findMany({
            where: { tenantId, year },
            include: {
                payslips: {
                    include: { employee: true }
                }
            }
        });

        if (!payrolls.length) {
            throw new Error(`Aucune paie trouvée pour l'année ${year}`);
        }

        const allPayslips = payrolls.flatMap(p => p.payslips);

        // Grouper les montants par employé pour l'année complète
        const employeeData = new Map<string, any>();

        allPayslips.forEach(ps => {
            const empId = ps.employee.id;
            if (!employeeData.has(empId)) {
                employeeData.set(empId, {
                    name: `${ps.employee.firstName} ${ps.employee.lastName}`,
                    cin: ps.employee.cin || 'N/A',
                    position: ps.employee.position || 'N/A',
                    grossSalary: 0,
                    cnss: 0,
                    advantages: 0,
                    its: 0
                });
            }
            const data = employeeData.get(empId);
            data.grossSalary += Number(ps.grossSalary);
            data.cnss += Number(ps.cnssEmployee);
            data.advantages += Number(ps.totalAdvantages);
            data.its += Number(ps.itsAmount);
        });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('DAS');

        // Formater colonnes
        sheet.columns = [
            { header: 'Nom et Prénom', key: 'name', width: 30 },
            { header: 'NNI / CIN', key: 'cin', width: 15 },
            { header: 'Fonction', key: 'position', width: 25 },
            { header: 'Rémunération Brute (A)', key: 'gross', width: 25 },
            { header: 'Cotisations (B)', key: 'cnss', width: 20 },
            { header: 'Avantage Nature (C)', key: 'adv', width: 25 },
            { header: 'Base Imposable (A-B+C)', key: 'base', width: 25 },
            { header: 'ITS Retenu (G)', key: 'its', width: 20 },
        ];

        // Titre
        sheet.insertRow(1, ['D31. Déclaration Annuelle des Salaires (DAS) - Année ' + year]);
        sheet.getRow(1).font = { bold: true, size: 14 };
        sheet.insertRow(2, []);
        sheet.insertRow(3, ['1. Salariés en contrat local']).font = { bold: true };
        sheet.insertRow(4, []); // Push table headers down to line 5

        let totalGross = 0, totalCnss = 0, totalAdv = 0, totalBase = 0, totalIts = 0;

        for (const emp of Array.from(employeeData.values())) {
            const baseImposable = emp.grossSalary - emp.cnss + emp.advantages;

            totalGross += emp.grossSalary;
            totalCnss += emp.cnss;
            totalAdv += emp.advantages;
            totalBase += baseImposable;
            totalIts += emp.its;

            sheet.addRow({
                name: emp.name,
                cin: emp.cin,
                position: emp.position,
                gross: emp.grossSalary,
                cnss: emp.cnss,
                adv: emp.advantages,
                base: baseImposable,
                its: emp.its
            });
        }

        sheet.addRow([]);
        const totalRow = sheet.addRow({
            name: 'TOTAL GENERAL',
            cin: '',
            position: '',
            gross: totalGross,
            cnss: totalCnss,
            adv: totalAdv,
            base: totalBase,
            its: totalIts
        });
        totalRow.font = { bold: true };

        return workbook.xlsx.writeBuffer();
    }

    /**
     * Génère la Déclaration Taxe d'Apprentissage (Annuelle)
     */
    static async generateTaxeApprentissage(tenantId: string, year: number) {
        const payrolls = await prisma.payroll.findMany({
            where: { tenantId, year },
            include: { payslips: true }
        });

        if (!payrolls.length) throw new Error(`Aucune paie trouvée pour l'année ${year}`);

        const allPayslips = payrolls.flatMap(p => p.payslips);

        const totalGross = allPayslips.reduce((sum, p) => sum + Number(p.grossSalary), 0);
        const totalAdvantages = allPayslips.reduce((sum, p) => sum + Number(p.totalAdvantages), 0);
        const totalImposable = totalGross + totalAdvantages;
        const taxeAmount = totalImposable * 0.006; // 0.6%

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Taxe d'Apprentissage");

        sheet.getColumn(1).width = 40;
        sheet.getColumn(2).width = 25;

        sheet.addRow(['REPUBLIQUE ISLAMIQUE DE MAURITANIE']);
        sheet.addRow(['MINISTERE DES FINANCES']);
        sheet.addRow(['DIRECTION GENERALE DES IMPOTS']);
        sheet.addRow([]);
        sheet.addRow(['TAXE D\'APPRENTISSAGE ' + year]).font = { bold: true, size: 14 };
        sheet.addRow([]);

        sheet.addRow(['I. IDENTIFICATION DU CONTRIBUABLE']).font = { bold: true };
        sheet.addRow(['NIF :', '']);
        sheet.addRow(['Raison sociale :', '']);
        sheet.addRow(['Activité principale :', '']);
        sheet.addRow([]);

        sheet.addRow(['II. CALCUL DE L\'IMPOT']).font = { bold: true };
        sheet.addRow(['1. Rémunération globale (MRU) :', totalGross]);
        sheet.addRow(['2. Avantages en nature (MRU) :', totalAdvantages]);
        sheet.addRow(['3. Montant imposable (Ligne 1 + Ligne 2) :', totalImposable]).font = { bold: true };
        sheet.addRow(['4. Taux :', '0.6%']);
        sheet.addRow(['5. Montant de la taxe due (Ligne 3 x Ligne 4) :', Math.round(taxeAmount)]).font = { bold: true, color: { argb: 'FF0000' } };

        return workbook.xlsx.writeBuffer();
    }

    /**
     * Génère la déclaration ITS format GTA (Grand-Tortue Ahmeyim)
     */
    static async generateITS_GTA(tenantId: string, month: number, year: number) {
        const payrolls = await prisma.payroll.findMany({
            where: { tenantId, month, year },
            include: { payslips: true }
        });

        if (!payrolls.length) throw new Error(`Aucune paie trouvée pour la période ${month}/${year}`);

        const payslips = payrolls.flatMap(p => p.payslips);
        const totalITS = payslips.reduce((sum, p) => sum + Number(p.itsAmount), 0);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('ITS - GTA');

        sheet.getColumn(1).width = 30;
        sheet.getColumn(2).width = 30;

        sheet.addRow(['UNITE MIXTE CHARGEE DU REGIME FISCAL GTA']).font = { bold: true };
        sheet.addRow(['IMPOT SUR LES SALAIRES RETENU A LA SOURCE (GTA)']);
        sheet.addRow(['Articles 57 et 58 de l\'Acte additionnel']);
        sheet.addRow([`Mois de : ${month} / ${year}`]);
        sheet.addRow([]);

        sheet.addRow(['IDENTIFICATION']).font = { bold: true };
        sheet.addRow(['Dénomination Sociale :', '']);
        sheet.addRow(['N° d\'Identification Fiscale :', '']);
        sheet.addRow(['N° d\'Agrément :', '']);
        sheet.addRow(['Clients / Contractants :', '']);
        sheet.addRow([]);

        sheet.addRow(['CALCUL DE LA RETENUE (Simplifié à partir des paies)']).font = { bold: true };
        sheet.addRow(['Total Salaires Versés : ', payslips.reduce((acc, p) => acc + Number(p.grossSalary), 0)]);
        sheet.addRow(['Prélèvement ITS Global Retenu :', totalITS]).font = { bold: true, color: { argb: 'FF0000' } };

        return workbook.xlsx.writeBuffer();
    }

    /**
     * Génère la Déclaration Annuelle des Salaires (DAS) format GTA
     */
    static async generateDAS_GTA(tenantId: string, year: number) {
        // La DAS GTA est similaire à la DAS normale mais avec les en-têtes de l'Unité Mixte
        const buffer = await this.generateDAS(tenantId, year);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as any);
        const sheet = workbook.getWorksheet('DAS');

        if (sheet) {
            sheet.name = 'DAS - GTA';
            sheet.insertRow(1, ['UNITE MIXTE CHARGEE DU REGIME FISCAL GTA']).font = { bold: true };
            sheet.insertRow(2, ['Articles 57 et 58 de l\'Acte additionnel']);
        }

        return workbook.xlsx.writeBuffer();
    }
}
