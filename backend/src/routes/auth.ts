import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { authenticate, type AuthRequest } from '../middlewares/authMiddleware.js';
import { validateEmail, validatePassword } from '../utils/validation.js';
import { getJWTSecret, JWT_EXPIRE_TIME } from '../utils/jwt.js';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Password must be between 6 and 255 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is not activated' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const jwtSecret = getJWTSecret();
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      jwtSecret,
      { expiresIn: JWT_EXPIRE_TIME }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login. Please try again.' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, department: true, phone: true, batch: true, address: true, rollNumber: true }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'An error occurred while fetching profile' });
  }
});

router.put('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, address, batch, rollNumber } = req.body;
    
    // Basic validation
    if (name !== undefined && (!name || name.length > 255)) {
      return res.status(400).json({ message: 'Name must be between 1 and 255 characters' });
    }
    if (phone !== undefined && phone.length > 20) {
      return res.status(400).json({ message: 'Phone number must not exceed 20 characters' });
    }
    if (address !== undefined && address.length > 500) {
      return res.status(400).json({ message: 'Address must not exceed 500 characters' });
    }
    if (batch !== undefined && batch.length > 50) {
      return res.status(400).json({ message: 'Batch must not exceed 50 characters' });
    }
    if (rollNumber !== undefined && rollNumber.length > 50) {
      return res.status(400).json({ message: 'Roll number must not exceed 50 characters' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(batch !== undefined && { batch }),
        ...(rollNumber !== undefined && { rollNumber })
      },
      select: { id: true, email: true, name: true, role: true, department: true, phone: true, batch: true, address: true, rollNumber: true }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'An error occurred while updating profile' });
  }
});

export default router;
