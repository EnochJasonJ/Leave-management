import { Router } from 'express';
import { 
  createLeaveRequest, 
  getMyLeaveHistory, 
  getDashboardStats, 
  getAllLeaveRequests, 
  updateLeaveStatus 
} from '../controllers/LeaveController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();

// Student/Staff common routes
router.use(authenticate);

router.post('/', createLeaveRequest);
router.get('/history', getMyLeaveHistory);
router.get('/stats', getDashboardStats);

// Staff/HOD/Principal only routes
router.get('/all', authorize(['STAFF', 'HOD', 'PRINCIPAL']), getAllLeaveRequests);
router.put('/:id/status', authorize(['STAFF', 'HOD', 'PRINCIPAL']), updateLeaveStatus);

export default router;
