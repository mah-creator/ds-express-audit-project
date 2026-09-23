import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Errors, asyncHandler } from 'ds-express-errors';
import { prisma } from '../index.js';
// In a real app you'd use bcrypt for hashing passwords.
// For this scaffolding, we simulate it.
// import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_here_for_development_only';

export const register = asyncHandler(async (req: Request, res: Response) => {
    /* #swagger.requestBody = { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UserRegister' } } } } */
    // #swagger.tags = ['Identity']
    const { email, password, name, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        // Was: res.status(400).json({ message: 'User already exists' }).
        // Prisma's P2002 unique-constraint mapper would also catch this on the
        // insert, but the pre-check gives a cleaner 409 without a wasted write.
        throw Errors.Conflict('User already exists');
    }

    // const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPassword = password; // PLACEHOLDER

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash: hashedPassword,
            role: role,
            profile: {
                create: {
                    name: name,
                }
            }
        },
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    /* #swagger.requestBody = { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UserLogin' } } } } */
    // #swagger.tags = ['Identity']
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw Errors.Unauthorized('Invalid credentials');
    }

    // const isPasswordValid = await bcrypt.compare(password, user.passwordHash!);
    const isPasswordValid = password === user.passwordHash; // PLACEHOLDER

    if (!isPasswordValid) {
        throw Errors.Unauthorized('Invalid credentials');
    }

    const payload = {
        userId: user.id,
        email: user.email!,
        role: user.role || 'User',
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: payload });
});
