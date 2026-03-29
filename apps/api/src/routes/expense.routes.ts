import { Router } from 'express';
import { tenantResolver } from '../middleware/tenant';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/audit';
import { UserRole } from '@prisma/client';
import {
    getExpenses,
    getExpenseById,
    createExpense,
    addExpenseItem,
    removeExpenseItem,
    submitExpense,
    approveExpense,
    rejectExpense,
    reimburseExpense,
    deleteExpense,
} from '../controllers/expense.controller';

const router = Router();

router.use(tenantResolver, authenticateToken);

// List & detail (EMPLOYEE sees only own via controller)
router.get('/', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), getExpenses);
router.get('/:id', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), getExpenseById);

// Create & manage items
router.post('/', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), auditLog({ action: 'CREATE_EXPENSE', resource: 'ExpenseReport' }), createExpense);
router.post('/:id/items', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), addExpenseItem);
router.delete('/:id/items/:itemId', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), removeExpenseItem);

// Workflow
router.patch('/:id/submit', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), auditLog({ action: 'SUBMIT_EXPENSE', resource: 'ExpenseReport' }), submitExpense);
router.patch('/:id/approve', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'APPROVE_EXPENSE', resource: 'ExpenseReport' }), approveExpense);
router.patch('/:id/reject', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'REJECT_EXPENSE', resource: 'ExpenseReport' }), rejectExpense);
router.patch('/:id/reimburse', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'REIMBURSE_EXPENSE', resource: 'ExpenseReport' }), reimburseExpense);

// Delete (DRAFT only)
router.delete('/:id', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), deleteExpense);

export default router;
