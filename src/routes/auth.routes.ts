import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';
import { authenticateJWT, authorizeRole } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/identity/registerPatient:
 *   post:
 *     summary: Register a new patient
 *     tags: [Identity]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               name:
 *                 type: string
 *                 example: John Doe
 *               role:
 *                 type: string
 *                 example: Patient
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or User already exists
 */
router.post('/register', validate(registerSchema), register);
/**
 * @swagger
 * /api/identity/registerPatient:
 *   post:
 *     summary: Auto-generated for POST /api/identity/registerPatient
 *     tags: [Identity]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.post('/registerPatient', validate(registerSchema), register);
/**
 * @swagger
 * /api/identity/login:
 *   post:
 *     summary: Auto-generated for POST /api/identity/login
 *     tags: [Identity]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.post('/login', validate(loginSchema), login);

// Example protected route matching .NET's [Authorize(Roles = "Admin")]
/**
 * @swagger
 * /api/identity/admin-only:
 *   get:
 *     summary: Auto-generated for GET /api/identity/admin-only
 *     tags: [Identity]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/admin-only', authenticateJWT, authorizeRole(['ClinicAdmin']), (req, res) => {
  res.json({ message: 'Welcome Admin', user: req.user });
});

export default router;
