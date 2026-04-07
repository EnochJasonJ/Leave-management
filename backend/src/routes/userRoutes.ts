import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users (Principal only)
router.get('/', authorize(['PRINCIPAL']), UserController.getAllUsers);

// Get users by department (Principal and HODs)
router.get('/department/:departmentId', authorize(['PRINCIPAL', 'HOD']), UserController.getUsersByDepartment);

// Get departments (for dropdowns)
router.get('/departments', UserController.getDepartments);

// Add new user (Principal and HODs)
router.post('/', authorize(['PRINCIPAL', 'HOD']), UserController.addUser);

// Update user (Principal and HODs)
router.put('/:id', authorize(['PRINCIPAL', 'HOD']), UserController.updateUser);

// Delete user (Principal only)
router.delete('/:id', authorize(['PRINCIPAL']), UserController.deleteUser);

export default router;