import { Router } from 'express';
import { getDoctors, createDoctor } from '../controllers/doctor.controller';
import { validate } from '../middleware/validate.middleware';
import { createDoctorSchema } from '../schemas/doctor.schema';
import { authenticateJWT, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getDoctors);
router.post('/', authenticateJWT, authorizeRole(['ClinicAdmin']), validate(createDoctorSchema), createDoctor);

export default router;
