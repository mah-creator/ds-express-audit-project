import { Router } from 'express';
import * as ctrl from '../controllers/misc.controller';

const router = Router();
/**
 * @swagger
 * /api/banners:
 *   get:
 *     summary: Auto-generated for GET /api/banners
 *     tags: [Miscellaneous]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/banners', ctrl.getBanners);
/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Auto-generated for GET /api/categories
 *     tags: [Miscellaneous]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/categories', ctrl.getCategories);
/**
 * @swagger
 * /api/termsAndConditions:
 *   get:
 *     summary: Auto-generated for GET /api/termsAndConditions
 *     tags: [Miscellaneous]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/termsAndConditions', ctrl.getTerms);
export default router;