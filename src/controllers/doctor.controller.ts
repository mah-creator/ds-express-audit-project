import type { Request, Response } from 'express';
import { asyncHandler } from 'ds-express-errors';
import { prisma } from '../index';

export const getDoctors = asyncHandler(async (_req: Request, res: Response) => {
    const doctors = await prisma.doctor.findMany({
        include: { user: true, clinic: true, category: true },
    });
    res.json(doctors);
});

export const createDoctor = asyncHandler(async (req: Request, res: Response) => {
    const { userId, clinicId, categoryId, bio, experienceYears } = req.body;
    const doctor = await prisma.doctor.create({
        data: {
            userId,
            clinicId,
            categoryId,
            bio,
            experienceYears,
        },
    });
    res.status(201).json(doctor);
});
