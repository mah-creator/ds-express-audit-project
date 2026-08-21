import type { Request, Response } from 'express';
import { asyncHandler } from 'ds-express-errors';

export const addFavoriteClinic = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Favorites']
    res.json({ success: true });
});
export const getFavoriteClinics = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Favorites']
    res.json([]);
});
export const removeFavoriteClinic = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Favorites']
    res.json({ success: true });
});
export const addFavoriteDoctor = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Favorites']
    res.json({ success: true });
});
export const getFavoriteDoctors = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Favorites']
    res.json([]);
});
export const removeFavoriteDoctor = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Favorites']
    res.json({ success: true });
});
