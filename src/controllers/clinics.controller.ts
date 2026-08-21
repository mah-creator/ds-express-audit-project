import type { Request, Response } from 'express';
import { Errors, asyncHandler } from 'ds-express-errors';
import { prisma } from '../index';

export const getClinics = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Clinics']
    const clinics = await prisma.clinic.findMany();
    res.json(clinics);
});

export const getClinicById = asyncHandler(async (req: Request, res: Response) => {
    // #swagger.tags = ['Clinics']
    const clinic = await prisma.clinic.findUnique({ where: { id: req.params.id } });
    // findUnique returns null (not a Prisma error) when the row is missing, so
    // the built-in Prisma mapper never fires. Throw explicitly to get a 404.
    if (!clinic) throw Errors.NotFound('Clinic not found');
    res.json(clinic);
});

export const getNearbyClinics = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Clinics']
    res.json([]);
});

export const getClinicDoctors = asyncHandler(async (req: Request, res: Response) => {
    // #swagger.tags = ['Clinics']
    const doctors = await prisma.doctor.findMany({ where: { clinicId: req.params.clinicId } });
    res.json(doctors);
});
