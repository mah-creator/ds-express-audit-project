import { Router } from 'express';
import * as ctrl from '../controllers/favorites.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticateJWT);
/**
 * @swagger
 * /api/favorites/clinics:
 *   post:
 *     summary: Auto-generated for POST /api/favorites/clinics
 *     tags: [Favorites]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.post('/clinics', ctrl.addFavoriteClinic);
/**
 * @swagger
 * /api/favorites/clinics:
 *   get:
 *     summary: Auto-generated for GET /api/favorites/clinics
 *     tags: [Favorites]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/clinics', ctrl.getFavoriteClinics);
/**
 * @swagger
 * /api/favorites/clinics:
 *   delete:
 *     summary: Auto-generated for DELETE /api/favorites/clinics
 *     tags: [Favorites]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.delete('/clinics', ctrl.removeFavoriteClinic);
/**
 * @swagger
 * /api/favorites/doctors:
 *   post:
 *     summary: Auto-generated for POST /api/favorites/doctors
 *     tags: [Favorites]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.post('/doctors', ctrl.addFavoriteDoctor);
/**
 * @swagger
 * /api/favorites/doctors:
 *   get:
 *     summary: Auto-generated for GET /api/favorites/doctors
 *     tags: [Favorites]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/doctors', ctrl.getFavoriteDoctors);
/**
 * @swagger
 * /api/favorites/doctors:
 *   delete:
 *     summary: Auto-generated for DELETE /api/favorites/doctors
 *     tags: [Favorites]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.delete('/doctors', ctrl.removeFavoriteDoctor);
export default router;