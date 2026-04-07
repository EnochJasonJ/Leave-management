import { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';
import { validateEmail, validatePassword } from '../utils/validation.js';
import { Role } from '@prisma/client';

export class UserController {
  // Get all users (Principal only)
  static async getAllUsers(req: AuthRequest, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: { select: { id: true, name: true } },
          isActive: true,
          phone: true,
          batch: true,
          rollNumber: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(users);
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  }

  // Get users by department (Principal and HODs)
  static async getUsersByDepartment(req: AuthRequest, res: Response) {
    try {
      const { departmentId } = req.params;
      const user = req.user!;

      if (!departmentId) {
        return res.status(400).json({ message: 'Department ID is required' });
      }

      // HODs can only see their own department
      if (user.role === 'HOD' && user.departmentId !== parseInt(departmentId)) {
        return res.status(403).json({ message: 'Access denied: Can only view your department' });
      }

      const users = await prisma.user.findMany({
        where: { departmentId: parseInt(departmentId) },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: { select: { id: true, name: true } },
          isActive: true,
          phone: true,
          batch: true,
          rollNumber: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(users);
    } catch (error) {
      console.error('Get users by department error:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  }

  // Add new user (Principal can add HODs and students, HODs can add students)
  static async addUser(req: AuthRequest, res: Response) {
    try {
      const { email, name, role, departmentId, phone, batch, rollNumber, password } = req.body;
      const creator = req.user!;

      // Validate input
      if (!email || !name || !role || !password) {
        return res.status(400).json({ message: 'Email, name, role, and password are required' });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      if (!validatePassword(password)) {
        return res.status(400).json({ message: 'Password must be between 6 and 255 characters' });
      }

      if (name.length < 2 || name.length > 255) {
        return res.status(400).json({ message: 'Name must be between 2 and 255 characters' });
      }

      // For students, batch and rollNumber are required
      if (role === 'STUDENT') {
        if (!batch || !rollNumber) {
          return res.status(400).json({ message: 'Batch and roll number are required for students' });
        }
      }

      // Validate role permissions
      const allowedRoles: Role[] = [Role.STUDENT];
      if (creator.role === 'PRINCIPAL') {
        allowedRoles.push(Role.HOD, Role.STAFF);
      }

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ message: 'You do not have permission to create users with this role' });
      }

      // Validate department assignment
      if (role !== 'PRINCIPAL') {
        if (!departmentId) {
          return res.status(400).json({ message: 'Department is required for this role' });
        }

        const department = await prisma.department.findUnique({
          where: { id: parseInt(departmentId) }
        });

        if (!department) {
          return res.status(400).json({ message: 'Invalid department' });
        }

        // HODs can only add users to their department
        if (creator.role === 'HOD' && creator.departmentId !== parseInt(departmentId)) {
          return res.status(403).json({ message: 'You can only add users to your department' });
        }
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Generate password hash
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          role,
          departmentId: role !== 'PRINCIPAL' ? parseInt(departmentId) : null,
          passwordHash,
          isActive: true, // Activate since password is provided
          phone: phone || null,
          batch: batch || null,
          rollNumber: rollNumber || null
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: { select: { id: true, name: true } },
          isActive: true,
          phone: true,
          batch: true,
          rollNumber: true,
          createdAt: true
        }
      });

      res.status(201).json({
        message: 'User created successfully',
        user: newUser
      });
    } catch (error) {
      console.error('Add user error:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  }

  // Update user (Principal can update anyone, HODs can update students in their department)
  static async updateUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, departmentId, phone, batch, rollNumber, isActive } = req.body;
      const updater = req.user!;

      if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const userId = parseInt(id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      // Get the user being updated
      const userToUpdate = await prisma.user.findUnique({
        where: { id: userId },
        include: { department: true }
      });

      if (!userToUpdate) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check permissions
      if (updater.role === 'HOD') {
        // HODs can only update students in their department
        if (userToUpdate.role !== 'STUDENT' || userToUpdate.departmentId !== updater.departmentId) {
          return res.status(403).json({ message: 'You can only update students in your department' });
        }
      } else if (updater.role !== 'PRINCIPAL') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Validate department change
      if (departmentId !== undefined) {
        if (userToUpdate.role === 'PRINCIPAL') {
          return res.status(400).json({ message: 'Cannot change department for Principal' });
        }

        const department = await prisma.department.findUnique({
          where: { id: parseInt(departmentId) }
        });

        if (!department) {
          return res.status(400).json({ message: 'Invalid department' });
        }

        // HODs can only move users within their department
        if (updater.role === 'HOD' && parseInt(departmentId) !== updater.departmentId) {
          return res.status(403).json({ message: 'You can only assign users to your department' });
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name !== undefined && { name }),
          ...(departmentId !== undefined && { departmentId: parseInt(departmentId) }),
          ...(phone !== undefined && { phone }),
          ...(batch !== undefined && { batch }),
          ...(rollNumber !== undefined && { rollNumber }),
          ...(isActive !== undefined && { isActive })
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: { select: { id: true, name: true } },
          isActive: true,
          phone: true,
          batch: true,
          rollNumber: true,
          updatedAt: true
        }
      });

      res.json({
        message: 'User updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  }

  // Delete user (Principal only, with restrictions)
  static async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const deleter = req.user!;

      if (deleter.role !== 'PRINCIPAL') {
        return res.status(403).json({ message: 'Only Principal can delete users' });
      }

      if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const userId = parseInt(id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      // Prevent deleting the principal
      if (userId === deleter.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Delete user
      await prisma.user.delete({
        where: { id: userId }
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  }

  // Get departments (for dropdowns)
  static async getDepartments(req: AuthRequest, res: Response) {
    try {
      const departments = await prisma.department.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      });

      res.json(departments);
    } catch (error) {
      console.error('Get departments error:', error);
      res.status(500).json({ message: 'Failed to fetch departments' });
    }
  }
}