import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import employeeRoutes from './routes/employee.routes';
import gradeRoutes from './routes/grade.routes';
import advantageRoutes from './routes/advantage.routes';
import allowanceRoutes from './routes/allowance.routes';
import leaveRoutes from './routes/leave.routes';
import payrollRoutes from './routes/payroll.routes';
import tenantRoutes from './routes/tenant.routes';
import settingsRoutes from './routes/settings.routes';
import departmentRoutes from './routes/department.routes';
import onboardingRoutes from './routes/onboarding.routes';
import dgiRoutes from './routes/dgi.routes';
import notificationsRoutes from './routes/notifications.routes';
import monitoringRoutes from './routes/monitoring.routes';
import searchRoutes from './routes/search.routes';
import signatureRoutes from './routes/signature.routes';
import holidayRoutes from './routes/holiday.routes';
import attendanceRoutes from './routes/attendance.routes';
import overtimeRoutes from './routes/overtime.routes';
import advanceRoutes from './routes/advance.routes';
import expenseRoutes from './routes/expense.routes';
import reportsRoutes from './routes/reports.routes';
import evaluationRoutes from './routes/evaluation.routes';
import { performanceMiddleware } from './middleware/performance';

dotenv.config();

// ==========================================
// Startup validation for environment variables
// ==========================================
const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
const missingRequired = requiredEnvVars.filter((v) => !process.env[v]);
if (missingRequired.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missingRequired.join(', ')}`);
    process.exit(1);
}

const optionalEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];
const missingOptional = optionalEnvVars.filter((v) => !process.env[v]);
if (missingOptional.length > 0) {
    console.warn(`WARNING: Missing optional environment variables: ${missingOptional.join(', ')}. Email features may not work.`);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(cors({
    origin: true, // Configured flexibly for multi-tenant usage
    credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(performanceMiddleware);

// Core Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/advantages', advantageRoutes);
app.use('/api/allowances', allowanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payrolls', payrollRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/dgi', dgiRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/signatures', signatureRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/overtime', overtimeRoutes);
app.use('/api/advances', advanceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/evaluations', evaluationRoutes);

// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Harmony API is running on http://localhost:${PORT}`);
});
