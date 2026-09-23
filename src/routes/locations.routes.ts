import { Router } from 'express';
import * as ctrl from '../controllers/locations.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticateJWT);
/**
 * @swagger
 * /api/patientlocations:
 *   get:
 *     summary: Auto-generated for GET /api/patientlocations
 *     tags: [Patient Locations]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get('/', ctrl.getLocations);
/**
 * @swagger
 * /api/patientlocations:
 *   post:
 *     summary: Auto-generated for POST /api/patientlocations
 *     tags: [Patient Locations]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.post('/', ctrl.addLocation);
/**
 * @swagger
 * /api/patientlocations/{locationId}:
 *   patch:
 *     summary: Auto-generated for PATCH /api/patientlocations/{locationId}
 *     tags: [Patient Locations]
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 */
router.patch('/:locationId', ctrl.updateLocation);
/**
 * @swagger
 * /api/patientlocations/{locationId}:
 *   delete:
 *     summary: Auto-generated for DELETE /api/patientlocations/{locationId}
 *     tags: [Patient Locations]
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 */
router.delete('/:locationId', ctrl.deleteLocation);
/**
 * @swagger
 * /api/patientlocations/favor/{locationId}:
 *   post:
 *     summary: Auto-generated for POST /api/patientlocations/favor/{locationId}
 *     tags: [Patient Locations]
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 */
router.post('/favor/:locationId', ctrl.favorLocation);
export default router;