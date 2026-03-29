"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const employee_routes_1 = __importDefault(require("./routes/employee.routes"));
const grade_routes_1 = __importDefault(require("./routes/grade.routes"));
const allowance_routes_1 = __importDefault(require("./routes/allowance.routes"));
const leave_routes_1 = __importDefault(require("./routes/leave.routes"));
const payroll_routes_1 = __importDefault(require("./routes/payroll.routes"));
const tenant_routes_1 = __importDefault(require("./routes/tenant.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middlewares
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: true, // Configured flexibly for multi-tenant usage
    credentials: true
}));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
// Core Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/employees', employee_routes_1.default);
app.use('/api/grades', grade_routes_1.default);
app.use('/api/allowances', allowance_routes_1.default);
app.use('/api/leaves', leave_routes_1.default);
app.use('/api/payrolls', payroll_routes_1.default);
app.use('/api/tenants', tenant_routes_1.default);
// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.listen(PORT, () => {
    console.log(`Harmony API is running on http://localhost:${PORT}`);
});
