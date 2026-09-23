import { Router } from 'express';
import { getAppointments, createAppointment } from '../controllers/appointment.controller';
import { validate } from '../middleware/validate.middleware';
import { createAppointmentSchema } from '../schemas/appointment.schema';
import { authenticateJWT, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getAppointments);
router.post('/', authenticateJWT, authorizeRole(['Patient', 'ClinicAdmin']), validate(createAppointmentSchema), createAppointment);

export default router;
