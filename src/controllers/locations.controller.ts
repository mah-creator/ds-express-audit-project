import type { Request, Response } from 'express';
import { asyncHandler } from 'ds-express-errors';

export const getLocations = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Patient Locations']
    res.json([]);
});
export const addLocation = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Patient Locations']
    res.json({ success: true });
});
export const updateLocation = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Patient Locations']
    res.json({ success: true });
});
export const deleteLocation = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Patient Locations']
    res.json({ success: true });
});
export const favorLocation = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Patient Locations']
    res.json({ success: true });
});
