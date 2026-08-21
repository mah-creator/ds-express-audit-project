import type { Request, Response } from 'express';
import { asyncHandler } from 'ds-express-errors';
import { prisma } from '../index';

export const getAppointments = asyncHandler(async (_req: Request, res: Response) => {
    const appointments = await prisma.appointment.findMany({
        include: { doctor: true, patient: true, timeSlot: true },
    });
    res.json(appointments);
});

export const createAppointment = asyncHandler(async (req: Request, res: Response) => {
    const { doctorId, patientId, timeSlotId } = req.body;
    const appointment = await prisma.appointment.create({
        data: {
            doctorId,
            patientId,
            timeSlotId,
            status: 'Upcoming',
        },
    });
    res.status(201).json(appointment);
});
