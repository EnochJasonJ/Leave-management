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

// ✅ FIXED: Only students can create leave requests
router.post('/', authenticate, authorize(['STUDENT']), createLeaveRequest);

// Everyone can view their own history and stats
router.use(authenticate);
router.get('/history', getMyLeaveHistory);
router.get('/stats', getDashboardStats);

// Staff/HOD/Principal only routes
router.get('/all', authorize(['STAFF', 'HOD', 'PRINCIPAL']), getAllLeaveRequests);
router.put('/:id/status', authorize(['STAFF', 'HOD', 'PRINCIPAL']), updateLeaveStatus);

export default router;
