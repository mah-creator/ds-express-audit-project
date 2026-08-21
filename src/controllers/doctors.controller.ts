import type { Request, Response } from 'express';
import { Errors, asyncHandler } from 'ds-express-errors';
import { prisma } from '../index';

export const getDoctors = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Doctors']
    const doctors = await prisma.doctor.findMany();
    res.json(doctors);
});

export const getDoctorsByClinic = asyncHandler(async (req: Request, res: Response) => {
    // #swagger.tags = ['Doctors']
    const doctors = await prisma.doctor.findMany({ where: { clinicId: req.params.clinicId } });
    res.json(doctors);
});

export const getDoctorsByCategory = asyncHandler(async (req: Request, res: Response) => {
    // #swagger.tags = ['Doctors']
    const doctors = await prisma.doctor.findMany({ where: { categoryId: req.params.categoryId } });
    res.json(doctors);
});

export const getDoctorById = asyncHandler(async (req: Request, res: Response) => {
    // #swagger.tags = ['Doctors']
    const doctor = await prisma.doctor.findUnique({ where: { id: req.params.id } });
    if (!doctor) throw Errors.NotFound('Doctor not found');
    res.json(doctor);
});
