import { Router } from 'express';
import * as ctrl from '../controllers/profile.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticateJWT);

/**
 * @swagger
 * /api/profile/clinic:
 *   post:
 *     summary: Auto-generated for POST /api/profile/clinic
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.post('/clinic', ctrl.createProfile);
/**
 * @swagger
 * /api/profile/clinic:
 *   get:
 *     summary: Auto-generated for GET /api/profile/clinic
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/clinic', ctrl.getProfile);
/**
 * @swagger
 * /api/profile/clinic:
 *   patch:
 *     summary: Auto-generated for PATCH /api/profile/clinic
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.patch('/clinic', ctrl.updateProfile);
/**
 * @swagger
 * /api/profile/clinic/profileimage:
 *   patch:
 *     summary: Auto-generated for PATCH /api/profile/clinic/profileimage
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.patch('/clinic/profileimage', ctrl.updateProfileImage);

/**
 * @swagger
 * /api/profile/doctor:
 *   post:
 *     summary: Auto-generated for POST /api/profile/doctor
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.post('/doctor', ctrl.createProfile);
/**
 * @swagger
 * /api/profile/doctor:
 *   get:
 *     summary: Auto-generated for GET /api/profile/doctor
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/doctor', ctrl.getProfile);
/**
 * @swagger
 * /api/profile/doctor:
 *   patch:
 *     summary: Auto-generated for PATCH /api/profile/doctor
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.patch('/doctor', ctrl.updateProfile);

/**
 * @swagger
 * /api/profile/patient:
 *   post:
 *     summary: Auto-generated for POST /api/profile/patient
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.post('/patient', ctrl.createProfile);
/**
 * @swagger
 * /api/profile/patient:
 *   get:
 *     summary: Auto-generated for GET /api/profile/patient
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/patient', ctrl.getProfile);
/**
 * @swagger
 * /api/profile/patient:
 *   patch:
 *     summary: Auto-generated for PATCH /api/profile/patient
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.patch('/patient', ctrl.updateProfile);

export default router;