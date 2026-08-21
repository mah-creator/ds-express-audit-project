import type { Request, Response } from 'express';
import { asyncHandler } from 'ds-express-errors';

export const getBanners = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Miscellaneous']
    res.json([]);
});
export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Miscellaneous']
    res.json([]);
});
export const getTerms = asyncHandler(async (_req: Request, res: Response) => {
    // #swagger.tags = ['Miscellaneous']
    res.json({ text: 'Terms and conditions' });
});
