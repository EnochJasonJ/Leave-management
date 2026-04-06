import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthRequest } from '../middlewares/authMiddleware.js';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL!,
    },
  },
});

export const getMyAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let assignments;
    if (role === 'STUDENT') {
      assignments = await prisma.assignment.findMany({
        include: {
          submissions: {
            where: { studentId: userId }
          }
        },
        orderBy: { dueDate: 'asc' },
      });
    } else {
      assignments = await prisma.assignment.findMany({
        where: { creatorId: userId },
        include: {
          submissions: true
        },
        orderBy: { dueDate: 'asc' },
      });
    }

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignments', error: String(error) });
  }
};

export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, dueDate } = req.body;
    const creatorId = req.user?.id;

    if (!creatorId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        creatorId,
      },
    });

    res.status(201).json({ message: 'Assignment created successfully', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Error creating assignment', error: String(error) });
  }
};

export const submitAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { notes, fileUrl } = req.body;
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: parseInt(assignmentId),
          studentId: studentId
        }
      },
      update: {
        notes,
        fileUrl,
        updatedAt: new Date()
      },
      create: {
        assignmentId: parseInt(assignmentId),
        studentId: studentId,
        notes,
        fileUrl,
        status: 'SUBMITTED'
      }
    });

    res.status(200).json({ message: 'Assignment submitted successfully', submission });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting assignment', error: String(error) });
  }
};
