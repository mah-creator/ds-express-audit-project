import { Router } from 'express';
import * as ctrl from '../controllers/appointments.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticateJWT);
/**
 * @swagger
 * /api/appointments/{doctorId}:
 *   post:
 *     summary: Auto-generated for POST /api/appointments/{doctorId}
 *     tags: [Appointments]
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
router.post('/:doctorId', ctrl.createAppointment);
/**
 * @swagger
 * /api/appointments/reschedule/{appointmentId}:
 *   patch:
 *     summary: Auto-generated for PATCH /api/appointments/reschedule/{appointmentId}
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 */
router.patch('/reschedule/:appointmentId', ctrl.rescheduleAppointment);
/**
 * @swagger
 * /api/appointments/doctor:
 *   get:
 *     summary: Auto-generated for GET /api/appointments/doctor
 *     tags: [Appointments]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/doctor', ctrl.getDoctorAppointments);
/**
 * @swagger
 * /api/appointments/patient:
 *   get:
 *     summary: Auto-generated for GET /api/appointments/patient
 *     tags: [Appointments]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/patient', ctrl.getPatientAppointments);
/**
 * @swagger
 * /api/appointments/cancel/{appointmentId}:
 *   delete:
 *     summary: Auto-generated for DELETE /api/appointments/cancel/{appointmentId}
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 */
router.delete('/cancel/:appointmentId', ctrl.cancelAppointment);
/**
 * @swagger
 * /api/appointments/complete/{appointmentId}:
 *   post:
 *     summary: Auto-generated for POST /api/appointments/complete/{appointmentId}
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 */
router.post('/complete/:appointmentId', ctrl.completeAppointment);
export default router;