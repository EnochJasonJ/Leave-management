import { Router } from 'express';
import { getMyAssignments, createAssignment, submitAssignment } from '../controllers/AssignmentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();

router.get('/', authenticate, getMyAssignments);
router.post('/', authenticate, authorize(['STAFF', 'HOD', 'PRINCIPAL']), createAssignment);
router.post('/:assignmentId/submit', authenticate, authorize(['STUDENT']), submitAssignment);

export default router;
