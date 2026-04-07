import type { Response } from 'express';
import { LeaveStatus } from '@prisma/client';
import type { AuthRequest } from '../middlewares/authMiddleware.js';
import prisma from '../lib/prisma.js';
import {
  validateLeaveType,
  validateDate,
  validateDateRange,
  validateReason,
  sanitizeReason,
} from '../utils/validation.js';

export const createLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Input validation
    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validateLeaveType(type)) {
      return res.status(400).json({ message: 'Invalid leave type' });
    }

    if (!validateDate(startDate) || !validateDate(endDate)) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!validateDateRange(start, end)) {
      return res.status(400).json({ message: 'Start date must be before end date and cannot be in the past' });
    }

    if (!validateReason(reason)) {
      return res.status(400).json({ message: 'Reason must be provided and less than 2000 characters' });
    }

    const sanitizedReason = sanitizeReason(reason);

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        type,
        startDate: start,
        endDate: end,
        reason: sanitizedReason,
        userId,
        status: LeaveStatus.SUBMITTED,
      },
    });

    res.status(201).json({ message: 'Leave request submitted successfully', leaveRequest });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ message: 'An error occurred while creating leave request' });
  }
};

export const getMyLeaveHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(leaves);
  } catch (error) {
    console.error('Error fetching leave history:', error);
    res.status(500).json({ message: 'An error occurred while fetching leave history' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const totalRequests = await prisma.leaveRequest.count({ where: { userId } });
    const approved = await prisma.leaveRequest.count({ where: { userId, status: LeaveStatus.APPROVED } });
    const pending = await prisma.leaveRequest.count({ where: { userId, status: LeaveStatus.SUBMITTED } });
    const rejected = await prisma.leaveRequest.count({ where: { userId, status: LeaveStatus.REJECTED } });

    // Fetch all approved leaves to calculate actual days
    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: { userId, status: LeaveStatus.APPROVED },
      select: { startDate: true, endDate: true, type: true },
    });

    // Calculate actual leave days and breakdown
    let casualDays = 0,
      sickDays = 0,
      specialDays = 0;

    approvedLeaves.forEach((leave) => {
      const dayCount = Math.ceil((leave.endDate.getTime() - leave.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (leave.type === 'Casual Leave') casualDays += dayCount;
      else if (leave.type === 'Sick Leave') sickDays += dayCount;
      else if (leave.type === 'Special Leave') specialDays += dayCount;
    });

    // Attendance calculation
    const totalWorkingDays = 120;
    const approvedLeaveDays = casualDays + sickDays + specialDays;
    const daysPresent = totalWorkingDays - approvedLeaveDays;
    const attendancePercent = Math.min(100, Math.round((Math.max(0, daysPresent) / totalWorkingDays) * 100));

    // Attendance mark out of 5
    let attendanceMark = 0;
    if (attendancePercent >= 95) attendanceMark = 5;
    else if (attendancePercent >= 90) attendanceMark = 4;
    else if (attendancePercent >= 85) attendanceMark = 3;
    else if (attendancePercent >= 80) attendanceMark = 2;
    else if (attendancePercent >= 75) attendanceMark = 1;

    // Assignment mark out of 15 (based on submission rate)
    const totalAssignments = await prisma.assignment.count();
    const submittedAssignments = await prisma.assignmentSubmission.count({ where: { studentId: userId } });
    const submissionRate = totalAssignments > 0 ? submittedAssignments / totalAssignments : 0;
    const assignmentMark = Math.round(submissionRate * 15);

    // Internal mark out of 20
    const internalMark = attendanceMark + assignmentMark;

    res.json({
      totalRequests,
      approved,
      pending,
      rejected,
      breakdown: {
        casual: { total: 15, used: casualDays },
        sick: { total: 10, used: sickDays },
        special: { total: 5, used: specialDays },
      },
      attendance: {
        totalWorkingDays,
        daysPresent: Math.max(0, daysPresent),
        approvedLeaveDays,
        attendancePercent,
        attendanceMark,
      },
      internals: {
        attendanceMark,
        assignmentMark,
        totalAssignments,
        submittedAssignments,
        internalMark,
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'An error occurred while fetching dashboard stats' });
  }
};

export const getAllLeaveRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get user's department
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true, role: true },
    });

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ FIX: Only show leaves from own department (not all users)
    let whereClause: any = {};

    if (userRole === 'PRINCIPAL') {
      // Principal can see all leaves
      whereClause = { userId: { not: userId } };
    } else if (userRole === 'HOD' && currentUser.departmentId) {
      // HOD can only see leaves from their department
      whereClause = {
        userId: { not: userId },
        user: { departmentId: currentUser.departmentId },
      };
    } else if (userRole === 'STAFF' && currentUser.departmentId) {
      // Staff can see leaves from their department
      whereClause = {
        userId: { not: userId },
        user: { departmentId: currentUser.departmentId },
      };
    } else {
      // Students shouldn't see other leaves
      return res.status(403).json({ message: 'Forbidden: Students cannot view other leave requests' });
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: { user: { select: { name: true, email: true, role: true, department: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(leaves);
  } catch (error) {
    console.error('Error fetching all leave requests:', error);
    res.status(500).json({ message: 'An error occurred while fetching leave requests' });
  }
};

export const updateLeaveStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Validate status
    const validStatuses = ['APPROVED', 'REJECTED', 'UNDER_REVIEW'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const leaveId = parseInt(id!);
    if (isNaN(leaveId)) {
      return res.status(400).json({ message: 'Invalid leave ID' });
    }

    // Fetch the leave request
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { user: { select: { departmentId: true } } },
    });

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // ✅ FIX: Add authorization check - can only approve leaves in their department
    const approver = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true, role: true },
    });

    if (!approver) {
      return res.status(404).json({ message: 'Approver not found' });
    }

    // Check authorization
    if (approver.role === 'STAFF' || approver.role === 'HOD') {
      if (approver.departmentId !== leave.user.departmentId) {
        return res.status(403).json({ message: 'Forbidden: You can only approve leaves from your department' });
      }
    } else if (approver.role !== 'PRINCIPAL') {
      return res.status(403).json({ message: 'Forbidden: You cannot approve leave requests' });
    }

    const leaveRequest = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status },
    });

    res.json({ message: `Leave request ${status.toLowerCase()} successfully`, leaveRequest });
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({ message: 'An error occurred while updating leave status' });
  }
};
