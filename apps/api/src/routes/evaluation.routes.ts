import { Router } from 'express';
import { tenantResolver } from '../middleware/tenant';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/audit';
import { UserRole } from '@prisma/client';
import { EvaluationController } from '../controllers/evaluation.controller';

const router = Router();

router.use(tenantResolver, authenticateToken);

// Campaigns
router.get('/campaigns', requireRole([UserRole.ADMIN, UserRole.HR]), EvaluationController.getCampaigns);
router.get('/campaigns/:id', requireRole([UserRole.ADMIN, UserRole.HR]), EvaluationController.getCampaignById);
router.get('/campaigns/:id/stats', requireRole([UserRole.ADMIN, UserRole.HR]), EvaluationController.getCampaignStats);
router.post('/campaigns', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'CREATE_EVAL_CAMPAIGN', resource: 'EvaluationCampaign' }), EvaluationController.createCampaign);
router.put('/campaigns/:id', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'UPDATE_EVAL_CAMPAIGN', resource: 'EvaluationCampaign' }), EvaluationController.updateCampaign);
router.post('/campaigns/:id/launch', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'LAUNCH_EVAL_CAMPAIGN', resource: 'EvaluationCampaign' }), EvaluationController.launchCampaign);
router.post('/campaigns/:id/close', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'CLOSE_EVAL_CAMPAIGN', resource: 'EvaluationCampaign' }), EvaluationController.closeCampaign);
router.delete('/campaigns/:id', requireRole([UserRole.ADMIN]), auditLog({ action: 'DELETE_EVAL_CAMPAIGN', resource: 'EvaluationCampaign' }), EvaluationController.deleteCampaign);

// Evaluations
router.get('/', requireRole([UserRole.ADMIN, UserRole.HR]), EvaluationController.getEvaluations);
router.get('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), EvaluationController.getEvaluationById);
router.put('/:id/submit', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'SUBMIT_EVALUATION', resource: 'Evaluation' }), EvaluationController.submitEvaluation);

export default router;
