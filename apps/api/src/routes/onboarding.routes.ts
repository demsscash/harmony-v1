import { Router } from 'express';
import { OnboardingController } from '../controllers/onboarding.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@prisma/client';

import { tenantResolver } from '../middleware/tenant';

const router = Router();
router.use(tenantResolver);
router.use(authenticateToken);

// ==========================================
// TEMPLATES (ADMIN / HR Only)
// ==========================================

router.get('/templates', requireRole([UserRole.ADMIN, UserRole.HR]), OnboardingController.getTemplates);
router.post('/templates', requireRole([UserRole.ADMIN, UserRole.HR]), OnboardingController.createTemplate);
router.put('/templates/:id', requireRole([UserRole.ADMIN, UserRole.HR]), OnboardingController.updateTemplate);
router.delete('/templates/:id', requireRole([UserRole.ADMIN, UserRole.HR]), OnboardingController.deleteTemplate);


// ==========================================
// EMPLOYEE CHECKLIST/TASKS
// ==========================================

// This nested route logic is technically at `/api/onboarding/employees/:id/...` 
// if mounted at `/api/onboarding`. We will mount this specific router at `/api/onboarding`
// and handle the employee prefix inside it. OR mount it under `/api/employees/:id/onboarding`.
// To keep things clean, let's mount this file at `/api/onboarding` and use query/body 
// But the plan says `/api/employees/:id/onboarding`.
// We will export a sub-router specifically for employee-nested routes

export const employeeOnboardingRouter = Router({ mergeParams: true });
employeeOnboardingRouter.use(tenantResolver);
employeeOnboardingRouter.use(authenticateToken);
// Route path relative to `/api/employees/:id/onboarding`

// GET tasks
employeeOnboardingRouter.get('/', OnboardingController.getEmployeeTasks);
// Apply template
employeeOnboardingRouter.post('/apply-template', requireRole([UserRole.ADMIN, UserRole.HR]), OnboardingController.applyTemplate);
// Create manual task
employeeOnboardingRouter.post('/', requireRole([UserRole.ADMIN, UserRole.HR]), OnboardingController.createManualTask);
// Update individual task (Employee can update completion)
employeeOnboardingRouter.put('/:taskId', OnboardingController.updateTask);
// Delete individual task
employeeOnboardingRouter.delete('/:taskId', requireRole([UserRole.ADMIN, UserRole.HR]), OnboardingController.deleteTask);

export default router;
