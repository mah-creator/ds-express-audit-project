import { Router } from 'express';
import * as ctrl from '../controllers/doctors.controller';

const router = Router();
/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Auto-generated for GET /api/doctors
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/', ctrl.getDoctors);
/**
 * @swagger
 * /api/doctors/clinic/{clinicId}:
 *   get:
 *     summary: Auto-generated for GET /api/doctors/clinic/{clinicId}
 *     tags: [Doctors]
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
router.get('/clinic/:clinicId', ctrl.getDoctorsByClinic);
/**
 * @swagger
 * /api/doctors/{categoryId}:
 *   get:
 *     summary: Auto-generated for GET /api/doctors/{categoryId}
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/:categoryId', ctrl.getDoctorsByCategory);
/**
 * @swagger
 * /api/doctors/one/{id}:
 *   get:
 *     summary: Auto-generated for GET /api/doctors/one/{id}
 *     tags: [Doctors]
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
router.get('/one/:id', ctrl.getDoctorById);
export default router;