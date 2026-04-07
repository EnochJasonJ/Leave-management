import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/authMiddleware.js';
import prisma from '../lib/prisma.js';
import {
  validateAssignmentInput,
  validateDate,
  sanitizeString,
} from '../utils/validation.js';

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
          },
          creator: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { dueDate: 'asc' },
      });
    } else {
      assignments = await prisma.assignment.findMany({
        where: { creatorId: userId },
        include: {
          submissions: true,
          creator: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { dueDate: 'asc' },
      });
    }

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'An error occurred while fetching assignments' });
  }
};

export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, dueDate } = req.body;
    const creatorId = req.user?.id;

    if (!creatorId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Input validation
    if (!title || !description || !dueDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validateAssignmentInput(title, description, dueDate)) {
      return res.status(400).json({
        message: 'Invalid input: Title must be 1-255 chars, description 1-5000 chars, and due date must be in future'
      });
    }

    const sanitizedTitle = sanitizeString(title);
    const sanitizedDescription = sanitizeString(description);
    const dueDateObj = new Date(dueDate);

    const assignment = await prisma.assignment.create({
      data: {
        title: sanitizedTitle,
        description: sanitizedDescription,
        dueDate: dueDateObj,
        creatorId,
      },
    });

    res.status(201).json({ message: 'Assignment created successfully', assignment });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'An error occurred while creating assignment' });
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

    // Validate assignment ID
    if (!assignmentId) {
      return res.status(400).json({ message: 'Assignment ID is required' });
    }
    
    const assignmentIdNum = parseInt(assignmentId);
    if (isNaN(assignmentIdNum)) {
      return res.status(400).json({ message: 'Invalid assignment ID' });
    }

    // ✅ FIX: Check if assignment exists and is still available
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentIdNum },
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Validate submission data
    if (notes && notes.length > 5000) {
      return res.status(400).json({ message: 'Notes must not exceed 5000 characters' });
    }

    const sanitizedNotes = notes ? sanitizeString(notes) : null;

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: assignmentIdNum,
          studentId: studentId
        }
      },
      update: {
        notes: sanitizedNotes,
        fileUrl,
        updatedAt: new Date()
      },
      create: {
        assignmentId: assignmentIdNum,
        studentId: studentId,
        notes: sanitizedNotes,
        fileUrl,
        status: 'SUBMITTED'
      }
    });

    res.status(200).json({ message: 'Assignment submitted successfully', submission });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ message: 'An error occurred while submitting assignment' });
  }
};
