import { Router } from 'express';
import * as ctrl from '../controllers/schedules.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();
/**
 * @swagger
 * /api/schedules/{doctorId}:
 *   get:
 *     summary: Auto-generated for GET /api/schedules/{doctorId}
 *     tags: [Schedules]
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
router.get('/:doctorId', ctrl.getDoctorSchedule);
/**
 * @swagger
 * /api/schedules/{doctorId}:
 *   post:
 *     summary: Auto-generated for POST /api/schedules/{doctorId}
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 */
router.post('/:doctorId', authenticateJWT, ctrl.addSchedule);
/**
 * @swagger
 * /api/schedules/{doctorId}/batchCreate:
 *   post:
 *     summary: Auto-generated for POST /api/schedules/{doctorId}/batchCreate
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 */
router.post('/:doctorId/batchCreate', authenticateJWT, ctrl.batchCreate);
/**
 * @swagger
 * /api/schedules/{slotId}:
 *   delete:
 *     summary: Auto-generated for DELETE /api/schedules/{slotId}
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 */
router.delete('/:slotId', authenticateJWT, ctrl.deleteSlot);
export default router;