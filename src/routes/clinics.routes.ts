import { Router } from 'express';
import * as ctrl from '../controllers/clinics.controller';

const router = Router();
/**
 * @swagger
 * /api/clinics:
 *   get:
 *     summary: Auto-generated for GET /api/clinics
 *     tags: [Clinics]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/', ctrl.getClinics);
/**
 * @swagger
 * /api/clinics/nearby:
 *   get:
 *     summary: Auto-generated for GET /api/clinics/nearby
 *     tags: [Clinics]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/nearby', ctrl.getNearbyClinics);
/**
 * @swagger
 * /api/clinics/{id}:
 *   get:
 *     summary: Auto-generated for GET /api/clinics/{id}
 *     tags: [Clinics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/:id', ctrl.getClinicById);
/**
 * @swagger
 * /api/clinics/{clinicId}/doctors:
 *   get:
 *     summary: Auto-generated for GET /api/clinics/{clinicId}/doctors
 *     tags: [Clinics]
 *     parameters:
 *       - in: path
 *         name: clinicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/:clinicId/doctors', ctrl.getClinicDoctors);
export default router;