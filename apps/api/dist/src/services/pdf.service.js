"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class PdfService {
    static async generateEmployeeBadge(employeeId, tenantId) {
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId, tenantId },
            include: { department: true }
        });
        if (!employee) {
            throw new Error('Employé introuvable');
        }
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Helvetica', 'Arial', sans-serif; background: #fff; margin: 0; padding: 0; }
                    .badge {
                        width: 300px;
                        height: 450px;
                        border: 2px solid #2563eb;
                        border-radius: 12px;
                        margin: 20px auto;
                        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                    }
                    .header {
                        background-color: #2563eb;
                        color: white;
                        text-align: center;
                        padding: 20px 0;
                    }
                    .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; }
                    .content {
                        flex: 1;
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .photo-placeholder {
                        width: 120px;
                        height: 120px;
                        background-color: #f3f4f6;
                        border-radius: 60px;
                        margin: 0 auto 20px;
                        border: 3px solid #2563eb;
                    }
                    .name { font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 5px 0; text-transform: capitalize; }
                    .position { font-size: 16px; color: #4b5563; margin: 0 0 15px 0; text-transform: uppercase;}
                    .matricule { font-size: 14px; color: #6b7280; font-family: monospace; border: 1px solid #e5e7eb; padding: 5px 10px; border-radius: 4px; display: inline-block; }
                    .footer {
                        background-color: #f8fafc;
                        border-top: 1px solid #e2e8f0;
                        padding: 15px;
                        text-align: center;
                        font-size: 12px;
                        color: #94a3b8;
                    }
                </style>
            </head>
            <body>
                <div class="badge">
                    <div class="header">
                        <h1>HARMONY ERP</h1>
                    </div>
                    <div class="content">
                        <div class="photo-placeholder"></div>
                        <h2 class="name">${employee.firstName} ${employee.lastName}</h2>
                        <h3 class="position">${employee.position}</h3>
                        <p class="matricule">ID: ${employee.matricule}</p>
                    </div>
                    <div class="footer">
                        Accès Autorisé &bull; Strictement Personnel
                    </div>
                </div>
            </body>
            </html>
        `;
        const browser = await puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }
        });
        await browser.close();
        return Buffer.from(pdfBuffer);
    }
}
exports.PdfService = PdfService;
