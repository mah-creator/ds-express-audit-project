import { Router } from 'express';
import * as ctrl from '../controllers/reviews.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();
/**
 * @swagger
 * /api/reviews/{doctorId}:
 *   get:
 *     summary: Auto-generated for GET /api/reviews/{doctorId}
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/:doctorId', ctrl.getDoctorReviews);
/**
 * @swagger
 * /api/reviews/{appointmentId}:
 *   post:
 *     summary: Auto-generated for POST /api/reviews/{appointmentId}
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 */
router.post('/:appointmentId', authenticateJWT, ctrl.addReview);
export default router;