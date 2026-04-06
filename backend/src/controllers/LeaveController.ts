import type { Response } from 'express';
import { PrismaClient, LeaveStatus } from '@prisma/client';
import type { AuthRequest } from '../middlewares/authMiddleware.js';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL!,
    },
  },
});

export const createLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        userId,
        status: LeaveStatus.SUBMITTED,
      },
    });

    res.status(201).json({ message: 'Leave request submitted successfully', leaveRequest });
  } catch (error) {
    res.status(500).json({ message: 'Error creating leave request', error: String(error) });
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
    res.status(500).json({ message: 'Error fetching leave history', error: String(error) });
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

    // Calculate dynamic leave breakdowns
    const casualUsed = await prisma.leaveRequest.count({ where: { userId, type: 'Casual Leave', status: LeaveStatus.APPROVED } });
    const sickUsed = await prisma.leaveRequest.count({ where: { userId, type: 'Sick Leave', status: LeaveStatus.APPROVED } });
    const specialUsed = await prisma.leaveRequest.count({ where: { userId, type: 'Special Leave', status: LeaveStatus.APPROVED } });

    // --- Attendance & Internal Marks Calculation ---
    const totalWorkingDays = 120; // Approximate working days in a semester
    const approvedLeaveDays = casualUsed + sickUsed + specialUsed;
    const daysPresent = totalWorkingDays - approvedLeaveDays;
    const attendancePercent = Math.min(100, Math.round((daysPresent / totalWorkingDays) * 100));

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
        casual: { total: 15, used: casualUsed },
        sick: { total: 10, used: sickUsed },
        special: { total: 5, used: specialUsed },
      },
      attendance: {
        totalWorkingDays,
        daysPresent,
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
    res.status(500).json({ message: 'Error fetching stats', error: String(error) });
  }
};

export const getAllLeaveRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        userId: { not: userId },
      },
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all leave requests', error: String(error) });
  }
};

export const updateLeaveStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const leaveRequest = await prisma.leaveRequest.update({
      where: { id: parseInt(id!) },
      data: { status },
    });

    res.json({ message: `Leave request ${status.toLowerCase()} successfully`, leaveRequest });
  } catch (error) {
    res.status(500).json({ message: 'Error updating leave status', error: String(error) });
  }
};
