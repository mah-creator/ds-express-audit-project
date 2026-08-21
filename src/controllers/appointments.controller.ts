import type { Request, Response } from 'express';
import { asyncHandler } from 'ds-express-errors';

export const createAppointment = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Appointments']
    res.json({ success: true });
});
export const rescheduleAppointment = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Appointments']
    res.json({ success: true });
});
export const getDoctorAppointments = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Appointments']
    res.json([]);
});
export const getPatientAppointments = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Appointments']
    res.json([]);
});
export const cancelAppointment = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Appointments']
    res.json({ success: true });
});
export const completeAppointment = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Appointments']
    res.json({ success: true });
});
