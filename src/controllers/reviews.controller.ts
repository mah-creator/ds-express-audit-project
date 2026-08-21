import type { Request, Response } from 'express';
import { asyncHandler } from 'ds-express-errors';

export const addReview = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Reviews']
    res.json({ success: true });
});
export const getDoctorReviews = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Reviews']
    res.json([]);
});
