import type { Request, Response } from 'express';
import { asyncHandler } from 'ds-express-errors';

export const createProfile = asyncHandler(async (_req: Request, res: Response) => {
    /* #swagger.requestBody = { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Clinic' } } } } */
    // #swagger.tags = ['Profile']
    res.json({ success: true });
});
export const getProfile = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Profile']
    res.json({});
});
export const updateProfile = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Profile']
    res.json({ success: true });
});
export const updateProfileImage = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Profile']
    res.json({ success: true });
});
