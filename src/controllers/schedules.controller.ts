import type { Request, Response } from 'express';
import { asyncHandler } from 'ds-express-errors';

export const getDoctorSchedule = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Schedules']
    res.json([]);
});
export const addSchedule = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Schedules']
    res.json({ success: true });
});
export const deleteSlot = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Schedules']
    res.json({ success: true });
});
export const batchCreate = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Schedules']
    res.json({ success: true });
});
